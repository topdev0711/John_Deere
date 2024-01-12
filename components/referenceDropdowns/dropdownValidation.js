const multiselectSelected = (selected, options) => {
  let selectedVals = [];
  if(typeof(selected) === 'string') selectedVals.push(selected);
  if(typeof(selected) === 'object' && Array.isArray(selected) && selected.length > 0 && !selected[0].name) selectedVals = selected;
  return (selectedVals.length > 0) ? options.filter(options => selectedVals.includes(options.name)) : selected;
}

module.exports = { multiselectSelected };
