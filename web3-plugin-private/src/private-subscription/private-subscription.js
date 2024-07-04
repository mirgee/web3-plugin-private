import EventEmitter from 'events';

export class PrivateSubscription extends EventEmitter {
  constructor(web3Plugin, privacyGroupId, filter) {
    super();
    this.privacyGroupId = privacyGroupId;
    this.filter = filter;
    this.web3Plugin = web3Plugin;
    this.filterId = null;
    this.getPast = false;

    const providerType = web3Plugin.currentProvider.constructor.name;
    if (providerType === 'HttpProvider') {
      this.protocol = Protocol.HTTP;
      this.manager = new PollingSubscription(this, 5000);
    } else if (providerType === 'WebsocketProvider') {
      this.protocol = Protocol.WEBSOCKET;
      this.manager = new PubSubSubscription(this);
    } else {
      throw new Error('Current protocol does not support subscriptions. Use HTTP or WebSockets.');
    }
  }

  async subscribe() {
    if (this.filter.fromBlock != null) {
      this.getPast = true;
    }
    await this.manager.subscribe(this.privacyGroupId, this.filter);
    if (this.filterId == null) {
      throw new Error('Failed to set filter ID');
    }
    return this.filterId;
  }

  on(eventName, callback) {
    super.on(eventName, callback);

    if (this.getPast && eventName === Event.DATA) {
      (async () => {
        const pastLogs = await this.manager.getPastLogs(this.privacyGroupId, this.filterId);
        pastLogs.forEach((log) => {
          this.emit(Event.DATA, log);
        });
      })();
    }

    return this;
  }

  reset() {
    this.removeAllListeners();
  }

  async unsubscribe(callback) {
    return this.manager.unsubscribe(this.privacyGroupId, this.filterId, callback);
  }
}
