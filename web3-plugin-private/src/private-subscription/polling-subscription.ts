import { Timeout } from 'web3-utils';
import { PrivateSubscription } from './private-subscription';
import { BaseSubscription, Event } from './base-subscription';
import { EventLog } from 'web3';

export class PollingSubscription extends BaseSubscription {
  private timeout: Timeout;
  private pollingInterval: number;

  constructor(subscription: PrivateSubscription, pollingInterval = 1000) {
    super(subscription);
    this.timeout = null;
    this.pollingInterval = pollingInterval;
  }

  async subscribe(privacyGroupId: string, filter: object) {
    this.subscription.filterId = await this.subscription.web3Plugin.newFilter(privacyGroupId, filter);
    await this.pollForLogs(privacyGroupId, this.subscription.filterId);
  }

  async getPastLogs(privacyGroupId: string, filterId: string) {
    return this.subscription.web3Plugin.getFilterLogs(privacyGroupId, filterId);
  }

  async pollForLogs(privacyGroupId: string, filterId: string) {
    const fetchLogs = async () => {
      try {
        const logs = await this.subscription.web3Plugin.getFilterChanges(privacyGroupId, filterId);
        logs.forEach((log: EventLog) => {
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

  async unsubscribe(privacyGroupId: string, filterId: string, callback: (...args: any[]) => void) {
    try {
      await this.subscription.web3Plugin.uninstallFilter(privacyGroupId, filterId);
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
