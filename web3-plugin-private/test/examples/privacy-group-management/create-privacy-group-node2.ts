import Web3 from 'web3';
import { PrivPlugin } from '../../../src';
import { enclave, network } from '../../resources/keys.js';

const web3 = new Web3(network.node1.url);
web3.registerPlugin(new PrivPlugin());

export async function createPrivacyGroupForNode23() {
  const contractOptions = {
    addresses: [enclave.node2.publicKey, enclave.node3.publicKey],
    name: 'web3js-quorum',
    description: 'test'
  };
  return web3.priv.createPrivacyGroup(...contractOptions).then((result) => {
    console.log(`The privacy group created is:`, result);
    return result;
  });
}

export default {
  createPrivacyGroupForNode23
};

if (require.main === module) {
  createPrivacyGroupForNode23();
}
