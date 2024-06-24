import axios, { AxiosRequestConfig } from "axios";
import { URL } from "url";
import { hexToBase64, base64toHex } from "./shared/util";
import { Web3PluginBase } from "web3";

interface SendOptions {
  data: string;
  privateFrom: string;
  privateFor: string;
}

interface StoreRawOptions {
  data: string;
  privateFrom: string;
}

interface TlsSettings {
  key?: string;
  clcert?: string;
  cacert?: string;
  allowInsecure?: boolean;
}

export class PrivateTransactionManager extends Web3PluginBase {
  public pluginNamespace = 'ptm';

  private socketRoot: string;
  private privateEndpoint: string;
  private publicEndpoint: string;
  private tlsOptions: AxiosRequestConfig;

  constructor({ ipcPath, privateUrl, tlsSettings }: { ipcPath?: string; privateUrl?: string; tlsSettings?: TlsSettings }) {
    super();
    this.socketRoot = `http://unix:${ipcPath}:`;
    this.privateEndpoint = ipcPath ? this.socketRoot : privateUrl || "";
    this.publicEndpoint = ipcPath ? this.socketRoot : privateUrl || "";
    this.tlsOptions = {};

    // tls settings for https connections
    if (!ipcPath && privateUrl) {
      const { protocol } = new URL(privateUrl);
      if (protocol === "https:" && tlsSettings) {
        if (tlsSettings.key) {
          this.tlsOptions.httpsAgent = {
            key: tlsSettings.key,
          };
        }
        if (tlsSettings.clcert) {
          this.tlsOptions.httpsAgent = {
            ...this.tlsOptions.httpsAgent,
            cert: tlsSettings.clcert,
          };
        }
        if (tlsSettings.cacert) {
          this.tlsOptions.httpsAgent = {
            ...this.tlsOptions.httpsAgent,
            ca: tlsSettings.cacert,
          };
        }
        if (tlsSettings.allowInsecure) {
          this.tlsOptions.httpsAgent = {
            ...this.tlsOptions.httpsAgent,
            rejectUnauthorized: !tlsSettings.allowInsecure,
          };
        }
      }
    }
  }

  async send({ data, privateFrom, privateFor }: SendOptions) {
    const response = await axios.post(`${this.privateEndpoint}/send`, {
      payload: hexToBase64(data.substring(2)),
      from: privateFrom,
      to: privateFor,
    }, this.tlsOptions);
    return base64toHex(response.data.key);
  }

  async storeRaw({ data, privateFrom }: StoreRawOptions) {
    const response = await axios.post(`${this.privateEndpoint}/storeraw`, {
      payload: hexToBase64(data.substring(2)),
      from: privateFrom,
    }, this.tlsOptions);
    return base64toHex(response.data.key);
  }

  async keys() {
    return axios.get(`${this.publicEndpoint}/keys`, this.tlsOptions);
  }

  async partyInfoKeys() {
    return axios.get(`${this.publicEndpoint}/partyinfo/keys`, this.tlsOptions);
  }

  async upCheck() {
    const response = await axios.get(`${this.publicEndpoint}/upcheck`, this.tlsOptions);
    return response.data;
  }
}

declare module 'web3' {
  interface Web3Context {
    ptm: PrivateTransactionManager;
  }
}
