/**
 * @jest-environment node
 */

import AclsService from "../../../src/services/AclsService";
import datasetService from "../../../src/services/datasetService";
import permissionService from "../../../src/services/permissionService";
import {AVAILABLE} from "../../../src/services/statusService";
import {when} from "jest-when";

jest.mock('../../../src/services/datasetService');
jest.mock('../../../src/services/permissionService');

const format = 'by-user';
const group = 'anyAdGroup';

const options = {format, group, prevId: 'any-id', diff: 'remove'};
const error = new Error('some error');

const systemsCommunity = {id: 'systems-id', name: 'Systems'};
const demoSubcommunity = {id: 'demo-id', name: 'demo'};
const logsSubcommunity = {id: 'logs-id', name: 'logs'};

const demo = {community: systemsCommunity, subCommunity: demoSubcommunity};
const logs = {community: systemsCommunity, subCommunity: logsSubcommunity};

const baseDatasetValues = {discoveredTables: [],  paths: [], schemas: [], tables: [], version: 1, views: []};
const demoDataset = { id: 'demo-id', version: 1, phase: 'ENHANCE', environmentName: 'demo.name', classifications: [demo] };
const logsDataset = { id: 'log-id', version: 1, phase: 'ENHANCE', environmentName: 'logs.name', classifications: [logs] };

const startDate = new Date();
const endDate = new Date(startDate);
endDate.setDate(endDate.getDate() + 1);

const createAcls = datasets => [{role: group, roleOwner: group, roleType: "human", datasets}];
const defaultPermission = {status: AVAILABLE, startDate, endDate, entitlements: [demo, logs]};
const createPermission = (overrideValues = {}) => ({...defaultPermission, ...overrideValues});

describe('aclsService tests', () => {
  it('should throw an error when no format is provided', () => {
    const aclsService = new AclsService({});
    return expect(aclsService.getAcls()).rejects.toThrow(new Error('missing query parameter: format is required'));
  });

  it('should throw an error when incorrect format is provided', () => {
    const aclsService = new AclsService({format: 'badFormat'});
    return expect(aclsService.getAcls()).rejects.toThrow(new Error('invalid query parameter: format must be one of the following: by-user'));
  });

  it('should throw an error when by permission has no client or group', () => {
    const aclsService = new AclsService({format});
    return expect(aclsService.getAcls()).rejects.toThrow(new Error('missing query parameter: must have group or client query parameter'));
  });

  it('should throw an error when by permission has client and group', () => {
    const aclsService = new AclsService({format, client: 'anyClient', group: 'anyGroup'});
    return expect(aclsService.getAcls()).rejects.toThrow(new Error('invalid query parameter: can only have group or client, not both'));
  });

  it('should throw error when missing diff query parameter', () => {
    const aclsService = new AclsService({format, group: 'anyGroup', prevId: 'anyId'});
    return expect(aclsService.getAcls()).rejects.toThrow(new Error('missing query parameter: must have both prevID and diff or neither'));
  });

  it('should throw error when missing prevId query parameter', () => {
    const aclsService = new AclsService({format, group: 'anyGroup', diff: 'remove'});
    return expect(aclsService.getAcls()).rejects.toThrow(new Error('missing query parameter: must have both prevID and diff or neither'));
  });

  it('should throw error when invalid query parameter', () => {
    const aclsService = new AclsService({format, group: 'anyGroup', prevId: 'anyId', diff: 'badDiff'});
    return expect(aclsService.getAcls()).rejects.toThrow(new Error('invalid query parameter: diff parameter must be one of the following: remove'));
  });

  it('throw an error when unable to retrieve permissions for group', () => {
    permissionService.searchForPermission.mockRejectedValue(error);
    const aclsService = new AclsService(options);
    return expect(aclsService.getAcls()).rejects.toThrow(error);
  });

  it('throw an error when unable to retrieve all versions of a permission', () => {
    permissionService.getAllPermissionVersions.mockRejectedValue(error);
    permissionService.searchForPermission.mockResolvedValue([]);
    datasetService.searchForDataset.mockResolvedValue([]);
    const aclsService = new AclsService(options);
    return expect(aclsService.getAcls()).rejects.toThrow(error);
  });

  it('throw an error when unable to retrieve datasets', () => {
    permissionService.getAllPermissionVersions.mockResolvedValue([]);
    permissionService.searchForPermission.mockResolvedValue([]);
    datasetService.searchForDataset.mockRejectedValue(error);
    const aclsService = new AclsService(options);
    return expect(aclsService.getAcls()).rejects.toThrow(error);
  });

  it('should get a datasets to remove when a subcommunity has changed', async () => {
    const version2 = createPermission({entitlements: [demo]});

    permissionService.getAllPermissionVersions.mockResolvedValue([createPermission({entitlements: [demo, logs]}), version2]);
    permissionService.searchForPermission.mockResolvedValue([version2]);

    when(datasetService.searchForDataset).calledWith({community: [systemsCommunity.name], subCommunity: [demoSubcommunity.name, logsSubcommunity.name]}).mockResolvedValue([demoDataset, logsDataset]);
    when(datasetService.searchForDataset).calledWith({community: [systemsCommunity.name], subCommunity: [demoSubcommunity.name]}).mockResolvedValue([demoDataset]);

    const aclsService = new AclsService(options);
    const actualAcls = await aclsService.getAcls();

    const expectedAcls = createAcls([{...baseDatasetValues, id: "log-id", environmentName:"logs.name",actions:["read"]}]);
    return expect(actualAcls).toEqual(expectedAcls);
  });

  it('should get a dataset to remove when an additional tag has changed', async () => {
    const additionalTags= ["anyTag"];
    const version2 = createPermission({entitlements: [demo, logs]});
    const demoDataset = { id: 'demo-id', version: 1, phase: 'ENHANCE', environmentName: 'demo.name', classifications: [{...demo, additionalTags}] };

    permissionService.getAllPermissionVersions.mockResolvedValue([createPermission({entitlements: [{...demo, additionalTags}, logs]}), version2]);
    permissionService.searchForPermission.mockResolvedValue([version2]);

    when(datasetService.searchForDataset).calledWith({community: [systemsCommunity.name], subCommunity: [demoSubcommunity.name, logsSubcommunity.name]}).mockResolvedValue([demoDataset, logsDataset]);
    when(datasetService.searchForDataset).calledWith({community: [systemsCommunity.name], subCommunity: [demoSubcommunity.name]}).mockResolvedValue([demoDataset]);

    const aclsService = new AclsService(options);
    const actualAcls = await aclsService.getAcls();

    const expectedAcls = createAcls([{...baseDatasetValues, ...{id: "demo-id", environmentName: "demo.name", actions:["read"]}}]);
    return expect(actualAcls).toEqual(expectedAcls);
  });

  it('should not have datasets when no entitlements have been removed', async () => {
    const version2 = {status: AVAILABLE, startDate, endDate, entitlements: [demo, logs]};

    permissionService.getAllPermissionVersions.mockResolvedValue([createPermission({entitlements: [demo, logs]}), version2]);
    permissionService.searchForPermission.mockResolvedValue([version2]);

    when(datasetService.searchForDataset).calledWith({community: [systemsCommunity.name], subCommunity: [demoSubcommunity.name, logsSubcommunity.name]}).mockResolvedValue([demoDataset, logsDataset]);
    when(datasetService.searchForDataset).calledWith({community: [systemsCommunity.name], subCommunity: [demoSubcommunity.name]}).mockResolvedValue([demoDataset]);

    const aclsService = new AclsService(options);
    const actualAcls = await aclsService.getAcls();

    const expectedAcls = createAcls([]);
    return expect(actualAcls).toEqual(expectedAcls);
  });

  it('should have read permission when entitlement is for non custodian', async () => {
    const version2 = createPermission({entitlements: [demo]});

    permissionService.getAllPermissionVersions.mockResolvedValue([createPermission({entitlements: [demo, logs]}), version2]);
    permissionService.searchForPermission.mockResolvedValue([version2]);

    when(datasetService.searchForDataset).calledWith({community: [systemsCommunity.name], subCommunity: [demoSubcommunity.name, logsSubcommunity.name]}).mockResolvedValue([demoDataset, logsDataset]);
    when(datasetService.searchForDataset).calledWith({community: [systemsCommunity.name], subCommunity: [demoSubcommunity.name]}).mockResolvedValue([demoDataset]);
    const aclsService = new AclsService(options);
    const actualAcls = await aclsService.getAcls();

    const expectedAcls = createAcls([{...baseDatasetValues, ...{id: "log-id", environmentName: "logs.name", actions:["read"]}}]);
    return expect(actualAcls).toEqual(expectedAcls);
  });

  it('should have read, write, and delete permission when entitlement is for custodian', async () => {
    const version2 = {status: AVAILABLE, startDate, endDate, entitlements: [demo]};
    const logsDataset = { id: 'log-id', version: 1, custodian: group, phase: 'ENHANCE', environmentName: 'logs.name', classifications: [logs] };

    permissionService.getAllPermissionVersions.mockResolvedValue([createPermission({entitlements: [demo, logs]}), version2]);
    permissionService.searchForPermission.mockResolvedValue([version2]);

    when(datasetService.searchForDataset).calledWith({community: [systemsCommunity.name], subCommunity: [demoSubcommunity.name, logsSubcommunity.name]}).mockResolvedValue([demoDataset, logsDataset]);
    when(datasetService.searchForDataset).calledWith({community: [systemsCommunity.name], subCommunity: [demoSubcommunity.name]}).mockResolvedValue([demoDataset]);

    const aclsService = new AclsService(options);
    const actualAcls = await aclsService.getAcls();

    const expectedAcls = createAcls([{...baseDatasetValues, ...{id: "log-id", environmentName:"logs.name", actions:["read", "write", "delete"]}}]);
    return expect(actualAcls).toEqual(expectedAcls);
  });

  it('should not have search for an expired permission', async () => {
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() - 1);
    const version2 = createPermission({ endDate, entitlements: [demo]});

    permissionService.getAllPermissionVersions.mockResolvedValue([createPermission({entitlements: [demo, logs]}), version2]);
    permissionService.searchForPermission.mockResolvedValue([version2]);
    datasetService.searchForDataset.mockResolvedValue([]);

    const aclsService = new AclsService(options);
    await aclsService.getAcls();

    expect(datasetService.searchForDataset).toBeCalledWith({community: [], subCommunity: []});
  });

  it('should not have updates when the latest permission has a start date before the current date', async () => {
    const newStartDate = new Date(startDate);
    newStartDate.setDate(newStartDate.getDate() + 1);
    const version2 = createPermission({ startDate: newStartDate, entitlements: [demo]});

    permissionService.getAllPermissionVersions.mockResolvedValue([createPermission({startDate: newStartDate, entitlements: [demo, logs]}), version2]);
    permissionService.searchForPermission.mockResolvedValue([version2]);
    datasetService.searchForDataset.mockResolvedValue([]);

    const aclsService = new AclsService(options);
    await aclsService.getAcls();

    expect(datasetService.searchForDataset).toBeCalledWith({community: [], subCommunity: []});
  });
});
