const {promises: fs} = require('fs');

describe("Reference Data Validation", () => {
    const getRecords = async fileName => JSON.parse(await fs.readFile(process.cwd() + fileName, 'utf-8'));

    it("should have a community or subCommunity for all approvers", async () => {
        //given
        const communities = await getRecords('/src/data/reference/communities.json');
        const subCommunities = await getRecords('/src/data/reference/subcommunities.json');
        const approvers = await getRecords('/src/data/reference/approvers.json');

        const communityIds = communities.map(community => community.id);
        const subCommunityIds = subCommunities.map(subCommunity => subCommunity.id);
        const allIds = subCommunityIds.concat(...new Set(communityIds));

        const approverIds = approvers.map(approver => approver.id);
        const allApprovalsAreReferenced = approverIds.every(id => allIds.indexOf(id) !== -1);

        //then
        expect(allApprovalsAreReferenced).toEqual(true);
    });
});
