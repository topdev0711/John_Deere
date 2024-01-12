import Adapter from 'enzyme-adapter-react-16';
import { configure, shallow } from 'enzyme';
import { Button, OverlayTrigger, Popover } from "react-bootstrap";
import { BiCheck, BiX } from "react-icons/bi";
import Usability from "../../../components/datasets/Usability";

configure({ adapter: new Adapter() });

const goodMark = {field: 'goodField', passesCriteria: true};
const badMark = { field: 'badField', passesCriteria: false };
const createDetails = dimensions => ({ usability: 0, dimensions });
const hasMark = (component, mark) => shallow(component.find(OverlayTrigger).props().overlay).find(mark).exists();
const expectMark = (component, mark) => expect(hasMark(component, mark)).toBeTruthy();
const expectNoMark = (component, mark) => expect(hasMark(component, mark)).toBeFalsy();

describe('Usability tests', () => {
  it('should display a bad mark', () => {
    const usability = shallow(<Usability usabilityDetails={createDetails([badMark])}/>);
    expectMark(usability, BiX);
    expectNoMark(usability, BiCheck);
  });

  it('should display a good mark', () => {
    const usability = shallow(<Usability usabilityDetails={createDetails([goodMark])}/>);
    expectMark(usability, BiCheck);
    expectNoMark(usability, BiX);
  });

  it('should display a good mark and a bad mark', () => {
    const usability = shallow(<Usability usabilityDetails={createDetails([goodMark, badMark])}/>);
    expectMark(usability, BiCheck);
    expectMark(usability, BiX);
  });
});
