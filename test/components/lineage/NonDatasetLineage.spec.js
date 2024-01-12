
// Unpublished Work © 2022 Deere & Company.
import NonDatasetLineage from '../../../components/lineage/NonDatasetLineage';
import Adapter from 'enzyme-adapter-react-16';
import { configure, mount } from 'enzyme';
import DiagramNode from '../../../components/lineage/DiagramNode';
configure({ adapter: new Adapter() });

const testData = [
  {
    "taskId": "some task id",
    "source": {
      "type": "aws postgres rds",
      "namespace": "public.RDS_POSTGRES_DUMMY_PROD_0_0_1",
      "server": "some.server",
      "database": "some.database"
    },
    "destination": {
      "dataType": "some data type",
      "type": "Schema",
      "namespace": "some.namespace"
    },
    "created": "2022-05-11T12:20:06.829Z"
  }
]

const testSchema = {
  label: 'some.namespace',
  value: 'some.namespace',
  id: 'some.namespace'
}

describe('DisplayLineage TestSuite', () => {
  it('should contain good response', async () => {
    const wrapper = mount(<NonDatasetLineage lineageData={testData} selectedSchema={testSchema} />);
    expect(wrapper.containsMatchingElement(DiagramNode)).toBeTruthy();
    const diagramNodes = wrapper.find(DiagramNode);
    expect(diagramNodes.length == 2).toBeTruthy();
    expect(diagramNodes.at(0).prop('attributes')[0].value === 'aws postgres rds').toBeTruthy();
    expect(diagramNodes.at(1).prop('attributes')[0].value === 'Schema').toBeTruthy();
  })

  it('should contain multiple attributes of db information exists', async () => {
    const wrapper = mount(<NonDatasetLineage lineageData={testData} selectedSchema={testSchema} />);
    expect(wrapper.containsMatchingElement(DiagramNode)).toBeTruthy();
    const diagramNodes = wrapper.find(DiagramNode);
    expect(diagramNodes.length == 2).toBeTruthy();
    expect(diagramNodes.at(0).prop('attributes')[0].value === 'aws postgres rds').toBeTruthy();
    expect(diagramNodes.at(0).prop('attributes')[1].value === 'some.server').toBeTruthy();
    expect(diagramNodes.at(0).prop('attributes')[2].value === 'some.database').toBeTruthy();
  })
});

