import { SubscriptionManager } from "./subscription-manager";

export class PollingSubscription extends SubscriptionManager {
  constructor(subscription, pollingInterval = 1000) {
    super(subscription);
    this.privacyGroupId = subscription.privacyGroupId;
    this.filter = subscription.filter;
    this.timeout = null;
    this.pollingInterval = pollingInterval;
  }

  async subscribe(privacyGroupId, filter) {
    this.subscription.filterId = await this.web3Plugin.newFilter(privacyGroupId, filter);
    await this.pollForLogs(privacyGroupId, this.subscription.filterId);
  }

  async getPastLogs(privacyGroupId, filterId) {
    return this.web3Plugin.getFilterLogs(privacyGroupId, filterId);
  }

  async pollForLogs(privacyGroupId, filterId) {
    const fetchLogs = async () => {
      try {
        const logs = await this.web3Plugin.getFilterChanges(privacyGroupId, filterId);
        logs.forEach((log) => {
          this.subscription.emit(Event.DATA, log);
        });
        this.timeout = setTimeout(() => {
          this.pollForLogs(privacyGroupId, filterId);
        }, this.pollingInterval);
      } catch (error) {
        this.subscription.emit(Event.ERROR, error);
      }
    };

    fetchLogs();
  }

  async unsubscribe(privacyGroupId, filterId, callback) {
    try {
      await this.web3Plugin.uninstallFilter(privacyGroupId, filterId);
      if (this.timeout != null) {
        clearTimeout(this.timeout);
      }
      this.subscription.reset();
      if (callback) callback(null, true);
      return filterId;
    } catch (error) {
      if (callback) callback(error);
      return error;
    }
  }
}
