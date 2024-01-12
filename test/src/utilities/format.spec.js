const format = require('../../../src/utilities/format')

describe('Format test suite', () => {
  it('should format joi errors into an ordered list', () => {
    const joiError = {
      details: [
        {
          name: 'joi error',
          message: 'some error'
        }
      ]
    }
    const output = format.formatValidationErrors(joiError)
    expect(output).toEqual('<ol><li key={0}>joi error some error</li></ol>')
  })

  it('should ignore non-Joi (or similarly structured) errors', () => {
    const nonJoiError = {
      message: 'some non joi error'
    }
    const output = format.formatValidationErrors(nonJoiError)
    expect(output).toEqual(nonJoiError.message)
  })
})