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
import Web3 from 'web3';
import { PrivPlugin } from '../../../src';
import { enclave, network } from '../../resources/keys.js';
import { Common, Transaction } from 'web3-eth-accounts';
import { generatePrivacyGroup } from '../../../src/util';
import PromisePool from 'async-promise-pool';

const web3 = new Web3(network.node1.url);
web3.registerPlugin(new PrivPlugin());

/*
  Transactions are sent in batches.
  TX_COUNT defines the total of transactions
*/
const TX_COUNT = 10;
const BATCH_SIZE = 5;

// options used to create a privacy group with only one member
const privacyOptions = {
  privateFrom: enclave.node1.publicKey,
  privateFor: [enclave.node1.publicKey],
  privateKey: network.node1.privateKey
};

const deployContractData =
  '0x608060405234801561001057600080fd5b5060405161018e38038061018e8339818101604052602081101561003357600080fd5b8101908080519060200190929190505050806000819055507f85bea11d86cefb165374e0f727bacf21dc2f4ea816493981ecf72dcfb212a410816040518082815260200191505060405180910390a15060fd806100916000396000f3fe6080604052348015600f57600080fd5b506004361060325760003560e01c806360fe47b11460375780636d4ce63c146062575b600080fd5b606060048036036020811015604b57600080fd5b8101908080359060200190929190505050607e565b005b606860bf565b6040518082815260200191505060405180910390f35b806000819055507f85bea11d86cefb165374e0f727bacf21dc2f4ea816493981ecf72dcfb212a410816040518082815260200191505060405180910390a150565b6000805490509056fea265627a7a723158207735a32daa767059dd230ee7718eb7f09ff35ca8ba54249b53ea1c2e12b98f8564736f6c634300051100320000000000000000000000000000000000000000000000000000000000000001';

// get nonce of account in the privacy group
async function getPrivateNonce(account: string) {
  return web3.priv.getTransactionCount(account, generatePrivacyGroup(privacyOptions));
}

// get public nonce of account
async function getPublicNonce(account: string) {
  return web3.eth.getTransactionCount(account, 'pending');
}

// distribute payload to participants
async function distributePayload(payload, nonce: bigint) {
  return web3.priv.generateAndDistributeRawTransaction({
    ...privacyOptions,
    data: payload,
    nonce
  });
}

// create and sign PMT
function sendPMT(sender: string, enclaveKey: string, nonce: bigint) {
  const rawTx = {
    nonce: web3.utils.numberToHex(nonce), // PMT nonce
    from: sender,
    to: '0x000000000000000000000000000000000000007e', // privacy precompile address
    data: enclaveKey,
    gasLimit: '0x5a88'
  };

  const tx = new Transaction(rawTx, {
    common: Common.custom({ chainId: 1337 })
  });

  const signedTx = tx.sign(Buffer.from(network.node1.privateKey, 'hex'));
  const hexTx = signedTx.serialize();

  // eslint-disable-next-line promise/avoid-new
  return new Promise((resolve, reject) => {
    web3.eth
      .sendSignedTransaction(hexTx)
      .once('receipt', (rcpt) => {
        resolve(rcpt);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}

function printPrivTxDetails(pmtRcpt) {
  return web3.priv.waitForTransactionReceipt(pmtRcpt.transactionHash).then((privTxRcpt) => {
    console.log(
      `=== Private TX ${privTxRcpt.transactionHash}\n` +
        `  > Status ${privTxRcpt.status}\n` +
        `  > Block #${pmtRcpt.blockNumber}\n` +
        `  > PMT Index #${pmtRcpt.transactionIndex}\n` +
        `  > PMT Hash ${pmtRcpt.transactionHash}\n`
    );
    // eslint-disable-next-line promise/no-return-wrap
    return Promise.resolve();
  });
}

/*
  Example of sending private transactions in batch.
  
  The basic steps are:
  
  1. Find the expected public and private nonce for the sender account
  2. Ditribute the private transaction (incrementing the private nonce)
  3. Create a PMT for each private transaction (incrementing the public nonce)
*/
module.exports = async () => {
  const sender = '0xfe3b557e8fb62b89f4916b721be55ceb828dbd73';

  const privateNonce = await getPrivateNonce(sender);
  const publicNonce = await getPublicNonce(sender);

  const pool = new PromisePool({ concurrency: BATCH_SIZE });

  for (let i = 0; i < TX_COUNT; i += 1) {
    pool.add(() => {
      return distributePayload(deployContractData, BigInt(privateNonce + i))
        .then((enclaveKey) => {
          return sendPMT(sender, enclaveKey, publicNonce + BigInt(i));
        })
        .then(printPrivTxDetails);
    });
  }

  await pool.all();
};

if (require.main === module) {
  module.exports().catch((error) => {
    console.error(error);
    console.log('\nThis example requires ONCHAIN privacy to be DISABLED. \nCheck config for ONCHAIN privacy groups.');
  });
}
