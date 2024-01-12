import React, {useEffect, useState} from 'react';
import Router, {useRouter} from "next/router";
import Searchbar from "../../search/Searchbar";
import SearchFilters from "./SearchFilters";
import useDebounce from "../../../hooks/useDebounce";
import {TiFilter} from "react-icons/ti";
import {Button, Col, InputGroup, Row} from "react-bootstrap";
import CatalogBadge from "../../search/CatalogBadge";
import Spacer from "../../Spacer";
import {createUrl, defaultSize} from "../../searchUtils";

const delayTime = 1000;

const Search = () => {
  const {query: {searchTerm: initialSearchTerm, from, size = defaultSize, ...initialFilters}, basePath} = useRouter();
  const [firstRender, setFirstRender] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState(initialFilters || {});
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const debouncedSearch = useDebounce(searchTerm, delayTime);

  const applySearch = () => {
    if(firstRender) {
      setFirstRender(false);
      return;
    }

    const queryJson = {...filters, searchTerm: debouncedSearch, from: '0', size};
    const url = createUrl({ baseUrl: basePath, queryJson});
    Router.push(url);
  }

  useEffect(() => {applySearch()}, [debouncedSearch, filters]);

  const getVariant = () => filters.length ? 'success' : 'link';
  const handleShowFilters = () => setShowFilters(!showFilters);
  const clearFilters = () => { setFilters({})};
  const hasFilters = () => !!Object.keys(filters).length;

  return (
    <div>
      <Row id='searcher'>
        <Col md={{span: 24}}>
          <InputGroup>
            <Searchbar searchTerm={searchTerm} setSearchTerm={setSearchTerm}/>
            <InputGroup.Append>
              <Button variant={getVariant()} onClick={handleShowFilters}><TiFilter size="16"/></Button>
            </InputGroup.Append>
          </InputGroup>
        </Col>
      </Row>
      <Row hidden={!showFilters}>
        <Col md={{span: 24}}>
          <SearchFilters filters={filters} setFilters={setFilters} setShowFilters={setShowFilters} />
        </Col>
      </Row>
      <div>
        <CatalogBadge className="catalog-badgeContainer" label={'Clear Filters'} onClick={clearFilters} isHidden={!hasFilters()}/>
      </div>
      <Spacer height='25px'/>
    </div>
  );
};

export default Search;
