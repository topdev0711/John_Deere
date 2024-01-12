// Unpublished Work © 2022 Deere & Company.
import Accordion from '../../Accordion'
import {Card, TabContent, TabPane} from 'react-bootstrap';
import Schemas from './Schemas';
import FileExplorer from './FileExplorer';
import EdlUsage from '../edit/EdlUsage';
import ClassificationDetail from '../../ClassificationDetail';
import React from 'react';
import KeyValueDiv from './KeyValueDiv';
import EnhancedSchemas from './EnhancedSchemas';
import EnhancedSchemasDiff from './EnhancedSchemasDiff';

const getDiscoveredTables = discoveredTables => discoveredTables.map(table => table.id ? table : ({id: table, name: table}));
const NoSchemas = () => <div><i className="text-muted">No schemas available</i></div>;
const Loading = () => <div>loading...</div>;

const DetailsTabContent = ({accessibleViews, dataset, showDiff, isDetailedDataset, hasAccess, latestAvailableVersion, retrievedSchemas, resources, allSchemas, schemaChangeCallback, classificationChangeCallback, viewPermissions, retrievedViewPermissions }) => {
  const {classifications, discoveredTables = [], sources = [], status = '', views = []} = dataset;
  const environmentName = (dataset.environment || {name: ''}).name;
  const safePrevious = (latestAvailableVersion || {schemas: [], linkedSchemas: [], tables: []});
  const schemaSummaries = [...allSchemas, ...(dataset.discoveredSchemas || [])];
  const previousSchemaSummaries = [...(safePrevious?.schemas || []), ...(safePrevious.linkedSchemas || []), ...(safePrevious.discoveredSchemas || [])];
  const schemaParams = {schemaSummaries, dataType: dataset.environmentName, tables: dataset.tables};
  const diffParams = {...schemaParams, previousSchemaSummaries};
  const createSchema = () => showDiff ? <EnhancedSchemasDiff {...diffParams}/> : <EnhancedSchemas {...schemaParams}/>;

  const hasSchemas = !!allSchemas.length || !!dataset.discoveredSchemas.length;
  const renderSchemas = () => hasSchemas ? createSchema() : <NoSchemas/>;

  const getViews = () => views.filter(view => view).map(({name, status, createdAt}) => ({name, id: name, status, createdAt}));
  const createViews = () => <Schemas
    schemas={getViews()}
    isViews={true}
    showDiff={false}
    datasetId={dataset.id}
    dataType={dataset.environmentName}
    environmentName={environmentName}
    userAccessibleViews={accessibleViews}
    permissions={viewPermissions}
    key={isDetailedDataset}
  />;

  const renderSource = source => {
    const header = (<>
      <span style={{ display: 'block' }} className='text-muted small'><b>type:</b> <i>{source.type}</i></span>
      <span style={{ display: 'block' }} className='text-muted small'><b>namespace:</b> <i>{source.namespace}</i></span>
    </>)

    return {id: source.namespace, header, body: <KeyValueDiv json={source}/>};
  }

  const renderSources = () => {
    const items = sources.map(renderSource);
    return (<Accordion key='sources-details-accordion' items={items} />)
  }

  const renderDiscoveredTables = () => <Schemas
    schemas={getDiscoveredTables(discoveredTables)}
    isDiscoveredTables={true}
    showDiff={false}
    datasetId={dataset.id}
    dataType={dataset.environmentName}
    environmentName={environmentName}
    key={isDetailedDataset}
    hasAccess={hasAccess}
  />

  const previousClassifications = (latestAvailableVersion || {classifications: []}).classifications;
  const tabPanes = {
    files: () => <FileExplorer dataset={dataset} hasAccess={hasAccess}/>,
    schemas: () => retrievedSchemas && renderSchemas(),
    views: () => retrievedViewPermissions ? createViews() : <Loading/>,
    discoveredTables: renderDiscoveredTables,
    edlUsage: () => <EdlUsage dataset={dataset}/>,
    sources: renderSources,
    classifications: () => <ClassificationDetail items={classifications} prevItems={previousClassifications} showDiff={showDiff} changeDetectedCallback={classificationChangeCallback}/>
  };

  const hasResource = ([key]) => resources.includes(key);
  const renderTabPane = ([key, value]) => {
    return (<TabPane mountOnEnter={true} id={`details-content-${key}`} key={key} eventKey={key}>
      <Card.Body className={`${status}-static`}>{value()}</Card.Body>
    </TabPane>);
  }
  const renderTabPanes = Object.entries(tabPanes).filter(hasResource).map(renderTabPane);
  return <TabContent>{renderTabPanes}</TabContent>;
}

export default DetailsTabContent;
