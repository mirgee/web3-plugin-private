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
import { PrivPlugin } from '../../src';

import { enclave, network } from '../resources/keys.js';

const deployContractData =
  '0x608060405234801561001057600080fd5b50336000806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff160217905550610221806100606000396000f300608060405260043610610057576000357c0100000000000000000000000000000000000000000000000000000000900463ffffffff1680633fa4f2451461005c5780636057361d1461008757806367e404ce146100b4575b600080fd5b34801561006857600080fd5b5061007161010b565b6040518082815260200191505060405180910390f35b34801561009357600080fd5b506100b260048036038101908080359060200190929190505050610115565b005b3480156100c057600080fd5b506100c96101cb565b604051808273ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200191505060405180910390f35b6000600254905090565b7fc9db20adedc6cf2b5d25252b101ab03e124902a73fcb12b753f3d1aaa2d8f9f53382604051808373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020018281526020019250505060405180910390a18060028190555033600160006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555050565b6000600160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff169050905600a165627a7a723058208efaf938851fb2d235f8bf9a9685f149129a30fe0f4b20a6c1885dc02f639eba0029';


describe("getPrivateTransaction", () => {
  const node2Client = new Web3(new Web3(network.node2.url));
  const node1Client = new Web3(new Web3(network.node1.url));
  const node3Client = new Web3(new Web3(network.node3.url));
  node1Client.registerPlugin(new PrivPlugin());
  node2Client.registerPlugin(new PrivPlugin());
  node3Client.registerPlugin(new PrivPlugin());

  let privacyGroupId: string;
  let publicHash: string;
  beforeAll(async () => {
    // create a privacy group with nodes 1 and 2
    privacyGroupId = await node1Client.priv.createPrivacyGroup({
      addresses: [enclave.node1.publicKey, enclave.node2.publicKey],
    });

    // deploy a contract and get the receipt
    const receipt = await node1Client.priv
      .generateAndSendRawTransaction({
        data: deployContractData,
        privateFrom: enclave.node1.publicKey,
        privacyGroupId,
        privateKey: network.node1.privateKey,
      })
      .then((hash) => {
        return node1Client.priv.waitForTransactionReceipt(hash);
      });
    publicHash = receipt.commitmentHash;
  });

  // group membership
  it("should get tx from originating node", async () => {
    const result = await node1Client.priv.getPrivateTransaction(publicHash);

    expect(result.privateFrom).toEqual(enclave.node1.publicKey);
    expect(result.privacyGroupId).toEqual(privacyGroupId);
  });

  it("should get tx from other member node", async () => {
    const result = await node2Client.priv.getPrivateTransaction(publicHash);

    expect(result.privateFrom).toEqual(enclave.node1.publicKey);
    expect(result.privacyGroupId).toEqual(privacyGroupId);
  });

  it("should get error from non-member node", async () => {
    const result = await node3Client.priv.getPrivateTransaction(publicHash);
    expect(result).toBeNull();
  });

  // inputs
  it("should fail if the transaction hash is invalid", async () => {
    await expect(
      node1Client.priv.getPrivateTransaction(undefined)
    ).rejects.toThrowError("Invalid params");
  });

  it("should return null if the txHash does not exist", async () => {
    const invalidHash =
      "0x0000000000000000000000000000000000000000000000000000000000000000";
    const result = await node3Client.priv.getPrivateTransaction(invalidHash);
    expect(result).toBeNull();
  });
});
