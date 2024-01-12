import React, {useEffect, useState} from "react";
import {Col, Container, Row} from "react-bootstrap";
import EnhancedSchemaList from "./EnhancedSchemaList";
import EnhancedSchemaDetails from "./EnhancedSchemaDetails";
import { getFullSchemaInfoData } from '../../../apis/schemas';
import EnhancedSchemaFieldNames from "./EnhancedSchemaFieldNames";
import { useQualityMetricsCompletedNonSwr } from '../../../apis/metrics';
import {createConsolidatedSchemas} from "../../../hooks/useConsolidatedSchemas";
import {marked} from "marked";
import styles from "../../../styles/components/datasets/EnhancedSchemaDetails.module.css";

const formatFields = schema => {
  const description = schema.description || '-';
  const documentation = schema.documentation ? <div id={styles.schemaDocumentation} dangerouslySetInnerHTML={{ __html: marked(schema.documentation)}} /> : '-';
  const extractFields = (schema?.fields?.find(f => [f.attribute, f.attribute.name].includes('extract time')) || {name: '-'}).name;
  const deleteIndicator = (schema?.fields?.find(f => [f.attribute, f.attribute.name].includes('delete indicator')) || {name: '-'}).name;
  const partitions = !!schema?.partitionedBy?.length ? schema.partitionedBy.join(', ') : '-';
  return {description, documentation, extractFields, deleteIndicator, partitions};
}

const EnhancedSchemas = ({ schemaSummaries = [], initialSchemas = [], dataType = '', tables = [] }) => {
  const consolidatedSchemas = createConsolidatedSchemas(schemaSummaries);
  const [selectedConsolidatedSchema, setSelectedConsolidatedSchema] = useState(consolidatedSchemas[0]);
  const [schemas, setSchemas] = useState(initialSchemas);
  const [selectedSchema, setSelectedSchema] = useState(undefined);
  const [selectedField, setSelectedField] = useState(undefined);

  const getTableName = (tables, schemaId) => {
    const tableDetails = tables.find(table => cleanId(table.schemaId) === cleanId(schemaId));
    if (!tableDetails?.tableName) return;
    if (tableDetails.versionless) return tableDetails.tableName;
    return `${tableDetails.tableName}_${tableDetails.schemaVersion.replace(/\./g, '_')}`;
  };

  const cleanId = (id) => `${id}`.split('--')[0] || id;

  const qualityTables = (tableName, schemaName) => {
    const isEnhanced = !!tableName;
    if (!isEnhanced) return [schemaName];
    return ['edl_current', 'edl'].map(database => `${database}.${tableName}`.toUpperCase());
  }

  const getConsolidatedSchemaVersion = ({name, version}) => name === selectedConsolidatedSchema.name && version === selectedConsolidatedSchema.selectedVersion;
  const findSchema = async schemaSummary => {
    try {
      return (await getFullSchemaInfoData(schemaSummary.id));
    } catch (e) {
      console.error(`failed to get schema with error: `, e.stack);
      return {...schemaSummary, error: 'Failed to find schema details'};
    }
  }

  const getMetricsData = async schema => {
    try {
      const tableName = getTableName(tables, schema.id);
      const qualityTableNames = qualityTables(tableName, schema.name);
      const metrics = await useQualityMetricsCompletedNonSwr(qualityTableNames);
      const version = schema?.version;

      if(!metrics) return {};
      if(!version) return metrics;
      return {...metrics, version};
    }
    catch(error) {
      console.error(error.stack);
      return {};
    }
  }

  async function findNewSchema() {
    setSelectedSchema(undefined);

    const summarySchemaVersion = schemaSummaries.find(getConsolidatedSchemaVersion);
    const newSchema = await findSchema(summarySchemaVersion);

    setSchemas([...schemas, {...newSchema, selectedField: newSchema?.fields?.[0].name}]);
    setSchemas([...schemas, newSchema]);

    const metricsData = await getMetricsData(newSchema);
    const schemaWithMetric = {...newSchema, ...metricsData};

    return schemaWithMetric;
  }

  const loadSchema = async () => {
    if(!selectedConsolidatedSchema) {
      setSelectedSchema({});
      return;
    }

    const foundSchema = schemas.find(getConsolidatedSchemaVersion);
    const hasSchemaDetails = foundSchema && !foundSchema.error;
    const schema = hasSchemaDetails ? foundSchema : (await findNewSchema());

    setSelectedSchema(schema);
  }
  useEffect(() => {loadSchema()}, [selectedConsolidatedSchema]);

  const getKey = () => `${selectedSchema?.name || ''}-${selectedSchema?.version || ''}`;

  return (
    <Container>
      <Row>
        <Col md={{ span: 9 }} className='enhanced-schema-list'>
          <EnhancedSchemaList consolidatedSchemas={consolidatedSchemas} selectedConsolidatedSchema={selectedConsolidatedSchema} setSelectedConsolidatedSchema={setSelectedConsolidatedSchema}/>
        </Col>
        <Col md={{ span: 15 }}><EnhancedSchemaDetails key={getKey()} selectedSchema={selectedSchema} schemas={schemas} selectedConsolidatedSchema={selectedConsolidatedSchema} setSelectedConsolidatedSchema={setSelectedConsolidatedSchema} tables={tables} dataType={dataType}/></Col>
      </Row>
      <Row>
        <Col><EnhancedSchemaFieldNames key={getKey()} selectedSchema={selectedSchema} /></Col>
      </Row>
    </Container>
  )
}

export default EnhancedSchemas;
