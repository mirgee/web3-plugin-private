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
import { PrivPlugin } from '../../../src/index';
import Web3 from 'web3';
import params from './params.json';
import { network } from '../../resources/keys';

async function run() {
  const web3 = new Web3(network.node1.url);
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
