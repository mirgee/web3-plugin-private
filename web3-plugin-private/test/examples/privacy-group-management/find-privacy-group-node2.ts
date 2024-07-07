import Web3 from 'web3';
import { PrivPlugin } from '../../../src';
import { network, enclave } from '../../resources/keys.js';

const web3 = new Web3(network.node1.url);
web3.registerPlugin(new PrivPlugin());

export async function findPrivacyGroupForNode23() {
  const result = await web3.priv.findPrivacyGroup([enclave.node2.publicKey, enclave.node3.publicKey]);
  console.log(`The privacy groups found are:`, result);
  return result;
}

export default {
  findPrivacyGroupForNode23
};

if (require.main === module) {
  findPrivacyGroupForNode23();
}
