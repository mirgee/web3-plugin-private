import { Web3 } from 'web3';
import { PrivPlugin } from '../../../src/index';
import { network } from '../../resources/keys';
import params from './params.json';

async function run() {
  const web3 = new Web3(network.node1.url);
  web3.registerPlugin(new PrivPlugin());

  const logs = await web3.priv.getLogs(params.privacyGroupId, { addresses: [params.contractAddress] });
  console.log('logs', logs);
}

run();
