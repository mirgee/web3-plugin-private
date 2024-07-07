import { Common, Hardfork, toUint8Array, Transaction, unpadUint8Array } from 'web3-eth-accounts';
import { PrivateTransaction } from '../../src/index';
import { bytesToHex, uint8ArrayEquals, utf8ToBytes } from 'web3-utils';
import txFixtures from './fixtures/txs.json';
import { base64ToUint8Array } from '../../src/utils';
import { hexToBytes } from 'ethereum-cryptography/utils';
import { PrivateTxValuesArray } from '../../src/types';

const mapToUintArray = (hexStringOrArray: string | Array<string>) => {
  if (typeof hexStringOrArray === 'string') {
    return toUint8Array(hexStringOrArray);
  } else {
    return hexStringOrArray.map(toUint8Array);
  }
};

describe('[Transaction]: Basic functions', () => {
  const transactions: PrivateTransaction[] = [];

  it('decode with fromValuesArray()', () => {
    for (const tx of txFixtures.slice(0, 4)) {
      const txData = tx.raw.map(mapToUintArray);
      const pt = PrivateTransaction.fromValuesArray(txData as PrivateTxValuesArray);

      expect(bytesToHex(unpadUint8Array(toUint8Array(pt.nonce)))).toEqual(tx.raw[0]);
      expect(bytesToHex(toUint8Array(pt.gasPrice))).toEqual(tx.raw[1]);
      expect(bytesToHex(toUint8Array(pt.gasLimit))).toEqual(tx.raw[2]);
      if (!!pt.to) {
        expect(pt.to?.toString()).toEqual(tx.raw[3]);
      }
      expect(bytesToHex(unpadUint8Array(toUint8Array(pt.value)))).toEqual(tx.raw[4]);
      expect(bytesToHex(pt.data)).toEqual(tx.raw[5]);
      expect(bytesToHex(toUint8Array(pt.v))).toEqual(tx.raw[6]);
      expect(bytesToHex(toUint8Array(pt.r))).toEqual(tx.raw[7]);
      expect(bytesToHex(toUint8Array(pt.s))).toEqual(tx.raw[8]);
      expect(bytesToHex(base64ToUint8Array(pt.privateFrom))).toEqual(tx.raw[9]);
      for (let i = 0; i < pt.privateFor.length; i++) {
        expect(bytesToHex(base64ToUint8Array(pt.privateFor[i]))).toEqual(tx.raw[10][i]);
      }
      expect(bytesToHex(utf8ToBytes(pt.restriction))).toEqual(tx.raw[11]);

      transactions.push(pt);
    }
  });

  it('should decode rlp', () => {
    transactions.forEach((tx, i) => {
      expect(tx.serialize()).toEqual(PrivateTransaction.fromSerializedTx(hexToBytes(txFixtures[i].rlp)).serialize());
    });
  });

  it('should serialize', () => {
    transactions.forEach((tx, i) => {
      uint8ArrayEquals(tx.serialize(), hexToBytes(txFixtures[i].rlp));
    });
  });

  it('should sign tx', () => {
    transactions.forEach((tx, i) => {
      const privKey = Buffer.from(txFixtures[i].privateKey, 'hex');
      expect(() => {
        tx.sign(privKey);
      }).not.toThrowError();
    });
  });

  it('should get sender\'s address after signing it', () => {
    const common = new Common({ chain: 1, hardfork: Hardfork.Petersburg });
    for (const txData of txFixtures.slice(0, 3)) {
      // @ts-ignore: ignore type mismatch error
      const tx = Transaction.fromValuesArray(txData.raw.slice(0, 6).map(mapToUintArray), {
        common
      });

      const privKey = hexToBytes(txData.privateKey);
      const txSigned = tx.sign(privKey);

      expect(txSigned.getSenderAddress().toString()).toBe(`0x${txData.sendersAddress}`);
    }
  });
});
