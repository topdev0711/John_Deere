import {shallow} from 'enzyme';
import Header from "../../components/Header";

const announcementRecords = [
  {
    title: "Last",
    startAt: "2020-06-04T00:00:00.000Z",
    endAt: "2050-07-21T00:00:00.000Z",
    text: "This is a test alert",
    createdAt: "2020-06-04T05:52:40.368Z",
    updatedAt: "2020-06-04T05:52:40.368Z"
  }];

describe('Header tests', () => {
  it('should show announcements button', () => {
    const header = shallow(<Header announcements={announcementRecords}/>)
    expect(header.exists('AnnouncementButton')).toEqual(true)
  });

  it('should show not announcements button', () => {
    const header = shallow(<Header />)
    expect(header.exists('AnnouncementButton')).toEqual(false)
  });
});
