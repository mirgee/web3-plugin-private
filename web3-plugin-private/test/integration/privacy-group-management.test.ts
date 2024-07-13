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
import createGroup from '../examples/privacy-group-management/create-privacy-group';
import findGroup from '../examples/privacy-group-management/find-privacy-group';
import deleteGroup from '../examples/privacy-group-management/delete-privacy-group';

describe('[MultiNodeExample]: Can manage privacy groups', () => {
  it('can create and find privacy group', async () => {
    const createdGroupId = await createGroup.createPrivacyGroup();
    const returnedPrivacyGroup = await findGroup.findPrivacyGroup();
    const listWithPrivacyGroup = returnedPrivacyGroup.filter((i) => {
      return i.privacyGroupId === createdGroupId;
    });

    expect(createdGroupId).toEqual(listWithPrivacyGroup[0].privacyGroupId);
  });

  it('can create, find and delete privacy group', async () => {
    const createdGroupId = await createGroup.createPrivacyGroup();

    let returnedPrivacyGroup = await findGroup.findPrivacyGroup();

    const listWithPrivacyGroup = returnedPrivacyGroup.filter((i) => {
      return i.privacyGroupId === createdGroupId;
    });

    expect(createdGroupId).toEqual(listWithPrivacyGroup[0].privacyGroupId);

    const deletedGroup = await deleteGroup.deletePrivacyGroup(createdGroupId);

    expect(deletedGroup).toEqual(createdGroupId);

    returnedPrivacyGroup = await findGroup.findPrivacyGroup();

    const listWithPrivacyGroupAfterDelete = returnedPrivacyGroup.filter((i) => {
      return i.privacyGroupId === deletedGroup;
    });

    expect(listWithPrivacyGroupAfterDelete).toHaveLength(0);
  });

  it('create twice and delete once', async () => {
    const newPrivacyGroup1 = await createGroup.createPrivacyGroup();
    const newPrivacyGroup2 = await createGroup.createPrivacyGroup();

    let privacyGroupList = await findGroup.findPrivacyGroup();

    let newListWithPrivacyGroup1 = privacyGroupList.filter((i) => {
      return i.privacyGroupId === newPrivacyGroup1;
    });

    expect(newListWithPrivacyGroup1).toHaveLength(1);

    let newListWithPrivacyGroup2 = privacyGroupList.filter((i) => {
      return i.privacyGroupId === newPrivacyGroup2;
    });

    expect(newListWithPrivacyGroup2).toHaveLength(1);

    const deletedGroup = await deleteGroup.deletePrivacyGroup(newPrivacyGroup1);

    expect(deletedGroup).toEqual(newPrivacyGroup1);

    privacyGroupList = await findGroup.findPrivacyGroup();

    newListWithPrivacyGroup1 = privacyGroupList.filter((i) => {
      return i.privacyGroupId === newPrivacyGroup1;
    });

    expect(newListWithPrivacyGroup1).toHaveLength(0);

    newListWithPrivacyGroup2 = privacyGroupList.filter((i) => {
      return i.privacyGroupId === newPrivacyGroup2;
    });

    expect(newListWithPrivacyGroup2).toHaveLength(1);
  });
});
