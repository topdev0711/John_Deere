import {shallow} from "enzyme";
import {Dropdown} from "react-bootstrap";
import UserProfileDropDown from "../../components/UserProfileDropdown";

describe('UserProfileDropdown tests', () => {
  it('displays a user profile', () => {
    const user = { firstName: 'Tanaka', url: 'anyUrl' };
    const userProfile = shallow(<UserProfileDropDown user={user} />)
    expect(userProfile.exists(Dropdown)).toEqual(true);
  });

  it('the user dropdown is blank when there is no user information', () => {
    const userProfile = shallow(<UserProfileDropDown />)
    expect(userProfile.exists(Dropdown)).toEqual(false);

  });
});
