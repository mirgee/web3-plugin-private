import { Contract, Web3 } from 'web3';
import { PrivPlugin } from '../../../src/index';
import { network, enclave } from '../../resources/keys';
import fs from 'fs';
import path from 'path';
import params from './params.json';

const artifact = fs.readFileSync(path.join(__dirname, '../../resources/solidity/EventEmitter/EventEmitter.json'));
const { abi } = JSON.parse(artifact.toString()).output;

async function run() {
  const web3 = new Web3(network.node1.url);
  web3.registerPlugin(new PrivPlugin());

  const contract = new Contract(abi);

  const txHash = await web3.priv.generateAndSendRawTransaction({
    to: params.contractAddress,
    data: contract.methods.store(12).encodeABI(),
    privateFrom: enclave.node1.publicKey,
    privacyGroupId: params.privacyGroupId,
    privateKey: network.node1.privateKey
  });
  const receipt = await web3.priv.waitForTransactionReceipt(txHash);
  console.log('tx sent', receipt);

  const raw = await web3.priv.call(
    params.privacyGroupId,
    {
      to: params.contractAddress,
      data: contract.methods.value().encodeABI()
    },
    'latest'
  );
  console.log('raw', raw);
  const value = await web3.eth.abi.decodeParameter('uint256', raw);
  console.log('obtained value', value);
}

run();
