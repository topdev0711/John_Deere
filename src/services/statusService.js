const APPROVED = 'APPROVED';
const isApproved = record => (record?.status || record) === APPROVED;

const AVAILABLE = 'AVAILABLE';
const isAvailable = record => (record?.status || record) === AVAILABLE;

const DELETED = 'DELETED';
const isDeleted = record => (record?.status || record) === DELETED;

const PENDING = 'PENDING';
const isPending = record => (record?.status || record) === PENDING;

const PENDING_DELETE = 'PENDING DELETE';
const isPendingDelete = record => (record?.status || record) === PENDING_DELETE;

const REJECTED = 'REJECTED';
const isRejected = record => (record?.status || record) === REJECTED;

const NONDELETE_STATUSES = [APPROVED, AVAILABLE, PENDING, REJECTED];
const isNonDeleteStatus =  record =>  NONDELETE_STATUSES.includes((record.status || record));

const PROCESSING_STATUSES = [APPROVED, PENDING, REJECTED];
const isLatestNonAvailableStatus = record => PROCESSING_STATUSES.includes((record.status || record));

const ALL_STATUSES = [APPROVED, AVAILABLE, DELETED, PENDING, PENDING_DELETE, REJECTED];

module.exports = {
  APPROVED,
  AVAILABLE,
  DELETED,
  PENDING,
  PENDING_DELETE,
  REJECTED,
  NONDELETE_STATUSES,
  PROCESSING_STATUSES,
  ALL_STATUSES,
  isApproved,
  isAvailable,
  isDeleted,
  isPending,
  isPendingDelete,
  isRejected,
  isNonDeleteStatus,
  isLatestNonAvailableStatus
};
