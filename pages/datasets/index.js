import React, {useState} from "react";
import {Col, Row} from "react-bootstrap";
import hash from 'object-hash';
import {useDatasets} from "../../apis/datasets";
import {useAppContext} from "../../components/AppState";
import PaginatedDatasetCard from "../../components/datasets/search/PaginatedDatasetCard";
import PaginatedRecords from "../../components/search/PaginatedRecords";
import RequestAccessButton from "../../components/datasets/search/RequestAccessButton";
import RegisterDatasetButton from "../../components/datasets/search/RegisterDatasetButton";
import SearchTermToggle from "../../components/search/SearchTermToggle";
import Spacer from "../../components/Spacer";
import Search from "../../components/datasets/search/Search";
import utils from "../../components/utils";
import {useRouter} from "next/router";

const DatasetCatalog = () => {
  const {query} = useRouter();
  const [selectedDatasets, setSelectedDatasets] = useState([]);
  const [showRelevance, setShowRelevance] = useState(false);
  const globalContext = useAppContext();
  const isPublicToggleEnabled = utils.hasAdGroupToggleEnabled(globalContext?.toggles['datacatalogui.public_datasets'], globalContext?.loggedInUser?.groups);
  const publicId = '10710b7a-7391-4860-a18d-1d7edc746fe7';
  const useRecords = query => useDatasets({...query, isPublicToggleEnabled, publicId});
  const useCounts = query => useDatasets({...query, count:'true',  isPublicToggleEnabled, publicId});
  const createRecord = record => <PaginatedDatasetCard item={record} selectable selectedItems={selectedDatasets} setSelectedDatasets={setSelectedDatasets} showRelevance={showRelevance} />

  return (
    <div id={'dataset-catalog-search-root'}>
      <Row>
        <Col md={{span: 12}}>
          <h2>Dataset Catalog</h2>
          <Spacer height='15px'/>
        </Col>
        <Col>
          <span className="float-md-right catalog-registerNewDataset">
            <RequestAccessButton selectedDatasets={selectedDatasets} setSelectedDatasets={setSelectedDatasets}/>
            <RegisterDatasetButton />
          </span>
        </Col>
      </Row>
      <Spacer height='8px'/>
      <Search key={hash(query)}/>
      <SearchTermToggle showRelevance={showRelevance} setShowRelevance={setShowRelevance}/>
      <PaginatedRecords type='datasets' createRecord={createRecord} useRecords={useRecords} useCounts={useCounts}/>
    </div>
  );
};

export default DatasetCatalog;
