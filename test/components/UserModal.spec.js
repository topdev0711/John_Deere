import { configure, shallow, mount } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import UserModal from '../../components/UserModal';
import { act, waitFor } from '@testing-library/react';
import { Modal } from 'react-bootstrap';
import utils from '../../components/utils';

global.fetch = require('jest-fetch-mock');
jest.mock('../../components/utils.js');
configure({ adapter: new Adapter() });

describe('userModal Test Suite', () => {
  const group = 'some_group';
  const testUsers = [
    {
      id: 1,
      displayName: 'Clark Kent',
      email: 'KentClark@johndeere.com'
    },
    {
      id: 2,
      displayName: 'John Deere',
      email: 'DeereJohn@johndeere.com'
    },
    {
      id: 3,
      displayName: 'John Deere2',
      email: 'DeereJohn@johndeere.com'
    },
    {
      id: 4,
      displayName: 'John Deere3',
      email: 'DeereJohn@johndeere.com'
    },
    {
      id: 5,
      displayName: 'John Deere4',
      email: 'DeereJohn@johndeere.com'
    },
    {
      id: 6,
      displayName: 'John Deere',
      email: 'DeereJohn@johndeere.com'
    },
    {
      id: 7,
      displayName: 'John Deere',
      email: 'DeereJohn@johndeere.com'
    },
    {
      id: 8,
      displayName: 'John Deere',
      email: 'DeereJohn@johndeere.com'
    },
    {
      id: 9,
      displayName: 'John Deere',
      email: 'DeereJohn@johndeere.com'
    },
    {
      id: 10,
      displayName: 'John Deere',
      email: 'DeereJohn@johndeere.com'
    }
  ];

  describe('happy paths', () => {
    beforeEach(() => {
      fetch.mockResponseOnce(JSON.stringify(testUsers));
    })

    afterEach(() => {
      fetch.resetMocks();
    })

    it('should render', () => {
      const wrapper = shallow(<UserModal />);

      expect(wrapper).toBeDefined();
    });

    it('should load users for a groupName', async () => {
      const wrapper = mount(<UserModal groupName={group}/>);
      openModal(wrapper);

      await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));

      expect(fetch).toHaveBeenCalledWith(
          `/api/group/${group}/users`,
          {
            credentials: 'same-origin',
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            }
          }
      );
    });
    it('should display users for a groupName', async () => {
      const wrapper = mount(<UserModal groupName={group}/>);
      openModal(wrapper);

      await waitForFetch(wrapper, 1);

      const modal = wrapper.find(Modal).filterWhere(modal => modal.props().id === `${group}-modal`);
      const body = modal.find('ModalBody');

      expect(body.text()).toContain(testUsers[0].displayName);
      expect(body.text()).toContain(testUsers[1].displayName);
    });

    it('should load more users', async () => {
      const nextUsers = [{ id: 'next', displayName: 'next', email: 'next'}];
      fetch.mockResponseOnce(JSON.stringify(nextUsers));

      const wrapper = mount(<UserModal groupName={group}/>);

      openModal(wrapper);
      await waitForFetch(wrapper, 1);

      loadNext(wrapper);
      await waitForFetch(wrapper, 2);

      expect(fetch).toHaveBeenCalledWith(
          `/api/group/${group}/users?after=${testUsers[testUsers.length - 1].id}`,
          {
            credentials: 'same-origin',
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            }
          }
      )
    });

    it('should load more users and display', async () => {
      const nextUsers = [{ id: 'next', displayName: 'next', email: 'next'}];
      fetch.mockResponseOnce(JSON.stringify(nextUsers));

      const wrapper = mount(<UserModal groupName={group}/>);

      openModal(wrapper);
      await waitForFetch(wrapper, 1);

      loadNext(wrapper);
      await waitForFetch(wrapper, 2);

      const modal = wrapper.find(Modal).filterWhere(modal => modal.props().id === `${group}-modal`);
      const body = modal.find('ModalBody');

      expect(body.text()).toContain(nextUsers[0].displayName);
    });

    it('should disable loading and not show empty array if no more users', async () => {
      fetch.mockResponseOnce(JSON.stringify([]));

      const wrapper = mount(<UserModal groupName={group}/>);

      openModal(wrapper);
      await waitForFetch(wrapper, 1);

      loadNext(wrapper);
      await waitForFetch(wrapper, 2);

      const modal = wrapper.find(Modal).filterWhere(modal => modal.props().id === `${group}-modal`);
      const body = modal.find('ModalBody');
      const loadMore = wrapper.find('Button').filterWhere(button => button.props().id === `${group}-next`);

      expect(body.text()).toContain(testUsers[0].displayName);
      expect(loadMore.props().hidden).toEqual(true);
    });

    it('should load previous users and display', async () => {
      const nextUsers = [{ id: 'next', displayName: 'next', email: 'next'}];
      fetch
          .mockResponseOnce(JSON.stringify(nextUsers))
          .mockResponseOnce(JSON.stringify(testUsers));

      const wrapper = mount(<UserModal groupName={group}/>);

      openModal(wrapper);
      await waitForFetch(wrapper, 1);

      loadNext(wrapper);
      await waitForFetch(wrapper, 2);

      loadPrevious(wrapper);
      await waitForFetch(wrapper, 3);

      const modal = wrapper.find(Modal).filterWhere(modal => modal.props().id === `${group}-modal`);
      const body = modal.find('ModalBody');

      expect(body.text()).toContain(testUsers[0].displayName);
    });
    it('should load previous users', async () => {
      const nextUsers = [{ id: 'next', displayName: 'next', email: 'next'}];
      fetch
          .mockResponseOnce(JSON.stringify(nextUsers))
          .mockResponseOnce(JSON.stringify(testUsers));

      const wrapper = mount(<UserModal groupName={group}/>);

      openModal(wrapper);
      await waitForFetch(wrapper, 1);

      loadNext(wrapper);
      await waitForFetch(wrapper, 2);

      loadPrevious(wrapper);
      await waitForFetch(wrapper, 3);

      expect(fetch).toHaveBeenLastCalledWith(
          `/api/group/${group}/users`,
          {
            credentials: 'same-origin',
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            }
          }
      )
    });
    it('should send email to group if community', async () => {
      const wrapper = mount(<UserModal groupName={group} isCommunity={true} isCommunity={true}/>);

      openModal(wrapper);
      await waitForFetch(wrapper, 1);

      const emailAll = wrapper.find('Button').filterWhere(button => button.props().id === `${group}-email`);
      emailAll.simulate('click');

      expect(utils.sendEmail).toHaveBeenCalledWith(`mailto:${group}@johndeere.com`);
    });

    it('should send email to group if community even with whitespace', async () => {
      const groupWithWhitesapce = 'some group';
      const wrapper = mount(<UserModal groupName={groupWithWhitesapce} isCommunity={true} isCommunity={true}/>);

      openModal(wrapper, groupWithWhitesapce);
      await waitForFetch(wrapper, 1);

      const emailAll = wrapper.find('Button').filterWhere(button => button.props().id === `${groupWithWhitesapce}-email`);
      emailAll.simulate('click');

      expect(utils.sendEmail).toHaveBeenCalledWith(`mailto:${groupWithWhitesapce.replace(/\s/g, '')}@johndeere.com`);
    });

    it('should send email to loaded users if not community', async () => {
      const nextUsers = [{ id: 'next', displayName: 'next', email: 'next'},{ id: 'next 2', displayName: 'next 2', email: 'next 2'}];
      const expectedEmail = `mailto:${nextUsers[0].email};${nextUsers[1].email}?subject=Group Members of some_group`;
      fetch.mockResponseOnce(JSON.stringify(nextUsers));
      const wrapper = mount(<UserModal groupName={group} isCommunity={true} isCommunity={false}/>);

      openModal(wrapper);
      await waitForFetch(wrapper, 1);

      const emailAll = wrapper.find('Button').filterWhere(button => button.props().id === `${group}-email`);
      emailAll.simulate('click');

      await waitForFetch(wrapper, 2);
      openModal(wrapper);

      expect(utils.sendEmail).toHaveBeenCalledWith(expectedEmail);
    });

    it('should display message if 100 user limit hit for email', async () => {
      const fakeUsers = new Array(100).map((_val, index) => ({ id: `${index}`, displayName: `${index}`, email: `${index}`}));
      fetch.mockResponseOnce(JSON.stringify(fakeUsers));
      const wrapper = mount(<UserModal groupName={group} isCommunity={true} isCommunity={false}/>);

      openModal(wrapper);
      await waitForFetch(wrapper, 1);

      const emailAll = wrapper.find('Button').filterWhere(button => button.props().id === `${group}-email`);
      emailAll.simulate('click');

      openModal(wrapper);
      await waitForFetch(wrapper, 2);

      const alert = wrapper.find('div').filterWhere(div => div.props().id === `${group}-max-alert`);

      expect(alert.props().hidden).toEqual(false);
    });

    it('should be able to close modal', async () => {
      const wrapper = mount(<UserModal groupName={group}/>);

      openModal(wrapper);
      await waitForFetch(wrapper, 1);

      const closeModal = wrapper.find('Button').filterWhere(button => button.props().id === `${group}-close`);
      closeModal.simulate('click');

      const modal = wrapper.find(Modal);

      expect(modal.props().show).toEqual(false);
    });

    it('should display link in italics', async () => {
      const wrapper = mount(<UserModal groupName={group} linkName={group} useItalics={true}/>);
      openModal(wrapper);
      const link = wrapper.find('Button').filterWhere(button => button.props().id === `${group}-button`);

      expect(link.text()).toEqual(group);
      expect(link.props().style.fontStyle).toEqual('italic')
    });
  });

  describe('sad paths', () => {
    afterEach(() => {
      fetch.resetMocks();
    })
    it('should display an error if returned', async () => {
      fetch.mockResponseOnce(JSON.stringify({error: 'some error'}), {status: '400'});
      const wrapper = mount(<UserModal groupName={group}/>);

      openModal(wrapper);
      await waitForFetch(wrapper, 1);

      const modal = wrapper.find(Modal).filterWhere(modal => modal.props().id === `${group}-modal`);
      const body = modal.find('ModalBody');

      expect(body.text()).toContain('some error')
    });

    it('should display an error if returned and rejects', async () => {
      fetch.mockRejectOnce(JSON.stringify({message: 'some error'}), {status: '400'});
      const wrapper = mount(<UserModal groupName={group}/>);

      openModal(wrapper);
      await waitForFetch(wrapper, 1);

      const modal = wrapper.find(Modal).filterWhere(modal => modal.props().id === `${group}-modal`);
      const body = modal.find('ModalBody');

      expect(body.text()).toContain('An unexpected issue occurred when retrieving group members.')
    });
  });

  function openModal(wrapper, newGroup) {

    const button = wrapper.find('Button').filterWhere(button => button.props().id === `${newGroup ? newGroup : group}-button`);
    button.simulate('click');
    wrapper.update();
  }

  function loadNext(wrapper) {
    wrapper.find('Button').filterWhere(button => button.props().id === `${group}-next`).simulate('click');
    wrapper.update();
  }

  function loadPrevious(wrapper) {
    wrapper.find('Button').filterWhere(button => button.props().id === `${group}-previous`).simulate('click');
    wrapper.update();
  }

  async function waitForFetch(wrapper, number) {
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(number));
    wrapper.update();
  }
});