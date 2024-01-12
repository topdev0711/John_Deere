const schemaModel = require('../model/schemaModel');
let log = require('edl-node-log-wrapper');

const setLogger = logger => log = logger;

const fieldAddOrRemoveFieldError = createErrorWithDetails('Cannot add or remove a field from an existing schema');
const modifiedFieldError = createErrorWithDetails('Cannot modify a field in an existing schema, other than description or documentation');
const partitionedByError = createErrorWithDetails('Cannot modify schema attribute partitionedBy');
const linkedSchemaError = schema => createErrorWithDetails(`Cannot remove schema: ${schema.name} because it is still linked in other datasets`);
const linkedSchemaInSchemasError = linkedSchema => createErrorWithDetails(`Invalid linkedSchemas: ${linkedSchema} cannot have linkedSchema ID in schemas list`);

const schemaErrorMessage = 'Schema validation failed';
const deleteIndicator = 'delete indicator';
const extractTime = 'extract time';
const id = 'id';
const none = 'None';
const partition = 'partition';

function getErrorDetailsMessages(errors) {
  return errors.map(error => error.details).reduce((total, details) => total.concat(details), []);
}

function createErrorWithDetails(message) {
  const error = new Error(message);
  error.details = [{message}];
  return error;
}

function createDetailsError(errors) {
  const error = new Error(schemaErrorMessage);
  error.details = getErrorDetailsMessages(errors);
  return error;
}

const getIds = schemas => schemas.map(schema => schema.id);

function validateNoDuplicateIds(schemaIds, schemaType) {
  const schemaSet = new Set(schemaIds);
  const hasDuplicates = schemaIds.length !== schemaSet.size;
  if(hasDuplicates) return createErrorWithDetails(`${schemaType} cannot contain duplicates`)
}

function validateNoDuplicateNameAndVersion(schemas) {
  const hasDuplicates = schemas.some(schema => {
    const matchingSchemas = schemas.filter(({name, version }) => schema.name === name && schema.version === version);
    return matchingSchemas.length > 1
  });
  if(hasDuplicates) return createErrorWithDetails(`schemas cannot have the same name and version`);
}

function validateNoLinkedSchemasInSchemas(schemas, linkedSchemas){
  const schemaIds = schemas.map(({id}) => parseId(id));
  const invalidLinkedIds = linkedSchemas.filter(linkedSchema => schemaIds.includes(linkedSchema));
  if(invalidLinkedIds.length > 0 ) return linkedSchemaInSchemasError(invalidLinkedIds);
}

function validateSchemas(schemas, linkedSchemas, newSchemasId) {
  const duplicateLinkedSchemaErrors = validateNoDuplicateIds(linkedSchemas, 'linkedSchemas');
  const duplicateSchemaErrors = validateNoDuplicateIds(getIds(schemas), 'schemas');
  const duplicateSchemaNameVersionErrors = validateNoDuplicateNameAndVersion(schemas);
  const linkedSchemaInSchemasErrors = validateNoLinkedSchemasInSchemas(schemas, linkedSchemas);
  const schemaErrors = schemas.map(schema => validateSchema(schema, newSchemasId)).filter(error => error);
  const allErrors = [duplicateLinkedSchemaErrors, duplicateSchemaErrors, duplicateSchemaNameVersionErrors, linkedSchemaInSchemasErrors, ...schemaErrors].filter(error => error);
  if(allErrors.length) return allErrors;
}

function mergeErrors(allErrors) {
  const cleanedErrors = allErrors.filter(error => error);
  return createDetailsError(cleanedErrors)
}

function validateNewSchemas(schema, newSchemasId) {
  const reqFields = ['updateFrequency'];
  if (newSchemasId && newSchemasId.includes(schema.id)) {
    const isValid = reqFields.flatMap(field => schema[field] && schema[field].toString().length > 0)
      .every(bool => bool === true);
    if (!isValid) {
      const schemaNameVersion = getSchemaNameVersion(schema);
      const newError = new Error(`${getSchemaError(schema)} "\"${reqFields.join(', ')}\" with value \"\" cannot be empty"`);
      newError.details = [{
        "path": [],
        "context": {},
        "message": `"${reqFields.join(', ')}" with value "" cannot be empty`
      }];
      newError.details.map(detail => detail.name = schemaNameVersion);
      return newError;
    }
  }
}

function validateSchema(schema, newSchemasId) {
  const noFieldsToValidate = !schema.fields || !schema.fields.length;
  const structureErrors = schemaModel.validate(schema);
  const newSchemaErrors = validateNewSchemas(schema, newSchemasId);

  if (noFieldsToValidate) {
    return structureErrors ? mergeErrors([structureErrors, newSchemaErrors]) : undefined;
  }

  if(structureErrors || newSchemaErrors) return mergeErrors([structureErrors, newSchemaErrors]);

  const duplicateFieldErrors = validateNoDuplicateFields(schema);
  const idErrors = validateIdAttribute(schema);
  const partitionErrors = validatePartition(schema);
  const deleteIndicatorErrors = validateNumericAttribute(schema, deleteIndicator, ['int', 'long']);
  const extractTimeErrors = validateNumericAttribute(schema, extractTime, ['int', 'long', 'timestamp', 'date']);
  const allErrors = [duplicateFieldErrors, idErrors, partitionErrors, deleteIndicatorErrors, extractTimeErrors].filter(error => error);
  if(allErrors.length) return mergeErrors(allErrors);
}

function getSchemaNameVersion(schema) {
  return `${schema.name}@${schema.version}`;
}

function validateNoDuplicateFields(schema) {
  const names = schema.fields.map(field => field.name);
  const duplicates = checkForDuplicates(names);

  if (duplicates) {
    const name = getSchemaNameVersion(schema);
    const message = `${getSchemaError(schema)} Found duplicate fields: ${duplicates}`;
    const joiError =  createJoiFormattedError(name, message);
    return {
      ...joiError,
      details: {
        ...joiError.details,
        schemaName: schema.name,
        fields: duplicates
      }
    };
  }
}

function checkForDuplicates(nameList) {
  const uniqueNameList = [...new Set(nameList)];
  if (uniqueNameList.length !== nameList.length) {
    const namesListDuplicate = nameList.filter(name => nameList.filter(name2 => name === name2).length > 1);
    return [...new Set(namesListDuplicate)];
  }
}

function validateNoNullablePartitionFields(schema) {
  const partitionNames = schema.partitionedBy;
  const partitionFields = schema.fields.filter(field => partitionNames.includes(field.name));
  return validateNullableFields(schema, partitionFields, partition);
}

function validateIdAttribute(schema) {
  const idFields = getFieldsWithAttribute(schema, id);
  if (idFields.length) return validateNullableFields(schema, idFields, id);
}

function validateNullableFields(schema, fields, name) {
  const nullableFields = fields.filter(field => field.nullable && field.nullable === true);
  if (nullableFields && nullableFields.length) {
    const fieldNames = nullableFields.map(field => field.name);
    const schemaName = getSchemaNameVersion(schema);
    const message = `Cannot have a ${name} with nullable fields. Found nullable fields: ${fieldNames}`;
    return createJoiFormattedError(schemaName, message);
  }
}

function getFieldsWithAttribute(schema, attribute) {
  return schema.fields.filter(field => field.attribute && field.attribute === attribute);
}

function validatePartition(schema) {
  if (schema.partitionedBy.length) {
    const nullableError = validateNoNullablePartitionFields(schema);
    const fieldsExist = validatePartitionFieldsExist(schema);
    const idFieldsInPartition = validatePartitionAnnotationDoesNotContainAllIdFields(schema);
    const allErrors = [nullableError, fieldsExist, idFieldsInPartition].filter(error => error);
    if (allErrors.length) return mergeErrors([nullableError, fieldsExist, idFieldsInPartition]);
  }
}

function validatePartitionAnnotationDoesNotContainAllIdFields(schema) {
  const idFields = getFieldsWithAttribute(schema, id);
  if (!idFields.length) return;
  const ids = idFields.map(id => id.name);
  const partitions = schema.partitionedBy;

  if (ids.every(id => partitions.includes(id))) {
    const name = getSchemaNameVersion(schema);
    const message = `${getSchemaError(schema)} Cannot have a partition containing all id fields`;
    return createJoiFormattedError(name, message);
  }
}

function validatePartitionFieldsExist(schema) {
  const partitionNames = schema.partitionedBy;
  const fieldNames = schema.fields.map(field => field.name);
  const missingFields = partitionNames.filter(name => !fieldNames.includes(name));
  if (missingFields.length) {
    const name = getSchemaNameVersion(schema);
    const message = `${getSchemaError(schema)} Missing fields defined in the partition: ${missingFields}`
    return createJoiFormattedError(name, message);
  }
}

function validateNumericAttribute(schema, attribute, datatype) {
  const fields = schema.fields.filter(field => field.attribute === attribute);
  if (!fields.length) return;

  const name = getSchemaNameVersion(schema);
  const multipleFields = (fields.length > 1) ? createJoiFormattedError(name, `${getSchemaError(schema)} Cannot have multiple fields with ${attribute}`) : undefined;

  let validDatatype = true;
  let datatypeOutput = '';
  if (typeof datatype !== 'string') {
    validDatatype = !datatype.includes(fields[0].datatype);
    datatype.forEach((d, i) => i < datatype.length - 1 ? datatypeOutput += d + ', ' : datatypeOutput += d)
  } else {
    validDatatype = (datatype !== fields[0].datatype);
    datatypeOutput = datatype
  }

  const nonNumericError = validDatatype ? createJoiFormattedError(name, `${getSchemaError(schema)} ${attribute} must be a ${datatypeOutput}`) : undefined;
  const nullableFields = validateNullableFields(schema, fields, attribute);

  const errors = [multipleFields, nonNumericError, nullableFields].filter(error => error);
  if (errors.length) return mergeErrors([multipleFields, nonNumericError, nullableFields]);
}

function getSchemaError(schema) {
  return `Invalid Schema: ${schema.name}@${schema.version}.`
}

function createJoiFormattedError(name, message, fields = []) {
  const error = new Error(message);
  error.details = {message, name, fields};
  return error;
}

const findSchema = (schemas, schema) => schemas.find(({name, version}) => name === schema.name && version === schema.version);
const removedSchemas = (theseSchemas, thoseSchemas) => theseSchemas.filter(schema => !findSchema(thoseSchemas, schema));
const intersect = (theseSchemas, thoseSchemas) => theseSchemas.filter(schema => findSchema(thoseSchemas, schema));
const parseId = schemaId => schemaId.split('--')[0];

function validateNoLinkedSchema(linkedSchemas, schema){
  const id = parseId(schema.id);
  if (linkedSchemas.includes(id)) return linkedSchemaError(schema);
}

function validateNoLinkedSchemas(linkedSchemas, existingSchemas, updatedSchemas) {
  return removedSchemas(existingSchemas, updatedSchemas).map(schema => validateNoLinkedSchema(linkedSchemas, schema))
}

const findSameNamedField = (fields, {name}) => fields.find(field => field.name === name);

function validatePartitionBy(existingSchema, updatedSchema) {
  const existingPartition = existingSchema.partitionedBy;
  const updatePartition = updatedSchema.partitionedBy;

  const hasNoPartition = !existingPartition && !updatePartition;
  if(hasNoPartition) return;

  const removedPartition = existingPartition && !updatePartition;
  const createdPartition = !existingPartition && updatePartition;
  const modifiedPartitionFields = existingPartition.join() !== updatePartition.join();
  if(removedPartition || createdPartition || modifiedPartitionFields) return partitionedByError;
}

const validateNoFieldsAddedOrRemoved = (existingFields, updateFields) => {
  const noFields = !existingFields && !updateFields;
  if (noFields) return;

  const removedAllFields = existingFields && !updateFields;
  const addedFields = updateFields.length > existingFields.length;
  const modifiedFieldError = (removedAllFields || addedFields) ? fieldAddOrRemoveFieldError : undefined;
  const sameNameFields = updateFields.filter(field => findSameNamedField(existingFields, field));
  const sameNameFieldsError = (sameNameFields.length !== existingFields.length) ? fieldAddOrRemoveFieldError : undefined;
  return [modifiedFieldError, sameNameFieldsError].filter( error => error);
};

const isModifiedField = (fields, {name, attribute, datatype, nullable}) =>
  !fields.find(field => field.name === name && field.attribute === attribute && field.datatype === datatype && field.nullable === nullable);

const validateNoFieldsModified = (existingFields, updateFields) => {
  const modifiedErrors = updateFields.filter(field => isModifiedField(existingFields, field));
  if(modifiedErrors.length > 0) return modifiedFieldError;
};

const validateFields = (existingFields, updateFields) => {
  const addRemoveFieldErrors = validateNoFieldsAddedOrRemoved(existingFields, updateFields);
  const modifiedError = validateNoFieldsModified(existingFields, updateFields);
  return [ ...addRemoveFieldErrors, modifiedError];
};


function validateUpdatedSchemaFields(existingSchemas, updatedSchema) {
  const existingSchema = findSchema(existingSchemas, updatedSchema);
  const partitionError = validatePartitionBy(existingSchema, updatedSchema);
  const fieldErrors = validateFields(existingSchema.fields, updatedSchema.fields);
  return [ ...fieldErrors, partitionError];
}

function validateSchemasFields(existingSchemas, updatedSchemas) {
  const schemaErrors = intersect(updatedSchemas, existingSchemas).map(updatedSchema => validateUpdatedSchemaFields(existingSchemas, updatedSchema));
  return [].concat(...schemaErrors);
}

function validateUpdatedSchemas(linkedSchemas, existingSchemas, updatedSchemas) {
  const noSchemas = !existingSchemas && !updatedSchemas;
  if (noSchemas) return;
  const linkedSchemaErrors = validateNoLinkedSchemas(linkedSchemas, existingSchemas, updatedSchemas);
  const fieldErrors = validateSchemasFields(existingSchemas, updatedSchemas);
  const allErrors = fieldErrors.concat(linkedSchemaErrors).filter(error => error);
  if (allErrors.length) return createDetailsError(allErrors);
}

function validateDiscoveredSchemas(schemas) {
  return schemas.reduce((acc, schema) => {
    const errors = validateSchemas([schema], [], []);
    if (errors) {
      log.error('Structural errors for ', schema.name,':', errors)
      const error = {
        id: schema.id,
        status: 'Invalid structure.'
      }
      return [...acc, error]
    }
    return acc;
  }, []);
}

module.exports = {
  setLogger,
  deleteIndicator,
  extractTime,
  id,
  none,
  validateSchemas,
  validateUpdatedSchemas,
  validateDiscoveredSchemas
};
