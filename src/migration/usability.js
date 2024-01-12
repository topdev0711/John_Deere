const { computeUsability } = require('../services/usabilityService');

const addUsability = dataset => ({ ...dataset, usability: computeUsability(dataset).usability});
const addUsabilities = datasets => datasets.map(addUsability);

module.exports = { addUsabilities };
