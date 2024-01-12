import VisualDiff from 'react-visual-diff';
import DeepDiff from 'deep-diff';

export default class DiffUtils {
  constructor(itemA, itemB, showDiff) {
    this.itemA = itemA;
    this.itemB = itemB;
    this.showDiff = showDiff;
  }

  diffValues(valA, valB) {
    return (
      <VisualDiff
        left={<span>{`${valB}`}</span>}
        right={<span>{`${valA}`}</span>}
        renderChange={({ type, children }) => {
          return <code className={type !== 'added' ? 'code-remove': ''}>{children}</code>
        }}
      />
    )
  }

  displayValue(value) {
    const path = value.split('.');
    const { itemA, itemB, showDiff } = this;
    const valA = path.reduce((acc, b) => acc[b], itemA);
    if (!showDiff) return valA;
    const valB = path.reduce((acc, b) => (acc || {})[b], (itemB || {}));
    return this.diffValues(valA, valB);
  }

  didArrayValueChange(field) {
    const { itemA, itemB } = this;
    const valueA = (itemA || {})[field] || [];
    const valueB = (itemB || {})[field] || [];
    return !!DeepDiff.diff(valueB, valueA, (path, key) => {
      return path.includes('fields') && key === 'id'
    });
  }
}
