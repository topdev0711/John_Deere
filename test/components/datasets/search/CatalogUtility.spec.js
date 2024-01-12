// Unpublished Work © 2022 Deere & Company.
import {buildQueryString, sortItems, createFilterQuery} from '../../../../components/datasets/search/CatalogUtility';

describe('CatalogUtility TestSuite', () => {
    it('build query string works as expected', () => {
        const datasets = [{id: 'some-dataset-id'}, {id: 'some-second-id'}];
        const expectedStr = `?sources=${datasets[0].id}&sources=${datasets[1].id}&ref=datasets`;
        expect(buildQueryString(datasets)).toEqual(expectedStr);
    })

    it('sortItems sorts as expected', () => {
        const datasets = [{
            id: 'some-dataset-id-1',
            relevance: {score: 80}
        }, {
            id: 'some-dataset-id-2',
            relevance: {score: 20}
        }, {
            id: 'some-dataset-id-3',
            relevance: {score: 50}
        }, {
            id: 'some-dataset-id-4',
            relevance: {score: 60}
        }];
        expect(sortItems(datasets)[0].id).toEqual('some-dataset-id-1');
        expect(sortItems(datasets)[1].id).toEqual('some-dataset-id-4');
        expect(sortItems(datasets)[2].id).toEqual('some-dataset-id-3');
        expect(sortItems(datasets)[3].id).toEqual('some-dataset-id-2');
    })

    it('empty arguments should return empty string', () => {
        const searchText = '';
        const searchFilter = {
            phase: [],
            subCommunity: [],
            category: [],
            community: []
        }
        expect(createFilterQuery(searchText, searchFilter)).toEqual('?isPublicToggleEnabled=false&publicId=');
    })

    it('query string returns expected results', () => {
        const searchText = 'Marvel';
        const searchFilter = {
            phase: [{
                name: 'Enhance', id: 'some-phase-123'
            }, {
                name: 'Raw', id: 'some-phase-321'
            }],
            subCommunity: [],
            category: [],
            community: [{
                name: 'Customer', id: 'some-community-123'
            }]
        }
        expect(createFilterQuery(searchText, searchFilter)).toEqual('?isPublicToggleEnabled=false&publicId=&text=Marvel&phase=Enhance&phase=Raw&community=Customer');
    })

    it('query string for text returns expected results', () => {
        const searchText = 'Marvel Studios';
        const searchFilter = {
            phase: [],
            subCommunity: [],
            category: [],
            community: [{
                name: 'Customer', id: 'some-community-123'
            }]
        }
        expect(createFilterQuery(searchText, searchFilter)).toEqual('?isPublicToggleEnabled=false&publicId=&text=Marvel+Studios&community=Customer');
    })
});

