import React from 'react'
import { withRouter } from 'next/router'
import {Card, Button, Form, Col, Row, Popover, Overlay} from 'react-bootstrap'
import DatePicker from './UXFrame/DatePicker/DataPicker'
import Spacer from './Spacer'
import Select from './Select'
import ConfirmationModal from './ConfirmationModal'
import { AppStateConsumer } from './AppState'
import uuid from 'uuid'
import utils from './utils'
import ListedDatasets from './ListedDatasets'
import permissionModel from '../src/model/permissionModel';
import ValidatedInput from './ValidatedInput'
import Toast from 'react-bootstrap/Toast'
import { Router } from 'next/dist/client/router';
import { MdHelpOutline, MdInfoOutline, MdDelete, MdAdd } from 'react-icons/md'
import PermissionFormWizard from "./PermissionFormWizard";
import changeCase from 'change-case';
import { isEqual, pick } from 'lodash';
import Accordion from "./Accordion";
import ClassificationForm from "./ClassificationForm";
import { getAccessibleDatasets } from '../apis/acls';
import { getDataset } from '../apis/datasets';
import { postPermission, getGroupsPermissions } from  '../apis/permissions';
global.fetch = require('node-fetch');

const styles = {
  infoIcon: {marginTop: '-3px', marginLeft: '3px', color: 'green', cursor: 'pointer'},
  popover: {
    padding: '10px',
    maxWidth: '600px',
    boxShadow: '0 1px 8px #bbb'
  },
  addedView: {
    padding: '0.3em',
    background: '#EAF7E8',
    color: '#367C2B',
    display: 'inline-block'}
};

const localStorageKeys = [
  'id',
  'name',
  'clientId',
  'group',
  'sourceDatasets',
  'nonExpiring',
  'startDate',
  'endDate',
  'sourceEntitlements',
  'entitlements',
  'views',
  'roleType',
  'businessCase',
  'status',
  'version'
];

const isValidGroup = g => g.startsWith('AWS') || g.startsWith('EDG');

export class PermissionForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = this.buildDefaultState();
    this.invalidFieldRefs = {
      name: React.createRef(),
      roleType: React.createRef(),
      businessCase: React.createRef(),
      startDate: React.createRef(),
      endDate: React.createRef(),
      group: React.createRef(),
      clientId: React.createRef(),
      views: React.createRef()
    }
  }

  buildDefaultState() {
    return {
      id: undefined,
      version: undefined,
      startDate: '',
      endDate: null,
      nonExpiring: false,
      group: null,
      clientId: null,
      businessCase: '',
      roleType: '',
      modal: null,
      sourceDatasets: this.state ? this.state.sourceDatasets : [],
      sourceEntitlements: this.state ? this.state.sourceEntitlements : [],
      isLoading: false,
      accessibleDatasets: [],
      isLoadingAccessibleDatasets: false,
      errors: [],
      showToast: false,
      requestComments: '',
      name: '',
      businessCaseTipsTarget: null,
      endDateTipsTarget: null,
      entitlements: this.state ? this.state.sourceEntitlements : [],
      selectedEntitlement: [],
      canSave: true,
      views: this.state ? this.state.views : [],
      groupsPermissions: this.state ? this.state.groupsPermissions : []
    }
  }

  setGroupsPermissions = async () => {
    const groups = ((this.props.loggedInUser || {}).groups || []).filter(isValidGroup);
    const groupsPermissions = await getGroupsPermissions(groups);
    this.setState({groupsPermissions});
  }

  componentDidMount() {
    const { permission: initialPermission } = this.props;
    this.setGroupsPermissions();
    this.setViewState();
    Router.onRouteChangeStart = () => false;

    this._isMounted=true;
    if (initialPermission && !!localStorage.getItem(initialPermission.id)) {
      const lockedPermission = utils.getLocalStorageItem(initialPermission.id, this.initializeObjects(initialPermission));
      if(lockedPermission.version !== initialPermission.version) {
        localStorage.removeItem(initialPermission.id);
        this.updateInitialState(initialPermission);
      } else {
        this.setState({...lockedPermission}, () => this.getAccessibleDatasets());
      }
    } else {
      if (initialPermission) this.updateInitialState(initialPermission);
      else {
        this.updateSourceDatasets();
      }
    }
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  componentDidUpdate(prevProps, prevState) {
    const prevPropsPermission = prevProps && prevProps.permission;
    const { isEditing, permission } = this.props;
    const { canSave, isLoading } = this.state;

    if (this._isMounted){
      const condensedState = pick({ ...this.state }, localStorageKeys);
      const condensedPrevState = pick({ ...prevState }, localStorageKeys);
      if(!!condensedPrevState.id && !isEqual(condensedState, condensedPrevState) && canSave && !isLoading) {
        const initial = pick(this.initializeObjects({ ...permission }), localStorageKeys);
        delete initial.version;
        this.saveChanges(isEditing, initial, condensedState);
      }
      if (prevPropsPermission && !!prevPropsPermission.lockedBy && !permission.lockedBy && !localStorage.getItem(permission.id)) {
        this.updateInitialState(permission);
      }
    }
  }

  saveChanges = (isEditing, permission, condensedState) => {
    try {
      utils.setLocalStorage(isEditing, permission, condensedState);
    } catch(e) {
      console.error(e);
      this.setState({
        canSave: false,
        modal: {
          onAccept: () => this.setState({ modal: null }),
          showAcceptOnly: true,
          acceptButtonText: 'OK',
          body: (
            <div>
              <div>Your browser's cache is full. You can still edit and submit for approval, but changes will not be saved if you close the tab or window.</div>
            </div>
          )
        }
      });
    }
  }

  updateInitialState = (initialPermission) => {
    this.updateForm({
      ...initialPermission,
      entitlements: (initialPermission.entitlements || []).map(ent => ({...ent, id: ent.id || uuid.v4()})),
      nonExpiring: initialPermission.endDate == '' || !initialPermission.endDate,
      requestComments: ''
    });
  }

  getDefaultedEntitlement = entitlement => ({
    community: entitlement.community || {},
    subCommunity: entitlement.subCommunity || {},
    countriesRepresented: entitlement.countriesRepresented || [],
    gicp: entitlement.gicp || {},
    additionalTags: entitlement.additionalTags ? entitlement.additionalTags.map(a => (a.label || a).trim()) : [],
    development: !!entitlement.development,
    personalInformation: !!entitlement.personalInformation,
  });

  async setAccessibleDatasets(entitlements) {
    try {
      const accessibleDatasets = await getAccessibleDatasets(entitlements);
      this.setState({ accessibleDatasets: utils.findLatestAvailableVersions(accessibleDatasets)});
    } catch (error) {
      console.log(error);
    }
  }

  async getAccessibleDatasets() {
    const { entitlements } = this.state
    const body = entitlements.map(this.getDefaultedEntitlement);

    if (!!body.length) {
      this.setState({ isLoadingAccessibleDatasets: true })
      await this.setAccessibleDatasets(body);
      this.setState({ isLoadingAccessibleDatasets: false });
    } else {
      this.setState({ accessibleDatasets: [] })
    }
  }


  updateSourceDatasets = async () => {
    const { router } = this.props;
    const { sources } = router.query;
    const safeSources = sources ? !Array.isArray(sources) ? [sources] : sources : [];

    if (!safeSources.length) return;

    const safeSourceDatasets = await Promise.all(safeSources.map(getDataset));

    const sourceDatasets = safeSourceDatasets.filter(ds => !!ds && !!ds.classifications).map(ds => {
      return {
        ...ds,
        classifications: ds.classifications.map(c => {
          return {
            ...c,
            id: c.id || uuid.v4(),
            derivedFrom: { id: ds.id, name: ds.name }
          };
        })
      };
    });

    const entitlements = sourceDatasets.reduce((acc, item) => [...acc, ...item.classifications], []);
    this.setState({ sourceDatasets, entitlements, sourceEntitlements: entitlements }, () =>  this.getAccessibleDatasets());
  };

  updateForm = (perm) => {
    const entitlements = this.state.entitlements.filter(b => !!b.derivedFrom).concat(perm.entitlements);
    this.setState({...this.initializeObjects(perm), entitlements }, async () => await this.getAccessibleDatasets());
  }

  initializeObjects = (perm) => {
    const {
      roleType = '',
      clientId = null,
      endDate = null,
      sourceDatasets = [],
      sourceEntitlements = []
    } = perm;

    const nonExpiring = !endDate;

    return {
      ...perm,
      clientId,
      roleType: {
        id: roleType,
        name: roleType.charAt(0).toUpperCase() + roleType.slice(1)
      },
      group: { id: perm.group, name: perm.group },
      endDate,
      nonExpiring,
      sourceDatasets,
      sourceEntitlements
    }
  }

  updateBasedOnRoleType = (roleType) => {
    const { name, accessibleDatasets, businessCase, endDate, startDate} = this.state;
    this.setState(s => (
      {
      
        ...this.buildDefaultState(),
        accessibleDatasets,
        businessCase,
        endDate,
        startDate,
        name,
        roleType,
        entitlements: s.entitlements.filter(b => !!b.derivedFrom || b)
    }), () => this.getAccessibleDatasets())
  }


  constructBody = () => {
    const { version, id, name, roleType, businessCase, startDate, endDate, entitlements, group, clientId, views } = this.state;
    const { permission: existingPermission } = this.props;
    const body = {
      id,
      version,
      name,
      requestComments: !!this.state.requestComments ? this.state.requestComments : 'No comments',
      roleType: roleType.id,
      businessCase,
      startDate,
      views
    };
    if (endDate) {
      body.endDate = endDate;
    }
    if (group) {
      body.group = group.id;
    }
    if (clientId) {
      body.clientId = clientId;
    }
    if (existingPermission) {
      body.id = existingPermission.id;
      body.version = existingPermission.version;
    }

    body.entitlements = entitlements.map(entitlement => {
      return {
        id: entitlement.id,
        community: entitlement.community ? entitlement.community.id : null,
        subCommunity: entitlement.subCommunity ? entitlement.subCommunity.id : null,
        countriesRepresented: entitlement.countriesRepresented ? entitlement.countriesRepresented.map(c => c.id) : [],
        gicp: entitlement.gicp ? entitlement.gicp.id : null,
        additionalTags: entitlement.additionalTags ? entitlement.additionalTags.map(a => (a.label || a).trim()) : [],
        development: !!entitlement.development,
        personalInformation: !!entitlement.personalInformation,
      }
    });

    return body;
  };

  handleSubmit = async (event) => {
    event?.preventDefault();
    this.setState({ showToast: false })
    const { permission, isEditing, router } = this.props;
    if (!this.validateForm().length) {
      const requestBody = this.constructBody();
      this.setState({ isLoading: true });
      const permissionResponse = await postPermission(requestBody);

      if (permissionResponse.ok) {
        if (isEditing && utils.localStorageStatuses.includes(permission.status)) {
          localStorage.removeItem(permission.id);
          const unlockResponse = permission.status === 'AVAILABLE' ?
            await fetch('/api/permissions/' + permission.id + '/' + permission.version + '/unlock', {credentials: 'same-origin', method: 'POST'}) :
            { ok: true };
          if (unlockResponse.ok) {
            router.push('/approvals');
          } else {
            const err = await unlockResponse.json();
            this.setState({ isLoading: false, body: err.error });
          }
        } else router.push('/approvals');
      } else {
        const errorResponse = await permissionResponse.json();
        this.setState({
          isLoading: false,
          modal: {
            onAccept: () => this.setState({ modal: null }),
            showAcceptOnly: true,
            acceptButtonText: 'OK',
            body: (
              <div>
                <div>The submission failed because:</div>
                <br />
                <div dangerouslySetInnerHTML={{ __html: errorResponse.error }} />
              </div>
            )
          }
        })
        console.log(errorResponse);
      }
    } else {
      this.scrollToError()
      this.setState({showToast: true})
      setTimeout(() =>{
        this.setState({showToast: false})
      }, [4000])
    }
  };

  setModal = (modal) => {
    this.setState({ modal })
  }

  handleCancelAndUnlock =  () => {
    const { onCancel, permission, cancelAndUnlock } = this.props;
    if (!!permission && permission.status !== 'AVAILABLE') {
      utils.removeAndUnlockRecord(permission);
      if (!!onCancel) onCancel();
    } else if(!!permission){
      if(!!cancelAndUnlock) {
        cancelAndUnlock(true);
      }
    } else if(!!onCancel) onCancel();
  }

   scrollToError = () => {
    const name = this.invalidFieldRefs.name.current?.value;
    const businessCase = this.invalidFieldRefs.businessCase.current?.value
    const startDate = this.invalidFieldRefs.startDate.current?.flatpickr.selectedDates[0]
    const endDate = this.invalidFieldRefs.endDate.current?.flatpickr.selectedDates[0]
    const roleType = this.invalidFieldRefs.roleType.current?.state.value
    const group = this.invalidFieldRefs.group.current?.state.value
    const clientId = this.invalidFieldRefs.clientId.current?.value
    const views = this.invalidFieldRefs.views.current?.state.value[0]

    switch(true){
      case !name || name.length >= 100:
        this.invalidFieldRefs.name.current?.scrollIntoView({ behavior: 'smooth', block: 'center'})
        return;
      case !roleType:
        this.invalidFieldRefs.roleType.current?.focus()
        return;
      case !group:
        this.invalidFieldRefs.group.current?.focus()
        return;
      case !clientId && roleType.id === 'system':
        this.invalidFieldRefs.clientId.current?.scrollIntoView({ behavior: 'smooth', block: 'center'})
        this.invalidFieldRefs.clientId.current?.focus()
        return;
      case !startDate:
        this.invalidFieldRefs.name.current?.scrollIntoView({ behavior: 'smooth', block: 'start'})
        this.invalidFieldRefs.startDate.current?.flatpickr.open()
        return;
      case !endDate || new Date(endDate) < new Date(startDate):
        this.invalidFieldRefs.name.current?.scrollIntoView({ behavior: 'smooth', block: 'start'})
        this.invalidFieldRefs.endDate.current?.flatpickr.open()
        return;
      case !businessCase:
        this.invalidFieldRefs.businessCase.current?.scrollIntoView({ behavior: 'smooth', block: 'center'})
        return
      case !views || roleType.id === 'system':
        this.invalidFieldRefs.businessCase.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest'})
        return
      default:
        return true
    }

  }

  validateForm = () => {
    const body = this.constructBody();
    const errors = (permissionModel.validate(body) || { details: [] }).details;
    const {endDate, nonExpiring, startDate, businessCase, name, group} = this.state
    if (!endDate && !nonExpiring) {
      errors.push({
        context: {
          key: 'endDate'
        }
      });
    }
    if (!startDate) {
      errors.push({
        context: {
          key: 'startDate'
        }
      });
    }
    if (!businessCase) {
      errors.push({
        context: {
          key: 'businessCase'
        }
      });
    }
    if (!name) {
      errors.push({
        context: {
          key: 'name'
        }
      });
    }
    if (!group) {
      errors.push({
        context: {
          key: 'group'
        }
      });
    }
    this.setState({errors});
    return errors;
  }

  updateRequestComments = ({ target: { value } }) => {
    this.setState({ requestComments: value })
  }

  handleAdd = () => {
    this.setState(s => ({
      entitlements: [{ id: uuid.v4(), isNew: true }, ...s.entitlements]
    }), () => this.getAccessibleDatasets())
  }

  handleViewChange = (values) => {
    const views = values ? values.map(value =>  value.name) : []
    this.setState({views});
  }

  handleRemove = (id) => {
    this.setState(s => ({
      entitlements: s.entitlements.filter(e => e.id !== id),
      selectedEntitlement: s.selectedEntitlement.filter(e => e.id !== id)
    }), () => this.getAccessibleDatasets())
  }

  handleClassificationChange = (blockId, field, value) => {
    const modified = this.state.entitlements.map(b => (b.id == blockId) ? ({ ...b, [field]: value }) : b);
    this.setState(
      {selectedEntitlement: [...this.state.selectedEntitlement, {id: blockId, field: field}]}
    )
    this.setState({ entitlements: modified}, () => this.getAccessibleDatasets());
  }

  mergeEntitlements = (incomingEntitlements) => {
    const { sourceEntitlements } = this.state;
    const totalEntitlements = [...incomingEntitlements, ...sourceEntitlements];
    const ids = totalEntitlements.map(({id}) => id);
    const uniqueIds = [...new Set(ids)];
    return uniqueIds.map(id => totalEntitlements.find(entitlement => entitlement.id === id));
  }

  mergeViews = (incomingViews = []) => {
    const condensedViews = incomingViews.map(view => view.name);
    const { router } = this.props;
    const { sourceView } = router.query;
    const totalViews = [...new Set([...condensedViews, sourceView])];
    return totalViews;
  }

  resetForm = () => {
    const reactForm = document.getElementById("permissionForm");
    if(!!reactForm) reactForm.reset();
    this.getAccessibleDatasets();
    this.setViewState();
  }

  acceptRemoval = async () => {
    const { permission: initialPermission } = this.props;
    const endDate = new Date().toISOString();
    const { requestComments } = this.state;
    await this.setState({ isLoading: true });
    await this.updateInitialState(initialPermission);
    await this.setState({
      nonExpiring: false,
      endDate,
      requestComments
    })
    this.resetForm();
    this.handleSubmit();
  }

  setViewState = () => {
    const { permission, router } = this.props;
    const { isViewRequest, sourceView } = router.query
    const isUpdate = permission && permission.views
    if (isViewRequest) {
      const views = isUpdate ? [...permission.views, sourceView] : [sourceView]
      this.setState({views});
    }
  }

  render() {
    const { loggedInUser, permission: initialPermission, router, allViews } = this.props
    const { isViewRequest = false, sourceView } = router.query
    const { showToast, name, errors, startDate, endDate, group, clientId, roleType, sourceDatasets, modal, isLoading, accessibleDatasets, nonExpiring,
      isLoadingAccessibleDatasets, entitlements, selectedEntitlement, businessCase, businessCaseTipsTarget, endDateTipsTarget, views = [], groupsPermissions } = this.state;
    const entitlementErrors = errors.filter(({path}) => (path || []).includes('entitlements'));
    const groups = ((loggedInUser || {}).groups || []).filter(isValidGroup);
    const isHuman = roleType.id === 'human';
    const createOptions = name => ({ id: name, name});
    const viewOptions = allViews.filter(v => !!v).map(createOptions);
    const valueOptions = views.map(createOptions);

    const isPendingStatus = ({status}) => ['PENDING', 'APPROVED', 'REJECTED'].includes(status);
    const pendingApprovals = groupsPermissions.filter(isPendingStatus).map(({id}) => id);

    const latestAvailablePermissions = utils.findLatestAvailableVersions(groupsPermissions);
    const isSystemView = permission => permission.roleType === "system" && isViewRequest
    const myPerms = latestAvailablePermissions.map(perm => ({...perm, isDisabled: pendingApprovals.includes(perm.id) || isSystemView(perm)}));

    const getOptionLabels = item => {
      if (item.isDisabled) return `${item.name} (system not allowed for views)`
      return item.name
    }

    const radioButtonSelected = val => {
      this.setState({
        ...this.state,
        views: !val ? []: views
      })
    }

    return (
      <>
        <ConfirmationModal
          id='confirmation'
          show={!!modal}
          showAcceptOnly={(modal || {}).showAcceptOnly}
          acceptButtonText={(modal || {}).acceptButtonText}
          body={(modal || {}).body ? modal.body : `Are you sure you want to ${(modal || {}).action}?`}
          onCancel={() => this.setModal(null)}
          onAccept={() => {
            modal.onAccept();
            this.setModal(null);
          }}
        />
        <div className="float-right" style={{marginTop: '-55px'}}>
          <Button
            onClick={() =>
              this.setModal({
                onAccept: () => this.acceptRemoval(),
                action: 'remove this permission',
                body: (
                  <div>
                    <div>Are you sure you want to expire this permission?</div>
                    <br />
                    <div className="text-muted"><i>{this.state.name}</i></div>
                      <hr />
                      <div>
                        <Form.Label>Comments</Form.Label>
                        <Form.Control
                          as="textarea"
                          placeholder="(Optional) Provide details about this request for approvers"
                          onBlur={this.updateRequestComments.bind(this)}
                        />
                    </div>
                  </div>
                )
              })
            }
            size="sm"
            variant="outline-danger"
            disabled={isLoading}
            id='removePermission'
            hidden={!initialPermission || utils.isPermExpired(initialPermission)}
          >
            Expire Permission
          </Button>&nbsp;&nbsp;&nbsp;&nbsp;
          <Button size="sm" variant="outline-primary" href="https://confluence.deere.com/display/EDAP/Permissions" target="_blank"><MdHelpOutline size="15" />&nbsp;Help</Button>
        </div>
        {!initialPermission &&
          <PermissionFormWizard
          
            key={myPerms}
            options={myPerms}
            isViewRequest={isViewRequest}
            buttonSelected = {radioButtonSelected}
            onPermissionSelected={(selected) => {
              if (selected) {
                const updatedEntitlements = this.mergeEntitlements(selected.entitlements || []);
                const updatedViews = () => {
                  if (isViewRequest) return this.mergeViews(selected.views);
                  if (!!sourceDatasets && selected.views?.length) return selected.views.map(view => view.name)
                  return []

                }
                this.setState({
                  ...this.buildDefaultState(),
                  ...selected,
                  nonExpiring: !selected.endDate,
                  roleType: {id: selected.roleType, name: changeCase.ucFirst(selected.roleType)},
                  group: !!selected.group ? {id: selected.group, name: selected.group} : undefined,
                  entitlements: updatedEntitlements,
                  views: updatedViews()
                }, () => this.getAccessibleDatasets());
              }
               else {
                this.setState(
                  this.buildDefaultState(), 
                  () => this.resetForm())
              }
            }} />
        }
        <Card>
          <Card.Header>
            Request Permissions
          </Card.Header>
          <Card.Body>
            <Card.Text as="div">
              <Form
                id='permissionForm'
              >
                <Form.Group >
                  <Form.Label>Use Case Name<span style={{color: 'red'}}>&nbsp;*</span>
                  </Form.Label>
                  {<span className="small" style={{color: name?.length < 100 && name ? 'green': '#c21020' , float: 'right'}}>number of char: { name?.length}</span>}
                  <ValidatedInput
                    key={this.state.id}
                    invalidMessage="Must provide a use case name with less than 100 characters"
                    component={Form.Control}
                    isInvalid={(errors.some(e => e.context.key === 'name') && !name) || (name?.length >= 100)}
                    onChange={({ target: { value } }) => this.setState({ name: value })}
                    defaultValue={name}
                    type="text"
                    placeholder="Brief name describing use case"
                    id="roleName"
                    disabled={isLoading}
                    refContext = {this.invalidFieldRefs.name}
                    
                  />
                </Form.Group>
                <Form.Group >
                  <Form.Label>User Type<span style={{color: 'red'}}>&nbsp;*</span></Form.Label>
                  <ValidatedInput
                    invalidMessage="Must select a user type"
                    component={Select}
                    isInvalid={errors.some(e => e.context.key === 'roleType')}
                    isDisabled={!!this.state.id}
                    onChange={this.updateBasedOnRoleType}
                    value={roleType}
                    options={[{ id: 'human', name: 'Human' }, { id: 'system', name: 'System', isDisabled: isViewRequest }]}
                    id="roleSelect"
                    getOptionLabel={ getOptionLabels }
                    roleContext = {this.invalidFieldRefs.roleType}
                  />
                </Form.Group>
                {roleType &&
                  <>
                    <Form.Group >
                      <Form.Label>{roleType.id === 'human' ? "AD Group" : "Custodian AD Group"}<span style={{color: 'red'}}>&nbsp;*</span></Form.Label>
                      <ValidatedInput
                        invalidMessage="Must select a group"
                        component={Select}
                        isInvalid={errors.some(e => e.context.key === 'group') && !group}
                        isDisabled={!!this.state.id && roleType.id === 'human'}
                        onChange={value => this.setState({group: value})}
                        value={group}
                        placeholder={roleType.id === 'human' ? "Only AWS and EDG prefixed groups supported" : "AD Group that owns this client ID"}
                        noOptionsMessage={() => "You aren't a member of any AWS or EDG groups"}
                        options={groups.map(createOptions)}
                        id="groupSelect"
                        roleContext = {this.invalidFieldRefs.group}
                      />
                    </Form.Group>
                    <Form.Group hidden={roleType.id === 'human'}>
                      <Form.Label>Client ID<span style={{color: 'red'}}>&nbsp;*</span></Form.Label>
                      <ValidatedInput
                        key={this.state.id}
                        invalidMessage="Must select a client ID for system permissions"
                        component={Form.Control}
                        isInvalid={errors.some(e => e.context.key === 'clientId') && !clientId}
                        disabled={!!this.state.id || roleType.id === 'human'}
                        onChange={({ target: { value } }) => this.setState({ clientId: value })}
                        defaultValue={clientId}
                        type="text"
                        placeholder="Provide a Client ID"
                        id="clientSelect"
                        refContext = {this.invalidFieldRefs.clientId}
                      />
                    </Form.Group>
                  </>
                }
                <Row>
                  <Col md={{span: 10}}>
                    <Form.Group >
                      <Form.Label>Start Date<span style={{color: 'red'}}>&nbsp;*</span></Form.Label>
                      <ValidatedInput
                        invalidMessage="Must select a start date"
                        component={DatePicker}
                        isInvalid={errors.some(e => e.context.key === 'startDate') && !startDate}
                        hideLabel
                        value={startDate}
                        defaultValue={startDate ? utils.formatDate(startDate) : utils.formatDate(new Date().toISOString())}
                        onChange={([value]) => this.setState({ startDate: value })}
                        disabled={isLoading}
                        id='startDate'
                        dateContext = {this.invalidFieldRefs.startDate}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={{ span: 10 }}>
                  <Overlay
                    rootClose
                    target={endDateTipsTarget}
                    placement="bottom"
                    onHide={() => this.setState({ endDateTipsTarget: null })}
                    show={!!endDateTipsTarget}
                  >
                    <Popover
                      style={styles.popover}
                      id="popover-positioned-bottom"
                    >
                      <i className="text-muted">EndDate Required for Non-Expiring Date.</i>
                    </Popover>
                  </Overlay>
                    <Form.Group >
                      <Form.Label>End Date {nonExpiring ? '': <span style={{color: 'red'}}>&nbsp;*</span>}<MdInfoOutline onClick={e => this.setState({endDateTipsTarget: e.target})} style={styles.infoIcon}/></Form.Label>
                      <ValidatedInput
                        invalidMessage="Must select an end date that is after your start date"
                        component={DatePicker}
                        isInvalid={(errors.some(e => e.context.key === 'endDate')  
                                    && (!endDate 
                                    && !nonExpiring)
                                    || (new Date(startDate) > new Date(endDate) && !nonExpiring))
                                  }
                        disabled={nonExpiring}
                        hideLabel
                        value={endDate}
                        defaultValue={endDate ? utils.formatDate(endDate) : null}
                        onChange={([value]) => this.setState({ endDate: value, nonExpiring: false })}
                        id='endDate'
                        dateContext = {this.invalidFieldRefs.endDate}
                      />
                    </Form.Group>
                    <Overlay
                    rootClose
                    target={endDateTipsTarget}
                    placement="bottom"
                    onHide={() => this.setState({ endDateTipsTarget: null })}
                    show={!!endDateTipsTarget}
                  >
                    <Popover
                      style={styles.popover}
                      id="popover-positioned-top"
                    >
                      <i className="text-muted">EndDate Required for Non-Expiring Date.</i>
                    </Popover>
                </Overlay>
                  </Col>
                  <Col md={{ span: 4 }} style={{whiteSpace: 'nowrap'}}>
                    <br/>
                    <Form.Check
                      onChange={(event) => { this.setState({ nonExpiring: event.target.checked, endDate: '' }) }}
                      checked={this.state.nonExpiring}
                      type="checkbox"
                      id={`custom-checkbox-nonexp`}
                      custom
                      disabled={isLoading}
                      label={"Non-Expiring"}
                      />
                    <br/>
                  </Col>
                </Row>
                <Form.Group >
                  <Form.Label>Use Case Description<span style={{color: 'red'}}>&nbsp;*</span><MdInfoOutline onClick={e => this.setState({businessCaseTipsTarget: e.target})} style={styles.infoIcon}/></Form.Label>
                  <ValidatedInput
                    key={this.state.id}
                    invalidMessage="Must provide a description of intended data use"
                    component={Form.Control}
                    isInvalid={errors.some(e => e.context.key === 'businessCase') && !businessCase}
                    onChange={({ target: { value } }) => this.setState({ businessCase: value })}
                    defaultValue={businessCase}
                    as="textarea"
                    rows="5"
                    placeholder="Describe the intended use of the data. Click the info icon for tips."
                    disabled={isLoading}
                    id="businessCase"
                    refContext = {this.invalidFieldRefs.businessCase}
                  />
                </Form.Group>
                <Overlay
                  rootClose
                  target={businessCaseTipsTarget}
                  placement="bottom"
                  onHide={() => this.setState({ businessCaseTipsTarget: null })}
                  show={!!businessCaseTipsTarget}
                >
                  <Popover
                    style={styles.popover}
                    id="popover-positioned-bottom"
                  >
                    <i className="text-muted">Addressing the following items in your business case will<br/>help the approver(s) more efficiently handle the request.</i>
                    <hr/>
                    <ul>
                      <li>Data required for which countries</li>
                      <li>Justify any personal information required</li>
                      <li>Description and consumer of the result</li>
                    </ul>
                  </Popover>
                </Overlay>
              </Form>
            </Card.Text>
            <Spacer />
            {!!sourceDatasets.length && !isViewRequest &&
              <>
                <Col>
                  <Row >
                    <Col>
                      <h4 style={{ marginTop: '4px' }}>Datasets</h4>
                    </Col>
                  </Row>
                  <hr />
                  <Card.Text as="div">
                    <Row>
                      <Col>
                        {sourceDatasets.map(src =>
                          <li key={src.id} className="text-muted">
                            {src.name}
                          </li>
                        )}
                      </Col>
                    </Row>
                  </Card.Text>
                </Col>
              </>
            }


          <Form.Group>
            { isHuman &&
              <Form.Label>
            <h4 style={{ marginTop: '4px'}} >Select Entitlements / Views</h4>
            </Form.Label>
            }
          <Card>
            <Card.Body>
            {!sourceDatasets.length && !isViewRequest &&
              <>
                <Row >
                  <Col>
                    <h4 style={{ marginTop: '4px' }}>Entitlements</h4>
                  </Col>
                  <Col>
                    <Button
                      className="float-right"
                      style={{ marginTop: '-3px' }}
                      onClick={this.handleAdd}
                      size="sm"
                      variant="outline-primary"
                      disabled={isLoading}
                      id='addEntitlement'
                    >
                      <MdAdd /> Add Entitlement
                    </Button>
                  </Col>
                </Row>
                <hr />
                <Card.Text as="div">
                  <Accordion
                    filterable
                    activeKey={(entitlements.filter(e => e.isNew).find(e => e.isNew) || {}).id || entitlementErrors?.map(err => err.path)?.filter(path => path[0] === 'entitlements')?.map(arr => arr[1])?.map(val => entitlements[val])[0]?.id}
                    items={entitlements.map((block, i) => {
                      return {
                        id: block.id || i,
                        filterContent: block,
                        actions: [{
                          text: 'Remove',
                          icon: <MdDelete size="18" />,
                          disabled: isLoading,
                          handler: () => this.setModal({
                            action: 'remove',
                            onAccept: this.handleRemove.bind(null, block.id)
                          })
                        }],
                        invalid: entitlementErrors.some(err => (err.path || []).includes(i)),
                        header: (
                          <span>
                            <span style={{ display: 'block' }} className="text-muted small"><b>Community:</b> <i>{block.community && block.community.name ? block.community.name : 'None'}</i></span>
                            <span style={{ display: 'block' }} className="text-muted small"><b>Sub-Community:</b> <i>{block.subCommunity && block.subCommunity.name ? block.subCommunity.name : 'None'}</i></span>
                            <span hidden={!block.derivedFrom} style={{ display: 'block' }} className="text-muted small"><b>Copied From:</b> <i>{(block.derivedFrom || {}).name}</i></span>
                          </span>
                        ),
                        body: (
                          <ClassificationForm
                            defaultValue={block}
                            onChange={this.handleClassificationChange.bind(null, block.id)}
                            errors={entitlementErrors.filter(err => (err.path || []).includes(i))}
    
                          />
                        )
                      }
                    })}
                  />
                </Card.Text>
              {isHuman &&
                <>
                  <Row >
                    <Col>
                      <h4 style={{ marginTop: '4px' }}>Views</h4>
                    </Col>
                  </Row>
                  <Col>
                    {!!allViews &&
                      <Form.Group>
                        <ValidatedInput
                          component={Select}
                          placeholder="Add a view"
                          onChange={value => { this.handleViewChange(value) }}
                          value={valueOptions}
                          options={viewOptions}
                          isMulti
                          id="viewSelect" 
                          roleContext={this.invalidFieldRefs.views}/>
                          
                      </Form.Group>
                    }
                  </Col>
                  <hr />
                </>
              }
              </>
            }
            </Card.Body>
          </Card>
          </Form.Group>
            {!!isViewRequest && roleType.id !== 'system' &&
              <>
                <Col id="viewsColumn">
                  <Row >
                    <Col>
                      <h4 style={{ marginTop: '4px' }}>Views</h4>
                    </Col>
                  </Row>
                <hr />
                <Card.Text as="div">
                  <Col>
                    {views.map((view, idx) =>
                      <Row id={idx} key={idx}>
                        {view === sourceView &&
                          <Col id="addedViews"><Row><li> <div style={styles.addedView}> <i>{view}</i> </div> </li></Row></Col>
                        }
                        {view !== sourceView &&
                          <Col id="existingViews"><Row><li key={view} className="text-muted">{view}</li></Row></Col>
                        }
                      </Row>
                    )}
                  </Col>
                </Card.Text>
                </Col>
              </>
            }
            {!!errors.length &&
              errors.filter(err => err.context && ((err.context.key === 'noViewNoEntitlement' && views.length === 0)
                || (err.context.key === 'noEntitlements')
                )).map((err, idx) =>
                (entitlements.length && 
                  selectedEntitlement?.find(sel => (sel.field === 'community')) && 
                  selectedEntitlement?.find(sel => (sel.field === 'subCommunity')) &&
                  selectedEntitlement?.find(sel => (sel.field === 'gicp'))
                  ? '':
                  <div key={idx} style={{ display: 'block' }} className="invalid-feedback">
                    {err.message}
                  </div> )
                )
            }
            <Spacer height="70px" />
            {!isViewRequest &&
              <>
                <Row style={{ paddingBottom: '0' }}>
                  <Col>
                    <h4 style={{ marginTop: '4px' }}>Accessible Datasets</h4>
                  </Col>
                </Row>
                <hr />
                <ListedDatasets displayedDatasets={accessibleDatasets} type={'accessible'} isLoading={isLoadingAccessibleDatasets} />
              </>
            }
            <Spacer height="60px" />
            <Form.Group>
            <Form.Label><h4 style={{ marginTop: '4px' }}>Comments</h4></Form.Label>
              <Form.Control
                as="textarea"
                placeholder="(Optional) Provide details about this request for approvers"
                onBlur={this.updateRequestComments.bind(this)}
              />
            </Form.Group>

            <Card.Text className="float-right" as="div">
              <Button
                onClick={() => this.setState({ modal: { action: 'cancel', onAccept: this.handleCancelAndUnlock } })}
                variant="secondary"
                disabled={isLoading}
                id='cancelPermission'
                >
                Cancel
            </Button>&nbsp;&nbsp;
            <Button
                onClick={this.handleSubmit.bind(this)}
                variant="primary"
                disabled={isLoading}
                id='submitPermission'
              >
                Submit for Approval
            </Button>
            </Card.Text>
          </Card.Body>
        </Card>
        <Toast
          hidden={!showToast}
          show={showToast}
          onClose={() => this.setState({ showToast: false })}
          style={{
            position: 'fixed',
            top: 20,
            right: 20,
            zIndex: 9999,
            borderColor: '#c21020'
          }}
        >
          <Toast.Header>
            <strong className="mr-auto">Invalid for submission</strong>
          </Toast.Header>
          <Toast.Body>Please review the errors and make any necessary corrections.</Toast.Body>
        </Toast>
      </>
    )
  }
}

/* istanbul ignore next */
const PermissionFormComponent = withRouter(props => {
  return (
    <AppStateConsumer>
      {ctx => (<PermissionForm {...props} loggedInUser={ctx.loggedInUser} allViews={ctx.allViews}/>)}
    </AppStateConsumer>
  )
})

export default PermissionFormComponent;
