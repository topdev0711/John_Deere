import diff from 'deep-diff';
import React, {useEffect, useState} from 'react';
import {getFullSchemaInfoData} from '../../../apis/schemas';
import SmallSpinner from '../../SmallSpinner';
import VisualDiff from 'react-visual-diff';
import {Col, Container, Row} from 'react-bootstrap';
import EnhancedSchemaList from './EnhancedSchemaList';
import EnhancedSchemaDetails from './EnhancedSchemaDetails';
import {createConsolidatedSchemas} from '../../../hooks/useConsolidatedSchemas';
import EnhancedSchemasFieldNamesDiff from './EnhancedSchemasFieldNamesDiff';
import {marked} from "marked";
import styles from "../../../styles/components/datasets/EnhancedSchemaDetails.module.css";

const EnhancedSchemasDiff = ({schemaSummaries=[], previousSchemaSummaries = [], dataType = '', tables = []}) => {
  const [consolidatedSchemas, setConsolidatedSchemas] = useState(undefined);
  const [selectedConsolidatedSchema, setSelectedConsolidatedSchema] = useState(undefined);
  const [selectedSchema, setSelectedSchema] = useState(undefined);
  const [selectedField, setSelectedField] = useState(undefined);
  const [loading, setLoading] = useState(true);
  const [schemas, setSchemas] = useState(undefined);
  const cleanId = (id) => `${id}`.split('--')[0] || id;

  const formatFields = schema => {
    const description = schema.description || '-';
    const documentation = schema.documentation ? <div id={styles.schemaDocumentation} dangerouslySetInnerHTML={{ __html: marked(schema.documentation)}} /> : '-';
    const extractFields = (schema?.fields?.find(f => [f.attribute, f.attribute.name].includes('extract time')) || { name: '-' }).name;
    const deleteIndicator = (schema?.fields?.find(f => [f.attribute, f.attribute.name].includes('delete indicator')) || { name: '-' }).name;
    const partitions = !!schema?.partitionedBy?.length ? schema.partitionedBy.join(', ') : '-';
    return { description, documentation, extractFields, deleteIndicator, partitions };
  }

  const mergeObjects = arr => Object.keys(arr).map(key => arr[key]).reduce((old,item) => ({...old,...item}), {});
  const diffFilter = (path, key) => key === 'id' || `${key}`.includes('linked') || `${key}`.includes('environmentName');
  const diffFormatter = ({ type, children }) => <code className={type !== 'added' ? 'code-remove' : ''}>{children}</code>;

  const getSchema = async (schemaSummary) => {
    const {id} = schemaSummary
    try {
      const schemaInfo = await getFullSchemaInfoData(id);
      const formattedFields = formatFields(schemaInfo);
      return { ...schemaInfo, ...formattedFields };
    } catch (e) {
      console.error(`failed to get schema with error: `, e.stack);
      return {...schemaSummary, error: 'Failed to find schema details'};
    }
  }

  const getSchemas = async schemas => Promise.all(schemas.map(getSchema));

  const schemaWithDiff = (id, currentSchemas, previousSchemas) => {
    const matchingSchemaId = schema => cleanId(schema.id) === id;
    const currentSchema = currentSchemas.find(matchingSchemaId);
    if(currentSchema.diffStatus) return currentSchema;

    const previousSchema = previousSchemas.find(matchingSchemaId);
    const schemaDiff = diff.diff(currentSchema, previousSchema, diffFilter);
    if(!schemaDiff) return {...currentSchema, diffStatus: 'unchanged' };

    const updatedFields = () => currentSchema.fields.map(fieldJson => {
      const previousFieldJson = previousSchema.fields.find(prevFieldJson => fieldJson.name === prevFieldJson.name);
      const diffs = Object.keys(fieldJson).map(key => ({[key]:<VisualDiff left={previousFieldJson[key]} right={fieldJson[key]} renderChange={diffFormatter}/>}));
      return mergeObjects(diffs);
    })

    const createDiff = field => {
      const diff = <VisualDiff left={<span>{previousSchema[field]}</span>} right={<span>{currentSchema[field]}</span>} renderChange={diffFormatter}/>
      return {[field]: <div className='markdown'>{diff}</div>};
    }

    const detailsDiff = ['description', 'documentation'].map(createDiff);
    const fieldsDiff = {};
    const changes = mergeObjects([...detailsDiff, fieldsDiff]);

    return {...currentSchema, ...changes, diffStatus: 'modified' };
  }

  const schemasWithSetCardinalityChangeFlags = (detailedPreviousSchemas, detailedCurrentSchemas) => {
    const addedSchemas = setDiffSchemas(detailedCurrentSchemas, detailedPreviousSchemas).map(schema => ({ ...schema, diffStatus: 'added' }));
    const findAddedSchema = schema => addedSchemas.find(addedSchema => schema.id === addedSchema.id);
    const schemasWithAddFlags = detailedCurrentSchemas.map(schema => findAddedSchema(schema) || schema);

    const removedSchemas = setDiffSchemas(detailedPreviousSchemas, detailedCurrentSchemas).map(schema => ({ ...schema, diffStatus: 'removed' }));
    return [...schemasWithAddFlags, ...removedSchemas];
  }

  const setDiffSchemas = (thisSchemas, thatSchemas) => thisSchemas.filter(thisSchema => !thatSchemas.some(thatSchema => cleanId(thatSchema.id) === cleanId(thisSchema.id)))
  const setDiff = async () => {
    const detailedPreviousSchemas = await getSchemas(previousSchemaSummaries);
    const currentSummeryResponse = await getSchemas(schemaSummaries);
    const createDetailedSchema = currentSchema => {
      const previousSchema = detailedPreviousSchemas.find(prevSchema => prevSchema.name === currentSchema.name);
      return previousSchema ? { ...currentSchema, environmentName: previousSchema.environmentName } : currentSchema;
    };

    const detailedCurrentSchemas = (currentSummeryResponse).map(createDetailedSchema);
    const schemasWithCardinalityFlags = schemasWithSetCardinalityChangeFlags(detailedPreviousSchemas, detailedCurrentSchemas);
    const consolidatedSchemas = createConsolidatedSchemas(schemasWithCardinalityFlags);
    const schemaIds = schemasWithCardinalityFlags.map(schema => cleanId(schema.id));
    const schemasWithDiff = schemaIds.map(id => schemaWithDiff(id, schemasWithCardinalityFlags, detailedPreviousSchemas));

    setSchemas(schemasWithDiff);
    setConsolidatedSchemas(consolidatedSchemas)
    setSelectedConsolidatedSchema(consolidatedSchemas[0]);
    setLoading(false);
  };

  useEffect(() => {setDiff()}, []);

  const getConsolidatedSchemaVersion = ({name, version}) => name === selectedConsolidatedSchema?.name && version === selectedConsolidatedSchema?.selectedVersion;
  const updateSelectedSchema = () => {
    const selectedSchema = selectedConsolidatedSchema ? schemas?.find(getConsolidatedSchemaVersion) : {};
    setSelectedSchema(selectedSchema);
  }

  useEffect(() => {updateSelectedSchema()}, [selectedConsolidatedSchema]);

  if(loading) return <SmallSpinner />;

  const getItemCss = ({name, versions, hasDiff}, selectedConsolidatedSchema) => {
    const isActive = name === selectedConsolidatedSchema.name;
    return isActive ? { backgroundColor: '#ebf2eb' } : hasDiff ? { backgroundColor: '#ffffe0' } : {};
  }
  const getKey = () => `${selectedSchema?.name || ''}-${selectedSchema?.version || ''}`;

  return (
    <Container>
      <Row>
        <Col md={{ span: 9 }} className='enhanced-schema-list'>
          <EnhancedSchemaList consolidatedSchemas={consolidatedSchemas} selectedConsolidatedSchema={selectedConsolidatedSchema} setSelectedConsolidatedSchema={setSelectedConsolidatedSchema} getItemCss={getItemCss}/>
        </Col>
        <Col md={{ span: 15 }}><EnhancedSchemaDetails key={getKey()} selectedSchema={selectedSchema} schemas={schemas} selectedConsolidatedSchema={selectedConsolidatedSchema} setSelectedConsolidatedSchema={setSelectedConsolidatedSchema} tables={tables} dataType={dataType}/></Col>
      </Row>
      <Row>
        <Col><EnhancedSchemasFieldNamesDiff key={getKey()} selectedSchema={selectedSchema} setSelectedSchema={setSelectedField} tables={tables}/></Col>
      </Row>
    </Container>
  )
}

export default EnhancedSchemasDiff;
