import { Contract, Web3 } from 'web3';
import { PrivPlugin } from '../../src/index';
import { network, enclave } from './keys';

import sleep from 'sleep-promise';

import fs from 'fs';
import path from 'path';
import { padToEven, stripHexPrefix, toUint8Array } from 'web3-eth-accounts';
import { hexToBytes } from 'web3-utils';

const artifact = fs.readFileSync(path.join(__dirname, './solidity/EventEmitter/EventEmitter.json'));
const bytecode = fs.readFileSync(path.join(__dirname, './solidity/EventEmitter/EventEmitter.bin'));
const { abi } = JSON.parse(artifact.toString()).output;

describe('basic test', () => {
  let web3: Web3;
  let params: {
    privacyGroupId: string;
    contractAddress: string;
    blockNumber: string;
  };

  beforeAll(async () => {
    web3 = new Web3('http://127.0.0.1:20000');
    web3.registerPlugin(new PrivPlugin());

    const addresses = [enclave.node1.publicKey, enclave.node2.publicKey];
    const privacyGroupId = await web3.priv.createPrivacyGroup(addresses);
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

    params = {
      privacyGroupId,
      contractAddress,
      blockNumber
    };
  });

  it('call store method, obtain logs', async () => {
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

    const raw = await web3.priv.call(params.privacyGroupId, {
      to: params.contractAddress,
      data: contract.methods.value().encodeABI()
    }, 'latest');
    console.log('raw', raw);
    const value = await web3.eth.abi.decodeParameter('uint256', raw);
    console.log('obtained value', value);

    const logs = await web3.priv.getLogs(params.privacyGroupId, { addresses: [params.contractAddress] });

    console.log('logs', logs);
  });
});
