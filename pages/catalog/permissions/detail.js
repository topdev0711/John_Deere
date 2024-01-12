import React from 'react';
import { Breadcrumb, Card, Button, Tab, Nav, Spinner, Modal } from 'react-bootstrap';
import {withRouter} from 'next/router';
import { AppStateConsumer } from '../../../components/AppState';
import Spacer from '../../../components/Spacer';
import PermissionForm from '../../../components/PermissionForm';
import DiffUtils from '../../../components/DiffUtils';
import { MdEdit, MdAvTimer, MdPeople, MdVpnKey, MdDateRange, MdLayers, MdCompareArrows, MdClear, MdRadioButtonChecked, MdFilter } from 'react-icons/md'
import {FaAsterisk} from "react-icons/fa";
import utils from '../../../components/utils'
import ListedDatasets from '../../../components/ListedDatasets';
import ClassificationDetail from '../../../components/ClassificationDetail';
import Alerts from '../../../components/Alerts';
import ListedViews from '../../../components/ListedViews';
import UserModal from '../../../components/UserModal';
import CopyableText from '../../../components/CopyableText';
import { getAccessibleDatasets } from '../../../apis/acls';
import { getViewsWithStatus } from '../../../apis/metastore';
import { getPermission, getAllVersions, postApproval, postRejection } from '../../../apis/permissions';
import CommentHistoryMultipleVersions from '../../../components/CommentHistoryMultipleVersions';
import ApproveButton from "../../../components/approvals/ApproveButton";
import RejectButton from "../../../components/approvals/RejectButton";
import {getLatestPendingUserApprovals} from "../../../components/utils/ApprovalsUtil";

const styles = {
  breadcrumb: {
    marginLeft: '-17px',
    marginTop: '-17px'
  },
  meta: {
    paddingRight: '15px',
    paddingBottom: '5px',
    display: 'block',
    color: '#777'
  },
  edit: {
    float: 'right',
    marginTop: '-55px'
  },
  tabChanges: {fontSize: '10px', marginTop:'-4px', color: '#e69d00'}
};

const nonAvailableStatus = ['PENDING', 'REJECTED', 'APPROVED'];
const hasNonAvailableStatus = ({ status }) => nonAvailableStatus.includes(status);

class PermissionDetail extends React.Component {
  state = {
    isEditing: false,
    permission: null,
    latestAvailableVersion: null,
    showDiff: false,
    accessibleDatasets: [],
    loadingAccessibleDatasets: true,
    isLoading: true,
    nonAvailableVersion: 0,
    modal: null,
    didEntitlementsChange: false,
    didViewChange: false,
    allVersionsLoaded: false,
    allVersions: []
  }

  createPermissionWithApprovalInfo = () => getLatestPendingUserApprovals({...this.state.permission}, this.props.loggedInUser, 'Permission');

  hasVersionChanged = () => {
    const { permission } = this.state;
    const { query } = this.props.router;
    if(!permission) return !!permission;

    const hasVersion = !!query.version && query.version !== 'undefined';
    const hasRouterId = permission.id === query.id;
    const hasNewRouterVersion = permission.version.toString() !== query.version;
    return hasVersion && hasRouterId && hasNewRouterVersion;
  }

  componentDidMount() {
    this.loadPermission(this.props.router.query.id, this.props.router.query.version);
  }

  componentDidUpdate(prevProps, prevState) {
    const { query } = this.props.router;
    const hasNewPermission = prevState.allVersions.length !== this.state.allVersions.length;
    if (this.hasVersionChanged() || hasNewPermission) {this.loadPermission(query.id, query.version);}
  }

  loadPermission = async (id, version) => {
    await this.loadAllVersions(id);

    const { initialPermission } = this.props;
    const { allVersions } = this.state;
    const permission = await (initialPermission ? this.getStatusForViews(initialPermission) : getPermission(id, version));
    const availableVersions = utils.findLatestAvailableVersions(allVersions);
    const latestAvailable = availableVersions.filter(p =>  p.id === (permission || {}).id);
    const nonAvailableVersion = allVersions.length > 0 ? (allVersions.find(hasNonAvailableStatus) || {version: -1}).version : 0;
    const latestAvailableVersion = !!latestAvailable.length ? await this.getStatusForViews(latestAvailable[0]) : null;
    this.setState({
      nonAvailableVersion: nonAvailableVersion !== permission.version ? nonAvailableVersion : -1,
      permission,
      latestAvailableVersion,
      isLoading: false,
      showDiff: !!latestAvailableVersion && permission.status === 'PENDING'
    }, () => {
      this.loadDatasetsAccessible();
      this.shouldEditOnLoad();
      this.props.setLoading(false);
    });
  }

  shouldEditOnLoad = () => {
    const { permission, isEditing, nonAvailableVersion } = this.state;
    const { loggedInUser, router } = this.props;
    const shouldHideEdit = utils.hideEditButton(permission, (loggedInUser || {}).username, nonAvailableVersion > 0);
    if(!!nonAvailableVersion && !!permission && router.query.edit === 'true' && !isEditing && !shouldHideEdit) this.setState({ isEditing: true })
    else if (!!nonAvailableVersion && router.query.edit === 'true') router.push('/catalog/permissions/detail?id=' + router.query.id + '&version=' + router.query.version + '&edit=false')
  }

  loadDatasetsAccessible = async () => {
    const permission = this.state.permission;
    if (permission) {
      try {
        const datasets = await getAccessibleDatasets(permission.entitlements);

        this.setState({
          accessibleDatasets: utils.findLatestAvailableVersions(datasets),
          loadingAccessibleDatasets: false
        });
      } catch (err) {
        this.setState({loadingAccessibleDatasets: false});
        console.log(err);
      }
    }
  }

  edit = async () => {
    const { router, loggedInUser: { username } } = this.props;
    const { permission } = this.state;
    if (permission.status === 'AVAILABLE') {
      this.setState({ isLoading: true });
      const lockResponse = await fetch('/api/permissions/' + permission.id + '/' + permission.version + '/lock', {credentials: 'same-origin', method: 'POST'});
      if (lockResponse.ok) {
        this.setState({ isEditing: true, isLoading: false, permission: { ...permission, lockedBy: username } });
        router.push('/catalog/permissions/detail?id=' + router.query.id + '&version=' + router.query.version + '&edit=true');
      } else {
        this.setState({ isLoading: false });
        const err = await lockResponse.json();
        this.setModal({body: err.error});
      }
    } else {
      this.setState({ isEditing: true });
      router.push('/catalog/permissions/detail?id=' + router.query.id + '&version=' + router.query.version + '&edit=true');
    }
  }

  endEdit = () => {
    const { router } = this.props;
    this.setState({ isEditing: false });
    if(router.query.edit === 'true') router.push('/catalog/permissions/detail?id=' + router.query.id + '&version=' + router.query.version + '&edit=false');
  }

  cancelAndUnlock = async (endEdit = false) => {
    const { permission } = this.state;
    this.setState({ isLoading: true });
    const response = await fetch('/api/permissions/' + permission.id + '/' + permission.version + '/unlock', {credentials: 'same-origin', method: 'POST'});
    if (response.ok) {
      if(endEdit) { this.endEdit(); }
      this.setState({permission: utils.removeAndUnlockRecord(permission)});
    } else {
      const err = await response.json();
      this.setModal({body: err.error});
    }
    this.setState({isLoading: false});
  }

  setModal = modal => this.setState({modal});

  ChangedIndicator = () => <>&nbsp;<FaAsterisk style={styles.tabChanges}/></>;

  createGroupElement = (diff) => {
    const { showDiff, permission: { group } } = this.state;
    if (showDiff) return diff.displayValue('group');
    return (<UserModal linkName={group} groupName={group} useItalics={true}/>);
  }

  getStatusForViews = async (permission) => {
    const { views } = permission;
    const needViewStatus = (views && views.length && !views[0].status);
    if (!needViewStatus) return permission;
    const viewsWithStatus = await getViewsWithStatus(views);
    return { ...permission, views: viewsWithStatus };
  }

  getPermissionForForm = (permission) => {
    const views = permission.views ? permission.views.filter(v => v.status !== 'DELETED').map(v =>  v.name) : [];
    return { ...permission, views };
  }

  loadAllVersions = async id => {
    if (this.state.allVersions.length) return;
      try {
        const allVersions = await getAllVersions(id);
        this.setState({ allVersions, allVersionsLoaded: true });
      } catch (error) {
        console.error('Error fetching all versions: ', error);
      }
  };

  createOutlineButton = (onClickHandler, icon, text) =>  <Button onClick={onClickHandler} size="sm" variant="outline-primary">{icon} {text}</Button>;

  hideDiff = () => this.state.permission.status !== 'PENDING' || !this.state.latestAvailableVersion;

  renderDiffButton = () => {
    const { showDiff } = this.state;
    const text = !!showDiff ? 'Hide Changes' : 'Show Changes';
    const invertShowDiff = () => this.setState({ showDiff: !showDiff });
    return this.createOutlineButton(invertShowDiff, <MdCompareArrows />, text);
  }

  renderUnlockButton = () => this.createOutlineButton(this.cancelAndUnlock, <MdClear />, 'Cancel & Unlock');

  renderEditButton = () => this.createOutlineButton(this.edit, <MdEdit />, 'Edit');

  handleApproval = async (id, version) => {
    console.log('Approve', id, version);
    const {router} = this.props;

    const approveResponse = await postApproval(id, version);
    if (approveResponse.ok) {
      router.push('/approvals')
    } else {
      const errorResponse = await approveResponse.json();
      this.showError('Failed to submit approval.', errorResponse.error);
      console.log(errorResponse);
    }
  }

  handleRejection = async ({id, version, type, comments}) => {
    console.log('Reject', id, version);
    const {router} = this.props;

    const rejectionReason = comments || 'No comments';
    const rejectResponse = await postRejection(id, version, { reason: rejectionReason });
    if (rejectResponse.ok) {
      router.push('/approvals')
    } else {
      const errorResponse = await rejectResponse.json();
      this.showError('Failed to submit rejection.', errorResponse.error);
      console.log(errorResponse);
    }
  }

  showError = (message, error) =>
    ({
      modal: {
        onAccept: () => ({ modal: null }),
        showAcceptOnly: true,
        acceptButtonText: 'OK',
        body: (
          <div>
            <div>{message}</div>
            <br />
            <div>{error}</div>
          </div>
        )
      }
    });

  render() {
    const { isLoading, permission, showDiff, latestAvailableVersion, accessibleDatasets, loadingAccessibleDatasets, nonAvailableVersion, modal, didEntitlementsChange, didViewChange, allVersions, allVersionsLoaded } = this.state;
    const views = permission && permission.views ? permission.views : [];
    const prevViews = latestAvailableVersion && latestAvailableVersion.views ? latestAvailableVersion.views : [];
    const { handleClick, router, history } = this.props;
    const { ref } = this.props.router.query;
    const isEditing = this.state.isEditing || this.props.isEditing;
    const diff = new DiffUtils(permission, latestAvailableVersion, showDiff);
    const username = (this.props.loggedInUser|| {}).username;
    const lockedBy = (permission || {}).lockedBy;
    const hideUnlock = !lockedBy || username !== lockedBy;
    const hideEdit = nonAvailableVersion === 0 || utils.hideEditButton(permission, username, nonAvailableVersion > 0) || !!this.props.buttonsHidden;
    const isEffective = utils.isPermEffective(permission);
    const isExpired = utils.isPermExpired(permission);
    const showChangesForViews = !!views && views.length || (!!prevViews && prevViews.length && !!showDiff);
    const catalogPath = history?.find((item) => item.startsWith("/catalog/permissions?")) ?? "/catalog/permissions";
    return (
        <>
          <div hidden={isLoading}>
            <Modal size="lg" show={!!modal} onHide={() => setModal(null)}>
              <Modal.Body>{(modal || {}).body}</Modal.Body>
              <Modal.Footer><Button variant="primary" onClick={() => this.setModal(null)}>OK</Button></Modal.Footer>
            </Modal>
            <Breadcrumb hidden={!!this.props.breadcrumbHidden} style={styles.breadcrumb}>
              {!ref &&
              <Breadcrumb.Item>
                <a onClick={() => handleClick(catalogPath)}><span>Catalog</span></a>
              </Breadcrumb.Item>
              }
              {!!ref &&
              <Breadcrumb.Item>
                <a onClick={() => handleClick("/approvals")}><span>Approvals</span></a>
              </Breadcrumb.Item>
              }
              {(!!permission) &&
              <Breadcrumb.Item>
                <a onClick={() => handleClick('/catalog/permissions/summary-detail?' + `${permission.roleType === 'human' ? 'group' : 'clientId'}=${permission.roleType === 'human' ? permission.group : permission.clientId}`)}><span>{permission.roleType === 'human' ? permission.group : permission.clientId}</span></a>
              </Breadcrumb.Item>
              }
              <Breadcrumb.Item
                  active={!isEditing}
                  onClick={() => handleClick('/catalog/permissions/detail?id=' + router.query.id + '&version=' + router.query.version + '&edit=false', this.endEdit)}
              >
                Permission Detail
              </Breadcrumb.Item>
              {isEditing &&
              <Breadcrumb.Item active>Edit</Breadcrumb.Item>
              }
            </Breadcrumb>
            {!!permission &&
            <>
              <div hidden={!!isEditing}>
                <div style={styles.edit}>
                  <span hidden={this.hideDiff()}>{this.renderDiffButton()}</span>&nbsp;&nbsp;
                  <span hidden={hideUnlock}>{this.renderUnlockButton()}&nbsp;&nbsp;</span>
                  <span hidden={hideEdit}> {this.renderEditButton()}</span>
                  <span>
                  <ApproveButton
                    handleApproval={() => this.handleApproval(permission.id, permission.version)}
                    isUpdating={false}
                    item={this.createPermissionWithApprovalInfo()} />
                    &nbsp;&nbsp;
                    <RejectButton
                      handleRejection={this.handleRejection}
                      isUpdating={false}
                      item={this.createPermissionWithApprovalInfo()} />
                </span>
                </div>
                <Alerts type={'permission'} record={permission} nonAvailableVersion={nonAvailableVersion}/>
                <Spacer height="10px" />
                <Card>
                  <Card.Body className={`${permission.status}-static`} >
                    <h3>{diff.displayValue('name')}</h3>
                    <Card.Text className="text-muted">
                      <i>{diff.displayValue('businessCase')}</i>
                    </Card.Text>
                    <hr />
                    <Spacer height="14px" />
                    <Card.Text className="text-muted small">
                  <span style={styles.meta}>
                    <MdPeople size="18" />
                    <b>Group:</b>
                    <i>{this.createGroupElement(diff)}</i>
                  </span>
                      <span hidden={permission.roleType === 'human'} style={styles.meta}><MdVpnKey size="18" /> <b>Client ID:</b> <i>{diff.displayValue('clientId')}</i></span>
                      {!showDiff &&
                      <span style={styles.meta}><MdDateRange size="18" />
                      <b> Effective: </b>
                      <i> {utils.formatTimeframe(permission)}
                        <span hidden={!isExpired} style={{color: '#c21020'}}> (Expired)</span>
                        <span hidden={isEffective || isExpired} style={{color: '#c21020'}}> (Not-Active)</span>
                      </i>
                    </span>
                      }
                      {!!showDiff && !!latestAvailableVersion &&
                      <span style={styles.meta}><MdDateRange size="18" /> <b>Effective:</b> <i>{diff.diffValues(utils.formatTimeframe(permission), utils.formatTimeframe(latestAvailableVersion))}</i></span>
                      }
                      <span style={styles.meta}><MdLayers size="18" /> <b>User Type:</b> <i>{diff.displayValue('roleType')}</i></span>
                      <span style={styles.meta}><MdAvTimer size="18" /> <b>Status:</b> <i>{permission.status}</i></span>
                      <span style={styles.meta}><MdRadioButtonChecked size="18" /> <b>ID:</b> <i><CopyableText>{permission.id}</CopyableText></i></span>
                      <span style={styles.meta}><MdFilter size="18" /> <b>Version:</b> <i>{permission.version}</i></span>
                    </Card.Text>
                  </Card.Body>
                </Card>
                <CommentHistoryMultipleVersions
                  records={allVersions.length != 0 ? allVersions : [permission]}
                  details={{ expanded: false, loaded: allVersionsLoaded }}
                  loadAllVersions={() => this.loadAllVersions()}
                />
                <Spacer/>
                <Tab.Container transition={false} defaultActiveKey="entitlements">
                  <Nav size="sm" variant="tabs" className="uxf-nav-tabs-medium">
                    <Nav.Item>
                      <Nav.Link eventKey="entitlements">Entitlements{!!(permission.entitlements || []).length ? ` (${(permission.entitlements || []).length})` : ''}{showDiff && didEntitlementsChange && <this.ChangedIndicator/>}</Nav.Link>
                    </Nav.Item>
                    {!!showChangesForViews &&
                    <Nav.Item>
                      <Nav.Link eventKey="views">Views{!!views.length ? ` (${views.length})` : ''}{showDiff && didViewChange && <this.ChangedIndicator/>}</Nav.Link>
                    </Nav.Item>
                    }
                  </Nav>
                  <Tab.Content>
                    <Tab.Pane eventKey="entitlements">
                      <ClassificationDetail
                          items={permission.entitlements || []}
                          prevItems={(latestAvailableVersion || {entitlements: []}).entitlements}
                          showDiff={showDiff}
                          changeDetectedCallback={(hasChanges => this.setState({didEntitlementsChange: hasChanges}))}
                      />
                    </Tab.Pane>
                    {!!showChangesForViews &&
                    <Tab.Pane eventKey="views">
                      <ListedViews
                          views={views}
                          prevViews={prevViews}
                          showDiff={showDiff}
                          changeDetectedCallback={hasChanges => {
                            if (hasChanges !== didViewChange) {
                              this.setState({ didViewChange: hasChanges })
                            }
                          }}
                      />
                    </Tab.Pane>
                    }
                  </Tab.Content>
                </Tab.Container>
                <br/>
                <ListedDatasets displayedDatasets={accessibleDatasets} type={'accessible'} isLoading={loadingAccessibleDatasets} />
              </div>
              <div hidden={!isEditing}>
                <PermissionForm key={isEditing} cancelAndUnlock={this.cancelAndUnlock} onCancel={this.props.onEditCancel || this.endEdit} permission={this.getPermissionForForm(permission)} isEditing={this.state.isEditing} setModal={this.setModal} />
                <Spacer />
              </div>
            </>
            }
            <div hidden={!!permission}>No permission selected</div>
          </div>
          <div hidden={!isLoading} className="text-center">
            <Spinner className="spinner-border uxf-spinner-border-lg" animation="border" role="status">
              <span className="sr-only">Loading...</span>
            </Spinner>
          </div>
        </>
    );
  }
}

const Permission = withRouter(props => (
    <AppStateConsumer>
      {({ loggedInUser, setLoading}) => <PermissionDetail {...props} setLoading={setLoading} loggedInUser={loggedInUser}  />}
    </AppStateConsumer>
));

export default Permission;
