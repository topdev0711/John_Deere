import React from 'react';
import enableHooks from 'jest-react-hooks-shallow';
import { shallow } from 'enzyme';
import {getFullSchemaInfoData} from '../../../../apis/schemas';
import EnhancedSchemasDiff from '../../../../components/datasets/details/EnhancedSchemasDiff';
import SmallSpinner from '../../../../components/SmallSpinner';

enableHooks(jest);

jest.mock('../../../../apis/schemas');

describe('EnhancedSchemasDiff tests', () => {
  const detailedSchema = {id: 'anySchema', name: 'anyName'};

  beforeEach(() => getFullSchemaInfoData.mockResolvedValue(detailedSchema));

  it('should have spinner while loading data', () => {
    const enhancedSchemasDiff = shallow(<EnhancedSchemasDiff />);
    expect(enhancedSchemasDiff.exists(SmallSpinner)).toEqual(true);
  });

  it('should be unmodified schema', async () => {
  });

  it('should be added schema', () => {

  });

  it('should be removed schema', () => {

  });

  it('should be modified schema', () => {

  });

  it('should use default values for details fields when none provided', () => {

  });

  it('should use previous versions environment name on an added schema', () => {

  });

  it('should not have an environment name if it is the first version of the schema', () => {

  });
});
