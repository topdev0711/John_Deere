// Unpublished Work © 2022 Deere & Company.
import React, {Component} from 'react';
import {withRouter} from 'next/router';
import Spacer from '../../../components/Spacer';
import {AppStateConsumer} from '../../../components/AppState';
import utils from '../../../components/utils';
import AllowedPermissions from '../../../components/AllowedPermissions';
import {accessibleDatasets, allowedPermissions} from '../../../apis/access';
import {getAllVersions, getDetailedDataset} from '../../../apis/datasets';
import {getGroupsPermissions} from '../../../apis/permissions';
import CommentHistoryMultipleVersions from '../../../components/CommentHistoryMultipleVersions';
import Alerts from '../../../components/Alerts';
import DetailsBreadcrumb from '../../../components/datasets/details/DetailsBreadcrumb';
import DetailsTabs from '../../../components/datasets/details/DetailsTabs';
import {isLatestNonAvailableStatus, isNonDeleteStatus} from '../../../src/services/statusService';
import GeneralDetails from '../../../components/datasets/details/GeneralDetails';
import SmallSpinner from '../../../components/SmallSpinner';
import DetailActionButtons from '../../../components/datasets/details/DetailActionButtons';
import { VISIBILITY } from '../../../src/utilities/constants';
import { AccessDenied } from '../../../components/datasets/details/AccessDenied';

class DatasetDetail extends Component {
  state = {
    dataset: null,
    loadError: 0,
    showDiff: false,
    permissionsWithAccess: [],
    loadingPermissionsWithAccess: true,
    isLoadingDetails: true,
    showFullDetails: false,
    nonAvailableVersion: null,
    hasAccess: false,
    isDetailedDataset: false,
    loadingFull: false,
    allVersionsLoaded: false,
    allVersions: [],
    accessibleViews: []
  };

  setDataset = dataset => this.setState({dataset});

  loadDataset = async (id, version, detailed = false) => {
    const { initialId = id, initialVersion = version } = this.props
    let dataset = await getDetailedDataset(detailed, initialId, initialVersion);
    if (dataset?.error) {
      this.setState({ loadError: dataset?.error , isLoadingDetails: false});
    } else {
      if (detailed) {
        dataset = {...dataset, linkedSchemas: utils.formatSchemas(dataset.linkedSchemas), schemas: utils.formatSchemas(dataset.schemas)};
      }
      const catalogApprovalBlock = dataset.approvals?.find(approval => approval.system === 'Catalog');
      const isPendingDelete = !!catalogApprovalBlock && catalogApprovalBlock.status === 'PENDING DELETE';
      dataset = { ...dataset, isPendingDelete };
      this.setState({ dataset });

      await this.loadAllVersions();
      const latestAvailableVersion = dataset.previousVersion;
      const showDiff = !!latestAvailableVersion && dataset.status === 'PENDING';
      const nonAvailableVersion = this.state?.allVersions?.length > 0 ? (this.state?.allVersions.find(isLatestNonAvailableStatus) || { version: -1 }).version : 0;

      this.setState({
        nonAvailableVersion: nonAvailableVersion !== dataset.version ? nonAvailableVersion : -1,
        isLoadingDetails: false,
        latestAvailableVersion: !!latestAvailableVersion ? latestAvailableVersion : null,
        showDiff,
        isDetailedDataset: !!detailed
      }, () => {
        this.loadAllowedPermissions();
        this.checkUserAccess();
        this.props.setLoading(false);
      });
    }
  }

  loadAllowedPermissions = async () => {
    if (!this.state.dataset) return;

    const {classifications, status} = this.state.dataset;
    const loggedInUser = this.props.loggedInUser;
    try {
      const classificationsPermissions = await allowedPermissions(classifications);
      const hasAccess = isNonDeleteStatus(status) && classificationsPermissions.some(e => loggedInUser.groups?.includes(e.group));
      const permissionsWithAccess = utils.findLatestAvailableVersions(classificationsPermissions);
      this.setState({hasAccess, permissionsWithAccess});
    } catch (err) {
      console.error(err);
    }

    this.setState({loadingPermissionsWithAccess: false});
  }

  checkUserAccess = async () => {
    const {dataset} = this.state;
    if (!dataset || dataset.status !== 'AVAILABLE') return;

    try {
      const name = dataset.environmentName || '';
      const hasAccess = await accessibleDatasets(name);
      this.setState({hasAccess});
    } catch (error) {
      console.error('Something unexpected occurred: ', error);
    }
  }

  componentDidUpdate() {
    const {router: {query}, initialId} = this.props;
    const {dataset, showDiff, isDetailedDataset, loadingFull} = this.state;
    const changedVersion = !!query.version && query.version !== 'undefined' ? !!dataset && dataset.id === query.id && dataset.version?.toString() !== query.version : false;
    const changedDataset = dataset && dataset.id !== query.id;
    if (!initialId && (changedDataset || changedVersion)) {
      this.setState({dataset: null, isLoadingDetails: true}, () => this.loadDataset(query.id, query.version));
    }
    if (dataset) {
      const {phase, discoveredSchemas} = dataset;
      if ((showDiff || ['raw', 'model'].includes(phase.name?.toLowerCase()) && discoveredSchemas.length) && !isDetailedDataset && !loadingFull) {
        this.setState({loadingFull: true});
        this.loadDataset(query.id, query.version, true);
      }
    }
  }

  loadAccessibleViews = async () => {
    const userPermissions = await getGroupsPermissions(this.props?.loggedInUser.groups, ['human']);
    const accessibleViews = userPermissions.filter(utils.isPermEffective).flatMap(p => p.views).filter(view => view !== undefined);
    this.setState({accessibleViews});
  }

  componentDidMount() {
    const {query} = this.props.router;
    const isDetailed = query.edit === 'true';
    this.loadDataset(query.id, query.version, isDetailed);
    this.loadAccessibleViews();
  }

  loadAllVersions = async () => {
    try {
      const {dataset} = this.state;
      const {id} = dataset;
      const allVersions = await getAllVersions(id);
      this.setState({allVersions: allVersions, allVersionsLoaded: true});
    } catch (error) {
      console.error('Error fetching all versions: ', error);
    }
  };

  render() {
    const {loggedInUser} = this.props;
    const {nonAvailableVersion, isLoadingDetails, dataset, loadError, showDiff, latestAvailableVersion, permissionsWithAccess, loadingPermissionsWithAccess, hasAccess, isDetailedDataset, allVersions, allVersionsLoaded, accessibleViews} = this.state;
    const custodian = (dataset || {}).custodian || '';
    const visibility = (dataset || {}).visibility || VISIBILITY.FULL_VISIBILITY;
    const isCustodian = (loggedInUser || {}).groups.includes(custodian) || false;
    const commentRecords = allVersions.length !== 0 ? allVersions : [dataset];
    const commentDetails = {expanded: false, loaded: allVersionsLoaded};

    const isVisibilityEnabled = this.props?.context?.toggles['jdc.custodian_visibility_flag']?.enabled || false;
    if (isVisibilityEnabled && visibility === VISIBILITY.NO_VISIBILITY && !isCustodian) return <AccessDenied />;

    if(isLoadingDetails) return <SmallSpinner/>;
    if(!!loadError) return <div>Dataset not found</div>;
    if(!dataset) return <></>;

    return (
      <div id={'dataset-details-root'}>
        <DetailsBreadcrumb/>
        <DetailActionButtons dataset={dataset} setDataset={this.setDataset} latestAvailableVersion={latestAvailableVersion} nonAvailableVersion={nonAvailableVersion} permissions={permissionsWithAccess} loadingPermissionsWithAccess={loadingPermissionsWithAccess}/>
        <Alerts type={'dataset'} nonAvailableVersion={nonAvailableVersion} record={dataset} isCustodian={isCustodian}/>
        <Spacer height="10px"/>
        <GeneralDetails dataset={dataset} hasAccess={hasAccess} latestAvailableVersion={latestAvailableVersion} showDiff={showDiff}/>
        <CommentHistoryMultipleVersions records={commentRecords} details={commentDetails} loadAllVersions={this.loadAllVersions}/>
        <Spacer/>
        <DetailsTabs dataset={dataset} accessibleViews={accessibleViews} isDetailedDataset={isDetailedDataset} hasAccess={hasAccess} showDiff={showDiff} latestAvailableVersion={latestAvailableVersion}/>
        <br/>
        <AllowedPermissions permissions={permissionsWithAccess} isLoading={loadingPermissionsWithAccess} datasetId={dataset.id} hasAccess={hasAccess}/>
      </div>
    );
  }
}

const Detail = withRouter(props => (
  <AppStateConsumer>
    {({loggedInUser, setLoading, ctx}) => (<DatasetDetail {...props} setLoading={setLoading} loggedInUser={loggedInUser} context={ctx}/>)}
  </AppStateConsumer>
));

export default Detail;
