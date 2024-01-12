const dynamo = require('../../../src/data/dynamo');
const { BAD_REQUEST} = require('http-status-codes');
const announcementDao = require('../../../src/data/announcementsDao');
const dynamoTestUtils = require('./dynamoTestUtils');
jest.mock('../../../src/data/dynamo');

const today = new Date().toISOString();
const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);
const yesterday = new Date(today);
yesterday.setDate(yesterday.getDate() - 1);

const announcements = [
    {
        title: "Last",
        startAt: "2020-06-04T00:0:00.000Z",
        endAt: "2020-07-21T00:0:00.000Z",
        text: "This is a test alert",
        createdAt: "2020-06-04T05:52:40.368Z",
        updatedAt: "2020-06-04T05:52:40.368Z"
    },
    {
        title: "TEST ANNOUNCEMENT2",
        startAt: "2020-06-04T00:0:00.000Z",
        endAt: "2020-07-19T00:0:00.000Z",
        text: "This is a test alert",
        createdAt: "2020-06-04T05:52:40.368Z",
        updatedAt: "2020-06-04T05:52:40.368Z"
    },
    {
        title: "TEST ANNOUNCEMENT3",
        startAt: "2020-07-21T00:0:00.000Z",
        endAt: "2020-07-22T00:0:00.000Z",
        text: "This is a test alert",
        createdAt: "2020-06-04T05:52:40.368Z",
        updatedAt: "2020-06-04T05:52:40.368Z"
    }]

describe('announcementDao tests', () => {
    const someError = new Error('someError')

    it('should save an announcement', async () => {
        const create = jest.fn();
        dynamo.define.mockReturnValue({create});
        const announcement = { title: 'Test', startAt: today };
        await announcementDao.saveAnnouncement(announcement);
        expect(create).toBeCalledWith(announcement);
    });

    it('should get announcements', async () => {
        const keys = ['where', 'lte', 'where', 'gte', 'exec', 'promise', 'collectItems'];
        const scan = dynamoTestUtils.createFunction(keys, announcements);
        dynamo.define.mockReturnValue({scan});

        const results = await announcementDao.getAnnouncements();

        expect(results).toEqual(announcements)
    });

    it('should fail to get announcements', () => {
        const keys = ['where', 'lte', 'where', 'gte', 'exec', 'promise'];
        const scan = dynamoTestUtils.createFunction(keys, Promise.reject(someError));

        dynamo.define.mockReturnValue({scan});

        const results = announcementDao.getAnnouncements();
        return expect(results).rejects.toThrow(new Error("failed to retrieve announcements"))
    });

    it('should get announcements range', async () => {
        const keys = ['where', 'gte', 'where', 'lte', 'exec', 'promise', 'collectItems'];
        const scan = dynamoTestUtils.createFunction(keys, announcements);
        dynamo.define.mockReturnValue({scan});

        const results = await announcementDao.getAnnouncementsRange(yesterday, tomorrow);

        expect(results).toEqual(announcements)
    });

    it('should fail to get announcements range', () => {
        const keys = ['where', 'gte', 'where', 'lte', 'exec', 'promise'];
        const scan = dynamoTestUtils.createFunction(keys, Promise.reject(someError));
        dynamo.define.mockReturnValue({scan});

        const results = announcementDao.getAnnouncementsRange(yesterday, tomorrow);

        return expect(results).rejects.toThrow(new Error("failed to retrieve announcements"))
    });

    it('should fail to get announcements range with BAD REQUEST', () => {
        const keys = ['where', 'gte', 'where', 'lte', 'exec', 'promise'];
        const someErrorBadRequestAnnouncements = new Error('failed to retrieve announcements');
        someErrorBadRequestAnnouncements.statusCode = BAD_REQUEST;
        const scan = dynamoTestUtils.createFunction(keys, Promise.reject(someErrorBadRequestAnnouncements));
        dynamo.define.mockReturnValue({scan});

        const results = announcementDao.getAnnouncementsRange(yesterday, tomorrow);

        return expect(results).rejects.toThrow(someErrorBadRequestAnnouncements);
    });
})
