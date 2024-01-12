import React from "react";
import EnhancedVersionDropdown from "./EnhancedVersionDropdown";
import SmallSpinner from "../../SmallSpinner";
import EnhancedMetastoreTables from "./EnhancedMetastoreTables";
import CopyableText from "../../CopyableText";
import Spacer from "../../Spacer";
import {Col, Container, Row} from "react-bootstrap";
import ReactMarkdown from 'react-markdown';
import rehypeRaw from "rehype-raw";
import styles from "../../../styles/components/datasets/EnhancedSchemaDetails.module.css";

const DetailsField = ({name, content}) => {
  const id = `${name.toLowerCase().replace(/ /g, '-')}-usage-field`;
  return <>
    <div id={id} style={{paddingTop: '5px'}}>
      <strong>{name}</strong>
      <br/>
      {content}
    </div>
    <Spacer height="5px" />
  </>
}

const resources = <ul id={'resource-urls'} style={{ listStyleType: 'none', padding: 0, margin: 0 }}>
  <li key={'li-edlwarehouse'} as="div">
    <a href="https://confluence.deere.com/display/EDAP/EDL+Warehouse" target="_blank">EDL Warehouse</a>
  </li>
  <li key={'li-bi-tools-sql'} as="div">
    <a href="https://confluence.deere.com/display/EDAP/Using+BI+Tools+or+SQL+Clients" target="_blank">BI Tools or SQL Clients</a>
  </li>
</ul>

const createEnvironmentName = selectedSchema => {
  try {
    const formattedVersion = selectedSchema.version;
    return <CopyableText>{`${selectedSchema.environmentName}@${formattedVersion}`}</CopyableText>;
  } catch (e) {
    console.error(`Failed to get environment name for schema: ${JSON.stringify(selectedSchema)}`);
    console.error('Failed to get environment name with error: ', e.stack);
    return <CopyableText>{selectedSchema.environmentName}</CopyableText>;
  }
}

const createFields = (selectedSchema, fieldText) => {
  const fields = selectedSchema?.fields?.find(f => [f.attribute, f.attribute.name].includes(fieldText));
  return fields?.name || "-";
}

const EnhancedSchemaDetails = ({selectedSchema, schemas, selectedConsolidatedSchema, setSelectedConsolidatedSchema, tables, dataType}) => {
  if(!selectedSchema) return <SmallSpinner />;
  if(!selectedSchema.id) return <></>;

  const { name } = selectedSchema;
  const description = selectedSchema.description || '-';
  const documentation = selectedSchema.documentation ?
    <ReactMarkdown className={styles.schemaDocumentation} rehypePlugins={[rehypeRaw]}>{selectedSchema.documentation}</ReactMarkdown> : '-';
  const environmentName = createEnvironmentName(selectedSchema);
  const extractFields = createFields(selectedSchema, 'extract time');
  const deleteIndicator = createFields(selectedSchema, 'delete indicator');
  const partitions = !!selectedSchema?.partitionedBy?.length ? selectedSchema.partitionedBy.join(', ') : '-';
  const enhancedVersionDropdown =
    <EnhancedVersionDropdown selectedConsolidatedSchema={selectedConsolidatedSchema}
      setSelectedConsolidatedSchema={setSelectedConsolidatedSchema}
      selectedSchema={selectedSchema}
      schemas={schemas}
      schemaEnvironmentName={selectedSchema.environmentName}
      dataType={dataType}/>
  const metastoreTables = <EnhancedMetastoreTables schemaId={selectedSchema.id} tables={tables}/>;

  if(selectedSchema.error) return (
    <div id="EnhancedSchemaDetails">
      <h4><strong>{name}</strong></h4>
      <DetailsField name='Version' content={enhancedVersionDropdown} />
      <br />
      <em>{selectedSchema.error}</em>
    </div>
  )

  return (
    <div id="EnhancedSchemaDetails">
      <h4><strong>{name}</strong></h4>
      <DetailsField name='Version' content={enhancedVersionDropdown} />
      <DetailsField name='Description' content={description} />
      <DetailsField name='Documentation' content={documentation} />
      <hr />
      <DetailsField name='Environment Name' content={environmentName} />
      <DetailsField name='Databricks Tables' content={metastoreTables} />
      <Container style={{margin:0, padding:0}}>
        <Row>
          <Col>
            <DetailsField name='Partitions' content={partitions} />
          </Col>
          <Col>
            <DetailsField name='Extract Time Field' content={extractFields} />
          </Col>
        </Row>
        <Row>
          <Col>
            <DetailsField name='Resources' content={resources} />
          </Col>
          <Col>
            <DetailsField name='Delete Indicator Field' content={deleteIndicator} />
          </Col>
        </Row>
      </Container>
    </div>
  )
};

export default EnhancedSchemaDetails;
