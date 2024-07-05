import { PrivateSubscription } from './private-subscription';
import { Event, BaseSubscription } from './base-subscription';

export class PubSubSubscription extends BaseSubscription {
  constructor(subscription: PrivateSubscription) {
    super(subscription);
  }

  async subscribe(privacyGroupId: string, filter: object) {
    const websocketProvider = this.subscription.web3Plugin.currentProvider;

    websocketProvider.on('connect', () => {
      console.log('CONNECTED');
      this.subscription.emit(Event.CONNECTED);
    });

    websocketProvider.on('data', (data: any) => {
      this.subscription.emit(Event.DATA, data.params);
    });

    websocketProvider.on('error', (error: any) => {
      this.subscription.emit(Event.ERROR, error);
    });

    this.subscription.filterId = await this.subscription.web3Plugin.subscribe(privacyGroupId, 'logs', filter);
  }

  async getPastLogs() {
    return [];
  }

  async unsubscribe(privacyGroupId: string, filterId: string, callback: (...args: any[]) => void) {
    try {
      const result = await this.subscription.web3Plugin.unsubscribe(privacyGroupId, filterId);
      this.subscription.reset();
      if (callback) callback(null, result);
      return result;
    } catch (error) {
      if (callback) callback(error);
      return error;
    }
  }
}
