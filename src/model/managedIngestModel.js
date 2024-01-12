const Joi = require('joi-browser');

const options = { presence: 'required', allowUnknown: false, abortEarly: false };

const schema = Joi.object().keys({
  taskName: Joi.string()
    .regex(/^[A-Za-z0-9]+(?:[-][A-Za-z0-9]+)*$/, 'cannot contain special characters')
    .max(32).required(),
  source: Joi.string(),
  phase: Joi.string(), 
  sourceEndpointArn: Joi.when('source', {
    is: Joi.string().regex(/aws[a-zA-Z]*/i, 'only if source starts with aws'),
    then: Joi.string().required(),
    otherwise: Joi.string().optional(),
  }),
  targetEndpointArn: Joi.when('source', {
    is: Joi.string().regex(/aws[a-zA-Z]*/i, 'only if source starts with aws'),
    then: Joi.string().required(),
    otherwise: Joi.string().optional(),
  }),
  userRoleARN: Joi.when('source', {
    is: Joi.string().regex(/aws[a-zA-Z]*/i, 'only if source starts with aws'),
    then: Joi.string().required(),
    otherwise: Joi.string().optional(),
  }),
  awsAccountNumber: Joi.when('source', {
    is: Joi.string().regex(/aws[a-zA-Z]*/i, 'only if source starts with aws'),
    then: Joi.string().required(),
    otherwise: Joi.string().optional(),
  }),
  replicationInstanceName: Joi.when('source', {
    is: Joi.string().regex(/aws[a-zA-Z]*/i, 'only if source starts with aws'),
    then: Joi.string().optional(),
    otherwise: Joi.string().optional(),
  }),
  awsAccountRegion: Joi.when('source', {
    is: Joi.string().regex(/aws[a-zA-Z]*/i, 'only if source starts with aws'),
    then: Joi.string().required(),
    otherwise: Joi.string().optional(),
  }),
  transform: Joi.string(),
  datatype: Joi.string(),
  representation: Joi.string().allow(''),
  ingestType: Joi.string(),
  isView: Joi.boolean(),
  db_details: Joi.object().keys({
    username: Joi.string(),
    password: Joi.string(),
    server: Joi.string(),
    port: Joi.number(),
    database: Joi.string(),
    udtf: Joi.any().optional(),
  }),
  source_table: Joi.array().items(
    Joi.object().required().keys({
      schema: Joi.string(),
      tableName: Joi.string(),
      tableType: Joi.string(),
      columns_to_add: Joi.array().optional(),
      filter: Joi.any().optional(),
    }),
  ),
  schedule: Joi.object().optional().keys({
    frequency: Joi.string().valid('daily', 'weekly', 'monthly'),
    startTime: Joi.when('frequency', {
      is: Joi.string().valid('monthly', 'daily', 'weekly'),
      then: Joi.string().required(),
      otherwise: Joi.string().optional()}),
    startDate: Joi.when('frequency', {
      is: Joi.string().valid('monthly', 'daily'),
      then: Joi.string().required(),
      otherwise: Joi.string().optional()}),
    endDate:Joi.when('frequency', {
        is: Joi.string().valid('monthly', 'daily', 'weekly'),
        then: Joi.string().allow(''),
        otherwise: Joi.string().optional()
    }),
    dayOfWeek: Joi.when('frequency', {
      is: Joi.string().valid('weekly'),
      then: Joi.string().required(),
      otherwise: Joi.string().optional(),
    }),
    everyNHours: Joi.when('frequency', {
      is: Joi.string().valid('daily'),
      then: Joi.number().integer().min(0).max(23).optional(),
      otherwise: Joi.string().optional(),
    })
  }),
});
const taskValidation = Joi.object().keys({
  taskName: Joi.string()
    .regex(/^[A-Za-z0-9]+(?:[-][A-Za-z0-9]+)*$/, 'cannot contain special characters')
    .max(32)
});
const scheduleSchema =Joi.object().keys({
source: Joi.string(),
phase: Joi.string(),
datatype: Joi.string(),
ingestType: Joi.string(),
sharepoint_details: Joi.object().keys({
  clientId: Joi.string(),
  clientSecret: Joi.string(),
  siteUrl: Joi.string(),
  tenantId: Joi.string(),
  displayType: Joi.string(),
  selectedItems: Joi.string(),
  // docFolder: Joi.string(),
  docFolder: Joi.when('displayType', {
    is: Joi.string().valid('file'),
    then: Joi.string().required(),
    otherwise: Joi.string().allow('')}),
    fileDestinationDir:Joi.optional(),
}),
schedule : Joi.object().optional().keys({
  frequency: Joi.string().valid('daily', 'weekly', 'monthly'),
  startTime: Joi.when('frequency', {
    is: Joi.string().valid('monthly', 'daily', 'weekly'),
    then: Joi.string().required(),
    otherwise: Joi.string().optional()}),
  startDate: Joi.when('frequency', {
    is: Joi.string().valid('monthly', 'daily'),
    then: Joi.string().required(),
    otherwise: Joi.string().optional()}),
  endDate:Joi.when('frequency', {
      is: Joi.string().valid('monthly', 'daily', 'weekly'),
      then: Joi.string().allow(''),
      otherwise: Joi.string().optional()
  }),
  dayOfWeek: Joi.when('frequency', {
    is: Joi.string().valid('weekly'),
    then: Joi.string().required(),
    otherwise: Joi.string().optional(),
  }),
  everyNHours: Joi.when('frequency', {
    is: Joi.string().valid('daily'),
    then: Joi.number().integer().min(0).max(23).optional(),
    otherwise: Joi.string().optional(),
  })
})
});

function validateMDITask(mdiTask) {
  const { error } = Joi.validate(mdiTask, schema, options);

  if (error) {
    error.details.forEach((detail) => (detail.name = mdiTask.name ? mdiTask.name : 'New Managed Ingest Task'));
  }
  return error;
}
function validateMDiTaskName(mdiTask) {
  const { error } = Joi.validate(mdiTask, taskValidation,options);
  if (error) {
    error.details.forEach((detail) => (detail.name = mdiTask.name ? mdiTask.name : 'New Managed Ingest Task'));
  }

  return error;
}
function validateSharepointTask(scheduleTask) {
  const { error } = Joi.validate(scheduleTask, scheduleSchema, options);

  if (error) {
    error.details.forEach((detail) => (detail.name = scheduleTask.name ? scheduleTask.name : 'New Sharepoint Task'));
  }
  return error;
}

module.exports = {
  validateMDITask,
  validateMDiTaskName,
  validateSharepointTask
};
