const Joi = require('joi-browser');
const subcommunities = require('../data/reference/subcommunities.json');

const validSubcommunitiesIds = subcommunities
                              .filter((subCommunity) => subCommunity.enabled)
                              .map((sc) => sc.id);

const schema = Joi.object().keys({
  id: Joi.string().optional(),
  name: Joi.string().max(100),
  createdAt: Joi.string().optional(),
  createdBy: Joi.string().optional(),
  updatedAt: Joi.string().optional(),
  updatedBy: Joi.string().optional(),
  requestComments: Joi.string().optional(),
  version: Joi.number().optional(),
  description: Joi.string().max(200).optional(),
  status: Joi.string().optional(),
  group: Joi.string().regex(/AWS|EDG[a-zA-Z]*/i, 'All AD groups must start with AWS or EDG'),
  clientId: Joi.when('roleType', {
    is: 'system',
    then: Joi.string(),
    otherwise: Joi.string().optional()
  }),
  roleType: Joi.string().valid(["human", "system"]),
  businessCase: Joi.string(),
  startDate: Joi.date(),
  endDate: Joi.date().optional().min(Joi.ref('startDate')),
  entitlements: Joi.array().items(Joi.object({
    id: Joi.string().min(10).optional(),
    community: Joi.string(),
    subCommunity: Joi.string().valid(validSubcommunitiesIds, 'There are inactive subcommunities in your selection'),
    countriesRepresented: Joi.array().items(Joi.string()),
    gicp: Joi.string(),
    additionalTags: Joi.array().items(Joi.string()),
    development: Joi.boolean(),
    personalInformation: Joi.boolean()
  })),
  approvals: Joi.array().optional().items(Joi.object()),
  commentHistory: Joi.array().items(Joi.object()).optional(),
  views: Joi.array().items(Joi.string()).optional()
}).or('clientId','group');

function createJoiError(message, key) {
  const error = new Error(message);
  error._object = {name :message};
  error.details =
    [
      {
        message: message,
        path: ['views'],
        type: 'any.allowOnly',
        context:
        {
          valids: [Array],
          key: key,
          label: 'views'
        }
      }
    ] 
  return error;
}

function validate(permission) {
  let {error} = Joi.validate(permission, schema, { presence: 'required', abortEarly: false });
  if(permission.roleType === 'human' && !permission.entitlements.length && !permission.views.length){
    error = createJoiError('Must select at least 1 entitlement or 1 view', 'noViewNoEntitlement');
  }
  else if(permission.roleType === 'system' && !permission.entitlements.length){
    error = createJoiError('Must select at least 1 entitlement','noEntitlements');
  }
  if(permission.roleType === 'system' && permission.views && permission.views.length){
    error = createJoiError('System permission can not have views');
  }
  if (error) {
    error._object.name ? error.details.map(details => details.name = error._object.name) : error.details.map(details => details.name = 'New Permission');
  }
  return error;
}

module.exports = {
  validate
};
