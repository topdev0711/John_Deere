// Unpublished Work © 2021-2022 Deere & Company.
import { Col, Dropdown, Form, Nav, Row, Tab, Button, OverlayTrigger, Tooltip } from "react-bootstrap";
import React, { useEffect, useState } from 'react'
import utils from "../../utils";
import { marked } from 'marked';
import { MdBuild, MdRemoveCircleOutline, MdAddCircleOutline, MdUpdate, MdKeyboardArrowDown, MdLink, MdVisibility, MdLockOpen, MdSwapHoriz, MdSelectAll } from "react-icons/md";
import Spacer from "../../Spacer";
import SearchBar from "../../SearchBar";
import ListedDatasets from '../../ListedDatasets';
import AllowedPermissions from '../../AllowedPermissions';
import VisualDiff from 'react-visual-diff';
import diff from 'deep-diff';
import Fields from '../../Fields';
import SchemaUsage from './SchemaUsage';
import Router, { withRouter } from 'next/router';
import { getFullSchemaInfo } from '../../../apis/schemas';
import LoadHistory from './LoadHistory';
import Spinner from 'react-bootstrap/Spinner';
import { getDataset } from '../../../apis/datasets';
import PermissionListModal from './PermissionListModal';
import {AppStateConsumer} from '../../AppState';
import useNotifyModal from "../../../hooks/useNotifyModal";
import CopyableText from "../../CopyableText";

const styles = {
  schemaNotices: {
    color: 'green',
    marginBottom: '15px',
    fontSize: '10pt'
  },
  selectedView: { marginLeft: '8px', color: '#aaa' },
  unselectedView: { marginLeft: '8px', color: '#c21020' },
  spinner: { marginTop: '50px' }
};

const getTableName = (tables, schemaId) => {
  let tableDetails = tables.find(table => cleanId(table.schemaId) === cleanId(schemaId));

  if (tableDetails && !!tableDetails.tableName) {
    return `${tableDetails.tableName}_${tableDetails.schemaVersion.replace(/\./g, '_')}`;
  }
};

const cleanId = (id) => `${id}`.split('--')[0] || id;

const getMergedSchemas = (schemas, prevSchemas) => {
  const removed = [...prevSchemas].filter(({ id: prevId }) => {
    return !schemas.some(({ id }) => {
      return cleanId(prevId) === cleanId(id);
    });
  }).map(item => ({ ...item, removed: true }));

  const mutated = [...schemas].map(item => {
    const added = !prevSchemas.some(({ id: prevId }) => cleanId(item.id) === cleanId(prevId));
    const modified = !added && !!diff.diff(item, prevSchemas.find(s => cleanId(s.id) === cleanId(item.id)), diffPrefilter);
    return {
      ...item,
      added,
      modified
    }
  });
  return [...mutated, ...removed];
};

const hasChanges = (schemas, prevSchemas) => {
  const moreOrLessItems = schemas.length !== prevSchemas.length;
  return moreOrLessItems || schemas.some(item => {
    const diffs = diff.diff(item, prevSchemas.find(s => cleanId(s.id) === cleanId(item.id)), diffPrefilter);
    return !!diffs;
  });
};

const buildDiffIcon = (item, showDiff) => {
  if (showDiff) {
    if (item.removed) {
      return (<span style={{ marginLeft: '8px', color: '#aaa' }}><em><MdRemoveCircleOutline /> Removed</em></span>);
    } else if (item.added) {
      return (<span style={{ marginLeft: '8px', color: '#aaa' }}><em><MdAddCircleOutline /> New</em></span>);
    } else if (item.modified) {
      return (<span style={{ marginLeft: '8px', color: '#aaa' }}><em><MdUpdate /> Modified</em></span>);
    }
  }
  return undefined;
};

const testingOnly = () => {
  return <b className="small"><br /><br />This schema is marked For Testing Only</b>;
};

const diffFormatter = ({ type, children }) => {
  return <code className={type !== 'added' ? 'code-remove' : ''}>{children}</code>;
};

const diffPrefilter = (path, key) => {
  return key === 'id' || `${key}`.includes('linked') || `${key}`.includes('environmentName');
};

const displayTableName = (current, previous, showDiff) => {
  return (
    <div style={{ color: '#aaa' }}>
      <small>
        {showDiff && (current.tableName || previous.tableName) ?
          <VisualDiff
            left={<span>{!!previous.tableName && previous.tableName}</span>}
            right={<span>{!!current.tableName && current.tableName}</span>}
            renderChange={diffFormatter}
          />
          :
          current.tableName
        }
      </small>
    </div>
  );
};

const getPrevious = (schema, prevSchemas) => {
  return prevSchemas.find(({ id: prevId }) => {
    return cleanId(schema.id) === cleanId(prevId);
  });
};

async function getDatasetIdsForView(name) {
  return fetch(`/api/views/${name}/datasets`, {
    credentials: 'same-origin',
    method: 'GET',
    headers: {'Content-Type': 'application/json'}
  });
}

function createListedDatasets(viewDatasetIds){
  return Promise.all(viewDatasetIds.map( async datasetId => {
    const { id, name, version, phase } = await getDataset(datasetId);
    return { id, name, version, phase };
  }));
}

const driftedViewStyle = (schemaName, viewName) => {
  return schemaName === viewName ?  styles.selectedView : styles.unselectedView;
};

export const Schemas = (
  { schemas = [], environmentName, prevSchemas = [], showDiff, tables = [], prevTables = [], changeDetectedCallback = () => { }, isViews = false, isDiscoveredTables = false, userAccessibleViews = [], datasetId = '', dataType = '', permissions = [], username, hasAccess = false, ...props }) => {
  const schemasWithTables = [...schemas].map(s => ({ ...s, tableName: getTableName(tables, s.id) }));
  const prevWithTables = [...prevSchemas].map(s => ({ ...s, tableName: getTableName(prevTables, s.id) }));
  const [displayedSchemas, setDisplayedSchemas] = useState(schemasWithTables);
  const [showOnlyChanges, setShowOnlyChanges] = useState(true);
  const [hasChanged, setHasChanged] = useState(false);
  const [viewName, setViewName] = useState();
  const [viewDatasets, setViewDatasets] = useState({});
  const [loadingDatasets, setLoadingDatasets] = useState(false);
  const [loadedSchemas, setLoadedSchemas] = useState([]);
  const [loadingSchema, setLoadingSchema] = useState(false);
  const [show, setShow] = useState(false);
  const [permissionsWithUserAccess, setPermissionsWithUserAccess] = useState([]);
  const [notifyModal, setNotifyModal] = useNotifyModal();

  const handleCancel = () => {
    setShow(false);
  };

  const diffFilter = s => !hasChanged || !showDiff || !showOnlyChanges || (s.added || s.removed || s.modified);
  const getDescriptionType = () => {
    if (isViews) return 'View';
    if (isDiscoveredTables) return 'Table';
    return 'Schema';
  }

  async function loadSchema(schemaId) {
    const hasSchema = loadedSchemas.some(schema => schema.id === schemaId);
    if (!hasSchema) {
      setLoadingSchema(true);
      const schemaResponse = await getFullSchemaInfo(schemaId);
      const schema = await schemaResponse.json();
      setLoadedSchemas([...loadedSchemas, schema]);
      setLoadingSchema(false);
    }
  }

  useEffect(() => {
    const changed = hasChanges(schemasWithTables, prevWithTables);
    changeDetectedCallback(changed)
    setHasChanged(changed);
  }, [props.prevSchemas]);

  useEffect(() => {
    const displaySchemas = showDiff ? getMergedSchemas(schemasWithTables, prevWithTables) : schemasWithTables;
    setDisplayedSchemas(displaySchemas);
  }, [showDiff]);

  useEffect(() => {
    async function loadDatasetIdsForView() {
      if(viewName && !viewDatasets[viewName]){
        try {
          setLoadingDatasets(true);
          const res = await getDatasetIdsForView(viewName);
          if(res.ok) {
            const fullResponse = await res.json();
            const datasetIds = fullResponse.filter(id => id !== datasetId);
            const listedDatasets = await createListedDatasets(datasetIds);
            setViewDatasets({...viewDatasets, [viewName]: listedDatasets});
            setLoadingDatasets(false);
          } else {
            const err = await res.json();
            console.error('Error ', err);
            setLoadingDatasets(false);
            setNotifyModal(err.error);
          }
        } catch (e) {
          const parsed = typeof e === 'string' ? JSON.parse(e) : e;
          console.error({e});
          const errorResponse = parsed.message ? parsed.message : parsed;
          setLoadingDatasets(false);
          setNotifyModal(errorResponse);
        }
      }
    }
    loadDatasetIdsForView();
  }, [viewName]);

  const handleRequestAccessButtonClick = (schema) => {
    const filteredPermissions = utils.findPermissionsWithAccessToView(schema.name, permissions)?.filter((perm) => username?.groups?.includes(perm.group) && !utils.isPermExpired(perm));
    if (filteredPermissions?.length > 0) {
      setShow(true);
    } else {
      Router.push(`/catalog/permissions/request?sourceView=${schema.id}&isViewRequest=true`);
    }
    setPermissionsWithUserAccess(filteredPermissions);
  }

  const filteredSchemas = displayedSchemas.filter(diffFilter);
  const displayedViewDatasets = viewDatasets[viewName] ? viewDatasets[viewName] : [];
  return (
    <div {...props}>
      {notifyModal}
      <Tab.Container mountOnEnter={true} unmountOnExit={true} defaultActiveKey="schema">
        <Row>
          <Col md={{ span: 12 }}>
            {(!showDiff || !hasChanged) &&
              <SearchBar hidden={schemas.length < 5} placeholder="Filter..." style={{ borderColor: '#ccc' }} size="sm" items={schemasWithTables} onChange={setDisplayedSchemas} />
            }
            {(showDiff && hasChanged) &&
              <>
                <Form.Check
                  checked={!showOnlyChanges}
                  onChange={() => setShowOnlyChanges(!showOnlyChanges)}
                  type="checkbox"
                  id={`custom-checkbox-${Date.now()}`}
                  custom
                  label={<i className="text-muted">Include Unchanged</i>}
                />
                <Spacer height='15px' />
              </>
            }
            <Nav variant="pills" className="flex-column" style={{ overflow: 'scroll', maxHeight: '300px', flexWrap: 'nowrap' }}>
              {filteredSchemas.map((schema, i) => {
                const previous = getPrevious(schema, prevWithTables) || {};
                return (
                  <Nav.Item key={schema.id} style={{ borderBottom: i !== (filteredSchemas.length - 1) && '1px solid #f2f2f2' }}>
                    <Nav.Link
                      id={schema.id}
                      style={{ textDecoration: 'none' }}
                      className={(schema.added && 'is-new') || (schema.removed && 'is-removed') || (schema.modified && 'is-modified')}
                      eventKey={`schema-${schema.id}`}
                      onClick={ () => {
                        if (isViews) setViewName(schema.name)
                        loadSchema(schema.id);
                      }}
                    >
                      <CopyableText>{schema.name}</CopyableText>
                      {displayTableName(schema, previous, showDiff)}
                    <div style={{ color: '#aaa' }}>
                      <small>
                        {(isViews || isDiscoveredTables) ? '' : schema.version}
                        {!!schema.linkedFrom && <span style={styles.selectedView}><em><MdLink /> Linked</em></span>}
                        {!!schema.discovered && <span style={styles.selectedView}><em><MdVisibility /> Discovered ({utils.formatDate(schema.discovered)})</em></span>}
                        {isViews && schema.status === "DRIFTED" &&  <span style={driftedViewStyle(schema.name, viewName)}><em><MdSwapHoriz /> Drifted</em></span>}
                        {isViews && !!schema.createdAt && <span style={styles.selectedView}><em><MdVisibility /> Discovered ({utils.formatDate(schema.createdAt)})</em></span>}
                        {buildDiffIcon(schema, showDiff)}
                      </small>
                    </div>
                    </Nav.Link>
                  </Nav.Item>
                )
              })}
            </Nav>
          </Col>
          <Col md={{ span: 12 }} style={{ borderLeft: '1px solid #ccc' }}>
            <Tab.Content>
              {(filteredSchemas).map((schema) => {
                const schemaDetails = showDiff ? undefined : loadedSchemas.find(loadedSchema => loadedSchema.id === schema.id);
                let description;
                if (!showDiff && schemaDetails) {
                  description = !utils.isNullOrNone(schemaDetails.description) ? schemaDetails.description : 'No description provided';
                }
                else if (showDiff) {
                  const previous = getPrevious(schema, prevWithTables) || {description: '', testing: false};
                  description = (
                    <VisualDiff
                      left={<span>{!schema.added && <span>{previous.description}{previous.testing && testingOnly()}</span>}</span>}
                      right={<span>{!schema.removed && <span>{schema.description}{schema.testing && testingOnly()}</span>}</span>}
                      renderChange={diffFormatter}
                    />
                  )
                }
                return (
                  <Tab.Pane key={schema.id} eventKey={`schema-${schema.id}`} style={{ boxShadow: 'none' }}>
                    { isViews &&
                      <span className="float-right">
                        <>
                          <PermissionListModal show={show} onCancel={handleCancel} permissions={permissionsWithUserAccess} id={schema.id} isViewRequest/>
                          <Button
                            id='request-access-button'
                            onClick={() => handleRequestAccessButtonClick(schema)}
                            size="sm"
                            variant="outline-primary">
                            <MdLockOpen /> Request Access</Button>&nbsp;&nbsp;
                        </>

                      </span>
                    }
                    <div style={styles.schemaNotices}>
                      {schemaDetails && !!schemaDetails.testing && !schemaDetails.discovered && <span><MdBuild /> Testing</span>}
                      {isViews && userAccessibleViews.includes(schema.id) &&
                        <span id="accessAllowed">
                          <MdLockOpen /> Access Allowed&nbsp;&nbsp;&nbsp;
                        </span>
                      }
                      {schemaDetails && schemaDetails.isDynamic &&
                        <OverlayTrigger
                          placement="bottom"
                          overlay={<Tooltip id="my-tool-tip">This view uses functions that may limit access dynamically based on user.  Contact the dataset custodian if you have questions.</Tooltip>}
                        >
                          <span id="dynamicFields"><MdSelectAll /> Dynamic Fields</span>
                        </OverlayTrigger>
                      }
                    </div>
                    <h5> {getDescriptionType()} Description</h5>
                    <i className="text-muted">{description}</i>
                  </Tab.Pane>
                )
              })}
              <Tab.Pane eventKey="schema" style={{ boxShadow: 'none' }}><i className="text-muted">Select a {getDescriptionType()} for more detail...</i></Tab.Pane>
            </Tab.Content>
          </Col>
        </Row>
        <Row>
          {loadingSchema && <Col>
            <div className="text-center" style={styles.spinner}>
              <Spinner className="spinner-border uxf-spinner-border-lg" animation="border" role="status">
                <span className="sr-only">Loading...</span>
              </Spinner>
            </div>
          </Col>}
          {filteredSchemas.map((schema) => {
            const previous = getPrevious(schema, prevWithTables);
            const schemaDetails = loadedSchemas.find(loadedSchema => loadedSchema.id === schema.id);
            let schemaEnvironmentName;

            const {
              id = '',
              name = '',
              fields = schemaDetails ? schemaDetails.fields : [],
              added = '',
              removed = '',
              linkedDatasets = [],
              environmentName = schemaDetails ? schemaDetails.environmentName : undefined,
              updateFrequency = schemaDetails ? schemaDetails.updateFrequency : undefined,
              documentation = schemaDetails ? schemaDetails.documentation : '',
              version = '',
              partitionedBy = schemaDetails ? schemaDetails.partitionedBy : [],
              tableName = ''
            } = schema;

            schemaEnvironmentName = environmentName;

            const qualityTables = () => {
              const isEnhanced = !!tableName;
              if (!isEnhanced) return [schema.name];
              return ['edl_current', 'edl'].map(database => `${database}.${tableName}`);
            }

            return (
              <Tab.Content key={id} style={{ width: '100%' }}>
                <Tab.Pane eventKey={`schema-${id}`} style={{ boxShadow: 'none', marginTop: '20px' }}>
                  <Tab.Container mountOnEnter={true} unmountOnExit={true} transition={false} defaultActiveKey={`structure-${id}`}>
                    <Nav id={id + "tabs"} size="sm" variant="tabs" className="uxf-nav-tabs-medium" style={{ margin: 0 }}>
                      <Nav.Item>
                        <Nav.Link eventKey={`structure-${id}`}>Structure</Nav.Link>
                      </Nav.Item>
                      {isViews &&
                        <Nav.Item>
                          <Nav.Link eventKey={`datasets-${id}`}>Related Datasets</Nav.Link>
                        </Nav.Item>
                      }
                      {isViews &&
                        <Nav.Item>
                          <Nav.Link eventKey={`view-permissions-${id}`}>View Permissions</Nav.Link>
                        </Nav.Item>
                      }
                      {!isViews && !isDiscoveredTables &&
                        <Nav.Item className="d-none d-md-block d-lg-block d-xl-block">
                          <Nav.Link eventKey={`documentation-${id}`}>Documentation</Nav.Link>
                        </Nav.Item>
                      }
                      {schemaEnvironmentName !== undefined &&
                        <Nav.Item className="d-none d-md-block d-lg-block d-xl-block">
                          <Nav.Link eventKey={`usage-${id}`}>EDL Usage</Nav.Link>
                        </Nav.Item>
                      }
                      {(linkedDatasets || []).length > 0 &&
                      <Nav.Item className="d-none d-md-block d-lg-block d-xl-block">
                        <Nav.Link eventKey={`linked-${id}`}>Linked Datasets</Nav.Link>
                      </Nav.Item>
                      }
                      {!isViews &&
                        <Nav.Item className="d-block d-sm-block d-md-none">
                          <Dropdown style={{ border: 0 }}>
                            <Dropdown.Toggle style={{ border: 0, padding: '.375rem 1.25rem', marginTop: '3px' }} variant="success">
                              <span className="align-middle">More&nbsp;<MdKeyboardArrowDown size="18" /></span>
                            </Dropdown.Toggle>
                            <Dropdown.Menu>
                              <Dropdown.Item><Nav.Link eventKey={`documentation-${id}`}>Documentation</Nav.Link></Dropdown.Item>
                              {schemaEnvironmentName !== undefined &&
                                <Dropdown.Item><Nav.Link eventKey={`usage-${id}`}>EDL Usage</Nav.Link></Dropdown.Item>
                              }
                              {!isViews && !isDiscoveredTables &&
                              <Dropdown.Item><Nav.Link eventKey={`metrics-${id}`}>Load History</Nav.Link></Dropdown.Item>
                              }
                            </Dropdown.Menu>
                          </Dropdown>
                        </Nav.Item>
                      }
                      {!isViews && !isDiscoveredTables &&
                        <Nav.Item className="d-none d-md-block d-lg-block d-xl-block">
                          <Nav.Link eventKey={`metrics-${id}`}>Load History</Nav.Link>
                        </Nav.Item>
                      }
                    </Nav>
                    <Tab.Content>
                      <Tab.Pane eventKey={`structure-${id}`}>
                        <Spacer height="20px" />
                          <Fields
                            id={id}
                            fields={fields}
                            added={added}
                            removed={removed}
                            showDiff={showDiff}
                            previous={previous}
                            diffFormatter={diffFormatter}
                          />
                      </Tab.Pane>
                      {isViews &&
                        <Tab.Pane eventKey={`datasets-${id}`}>
                          <Spacer height="20px" />
                          <ListedDatasets displayedDatasets={displayedViewDatasets} type='views' isLoading={loadingDatasets}/>
                        </Tab.Pane>
                      }
                      {isViews &&
                        <Tab.Pane eventKey={`view-permissions-${id}`}>
                          <Spacer height="20px" />
                          <AllowedPermissions permissions={utils.findPermissionsWithAccessToView(name, permissions)} isLoading={false} isView={true} />
                        </Tab.Pane>
                      }
                      <Tab.Pane eventKey={`documentation-${id}`}>
                        <Spacer height="20px" />
                        {showDiff &&
                          <div className="markdown">
                            <VisualDiff
                              left={<span>{!added && (previous || {}).documentation}</span>}
                              right={<span>{!removed && documentation}</span>}
                              renderChange={diffFormatter}
                            />
                          </div>
                        }
                        {!showDiff &&
                          <div className="markdown" dangerouslySetInnerHTML={{ __html: marked((!utils.isNullOrNone(documentation) ? documentation : '<em>No additional schema documentation available</em>')) }} />
                        }
                      </Tab.Pane>
                      <Tab.Pane eventKey={`usage-${id}`}>
                        <SchemaUsage
                          schemaId={id}
                          tables={tables}
                          fields={fields}
                          version={version}
                          schemaEnvironmentName={schemaEnvironmentName}
                          partitionedBy={partitionedBy}
                        />
                      </Tab.Pane>
                      {(linkedDatasets || []).length > 0 &&
                      <Tab.Pane eventKey={`linked-${id}`}>
                        <Spacer height="20px" />
                        <ListedDatasets displayedDatasets={(linkedDatasets || [])} type={'linked'} isLoading={(linkedDatasets || []).length === 0} />
                      </Tab.Pane>
                      }
                      <Tab.Pane eventKey={`metrics-${id}`}>
                        <Spacer height="20px" />
                        <LoadHistory datasetEnvironmentName={dataType} schemaEnvironmentName={`${schemaEnvironmentName}@${version}`} />
                      </Tab.Pane>
                    </Tab.Content>
                  </Tab.Container>
                </Tab.Pane>
              </Tab.Content>
            )
          })}
        </Row>
      </Tab.Container>
    </div>
  )
};

export default withRouter(props =>
  <AppStateConsumer>{({loggedInUser}) => (<Schemas {...props} username={loggedInUser}/>)}</AppStateConsumer>);
