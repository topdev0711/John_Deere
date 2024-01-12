const { diff } = require('deep-object-diff');

class SchemasApproval {
  constructor(schemas, latestAvailableSchemas, log) {
    this.schemas = schemas || [];
    this.latestAvailableSchemas = latestAvailableSchemas || [];
    this.log = log;
  }

  logMessage = message => this.log.info(`${message}, requires approval`);

  getId = record => record.id.split('--')[0];

  hasAddedSchemas = () => {
    const latestIds = (this.latestAvailableSchemas || []).map(this.getId);
    const isNewSchema = schema => !latestIds.includes(this.getId(schema));

    const addedSchemaIds = (this.schemas || []).filter(isNewSchema);
    if(addedSchemaIds.length) this.logMessage(`production schemas ${addedSchemaIds} added`);
    return !!addedSchemaIds.length;
  }

  hasAddedProductionSchemas = () => {
    const latestIds = (this.latestAvailableSchemas || []).map(this.getId);
    const isNewProductionSchema = (schema) => !schema.testing && !latestIds.includes(this.getId(schema));
    const addedSchemaIds = (this.schemas || []).filter(isNewProductionSchema);

    if(addedSchemaIds.length) this.logMessage(`production schemas ${addedSchemaIds} added`);
    return !!addedSchemaIds.length;
  }

  hasDeletedSchemas = () => {
    const schemaIds = (this.schemas || []).map(this.getId);
    const isDeletedProductionSchema = (schema) => !schemaIds.includes(this.getId(schema));
    const deletedIds = (this.latestAvailableSchemas || []).filter(isDeletedProductionSchema);

    if(deletedIds.length) this.logMessage(`production schemas ${deletedIds} deleted`);
    return !!deletedIds.length;
  }

  hasDeletedProductionSchemas = () => {
    const schemaIds = (this.schemas || []).map(this.getId);
    const isDeletedProductionSchema = (schema) => !schema.testing && !schemaIds.includes(this.getId(schema));
    const deletedIds = (this.latestAvailableSchemas || []).filter(isDeletedProductionSchema);
    if(deletedIds.length) this.logMessage(`production schemas ${deletedIds} deleted`);
    return !!deletedIds.length;
  }

  getAddedOrRemovedSchemaIds = () => {
    const latestIds = (this.latestAvailableSchemas || []).map(this.getId);
    const isNewSchema = schema => !latestIds.includes(this.getId(schema));
    const addedSchemaIds = (this.schemas || []).filter(isNewSchema);

    const schemaIds = (this.schemas || []).map(this.getId);
    const isDeletedProductionSchema = schema => !schemaIds.includes(this.getId(schema));
    const deletedIds = (this.latestAvailableSchemas || []).filter(isDeletedProductionSchema);

    return [ ...addedSchemaIds, ...deletedIds].map(this.getId);
  }

  hasChangedTestingStatus = () => {
    const addedOrRemovedSchemaIds = this.getAddedOrRemovedSchemaIds();
    const isExistingSchema = schema => !addedOrRemovedSchemaIds.includes(schema.id.split('--')[0]);
    const schemaTestFlags = this.schemas.filter(isExistingSchema).map(schema => schema.testing);
    const latestTestFlags = this.latestAvailableSchemas.filter(isExistingSchema).map(schema => schema.testing);
    const changedTestingIndices = Object.keys(diff(latestTestFlags, schemaTestFlags));
    const changedTestingSchemaIds = changedTestingIndices.map(index => this.schemas[parseInt(index)].id);

    if(changedTestingIndices.length) this.logMessage(`changed test status for schemas: ${changedTestingSchemaIds}`);
    return !!changedTestingIndices.length;
  }

  cleanSchema = schema => {
    const  { description, documentation, environmentName, ...schemaWithoutAutoupdateFields } = schema;
    const cleanField = field => {
      const { description, ...restOfField } = field;
      return restOfField;
    }

    const fields = (schemaWithoutAutoupdateFields.fields || []).map(cleanField);
    return { ...schemaWithoutAutoupdateFields, id: schemaWithoutAutoupdateFields.id.split('--')[0], fields };
  }

  hasGeneralSchemaChange = () => {
    const cleanedSchemas = this.schemas.filter(schema => !schema.testing).map(this.cleanSchema);
    const cleanedLatest = this.latestAvailableSchemas.filter(schema => !schema.testing).map(this.cleanSchema);
    const schemaDiff = diff(cleanedLatest, cleanedSchemas);
    const changedSchemaIndices = Object.keys(schemaDiff);

    if (changedSchemaIndices.length) {
      changedSchemaIndices.forEach((schemaIndex, changeIndex) => {
        const schemaId = this.schemas[parseInt(schemaIndex)].id;
        const changedFields = Object.keys(schemaDiff[changeIndex]);
        this.logMessage(`schema ${schemaId} changed fields: ${changedFields}`)
      });
    }

    return !!changedSchemaIndices.length;
  }

  // Note Order matters, like firewall rules it goes from specific to more general
  requiresApproval = () => {
    return this.hasAddedProductionSchemas() ||
      this.hasDeletedProductionSchemas() ||
      this.hasChangedTestingStatus() ||
      this.hasGeneralSchemaChange();
  }
}

module.exports = SchemasApproval;
