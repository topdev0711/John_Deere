const logger = require('edl-node-log-wrapper');
const SchemasApproval = require('../../../src/services/SchemaApproval');

const createFields = () => ([{name: 'foo', description: 'anyFieldDescription'}]);
const createProdSchema = () => (
  {
    id: 'some-schema--2',
    description: 'anySchemaDescription',
    fields: createFields(),
    testing: false
  });
const createTestSchema = () => ({ ...createProdSchema(), testing: true});

describe('schemas approval tests', () => {
  describe('require approval', () => {
    it('adds new production schemas', () => {
      const schemaApproval = new SchemasApproval([createProdSchema(), { ...createProdSchema(), id: 'diffId' }], [], logger);
      expect(schemaApproval.requiresApproval()).toEqual(true);
    });

    it('deletes a production schema', () => {
      const schemaApproval = new SchemasApproval([], [createProdSchema()], logger);
      expect(schemaApproval.requiresApproval()).toEqual(true);
    });

    it('changes a schema from test to production', () => {
      const schemaApproval = new SchemasApproval([createTestSchema()], [createProdSchema()], logger);
      expect(schemaApproval.requiresApproval()).toEqual(true);
    });

    it('changes a schema from production to test', () => {
      const schemaApproval = new SchemasApproval([createProdSchema()], [createTestSchema()], logger);
      expect(schemaApproval.requiresApproval()).toEqual(true);
    });

    it('changes an important schema attribute', () => {
      const schemasWithAttributeChanged = [ {...createProdSchema(), requiredField: 'abc' }];
      const latestAvailable = [ {...createProdSchema(), requiredField: 'efg' }]
      const schemaApproval = new SchemasApproval(schemasWithAttributeChanged, latestAvailable, logger);
      expect(schemaApproval.requiresApproval()).toEqual(true);
    });

    it('changes a important field attribute', () => {
      const updatedFields = [{ requiredField: 'abc' }];
      const schemasWithFieldAttributeChanged = [ {...createProdSchema(), fields: updatedFields }];
      const latestFields = [{ requiredField: 'efg' }];
      const latestAvailable = [ {...createProdSchema(), fields: latestFields }];
      const schemaApproval = new SchemasApproval(schemasWithFieldAttributeChanged, latestAvailable, logger);
      expect(schemaApproval.requiresApproval()).toEqual(true);
    });
  });

  describe('automatically approved', () => {
    it('changes dataset ID', () => {
      const datasetWithNewId = { ...createProdSchema(), id: 'some-schema--2'};
      const schemaApproval = new SchemasApproval([datasetWithNewId], [createProdSchema()], logger);
      expect(schemaApproval.requiresApproval()).toEqual(false);
    });

    it('updates schema description in a production schema', () => {
      const schemaApproval = new SchemasApproval([createTestSchema()], [{...createTestSchema(), description: 'newDesc'}], logger);
      expect(schemaApproval.requiresApproval()).toEqual(false);
    });

    it('updates a field description in a production schema', () => {
      const updatedField = { ...createFields()[0], description: 'newDescription' };
      const updatedFieldDescription = [{ ...createTestSchema(), fields: [updatedField]}];
      const schemaApproval = new SchemasApproval(updatedFieldDescription, [createTestSchema()], logger);
      expect(schemaApproval.requiresApproval()).toEqual(false);
    });

    it('adds a testing schema', () => {
      const schemaApproval = new SchemasApproval([createTestSchema()], [], logger);
      expect(schemaApproval.requiresApproval()).toEqual(false);
    });

    it('deletes a testing schema', () => {
      const schemaApproval = new SchemasApproval([], [createTestSchema()], logger);
      expect(schemaApproval.requiresApproval()).toEqual(false);
    });

    it('updates an important attribute in a testing schema', () => {
      const schemasWithAttributeChanged = [ {...createTestSchema(), requiredField: 'abc' }];
      const latestAvailable = [ {...createTestSchema(), requiredField: 'efg' }]
      const schemaApproval = new SchemasApproval(schemasWithAttributeChanged, latestAvailable, logger);
      expect(schemaApproval.requiresApproval()).toEqual(false);
    });
  });
});
