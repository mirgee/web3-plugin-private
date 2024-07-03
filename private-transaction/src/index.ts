import {
  AccessListEIP2930ValuesArray,
  BaseTransaction,
  bigIntToUnpaddedUint8Array,
  Capability,
  Common,
  ecrecover,
  FeeMarketEIP1559ValuesArray,
  JsonTx,
  toUint8Array,
  TxOptions,
  TxValuesArray,
  uint8ArrayToBigInt,
  unpadUint8Array
} from 'web3-eth-accounts';
import { RLP } from '@ethereumjs/rlp';
import { Base64String, PrivateTxData, PrivateTxValuesArray, Restriction } from './types';
import { MAX_INTEGER } from './constants';
import { validateNoLeadingZeroes } from 'web3-validator';
import { stringToHex } from 'web3-utils';
import { hexToBytes, bytesToUtf8 } from 'ethereum-cryptography/utils';
import { base64ToUint8Array, uint8ArrayToBase64 } from './utils';
import { keccak256 } from 'ethereum-cryptography/keccak';
import { Numbers } from 'web3-types';

function meetsEIP155(_v: bigint, chainId: bigint) {
  const v = Number(_v);
  const chainIdDoubled = Number(chainId) * 2;
  return v === chainIdDoubled + 35 || v === chainIdDoubled + 36;
}

export class PrivateTransaction extends BaseTransaction<PrivateTransaction> {
  public readonly gasPrice: bigint;
  public readonly privateFrom: Base64String;
  public readonly privateFor: Base64String[];
  public readonly privacyGroupId: Base64String;
  public readonly restriction: Restriction;

  // public readonly common: Common;

  /**
   * Validates tx's `v` value
   */
  private _validateTxV(_v?: bigint, common?: Common): Common {
    let chainIdBigInt: Numbers;
    const v = _v !== undefined ? Number(_v) : undefined;
    // Check for valid v values in the scope of a signed legacy tx
    if (v !== undefined) {
      // v is 1. not matching the EIP-155 chainId included case and...
      // v is 2. not matching the classic v=27 or v=28 case
      if (v < 37 && v !== 27 && v !== 28) {
        throw new Error(`Legacy txs need either v = 27/28 or v >= 37 (EIP-155 replay protection), got v = ${v}`);
      }
    }

    // No unsigned tx and EIP-155 activated and chain ID included
    if (v !== undefined && v !== 0 && (!common || common.gteHardfork('spuriousDragon')) && v !== 27 && v !== 28) {
      if (common) {
        if (!meetsEIP155(BigInt(v), common.chainId())) {
          throw new Error(
            `Incompatible EIP155-based V ${v} and chain id ${common.chainId()}. See the Common parameter of the Transaction constructor to set the chain id.`
          );
        }
      } else {
        // Derive the original chain ID
        let numSub: number;
        if ((v - 35) % 2 === 0) {
          numSub = 35;
        } else {
          numSub = 36;
        }
        // Use derived chain ID to create a proper Common
        chainIdBigInt = BigInt(v - numSub) / BigInt(2);
      }
    }
    return this._getCommon(common, chainIdBigInt);
  }

  /**
   * This constructor takes the values, validates them, assigns them and freezes the object.
   *
   * It is not recommended to use this constructor directly. Instead use
   * the static factory methods to assist in creating a Transaction object from
   * varying data types.
   */
  public constructor(txData: PrivateTxData, opts: TxOptions = {}) {
    super({ ...txData /* type: TRANSACTION_TYPE */ }, opts);

    (this as any).common = this._validateTxV(this.v, opts.common);

    this.gasPrice = uint8ArrayToBigInt(toUint8Array(txData.gasPrice === '' ? '0x' : txData.gasPrice));
    this.privateFrom = uint8ArrayToBase64(txData.privateFrom);
    this.privacyGroupId = uint8ArrayToBase64(txData.privacyGroupId);
    this.restriction = typeof txData.restriction === 'string' ? txData.restriction : bytesToUtf8(txData.restriction);

    this.privateFor = [];
    for (const privateFor of txData.privateFor || []) {
      this.privateFor.push(uint8ArrayToBase64(privateFor));
    }

    if (this.gasPrice * this.gasLimit > MAX_INTEGER) {
      const msg = this._errorMsg('gas limit * gasPrice cannot exceed MAX_INTEGER (2^256-1)');
      throw new Error(msg);
    }
    this._validateCannotExceedMaxInteger({ gasPrice: this.gasPrice });
    BaseTransaction._validateNotArray(txData);

    if (this.common.gteHardfork('spuriousDragon')) {
      if (!this.isSigned()) {
        this.activeCapabilities.push(Capability.EIP155ReplayProtection);
      } else {
        // EIP155 spec:
        // If block.number >= 2,675,000 and v = CHAIN_ID * 2 + 35 or v = CHAIN_ID * 2 + 36
        // then when computing the hash of a transaction for purposes of signing or recovering
        // instead of hashing only the first six elements (i.e. nonce, gasprice, startgas, to, value, data)
        // hash nine elements, with v replaced by CHAIN_ID, r = 0 and s = 0.
        // v and chain ID meet EIP-155 conditions
        // eslint-disable-next-line no-lonely-if
        if (meetsEIP155(this.v!, this.common.chainId())) {
          this.activeCapabilities.push(Capability.EIP155ReplayProtection);
        }
      }
    }

    const freeze = opts?.freeze ?? true;
    if (freeze) {
      Object.freeze(this);
    }
  }

  getUpfrontCost(): bigint {
    return this.gasLimit * this.gasPrice + this.value;
  }

  raw(): TxValuesArray | AccessListEIP2930ValuesArray | FeeMarketEIP1559ValuesArray {
    const values = [
      bigIntToUnpaddedUint8Array(this.nonce),
      bigIntToUnpaddedUint8Array(this.gasPrice),
      bigIntToUnpaddedUint8Array(this.gasLimit),
      this.to !== undefined ? this.to.buf : Uint8Array.from([]),
      bigIntToUnpaddedUint8Array(this.value),
      this.data,
      this.v !== undefined ? bigIntToUnpaddedUint8Array(this.v) : Uint8Array.from([]),
      this.r !== undefined ? bigIntToUnpaddedUint8Array(this.r) : Uint8Array.from([]),
      this.s !== undefined ? bigIntToUnpaddedUint8Array(this.s) : Uint8Array.from([]),
      this.privateFrom !== undefined ? base64ToUint8Array(this.privateFrom) : Uint8Array.from([])
    ];

    if (this.privateFor && this.privateFor.length > 0) {
      // @ts-expect-error
      values.push(this.privateFor.map(base64ToUint8Array));
    }

    if (this.privacyGroupId !== undefined) {
      values.push(base64ToUint8Array(this.privacyGroupId));
    }

    values.push(hexToBytes(stringToHex(this.restriction)));

    return values;
  }

  serialize(): Uint8Array {
    return RLP.encode(this.raw());
  }

  private _getMessageToSign() {
    const values: (Uint8Array | Uint8Array[])[] = [
      bigIntToUnpaddedUint8Array(this.nonce),
      bigIntToUnpaddedUint8Array(this.gasPrice),
      bigIntToUnpaddedUint8Array(this.gasLimit),
      this.to !== undefined ? this.to.buf : Uint8Array.from([]),
      bigIntToUnpaddedUint8Array(this.value),
      this.data
    ];

    if (this.supports(Capability.EIP155ReplayProtection)) {
      values.push(toUint8Array(this.common.chainId()));
      values.push(unpadUint8Array(toUint8Array(0)));
      values.push(unpadUint8Array(toUint8Array(0)));
      values.push(unpadUint8Array(base64ToUint8Array(this.privateFrom)));
      if (this.privateFor.length > 0) {
        values.push(this.privateFor.map(base64ToUint8Array).map(unpadUint8Array));
      }
      if (this.privacyGroupId) {
        values.push(unpadUint8Array(base64ToUint8Array(this.privacyGroupId)));
      }
      values.push(unpadUint8Array(hexToBytes(stringToHex(this.restriction))));
    }

    return values;
  }

  getMessageToSign(hashMessage: false): Uint8Array | Uint8Array[];
  getMessageToSign(hashMessage?: true): Uint8Array;
  getMessageToSign(hashMessage?: unknown): Uint8Array | Uint8Array[] {
    const message = this._getMessageToSign();
    if (hashMessage) {
      return keccak256(RLP.encode(message));
    }
    return message as Uint8Array[]; // TODO: Change the return type
  }

  hash(): Uint8Array {
    throw new Error('Method not implemented.');
  }

  getMessageToVerifySignature(): Uint8Array {
    if (!this.isSigned()) {
      const msg = this._errorMsg('This transaction is not signed');
      throw new Error(msg);
    }
    const message = this._getMessageToSign();
    return keccak256(RLP.encode(message));
  }

  getSenderPublicKey(): Uint8Array {
    const msgHash = this.getMessageToVerifySignature();

    const { v, r, s } = this;

    this._validateHighS();

    try {
      return ecrecover(
        msgHash,
        v!,
        bigIntToUnpaddedUint8Array(r!),
        bigIntToUnpaddedUint8Array(s!),
        this.supports(Capability.EIP155ReplayProtection) ? this.common.chainId() : undefined
      );
    } catch (e: any) {
      const msg = this._errorMsg('Invalid Signature');
      throw new Error(msg);
    }
  }

  toJSON(): JsonTx {
    throw new Error('Method not implemented.');
  }

  protected _processSignature(_v: bigint, r: Uint8Array, s: Uint8Array): PrivateTransaction {
    let v = _v;
    if (this.supports(Capability.EIP155ReplayProtection)) {
      v += this.common.chainId() * BigInt(2) + BigInt(8);
    }

    const opts = { ...this.txOptions, common: this.common };

    return PrivateTransaction.fromTxData(
      {
        nonce: this.nonce,
        gasPrice: this.gasPrice,
        gasLimit: this.gasLimit,
        to: this.to,
        value: this.value,
        data: this.data,
        v,
        r: uint8ArrayToBigInt(r),
        s: uint8ArrayToBigInt(s),
        privateFor: this.privateFor,
        privateFrom: this.privateFrom,
        privacyGroupId: this.privacyGroupId,
        restriction: this.restriction
      },
      opts
    );
  }

  errorStr(): string {
    throw new Error('Method not implemented.');
  }

  protected _errorMsg(msg: string): string {
    throw new Error('Method not implemented.');
  }

  // TODO: We should have custom type for values
  public static fromValuesArray(values: PrivateTxValuesArray, opts: TxOptions = {}) {
    // If length is not 6, it has length 9. If v/r/s are empty Uint8Array, it is still an unsigned transaction
    // This happens if you get the RLP data from `raw()`
    // if (values.length !== 6 && values.length !== 9) {
    //   throw new Error('Invalid transaction. Only expecting 6 values (for unsigned tx) or 9 values (for signed tx).');
    // }
    // TODO: Validate exclusive private transaction arguments

    const [nonce, gasPrice, gasLimit, to, value, data, v, r, s, privateFrom, privateForOrPrivacyGroupId, restriction] =
      values;

    const privateFor = Array.isArray(privateForOrPrivacyGroupId) ? privateForOrPrivacyGroupId : [];
    const privacyGroupId = Array.isArray(privateForOrPrivacyGroupId) ? '' : privateForOrPrivacyGroupId;

    validateNoLeadingZeroes({
      nonce,
      gasPrice,
      gasLimit,
      value,
      v,
      r,
      s,
      privateFrom
      // privateFor,
      // privacyGroupId,
      // restriction
    });

    return new PrivateTransaction(
      {
        nonce,
        gasPrice,
        gasLimit,
        to,
        value,
        data,
        v,
        r,
        s,
        privateFrom,
        privateFor,
        privacyGroupId,
        restriction
      },
      opts
    );
  }

  public static fromSerializedTx(serialized: Uint8Array, opts: TxOptions = {}) {
    const values = RLP.decode(serialized);

    if (!Array.isArray(values)) {
      throw new Error('Invalid serialized tx input. Must be array');
    }

    return this.fromValuesArray(values as PrivateTxValuesArray, opts);
  }

  public static fromTxData(txData: PrivateTxData, opts: TxOptions = {}) {
    return new PrivateTransaction(txData, opts);
  }
}
