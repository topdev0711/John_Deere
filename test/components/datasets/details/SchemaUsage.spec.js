import { shallow, mount } from 'enzyme';
import SchemaUsage from '../../../../components/datasets/details/SchemaUsage';
import { getTables } from '../../../../apis/metastore';

jest.mock('../../../../apis/metastore');

describe('SchemaUsage Test Suite', () => {
  const getUsageText = (wrapper, id) => wrapper.find('div').filterWhere(div => div.props().id === id).text();

  it('should render', () => {
    const wrapper = shallow(<SchemaUsage />);
    expect(wrapper).toBeDefined();
  });

  it('should display EDL resource urls as links', () => {
    getTables.mockResolvedValue();
    const wrapper = mount(<SchemaUsage schemaEnvironmentName={'com.deere.enterprise.datalake.enhance.firsttest'} version={'1.0.0'} schemaId={''} />);
    const resourceList = wrapper.find('ul').filterWhere(ul => ul.props().id === 'resource-urls');
    const resources = resourceList.find('li');
    const links = resources.find('a');

    expect(links).toHaveLength(2);
    expect(links.at(0).props().href).toEqual('https://confluence.deere.com/display/EDAP/EDL+Warehouse');
    expect(links.at(1).props().href).toEqual('https://confluence.deere.com/display/EDAP/Using+BI+Tools+or+SQL+Clients');
  });

  it('should display partitions', () => {
    const partitions = ['some field', 'another-one'];
    const wrapper = mount(<SchemaUsage partitionedBy={partitions} />);
    const actualText = getUsageText(wrapper, 'partitions-usage-field');
    expect(actualText).toContain(partitions[0] + ',');
    expect(actualText).toContain(partitions[1]);
  });

  it('should display extract time field', () => {
    const fields = [
      {
        name: 'some time field',
        attribute: {
          name: 'extract time'
        }
      }
    ];
    const wrapper = mount(<SchemaUsage fields={fields} />);
    const actualText = getUsageText(wrapper, 'extract-time-field-usage-field');

    expect(actualText).toContain(fields[0].name);
  });

  it('should display delete indicator field', () => {
    const fields = [
      {
        name: 'some delete field',
        attribute: {
          name: 'delete indicator'
        }
      }
    ];
    const wrapper = mount(<SchemaUsage fields={fields} />);
    const actualText = getUsageText(wrapper, 'delete-indicator-field-usage-field');

    expect(actualText).toContain(fields[0].name);
  });
});
