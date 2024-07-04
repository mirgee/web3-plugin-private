/*
 * Copyright ConsenSys Software Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on
 * an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

const EventEmitter = require('events');

const Protocol = {
  HTTP: 'HTTP',
  WEBSOCKET: 'WebSocket'
};

const Event = {
  CONNECTED: 'connected',
  DATA: 'data',
  ERROR: 'error'
};

class SubscriptionManager {
  constructor(subscription) {
    this.subscription = subscription;
    this.web3 = subscription.web3;
  }
}

class PollingSubscription extends SubscriptionManager {
  constructor(subscription, pollingInterval = 1000) {
    super(subscription);
    this.privacyGroupId = subscription.privacyGroupId;
    this.filter = subscription.filter;
    this.timeout = null;
    this.pollingInterval = pollingInterval;
  }

  async subscribe(privacyGroupId, filter) {
    this.subscription.filterId = await this.web3.priv.newFilter(privacyGroupId, filter);
    await this.pollForLogs(privacyGroupId, this.subscription.filterId);
  }

  async getPastLogs(privacyGroupId, filterId) {
    return this.web3.priv.getFilterLogs(privacyGroupId, filterId);
  }

  async pollForLogs(privacyGroupId, filterId) {
    const fetchLogs = async () => {
      try {
        const logs = await this.web3.priv.getFilterChanges(privacyGroupId, filterId);
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
      await this.web3.priv.uninstallFilter(privacyGroupId, filterId);
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

class PubSubSubscription extends SubscriptionManager {
  constructor(subscription) {
    super(subscription);
  }

  async subscribe(privacyGroupId, filter) {
    const websocketProvider = this.web3.currentProvider;

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

    this.subscription.filterId = await this.web3.priv.subscribe(privacyGroupId, 'logs', filter);
  }

  async getPastLogs() {
    return [];
  }

  async unsubscribe(privacyGroupId, filterId, callback) {
    try {
      const result = await this.web3.priv.unsubscribe(privacyGroupId, filterId);
      this.subscription.reset();
      if (callback) callback(null, result);
      return result;
    } catch (error) {
      if (callback) callback(error);
      return error;
    }
  }
}

class PrivateSubscription extends EventEmitter {
  constructor(web3, privacyGroupId, filter) {
    super();
    this.privacyGroupId = privacyGroupId;
    this.filter = filter;
    this.web3 = web3;
    this.filterId = null;
    this.getPast = false;

    const providerType = web3.currentProvider.constructor.name;
    if (providerType === 'HttpProvider') {
      this.protocol = Protocol.HTTP;
      this.manager = new PollingSubscription(this, this.web3.priv.subscriptionPollingInterval);
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

module.exports = {
  PrivateSubscription
};
