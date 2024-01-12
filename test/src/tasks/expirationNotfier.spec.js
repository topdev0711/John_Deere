const notifier = require('../../../src/tasks/expirationNotifier');
const permissionService = require('../../../src/services/permissionService');
const notificationService = require('../../../src/services/notificationService');

jest.mock('../../../src/services/permissionService');
jest.mock('../../../src/services/notificationService');

describe('expirationNotifier test suite', () => {
  const now = new Date();
  const earlyThisMorning = new Date(now.getFullYear(),now.getMonth(),now.getDate(),0,0,0,0);
  const laterToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes() + 5, now.getSeconds(), now.getMilliseconds() + 1);
  const yesterdayMorning = new Date(now.getFullYear(),now.getMonth(),now.getDate()-1,0,1,0,0);
  const tomorrowMorning = new Date(now.getFullYear(),now.getMonth(),now.getDate()+1,0,0,0,0);
  const oneYearFromNow = new Date(now.getFullYear()+1, 1, 1,1,0,0,0);
  const twoYearsFromNow = new Date(now.getFullYear()+2, 1, 1,1,0,0,0);

  beforeEach(() => {
    permissionService.getLatestPermissions.mockResolvedValue([
      {id: '1', version: 1, startDate: '2019-02-09T19:21:09.838Z', endDate: '2019-02-10T00:00:00.000Z'},
      {id: '2', version: 1, startDate: oneYearFromNow.toISOString(), endDate: twoYearsFromNow.toISOString()},
      {id: '3', version: 1, startDate: '2019-02-10T19:21:09.838Z', endDate: now.toISOString()},
      {id: '4', version: 1, startDate: earlyThisMorning.toISOString(), endDate: undefined},
      {id: '5', version: 1, startDate: '2019-05-13T19:21:08.838Z', endDate: earlyThisMorning},
      {id: '6', version: 1, startDate: yesterdayMorning.toISOString(), endDate: undefined},
      {id: '7', version: 1, startDate: laterToday.toISOString(), endDate: undefined},
      {id: '8', version: 1, startDate: tomorrowMorning.toISOString(), endDate: undefined},
      {id: '9', version: 1, startDate: '2019-02-09T19:21:09.838Z', endDate: tomorrowMorning.toISOString()}
    ]);
    
    notificationService.sendPermissionNotification.mockImplementation((id, version) => Promise.resolve({id, version}));
  })

  it('should send appropriate messages (dates not effective yet or newly effective in last 24 hours)', async () => {
    const result = await notifier.run();
    console.log(laterToday);
    expect(result).toEqual([
      {id: '3', version: 1},
      {id: '4', version: 1},
      {id: '5', version: 1},
      {id: '7', version: 1}
    ]);
  });

  it('should send all notifications that have been enddated or activated up to this point', async () => {
    const result = await notifier.run(true);

    expect(result).toEqual([
      {id: '1', version: 1},
      {id: '3', version: 1},
      {id: '4', version: 1},
      {id: '5', version: 1},
      {id: '6', version: 1},
      {id: '7', version: 1},
      {id: '9', version: 1}
    ]);
  });
});