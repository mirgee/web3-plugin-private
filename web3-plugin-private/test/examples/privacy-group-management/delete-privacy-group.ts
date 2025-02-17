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
import { network } from '../../resources/keys.js';

const web3 = new Web3(network.node1.url);
web3.registerPlugin(new PrivPlugin());

export async function deletePrivacyGroup(givenPrivacyGroupId: string) {
  return web3.priv.deletePrivacyGroup(givenPrivacyGroupId).then((result) => {
    console.log(`The privacy group deleted is:`, result);
    return result;
  });
}

if (require.main === module) {
  if (!process.env.PRIVACY_GROUP_TO_DELETE) {
    throw Error(
      "You need to export the following variable in your shell environment: PRIVACY_GROUP_TO_DELETE="
    );
  }

  const privacyGroupId = process.env.PRIVACY_GROUP_TO_DELETE;
  deletePrivacyGroup(privacyGroupId).catch((error) => {
    console.log(error);
    console.log(
      `\nAttempted to delete PRIVACY_GROUP_TO_DELETE=${privacyGroupId}`
    );
    console.log("You may need to update PRIVACY_GROUP_TO_DELETE");
  });
}

export default {
  deletePrivacyGroup
};

