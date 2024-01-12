import {getEditButton} from '../../../../components/datasets/details/EditDatasetButton';
import utils from '../../../../components/utils';

jest.mock('../../../../components/utils');

describe('EditButton tests', () => {
  const anyDataset = {
    status: 'AVAILABLE',
    classifications: [
      {
        "id": "11a8f13e-6b26-43e9-abd7-ff02c0bc989e",
        "community": {
          "id": "41f48207-a2ac-4be9-9db9-32f270bd8324",
          "name": "Customer"
        },
        "subCommunity": {
          "id": "fac279ab-4f3d-4c70-a699-d77e5d179913",
          "name": "Customer Identity"
        },
        "gicp": {
          "id": "5f48ffda-9c01-4416-89e9-326d0a7bcd3c",
          "name": "Confidential"
        },
        "countriesRepresented": [
          {
            "id": "c29bf721-aeb7-4ac9-ab79-110fb9beb8cb",
            "name": "ALL",
            "label": "ALL"
          }
        ],
        "personalInformation": false,
        "development": false,
        "additionalTags": []
      },
      {
        "id": "536fa1c1-519b-4dd5-9446-adcd6cedaf1b",
        "community": {
          "id": "a7b76f9e-8ff4-4171-9050-3706f1f12188",
          "name": "Channel"
        },
        "subCommunity": {
          "id": "7e1b1d71-2fa6-4d38-b679-d4bb60d7a3f2",
          "name": "Aftermarket Insights"
        },
        "gicp": {
          "id": "5f48ffda-9c01-4416-89e9-326d0a7bcd3c",
          "name": "Confidential"
        },
        "countriesRepresented": [
          {
            "id": "c29bf721-aeb7-4ac9-ab79-110fb9beb8cb",
            "name": "ALL",
            "label": "ALL"
          }
        ],
        "personalInformation": false,
        "development": false,
        "additionalTags": []
      }
    ]
  };
  const anyUserName = 'anyUserName';

  beforeEach(() => jest.resetAllMocks());

  it('has button', () => {
    utils.hideEditButton.mockReturnValue(false);
    const buttonExists = !!getEditButton(anyDataset, 1, anyUserName);
    expect(buttonExists).toEqual(true);
  });

  it('does not have button when there is no dataset', () => {
    const buttonExists = !!getEditButton();
    expect(buttonExists).toEqual(false);
  });

  it('does not have button on first dataset', () => {
    utils.hideEditButton.mockReturnValue(false);
    const buttonExists = !!getEditButton(anyDataset, 0, anyUserName);
    expect(buttonExists).toEqual(false);
  });

  it('has DisabledEditButton button', () => {
    utils.hideEditButton.mockReturnValue(false);
    let editButtonToggle = {enabled : true}
    const button = getEditButton(anyDataset, 1, anyUserName, editButtonToggle);
    expect(button.type.name).toEqual('DisabledEditDatasetButton');
  });

  it('has EditButton button', () => {
    let editButtonToggle = {enabled : true}
    let editableDataset = {
      classifications: [
        {
          "id": "e41dc1fd-0bdf-4dfa-be7a-3aea7df1b715",
          "community": {
            "id": "a521b7d4-642c-4524-9c46-e4fa5e836a17",
            "name": "Information Technology"
          },
          "subCommunity": {
            "id": "48112e16-9abf-48ed-ae79-ab43844a32ec",
            "name": "Demo"
          },
          "gicp": {
            "id": "10710b7a-7391-4860-a18d-1d7edc746fe7",
            "name": "Public"
          },
          "development": true,
          "countriesRepresented": [],
          "personalInformation": false,
          "additionalTags": []
        }
      ],
      custodian: "AWS-GIT-DWIS-ADMIN",
      status: 'AVAILABLE',
    }
    utils.hideEditButton.mockReturnValue(false);
    const button = getEditButton(editableDataset, 1, {groups : ['AWS-GIT-DWIS-ADMIN']}, editButtonToggle);
    expect(button.type.name).toEqual('EditDatasetButton');
  });

});
