import {shallow} from 'enzyme';
import {Button} from "react-bootstrap";
import AnnouncementsModal from "../../components/AnnouncementsModal";

const announcementRecords = [
  {
    title: "Last",
    startAt: "2020-06-04T00:00:00.000Z",
    endAt: "2020-07-21T00:00:00.000Z",
    text: "This is a test alert",
    createdAt: "2020-06-04T05:52:40.368Z",
    updatedAt: "2020-06-04T05:52:40.368Z"
  },
  {
    title: "TEST ANNOUNCEMENT2",
    startAt: "2020-06-04T00:00:00.000Z",
    endAt: "2020-07-19T00:00:00.000Z",
    text: "This is a test alert",
    createdAt: "2020-06-04T05:52:40.368Z",
    updatedAt: "2020-06-04T05:52:40.368Z"
  },
  {
    title: "TEST ANNOUNCEMENT3",
    startAt: "2020-07-21T00:00:00.000Z",
    endAt: "2020-07-22T00:00:00.000Z",
    text: "This is a test alert",
    createdAt: "2020-06-04T05:52:40.368Z",
    updatedAt: "2020-06-04T05:52:40.368Z"
  }]

describe('Announcement modal tests', () => {
  it('clicking the button hides modal', () => {
    let showAnnouncements = true;
    const setShowAnnouncements = value => showAnnouncements = value
    const announcements = shallow(<AnnouncementsModal announcements={announcementRecords} showAnnouncements={showAnnouncements} setShowAnnouncements={setShowAnnouncements}/>)

    const button = announcements.find(Button);
    button.simulate('click');

    expect(showAnnouncements).toEqual(false);
  });

  it('displays the correct number of announcements', () => {
    let showAnnouncements = true;
    const setShowAnnouncements = value => showAnnouncements = value
    const announcements = shallow(<AnnouncementsModal announcements={announcementRecords} showAnnouncements={showAnnouncements} setShowAnnouncements={setShowAnnouncements}/>)
    expect(announcements.find('Announcement').length).toEqual(3);
  });
});
