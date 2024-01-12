const { isApproved, isAvailable, isDeleted, isPending, isLatestNonAvailableStatus} = require('./statusService');
let log = require('edl-node-log-wrapper');

const setLogger = logger => log = logger;

function allVersionsDeleted(versions) {
  return versions.every(isDeleted);
}

function existingPendingVersion(versions, updatingVersionId) {
  return versions.find(version => version.version !== updatingVersionId && isLatestNonAvailableStatus(version));
}

function startedApprovalProcess(version) {
  return isPending(version) && version.approvals.some(isApproved);
}

function availableVersionIsNotLatest(versions, updatedVersion) {
  return isAvailable(updatedVersion) && updatedVersion.version < getLatestAvailableVersion(versions).version;
}

function isLockedUser(username, lockedBy) {
  return (typeof lockedBy === 'string' && username === lockedBy) || (typeof lockedBy === 'object' && username === lockedBy.username);
}

function lockedByAnotherUser(versions, user) {
  const latestAvailable = getLatestAvailableVersion(versions);
  return !!latestAvailable && !!latestAvailable.lockedBy && !isLockedUser(user, latestAvailable.lockedBy);
}

function validateAllowedToUpdate(versions, updatedVersion, user, isCreator) {
  if (!versions.length) {
    return 'must have existing version to update';
  } else if (allVersionsDeleted(versions)) {
    return 'all versions deleted';
  } else if (isApproved(updatedVersion)) {
    return 'cannot update approved version';
  } else if (existingPendingVersion(versions, updatedVersion.version)) {
    return 'cannot update this version when a pending version exists';
  } else if (lockedByAnotherUser(versions, user)) {
    return 'Cannot save a dataset that is locked by another user.';
  } else if (startedApprovalProcess(updatedVersion)) {
    return 'cannot update version since an approver has already approved';
  } else if (updatedVersion.status !== 'AVAILABLE' && !isCreator) {
    return `${user} cannot update since ${updatedVersion.createdBy} created`;
  } else if (availableVersionIsNotLatest(versions, updatedVersion)) {
    return 'Cannot update old available version';
  }
}

function allowedToUpdate(versions, updatedVersion, user, versionType) {
  const isCreator = updatedVersion.createdBy === user;
  const errorMessage = validateAllowedToUpdate(versions, updatedVersion, user, isCreator);

  if (errorMessage) {
    log.error(errorMessage);
    const error = new Error(`${versionType} update not allowed.`);
    error.details = { message: errorMessage };
    throw error;
  }
}

function calculateVersion(versions, updatedVersion) {
  return isAvailable(updatedVersion) ? Math.max(...versions.map(version => version.version)) + 1 : updatedVersion.version;
}

function sortDatasetVersionsDescending(versions) {
  return versions.sort((a, b) => b.version - a.version);
}

function getLatestNonDeletedVersion(versions) {
  return sortDatasetVersionsDescending(versions).filter(v => !isDeleted(v))[0];
}

function getLatestAvailableVersion(versions = []) {
  return sortDatasetVersionsDescending(versions).filter(isAvailable)[0];
}

function getLatestVersions(array) {
  sortById(array);
  return array.reduce((acc, currentItem) => {
    const lastItem = (acc || []).pop();
    if (!!lastItem) {
      if (lastItem.id === currentItem.id) {
        lastItem.version < currentItem.version ? acc.push(currentItem) : acc.push(lastItem);
      } else {
        acc.push(lastItem);
        acc.push(currentItem);
      }
    } else acc.push(currentItem);
    return acc;
  }, [])
}

function sortById(array) {
  return array.sort((a, b) => a.id.toLowerCase() > b.id.toLowerCase() ? 1 : a.id.toLowerCase() < b.id.toLowerCase() ? -1 : 0);
}

module.exports = {
  setLogger,
  allowedToUpdate,
  calculateVersion,
  getLatestNonDeletedVersion,
  getLatestAvailableVersion,
  getLatestVersions
};
