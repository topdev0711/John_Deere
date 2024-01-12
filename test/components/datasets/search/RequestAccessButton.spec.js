import { shallow } from 'enzyme';
import RequestAccessButton from "../../../../components/datasets/search/RequestAccessButton";
import {OverlayTrigger} from "react-bootstrap";

describe('Dataset RequestAccessButton tests', () => {
  const anyDataset = {id:'anyId', name: 'anyName'};
  it('should not show dataset count', () => {
    const accessButton = shallow(<RequestAccessButton selectedDatasets={[]}/>)
    expect(accessButton.exists(OverlayTrigger)).toEqual(false);
  });

  it('should have popover when there are datasets selected', () => {
    const accessButton = shallow(<RequestAccessButton selectedDatasets={[anyDataset]}/>)
    expect(accessButton.exists(OverlayTrigger)).toEqual(true);
  });
});
