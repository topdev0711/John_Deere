const announcementModel = require('../../../src/model/announcementModel');

describe('announcementModel tests', () => {
  it('should be a valid model', async() => {
    const actualResponse = await announcementModel.validate({
      "title": "TEST ANNOUNCEMENT",
      "startAt": "2020-06-04T00:00:00.000Z",
      "endAt": "2020-07-21T00:00:00.000Z",
      "text": "This is a test alert",
      "createdAt": "2020-06-04T05:52:40.368Z",
      "updatedAt": "2020-06-04T05:52:40.368Z"
    });

    expect(actualResponse).toEqual(undefined);
  });

  it('should not be a valid model', () => {
    const missingStartAtAnnouncement = {title: "TestAnnouncement",  endAt: '2020-06-04T00:00:00.000Z', text: "Maintenance"}
    const expectedError = new Error("child \"startAt\" fails because [\"startAt\" is required]")

    const actualResponse = () => { announcementModel.validate(missingStartAtAnnouncement) };

    return expect(actualResponse).toThrow(expectedError);
  });

  it('should not be a valid model if bad date format', () => {
    const badStartDateAtAnnouncement = {startAt: "Bad Date", title: "TestAnnouncement",  endAt: '2020-06-04T00:00:00.000Z', text: "Maintenance"}
    const expectedError = new Error('child \"startAt\" fails because [\"startAt\" must be a string with one of the following formats [YYYY-MM-DDTHH:mm:ss.sssZ]]')

    const actualResponse = () => { announcementModel.validate(badStartDateAtAnnouncement) };

    return expect(actualResponse).toThrow(expectedError);
  });

})
