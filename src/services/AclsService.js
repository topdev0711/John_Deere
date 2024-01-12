const _ = require('lodash');
const clone = require('rfdc')();
const datasetService = require('./datasetService');
const permissionsService = require('./permissionService');
const util = require('../utilities/accessUtility');
const {isAvailable} = require('./statusService');

const diffActions = {remove: 'remove'};
const formats = {'by-user': 'by-user'};

class AclsService {
  logger = require('edl-node-log-wrapper');

  constructor(options = {}) {
    this.options = options;
  }

  setLogger = logger => {
    this.logger = logger;
  }

  getAclPermissions = () => {
    const {client, group} = this.options;
    if(!group && !client) throw new Error('missing query parameter: group or client required');
    if(group && client) throw new Error('invalid query parameter: can only have group or client, not both');

    const queryParams = group ? {group} : {client};
    return permissionsService.searchForPermission(queryParams);
  }

  isActive = permission => {
    const now = Date.now();
    const isAfterStartDate = new Date(permission.startDate) < now || !permission.startDate;
    const isBeforeEndDate = new Date(permission.endDate) > now || !permission.endDate;
    return isAfterStartDate && isBeforeEndDate;
  }

  getAggregatedEntitlements = permissions => {
    const mergeUniqueEntitlements = (entitlements, permission) => {
      const isUnique = entitlements.every(entitlement => !_.isEqual(entitlement, permission));
      return isUnique ? [...entitlements, permission] : entitlements;
    };

    return permissions.flatMap(permission => permission.entitlements).reduce(mergeUniqueEntitlements, []);
  }

  getRole = () => {
    const { client, group} = this.options;
    return client || group;
  }

  isEnhance = dataset => 'enhance' !== dataset?.phase?.name?.toLowerCase();
  getPaths = (dataset, isCustodian) => {
    if(this.isEnhance(dataset)) return [];
    if(isCustodian) return ['/'];
    return dataset.paths || [];
  }

  createAcl = accessibleDataset => {
    const {id, version, environmentName, custodian, tables= [], discoveredTables= [], schemas= [], views= []} = accessibleDataset;
    const {client, group} = this.options;
    const role = client || group;
    const isCustodian = role === custodian;
    const actions = isCustodian ?  ['read', 'write', 'delete'] : ['read'];
    const paths = this.getPaths(accessibleDataset, isCustodian);
    return {id, version, environmentName, paths, tables, discoveredTables, schemas, views, actions};
  }

  getAccessibleDatasets = async entitlements => {
    // console.info('getAccessibleDatasets entitlements: ', entitlements);
    const community = [...new Set(entitlements.map(entitlement => entitlement.community.name))];
    const subCommunity = [...new Set(entitlements.map(entitlement => entitlement.subCommunity.name))];

    // console.info('entitlements community: ', community);
    // console.info('entitlements subCommunity: ', subCommunity);
    console.info('getAccessibleDatasets community:', community);
    console.info('getAccessibleDatasets subCommunity:', subCommunity);

    const datasets = await datasetService.searchForDataset({community, subCommunity});
    console.info('getAccessibleDatasets entitlements: ', entitlements);
    console.info('getAccessibleDatasets searchForDataset: ', JSON.stringify(datasets));
    return datasets.filter(dataset => util.canAccess(entitlements, dataset.classifications));
  }

  getCurrentAccessibleDatasets = async activePermissions => {
    const entitlements = this.getAggregatedEntitlements(activePermissions);
    const classificationDatasetsCall = this.getAccessibleDatasets(entitlements);
    const publicDatasetsCall = datasetService.searchForDataset({ gicp: 'Public'});
    const [classificationDatasets, publicDatasets] = await Promise.all([classificationDatasetsCall, publicDatasetsCall]);
    return [...classificationDatasets, ...publicDatasets];
  }

  getPreviousPermissions = async activePermissions => {
    const {prevId} = this.options;
    const permissionVersions = await permissionsService.getAllPermissionVersions(prevId);
    const availablePermissions = permissionVersions.filter(isAvailable);
    if(availablePermissions?.length <= 1) return activePermissions;

    const previousPermission = availablePermissions[availablePermissions.length - 2];
    const permissionWithoutPrevId = activePermissions.filter(permission => permission?.id !== prevId);
    return [...permissionWithoutPrevId, previousPermission];
  }

  getPreviousDatasets = async activePermissions => {
    const permissions = await this.getPreviousPermissions(activePermissions);
    const entitlements = await this.getAggregatedEntitlements(permissions);
    return this.getAccessibleDatasets(entitlements);
  }

  getRemovedDatasets = async activePermissions => {
    const entitlements = await this.getAggregatedEntitlements(activePermissions);
    const previousDatasetsCall = this.getPreviousDatasets(activePermissions);
    const currentDatasetsCall = this.getAccessibleDatasets(entitlements);
    const [previousDatasets, currentDatasets] = await Promise.all([previousDatasetsCall, currentDatasetsCall]);
    const currentDatasetIDs = currentDatasets.map(dataset => dataset.id);

    // console.info('previousDatasets: ', JSON.stringify(previousDatasets));
    // console.info('currentDatasets: ', JSON.stringify(currentDatasets));

    return previousDatasets.filter(previousDataset => !currentDatasetIDs.includes(previousDataset.id));
  }

  #getByPermissionAcls = async () => {
    const {prevId, diff, client, group} = this.options;
    if(!group && !client) throw new Error('missing query parameter: must have group or client query parameter');
    if(group && client) throw new Error('invalid query parameter: can only have group or client, not both');
    if ((prevId && !diff) || (!prevId && diff)) throw new Error('missing query parameter: must have both prevID and diff or neither');
    if(diff && !diffActions[diff]) throw new Error(`invalid query parameter: diff parameter must be one of the following: ${Object.values(diffActions)}`);

    const permissions = await this.getAclPermissions();
    const activePermissions = permissions.filter(this.isActive);
    const datasets = await (prevId ? this.getRemovedDatasets(activePermissions) : this.getCurrentAccessibleDatasets(activePermissions));
    const datasetAcls = datasets.map(this.createAcl);
    return [{role: this.getRole(), roleType: 'human', roleOwner: this.getRole(), datasets: datasetAcls}];
  }

  getAcls = async () => {
    const {format} = this.options;
    if(!format) throw new Error('missing query parameter: format is required');
    if(!Object.values(formats).includes(format)) throw new Error(`invalid query parameter: format must be one of the following: ${Object.values(formats)}`);
    if(format === 'by-user') return this.#getByPermissionAcls();
    throw new Error(`unhandled by system: format is not one of the following: ${Object.values(formats)}`);
  }
}

module.exports = AclsService;
