const schemaService = require('../../../src/services/schemaValidationService');
const { deleteIndicator, extractTime, id, none } = require('../../../src/services/schemaValidationService');
const { act } = require('react-dom/test-utils');

describe('Schema Validation Service Tests', () => {
  const createFields = () => [createField('mk_alert_defn_local_sk'), createField('index_cnt')];

  function noAnnotationSchema() {
    return {
      testing: false,
      partitionedBy: [],
      name: 'alert.mk_alert_defn_localized_dm',
      fields: createFields(),
      id: '12345',
      documentation: "",
      description: "some description",
      version: '1',
      updateFrequency: 'Weekly'
    }
  }

  function createField(name, attributeName = none, nullable = false, dataTypeName = 'long', scale = 0, precision = 10) {
    let result = {
      attribute: attributeName,
      datatype: dataTypeName,
      description: none,
      id: '78',
      nullable,
      name
    };
    if (dataTypeName == 'decimal') {
      result = {
        ...result,
        scale: scale,
        precision: precision
      }
    }
    return result;
  }

  describe('Schema validations', () => {
    it('should pass validation', () => {
      const result = schemaService.validateSchemas([noAnnotationSchema()], []);
      expect(result).toEqual(undefined);
    });

    it('should pass validation for discovered schemas', () => {
      const result = schemaService.validateDiscoveredSchemas([{ ...noAnnotationSchema(), discovered: 'some time' }]);
      expect(result).toEqual([]);
    });

    it('should use provide the name as <schema>@<version> for failure messages', () => {
      const schema = { ...noAnnotationSchema(), fields: [] };
      const actualErrors = schemaService.validateSchemas([schema], []);
      expect(actualErrors[0].details[0].message).toEqual('"fields" must contain at least 1 items');
    });


    it('should fail to save when fields array is empty', () => {
      const schema = { ...noAnnotationSchema(), fields: [] };
      const actualErrors = schemaService.validateSchemas([schema], []);
      expect(actualErrors[0].details[0].message).toEqual('"fields" must contain at least 1 items');
      expect(actualErrors[0].details[0].name).toEqual('alert.mk_alert_defn_localized_dm@1');
    });

    it('should fail to save when field name contains special chars', () => {
      const schema = { ...noAnnotationSchema(), fields: [createField('foo.bar#$%')] };
      const actualErrors = schemaService.validateSchemas([schema], []);
      expect(actualErrors[0].details[0].message).toEqual('"name" with value "foo.bar#$%" fails to match the cannot contain special characters pattern');
    });

    it('Should fail to save when Schema field is undefined', () => {
      const schema = noAnnotationSchema();
      delete schema.fields;
      const actualErrors = schemaService.validateSchemas([schema], []);
      expect(actualErrors[0].details[0].message).toEqual("\"fields\" is required");
    });

    it('should fail when the field type is not lowercase', () => {
      const schema = { ...noAnnotationSchema(), fields: [createField('someField', none, false, 'LONG')] };
      const actualErrors = schemaService.validateSchemas([schema], []);
      expect(actualErrors[0].details[0].message).toEqual("\"datatype\" must be one of [string, boolean, short, int, long, float, double, bytes, timestamp, date, decimal, byte, interval, array, struct, map, binary, integer]");
    });

    it('should fail when the field type is not valid', () => {
      const schema = { ...noAnnotationSchema(), fields: [createField('someField', none, false, 'someInvalidType')] };
      const actualErrors = schemaService.validateSchemas([schema], []);
      expect(actualErrors[0].details[0].message).toEqual("\"datatype\" must be one of [string, boolean, short, int, long, float, double, bytes, timestamp, date, decimal, byte, interval, array, struct, map, binary, integer]");
    });

    it('should pass when datatype is extract time and attribute is long', () => {
      const schema = { ...noAnnotationSchema(), fields: [createField('datatypeObject', extractTime, false, 'long')] };
      const actualError = schemaService.validateSchemas([schema], []);
      expect(actualError).toEqual(undefined);
    });

    it('should pass when datatype is extract timestamp and attribute is date', () => {
      const schema = { ...noAnnotationSchema(), fields: [createField('datatypeObject', extractTime, false, 'date')] };
      const actualError = schemaService.validateSchemas([schema], []);
      expect(actualError).toEqual(undefined);
    });

    it('should pass when datatype is extract timestamp and attribute is timestamp', () => {
      const schema = { ...noAnnotationSchema(), fields: [createField('datatypeObject', extractTime, false, 'timestamp')] };
      const actualError = schemaService.validateSchemas([schema], []);
      expect(actualError).toEqual(undefined);
    });

    it('should fail when datatype is extract timestamp and attribute is not date timestamp or long', () => {
      const schema = { ...noAnnotationSchema(), fields: [createField('datatypeObject', extractTime, false, 'decimal', 1, 1)] };
      const actualError = schemaService.validateSchemas([schema], []);
      expect(actualError[0].details[0].message).toEqual("Invalid Schema: alert.mk_alert_defn_localized_dm@1. extract time must be a int, long, timestamp, date");
    });

    it('should fail when decimal scale is larger than precision', () => {
      const schema = { ...noAnnotationSchema(), fields: [createField('datatypeObject', none, false, 'decimal', 2, 1)] };
      const actualErrors = schemaService.validateSchemas([schema], []);
      expect(actualErrors[0].details[0].message).toEqual("\"scale\" must be less than or equal to 1");
    });

    it('should validate that datatype is be successful with a valid decimal', () => {
      const schema = { ...noAnnotationSchema(), fields: [createField('datatypeObject', none, false, 'decimal', 0, 1)] };
      const response = schemaService.validateSchemas([schema], []);
      expect(response).toEqual(undefined);
    });

    it('should fail when datatype is decimal and scale is missing', () => {
      const schema = { ...noAnnotationSchema(), fields: [createField('datatypeObject', none, false, 'decimal')] };
      delete schema.fields[0].scale;
      schema.fields[0].precision = 1;
      const actualErrors = schemaService.validateSchemas([schema], []);
      expect(actualErrors[0].details[0].message).toEqual("\"scale\" is required");
    });

    it('should fail when datatype is decimal and scale is less than 0', () => {
      const schema = { ...noAnnotationSchema(), fields: [createField('datatypeObject', none, false, 'decimal', -1, 1)] };
      const actualErrors = schemaService.validateSchemas([schema], []);
      expect(actualErrors[0].details[0].message).toEqual("\"scale\" must be larger than or equal to 0");
    });

    it('should fail when datatype is decimal and precision is less than 1', () => {
      const schema = { ...noAnnotationSchema(), fields: [createField('datatypeObject', none, false, 'decimal', 1, 0)] };
      const actualErrors = schemaService.validateSchemas([schema], []);
      expect(actualErrors[0].details[0].message).toEqual("\"scale\" must be less than or equal to 0");
    });

    it('should fail when datatype is decimal and precision is greater than 38', () => {
      const schema = { ...noAnnotationSchema(), fields: [createField('datatypeObject', none, false, 'decimal', 1, 39)] };
      const actualErrors = schemaService.validateSchemas([schema], []);
      expect(actualErrors[0].details[0].message).toEqual("\"precision\" must be less than or equal to 38");
    });

    it('should fail when datatype is decimal and scale is greater than 38', () => {
      const schema = { ...noAnnotationSchema(), fields: [createField('datatypeObject', none, false, 'decimal', 39, 39)] };
      const actualErrors = schemaService.validateSchemas([schema], []);
      expect(actualErrors[0].details[0].message).toEqual("\"precision\" must be less than or equal to 38");
    });

    it('should fail when datatype is decimal and scale is missing fail when datatype is decimal and precision is missing', () => {
      const schema = { ...noAnnotationSchema(), fields: [createField('datatypeObject', none, false, 'decimal')] };
      delete schema.fields[0].precision;
      schema.fields[0].scale = 1;
      const actualErrors = schemaService.validateSchemas([schema], []);
      expect(actualErrors[0].details[0].message).toEqual("\"scale\" references \"precision\" which is not a number");
    });

    it('should fail when testing attr is invalid', () => {
      const schema = { ...noAnnotationSchema(), fields: [createField('datatypeObject', none, false, 'string')], testing: 'abc'};
      const actualErrors = schemaService.validateSchemas([schema], []);
      expect(actualErrors[0].details[0].message).toEqual("\"testing\" must be a boolean");
    });

    it('should fail to save when schema has duplicate field names', () => {
      const field = createField('mk_alert_defn_local_sk');
      const schema = { ...noAnnotationSchema(), fields: [field, field] };
      const actualErrors = schemaService.validateSchemas([schema], []);
      expect(actualErrors[0].details[0].message).toEqual("Invalid Schema: alert.mk_alert_defn_localized_dm@1. Found duplicate fields: mk_alert_defn_local_sk");
    });

    it('should fail to save when schema name is an empty string', () => {
      const schema = { ...noAnnotationSchema(), name: '' };
      const actualErrors = schemaService.validateSchemas([schema], []);
      expect(actualErrors[0].details[0].message).toEqual("\"name\" is not allowed to be empty");
    });

    it('should fail to save schema when all fields in the id annotation are in the partition annotation', () => {
      const schema = { ...noAnnotationSchema(), fields: [createField('someField', id)], partitionedBy: ['someField'] };
      const actualErrors = schemaService.validateSchemas([schema], []);
      expect(actualErrors[0].details[0].message).toEqual("Invalid Schema: alert.mk_alert_defn_localized_dm@1. Cannot have a partition containing all id fields");
    });

    it('should fail when field has special character in the name', () => {
      const schema = { ...noAnnotationSchema(), fields: [createField('nameWithSpecialChars#!')] };
      const actualErrors = schemaService.validateSchemas([schema], []);
      expect(actualErrors[0].details[0].message).toEqual("\"name\" with value \"nameWithSpecialChars#!\" fails to match the cannot contain special characters pattern");
    });

    it('should fail when partition has nullable fields', () => {
      const fields = [createField('someField'), createField('anotherField', none, true)];
      const partitionedBy = ['someField', 'anotherField'];
      const schema = { ...noAnnotationSchema(), fields, partitionedBy };
      const actualErrors = schemaService.validateSchemas([schema], []);
      expect(actualErrors[0].details[0].message).toEqual("Cannot have a partition with nullable fields. Found nullable fields: anotherField");
    });

    it('should succeed when schema has id and partition annotations that use different fields', () => {
      const fields = [createField('someField', id), createField('anotherField', none)];
      const partitionedBy = ['anotherField'];
      const schema = { ...noAnnotationSchema(), fields, partitionedBy };
      const result = schemaService.validateSchemas([schema], []);
      expect(result).toEqual(undefined);
    });

    it('should succeed when partition has nullable field that is set to false', () => {
      const schema = { ...noAnnotationSchema(), fields: [createField('someField')], partitionedBy: ['someField'] };
      const result = schemaService.validateSchemas([schema], []);
      expect(result).toEqual(undefined);
    });

    it('should fail when composite id contains a nullable field', () => {
      const schema = { ...noAnnotationSchema(), fields: [createField('someField', id, true)] };
      const actualErrors = schemaService.validateSchemas([schema], []);
      expect(actualErrors[0].details[0].message).toEqual("Cannot have a id with nullable fields. Found nullable fields: someField");
    });

    it('should fail when field in partition annotation does not exist', () => {
      const schema = { ...noAnnotationSchema(), partitionedBy: ['someNonExistantField']};
      const actualErrors = schemaService.validateSchemas([schema], []);
      expect(actualErrors[0].details[0].message).toEqual("Invalid Schema: alert.mk_alert_defn_localized_dm@1. Missing fields defined in the partition: someNonExistantField");
    });

    it('should fail when delete indicator is on more than one field', () => {
      const fields = [ createField('mk_alert_defn_local_sk', deleteIndicator), createField('someOtherField', deleteIndicator) ];
      const schema = { ...noAnnotationSchema(), fields };
      const actualErrors = schemaService.validateSchemas([schema], []);
      console.info(actualErrors[0].details);
      expect(actualErrors[0].details[0].message).toEqual("Invalid Schema: alert.mk_alert_defn_localized_dm@1. Cannot have multiple fields with delete indicator");
    });

    it('should fail when delete indicator is nullable', () => {
      const schema = { ...noAnnotationSchema(), fields: [createField('someField', deleteIndicator, true, 'int')] };
      const actualErrors = schemaService.validateSchemas([schema], []);
      expect(actualErrors[0].details[0].message).toEqual("Cannot have a delete indicator with nullable fields. Found nullable fields: someField");
    });

    it('should fail when delete indicator is not a numeric value', () => {
      const schema = { ...noAnnotationSchema(), fields: [createField('someField', deleteIndicator, false, 'string')] };
      const actualErrors = schemaService.validateSchemas([schema], []);
      expect(actualErrors[0].details[0].message).toEqual("Invalid Schema: alert.mk_alert_defn_localized_dm@1. delete indicator must be a int, long");
    });

    it('should fail when extract timestamp is on more than one field', () => {
      const fields = [ createField('mk_alert_defn_local_sk', extractTime), createField('someOtherField', extractTime) ];
      const schema = { ...noAnnotationSchema(), fields };
      const actualErrors = schemaService.validateSchemas([schema], []);
      expect(actualErrors[0].details[0].message).toEqual("Invalid Schema: alert.mk_alert_defn_localized_dm@1. Cannot have multiple fields with extract time");
    });

    it('should fail when extract timestamp is nullable', () => {
      const schema = { ...noAnnotationSchema(), fields: [createField('someField', extractTime, true)] };
      const actualErrors = schemaService.validateSchemas([schema], []);
      expect(actualErrors[0].details[0].message).toEqual("Cannot have a extract time with nullable fields. Found nullable fields: someField");
    });

    it('should fail when extract timestamp is not a numeric value', () => {
      const schema = { ...noAnnotationSchema(), fields: [createField('someField', extractTime, false, 'string')] };
      const actualErrors = schemaService.validateSchemas([schema], []);
      expect(actualErrors[0].details[0].message).toEqual("Invalid Schema: alert.mk_alert_defn_localized_dm@1. extract time must be a int, long, timestamp, date");
    });

    it('should merge multiple failures into the same error', () => {
      const field = createField('mk_alert_defn_local_sk');
      const fields = [createField('someField', extractTime, false, 'string'), field, field];
      const schema = { ...noAnnotationSchema(), fields };
      const actualErrors = schemaService.validateSchemas([schema], []);
      const errorDetails = actualErrors[0].details.map(detail => detail.message);
      console.info(actualErrors);
      console.info(actualErrors[0].details);
      expect(errorDetails).toContain('Invalid Schema: alert.mk_alert_defn_localized_dm@1. Found duplicate fields: mk_alert_defn_local_sk');
      expect(errorDetails).toContain("Invalid Schema: alert.mk_alert_defn_localized_dm@1. extract time must be a int, long, timestamp, date");
    });

    it('should require a version', () => {
      const schema = noAnnotationSchema();
      delete schema.version;
      const actualErrors = schemaService.validateSchemas([schema], []);
      const errorDetails = actualErrors[0].details.map(detail => detail.message);
      expect(errorDetails).toContain('\"version\" is required');
    });

    it('should allow a string version', () => {
      const schema = { ...noAnnotationSchema(), version: '1' };
      const result = schemaService.validateSchemas([schema], []);
      expect(result).toEqual(undefined)
    });

    it('should not allow a version that is not a number or string', () => {
      const schema = { ...noAnnotationSchema(), version: {id: 1} };
      const actualErrors = schemaService.validateSchemas([schema], []);
      const errorDetails = actualErrors[0].details.map(detail => detail.message);
      expect(errorDetails).toContain('\"version\" must be a string');
    });

    it('should not allow a string version with multiple sequential periods', () => {
      const schema = noAnnotationSchema();
      schema.version = '1..0';
      const actualErrors = schemaService.validateSchemas([schema], []);
      const errorDetails = actualErrors[0].details.map(detail => detail.message);
      expect(errorDetails).toContain("\"version\" with value \"1..0\" fails to match the number or semver #.#.# pattern");
    });

    it('should not allow a string version with characters', () => {
      const schema = { ...noAnnotationSchema(), version: 'a.b.c' };
      const actualErrors = schemaService.validateSchemas([schema], []);
      const errorDetails = actualErrors[0].details.map(detail => detail.message);
      expect(errorDetails).toContain("\"version\" with value \"a.b.c\" fails to match the number or semver #.#.# pattern");
    });

    it('should not allow a string version with with to many repeating subversions', () => {
      const schema = { ...noAnnotationSchema(), version: '1.2.3.4' };
      const actualErrors = schemaService.validateSchemas([schema], []);
      const errorDetails = actualErrors[0].details.map(detail => detail.message);
      expect(errorDetails).toContain("\"version\" with value \"1.2.3.4\" fails to match the number or semver #.#.# pattern");
    });

    it('should allow a version with semver format', () => {
      const schema = { ...noAnnotationSchema(), version: '19876312.1234556677.122343498549835' };
      const result = schemaService.validateSchemas([schema], []);
      expect(result).toEqual(undefined)
    });

    it('should throw an error when there are linked schemas ids are in list of schemas', () => {
      const schema = noAnnotationSchema();
      const actualErrors = schemaService.validateSchemas([schema], ['12345']);
      expect(actualErrors[0].details[0].message).toEqual('Invalid linkedSchemas: 12345 cannot have linkedSchema ID in schemas list');
    });

    it('should throw an error when there are schemas with duplicate name and version', () => {
      const schema = noAnnotationSchema();
      const actualErrors = schemaService.validateSchemas([schema, { ...schema, id: 'differentId'}], []);
      expect(actualErrors[0].details[0].message).toEqual('schemas cannot have the same name and version');
    });

    it('should throw an error when there are schemas with duplicate ids', () => {
      const schema = noAnnotationSchema();
      const actualErrors = schemaService.validateSchemas([schema, schema], []);
      expect(actualErrors[0].details[0].message).toEqual('schemas cannot contain duplicates');
    });

    it('should throw an error when there are linkedSchemas with duplicate ids', () => {
      const schema = noAnnotationSchema();
      const actualErrors = schemaService.validateSchemas([schema], ['1234--1', '1234--1']);
      console.info('actual errors: ', actualErrors);
      expect(actualErrors[0].details[0].message).toEqual('linkedSchemas cannot contain duplicates');
    });

    it('should throw an error when there are linked schemas with duplicate ids', () => {
      const schema = noAnnotationSchema();
      const actualErrors = schemaService.validateSchemas([schema], ['someId', 'someId']);
      expect(actualErrors[0].details[0].message).toEqual('linkedSchemas cannot contain duplicates');
    });
  });

  describe('Schema update validations', () => {
    it('should be valid to not have any schemas', () => {
      const actualResponse = schemaService.validateUpdatedSchemas([], [], []);
      return expect(actualResponse).toEqual(undefined);
    });

    it('should be successful when a schema is removed and there are no linkedSchemas using it', () => {
      const existingSchemas = [noAnnotationSchema()];
      const actualResponse = schemaService.validateUpdatedSchemas([], existingSchemas, []);
      expect(actualResponse).toEqual(undefined)
    });

    it('should throw an error when attempting to remove a schema that has a linked schema associated with it', () => {
      const schema1 = noAnnotationSchema();
      const schema2 = {...noAnnotationSchema(), version: 2};
      const existingSchemas = [schema1, schema2];
      const updateSchemas = [schema1];
      const actualErrors = schemaService.validateUpdatedSchemas(['12345'], existingSchemas, updateSchemas);
      expect(actualErrors.details[0].message).toEqual('Cannot remove schema: alert.mk_alert_defn_localized_dm because it is still linked in other datasets');
    });

    it('should throw error when removing a field to an existing schema', () => {
      const existingSchemas = [noAnnotationSchema()];
      const updateSchemas = [{...noAnnotationSchema(), fields: [createField('mk_alert_defn_local_sk')]}];
      const actualErrors = schemaService.validateUpdatedSchemas([], existingSchemas, updateSchemas);
      expect(actualErrors.details[0].message).toEqual('Cannot add or remove a field from an existing schema');
    });

    it('should throw error when adding a field to an existing schema', () => {
      const existingSchemas = [{...noAnnotationSchema(), fields: [createField('mk_alert_defn_local_sk')]}];
      const updateSchemas = [noAnnotationSchema()];
      const actualErrors = schemaService.validateUpdatedSchemas([], existingSchemas, updateSchemas);
      expect(actualErrors.details[0].message).toEqual('Cannot add or remove a field from an existing schema');
    });

    it('should throw an error when a field name is modified', () => {
      const fields = [createField('anyName')];
      const existingSchemas = [{...noAnnotationSchema(), fields}];
      const updateSchemas = [{...noAnnotationSchema(), fields: [createField('someOtherName')]}];
      const actualErrors = schemaService.validateUpdatedSchemas([], existingSchemas, updateSchemas);
      expect(actualErrors.details[0].message).toEqual('Cannot add or remove a field from an existing schema');
    });

    it('should throw an error when a field attribute is modified', () => {
      const field = createField('anyName');
      const existingSchemas = [{...noAnnotationSchema(), fields: [field]}];
      const updateSchemas = [{...noAnnotationSchema(), fields: [{...field, attribute: 'someAttribute'}]}];
      const actualErrors = schemaService.validateUpdatedSchemas([], existingSchemas, updateSchemas);
      expect(actualErrors.details[0].message).toEqual('Cannot modify a field in an existing schema, other than description or documentation');
    });

    it('should throw an error when a field datatype is modified', () => {
      const field = createField('anyName');
      const existingSchemas = [{...noAnnotationSchema(), fields: [field]}];
      const updateSchemas = [{...noAnnotationSchema(), fields: [{...field, datatype: 'someDatatype'}]}];
      const actualErrors = schemaService.validateUpdatedSchemas([], existingSchemas, updateSchemas);
      expect(actualErrors.details[0].message).toEqual('Cannot modify a field in an existing schema, other than description or documentation');
    });

    it('should throw an error when a field nullable is modified', () => {
      const field = createField('anyName');
      const existingSchemas = [{...noAnnotationSchema(), fields: [field]}];
      const updateSchemas = [{...noAnnotationSchema(), fields: [{...field, nullable: 'someNullable'}]}];
      const actualErrors = schemaService.validateUpdatedSchemas([], existingSchemas, updateSchemas);
      expect(actualErrors.details[0].message).toEqual('Cannot modify a field in an existing schema, other than description or documentation');
    });

    it('should be valid when a fields documentation is changed', () => {
      const field = createField('anyName');
      const existingSchemas = [{...noAnnotationSchema(), fields: [field]}];
      const updateSchemas = [{...noAnnotationSchema(), fields: [{...field, documentation: 'someDocumentation'}]}];
      const actualResponse = schemaService.validateUpdatedSchemas([], existingSchemas, updateSchemas);
      return expect(actualResponse).toEqual(undefined);
    });

    it('should return valid when partition is there is no partition for the existing', () => {
      const existingSchemas = [{...noAnnotationSchema()}];
      const updateSchemas = [{...noAnnotationSchema(), partitionedBy: ['a']}];
      const actualErrors = schemaService.validateUpdatedSchemas([], existingSchemas, updateSchemas);
      expect(actualErrors.details[0].message).toEqual('Cannot modify schema attribute partitionedBy');
    });

    it('should return valid when partition is there is no partition for the update', () => {
      const existingSchemas = [{...noAnnotationSchema(), partitionedBy: ['a']}];
      const updateSchemas = [{...noAnnotationSchema()}];
      const actualErrors = schemaService.validateUpdatedSchemas([], existingSchemas, updateSchemas);
      expect(actualErrors.details[0].message).toEqual('Cannot modify schema attribute partitionedBy');
    });

    it('should return valid when partition is unchanged', () => {
      const existingSchemas = [{...noAnnotationSchema(), partitionedBy: ['a', 'b']}];
      const actualResponse = schemaService.validateUpdatedSchemas([], existingSchemas, existingSchemas);
      expect(actualResponse).toEqual(undefined);
    });

    it('should throw an error when a partition values is removed', () => {
      const existingSchemas = [{...noAnnotationSchema(), partitionedBy: ['a', 'b']}];
      const updateSchemas = [{...noAnnotationSchema(), partitionedBy: ['a']}];
      const actualErrors = schemaService.validateUpdatedSchemas([], existingSchemas, updateSchemas);
      expect(actualErrors.details[0].message).toEqual('Cannot modify schema attribute partitionedBy');
    });

    it('should throw an error when a partition values is added', () => {
      const existingSchemas = [{...noAnnotationSchema(), partitionedBy: ['a']}];
      const updateSchemas = [{...noAnnotationSchema(), partitionedBy: ['a', 'b']}];
      const actualErrors = schemaService.validateUpdatedSchemas([], existingSchemas, updateSchemas);
      expect(actualErrors.details[0].message).toEqual('Cannot modify schema attribute partitionedBy');
    });

    it('should return multi part response for discovered schemas', () => {
      const schema = { ...noAnnotationSchema(), fields: [] };
      const actualErrors = schemaService.validateDiscoveredSchemas([schema], []);
      expect(actualErrors).toEqual([{id: schema.id, status: 'Invalid structure.'}]);
    });
  });
});
