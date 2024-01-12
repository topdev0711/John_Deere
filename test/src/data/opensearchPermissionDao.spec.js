/**
 * @jest-environment node
 */

const opensearchPermissionDao = require("../../../src/data/opensearchPermissionDao");
const scenario1Obj = require("./TestData/OpensearchPermissionDaoScenario1.json");
const scenario2Obj = require("./TestData/OpensearchPermissionDaoScenario2.json");
const scenario3Obj = require("./TestData/OpensearchPermissionDaoScenario3.json");

describe("opensearchPermissionDao tests", () => {
  it("should generate params in correct structure to search opensearch", async () => {
    const input = {
      text: "AWS-ISG-BI-DEVELOPERS",
      roleTypes: ["human", "system"],
      subCommunities: ["Metrics"],
    };
    const output = await opensearchPermissionDao.buildFetchQuery(input, 0, 20);
    expect(output).toEqual(scenario1Obj);
  });

  it("should generate params in correct structure to search opensearch - Community", async () => {
    const input = {
      text: "AWS-ISG-BI-DEVELOPERS",
      roleTypes: ["human", "system"],
      communities: ["Manufacturing"],
      'personalInformation': true, 
      'development': true
    };
    const output = await opensearchPermissionDao.buildFetchQuery(input, 0, 20);
    expect(output).toEqual(scenario2Obj);
  });

  it("should generate params in correct structure to search opensearch - access allowed", async () => {
    const input = {
        text: "AWS-ISG-BI-DEVELOPERS",
        roleTypes: ["human", "system"],
        access: true,
      };
    const output = await opensearchPermissionDao.buildFetchQuery(input, 0, 20);
    expect(output).toEqual(scenario3Obj);
  });
});
