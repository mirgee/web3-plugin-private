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
import { Web3 } from 'web3';
import { PrivPlugin } from '../../../src/index';
import { network, enclave } from '../../resources/keys';

import fs from 'fs';
import path from 'path';

const bytecode = fs.readFileSync(path.join(__dirname, '../../resources/solidity/EventEmitter/EventEmitter.bin'));

async function run() {
  const web3 = new Web3(network.node1.url);
  web3.registerPlugin(new PrivPlugin());

  const addresses = [enclave.node1.publicKey, enclave.node2.publicKey];
  const privacyGroupId = await web3.priv.createPrivacyGroup({ addresses });
  console.log('Created privacy group', privacyGroupId);
  const txHash = await web3.priv.generateAndSendRawTransaction({
    data: `0x${bytecode}`,
    privateFrom: enclave.node1.publicKey,
    privacyGroupId,
    privateKey: network.node1.privateKey
  });

  const deployReceipt = await web3.priv.waitForTransactionReceipt(txHash);

  const { contractAddress, blockNumber } = deployReceipt;
  console.log('deployed', contractAddress);

  const params = {
    privacyGroupId,
    contractAddress,
    blockNumber
  };

  fs.writeFileSync(path.join(__dirname, 'params.json'), JSON.stringify(params));
}

run();
