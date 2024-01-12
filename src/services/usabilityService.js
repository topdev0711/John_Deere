const usabilityDimensions = [
    {
        name: "description",
        lengthCriteria: 25
    },
    {
        name: "documentation",
        lengthCriteria: 50
    }
];

const passesUsabilityMetric = (fieldValue, criteria) => fieldValue.length > criteria;
const maxUsability = 10;

function calculateUsabilityScore(dimensions) {
    const passedDimensions = dimensions.filter(d => d.passesCriteria).length;
    const totalDimensions = dimensions.length;
    return (maxUsability * passedDimensions) / totalDimensions;
}

function computeUsability(usabilityRequest) {
    const dimensions = usabilityDimensions.map(({name, lengthCriteria}) => {
        const dimensionValue = usabilityRequest[name] ? usabilityRequest[name] : '';
        const passesCriteria = passesUsabilityMetric(dimensionValue, lengthCriteria)
        return { field: name, passesCriteria };
    });
    const usability = calculateUsabilityScore(dimensions);
    return { usability, dimensions };
}

const addUsability = dataset => ({ ...dataset, usability: computeUsability(dataset).usability});
const addUsabilities = datasets => datasets.map(addUsability);

module.exports = {computeUsability, addUsabilities};
