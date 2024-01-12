import React from 'react';
import {withRouter} from 'next/router';
import Link from 'next/link';
import {MdClear, MdLockOpen, MdAdd, MdTrendingDown, MdSortByAlpha} from 'react-icons/md';
import {TiFilter} from 'react-icons/ti';
import {AppStateConsumer} from '../../AppState';
import Spacer from '../../Spacer';
import DatasetSearchFilter from './DatasetSearchFilter';
import Paginator from '../../Paginator';
import {Row, Col, Button, ButtonGroup, Card, InputGroup, FormControl, Overlay, Popover} from 'react-bootstrap';
import {getDatasetSearchCount, getDatasetWithQuery} from '../../../apis/datasets';
import {getSourceDBDetails} from '../../../apis/lineage';
import {buildQueryString, createPaginatedQuery} from './CatalogUtility';
import CatalogBadge from '../../search/CatalogBadge';
import {MetricSpinner} from '../../DataQuality/MetricSpinner';
import RelevanceDatasetCard from './RelevanceDatasetCard';
import utils from '../../utils';
const publicId = '10710b7a-7391-4860-a18d-1d7edc746fe7';
export class PaginatedDatasetCatalog extends React.Component {
  filterRef = React.createRef();

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
    userAccessibleDatasets: [],
    showRelevance: false,
    datasets: [],
    permissions: [],
    userPermissions: [],
    filteredDataset: [],
    firstLoad: true,
    lineageFilterInfo: [],
    loadingDataset: true,
    datasetCount: '',
  };

  setPage = page => this.setState({page});

  updateFilters = (filters = {}) => {
    if (this.state.filters != filters) {
      this.setState({filters: filters});
    }
  }

  applySearchFromFilter = async () => {
    this.setState({loadingDataset: true, showFilter: false, page: 1});
    await this.applySearch();
  }

  createLinageFilters = () => {
    const aggLineageInfo = {};

    this.state.lineageFilterInfo.forEach(item => {
      if (!aggLineageInfo[item.datatype]) {
        aggLineageInfo[item.datatype] = {
          databases: [item.database],
          servers: [item.server],
          tableNames: [item.tableName]
        }
      } else {
        aggLineageInfo[item.datatype].databases.push(item.database);
        aggLineageInfo[item.datatype].servers.push(item.server);
        aggLineageInfo[item.datatype].tableNames.push(item.tableName);
      }
    });
    return aggLineageInfo;
  }

  getLineageDatasets = (availableDatasets) => {
    const aggLineageInfo = this.createLinageFilters();
    const getLineageInfo = dataset => {
      if (!aggLineageInfo[dataset.environmentName]) return dataset;
      const {databases, servers, tableNames} = aggLineageInfo[dataset.environmentName];
      return {...dataset, databases, servers, tableNames};
    }

    return availableDatasets.map(getLineageInfo);
  }

  async setDatasetCount(queryString) {
    const datasetCount = await getDatasetSearchCount(queryString);
    this.setState({datasetCount});
  }

  isPublicToggleEnabled = () => utils.hasAdGroupToggleEnabled(this.props.toggles['datacatalogui.public_datasets'], this.props?.loggedInUser?.groups);

   applySearch = async (filters) => {
    const {lineageFilterInfo, maxResults, page, searchCriteria} = this.state;
    const queryString = createPaginatedQuery(searchCriteria, filters || this.state.filters, page, maxResults, this.isPublicToggleEnabled(), publicId);
    this.setDatasetCount(queryString);
    const availableDatasets = await getDatasetWithQuery(queryString);
    if(!searchCriteria) this.setState({showRelevance: false});
    this.setState({filteredDataset: availableDatasets});
    this.setState({loadingDataset: false});
  }

  clearFilters = () => {
    this.setState({loadingDataset: true});
    this.filterRef.current.resetState();
    this.updateFilters({});
    this.applySearch({});
  }

  activeFilters = () => {
    let {defaultFilters: filters} = this.props;
    if (!filters) {
      filters = this.state.filters;
    }

    return Object.keys(filters)
      .filter(key => filters[key] && filters[key].length)
      .map(key => {
        const filter = filters[key];
        const apply = comparator => !!filter.find(comparator);
        return {key, apply};
    });
  }

  loadLineageFilterInfo = async () => {
    const lineageFilterInfo = await getSourceDBDetails();
    this.setState({lineageFilterInfo});
  }

  searchDelay = setTimeout(() => {});

  handleSearchChange = value => {
    clearTimeout(this.searchDelay);
    this.searchDelay = setTimeout(() => {
      this.setState({loadingDataset: true});
      this.setState({searchCriteria: value, page: 1});
      this.applySearch()
    }, 1000);
  }

  handleEventSearchChange = e => this.handleSearchChange(e.target.value);
  toggleFilter = () => this.setState({showFilter: !this.state.showFilter})

  handleAccessReqCtxClick = ({target}) => {
    this.setState({accessReqCtxTarget: target, accessReqCtxShow: !this.state.accessReqCtxShow});
  }

  async componentDidMount() {
    await this.loadLineageFilterInfo();
    this.setState({loadingDataset: true});
    this.applySearch();
    const {q} = this.props.router.query;
    if (q) this.handleSearchChange(q);
  }

  async componentDidUpdate(prevProps, prevState) {
    window.scrollTo(0, 0)
    const {page} = this.state;
    if(prevState.page !== page) this.applySearch();
  }

  RegisterDataset = React.forwardRef(({onClick, href}, ref) => (
    <Button href={href} onClick={onClick} ref={ref} size="sm" variant="outline-primary">
      <MdAdd/> Register Dataset
    </Button>
  ));

  RequestAccessButton = React.forwardRef(({onClick, href}, ref) => (
    <Button href={href} onClick={onClick} ref={ref} size="sm" variant="outline-primary">
      <MdLockOpen/> Request Access
    </Button>
  ));

  clearSelectedItems = () => {
    this.setState({selectedItems: [], accessReqCtxShow: false});
  }

  updateSelectedItems = (item, remove = false) => {
    const stateItems = this.state.selectedItems;
    const selectedItems = remove ? stateItems.filter(({id: i}) => i !== item.id) : [...stateItems, item];
    this.setState({selectedItems});
  }

  renderNoDatasets = () => (
    <div align="center">
      <Spacer height="20px"/>
      <Card.Text className="text-muted"><i>No datasets found</i></Card.Text>
    </div>
  )

  renderDataset = (item,showRelevance) => {
    <RelevanceDatasetCard item={item} state={this.state} props={this.props}
    updateSelectedItems={this.updateSelectedItems} showRelevance={showRelevance}/>
  };

  renderDatasets = (listingOnly, showRelevance) => {
    const {maxResults, page, filteredDataset, datasetCount} = this.state;
    if(!filteredDataset.length) return this.renderNoDatasets();
    const maxPages = Math.ceil(datasetCount / maxResults) || 1;
    const currentPage = maxPages >= page ? page : 1;
    const hasMultiplePages = datasetCount > maxResults;
    return (
      <>
        <Row className="flex-xl-nowrap">
          <Col md={{span: 24}}>
            <div hidden={!filteredDataset.length || listingOnly} className="float-right text-muted small"
                style={{ marginTop: '-14px', fontStyle: 'italic' }}>
                {!!this.state.searchCriteria.length ?
                    <><MdTrendingDown /> sorted by relevance <Button
                        onClick={() => this.setState({ showRelevance: !showRelevance })} variant="link"
                        size="sm" style={{
                            marginLeft: '-5px',
                            marginTop: '-5px',
                            textDecoration: 'none'
                        }}>?</Button></> :
                    <><MdSortByAlpha /> sorted alphabetically</>
                }
            </div>
            {filteredDataset.map(item =>
              <RelevanceDatasetCard item={item} state={this.state} props={this.props}
              updateSelectedItems={this.updateSelectedItems} showRelevance={showRelevance}/>)}
          </Col>
        </Row>
        <Row className="justify-content-center" hidden={!hasMultiplePages}>
          <Col xs={{span: 'auto'}}>
            <Spacer height="36px"/>
            <Paginator currentPage={currentPage} totalPages={maxPages} onChange={this.setPage}/>
          </Col>
        </Row>
      </>
    )
  }

  handleOnHideContext = () => this.setState({accessReqCtxShow: false});
  permissionAccessLink = () => `/catalog/permissions/request${buildQueryString(this.state.selectedItems)}`;
  renderSelectedPermission() {
    return s =>
      <li key={s.id}>
        <span style={{fontSize: 14}}>{s.name}</span>
        <Spacer height="5px"/>
      </li>;
  }

  renderSelectedPermissions = () => this.state.selectedItems.map(this.renderSelectedPermission)

  render() {
    const {selectedItems, searchCriteria, loadingDataset, datasetCount, showFilter, showRelevance} = this.state;
    const {hiddenFilters, listingOnly} = this.props;
    const filters = this.activeFilters();
    const searchbarMessage = loadingDataset ? '' : `Search ${datasetCount} datasets`;

    return (
      <div hidden={this.props.hidden}>
        <div hidden={listingOnly}>
          <Row>
            <Col md={{span: 12}}>
              <h2>Dataset Catalog</h2>
              <Spacer height='15px'/>
            </Col>
            <Col>
              <span className="float-md-right catalog-registerNewDataset">
                <ButtonGroup style={{marginRight: '10px'}}>
                  <Link href={this.permissionAccessLink()}><this.RequestAccessButton/></Link>
                  <Overlay rootClose target={this.state.accessReqCtxTarget} placement="bottom" onHide={this.handleOnHideContext} show={this.state.accessReqCtxShow}>
                    <Popover className="catalog-popover" id="popover-positioned-bottom">
                      <i className="text-muted">Request access to the following selected datasets.<br/>You can make adjustments on the next step.</i>
                      <Spacer height="10px"/>
                      <div>
                        <Button id="clearSelectedItems" size="sm" variant="secondary" onClick={this.clearSelectedItems}><MdClear/> Clear Selections</Button>
                      </div>
                      <hr/>
                      {this.renderSelectedPermissions()}
                    </Popover>
                  </Overlay>
                  <Button hidden={!selectedItems.length} onClick={this.handleAccessReqCtxClick} size="sm" variant="outline-primary">{selectedItems.length}</Button>
                </ButtonGroup>
                <Link href={'/datasets/register'}><this.RegisterDataset/></Link>
              </span>
              <Spacer height='15px'/>
            </Col>
          </Row>
          <Spacer height='8px'/>
          <Row className="catalog-noWrap">
            <Col md={{span: 24}}>
              <InputGroup>
                <FormControl id="catalogSearchBar" type="text" placeholder={searchbarMessage} defaultValue={searchCriteria} onChange={this.handleEventSearchChange}/>
                <InputGroup.Append>
                  <Button variant={filters.length ? 'success' : 'link'} onClick={this.toggleFilter}><TiFilter size="16"/></Button>
                </InputGroup.Append>
              </InputGroup>
            </Col>
          </Row>
          <Row hidden={!showFilter}>
            <Col md={{span: 24}}>
              <DatasetSearchFilter hiddenFilters={hiddenFilters} onChange={this.updateFilters} filters={this.state.filters} ref={this.filterRef} applySearch={this.applySearchFromFilter}/>
            </Col>
          </Row>
          <div className="catalog-badgeContainer">
            <CatalogBadge label={'Clear Filters'} onClick={this.clearFilters} isHidden={!filters.length}/>
            <CatalogBadge label={'Clear Selected'} onClick={this.clearSelectedItems} isHidden={!selectedItems.length}/>
          </div>
          <Spacer height='25px'/>
        </div>
        {(loadingDataset) ? <MetricSpinner/> : this.renderDatasets(listingOnly, showRelevance)}
      </div>
    );
  }
}

/* istanbul ignore next */
const PaginatedDatasetCatalogComponent = withRouter(props => (
  <AppStateConsumer>
    {({isLoading, setLoading, loggedInUser, isReloadDatasets, setReloadDatasets, toggles}) => (
      <PaginatedDatasetCatalog
        {...props}
        isLoading={isLoading}
        setLoading={setLoading}
        loggedInUser={loggedInUser}
        isReloadDatasets={isReloadDatasets}
        setReloadDatasets={setReloadDatasets}
        toggles={toggles}
      />
    )}
  </AppStateConsumer>
));

export default PaginatedDatasetCatalogComponent;
