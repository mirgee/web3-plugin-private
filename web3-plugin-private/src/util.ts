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
import { Buffer } from 'buffer';
import { RLP } from '@ethereumjs/rlp';
import { keccak256 } from 'ethereum-cryptography/keccak';

export function hexToBase64(str: string) {
  return Buffer.from(str, 'hex').toString('base64');
}

export function base64toHex(str: string) {
  return Buffer.from(str, 'base64').toString('hex');
}

export function waitForTransactionWithRetries(operation, txHash, retries, delay) {
  /* eslint-disable promise/param-names */
  /* eslint-disable promise/avoid-new */

  const waitFor = (ms) => {
    return new Promise((r) => {
      return setTimeout(r, ms);
    });
  };

  let notified = false;
  const retryOperation = (operationToRetry, times) => {
    return new Promise((resolve, reject) => {
      return operationToRetry()
        .then((result) => {
          if (result == null) {
            if (!notified) {
              console.log('Waiting for transaction to be mined ...');
              notified = true;
            }
            if (delay === 0) {
              throw new Error(`Timed out after ${retries} attempts waiting for transaction to be mined`);
            } else {
              const waitInSeconds = (retries * delay) / 1000;
              throw new Error(`Timed out after ${waitInSeconds}s waiting for transaction to be mined`);
            }
          } else {
            return resolve(result);
          }
        })
        .catch((reason) => {
          if (times - 1 > 0) {
            // eslint-disable-next-line promise/no-nesting
            return waitFor(delay)
              .then(retryOperation.bind(null, operationToRetry, times - 1))
              .then(resolve)
              .catch(reject);
          }
          return reject(reason);
        });
    });
  };

  return retryOperation(operation, retries);
}

export function generatePrivacyGroup(options: { privateFor?: string[]; privateFrom: string | string[] }): string {
  const { privateFor = [], privateFrom } = options;

  let uniq: string[];
  if (typeof privateFrom === 'string') {
    uniq = [...new Set([...privateFor, privateFrom])]
  } else if (Array.isArray(privateFrom)) {
    uniq = [...new Set([...privateFor, ...privateFrom])]
  }

  const participants = uniq
    .map((publicKey) => {
      const buffer = Buffer.from(publicKey, 'base64');
      let result = 1;
      buffer.forEach((value) => {
        result = (31 * result + ((value << 24) >> 24)) & 0xffffffff;
      });
      return { b64: publicKey, buf: buffer, hash: result };
    })
    .sort((a, b) => a.hash - b.hash)
    .map((x) => x.buf);

  const rlp = RLP.encode(participants);

  return Buffer.from(keccak256(rlp)).toString('base64');
}
