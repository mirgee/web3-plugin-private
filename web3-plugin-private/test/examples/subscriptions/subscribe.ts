import { PrivPlugin } from '../../../src/index';
import Web3 from 'web3';
import params from './params.json';

async function run() {
  const web3 = new Web3('http://127.0.0.1:20000');
  web3.registerPlugin(new PrivPlugin());

  const { privacyGroupId, contractAddress: address, blockNumber } = params;

  const filter = {
    address,
    fromBlock: blockNumber
  };

  const { subscription } = await web3.priv.subscribeWithPooling(privacyGroupId, filter);

  process.on('SIGINT', async () => {
    console.log('unsubscribing');
    await subscription.unsubscribe((error, success) => {
      if (!error) {
        console.log('Unsubscribed:', success);
      } else {
        console.log('Failed to unsubscribe:', error);
      }
    });
  });

  subscription
    .on('data', (log) => {
      console.log('LOG =>', log);
    })
    .on('error', console.error);
}

run();
