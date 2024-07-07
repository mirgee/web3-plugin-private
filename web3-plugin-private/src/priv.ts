import { eth, FMT_BYTES, FMT_NUMBER, Web3PluginBase } from 'web3';
import { PrivateTransactionManager } from './private-transaction-manager';
import { PrivateTransaction } from 'web3-private-transaction';
import { bytesToHex, hexToBytes } from 'web3-utils';
import { Common, privateKeyToAddress, Uint8ArrayLike } from 'web3-eth-accounts';
import { generatePrivacyGroup, waitForTransactionWithRetries } from './util';
import { PrivateSubscription } from './private-subscription';
import { CallOptions, FilterOptions } from './types';

type RawTransactionOptions = {
  privateKey: string;
  privateFrom: string;
  privateFor?: string[];
  privacyGroupId?: string;
  nonce?: bigint;
  to?: string;
  data: Uint8ArrayLike;
  restriction?: string;
  gasPrice?: string;
  gasLimit?: string;
}

type CreatePrivacyGroupOptions = {
  addresses: string[];
  name?: string;
  description?: string;
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

  public async createPrivacyGroup(options: CreatePrivacyGroupOptions) {
    return this.requestManager.send({
      method: 'priv_createPrivacyGroup',
      params: [options]
    });
  }

  public async findPrivacyGroup(addresses: string[]) {
    return this.requestManager.send({
      method: 'priv_findPrivacyGroup',
      params: [addresses]
    });
  }

  public async deletePrivacyGroup(privacyGroupId: string) {
    return this.requestManager.send({
      method: 'priv_deletePrivacyGroup',
      params: [privacyGroupId]
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

  public async getLogs(privacyGroupId: string, filterOptions?: FilterOptions) {
    return this.requestManager.send({
      method: 'priv_getLogs',
      params: [privacyGroupId, filterOptions]
    });
  }

  public async newFilter(privacyGroupId: string, filterOptions?: FilterOptions) {
    return this.requestManager.send({
      method: 'priv_newFilter',
      params: [privacyGroupId, filterOptions]
    });
  }

  public async uninstallFilter(privacyGroupId: string, filterId: string) {
    return this.requestManager.send({
      method: 'priv_uninstallFilter',
      params: [privacyGroupId, filterId]
    });
  }

  public async getFilterLogs(privacyGroupId: string, filterId: string) {
    return this.requestManager.send({
      method: 'priv_getFilterLogs',
      params: [privacyGroupId, filterId]
    });
  }

  public async getFilterChanges(privacyGroupId: string, filterId: string) {
    return this.requestManager.send({
      method: 'priv_getFilterChanges',
      params: [privacyGroupId, filterId]
    });
  }

  public async subscribe(privacyGroupId: string, type: string, filterOptions: FilterOptions) {
    return this.requestManager.send({
      method: 'priv_subscribe',
      params: [privacyGroupId, type, filterOptions]
    });
  }

  public async unsubscribe(privacyGroupId: string, subscriptionId: string) {
    return this.requestManager.send({
      method: 'priv_unsubscribe',
      params: [privacyGroupId, subscriptionId]
    });
  }

  public async getTransactionCount(address: string, privacyGroupId: string) {
    const result = await this.requestManager.send({
      method: 'priv_getTransactionCount',
      params: [address, privacyGroupId]
    });
    return parseInt(result, 16);
  }

  public async getPrivateTransaction(txHash: string) {
    return this.requestManager.send({
      method: 'priv_getPrivateTransaction',
      params: [txHash]
    });
  }

  private async genericSendRawTransaction(options: RawTransactionOptions, method: string) {
    if (options.privacyGroupId && options.privateFor) {
      throw Error('privacyGroupId and privateFor are mutually exclusive');
    }
    const chainId = await eth.getChainId(this, { number: FMT_NUMBER.NUMBER, bytes: FMT_BYTES.HEX });

    const privacyGroupId =
      options.privacyGroupId || generatePrivacyGroup(options);
    const privateKeyBuffer = Buffer.from(options.privateKey, 'hex');
    const tx: PrivateTransaction = PrivateTransaction.fromTxData(
      {
        nonce:
          options.nonce ||
          (await this.getTransactionCount(privateKeyToAddress(privateKeyBuffer).toString(), privacyGroupId)),
        gasPrice: options.gasPrice || 0,
        gasLimit: options.gasLimit || 3000000,
        to: options.to,
        value: 0,
        data: options.data,
        privateFor: options.privateFor,
        privateFrom: options.privateFrom,
        privacyGroupId,
        restriction: options.restriction || 'restricted'
      },
      {
        common: Common.custom({ chainId })
      }
    );

    const signedTx = tx.sign(hexToBytes(options.privateKey));

    if (method === 'eea_sendRawTransaction') {
      return this.sendRawTransaction(bytesToHex(signedTx.serialize()));
    } else if (method === 'priv_distributeRawTransaction') {
      return this.distributeRawTransaction(bytesToHex(signedTx.serialize())) 
    } else {
      throw new Error(`Invalid method: ${method}`);
    }
  }

  public async generateAndDistributeRawTransaction(options: RawTransactionOptions) {
    return this.genericSendRawTransaction(options, 'priv_distributeRawTransaction');
  }

  public async generateAndSendRawTransaction(options: RawTransactionOptions) {
    return this.genericSendRawTransaction(options, 'eea_sendRawTransaction');
  }

  public async waitForTransactionReceipt(txHash: string, retries = 300, delay = 1000) {
    const operation = () => {
      return eth.getTransactionReceipt(this, txHash, { number: FMT_NUMBER.NUMBER, bytes: FMT_BYTES.HEX });
    };

    await waitForTransactionWithRetries(operation, txHash, retries, delay);
    return this.getTransactionReceipt(txHash);
  }

  public async subscribeWithPooling(privacyGroupId: string, filter: object) {
    const subscription = new PrivateSubscription(this, privacyGroupId, filter);
    const filterId = await subscription.subscribe();
    return { subscription, filterId };
  }
}

declare module 'web3' {
  interface Web3Context {
    priv: PrivPlugin;
  }
}
