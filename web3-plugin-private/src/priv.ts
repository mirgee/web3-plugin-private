import { Web3PluginBase } from 'web3';
import { PrivateTransactionManager } from './private-transaction-manager';

interface RawTransactionOptions {
  privateKey: string;
  privateFrom: string;
  privateFor: string;
  privacyGroupId: string;
  nonce?: string;
  to: string;
  data: string;
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
      params: [{ addresses, name, description }],
    });
  }

  public async findPrivacyGroup(addresses: string[]) {
    return this.requestManager.send({
      method: 'priv_findPrivacyGroup',
      params: [addresses],
    });
  }

  public async generateAndSendRawTransaction(options: RawTransactionOptions) {
    
  }
}

declare module 'web3' {
  interface Web3Context {
    priv: PrivPlugin;
  }
}
