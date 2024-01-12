import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import DiffUtils from '../../components/DiffUtils';

configure({ adapter: new Adapter() });

describe('DiffUtils test suite', () => {
  it('should detect changes on array', () => {
    const itemA = {entitlements: [1,2,3,4]}
    const itemB = {entitlements: [1,2,3,4,5]}
    const diff = new DiffUtils(itemA, itemB)
    const result = diff.didArrayValueChange('entitlements')
    expect(result).toEqual(true);
  })

  it('should detect no changes on array', () => {
    const itemA = {entitlements: [1,2,3,4]}
    const itemB = {entitlements: [1,2,3,4]}
    const diff = new DiffUtils(itemA, itemB)
    const result = diff.didArrayValueChange('entitlements')
    expect(result).toEqual(false);
  })

  it('should handle null items', () => {
    const diff = new DiffUtils(null, null)
    const result = diff.didArrayValueChange('entitlements')
    expect(result).toEqual(false);
  })

  it('should detect no changes on array even when key is missing', () => {
    const itemA = {entitlements: [1,2,3,4]}
    const itemB = {entitlements: [1,2,3,4]}
    const diff = new DiffUtils(itemA, itemB)
    const result = diff.didArrayValueChange('foo')
    expect(result).toEqual(false);
  })

  it('should use Visual Diff to display result', () => {
    const itemA = { foo: 'bar' }
    const itemB = { foo: 'baz' }
    const diff = new DiffUtils(itemA, itemB, true)
    const result = diff.displayValue('foo')
    const leftValue = result.props.left.props.children
    const rightValue = result.props.right.props.children
    expect(leftValue).toEqual('baz')
    expect(rightValue).toEqual('bar')
  })

  it('should handle when itemB is null', () => {
    const itemA = { foo: 'bar' }
    const diff = new DiffUtils(itemA, null, true)
    const result = diff.displayValue('foo')
    const leftValue = result.props.left.props.children
    const rightValue = result.props.right.props.children
    expect(leftValue).toEqual('undefined')
    expect(rightValue).toEqual('bar')
  })

  it('should handle when nested key in itemB is null', () => {
    const itemA = { key: { key2: { foo: 'bar' } } }
    const itemB = { key: { key2: {} } }
    const diff = new DiffUtils(itemA, itemB, true)
    const result = diff.displayValue('key.key2.foo')
    const leftValue = result.props.left.props.children
    const rightValue = result.props.right.props.children
    expect(leftValue).toEqual('undefined')
    expect(rightValue).toEqual('bar')
  })

  it('should handle nested keys and use Visual Diff to display result', () => {
    const itemA = { key: { foo: 'bar' } }
    const itemB = { key: { foo: 'baz' } }
    const diff = new DiffUtils(itemA, itemB, true)
    const result = diff.displayValue('key.foo')
    const leftValue = result.props.left.props.children
    const rightValue = result.props.right.props.children
    expect(leftValue).toEqual('baz')
    expect(rightValue).toEqual('bar')
  })

  it('should handle when key doesnt exist in itemB and use Visual Diff to display result', () => {
    const itemA = { key: { foo: 'bar' } }
    const itemB = { key: { other: 'baz' } }
    const diff = new DiffUtils(itemA, itemB, true)
    const result = diff.displayValue('key.foo')
    const leftValue = result.props.left.props.children
    const rightValue = result.props.right.props.children
    expect(leftValue).toEqual('undefined')
    expect(rightValue).toEqual('bar')
  })

  it('should not use Visual Diff to display result when showing diff is disabled', () => {
    const itemA = { foo: 'bar' }
    const itemB = { foo: 'baz' }
    const diff = new DiffUtils(itemA, itemB, false)
    const result = diff.displayValue('foo')
    expect(result).toEqual('bar')
  })
})
