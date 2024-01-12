import React from "react";
import Router, {useRouter} from "next/router";
import {useGetPermissionsSwr} from '../../../../apis/permissions';
import PaginatedRecords from "../../../../components/permissions/search/PaginatedRecords";
import {mount, shallow} from "enzyme";
import SmallSpinner from "../../../../components/SmallSpinner";
import Paginator from "../../../../components/Paginator";

jest.mock('../../../../apis/permissions');

jest.mock("next/router", () => ({
  useRouter() {
    return {
      query: {},
      push: jest.fn()
    }
  }
}));

describe('permissions PaginateRecords tests', () => {
  const noValues = {error: undefined, data: undefined};
  const record = {id: 'someName', roleType: 'human', permissions: [], isMember: true};
  const records = {error: undefined, data: [record]};
  const countWithPages = {error: undefined, data: {groups: 25, permissions: 125}};

  it('should get permissions error', () => {
    useGetPermissionsSwr.mockReturnValueOnce({error: 'noPermission', data: undefined}).mockReturnValueOnce(noValues);
    const paginatedRecords = shallow(<PaginatedRecords />);
    expect(paginatedRecords.exists('#permissions-error')).toEqual(true);
  });

  it('should get count error', () => {
    useGetPermissionsSwr.mockReturnValueOnce(noValues).mockReturnValueOnce({error: 'noCount', data: undefined});
    const paginatedRecords = shallow(<PaginatedRecords />);
    expect(paginatedRecords.exists('#permissions-count-error')).toEqual(true);
  });

  it('should have spinner while loading data', () => {
    useGetPermissionsSwr.mockReturnValue(noValues);
    const paginatedRecords = shallow(<PaginatedRecords />);
    expect(paginatedRecords.exists(SmallSpinner)).toEqual(true);
  });

  it('should have no records', () => {
    useGetPermissionsSwr.mockReturnValueOnce({error: undefined, data: []}).mockReturnValueOnce({ error: undefined, data: { groups: 0 }});
    const paginatedRecords = shallow(<PaginatedRecords />);
    expect(paginatedRecords.exists('NoRecords')).toEqual(true);
  });

  it('should not have pages', () => {
    useGetPermissionsSwr.mockReturnValueOnce(records).mockReturnValueOnce({ error: undefined, data: { groups: 10 }});
    const paginatedRecords = shallow(<PaginatedRecords />);
    expect(paginatedRecords.exists(Paginator)).toEqual(false);
  });

  it('should have pages', () => {
    useGetPermissionsSwr.mockReturnValueOnce(records).mockReturnValueOnce({ error: undefined, data: { groups: 100 }});
    const paginatedRecords = shallow(<PaginatedRecords />);
    expect(paginatedRecords.exists(Paginator)).toEqual(true);
  });

  it('should have five pages', () => {
    useGetPermissionsSwr.mockReturnValueOnce(records).mockReturnValueOnce({ error: undefined, data: { groups: 100 }});
    const paginatedRecords = mount(<PaginatedRecords />);
    const actualTotalPages = paginatedRecords.find(Paginator).props().totalPages;
    expect(actualTotalPages).toEqual(5);
  });

  it('should be on the first page', () => {
    useGetPermissionsSwr.mockReturnValueOnce(records).mockReturnValueOnce(countWithPages);
    const paginatedRecords = mount(<PaginatedRecords />);
    const actualCurrentPage = paginatedRecords.find(Paginator).props().currentPage;
    expect(actualCurrentPage).toEqual(1);
  });
});
