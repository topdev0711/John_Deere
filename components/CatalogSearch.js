import React from 'react';
import { withRouter } from 'next/router';
import Link from 'next/link';
import {
  MdStyle,
  MdLineStyle,
  MdClear,
  MdLockOutline,
  MdLockOpen,
  MdAdd,
  MdTrendingDown,
  MdSortByAlpha,
  MdLayers,
  MdCheck,
  MdAddTask
} from 'react-icons/md';
import { TiFilter } from 'react-icons/ti';
import { FaEye } from 'react-icons/fa';
import { AppStateConsumer } from '../components/AppState';
import Spacer from '../components/Spacer'
import SearchFilter from '../components/SearchFilter';
import Paginator from '../components/Paginator';
import { Form, Row, Col, Button, ButtonGroup, Card, InputGroup, FormControl, Overlay, Popover, Badge } from 'react-bootstrap';
import utils from '../components/utils';
import PermissionDropdown from './PermissionDropdown';
import { getAllAvailableDatasets } from '../apis/datasets';
import { getAllAvailablePermissions, getGroupsPermissions } from '../apis/permissions';
import { getSourceDBDetails } from '../apis/lineage';
import { sortBy } from 'lodash/collection';

const styles = {
  popover: {
    padding: '10px',
    maxWidth: '600px',
    boxShadow: '0 1px 8px #bbb'
  },
  card: {
    boxShadow: 'none',
    maxWidth: '100%',
    border: '0'
  },
  leftText: {
    maxWidth: '90%'
  },
  selectBox: {
    float: 'right',
    marginTop: '-6px',
    marginRight: '-35px'
  },
  listItem: {
    marginTop: '10px'
  },
  listItemSelected: {
    marginTop: '10px',
    backgroundColor: '#f6f6f6'
  },
  datasetSummary: {
    marginTop: '8px'
  },
  dataSummaryDetail: {
    color: '#777',
    paddingRight: '15px',
    paddingBottom: '5px',
    display: 'block'
  },
  filterLink: {
    zIndex: 100
  },
  registerNewDataset: {
    marginTop: '2px',
    whitespace: 'nowrap'
  },
  iconDetails: {
    color: 'green',
    float: 'right',
    right: '5px',
    position: 'relative',
    marginTop: '10px'
  },
  iconSpecific: {
    paddingLeft: '15px',
    paddingBottom: '5px',
  },
  resultCount: {
    float: 'right'
  },
  searchLogo: {
    background: 'none'
  },
  badge: { backgroundColor: '#a5a5a5', fontWeight: 500, cursor: 'pointer' },
  badgeContainer: { marginTop: '3px' }
}

export class CatalogSearch extends React.Component {
  filterRef = React.createRef();

  isDataset = this.props.type === 'Dataset';
  isPermission = this.props.type === 'Permission';

  state = {
    maxResults: 20,
    page: 1,
    searchCriteria: '',
    showFilter: false,
    selectedItems: [],
    filters: {},
    accessReqCtxShow: false,
    accessReqCtxTarget: null,
    permListTarget: null,
    permListShow: 0,
    showRelevance: false,
    datasets: [],
    permissions: [],
    userPermissions: [],
    lineageFilterInfo: []
  };

  updateFilters = (filters) => {
    this.setState({ filters, showFilter: false, page: 1 })
  }

  clearFilters = () => {
    this.filterRef.current.resetState();
  }

  activeFilters = () => {
    let {defaultFilters: filters} = this.props;
    if (!filters) {
      filters = this.state.filters;
    }
    return Object.keys(filters).filter(key => {
      const filter = filters[key];
      return filter && filter.length;
    }).map(key => {
      const filter = filters[key];
      const apply = comparator => !!filter.find(comparator);
      return { key, apply };
    });
  }

  isMyDataset = ({ id, createdBy }, dataset) => {
    if (this.isDataset) {
      return  id ? createdBy === dataset.createdBy : createdBy !== dataset.createdBy;
    }
  }

  getComparators(item) {
    const { phase, category, classifications, entitlements, roleType, custodian } = item;
    const tags = classifications || entitlements || [];
    return {
      'roleType': f => f.id === roleType,
      'phase': f => f.id === phase.id,
      'category': f => f.id === category.id,
      'gicp': f => tags.find(c => c.gicp.id === f.id),
      'community': f => tags.find(c => c.community.id === f.id),
      'subCommunity': f => tags.find(c => c.subCommunity.id === f.id),
      'countriesRepresented': f => tags.find(c => c.countriesRepresented.find(cc => cc.id === f.id)),
      'personalInformation': f => tags.find(c => c.personalInformation === f.id),
      'development': f => tags.find(c => c.development === f.id),
      'access': f => item.isAccessibleFlag,
      'custodian': f => f.id === custodian,
      'myDataset': f => this.isMyDataset(f, item),
      'servers': f => item['servers'] && item['servers'].includes(f.name),
      'databases': f => item['databases'] && item['databases'].includes(f.name),
      'tableNames': f => item['tableNames'] && item['tableNames'].includes(f.name)
    };
  }

  applyAdditionalFilters = item => {
    const filters = this.activeFilters();
    const comparators = this.getComparators(item);
    const results = filters.map(filter => {
      const comparator = comparators[filter.key];
      return filter.apply(comparator);
    });

    return {...item, filteredOut: results.includes(false)};
  }

  searchDelay = setTimeout(() => {});

  handleSearchChange = value => {
    clearTimeout(this.searchDelay);
    const setSearchCriteria = () => this.setState({ searchCriteria: value, page: 1 });
    if (!value || value === '') {
      setSearchCriteria();
      return;
    }
    this.searchDelay = setTimeout(() => setSearchCriteria(), 300);
  }

  sortItems = datasets => {
    const copyDatasets = [...datasets];
    copyDatasets.sort((a, b) => b.relevance.score - a.relevance.score);
    return copyDatasets;
  }

  toggleFilter = () => this.setState({showFilter: !this.state.showFilter});
  isDatasetSelected = dataset => this.state.selectedItems.find(({ id }) => id === dataset.id);
  findItem = dataset => this.state.selectedItems.filter(({ id: i }) => i !== dataset.id);

  toggleItemSelection = (dataset, event) => {
    event.preventDefault();
    if (dataset.status === 'AVAILABLE') {
      const selectedItems = this.isDatasetSelected(dataset) ? this.findItem(dataset) :  [...this.state.selectedItems, dataset];
      this.setState({ selectedItems });
    }
  }

  isItemSelected = (id) => {
    return !!this.state.selectedItems.find(({ id: i }) => i === id);
  }

  clearSelectedItems = () => {
    this.setState({ selectedItems: [], accessReqCtxShow: false });
  }

  handleClick = (e) => {
    e.preventDefault();
  }

  buildQueryString = () => {
    const { selectedItems } = this.state
    const query = selectedItems.map(s => `sources=${s.id}`).join('&')
    return query && query.length ? `?${query}&ref=datasets` : '?ref=datasets'
  }

  handleAccessReqCtxClick = ({ target }) => {
    this.setState({
      accessReqCtxTarget: target,
      accessReqCtxShow: !this.state.accessReqCtxShow
    });
  }

  getUserEntitlements = () => this.state.userPermissions.filter(utils.isPermEffective).map(p => p.entitlements).reduce((accum, items) => {
    return accum.concat(items);
  }, []);

  loadLineageFilterInfo = async () => {
    const lineageFilterInfo = await getSourceDBDetails();
    this.setState({ lineageFilterInfo: lineageFilterInfo });
  }

  async setAllAvailableDatasets() {
    const { asPath: currentPath } = this.props.router;
    const { isReloadDatasets, setReloadDatasets } = this.props;
    if (currentPath === '/catalog' && this.isDataset && (!this.state.datasets.length || isReloadDatasets)) {
      const availableDatasets = await getAllAvailableDatasets();
      const newDataset = [];
      if(this.state.lineageFilterInfo.length && availableDatasets.length){
        const aggLineageInfo = {};
        this.state.lineageFilterInfo.forEach(({datatype, database, server, tableName}) => {
          if(!aggLineageInfo[datatype]){
            aggLineageInfo[datatype] = {
              databases: [database.trim().toLowerCase()],
              servers: [server.trim().toLowerCase()],
              tableNames: tableName.trim().split(',')
            }
          } else {
            aggLineageInfo[datatype].databases.push(database.trim().toLowerCase());
            aggLineageInfo[datatype].servers.push(server.trim().toLowerCase());
            tableName.trim().split(',').forEach(table =>
              aggLineageInfo[datatype].tableNames.push(table)
            );
          }
        });

        availableDatasets.forEach(dataset => {
          if(aggLineageInfo[dataset.environmentName]){
            newDataset.push({...dataset,
              databases: aggLineageInfo[dataset.environmentName].databases,
              servers: aggLineageInfo[dataset.environmentName].servers,
              tableNames: aggLineageInfo[dataset.environmentName].tableNames
            });
          } else {
            newDataset.push(dataset);
          }
        });
      }
      this.setState({ datasets: sortBy(newDataset.length ? newDataset : availableDatasets, ['name']) });
      setReloadDatasets(false);
    }
  }

  async setUserPermissions() {
    const { groups = [] } = this.props.loggedInUser;
    const userPermissions = await getGroupsPermissions(groups, ['human', 'system']);
    this.setState({ userPermissions });
  }

  async setAllPermissions() {
    const permissions = await getAllAvailablePermissions();
    this.setState({ permissions });
  }

  async setAllAvailablePermissions() {
    const { asPath: currentPath } = this.props.router;
    const shouldUpdatePermissions = currentPath.includes('permission') && this.isPermission && !this.state.permissions.length;
    if (shouldUpdatePermissions) this.setAllPermissions();
  }

  async componentDidMount() {
    await this.loadLineageFilterInfo();
    const { q } = this.props.router.query;
    await this.setUserPermissions();
    this.setAllAvailableDatasets();
    this.setAllAvailablePermissions();
    if (q) this.handleSearchChange(q);
  }

  hasLoadedDataset() {
    return this.props.router.asPath === '/catalog' && this.isDataset && this.props.isLoading && this.state.datasets.length > 0;
  }

  hasLoadedPermission() {
    return  this.props.router.asPath === '/catalog/permissions' && this.props.isLoading && this.state.permissions.length > 0;
  }

  componentDidUpdate(prevProps, prevState) {
    const { datasets, permissions } = this.state;
    const { asPath: currentPath } = this.props.router;
    const { setLoading, isLoading } = this.props;

    if (currentPath === '/catalog' && this.isDataset && !isLoading && datasets.length === 0) setLoading(true);
    if (currentPath === '/catalog/permissions' && this.isPermission && !isLoading && permissions.length === 0) setLoading(true);

    this.setAllAvailableDatasets();
    this.setAllAvailablePermissions();

    if (this.hasLoadedDataset() || this.hasLoadedPermission()) setLoading(false);

    if (this.isPermission && prevState.permissions.length !== permissions.length) {
      if(this.hasLoadedPermission()) setLoading(false);
    }
  }

  RegisterDataset = React.forwardRef(({ onClick, href }, ref) => (
    <Button href={href} onClick={onClick} ref={ref} size="sm" variant="outline-primary">
      <MdAdd />  Register Dataset
    </Button>
  ));

  CreatePermission = React.forwardRef(({ onClick, href }, ref) => (
    <Button href={href} onClick={onClick} ref={ref} size="sm" variant="outline-primary">
      <MdAdd />  Create Permission
    </Button>
  ));

  RequestAccess = React.forwardRef(({ onClick, href }, ref) => (
    <Button href={href} onClick={onClick} ref={ref} size="sm" variant="outline-primary">
      <MdLockOpen /> Request Access
    </Button>
  ));

  truncateText = (str) => {
    const value = `${str}`;
    return value.length > 200 ? value.substring(0, 200) + '...' : str;
  }

  getTotalCount = (items) => {
    const {hidePermissionDetails} = this.props;
    return hidePermissionDetails ? items.length : items.reduce((a, b) => a + b.permissions.length, 0);
  }

  createGrouped = (type, field, items, value) => {
    const perms = items.filter(f => f.roleType === type && f[field] === value);
    return {
      id: (perms[0] || {}).id,
      name: value,
      roleType: type,
      permissions: perms,
      status: 'AVAILABLE',
      relevance: {
        score: perms.reduce((a, b) => b.relevance.score + a, 0),
        matches: perms.reduce((a, b) => {
          return {
            ...a,
            ...b.relevance.matches
          };
        }, {})
      }
    };
  }

  groupPermsByGroupOrClient = (items) => {
    const groups = items.filter(f => f.roleType === 'human').map(f => f.group);
    const clients = items.filter(f => f.roleType === 'system').map(f => f.clientId);
    const humanUnique = [...new Set(groups)];
    const systemUnique = [...new Set(clients)];
    const groupedGroups = humanUnique.map(this.createGrouped.bind(null, 'human', 'group', items));
    const groupedClients = systemUnique.map(this.createGrouped.bind(null, 'system', 'clientId', items));

    return [groupedGroups, groupedClients];
  }

  getPermissionRoute = ({id, name, roleType}) => {
    const type = this.props.type.toLowerCase();
    if (type !== 'permission') return `/catalog/${type}s/detail?id=${id}`;
    if (roleType === 'human') return `/catalog/${type}s/summary-detail?group=${name}`;
    return `/catalog/${type}s/summary-detail?clientId=${name}`;
  }

  render() {
    const { selectedItems, maxResults, page, showRelevance } = this.state;
    const { hideRegisterDataset, hideRequestAccess, type, selectable, hideDatasetDetails, hidePermissionDetails, hiddenFilters, listingOnly, setLoading, router } = this.props;
    const items = this.isDataset ? this.state.datasets : this.state.permissions;
    const filters = this.activeFilters();
    let filteredItems = this.sortItems(utils.determineRelevance(items, this.state.searchCriteria))
      .filter(ds => this.state.searchCriteria.length === 0 || ds.relevance.score)
      .map(this.applyAdditionalFilters)
      .filter(ds => !ds.filteredOut);
    if (!hidePermissionDetails) {
      const [human, system] = this.groupPermsByGroupOrClient(filteredItems);
      filteredItems = human.concat(system).map(item => ({...item, description: item.permissions.map(p => p.name).join(', ')}));
    }

    const maxPages = Math.ceil(filteredItems.length / maxResults) || 1;
    const itemsForDisplay = filteredItems.slice((page - 1) * maxResults, ((page || 1) * maxResults));

    return (
      <div hidden={this.props.hidden}>
        <div hidden={listingOnly}>
        <Row>
          <Col md={{ span: 12 }}>
            <h2>{type} Catalog</h2>
            <Spacer height='15px' />
          </Col>
          <Col>
            <span className="float-md-right" style={styles.registerNewDataset}>
              <ButtonGroup hidden={hideRequestAccess} style={{ marginRight: '10px' }}>
                <Link href={`/catalog/permissions/request${this.buildQueryString()}`}>
                  <this.RequestAccess />
                </Link>
                <Overlay
                  rootClose
                  target={this.state.accessReqCtxTarget}
                  placement="bottom"
                  onHide={() => this.setState({ accessReqCtxShow: false })}
                  show={this.state.accessReqCtxShow}
                >
                  <Popover
                    style={styles.popover}
                    id="popover-positioned-bottom"
                  >
                    <i className="text-muted">Request access to the following selected datasets.<br />You can make adjustments on the next step.</i>
                    <Spacer height="10px" />
                    <div>
                      <Button
                        id="clearSelectedItems"
                        size="sm"
                        variant="secondary"
                        onClick={this.clearSelectedItems}
                      >
                        <MdClear /> Clear Selections
                          </Button>
                    </div>
                    <hr />
                    {selectedItems.map(s =>
                      <li key={s.id}>
                        <span style={{ fontSize: 14 }}>{s.name}</span>
                        <Spacer height="5px" />
                      </li>
                    )}
                  </Popover>
                </Overlay>
                <Button
                  hidden={!selectedItems.length}
                  onClick={this.handleAccessReqCtxClick}
                  size="sm"
                  variant="outline-primary"
                >
                  {selectedItems.length}
                </Button>
              </ButtonGroup>
              <Link href={!hideRegisterDataset ? '/datasets/register' : '/catalog/permissions/request'}>
                {!hideRegisterDataset ? <this.RegisterDataset /> : <this.CreatePermission />}
              </Link>
            </span>
            <Spacer height='15px' />
          </Col>
        </Row>
        <Spacer height='8px' />
        <Row style={styles.noWrap}>
          <Col md={{ span: 24 }}>
            <InputGroup >
              <FormControl
                id="catalogSearchBar"
                type="text"
                placeholder={`Search ${this.getTotalCount(filteredItems)} ${type.toLowerCase()}s`}
                defaultValue={this.state.searchCriteria}
                onChange={(e) => this.handleSearchChange(e.target.value)}
              />
              <InputGroup.Append>
                <Button variant={filters.length ? 'success' : 'link'} onClick={this.toggleFilter}><TiFilter size="16" /></Button>
              </InputGroup.Append>
            </InputGroup>
          </Col>
        </Row>
        <Row hidden={!this.state.showFilter}>
          <Col md={{ span: 24 }}>
            <SearchFilter hiddenFilters={hiddenFilters} onChange={this.updateFilters} filters={this.state.filters} ref={this.filterRef} />
          </Col>
        </Row>
        <div style={styles.badgeContainer}>
          <span hidden={!filters.length}>
            <Badge style={styles.badge} variant="secondary" pill onClick={this.clearFilters}>
              <span><MdClear />&nbsp;&nbsp;Clear Filters</span>
            </Badge>&nbsp;&nbsp;
          </span>
          <span hidden={!selectedItems.length}>
            <Badge style={styles.badge} variant="secondary" pill onClick={this.clearSelectedItems}>
              <span><MdClear />&nbsp;&nbsp;Clear Selected</span>
            </Badge>
          </span>
        </div>
        <Spacer height='25px' />
        </div>
        <Row className="flex-xl-nowrap">
          <Col md={{ span: 24 }}>
            <div hidden={!itemsForDisplay.length || listingOnly} className="float-right text-muted small" style={{ marginTop: '-14px', fontStyle: 'italic' }}>
              {!!this.state.searchCriteria.length ?
                <><MdTrendingDown /> sorted by relevance <Button onClick={() => this.setState({ showRelevance: !showRelevance })} variant="link" size="sm" style={{ marginLeft: '-5px', marginTop: '-5px', textDecoration: 'none' }}>?</Button></> :
                <><MdSortByAlpha /> sorted {type === 'Permission' && 'by type then '}alphabetically</>
              }
            </div>
            {itemsForDisplay.map(item => {
              const schemas = (item.schemas || [])
              const { classifications = [] } = item;
              const personalInformation = classifications.filter(classification => !!classification.personalInformation);
              const linkedSchemas = (item.linkedSchemas || [])
              const schemaCount = schemas.length + linkedSchemas.length
              const userHasAccess = item.isAccessibleFlag;
              const userIsMember = this.state.userPermissions.some(perm => perm.id === item.id)
              const distinctlyMatchedKeys = [...new Set(Object.values(item.relevance.matches).reduce((a, b) => a.concat(b), []).map(m => m.key))];
              return (
                <div key={item.id} id={item.id} onClick={selectable ? this.toggleItemSelection.bind(this, item) : () => {}}>
                  <Card
                    className={`list-group-item ${item.status}`}
                    id={item.id}
                    key={item.id}
                    style={this.isItemSelected(item.id) ? styles.listItemSelected : styles.listItem}
                  >
                    <div style={styles.selectBox} hidden={!selectable}>
                      <Form.Check
                        disabled={item.status !== 'AVAILABLE'}
                        checked={this.isItemSelected(item.id)}
                        onChange={this.toggleItemSelection.bind(this, item)}
                        onClick={this.handleClick}
                        id={`custom-checkbox-${item.id}`}
                        custom
                        label=""
                      />
                    </div>
                    <Card.Title style={styles.leftText}>
                      <Button style={{ padding: 0, textAlign: 'left' }} size="lg" variant="link" onClick={(e) => {
                        setLoading(true);
                        router.push(this.getPermissionRoute(item))
                        e.stopPropagation()
                        e.preventDefault()
                      }}>
                        <span>{item.name}</span>
                      </Button>
                    </Card.Title>
                    <div style={{ ...styles.leftText, fontSize: '11pt' }} className="text-muted"><i>{this.truncateText(item.description)}</i></div>
                    <Spacer height="20px" />
                    <div className="small" style={styles.iconDetails}>
                      {userHasAccess && <span id="accessAllowed" style={styles.iconSpecific}><MdLockOpen /> Access Allowed</span>}
                      {userIsMember && <span id="isMember" style={styles.iconSpecific}><MdCheck /> Member</span>}
                    </div>
                    {!hideDatasetDetails &&
                      <div style={styles.datasetSummary} className="text-muted small">
                        <span className="d-md-inline " style={styles.dataSummaryDetail}><MdStyle size="18" /> <b>Phase:</b> <i>{item.phase.name}</i></span>
                        {!!schemaCount &&
                          <span className={schemaCount && "d-md-inline"} style={styles.dataSummaryDetail}><MdLineStyle size="18" /> <b>Schemas:</b> <i>{schemaCount}</i></span>
                        }
                        <span className="d-md-inline " style={styles.dataSummaryDetail} ><MdAddTask size="18"/> <b>Usability:</b> {item.usability || 0}</span>
                        {!!personalInformation.length &&
                          <span className="d-md-inline " style={styles.dataSummaryDetail} ><FaEye size="18"/> Personal Information</span>
                        }
                      </div>
                    }
                    {!hidePermissionDetails &&
                      <div style={styles.datasetSummary} className="text-muted small">
                        <span className="d-md-inline" style={styles.dataSummaryDetail}><MdLayers size="18" /> <b>User Type:</b> <i>{item.roleType}</i></span>
                        <span className="d-md-inline" style={styles.dataSummaryDetail}>
                          <MdLockOutline size="18" /> <b>Permissions:</b> <PermissionDropdown permissions={item.permissions}/>
                        </span>
                      </div>
                    }
                    <div hidden={!item.relevance.score || !showRelevance}>
                      <hr />
                      <Card.Footer className="text-muted small" style={{ border: 0 }}>
                        <div><b>Search Term Matches</b></div>
                        <div><i>{distinctlyMatchedKeys.join(', ')}</i></div>
                      </Card.Footer>
                    </div>
                  </Card>
                  <Spacer height="10px" />
                </div>
              )
            })}
            <div align="center" hidden={!!itemsForDisplay.length}>
              <Spacer height="20px" />
              <Card.Text className="text-muted"><i>No {type.toLowerCase()}s found</i></Card.Text>
            </div>
          </Col>
        </Row>
        <Row className="justify-content-center" hidden={filteredItems.length <= maxResults}>
          <Col xs={{ span: 'auto' }}>
            <Spacer height="36px" />
            <Paginator
              currentPage={maxPages >= page ? page : 1}
              totalPages={maxPages}
              onChange={(page) => {
                this.setState({ page })
              }}
            />
          </Col>
        </Row>
      </div>
    );
  }
};

/* istanbul ignore next */
const CatalogSearchComponent = withRouter(props => (
  <AppStateConsumer>
    {({ isLoading, setLoading, loggedInUser, isReloadDatasets, setReloadDatasets }) => (
      <CatalogSearch
        {...props}
        isLoading={isLoading}
        setLoading={setLoading}
        loggedInUser={loggedInUser}
        isReloadDatasets={isReloadDatasets}
        setReloadDatasets={setReloadDatasets}
      />
    )}
  </AppStateConsumer>
));

export default CatalogSearchComponent;
