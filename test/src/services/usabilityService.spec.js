const usabilityService = require('../../../src/services/usabilityService');

describe('UsabilityService Test Suite', () => {
    const usabilityParams =
            {
                "description": "Amazon DynamoDB is a key-value and document database",
                "documentation": "Amazon DynamoDB is a fully managed proprietary NoSQL database service that supports key–value and document data structures and is offered by Amazon.com as part of the Amazon Web Services portfolio."
    };
    const actualUsabilityResults =
    {
        "usability": 10,
        "dimensions": [
            {
                "field": "description",
                "passesCriteria": true
            },
            {
                "field": "documentation",
                "passesCriteria": true
            }
            ]
    }
    const failedUsabilityResults =
    {
        "usability": 5,
        "dimensions": [
            {
                "field": "description",
                "passesCriteria": false
            },
            {
                "field": "documentation",
                "passesCriteria": true
            }
            ]
    }

    it('should return a valid object based on the input', async () => {
        const computeUsabilityResults = await usabilityService.computeUsability(usabilityParams);
        expect(computeUsabilityResults).toEqual(actualUsabilityResults);
        expect(computeUsabilityResults).not.toEqual(failedUsabilityResults);
    });
});
