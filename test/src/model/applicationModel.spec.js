const applicationModel = require('../../../src/model/applicationModel');

describe('applicationModel tests' , () => {

    const validApplication = {
        "name": "test-application",
        "businessApplication": "enterprise_data_lake",
        "teamPdl": "Test@JohnDeere.com",
        "subject": "AWS-TEST",
        "chargeUnitDepartment": "",
        "billingSOPId": "" ,
        "assignmentGroup": "AE EDL Support",
        "supportGroup": "AE EDL Support",       
        "businessCriticality": "low" ,    
        "installStatus": "Installed" ,
        "shortDescription": "some test description",
        "comments": ""  
    };
    it('should be a valid application', async() => {
        const actualResponse = await applicationModel.validate(validApplication);
        expect(actualResponse).toBeNull();
    })

    it('should be invalid application', async() => {
        const invalidApplication = {...validApplication}
        delete invalidApplication.name
        
        const error = await applicationModel.validate(invalidApplication);
        expect(error.message).toEqual('child \"name\" fails because [\"name\" is required]')
        expect(error.details[0].name).toEqual('New Application')
    })

    it('application name contains invalid characters', async() => {
        const invalidApplication = {...validApplication};
        invalidApplication['name'] = 'name+with/invalid#characters';

        const error = await applicationModel.validate(invalidApplication);

        expect(error.message).toEqual('child \"name\" fails because [\"name\" with value \"name+with/invalid#characters\" fails to match the cannot contain special characters pattern]');
    })

    it('email contains invalid characters', async() => {
        const invalidApplication = {...validApplication};
        invalidApplication['teamPdl'] = 'abcd';

        const error = await applicationModel.validate(invalidApplication);

        expect(error.message).toEqual('child \"teamPdl\" fails because [\"teamPdl\" with value \"abcd\" fails to match the not a valid email address pattern]');
    })

    it('AD group doesnt starts with AWS/EDG ', async() => {
        const invalidApplication = {...validApplication};
        invalidApplication['subject'] = 'XYZ-TEST';

        const error = await applicationModel.validate(invalidApplication);

        expect(error.message).toEqual('child \"subject\" fails because [\"subject\" with value \"XYZ-TEST\" fails to match the All AD groups must start with AWS or EDG pattern]');
    })
})