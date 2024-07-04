export const Protocol = {
  HTTP: 'HTTP',
  WEBSOCKET: 'WebSocket'
};

export const Event = {
  CONNECTED: 'connected',
  DATA: 'data',
  ERROR: 'error'
};

export class SubscriptionManager {
  constructor(subscription) {
    this.subscription = subscription;
    this.web3Plugin = subscription.web3Plugin;
  }
}
