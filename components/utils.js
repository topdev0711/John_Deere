import parse from 'csv-parse';
import moment from 'moment';
import {FaCalendarAlt, FaCheck, FaHashtag} from 'react-icons/fa'
import {BiBracket, BiCodeCurly, BiRightArrowAlt} from 'react-icons/bi';
import {GoFileBinary, GoTextSize} from 'react-icons/go'
import uuid from 'uuid';
import changeCase from 'change-case';
import {isEqual, omit} from 'lodash';
import {detailedDiff} from 'deep-object-diff';
import gicp_file from '../src/data/reference/gicp.json';

const dataTypeOptionsPartial = [
  { id: "int", name: "int", icon: <FaHashtag /> },
  { id: "string", name: "string", icon: <GoTextSize /> },
  { id: "long", name: "long", icon: <FaHashtag /> },
  { id: "boolean", name: "boolean", icon: <FaCheck /> },
  { id: "float", name: "float", icon: <FaHashtag /> },
  { id: "double", name: "double", icon: <FaHashtag /> },
  { id: "bytes", name: "bytes", icon: <GoFileBinary /> },
  { id: "timestamp", name: "timestamp", icon: <FaCalendarAlt /> },
  { id: "date", name: "date", icon: <FaCalendarAlt /> },
  { id: "decimal", name: "decimal", icon: <FaHashtag /> },
];

const dataTypeOptionsFull = [
  ...dataTypeOptionsPartial,
  { id: "integer", name: "integer", icon: <FaHashtag /> },
  { id: "short", name: "short", icon: <FaHashtag /> },
  { id: "byte", name: "byte", icon: <FaHashtag /> },
  { id: "interval", name: "interval", icon: <FaCalendarAlt /> },
  { id: "array", name: "array", icon: <BiBracket /> },
  { id: "struct", name: "struct", icon: <BiCodeCurly /> },
  { id: "map", name: "map", icon: <BiRightArrowAlt /> },
  { id: "binary", name: "binary", icon: <GoFileBinary /> }
]

const getDataTypeOptions = (isPartial = false) => {
  const arr = isPartial ? dataTypeOptionsPartial : dataTypeOptionsFull;
  return arr.map(({ id, name }) => ({ id, name }));
};

const attributeOptions = [
  { id: "None", name: "None" },
  { id: "id", name: "id" },
  { id: "extract time", name: "extract time"},
  { id: "delete indicator", name: "delete indicator", datatype: { id: "int", name: "int" } },
]

const localStorageStatuses = [
  'AVAILABLE',
  'PENDING',
  'REJECTED'
];

const omittedKeys = [
  'status'
]

function attributeForName(name) {
  return attributeOptions.find(a => a.name === name) || attributeOptions[0];
}

const findOriginatingDatasetForSchema = (schemaId, datasets) => {
  const versions = datasets.filter(ds => ds.status === 'AVAILABLE').filter(ds => ds.schemas.find(({ id }) => id === schemaId));
  const sorted = [...versions].sort((a, b) => b.version - a.version);
  return !!sorted.length ? sorted[0] : undefined;
}

function isPendingPublishAction(object = {}) {
  const isPendingPublishApproval = ({ publishedPath, unpublishedPath, status }) => {
    return (publishedPath || unpublishedPath) && status !== 'APPROVED';
  };
  return (object.approvals || []).some(isPendingPublishApproval);
}

function hideEditButton(object, username, hasPendingVersion = false) {
  object = object || {};

  if (isPendingPublishAction(object)) return true;
  const { lockedBy } = object;
  const legacyLockCheck = !!lockedBy && typeof lockedBy === 'string' && lockedBy !== username;
  const lockCheck = !!lockedBy && typeof lockedBy === 'object' && !!lockedBy.username && lockedBy.username !== username;
  const isLockedForEdit = legacyLockCheck || lockCheck;
  if (isLockedForEdit) return true;
  const isCreatedBy = object.loggedInUserIsCreator !== undefined ? object.loggedInUserIsCreator : username == object.createdBy;
  if(hasPendingVersion && object.status !== 'PENDING') return true

  const isAvailable = object.status == 'AVAILABLE'
  if (isAvailable) return false

  const isApproved = object.status == 'APPROVED'
  if (isApproved) return true

  const isRejected = object.status == 'REJECTED';
  const hasAnApprovedApproval = !!(object.approvals || []).find(a => a.status == 'APPROVED');
  if (!isRejected && hasAnApprovedApproval) return true

  const isPendingOrRejected = object.status == 'PENDING' || isRejected;
  const isCreatedByAndPendingOrRejected = isCreatedBy && isPendingOrRejected;
  if (!isCreatedByAndPendingOrRejected) return true

  return false;
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return moment(date).format('DD MMM YYYY')
}

const formatTimeframe = (perm) => {
  const start = formatDate(perm.startDate)
  if (perm.endDate && perm.endDate != '') {
    const end = formatDate(perm.endDate)
    return `${start}  to  ${end}`
  }
  return start
}

const findLatestAvailableVersions = (items) => {
  const versionsAvailable = items.filter(p => {
    return p.status === 'AVAILABLE'
  })

  return Object.values(versionsAvailable.reduce((accum, item) => {
    const found = accum[item.id]
    if (!found || found.version < item.version) {
      return { ...accum, [item.id]: item }
    }
    return accum
  }, {}))
}

const findPermissionsWithAccessToView = (view, permissions = []) => {
  return  permissions.filter(permission => {
    return (permission.views || []).find(permissionView => permissionView.name === view);
  });
};

const findLatestNonDeleted = (items) => {
  const latest = items.filter(i => i.status !== 'DELETED').reduce((accum, item) => {
    const found = accum[item.id]
    if (!found || found.version < item.version) {
      return {
        ...accum,
        [item.id]: item
      }
    }
    return accum
  }, {})

  return Object.values(latest)
}

const getIconForDataTypeName = (datatypeName) => {
  return (dataTypeOptionsFull.find(dt => dt.name === datatypeName) || { icon: '' }).icon
}

const formatSchemas = schemas => {
  return (schemas || []).map(s => {
    return {
      ...s,
      fields: s.fields.map(f => ({ ...f, id: uuid.v4() }))
    }
  })
}

const groupValuesByName = (environmentApprovalObject) => {
  let groupedByNames = {}
  if (!!environmentApprovalObject && !!environmentApprovalObject.values && environmentApprovalObject.values.length > 0) {
    groupedByNames = { name: environmentApprovalObject.name, values: {} };
    environmentApprovalObject.values.map(value => {
      if (!groupedByNames.values[value.name]) {
        groupedByNames.values[value.name] = [value]
      } else {
        groupedByNames.values[value.name].push(value)
      }
    });
  }
  return groupedByNames;
}

const relevanceWeights = {
  name: 6,
  environmentName: 4,
  approvals: 4,
  description: 3,
  custodian: 3,
  documentation: 2,
  phase: 2
}

const removeAndUnlockRecord = (record) => {
  if (!record) return record;

  localStorage.removeItem(record.id);
  const { lockedBy, ...unlockedRecord } = record;
  return unlockedRecord;
}

const setLocalStorage = (isEditing, previousRecord, currentState) => {
  if (isEditing && localStorageStatuses.includes(previousRecord.status)) {
    const objectToSave = detailedDiff(omit(previousRecord, omittedKeys), omit(currentState, omittedKeys));
    const replacer = (_key, value) => typeof value === 'undefined' ? null : value;
    const stringToSave = JSON.stringify(objectToSave, replacer);
    return localStorage.setItem(currentState.id, stringToSave);
  }
}

function getLocalStorageItem(key, previousRecord) {
  let updatedRecord = JSON.parse(JSON.stringify(previousRecord));
  const item = JSON.parse(localStorage.getItem(key));
  if (item) {
    if (item.deleted) {
      updateRecord(item, updatedRecord, 'deleted');
    }
    if (item.added) {
      updateRecord(item, updatedRecord, 'added');
    }
    if (item.updated) {
      updateRecord(item, updatedRecord, 'updated');
    }
  }
  return updatedRecord;
}

function updateRecord(storedItem, updatedRecord, action) {
  const actionItems = storedItem[action];
  const keys = Object.keys(actionItems);
  recursivelyUpdate(keys, actionItems, updatedRecord, action);
}

function objectIsArray(obj) {
  const keys = Object.keys(obj);
  return keys.length ? !!keys[0].match(/^\d+$/g) : obj.constructor === Array;
}

function isFilterableArray(item) {
  return !!item && item.constructor === Array;
}

function recursivelyUpdate(keys, updatedValue, updatedRecord, action) {
  keys.forEach(key => {
    const value = updatedValue[key];
    if (!value && action === 'deleted') {
      delete updatedRecord[key];
    } else if (!!value && typeof value === 'object') {
      const updateKeys = Object.keys(value);
      if (objectIsArray(value)) {
        updatedRecord[key] = !!updatedRecord[key] ? [ ...updatedRecord[key] ] : [];
        recursivelyUpdate(updateKeys, value, updatedRecord[key], action);
      } else {
        updatedRecord[key] = !!updatedRecord[key] ? { ...updatedRecord[key] } : {};
        recursivelyUpdate(updateKeys, value, updatedRecord[key], action);
      }
    } else {
      if (['updated', 'added'].includes(action)) {
        updatedRecord[key] = value;
      }
    }
    updatedRecord[key] = isFilterableArray(updatedRecord[key]) ? updatedRecord[key].filter(item => item) : updatedRecord[key];
  });
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const determineRelevance = (objects, searchCriteria) => {
  if (searchCriteria !== {} && searchCriteria.replace(/\s/g, '').length) {
    const words = searchCriteria
        .split(/"(.*?)"|\s+/g)
        .filter(x => !!x && !!x.length)
        .map(word => word.toLowerCase())
    return objects.map(object => {
      const matchesByWord = words.reduce((acc, word) => {
        const matches = Object.keys(object).map(key => {
          const details = { score: 0 }
          let value = object[key];
          let weight = 0;
          if (typeof value !== 'string') {
            if (key === 'approvals') {
              value = value.map(v => ({ details: v.details || {} }))
            }
            value = JSON.stringify(value)
          }

          const lowerCaseValue = `${value}`.toLowerCase()

          const foundExact = !!lowerCaseValue.match(new RegExp(`(^${escapeRegExp(word)}$)|(:\"${escapeRegExp(word)}\")`, 'g'))
          if (foundExact) {
            weight += 10
            details.level = 'exact'
          }
          const foundRough = !!lowerCaseValue.match(new RegExp(`\\b${escapeRegExp(word)}\\b`, 'g'))
          if (foundRough) {
            weight += 6
            details.level = details.level || 'partial'
          }
          const foundFuzzy = lowerCaseValue.includes(word)
          if (foundFuzzy) {
            weight += relevanceWeights[key] || 1
            details.level = details.level || 'loose'
          }

          return { key: changeCase.title(key === 'approvals' ? 'environmentDetails' : key), ...details, score: weight }
        })
        if (matches.every(m => m.score === 0)) {
          return acc
        }
        return { ...acc, [word]: matches.filter(m => m.score > 0) }
      }, {})

      const relevance = {
        matches: matchesByWord,
        score: Object.values(matchesByWord)
            .reduce((a, b) => a.concat(b), [])
            .reduce((a, b) => a + b.score, 0)
      }

      return {
        ...object,
        relevance: Object.keys(relevance.matches).length === new Set(words).size ?
            relevance :
            { matches: {}, score: 0 }
      }
    })
  }
  return objects.map(obj => ({ ...obj, relevance: { matches: {}, score: 0 } }));
}

function linkedDatasets(datasets, schema) {
  if(!!schema && datasets.length > 0) {
    const linkedTo = datasets.filter(ds =>
            !!ds.linkedSchemas && ds.linkedSchemas.filter(sch =>
                typeof sch === 'string' ?
                    sch.split('--')[0] === schema.id.split('--')[0] :
                    sch.id.split('--')[0] === schema.id.split('--')[0]
            ).length > 0
    );
    return linkedTo;
  } else return [];
}

const isPermEffective = (perm) => {
  if (!perm) return false;
  let now = new Date();
  let start = new Date(perm.startDate);
  let end = new Date(perm.endDate);
  return start.getTime() < now &&
      (!perm.endDate || (end.getTime() > now.getTime()));
}

const isPermExpired = (perm) => {
  if (!perm) return false;
  const now = new Date();
  const end = new Date(perm.endDate);
  return end.getTime() < now.getTime();
}

const isEqualObject = (a, b, omitKeys = []) => {
  if (!!omitKeys.length) {
    const noIdA = omit(a, [...omitKeys]);
    const noIdB = omit(b, [...omitKeys]);
    return isEqual(noIdA, noIdB);
  }
  return isEqual(a,b);
}

const isCustodian = (custodian, groups) => {
  return groups.includes(custodian)
}

const isNullOrNone = (value) => {
  return ['None', '', null, undefined].includes(value)
}

function createGicpOpts(param) {
  const gicpDeprecated = gicp_file.filter(g => !g.enabled);
  const gicpRecommended = gicp_file.filter(g => g.enabled);
  const createOpt = ({id, name}) => ({id, name});
  const createGroupOpt = (groupLabel, items) => ({groupLabel, options: items.map(createOpt)});
  let result = [createGroupOpt('Recommended', gicpRecommended)];
  if (param.getDeprecated){
    result.push(createGroupOpt('Deprecated', gicpDeprecated));
  }
  return result;
}

const getApprovalsByType = async (type, user) => {
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
      const results = await approvalsRes.json();
      return results;
    } else {
      const errorResponse = await approvalsRes.json();
      console.log(`Failed to fetch ${type} approvals`, errorResponse.error);
      return [];
    }
  } catch(err) {
    console.log(`Failed to fetch ${type} approvals`, err);
    return [];
  }
}

const getPriorDate = days => {
  let date = new Date();
  try {
    days && parseInt(days) &&
      date.setDate(date.getDate() - parseInt(days));
  } catch (err) {
    console.log('Failed to parse days for prior date', err);
  }
  return date.toLocaleDateString('en-US');
};

const VISIBILITY = Object.freeze({
  FULL_VISIBILITY: 'All Users',
  VIEWS_ONLY: 'Accessible views only',
  NO_VISIBILITY: 'Custodian Only'
});

function getVisibilityEnumLabels(enumKey) {
  return VISIBILITY[enumKey];
}

const hasAdGroupToggleEnabled = (toggle, groups=[]) => toggle?.enabled && (!toggle.adGroups || toggle.adGroups.some(adGroup => groups.includes(adGroup)));

export default {
  isPermEffective,
  isPermExpired,
  isEqualObject,
  removeAndUnlockRecord,
  parseCsvData: parse,
  findOriginatingDatasetForSchema,
  formatDate,
  formatTimeframe,
  findLatestAvailableVersions,
  findLatestNonDeleted,
  getIconForDataTypeName,
  schemaForm: {getDataTypeOptions, attributeOptions},
  hideEditButton,
  formatSchemas,
  getLocalStorageItem,
  groupValuesByName,
  determineRelevance,
  getDocument: () => document,
  getPriorDate,
  sendEmail: (email) => location.href = email,
  linkedDatasets,
  localStorageStatuses,
  setLocalStorage,
  attributeForName,
  isPendingPublishAction,
  isCustodian,
  isNullOrNone,
  findPermissionsWithAccessToView,
  createGicpOpts,
  getApprovalsByType,
  hasAdGroupToggleEnabled,
  getVisibilityEnumLabels
}
