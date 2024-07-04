import { SubscriptionManager } from "./subscription-manager";

export class PubSubSubscription extends SubscriptionManager {
  constructor(subscription) {
    super(subscription);
  }

  async subscribe(privacyGroupId, filter) {
    const websocketProvider = this.web3Plugin.currentProvider;

    websocketProvider.on('connect', () => {
      console.log('CONNECTED');
      this.subscription.emit(Event.CONNECTED);
    });

    websocketProvider.on('data', (data) => {
      this.subscription.emit(Event.DATA, data.params);
    });

    websocketProvider.on('error', (error) => {
      this.subscription.emit(Event.ERROR, error);
    });

    this.subscription.filterId = await this.web3Plugin.subscribe(privacyGroupId, 'logs', filter);
  }

  async getPastLogs() {
    return [];
  }

  async unsubscribe(privacyGroupId, filterId, callback) {
    try {
      const result = await this.web3Plugin.unsubscribe(privacyGroupId, filterId);
      this.subscription.reset();
      if (callback) callback(null, result);
      return result;
    } catch (error) {
      if (callback) callback(error);
      return error;
    }
  }
}
