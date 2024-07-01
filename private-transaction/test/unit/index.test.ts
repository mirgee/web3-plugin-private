import { toUint8Array, unpadUint8Array } from 'web3-eth-accounts';
import { PrivateTransaction } from '../../src/index';
import { bytesToHex, utf8ToBytes } from 'web3-utils';
import txFixtures from './fixtures/txs.json';
import { base64ToUint8Array } from '../../src/utils';

describe('[Transaction]: Basic functions', () => {
  const transactions: PrivateTransaction[] = [];

  it('decode with fromValuesArray()', () => {
    for (const tx of txFixtures.slice(0, 4)) {
      const txData = tx.raw.map(toUint8Array);
      const pt = PrivateTransaction.fromValuesArray(txData);

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
      expect(bytesToHex(base64ToUint8Array(pt.privacyGroupId))).toEqual(tx.raw[10]);
      expect(bytesToHex(utf8ToBytes(pt.restriction))).toEqual(tx.raw[11]);
      for (let i = 0; i < pt.privateFor.length; i++) {
        expect(bytesToHex(base64ToUint8Array(pt.privateFor[i]))).toEqual(tx.raw[12 + i]);
      }

      transactions.push(pt);
    }
  });

  // it('should decode rlp', () => {
  //   transactions.forEach((tx, i) => {
  //     expect(transactions[i].serialize()).toEqual(new PrivateTransaction(txFixtures[i].rlp).serialize());
  //   });
  // });
  //
  // it('should serialize', () => {
  //   transactions.forEach((tx, i) => {
  //     expect(`0x${tx.serialize().toString()}`).toEqual(txFixtures[i].rlp);
  //   });
  // });
  //
  // it('should sign tx', () => {
  //   transactions.forEach((tx, i) => {
  //     const privKey = Buffer.from(txFixtures[i].privateKey, 16);
  //     expect(() => {
  //       tx.sign(privKey);
  //     }).not.toThrowError();
  //   });
  // });
  //
  // it("should get sender's address after signing it", () => {
  //   transactions.forEach((tx, i) => {
  //     expect(tx.getSenderAddress().toString()).toEqual(txFixtures[i].sendersAddress);
  //   });
  // });
});
