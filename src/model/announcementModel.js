const BaseJoi = require('joi-browser');
const Extension = require('joi-date-extensions');
const Joi = BaseJoi.extend(Extension);

const options = {presence: 'required', allowUnknown: false, abortEarly: false};

const schema = Joi.object().keys({
  title: Joi.string(),
  startAt: Joi.date().format('YYYY-MM-DDTHH:mm:ss.sssZ').raw(),
  endAt: Joi.date().format('YYYY-MM-DDTHH:mm:ss.sssZ').raw(),
  text: Joi.string(),
  createdAt: Joi.string().optional(),
  updatedAt: Joi.string().optional()
});

function validate(announcement) {
  const {error} = Joi.validate(announcement, schema, options);

  if (error) {
    error.details.forEach(detail => detail.name = announcement.name ? announcement.name : 'New Announcement');
    throw error;
  }
}

module.exports = {
  validate
};
