const edlApiHelper = require('../../../src/utilities/edlApiHelper');
const featureToggleService = require('../../../src/services/featureToggleService');
const conf = require('../../../conf');
jest.mock('../../../src/utilities/edlApiHelper');

jest.spyOn(conf, 'getRedisCacheManager').mockResolvedValue({
    get: jest.fn().mockImplementation(() => Promise.resolve(null)),
    set: jest.fn().mockImplementation(() => Promise.resolve('OK'))
  });


describe('lineageService Test Suite', () => {

    const outputList  = {
        "schema_display.consalidated": { "enabled": true },    
    };

    const output  = {
        "enabled": true
    };

    const input  = [
        {
            name: "devl.schema_display.consalidated",
            toggle:  { "enabled": true }
        },
        {    
            name: "prod.schema_display.consalidated",
            toggle: { "enabled": false }
        }
    ];

    it('should get toggles list', async () => {
        edlApiHelper.getFt.mockResolvedValue(input);
        let jsonRes = await featureToggleService.getToggles();
        expect(jsonRes).toEqual(outputList);
    });

    it('should get toggle', async () => {
        edlApiHelper.getFt.mockResolvedValue(input[0]);
        let jsonRes = await featureToggleService.getToggle("devl.schema_display.consalidated");
        expect(jsonRes).toEqual(output);
    });

});