import {mount} from 'enzyme';
import Alerts from '../../components/Alerts';
import {getLoggedInUser} from '../../components/AppState';

jest.mock('../../components/AppState');

const anyUser = 'herky';

describe('Alert component tests', () => {
  beforeEach(() => getLoggedInUser.mockReturnValue({username: anyUser}));

  it('should display nothing when no nonAvailableVersion, not lockedBy another anyUser, or lockedBy current anyUser', () => {
    const wrapper = mount(<Alerts />);
    expect(wrapper.text()).toEqual("");
  });

  it('should display locked message when anyUser has locked the item', () => {
    const wrapper = mount(<Alerts record={{lockedBy: anyUser}} type={'record'}/>).find('Banner');
    expect(wrapper.text()).toEqual('You have locked this record. Editing is now prevented for other users until you cancel or submit your changes.')
  });

  it('should display locked by other usermessage when another anyUser has locked the item', () => {
    const wrapper = mount(<Alerts record={{lockedBy: 'Cy'}} type={'record'}/>).find('Banner');
    expect(wrapper.text()).toEqual('This record has been locked by Cy. Editing is not allowed until Cy has finished or canceled editing.')
  });

  it('should display locked by other usermessage when another anyUser has locked the item', () => {
    const wrapper = mount(<Alerts nonAvailableVersion="1" record={{id: 'go Hawks'}} type={'record'}/>).find('Banner');
    expect(wrapper.text()).toContain('This record has a version pending approval. Editing is not allowed until this record is made available. To view the pending changes click')
  });

  it('should display pending deletion warning if record is pending delete', () => {
    const wrapper = mount(<Alerts record={{id: 'go Hawks', isPendingDelete: true}} type={'record'}/>).find('Banner');
    expect(wrapper.text()).toContain("This record is pending deletion. If approved this dataset and all associated data will be removed from EDL and the EDL Data Catalog.")
  });
});
