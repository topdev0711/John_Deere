// Unpublished Work © 2022 Deere & Company.
import {TabContainer} from "react-bootstrap";
import React, {useEffect, useState} from "react";
import {getDatasetsForSchema, getLinkedDatasetsForDatasetSchema, loadPermissionsWithAccessToDatasetView} from '../../../apis/datasets';
import DetailsTabsNav from "./DetailsTabsNav";
import DetailsTabContent from "./DetailsTabContent";
import {useAppContext} from "../../AppState";
import utils from "../../utils";

const getViewNames = views => views.filter(view => view).map(view => view.name);
const getLinkedDatasets = async (id, status) => (id ? getLinkedDatasetsForDatasetSchema(id, status) : []);
const getSourceDatasetForLinkedSchemas = async id => (id ? getDatasetsForSchema(id) : []);
const getAllSchemas = async dataset => {
  const linkedSchemasSourceDatasets = await getLinkedDatasets(dataset.id, dataset.status);
  const findLinkedDataset = ({id}) => linkedSchemasSourceDatasets.find(({schemas}) => schemas.map(schema => schema.id).includes(id));
  const linkedSchemas = dataset.linkedSchemas.map(schema => ({...schema, linkedFrom: findLinkedDataset(schema)}));

  const datasetsLinkedToThisDatasetSchemas = await getSourceDatasetForLinkedSchemas(dataset.id);
  const findSchemaDataset = ({id}) => datasetsLinkedToThisDatasetSchemas.find(({linkedSchemas}) => linkedSchemas.map(schema => schema.id).includes(id));
  const schemas = dataset.schemas.map(schema => ({...schema, linkedDatasets: findSchemaDataset(schema)}));

  return [...schemas, ...linkedSchemas];
};

const getViewsToRender = dataset => {
  const globalContext = useAppContext();
  const hideDriftedViewsToggle =
    utils.hasAdGroupToggleEnabled(globalContext?.toggles['jdc.hide_drifted_views_ui'], globalContext?.loggedInUser?.groups);
  if (hideDriftedViewsToggle){
    const views = dataset?.views;
    const availableViews = views?.filter(view => view.status === "AVAILABLE");
    dataset.views = availableViews ? availableViews : [];
    return availableViews?.length ? "views" : undefined;
  } else {
    return dataset?.views?.length ? "views" : undefined;
  }
}

const getViewPermissions = async dataset => {
  const views = getViewNames(dataset.views);
  return views.length ? (await loadPermissionsWithAccessToDatasetView(dataset.id, dataset.version, views)) : [];
}

const getResourcesToRender = dataset => {
  const isEnhance = dataset?.phase?.name === 'Enhance';
  const isAvailable = dataset?.status === 'AVAILABLE';
  const files = !isEnhance && isAvailable ? "files" : undefined;
  const schemas = isEnhance ? "schemas" : undefined;
  const views = getViewsToRender(dataset);
  const discoveredTables = dataset?.discoveredTables?.length ? "discoveredTables" : undefined;
  const edlUsage = dataset?.environmentName ? "edlUsage" : undefined;
  const sources = dataset?.sources?.length ? "sources" : undefined;
  return [files, schemas, views, discoveredTables, edlUsage, sources, "classifications"].filter(s => s);
}

const DetailsTabs = ({dataset, showDiff, isDetailedDataset, hasAccess, accessibleViews, latestAvailableVersion}) => {
  const [retrievedViewPermissions, setRetrievedViewPermissions] = useState(false);
  const [viewPermissions, setViewPermissions] = useState([]);
  const [retrievedSchemas, setRetrievedSchemas] = useState(false);
  const [allSchemas, setAllSchemas] = useState([]);
  const [schemaChanged, setSchemaChanged] = useState(false);
  const [classificationsChanged, setClassificationsChange] = useState(false);

  const loadSchemas = async () => {
    const allSchemas = await getAllSchemas(dataset);
    setAllSchemas(allSchemas);
    setRetrievedSchemas(true);
  }

  const loadViewPermissions = async () => {
    if (dataset.views && dataset.views.length) {
      const viewPermissions = await getViewPermissions(dataset);
      setViewPermissions(viewPermissions);
    }
    setRetrievedViewPermissions(true);
  }

  useEffect( () => {
    loadSchemas();
  }, []);

  useEffect(() => {
    loadViewPermissions();
  }, []);

  const getDefaultActiveKey = () => {
    const isEnhance = dataset.phase.name === 'Enhance';
    const isAvailable = dataset.status === 'AVAILABLE';
    if(!isEnhance && isAvailable) return "files";
    if(isEnhance) return "schemas";
    return "classifications";
  }

  const schemaChangeCallback = hasChange => setSchemaChanged(hasChange);
  const classificationChangeCallback = hasChange => setClassificationsChange(hasChange);
  const resources = getResourcesToRender(dataset);

  return (
    <TabContainer transition={false} defaultActiveKey={getDefaultActiveKey()}>
      <DetailsTabsNav dataset={dataset}
                      didClassificationsChange={classificationsChanged}
                      didSchemasChange={schemaChanged}
                      allSchemas={allSchemas}
                      resources={resources}
                      retrievedSchemas={retrievedSchemas}
                      retrievedViewPermissions={retrievedViewPermissions}
                      showDiff={showDiff}
      />
      <DetailsTabContent dataset={dataset}
                         showDiff={showDiff}
                         hasAccess={hasAccess}
                         accessibleViews={accessibleViews}
                         latestAvailableVersion={latestAvailableVersion}
                         resources={resources}
                         retrievedSchemas={retrievedSchemas}
                         retrievedViewPermissions={retrievedViewPermissions}
                         schemaChangeCallback={schemaChangeCallback}
                         classificationChangeCallback={classificationChangeCallback}
                         isDetailedDataset={isDetailedDataset}
                         allSchemas={allSchemas}
                         viewPermissions={viewPermissions}/>
    </TabContainer>
  )
}

export default DetailsTabs;
