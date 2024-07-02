import Web3, { eth, FMT_BYTES, FMT_NUMBER, Web3Eth, Web3PluginBase } from 'web3';
import { PrivateTransactionManager } from './private-transaction-manager';
import { PrivateTransaction } from 'private-transaction/dist';
import { bytesToHex, hexToBytes } from 'web3-utils';
import { Chain, Common } from 'web3-eth-accounts';

interface RawTransactionOptions {
  privateKey: string;
  privateFrom: string;
  privateFor: string;
  privacyGroupId: string;
  nonce?: string;
  to: string;
  data: string;
  restriction?: string;
}

export class PrivPlugin extends Web3PluginBase {
  public pluginNamespace = 'priv';

  // public ptm: PrivateTransactionManager;

  constructor() {
    super();
    // this.ptm = ptm;
  }

  public async createPrivacyGroup(addresses: string[], name?: string, description?: string) {
    return this.requestManager.send({
      method: 'priv_createPrivacyGroup',
      params: [{ addresses, name, description }]
    });
  }

  public async findPrivacyGroup(addresses: string[]) {
    return this.requestManager.send({
      method: 'priv_findPrivacyGroup',
      params: [addresses]
    });
  }

  public async distributeRawTransaction(transaction: string) {
    return this.requestManager.send({
      method: 'priv_distributeRawTransaction',
      params: [transaction]
    });
  }

  public async generateAndSendRawTransaction(options: RawTransactionOptions) {
    if (options.privacyGroupId && options.privateFor) {
      throw Error('privacyGroupId and privateFor are mutually exclusive');
    }
    const chainId = await eth.getChainId(this, { number: FMT_NUMBER.NUMBER, bytes: FMT_BYTES.HEX });
    const tx: PrivateTransaction = PrivateTransaction.fromTxData(
      {
        nonce: options.nonce,
        // gasPrice: options.gasPrice,
        // gasLimit: options.gasLimit,
        to: options.to,
        value: 0,
        data: options.data,
        // v,
        // r: uint8ArrayToBigInt(r),
        // s: uint8ArrayToBigInt(s),
        privateFor: options.privateFor,
        privateFrom: options.privateFrom,
        privacyGroupId: options.privacyGroupId,
        restriction: options.restriction || 'restricted'
      },
      {
        common: Common.custom({ chainId })
      }
    );

    tx.sign(hexToBytes(options.privateKey));

    await this.distributeRawTransaction(bytesToHex(tx.serialize()));
  }
}

declare module 'web3' {
  interface Web3Context {
    priv: PrivPlugin;
  }
}
