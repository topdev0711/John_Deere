import React from "react";
import Router, {useRouter} from "next/router";
import PaginatedRecords from "../../../components/search/PaginatedRecords";
import {mount, shallow} from "enzyme";
import SmallSpinner from "../../../components/SmallSpinner";
import Paginator from "../../../components/Paginator";

jest.mock("next/router", () => ({
  useRouter() {
    return {
      query: {},
      push: jest.fn()
    }
  }
}));

describe('PaginateRecords tests', () => {
  const anyType = 'anyType';
  const AnyRecord = () => <div className='anyRecord'></div>;
  const createAnyRecord = () => <AnyRecord />;
  const anyRecords = Array(5).fill({ id: 'anyId', name: 'anyName'});
  const useRecordsSuccess = () => ({error: undefined, data: anyRecords});
  const useCountsSuccess = () => ({error: undefined, data: 20});
  const anyError = new Error('anyError');
  const useError = () => ({error: anyError});
  const useLoading = () => ({ error: undefined, data: undefined });

  it('should get records error', () => {
    const paginatedRecords = shallow(<PaginatedRecords type={anyType} createRecord={createAnyRecord} useRecords={useError} useCounts={useCountsSuccess} />);
    expect(paginatedRecords.exists(`#${anyType}-error`)).toEqual(true);
  });

  it('should get count error', () => {
    const paginatedRecords = shallow(<PaginatedRecords type={anyType} createRecord={createAnyRecord} useRecords={useRecordsSuccess} useCounts={useError} />);
    expect(paginatedRecords.exists(`#${anyType}-count-error`)).toEqual(true);
  });

  it('should have spinner while loading records', () => {
    const paginatedRecords = shallow(<PaginatedRecords type={anyType} createRecord={createAnyRecord} useRecords={useLoading} useCounts={useCountsSuccess} />);
    expect(paginatedRecords.exists(SmallSpinner)).toEqual(true);
  });

  it('should have spinner while loading counts', () => {
    const paginatedRecords = shallow(<PaginatedRecords type={anyType} createRecord={createAnyRecord} useRecords={useRecordsSuccess} useCounts={useLoading} />);
    expect(paginatedRecords.exists(SmallSpinner)).toEqual(true);
  });

  it('should have not have spinner when count is zero', () => {
    const useCounts = () => ({ error: undefined, data: 0 });
    const paginatedRecords = shallow(<PaginatedRecords type={anyType} createRecord={createAnyRecord} useRecords={useRecordsSuccess} useCounts={useCounts} />);
    expect(paginatedRecords.exists(SmallSpinner)).toEqual(false);
  });

  it('should have no records', () => {
    const useRecords = () => ({error: undefined, data: []});
    const paginatedRecords = shallow(<PaginatedRecords type={anyType} createRecord={createAnyRecord} useRecords={useRecords} useCounts={useCountsSuccess} />);
    expect(paginatedRecords.exists('NoRecords')).toEqual(true);
  });

  it('should not have pages', () => {
    const paginatedRecords = shallow(<PaginatedRecords type={anyType} createRecord={createAnyRecord} useRecords={useRecordsSuccess} useCounts={useCountsSuccess} />);
    expect(paginatedRecords.exists(Paginator)).toEqual(false);
  });

  it('should have five pages', () => {
    const useCountsMultiPage = () => ({error: undefined, data: 100});
    const paginatedRecords = mount(<PaginatedRecords type={anyType} createRecord={createAnyRecord} useRecords={useRecordsSuccess} useCounts={useCountsMultiPage} />);
    const actualTotalPages = paginatedRecords.find(Paginator).props().totalPages;
    expect(actualTotalPages).toEqual(5);
  });

  it('should be on the first page', () => {
    const useCountsMultiPage = () => ({error: undefined, data: 100});
    const paginatedRecords = mount(<PaginatedRecords type={anyType} createRecord={createAnyRecord} useRecords={useRecordsSuccess} useCounts={useCountsMultiPage} />);
    expect(paginatedRecords.exists(Paginator)).toEqual(true);
    const actualCurrentPage = paginatedRecords.find(Paginator).props().currentPage;
    expect(actualCurrentPage).toEqual(1);
  });
});
