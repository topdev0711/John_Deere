const datasetModel = require('../model/datasetModel');
const schemaDao = require('../data/schemaDao');
const schemaValidationService = require('./schemaValidationService');
const tableNameValidationService = require('./tableNameValidationService');
const versionService = require('./versionService');
const edlApiHelper = require('../utilities/edlApiHelper');
const { getToggle } = require("./featureToggleService");
let log = require('edl-node-log-wrapper');
const conf = require("../../conf");
const env = conf.getEnv();
const phases = require('../data/reference/phases.json')

const setLogger = logger => {
  log = logger;
  schemaDao.setLogger(logger);
  schemaValidationService.setLogger(logger);
  tableNameValidationService.setLogger(logger);
  versionService.setLogger(logger);
};

function getModelErrors(dataset, validateModel) {
  const error = validateModel(dataset);
  if (error) {
    error.details.map(detail => detail.name = dataset.name ? dataset.name : 'New Dataset');
    return error;
  }
}

function getSchemaErrors({ schemas, linkedSchemas }) {
  const hasSchemas = schemas && schemas.length;
  if (hasSchemas) return schemaValidationService.validateSchemas(schemas, linkedSchemas ? linkedSchemas : []);
}

function getAvailableSchemaIds(datasets) {
  return datasets.filter(({ schemas }) => schemas).map(({ schemas }) => schemas).reduce((total, schemas) => total.concat(schemas), []).map(schema => schema.id);
}

function getInvalidLinkedSchemas(dataset, availableDatasets) {
  const availableSchemaIds = getAvailableSchemaIds(availableDatasets);
  return dataset.linkedSchemas.filter(linkedSchema => !availableSchemaIds.includes(linkedSchema.id));
}

function validateLinkedSchemasIds(dataset, availableDatasets) {
  if (dataset.linkedSchemas) {
    const invalidSchemaIds = getInvalidLinkedSchemas(dataset, availableDatasets);
    if (invalidSchemaIds.length) return createDetailsError(`Invalid linkedSchemas: ${invalidSchemaIds} do not exist`);
  }
}

function createDetailsError(message) {
  const error = new Error(message);
  error.details = [{ message }];
  return error;
}

function handleErrors(errors = []) {
  if (errors.length) {
    const mergedErrors = new Error('Dataset Errors');
    mergedErrors.details = errors.map(error => error.details).reduce((total, details) => total.concat(details), []);
    log.error(mergedErrors);
    throw mergedErrors;
  }
}

function validateUniqueNameAndPhase(dataset, availableDatasets) {
  if (dataset.id || !dataset.name || !dataset.phase) return;

  const sameNameInPhase = availableDatasets.find(availableDataset => availableDataset.phase.id === dataset.phase && availableDataset.name === dataset.name);

  if (sameNameInPhase) {
    const message = `Another dataset with id: ${sameNameInPhase.id} already exists with the same name and phase`;
    return createDetailsError(message);
  }
}

function getGicpErrors(dataset) {
  let publicGicpErrors = [];
  dataset.classifications?.forEach(classification => {
    if (classification.gicp === "10710b7a-7391-4860-a18d-1d7edc746fe7" && classification.personalInformation) {
      publicGicpErrors.push(createDetailsError(`classification with id ${classification.id} with public gicp has personal information flag as true which is not permitted as per GICP policy`));
    }
  });
  return publicGicpErrors;
}

const getToggleValue = async (toggleName) => {
  try {
    const toggleValue = await getToggle(toggleName);
    return toggleValue.enabled;
  } catch {
    log.error(`getToggle failed to retrieve the toggle ${toggleName}`);
    return false;
  }
}
async function getApplicationErrors(dataset) {
  let isBusinessApplicationEnabled = await getToggleValue("jdc.business_application_enabled")
  if (env !== 'local' && isBusinessApplicationEnabled && (!dataset?.application || dataset?.application === '')) {
    const message = `Application must be defined.`;
    return createDetailsError(message);
  }
}

function createSchemaQuery(schema, phase) {
  const filteredPhase = phases?.filter(ph => ph?.id === phase)
  if (!!schema && filteredPhase?.length > 0) {
    const schemaPhase = `com.deere.enterprise.datalake.${filteredPhase[0]?.name?.toLowerCase()}`;
    return {
      "bool": {
        "must": [
          {"match_phrase": {"name": schema?.name}},
          {"match_phrase": {"namespace": schemaPhase}},
          {"match_phrase": {"version": schema?.version}}
        ]
      }
    }
  }
  return {}
}

async function getEDLSchemasByName(queries) {
  const edlSchemaQuery = {
    "index": "schemas3",
    "query": {
      "bool": {
        "must": [
          {
            "bool": {
              "should":
                queries
            }
          }
        ]
      }
    },
    "_source": ["jdCatalogId", "version", "name", "namespace"],
    "size": 10000
  };
  return await edlApiHelper.getEDLMetadata('', '', edlSchemaQuery);
}

async function validateIncomingDataset(schemas, phase) {
  if (!!schemas && !!schemas?.length && !!phase) {
    const schemaQueries = schemas.map(schema => createSchemaQuery(schema, phase));
    const edlSchemas = await getEDLSchemasByName(schemaQueries)
    let errors = schemas.map(schema => {
      const matchingEdlSchemas = edlSchemas?.filter(edlSchema => ((edlSchema?.name?.toLowerCase() === schema?.name?.toLowerCase()) && (edlSchema?.version === schema?.version)));
      if (!!matchingEdlSchemas && matchingEdlSchemas?.length >= 1) {
        return `schema name (${schema?.name}) version (${schema?.version})`;
      }
    }).filter(err => !!err)

    if (errors?.length > 0) {
      throw createDetailsError(`Duplicate schema found in EDL for ${errors.join(", ")}`);
    }
  }
}

function differenceBy(incomingSchemas, existingSchemas, key) {
  return incomingSchemas?.filter(a =>
      !existingSchemas?.some(b =>
          a[key].split('--')[0] === b[key].split('--')[0]
      )
  );
}

async function checkNonDeletedDatasets(dataset, nonDeletedDatasets) {
  if (!!dataset) {
    let mapOfNonDeletedDatasets = new Map(nonDeletedDatasets?.map(obj => [obj.id, obj]))
    const {schemas, phase} = dataset;
    let comparedDataSetSchema = []
    if (!!dataset?.id && mapOfNonDeletedDatasets.has(dataset?.id) && !!schemas?.length) {
      const foundDataset = mapOfNonDeletedDatasets.get(dataset?.id);
      if (foundDataset) {
        let differences = differenceBy(schemas, foundDataset?.schemas, 'id');
        await validateIncomingDataset(differences, phase);
      }
    } else {
      if (schemas) {
        comparedDataSetSchema.push(...schemas)
        await validateIncomingDataset(comparedDataSetSchema, phase)
      }
    }
  }
}


async function validate(dataset, availableDatasets, nonDeletedDatasets, validateModel = datasetModel.validateAllFields) {
  const modelErrors = getModelErrors(dataset, validateModel);
  const schemaErrors = getSchemaErrors(dataset) || [];
  const gicpErrors = getGicpErrors(dataset);
  const applicationErrors = await getApplicationErrors(dataset);
  const validateLinkedSchema = validateLinkedSchemasIds(dataset, availableDatasets);
  const namePhaseError = validateUniqueNameAndPhase(dataset, availableDatasets);
  const tableNameError = dataset.tables ? await tableNameValidationService.validateTables(dataset, nonDeletedDatasets) : undefined;
  const duplicateSchemaError = await checkNonDeletedDatasets(dataset, nonDeletedDatasets)
  const allErrors = [modelErrors, ...schemaErrors, validateLinkedSchema, namePhaseError, tableNameError, ...gicpErrors, applicationErrors, duplicateSchemaError].filter(error => error);
  handleErrors(allErrors);
}

function validateNew(dataset, availableDatasets, nonDeletedDatasets) {
  return validate(dataset, availableDatasets, nonDeletedDatasets);
}

function validateUpdateDataset(updatedDataset, existingDataset) {
  if (updatedDataset.phase !== existingDataset.phase) throw createDetailsError("Cannot change dataset phase");
}

async function getExistingSchemas(allVersions) {
  const latestAvailable = versionService.getLatestAvailableVersion(allVersions);
  const latestReferencedSchemas = latestAvailable ? (latestAvailable.schemas || []) : [];
  const latestReferencedSchemasId = latestReferencedSchemas.map(schema => schema.id);
  return schemaDao.getSchemas(latestReferencedSchemasId);
}

function getExistingLinkedSchemas(datasets) {
  const getLinkedSchemas = dataset => dataset.linkedSchemas;
  const mergeArrays = (mergedArray, array) => [...mergedArray, ...array];
  const parseSchemaBaseId = schema => schema.id.split('--')[0];
  return datasets.filter(getLinkedSchemas).map(getLinkedSchemas).reduce(mergeArrays, []).map(parseSchemaBaseId);
}

async function validateSchemasFromAllVersions(datasets, allVersions, updatedDataset) {
  const existingLinkedSchemas = getExistingLinkedSchemas(datasets);
  const existingSchemas = await getExistingSchemas(allVersions);
  const schemaErrors = schemaValidationService.validateUpdatedSchemas(existingLinkedSchemas, existingSchemas, updatedDataset.schemas);
  if (schemaErrors) throw schemaErrors;
}

async function validateUpdate(dataset, availableDatasets, nonDeletedDatasets, allVersions, existingDataset, username) {
  versionService.allowedToUpdate(allVersions, dataset, username, 'Dataset');
  if (dataset.phase) validateUpdateDataset(dataset, existingDataset);
  await validateSchemasFromAllVersions(availableDatasets, allVersions, dataset);
  return validate(dataset, availableDatasets, nonDeletedDatasets);
}

function validateLockDataset(dataset, version) {
  if (version !== dataset.version) throw new Error(`You can only lock the most recent non-deleted dataset version. The latest version is ${dataset.version}.`);
  if (dataset.status !== 'AVAILABLE') throw new Error('Only available datasets are lockable.');
  if (!!dataset.lockedBy) throw new Error(`Cannot lock a dataset that is already locked. Locked by ${dataset.lockedBy}.`);
}

function validateSchemas(schemas, linkedSchemas) {
  return schemaValidationService.validateSchemas(schemas, linkedSchemas);
}

module.exports = {
  setLogger,
  validateNew,
  validateIncomingDataset,
  checkNonDeletedDatasets,
  validateUpdate,
  validateSchemas,
  validateLockDataset
}
