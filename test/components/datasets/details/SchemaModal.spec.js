import { shallow } from 'enzyme';
import SchemaModal from '../../../../components/datasets/details/SchemaModal';

const testSchema = {
  "id": "0a521db0-f7d0-4832-b3b3-638507f9ba8a--2",
  "name": "MAI_INVENTORY",
  "version": "1.0.0",
  "description": "Inventory",
  'discovered': 'sometime',
  "documentation": "",
  "partitionedBy": [],
  "testing": true,
  "linkedFrom": 'id',
  "fields": [
    {
      "name": "STOCK_TYPE",
      "attribute": "None",
      "datatype": "string",
      "description": "STOCK_TYPE",
      "nullable": true
    },
    {
      "name": "LANDSCAPE_CD",
      "attribute": "id",
      "datatype": "string",
      "description": "LANDSCAPE_CD",
      "nullable": false
    },
    {
      "name": "SNAPSHOT_DATE",
      "attribute": "id",
      "datatype": "date",
      "description": "SNAPSHOT_DATE",
      "nullable": false
    }
  ],
  "environmentName": "com.deere.enterprise.datalake.enhance.mai_inventory",
  "glueTables": [
    {
      "path": "some path",
      "Name": "classic_rock_songs_all_csv",
      "DatabaseName": "devl_raw_demo_marvel",
      "Owner": "owner",
      "CreateTime": "2020-09-08T17:24:56.000Z",
      "UpdateTime": "2020-09-08T17:24:56.000Z",
      "LastAccessTime": "2020-09-08T17:24:56.000Z",
      "Retention": 0,
      "StorageDescriptor": {
        "Location": "s3://jd-us01-edl-devl-raw-fff3b8e47a0fef170a07b381c4b2d8d3/isu/file3.js",
        "InputFormat": "org.apache.hadoop.mapred.TextInputFormat",
        "OutputFormat": "org.apache.hadoop.hive.ql.io.HiveIgnoreKeyTextOutputFormat",
        "Compressed": false,
        "NumberOfBuckets": -1,
        "SerdeInfo": {
          "SerializationLibrary": "org.apache.hadoop.hive.serde2.lazy.LazySimpleSerDe",
          "Parameters": {
            "field.delim": ","
          }
        },
        "BucketColumns": ['some column'],
        "SortColumns": [],
        "StoredAsSubDirectories": false
      },
      "TableType": "EXTERNAL_TABLE",
      "Parameters": {
        "CrawlerSchemaDeserializerVersion": "1.0",
        "CrawlerSchemaSerializerVersion": "1.0",
        "UPDATED_BY_CRAWLER": "devl_raw_demo_marvel",
        "areColumnsQuoted": "false",
        "averageRecordSize": "105",
        "classification": "csv",
        "columnsOrdered": "true",
        "compressionType": "none",
        "delimiter": ",",
        "exclusions": "[\"s3://jd-us01-edl-devl-raw-fff3b8e47a0fef170a07b381c4b2d8d3/*.{zip,rdf,dat,gvi,log,dtc,jpg,metadata,can,txt,7z,pickle,bag,png,asc,json}\",\"s3://jd-us01-edl-devl-raw-fff3b8e47a0fef170a07b381c4b2d8d3/[_.*]*\",\"s3://jd-us01-edl-devl-raw-fff3b8e47a0fef170a07b381c4b2d8d3/[_.*]**\",\"s3://jd-us01-edl-devl-raw-fff3b8e47a0fef170a07b381c4b2d8d3/**/*.{zip,rdf,dat,gvi,log,dtc,jpg,metadata,can,txt,7z,pickle,bag,png,asc,json}\",\"s3://jd-us01-edl-devl-raw-fff3b8e47a0fef170a07b381c4b2d8d3/**/[_.*]*\",\"s3://jd-us01-edl-devl-raw-fff3b8e47a0fef170a07b381c4b2d8d3/**/[_.*]**\"]",
        "recordCount": "41635",
        "sizeKey": "4371738",
        "skip.header.line.count": "1",
        "typeOfData": "file"
      },
      "CreatedBy": "arn:aws:sts::078228365593:assumed-role/edl-glue-role/AWS-Crawler",
      "IsRegisteredWithLakeFormation": false,
      "CatalogId": "078228365593"
    }
  ]
};

describe('SchemaModal tests', () => {
  it('should render', () => {
    const wrapper = shallow(<SchemaModal />);
    expect(wrapper).toBeDefined();
  });

  it('should display schema details with glue metadata', () => {
    const wrapper = shallow(<SchemaModal schema={testSchema}/>);
    const displayedText = wrapper.text();
    const tab = wrapper.find('NavLink').filterWhere(link => link.props().eventKey === `metadata-${testSchema.id}`);
    tab.at(0).simulate('click');
    const pane = wrapper.find('TabPane').filterWhere(pane => pane.props().eventKey === `metadata-${testSchema.id}`);
    const metaText = pane.text();
    expect(displayedText).toContain(testSchema.name);
    expect(metaText).toContain(testSchema.glueTables[0].DatabaseName);
    expect(metaText).toContain(testSchema.glueTables[0].Name);
    expect(metaText).toContain(testSchema.glueTables[0].StorageDescriptor.BucketColumns[0]);
    expect(metaText).not.toContain(testSchema.glueTables[0].path);
  });

  it('should display testing when not discovered', () => {
    const exampleSchema = { ...testSchema };
    delete exampleSchema.discovered;
    const wrapper = shallow(<SchemaModal schema={exampleSchema}/>);

    const text = wrapper.text();
    expect(text).toContain('Testing');
  });
});
