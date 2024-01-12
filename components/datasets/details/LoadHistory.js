import React, { useState, useEffect, useMemo } from 'react';
import { Tab, Row, Col, Table, Spinner } from 'react-bootstrap';
import { FaCheckCircle, FaClock, FaExclamationCircle, FaSortUp, FaSortDown, FaSort } from 'react-icons/fa';
import { useTable, useGlobalFilter, useAsyncDebounce, useSortBy } from 'react-table';
import { Modal, Button } from 'react-bootstrap';

const iconStyle = {
  COMPLETE: <FaCheckCircle color="#367c2b" />,
  PENDING: <FaClock color="#ffde00" />,
  default: <FaExclamationCircle color="red" />,
};

const GlobalFilter = ({ globalFilter, setGlobalFilter }) => {
  const [value, setValue] = useState(globalFilter);
  const onChange = (value) => {
      setGlobalFilter(value || undefined)
    }
  return (
    <input
      value={value || ''}
      onChange={(e) => {
        setValue(e.target.value);
        onChange(e.target.value);
      }}
      placeholder={'Filter...'}
      className="border border-grey form-control form-control-sm"
      style={{ maxWidth: '250px', width: '217px' }}
    />
  );
}

const LoadHistory = ({datasetEnvironmentName = "", schemaEnvironmentName = ""}) => {
  const [key, setKey] = useState('default');
  const [errorMessage, setErrorMessage] = useState('');
  const [loadHistory, setLoadHistory] = useState([]);
  const [isLoading, setLoading] = useState(false);
  const [fetchStatus, setFetchStatus] = useState('');
  const openModal = (failureMessage) => {
    setErrorMessage(failureMessage);
  }
  const closeModal = () => setErrorMessage("");

  const eventIcon = (status) => {
    if (status === 'COMPLETE' || status === 'PENDING') return iconStyle[status];
    return iconStyle['default'];
  };

  const displayStatus = (status, row) => {
    const error = (!!loadHistory[row.id].errorMessage) ? loadHistory[row.id].errorMessage: '';
    if ( status === 'FAILED' ) {
      return (
          <button onClick={() => openModal(error)} className="btn btn-link btn-xs p-0 m-0" style={{ fontSize: 'smaller' }}>
            {status}
          </button>
      );
    }
    return status;
  }

  const getLoadHistory = async() => {
    try{
      let ingestMetrics = [];
      setLoading(true);
      const metaData = {
        dataType: datasetEnvironmentName,
        representation: schemaEnvironmentName
      }
      const response = await fetch(`/api/load-history`, {
        credentials: 'same-origin',
        method: 'POST',
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(metaData)
      });
      if (response.ok) {
        ingestMetrics = await response.json();
        setLoading(false);
      }else if(response.status === 404) {
        setFetchStatus('No load history found');
        setLoading(false);
      } else {
        setFetchStatus('Failed to fetch load history');
        setLoading(false);
      }
      const data = ingestMetrics.map((event) => {
        const myIcon = eventIcon(event.status);
        return {
          icon: myIcon,
          ...event,
        };
      });
      setLoadHistory(data);
    }catch(e){
      setFetchStatus('Failed to fetch load history');
      setLoading(false);
    }
  }

  useEffect(() => {
    getLoadHistory()
  },[])

  const columns = useMemo(
    () => [
      {
        Header: '',
        accessor: 'icon',
        disableSortBy: true,
      },
      {
        Header: 'Request ID',
        accessor: 'requestId',
        disableSortBy: true,
      },
      {
        Header: 'Start Time',
        accessor: 'metaData.startTime',
      },
      {
        Header: 'End Time',
        accessor: 'metaData.endTime',
      },
      {
        Header: 'Status',
        accessor: 'status',
        Cell: ({value, row}) => <>{ displayStatus(value, row) }</>,
        filterMethod: (filter, row) => {
          return row.status.indexOf(filter.value) >= 0;
        }
      },
      {
        Header: 'Load Size (GB)',
        accessor: 'metaData.estimatedSize',
      },
      {
        Header: 'Load Count',
        accessor: 'metaData.numberOfRecords',
      },
    ],[loadHistory]
  );

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
    state: { globalFilter },
    setGlobalFilter,
  } = useTable({ columns, data:loadHistory }, useGlobalFilter, useSortBy);

  return (
    <>
      <Modal show={!!errorMessage} onHide={closeModal}>
        <Modal.Body style={{ overflowY: 'hidden' }}>{errorMessage}</Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={closeModal}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
      {!isLoading && !fetchStatus && (
      <Tab.Container id="file-tabs" activeKey={key} defaultActiveKey="default">
        <Row className="justify-content-md-end ">
          <Col md="auto" className="p-2">
            <GlobalFilter globalFilter={globalFilter} setGlobalFilter={setGlobalFilter} />
          </Col>
        </Row>
        <Row>
          <Col className="p-2">
            <div style={{ fontSize: '70%', overflowY: 'scroll', maxHeight: '300px' }}>
              <Table striped hover {...getTableProps()}>
                <thead>
                  {headerGroups.map((headerGroup) => (
                    <tr {...headerGroup.getHeaderGroupProps()}>
                      {headerGroup.headers.map((column) => (
                        <th {...column.getHeaderProps(column.getSortByToggleProps())}>
                          {column.render('Header')}
                          <span>{column.canSort ? column.isSorted ? column.isSortedDesc ? <FaSortDown /> : <FaSortUp /> : <FaSort /> : ''}</span>
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody {...getTableBodyProps()}>
                  {rows.map((row) => {
                    prepareRow(row);
                    return (
                      <tr {...row.getRowProps()}>
                        {row.cells.map((cell) => {
                          return <td {...cell.getCellProps()}>{cell.render('Cell')}</td>;
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
          </Col>
        </Row>
      </Tab.Container>)}
      <div className="text-muted small" align="center" hidden={!isLoading}>
        <Spinner className="spinner-border uxf-spinner-border-md" animation="border" role="status">
          <span className="sr-only">Loading...</span>
        </Spinner>
      </div>
      {!!fetchStatus && (
        <div className="markdown">
          {fetchStatus}
        </div>
      )}
    </>
  );
};

export default LoadHistory;
