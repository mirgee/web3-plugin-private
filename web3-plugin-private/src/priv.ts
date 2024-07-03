import Web3, { eth, FMT_BYTES, FMT_NUMBER, Web3Eth, Web3PluginBase } from 'web3';
import { PrivateTransactionManager } from './private-transaction-manager';
import { PrivateTransaction } from 'private-transaction/dist';
import { bytesToHex, hexToBytes } from 'web3-utils';
import { Chain, Common, privateKeyToAddress, Uint8ArrayLike } from 'web3-eth-accounts';
import { waitForTransactionWithRetries } from './shared/util';

export type LogsFilterOptions = {
  fromBlock?: number;
  toBlock?: number;
  addresses?: string[];
};

export type CallOptions = {
  to?: string;
  data?: string;
};

interface RawTransactionOptions {
  privateKey: string;
  privateFrom: string;
  privateFor?: string[];
  privacyGroupId?: string;
  nonce?: string;
  to?: string;
  data: Uint8ArrayLike;
  restriction?: string;
  gasPrice?: string;
  gasLimit?: string;
}

export class PrivPlugin extends Web3PluginBase {
  public pluginNamespace = 'priv';

  // public ptm: PrivateTransactionManager;

  constructor() {
    super();
    // this.ptm = ptm;
  }

  public async call(privacyGroupId: string, options: CallOptions, blockNumber: string) {
    return this.requestManager.send({
      method: 'priv_call',
      params: [privacyGroupId, options, blockNumber]
    });
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

  public async sendRawTransaction(transaction: string) {
    return this.requestManager.send({
      method: 'eea_sendRawTransaction',
      params: [transaction]
    });
  }

  public async getTransactionReceipt(txHash: string) {
    return this.requestManager.send({
      method: 'priv_getTransactionReceipt',
      params: [txHash]
    });
  }

  public async getLogs(privacyGroupId: string, filterOptions?: LogsFilterOptions) {
    return this.requestManager.send({
      method: 'priv_getLogs',
      params: [privacyGroupId, filterOptions]
    });
  }

  public async getTransactionCount(address: string, privacyGroupId: string) {
    const result = await this.requestManager.send({
      method: 'priv_getTransactionCount',
      params: [address, privacyGroupId]
    });
    return parseInt(result, 16);
  }

  public async generateAndSendRawTransaction(options: RawTransactionOptions) {
    if (options.privacyGroupId && options.privateFor) {
      throw Error('privacyGroupId and privateFor are mutually exclusive');
    }
    const chainId = await eth.getChainId(this, { number: FMT_NUMBER.NUMBER, bytes: FMT_BYTES.HEX });

    const privateKeyBuffer = Buffer.from(options.privateKey, 'hex');
    const tx: PrivateTransaction = PrivateTransaction.fromTxData(
      {
        nonce:
          options.nonce ||
          (await this.getTransactionCount(
            privateKeyToAddress(privateKeyBuffer).toString(),
            options.privacyGroupId
          )),
        gasPrice: options.gasPrice || 0,
        gasLimit: options.gasLimit || 3000000,
        to: options.to,
        value: 0,
        data: options.data,
        privateFor: options.privateFor,
        privateFrom: options.privateFrom,
        privacyGroupId: options.privacyGroupId,
        restriction: options.restriction || 'restricted'
      },
      {
        common: Common.custom({ chainId })
      }
    );

    const signedTx = tx.sign(hexToBytes(options.privateKey));

    return this.sendRawTransaction(bytesToHex(signedTx.serialize()));
  }

  public async waitForTransactionReceipt(txHash: string, retries = 300, delay = 1000) {
    const operation = () => {
      return eth.getTransactionReceipt(this, txHash, { number: FMT_NUMBER.NUMBER, bytes: FMT_BYTES.HEX });
    };

    await waitForTransactionWithRetries(operation, txHash, retries, delay);
    return this.getTransactionReceipt(txHash);
  }
}

declare module 'web3' {
  interface Web3Context {
    priv: PrivPlugin;
  }
}
