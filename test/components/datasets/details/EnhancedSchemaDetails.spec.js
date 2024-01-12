import { shallow, mount } from 'enzyme';
import EnhancedSchemaDetails from '../../../../components/datasets/details/EnhancedSchemaDetails';
import { getTables } from '../../../../apis/metastore';

jest.mock('../../../../apis/metastore');

describe('EnhancedSchemaDetails Test Suite', () => {
  const getUsageText = (wrapper, id) => wrapper.find('div').filterWhere(div => div.props().id === id).text();

  const selectedSchema = {
    "id": "109dd49c-3cc0-4ac4-af49-cff5ae6f1cb3--6",
    "name": "SmokeTest",
    "version": "1.0.9",
    "description": "",
    "documentation": "",
    "partitions": '',
    "testing": false,
    "fields": [
      {
        "name": "test",
        "attribute": "None",
        "datatype": "int",
        "description": "",
        "nullable": false
      }
    ],
    "environmentName": "",
    "deleteIndicator": "",
    "extractFields": ""
  }

  const selectedConsolidatedSchema = {
    name: "SmokeTest",
    versions: ["1.0.9", "3.0.0", "2.0.0"],
    selectedVersion: "1.0.9",
    testingStatus: {"1.0.9": false, "3.0.0": true, "2.0.0": false},
  }

  const setSelectedConsolidatedSchema = () => {};

  it('should show a spinner when there is no schema selected', () => {
    const wrapper = shallow(<EnhancedSchemaDetails />);
    expect(wrapper.exists('SmallSpinner')).toEqual(true);
  });

  it('should be blank when there is no schema id', () => {
    const wrapper = shallow(<EnhancedSchemaDetails selectedSchema={{}}/>);
    expect(wrapper.exists('SmallSpinner')).toEqual(false);
    expect(wrapper.exists('div')).toEqual(false);
  });

  it('should correctly display the version field for a non-testing version', () => {
    const wrapper = mount(
      <EnhancedSchemaDetails selectedSchema={selectedSchema} schemas={[selectedSchema]}
                             selectedConsolidatedSchema={selectedConsolidatedSchema}
                             setSelectedConsolidatedSchema={setSelectedConsolidatedSchema}/>);
    const actualText = getUsageText(wrapper, 'version-usage-field');
    expect(actualText).toContain("1.0.9");
    expect(actualText).not.toContain("Testing");
  })

  it('should correctly display the version field for a testing version', () => {
    const testingSchema = {...selectedSchema, version: "3.0.0", testing: true}
    const testingConsolidatedSchema = {...selectedConsolidatedSchema, selectedVersion: "3.0.0"}
    const wrapper = mount(
      <EnhancedSchemaDetails selectedSchema={testingSchema} schemas={[testingSchema]}
                             selectedConsolidatedSchema={testingConsolidatedSchema}
                             setSelectedConsolidatedSchema={setSelectedConsolidatedSchema}/>);
    const actualText = getUsageText(wrapper, 'version-usage-field');
    expect(actualText).toContain("3.0.0");
    expect(actualText).toContain("Testing");
  });

  it('should correctly display a schema without description', () => {
    const wrapper = mount(
      <EnhancedSchemaDetails selectedSchema={selectedSchema} schemas={[selectedSchema]}
                             selectedConsolidatedSchema={selectedConsolidatedSchema}
                             setSelectedConsolidatedSchema={setSelectedConsolidatedSchema}/>);
    const actualText = getUsageText(wrapper, 'description-usage-field');
    expect(actualText).toEqual("Description-");
  });

  it('should correctly display a schema with description', () => {
    const descriptionSchema = {...selectedSchema, description: "Smoke/Regression/Monitoring"}
    const wrapper = mount(
      <EnhancedSchemaDetails selectedSchema={descriptionSchema} schemas={[descriptionSchema]}
                             selectedConsolidatedSchema={selectedConsolidatedSchema}
                             setSelectedConsolidatedSchema={setSelectedConsolidatedSchema}/>);
    const actualText = getUsageText(wrapper, 'description-usage-field');
    expect(actualText).toEqual("DescriptionSmoke/Regression/Monitoring");
  });

  it('should correctly display a schema without documentation', () => {
    const wrapper = mount(
      <EnhancedSchemaDetails selectedSchema={selectedSchema} schemas={[selectedSchema]}
                             selectedConsolidatedSchema={selectedConsolidatedSchema}
                             setSelectedConsolidatedSchema={setSelectedConsolidatedSchema}/>);
    const actualText = getUsageText(wrapper, 'documentation-usage-field');
    expect(actualText).toEqual("Documentation-");
  });

  it('should correctly display a schema with documentation', () => {
    const documentationSchema = {...selectedSchema, documentation: "Some documentation here"}
    const wrapper = mount(
      <EnhancedSchemaDetails selectedSchema={documentationSchema} schemas={[documentationSchema]}
                             selectedConsolidatedSchema={selectedConsolidatedSchema}
                             setSelectedConsolidatedSchema={setSelectedConsolidatedSchema}/>);
    const actualText = getUsageText(wrapper, 'documentation-usage-field');
    expect(actualText).toEqual("DocumentationSome documentation here");
  });

  it('should correctly display the schema environment name field without content', () => {
    const wrapper = mount(
      <EnhancedSchemaDetails selectedSchema={selectedSchema} schemas={[selectedSchema]}
                             selectedConsolidatedSchema={selectedConsolidatedSchema}
                             setSelectedConsolidatedSchema={setSelectedConsolidatedSchema}/>);
    const actualText = getUsageText(wrapper, 'environment-name-usage-field');
    expect(actualText).toEqual("Environment Name@1.0.9");
  });

  it('should correctly display the schema environment name field with content', () => {
    const environmentSchema = {...selectedSchema, environmentName: "com.deere.enterprise.datalake.enhance.smoketest"}
    const wrapper = mount(
      <EnhancedSchemaDetails selectedSchema={environmentSchema} schemas={[environmentSchema]}
                             selectedConsolidatedSchema={selectedConsolidatedSchema}
                             setSelectedConsolidatedSchema={setSelectedConsolidatedSchema}/>);
    const actualText = getUsageText(wrapper, 'environment-name-usage-field');
    expect(actualText).toEqual("Environment Namecom.deere.enterprise.datalake.enhance.smoketest@1.0.9");
  });

  it('should correctly display a schema without partitions', () => {
    const wrapper = mount(
      <EnhancedSchemaDetails selectedSchema={selectedSchema} schemas={[selectedSchema]}
                             selectedConsolidatedSchema={selectedConsolidatedSchema}
                             setSelectedConsolidatedSchema={setSelectedConsolidatedSchema}/>);
    const actualText = getUsageText(wrapper, 'partitions-usage-field');
    expect(actualText).toEqual("Partitions-");
    });

  it('should correctly display a schema with partitions', () => {
    const partitions = ['some field', 'another-one'];
    const partitionSchema = {...selectedSchema, partitionedBy: partitions};
    const wrapper = mount(
      <EnhancedSchemaDetails selectedSchema={partitionSchema} schemas={[partitionSchema]}
                             selectedConsolidatedSchema={selectedConsolidatedSchema}
                             setSelectedConsolidatedSchema={setSelectedConsolidatedSchema}/>);
    const actualText = getUsageText(wrapper, 'partitions-usage-field');
    expect(actualText).toEqual(`Partitions${partitions[0]}, ${partitions[1]}`)
  });

  it('should correctly display the schema extract time field without content', () => {
    const wrapper = mount(
      <EnhancedSchemaDetails selectedSchema={selectedSchema} schemas={[selectedSchema]}
                             selectedConsolidatedSchema={selectedConsolidatedSchema}
                             setSelectedConsolidatedSchema={setSelectedConsolidatedSchema}/>);
    const actualText = getUsageText(wrapper, 'extract-time-field-usage-field');
    expect(actualText).toEqual("Extract Time Field-");
  });


  it('should correctly display the schema extract time field with content', () => {
    const fields = [
      {
        name: 'some time field',
        attribute: {
          name: 'extract time'
        }
      }
    ];
    const extractFields = [...selectedSchema.fields, ...fields];
    const extractSchema = {...selectedSchema, extractFields: 'some time field', fields: extractFields};
    const wrapper = mount(
      <EnhancedSchemaDetails selectedSchema={extractSchema} schemas={[extractSchema]}
                             selectedConsolidatedSchema={selectedConsolidatedSchema}
                             setSelectedConsolidatedSchema={setSelectedConsolidatedSchema}/>);
    const actualText = getUsageText(wrapper, 'extract-time-field-usage-field');
    expect(actualText).toEqual(`Extract Time Field${fields[0].name}`);
  });

  it('should correctly display the schema delete indicator field without content', () => {
    const wrapper = mount(
      <EnhancedSchemaDetails selectedSchema={selectedSchema} schemas={[selectedSchema]}
                             selectedConsolidatedSchema={selectedConsolidatedSchema}
                             setSelectedConsolidatedSchema={setSelectedConsolidatedSchema}/>);
    const actualText = getUsageText(wrapper, 'delete-indicator-field-usage-field');
    expect(actualText).toEqual("Delete Indicator Field-");
  });

  it('should correctly display the schema delete indicator field with content', () => {
    const fields = [
      {
        name: 'some delete field',
        attribute: {
          name: 'delete indicator'
        }
      }
    ];
    const deleteFields = [...selectedSchema.fields, ...fields];
    const deleteSchema = {...selectedSchema, fields: deleteFields}
    const wrapper = mount(
      <EnhancedSchemaDetails selectedSchema={deleteSchema} schemas={[deleteSchema]}
                             selectedConsolidatedSchema={selectedConsolidatedSchema}
                             setSelectedConsolidatedSchema={setSelectedConsolidatedSchema}/>);
    const actualText = getUsageText(wrapper, 'delete-indicator-field-usage-field');
    expect(actualText).toEqual(`Delete Indicator Field${fields[0].name}`);
  });

  it('should correctly display EDL resource urls as links', () => {
    getTables.mockResolvedValue();
    const wrapper = mount(
      <EnhancedSchemaDetails selectedSchema={selectedSchema} schemas={[selectedSchema]}
                             selectedConsolidatedSchema={selectedConsolidatedSchema}
                             setSelectedConsolidatedSchema={setSelectedConsolidatedSchema}/>);
    const resourceList = wrapper.find('ul').filterWhere(ul => ul.props().id === 'resource-urls');
    const resources = resourceList.find('li');
    const links = resources.find('a');

    expect(links).toHaveLength(2);
    expect(links.at(0).props().href).toEqual('https://confluence.deere.com/display/EDAP/EDL+Warehouse');
    expect(links.at(1).props().href)
      .toEqual('https://confluence.deere.com/display/EDAP/Using+BI+Tools+or+SQL+Clients');
  });
});
