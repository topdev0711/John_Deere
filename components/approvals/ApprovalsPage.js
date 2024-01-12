// Unpublished Work © 2022 Deere & Company.
import React, {useEffect, useState} from "react";
import Router from 'next/router';
import Spacer from '../Spacer'
import {Card, Nav, Tab} from 'react-bootstrap'
import Accordion from '../Accordion'
import {
  MdAddCircleOutline,
  MdChat,
  MdCloudOff,
  MdCloudQueue,
  MdDeleteForever,
  MdSwapHoriz,
  MdUpdate
} from 'react-icons/md'
import EmailableText from '../EmailableText'
import utils from '../utils';
import Spinner from "react-bootstrap/Spinner";
import UserModal from '../UserModal';
import CommentHistorySingle from "../CommentHistorySingle";
import BasicDetail from './BasicDetail';
import ApproveButton from './ApproveButton';
import EditApprovalButton from './EditApprovalButton';
import RejectButton from "./RejectButton";
import DeleteButton from "./DeleteButton";
import datasetsApi from "../../apis/datasets";
import permissionsApi from "../../apis/permissions";
import {useAppContext} from "../AppState";
import Link from "next/link";
import ErrorModal from "./ErrorModal";

const gicpLabels = {
  '7ef24262-e13e-43a6-b0e9-dcfc0638a46f' : 'Highly Confidential: Highly sensitive',
  '5f48ffda-9c01-4416-89e9-326d0a7bcd3c' : 'Confidential: Sensitive information',
  'e43046c8-2472-43c5-9b63-e0b23ec09399' : 'Company Use: Minimally sensitive information',
  '10710b7a-7391-4860-a18d-1d7edc746fe7' : 'Public: Non-sensitive information (Note: If public is selected, everyone will have access and no other additional classification are allowed)'
}

const getGicpLabel = ({id, name}) => gicpLabels[id] || name;

const ApprovalsPage = ({loggedInUser = {}, setReloadDatasets}) => {
  const [pending, setPending] = useState([]);
  const [waitingItems, setWaitingItems] = useState([]);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [rejectedErrorMessage, setRejectedErrorMessage] = useState(null);

  const globalContext = useAppContext();
  const publicDatasetToggle = utils.hasAdGroupToggleEnabled(globalContext?.toggles['datacatalogui.public_datasets'], globalContext?.loggedInUser?.groups);

  const isDataset = (type) => type.toLowerCase() === 'dataset';

  const displayForStatus = {
    'PENDING': {
      text: <span>Pending</span>,
      indicator: <span className="uxf-statusDot uxf-statusDot-warning"></span>
    },
    'REJECTED': {
      text: <span>Rejected</span>,
      indicator: <span className="uxf-statusDot uxf-statusDot-danger"></span>
    },
    'APPROVED': {
      text: <span>Approved</span>,
      indicator: <span className="uxf-statusDot uxf-statusDot-success"></span>
    }
  }

  function getStatusDetails(status) {
    const found = displayForStatus[status]
    return found || {
      text: <span>Unknown</span>,
      indicator: <span className="uxf-statusDot uxf-statusDot-warning"></span>
    }
  }

  const showErrorModal = (message) => {
    setRejectedErrorMessage(message);
    setIsErrorModalOpen(true);
  };

  const handleErrorModalClose = () => {
    setIsErrorModalOpen(false);
    setRejectedErrorMessage(null);
  };
  function addWaitingItem(id, version) {
    setWaitingItems(waitingItems.concat([id + '--' + version]));
  }

  function createApproverElement(approval) {
    const {system = '', custodian = '', community = '', owner = '', subCommunity = ''} = approval;
    if (system) {
      return system;
    } else if (custodian) {
      return (<UserModal linkName={custodian} groupName={custodian}/>);
    } else if (owner) {
      const adgroupOwners = owner.split('/');
      const emails = approval.approverEmail.split(',');
      const entriesArray = [];
      adgroupOwners.map((name, index) => {
        if (index === 0) {
          entriesArray.push(<EmailableText email={emails[index]} placement='right'>{name}</EmailableText>);
        } else {
          entriesArray.push(',');
          entriesArray.push(<EmailableText email={emails[index]} placement='right'>{name}</EmailableText>);
        }
      }).filter(e => e !== "");
      return entriesArray;
    } else if (subCommunity) {
      return (<UserModal linkName={subCommunity.name} groupName={subCommunity.approver} isCommunity={true}/>);
    } else {
      return (<UserModal linkName={community.name} groupName={community.approver} isCommunity={true}/>);
    }
  }

  function getApprovalKey(accum, approver) {
    if (approver.custodian) return 'AD Group';
    if (approver.system) return 'System';
    if (approver.owner) return 'Group Owner';
    if (approver.community && !accum.map(a => a.community.id).includes(approver.community.id)) return 'Communities';
    if (approver.subCommunity && !accum.map(a => a.subCommunity.id).includes(approver.subCommunity.id)) return 'SubCommunity';
  }

  function addApproverInfo(accum, approver) {
    if (approver.status === 'PENDING DELETE') return accum;

    const key = getApprovalKey(accum, approver);
    if (key) {
      accum[key] = accum[key] || [];
      accum[key] = [...accum[key], approver];
    }

    return accum;
  }

  function getGroupByApprovals(item) {
    const groupedApprovals = item.approvals.reduce((accum, approval) => addApproverInfo(accum, approval), []);
    return Object.entries(groupedApprovals);
  }

  async function getAllApprovals() {
    const datasetApprovalsRes = await getApprovalsByType('datasets', loggedInUser);
    const permissionsApprovalsRes = await getApprovalsByType('permissions', loggedInUser);
    return [...datasetApprovalsRes, ...permissionsApprovalsRes];
  }

  async function setApprovals() {
    setPending(await getAllApprovals());
    setWaitingItems([]);
  }

  async function getApprovalsByType(type, user) {
    try {
      const approvalsRes = await fetch(`/api/${type}/approvals`, {
        credentials: 'same-origin',
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        },
        user
      });

      if (approvalsRes.ok) {
        return await approvalsRes.json();
      } else {
        const errorResponse = await approvalsRes.json();
        console.log(`Failed to fetch ${type} approvals`, errorResponse.error);
        return [];
      }
    } catch (err) {
      console.log(`Failed to fetch ${type} approvals`, err);
      return [];
    }
  }

  function readyToReloadDatasets(type) {
    if (type.toLowerCase() === 'dataset') setReloadDatasets(true);
  }

  async function handleDelete(id, version, type) {
    console.log('Delete', id, version, type);
    addWaitingItem(id, version);

    const deleteResponse = await (isDataset(type) ? datasetsApi.deleteApprovalRequest(id, version) :
      permissionsApi.deleteApprovalRequest(id, version));
    if (deleteResponse.ok) {
      setApprovals();
      readyToReloadDatasets(type);
    } else {
      setWaitingItems([]);
      const errorResponse = await deleteResponse.json();
      showErrorModal({ title: `Failed to delete ${type.toLowerCase()}.`, description: errorResponse.error })
    }
  }

  async function handleApproval({id, version, type}) {
    console.log('Approve', id, version, type);
    addWaitingItem(id, version);

    const approveResponse = await (isDataset(type) ? datasetsApi.postApproval(id, version) :
      permissionsApi.postApproval(id, version));
    if (approveResponse.ok) {
      await setApprovals();
      readyToReloadDatasets(type);
    } else {
      setWaitingItems([]);
      const errorResponse = await approveResponse.json();
      showErrorModal({ title: 'Failed to submit approval.', description: errorResponse.error })
    }
  }

  async function handleRejection({id, version, type, comments}) {
    console.log('Reject', id, version, type, comments)
    addWaitingItem(id, version);

    const rejectionReason = comments || 'No comments';
    const rejectionBody = {reason: rejectionReason};
    const rejectResponse = await (isDataset(type) ?
      datasetsApi.postRejection(id, version, rejectionBody) :
      permissionsApi.postRejection(id, version, rejectionBody));
    if (rejectResponse.ok) {
      await setApprovals();
      readyToReloadDatasets(type);
    } else {
      setWaitingItems([]);
      const errorResponse = await rejectResponse.json();
      showErrorModal({ title: 'Failed to submit rejection.', description: errorResponse.error })
    }
  }

  useEffect(() => {
    async function loadApprovals() {
        const allApprovals = await getAllApprovals(loggedInUser);
        setPending(allApprovals);
    }
    loadApprovals();
  }, []);

  const requestGroups = [{
    name: 'Datasets',
    zeroItemMessage: 'There are no datasets pending your approval',
    filterFunction: item => item.type === 'Dataset'
  }, {
    name: 'Permissions',
    zeroItemMessage: 'There are no permissions pending your approval',
    filterFunction: item => item.type === 'Permission'
  }];

  function renderDetails(item) {
    return <div>
      <Card.Title>Details</Card.Title>
      <Card.Text style={{maxWidth: '85%'}} className="text-muted">
        <em>
          {!!item.publishedPath &&
            <div>This request is to publish all data under the <strong>{item.publishedPath === '/' ? 'Root' : item.publishedPath}</strong> directory.
            </div>}
          {!!item.unpublishedPath &&
            <div>This request is to unpublish all data under the <strong>{item.unpublishedPath === '/' ? 'Root' : item.unpublishedPath}</strong> directory.
            </div>}
          {!item.publishedPath && !item.unpublishedPath && item.description}
        </em>
      </Card.Text>
      <BasicDetail {...item} />
      <div hidden={item.type !== "Permission"}>
        <hr/>
        <Card.Title>Business Justification</Card.Title>
        <Card.Text className="small">{item.businessCase}</Card.Text>
      </div>
      <hr/>
      <CommentHistorySingle id={item.id} version={item.version} commentHistory={item.commentHistory} approvals={item.approvals}/>
      <Spacer height="15px"/>
    </div>;
  }

  function createHeader(item) {
    const handleClick = (e) => {
      e.stopPropagation()
      e.preventDefault()
      Router.push(`/catalog/${item.type === 'Dataset' ? 'datasets' : item.type === 'Permission' && item.isViewDrifted ? 'views' : 'permissions'}/detail?ref=approvals&id=${item.id}&version=${item.version}`)
    }

    const link = `/catalog/${item.type === 'Dataset' ? 'datasets' : item.type === 'Permission' && item.isViewDrifted ? 'views' : 'permissions'}/detail?ref=approvals&id=${item.id}&version=${item.version}`;
    return (
      <>
        <span style={{display: 'block'}} className="text-muted xl">
          <Link style={{padding: 0, textAlign: 'left'}} size="lg" variant="link" href={link}>{item.name}</Link>
        </span>
        <span style={{display: 'block', marginTop: '3px'}} className="text-muted small">
          {getStatusDetails(item.status).indicator} {getStatusDetails(item.status).text}
        </span>
      </>
    );
  }

  const renderUpdateSpinner = () => {
    return (
      <span className="text-center">
        <Spinner className="spinner-border uxf-spinner-border-sm" animation="border" role="status">
          <span className="sr-only">Loading...</span>
        </Spinner> &nbsp; Updating
      </span>
    );
  }

  const renderHeadAccessory = (item) => {
    return <>
      {!!item.isPendingDelete ? <>
        <MdDeleteForever/> Delete {item.type}</> : item.version === 1 ? <>
        <MdAddCircleOutline/> New {item.type}</> : item.isPendingPublish ? <>
        <MdCloudQueue/> Publish Path</> : item.isPendingUnpublish ? <><MdCloudOff/> Unpublish
        Path</> : item.isViewDrifted ? <><MdSwapHoriz/> View Drifted </> : <>
        <MdUpdate/> Updated {item.type}</>}
    </>;
  }

  const createHeaderAccessory = (isUpdating, item) => isUpdating ? renderUpdateSpinner() : renderHeadAccessory(item);
  const getGicp = (approval, item) => {
    try {
      if(!approval.subCommunity || !item.classifications || !item.classifications.length) return;
      if(!approval?.subCommunity?.id) {
        console.info('approval subcommunity has no id: ', approval);
        return;
      }

      if(!item.classifications.length) {
        console.info('No classification length');
        return;
      }

      const classification = item?.classifications.find(classification => (classification?.subCommunity?.id || '') === approval?.subCommunity?.id);
      const gicp = getGicpLabel(classification?.gicp);
      return gicp ? <>GICP: {gicp}</> : undefined;
    } catch (e) {
      console.error('failed to get GICP with error: ', e.stack);
      console.error(`No GICP for approval: \n ${JSON.stringify(approval)} \n\n item:\n ${JSON.stringify(item)}`);
      return;
    }
  }

  function renderApproval(j, approval, item) {
    return <div key={j}>
      <div>
        {createApproverElement(approval)}: &nbsp;&nbsp;
        {getStatusDetails(approval.status).indicator} &nbsp;
        {getStatusDetails(approval.status).text} &nbsp;&nbsp;
        {publicDatasetToggle && getGicp(approval, item)}
      </div>
      <div
        hidden={!approval.reason || !approval.reason.length}>
        <Spacer height="10px"/>
        <ul
          style={{listStyleType: 'none'}}>
          <li>
            <blockquote><MdChat/>
              <strong>{!!approval.system ? 'System Feedback' : approval.approvedBy}</strong> - <em>{approval.reason}</em>
            </blockquote>
          </li>
        </ul>
      </div>
    </div>;
  }

  return (
    <div id='pending approvals'>
      <h2>Pending Approvals</h2>
      <Spacer height="20px"/>
      <Tab.Container transition={false} id="left-tabs-example" defaultActiveKey={requestGroups[0].name}>
        <Nav size="sm" variant="tabs" className="uxf-nav-tabs-medium">
          {requestGroups.map(group => {
              const count = pending.filter(group.filterFunction).length
              return (
                <Nav.Item key={group.name}>
                  <Nav.Link eventKey={group.name}>{group.name}{!!count && ` (${count})`}</Nav.Link>
                </Nav.Item>
              );
            }
          )}
        </Nav>
        <Tab.Content>
          {requestGroups.map((group, groupIndex) => {
            const items = pending.filter(group.filterFunction);
            return (
              <Tab.Pane eventKey={group.name} key={group.name}>
                <Card.Body>
                  <Card.Text className="mb-0" hidden={!!items.length}><em>{group.zeroItemMessage}</em></Card.Text>
                  <Card.Text as="div" hidden={!items.length}>
                    <Accordion filterable items={items.map((item, i) => {
                      const isUpdating = waitingItems.includes(item.id + '--' + item.version);
                      return {
                        id: item.id || i,
                        filterContent: item.id ? item : {...item, id: i},
                        header: createHeader(item),
                        headerAccessory: createHeaderAccessory(isUpdating, item),
                        body: (
                          <>
                            <div className="text-muted">
                              <span className="float-right">
                                <span hidden={!(item.loggedInUserIsPendingApprover || item.loggedInUserIsOwner)}>
                                  <ApproveButton item={item} isUpdating={isUpdating} handleApproval={() => handleApproval(item)}/>&nbsp;
                                  <RejectButton handleRejection={handleRejection} isUpdating={isUpdating} item={item}/>&nbsp;
                                </span>
                                <span hidden={!item.loggedInUserIsCreator || item.status === 'APPROVED' || item.isViewDrifted}>
                                  <DeleteButton item={item} isUpdating={isUpdating} handleDelete={handleDelete}/> &nbsp;
                                  <span hidden={utils.hideEditButton(item, null)}>
                                    <EditApprovalButton item={item} isUpdating={isUpdating}/>
                                  </span>
                                </span>
                              </span>
                              <Spacer height="10px"/>
                              <div>
                                <Card.Title>Approval Status</Card.Title>
                                <span className="small">
                                  {
                                    getGroupByApprovals(item).map(([key, approvals], i) => (
                                        <div key={i}>
                                          <div><strong>{key}</strong></div>
                                          {approvals.map((approval, j) => renderApproval(j, approval, item))}
                                          <br/>
                                        </div>
                                      )
                                    )}
                              </span>
                              </div>
                              <hr/>
                              {!item.isViewDrifted && renderDetails(item)}
                            </div>
                          </>
                        ),
                      }
                    })}/>
                  </Card.Text>
                </Card.Body>
              </Tab.Pane>
            )
          })}
        </Tab.Content>
      </Tab.Container>
      <br/>
      <ErrorModal
          isOpen={isErrorModalOpen}
          message={rejectedErrorMessage}
          onRequestClose={handleErrorModalClose}
      />
    </div>
  )
};

export default ApprovalsPage;
