import DatasetCard from '../../../../components/datasets/search/PaginatedDatasetCard';
import '@testing-library/jest-dom/extend-expect';
import React from "react";
import {VISIBILITY} from "../../../../src/utilities/constants";
import { render, cleanup } from '@testing-library/react';

describe('PaginatedDatasetCard test', () => {
    afterEach(cleanup)

    it('should check that component mounts', async () => {
        const item = createDataset();
        const state = createState();
        const props = createProps();
        const updateSelectedItems = () => {};

        render(
            <DatasetCard item={item} state={state} props={props} updateSelectedItems={updateSelectedItems} />
        );
        const cardElement = document.getElementById('id');
        expect(cardElement).toBeInTheDocument();
    });

    it('should display contains Pii if classifications contains personal information', async () => {
        const classifications = [{ personalInformation: true }];
        const item = { ...createDataset(), classifications: classifications };
        const state = createState();
        const props = createProps();
        const updateSelectedItems = () => {};
        const { getByText } = render(
            <DatasetCard item={item} state={state} props={props} updateSelectedItems={updateSelectedItems} />
        );
        expect(getByText('Personal Information')).toBeInTheDocument();
    });

    it('should not display contains Pii if classifications does not contain personal information', async () => {
        const item = createDataset();
        const state = createState();
        const props = createProps();
        const updateSelectedItems = () => {};
        const { queryByText } = render(
            <DatasetCard item={item} state={state} props={props} updateSelectedItems={updateSelectedItems} />
        );
        expect(queryByText('Personal Information')).not.toBeInTheDocument();
    });

    it('should display custodian only for datasets containing NO_VISIBILITY flag', async () => {
        const item = createDataset();
        const state = createState();
        const props = createProps();
        const updateSelectedItems = () => {};
        const { queryByText } = render(
            <DatasetCard item={item} state={state} props={props} updateSelectedItems={updateSelectedItems} />
        );
        expect(queryByText('Custodian Only')).not.toBeInTheDocument();
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
        relevance: {matches: {}, score: 0},
        visibility : VISIBILITY.NO_VISIBILITY
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
