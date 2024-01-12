const Joi = require('joi-browser');

const options = {presence: 'required', allowUnknown: false, abortEarly: false};

const schema = Joi.object().keys({
    name: Joi.string().regex(/^[A-Za-z0-9-]+$/, 'cannot contain special characters').max(200),
    businessApplication: Joi.string(),
    teamPdl: Joi.string().regex(/^[A-Za-z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'not a valid email address').max(200),
    subject: Joi.string().regex(/AWS|EDG[a-zA-Z]*/i, 'All AD groups must start with AWS or EDG'),
    chargeUnitDepartment: Joi.string().allow('').optional(),
    billingSOPId: Joi.string().allow('').optional() ,
    assignmentGroup: Joi.string(),
    supportGroup: Joi.string(),
    businessCriticality: Joi.string() ,
    installStatus: Joi.string() ,
    shortDescription: Joi.string(),
    comments: Joi.string().allow('').optional(),
    unit: Joi.string().allow('').optional(),
    department: Joi.string().allow('').optional(),
});

function validate(application) {
    const {error} = Joi.validate(application, schema, options);

    if (error) {
      error.details.forEach(detail => detail.name = application.name ? application.name : 'New Application');
    }
    return error;
}

  module.exports = {
    validate
  };
