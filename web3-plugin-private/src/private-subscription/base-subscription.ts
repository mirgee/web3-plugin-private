/**
 * This file includes modified code from the `web3js-quorum` project,
 * licenced under Apache 2.0 licence,
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * The original code can be found at:https://github.com/ConsenSys/web3js-quorum
 * 
 * Modifications made by Miroslav Kovar (miroslavkovar@protonmail.com).
 */
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
