const { BAD_REQUEST, FORBIDDEN } = require('http-status-codes');
const announcementService = require('../../../src/services/announcementService');
const announcementDao = require('../../../src/data/announcementsDao')

jest.mock('../../../src/data/announcementsDao');

const today = new Date().toISOString();
const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);
const yesterday = new Date(today);
yesterday.setDate(yesterday.getDate() - 1);

describe('announcementService tests', () => {
    it('should get an array of announcements', async () => {
        const expectedResult = [{title: 'Announcement', startAt: today}];
        announcementDao.getAnnouncements.mockResolvedValue(expectedResult);

        const results = await announcementService.getAnnouncements();

        expect(results).toEqual(expectedResult);
    })

    it('should get an array of announcements between date', async () => {
        const expectedResponse = [
            {title: 'Announcement', startAt: yesterday, endAt: tomorrow},
            {title: 'Announcement2', startAt: yesterday, endAt: tomorrow}
        ];
        announcementDao.getAnnouncementsRange.mockResolvedValue(expectedResponse);

        const actualResponse = await announcementService.getAnnouncements(yesterday, tomorrow);

        expect(actualResponse).toEqual(expectedResponse);
    })

    it('should fail to get an array of announcements if missing startAt', () => {
        const expectedError = new Error("Invalid query parameters, valid parameters include start and end or no query parameters")

        const actualResponse = announcementService.getAnnouncements(yesterday);
        return expect(actualResponse).rejects.toThrow(expectedError);
    })

    it('should save an announcement if JDCatalog:admin scope', async () => {
        const announcement = {title: "TestAnnouncement", startAt: today, endAt: today, text: "Maintenance"}
        const user = {isAdmin: true}
        const expectedResult = {...announcement, createdAt: today, updatedAt: today}

        await announcementService.saveAnnouncement(announcement, user, today);

        expect(announcementDao.saveAnnouncement).toBeCalledWith(expectedResult);
    })

    it('should not save an announcement when user is not an admin', () => {
        const user = {isAdmin: false}
        const expectedError = new Error("Permission denied")
        expectedError.statusCode = FORBIDDEN;

        const actualResponse =  announcementService.saveAnnouncement({}, user, today);

        return expect(actualResponse).rejects.toThrow(expectedError);
    })

    it('should send a bad request response when a required field is missing', () => {
        const missingStartAtAnnouncement = {title: "TestAnnouncement",  endAt: today, text: "Maintenance"}
        const user = {isAdmin: true}
        const expectedError = new Error("child \"startAt\" fails because [\"startAt\" is required]")
        expectedError.statusCode = FORBIDDEN;

        const actualResponse = announcementService.saveAnnouncement(missingStartAtAnnouncement, user, today);

        return expect(actualResponse).rejects.toThrow(expectedError);
    })
})
