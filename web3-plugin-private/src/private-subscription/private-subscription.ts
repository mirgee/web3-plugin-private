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
import EventEmitter from 'events';
import { PrivPlugin } from '../priv';
import { Event } from './base-subscription';
import { PollingSubscription } from './polling-subscription';
import { PubSubSubscription } from './pubsub-subscription';
import { FilterOptions } from '../types';

export class PrivateSubscription extends EventEmitter {
  public web3Plugin: PrivPlugin;
  public privacyGroupId: string;
  public filterOptions: FilterOptions;
  public filterId: string;

  private getPast: boolean;
  private subscription: PollingSubscription | PubSubSubscription;

  constructor(web3Plugin: PrivPlugin, privacyGroupId: string, filter: object) {
    super();
    this.privacyGroupId = privacyGroupId;
    this.filterOptions = filter;
    this.web3Plugin = web3Plugin;
    this.filterId = null;
    this.getPast = false;

    const providerType = web3Plugin.currentProvider.constructor.name;
    if (providerType === 'HttpProvider') {
      this.subscription = new PollingSubscription(this, 5000);
    } else if (providerType === 'WebsocketProvider') {
      this.subscription = new PubSubSubscription(this);
    } else {
      throw new Error('Current protocol does not support subscriptions. Use HTTP or WebSockets.');
    }
  }

  async subscribe() {
    if (this.filterOptions.fromBlock != null) {
      this.getPast = true;
    }
    await this.subscription.subscribe(this.privacyGroupId, this.filterOptions);
    if (this.filterId == null) {
      throw new Error('Failed to set filter ID');
    }
    return this.filterId;
  }

  on(eventName: string, callback: (...args: any[]) => void) {
    super.on(eventName, callback);

    if (this.getPast && eventName === Event.DATA) {
      (async () => {
        const pastLogs = await this.subscription.getPastLogs(this.privacyGroupId, this.filterId);
        pastLogs.forEach((log: object) => {
          this.emit(Event.DATA, log);
        });
      })();
    }

    return this;
  }

  reset() {
    this.removeAllListeners();
  }

  async unsubscribe(callback: (...args: any[]) => void) {
    return this.subscription.unsubscribe(this.privacyGroupId, this.filterId, callback);
  }
}
