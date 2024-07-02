import {
  AccessListEIP2930ValuesArray,
  BaseTransaction,
  bigIntToUnpaddedUint8Array,
  FeeMarketEIP1559ValuesArray,
  JsonTx,
  toUint8Array,
  TxOptions,
  TxValuesArray,
  uint8ArrayToBigInt
} from 'web3-eth-accounts';
import { RLP } from '@ethereumjs/rlp';
import { Base64String, PrivateTxData, PrivateTxValuesArray, Restriction } from './types';
import { MAX_INTEGER } from './constants';
import { validateNoLeadingZeroes } from 'web3-validator';
import { stringToHex } from 'web3-utils';
import { hexToBytes, bytesToUtf8 } from 'ethereum-cryptography/utils';
import { base64ToUint8Array, uint8ArrayToBase64 } from './utils';

export class PrivateTransaction extends BaseTransaction<PrivateTransaction> {
  public readonly gasPrice: bigint;
  public readonly privateFrom: Base64String;
  public readonly privateFor: Base64String[];
  public readonly privacyGroupId: Base64String;
  public readonly restriction: Restriction;

  /**
   * This constructor takes the values, validates them, assigns them and freezes the object.
   *
   * It is not recommended to use this constructor directly. Instead use
   * the static factory methods to assist in creating a Transaction object from
   * varying data types.
   */
  public constructor(txData: PrivateTxData, opts: TxOptions = {}) {
    super({ ...txData /* type: TRANSACTION_TYPE */ }, opts);

    // this.common = this._validateTxV(this.v, opts.common);

    this.gasPrice = uint8ArrayToBigInt(toUint8Array(txData.gasPrice === '' ? '0x' : txData.gasPrice));
    this.privateFrom = uint8ArrayToBase64(txData.privateFrom);
    this.privacyGroupId = uint8ArrayToBase64(txData.privacyGroupId);
    this.restriction = typeof txData.restriction === 'string' ? txData.restriction : bytesToUtf8(txData.restriction);

    this.privateFor = [];
    for (const privateFor of txData.privateFor) {
      this.privateFor.push(uint8ArrayToBase64(privateFor));
    }

    if (this.gasPrice * this.gasLimit > MAX_INTEGER) {
      const msg = this._errorMsg('gas limit * gasPrice cannot exceed MAX_INTEGER (2^256-1)');
      throw new Error(msg);
    }
    this._validateCannotExceedMaxInteger({ gasPrice: this.gasPrice });
    BaseTransaction._validateNotArray(txData);

    const freeze = opts?.freeze ?? true;
    if (freeze) {
      Object.freeze(this);
    }
  }

  getUpfrontCost(): bigint {
    return this.gasLimit * this.gasPrice + this.value;
  }

  // @ts-ignore: ignore type mismatch error
  raw(): TxValuesArray | AccessListEIP2930ValuesArray | FeeMarketEIP1559ValuesArray | PrivateTxValuesArray {
    return [
      bigIntToUnpaddedUint8Array(this.nonce),
      bigIntToUnpaddedUint8Array(this.gasPrice),
      bigIntToUnpaddedUint8Array(this.gasLimit),
      this.to !== undefined ? this.to.buf : Uint8Array.from([]),
      bigIntToUnpaddedUint8Array(this.value),
      this.data,
      this.v !== undefined ? bigIntToUnpaddedUint8Array(this.v) : Uint8Array.from([]),
      this.r !== undefined ? bigIntToUnpaddedUint8Array(this.r) : Uint8Array.from([]),
      this.s !== undefined ? bigIntToUnpaddedUint8Array(this.s) : Uint8Array.from([]),
      this.privateFrom !== undefined ? base64ToUint8Array(this.privateFrom) : Uint8Array.from([]),
      this.privateFor.map(base64ToUint8Array),
      this.privacyGroupId !== undefined ? base64ToUint8Array(this.privacyGroupId) : Uint8Array.from([]),
      this.restriction !== undefined ? hexToBytes(stringToHex(this.restriction)) : Uint8Array.from([])
    ];
  }

  serialize(): Uint8Array {
    return RLP.encode(this.raw());
  }

  getMessageToSign(hashMessage: false): Uint8Array | Uint8Array[];
  getMessageToSign(hashMessage?: true): Uint8Array;
  getMessageToSign(hashMessage?: unknown): Uint8Array | Uint8Array[] {
    throw new Error('Method not implemented.');
  }

  hash(): Uint8Array {
    throw new Error('Method not implemented.');
  }

  getMessageToVerifySignature(): Uint8Array {
    throw new Error('Method not implemented.');
  }

  getSenderPublicKey(): Uint8Array {
    throw new Error('Method not implemented.');
  }

  toJSON(): JsonTx {
    throw new Error('Method not implemented.');
  }

  protected _processSignature(v: bigint, r: Uint8Array, s: Uint8Array): PrivateTransaction {
    throw new Error('Method not implemented.');
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
}
