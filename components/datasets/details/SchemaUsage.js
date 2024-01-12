import Spacer from "../../Spacer";
import CopyableText from "../../CopyableText";
import MetastoreTables from "./MetastoreTables";

const UsageField = ({ name, content }) => {
  const id = `${name?.toLowerCase()?.replace(/ /g, '-')}-usage-field`;
  return <>
    <div id={id} className="text-muted small"><b>{name}:</b> <i>{content}</i></div>
    <Spacer height="5px" />
  </>
}

const SchemaUsage = ({ schemaId, tables = [], fields = [], version = '', schemaEnvironmentName = '', partitionedBy = [] }) => {
  const environmentName = <CopyableText>{`${schemaEnvironmentName}@${version}`}</CopyableText>;
  const partitions = !!partitionedBy.length ? partitionedBy.join(', ') : 'No Partitions';
  const extractFields = (fields.find(f => [f.attribute, f.attribute.name].includes('extract time')) || { name: 'None' }).name;
  const deleteIndicator = (fields.find(f => [f.attribute, f.attribute.name].includes('delete indicator')) || { name: 'None' }).name;
  const metastoreTables = <MetastoreTables schemaId={schemaId} tables={tables} />;
  const resources = <ul id={'resource-urls'} style={{ listStyleType: 'none' }}>
    <li key={'li-edlwarehouse'} className="text-muted small" as="div">
      <i><a href={'https://confluence.deere.com/display/EDAP/EDL+Warehouse'}>EDL Warehouse</a></i>
    </li>
    <li key={'li-bi-tools-sql'} className="text-muted small" as="div">
      <i><a href={'https://confluence.deere.com/display/EDAP/Using+BI+Tools+or+SQL+Clients'}>BI Tools or SQL Clients</a></i>
    </li>
  </ul>

  return (
    <div id={'schema-usage'}>
      <Spacer height="20px" />
      <UsageField name='Environment Name' content={environmentName} />
      <UsageField name='Partitions' content={partitions} />
      <UsageField name='Extract Time Field' content={extractFields} />
      <UsageField name='Delete Indicator Field' content={deleteIndicator} />
      <UsageField name='Databricks Tables' content={metastoreTables} />
      <UsageField name='Resources' content={resources} />
    </div>
  )
}

export default SchemaUsage;
