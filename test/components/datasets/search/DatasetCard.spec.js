// Unpublished Work © 2022 Deere & Company.
import {mount, shallow} from 'enzyme';
import DatasetCard from '../../../../components/datasets/search/DatasetCard';
import {Button, Card} from "react-bootstrap";
import React from "react";

describe('DatasetCard test', () => {
    it('should check that component mounts', async () => {
        const item = createDataset();
        const state = createState();
        const props = createProps();
        const updateSelectedItems = () => {};

        const wrapper = mount(<DatasetCard item={item} state={state} props={props} updateSelectedItems={updateSelectedItems} />);
        const card = wrapper.find(Card)
        expect(card.exists).toBeTruthy()
    });

    it('should display contains Pii if classifications contains personal information', async () => {
        const classifications = [{ personalInformation: true }]
        const item = {...createDataset(), classifications: classifications};
        const state = createState();
        const props = createProps();
        const updateSelectedItems = () => {};


        const wrapper = shallow(<DatasetCard item={item} state={state} props={props} updateSelectedItems={updateSelectedItems} />);
        console.log(wrapper.html())
        expect(wrapper.text()).toContain('Personal Information');
    });

    it('should not display contains Pii if classifications does not contain personal information', async () => {
        const item = createDataset();
        const state = createState();
        const props = createProps();
        const updateSelectedItems = () => {};

        const wrapper = shallow(<DatasetCard item={item} state={state} props={props} updateSelectedItems={updateSelectedItems} />);
        expect(wrapper.text()).not.toContain('Personal Information');
    });

    it('should handle dataset selection', async () => {
        const item = createDataset();
        const state = createState();
        const props = createProps();
        const updateSelectedItems = jest.fn();

        const wrapper = shallow(<DatasetCard item={item} state={state} props={props} updateSelectedItems={updateSelectedItems} />);

        const checkedBox = wrapper.find(Card)
        expect(checkedBox.exists('checked')).toBeFalsy()
        const preventDefault = jest.fn();
        checkedBox.simulate('click', {preventDefault: preventDefault});
        expect(updateSelectedItems).toHaveBeenCalled()
    });


    it('should handle dataset selection', async () => {
        const item = createDataset();
        const state = createState();
        const props = createProps();
        const updateSelectedItems = jest.fn();

        const wrapper = shallow(<DatasetCard item={item} state={state} props={props} updateSelectedItems={updateSelectedItems} />);

        const checkedBox = wrapper.find(Card)
        expect(checkedBox.exists('checked')).toBeFalsy()
        const preventDefault = jest.fn();
        checkedBox.simulate('click', {preventDefault: preventDefault});
        expect(updateSelectedItems).toHaveBeenCalled()
    });
});



const createDataset = () => {
    return {
        id: 'id',
        name: 'name',
        description: 'desc',
        documentation: 'docs',
        phase: {id: 'phaseid', name: 'phase'},
        status: 'AVAILABLE',
        schemas: [],
        linkedSchemas: [],
        classifications: [],
        relevance: {matches: {}, score: 0}
    }
};

const createState = () => {
    return {
        maxResults: 20,
        page: 1,
        searchCriteria: '',
        showFilter: false,
        selectedItems: [],
        filters: {},
        accessReqCtxShow: false,
        accessReqCtxTarget: null,
        permListTarget: null,
        permListShow: 0,
        userAccessibleDatasets: [],
        showRelevance: false,
        datasets: [],
        permissions: [],
        userPermissions: []
    }
};

const createProps = () => {
    const push = jest.fn();
    return {
        selectable: true,
        setLoading: () => {},
        router: {query: {}, push: push, hasPath:'/datasets'}
    }
}
