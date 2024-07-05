import { PrivPlugin } from '../priv';
import { PrivateSubscription } from './private-subscription';

export enum Protocol {
  HTTP = 'HTTP',
  WEBSOCKET = 'WebSocket'
}

export enum Event {
  CONNECTED = 'connected',
  DATA = 'data',
  ERROR = 'error'
}

export abstract class BaseSubscription {
  protected subscription: PrivateSubscription;

  constructor(subscription: PrivateSubscription) {
    this.subscription = subscription;
  }

  abstract subscribe(privacyGroupId: string, filter: object): Promise<void>;

  abstract unsubscribe(privacyGroupId: string, filterId: string, callback: (...args: any[]) => void): Promise<void>;

  abstract getPastLogs(privacyGroupId: string, filterId: string): Promise<Array<object>>;
}
