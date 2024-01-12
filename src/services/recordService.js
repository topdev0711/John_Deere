const uuid = require('uuid');

function getIsoDatetime() {
  return new Date().toISOString();
}

function addAuditFields(record, user) {
  const auditFields = {
    id: record.id ? record.id : uuid.v4(),
    version: record.version ? record.version : 1,
    createdBy: record.createdBy ? record.createdBy : user,
    updatedBy: user,
    createdAt: record.createdAt ? record.createdAt : getIsoDatetime(),
    updatedAt: getIsoDatetime(),
    status: record.status ? record.status : 'PENDING'
  };
  return {...record, ...auditFields};
}

function mergeAuditFields(existingRecord, updatedRecord) {
  return {
    ...updatedRecord,
    ...{
      id: existingRecord.id,
      version: existingRecord.version,
      createdBy: existingRecord.createdBy,
      updatedBy: existingRecord.updatedBy,
      createdAt: existingRecord.createdAt,
      updatedAt: existingRecord.updatedAt,
      status: existingRecord.status,
      approvals: existingRecord.approvals
    }
  };
}

module.exports = {
  addAuditFields,
  mergeAuditFields
};
