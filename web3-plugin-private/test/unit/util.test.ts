import { generatePrivacyGroup } from "../../src/util";
import txFixtures from '../resources/keysets.json'

describe("Utils", () => {
  describe("Privacy Group Generation", () => {
    it("should generate correct privacy group id", () => {
      txFixtures.forEach((pg) => {
        const expected = pg.privacyGroupId;
        const input = pg.privacyGroup;
        expect(generatePrivacyGroup({ privateFrom: input })).toEqual(expected);
      });
    });
  });
});
