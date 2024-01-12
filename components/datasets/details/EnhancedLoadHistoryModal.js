import React, { useState, useEffect, useMemo } from 'react';
import { Tab, Row, Col, Table, Spinner } from 'react-bootstrap';
import { FaCheckCircle, FaClock, FaExclamationCircle, FaSortUp, FaSortDown, FaSort, FaCheck, FaSearch} from 'react-icons/fa';
import { useTable, useGlobalFilter, useAsyncDebounce, useSortBy } from 'react-table';
import { Modal, Button } from 'react-bootstrap';
import styles from '../../../styles/components/datasets/EnhancedLoadHistoryModal.module.css'
import { CgCloseO } from 'react-icons/cg';

const EnhancedLoadHistoryModal = ({ show, onCancel, schemaName = "", datasetEnvironmentName = "", schemaEnvironmentName = "" }) => {

    const [key, setKey] = useState('default');
    const [errorMessage, setErrorMessage] = useState('');
    const [loadHistory, setLoadHistory] = useState([]);
    const [isLoading, setLoading] = useState(false);
    const [fetchStatus, setFetchStatus] = useState('');
    const openModal = (failureMessage) => {
        setErrorMessage(failureMessage);
    }
    const closeModal = () => setErrorMessage("");

    const displayStatus = (status, row) => {
      const error = (!!loadHistory[row.id].errorMessage) ? loadHistory[row.id].errorMessage: '';
      if ( status === 'FAILED' ) {
        return (
            <button onClick={() => openModal(error)} className="btn btn-link btn-xs p-0 m-0" style={{ fontSize: '0.75rem' }}>
              {status}
            </button>
        );
      }
      return status;
    }

    const GlobalFilter = ({ globalFilter, setGlobalFilter }) => {
        const [value, setValue] = useState(globalFilter);
        const onChange = (value) => {
            setGlobalFilter(value || undefined)
        }
        const handleResetClick = event => {
          setGlobalFilter(undefined);
        }
        return (
            <>
            <Row className={"loadHistoryTableSearchBarRow"}>
              <Col md={{ span: 18}} className={"loadHistoryTableSearchBarLabel"}><b>{schemaName} Load History</b>  </Col>
              <Col md={{ span: 6}} className={"loadHistoryTableSearchBar"}>
                <span className={'search-icon-lh'}><FaSearch fontStyle={'light'} /></span>
                <input
                    value={value || ''}
                    onChange={(e) => {
                        setValue(e.target.value);
                        onChange(e.target.value);
                    }}
                    placeholder="Filter Load History"
                    className="border border-grey form-control form-control-sm loadHistoryTableSearchBarInput"
                />
                <span class="close-icon-lh" onClick={handleResetClick}><CgCloseO color="#33333" /></span>
              </Col>
            </Row>

            </>
        );
    }


    const getLoadHistory = async () => {
        try {
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
            } else if (response.status === 404) {
                setFetchStatus('No load history found');
                setLoading(false);
            } else {
                setFetchStatus('Failed to fetch load history');
                setLoading(false);
            }
            const data = ingestMetrics;
            setLoadHistory(data);
        } catch (e) {
            setFetchStatus('Failed to fetch load history');
            setLoading(false);
        }
    }

    useEffect(() => {
        getLoadHistory()
    }, [])

    const columns = useMemo(
        () => [
            {
                Header: 'Request ID',
                accessor: 'requestId',
                Cell: ({ value, row }) => (
                    <>
                        {row.original.status == 'COMPLETE' && <FaCheck color="#367c2b" />}
                        {row.original.status == 'PENDING' && <FaClock color="#ffde00" />}
                        {row.original.status !== 'COMPLETE' && row.original.status !== 'PENDING' && <FaExclamationCircle color="red" />}
                        {row.original.requestId}
                    </>
                ),
            },
            {
                Header: 'Status',
                accessor: 'status',
                Cell: ({ value, row }) => <>{displayStatus(value, row)}</>,
                filterMethod: (filter, row) => {
                    return row.status.indexOf(filter.value) >= 0;
                }
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
                Header: 'Load Size (GB)',
                accessor: 'metaData.estimatedSize',
            },
            {
                Header: 'Load Count',
                accessor: 'metaData.numberOfRecords',
            },
        ], [loadHistory]
    );

    const {getTableProps, getTableBodyProps, headerGroups, rows, prepareRow, state: { globalFilter }, setGlobalFilter,} = useTable({ columns, data: loadHistory }, useGlobalFilter, useSortBy);

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
        <Modal show={show} onHide={onCancel} size="xl" className="modal-xl-90ht" centered id="EnhancedLoadHistoryModal">
            <Modal.Header closeButton>
                <Modal.Title>Load History</Modal.Title>
            </Modal.Header>
            <Modal.Body className={styles.loadHistoryTable} >

            <GlobalFilter globalFilter={globalFilter} setGlobalFilter={setGlobalFilter} />
            <div>
            <Table striped hover {...getTableProps()} style={{borderBottom: 'none'}}>
                <thead >
                  {headerGroups.map((headerGroup) => (
                    <tr {...headerGroup.getHeaderGroupProps()} class={"loadHistoryTableHeader"}>
                      {headerGroup.headers.map((column) => (
                        <th {...column.getHeaderProps(column.getSortByToggleProps())}>
                          <div className={'fieldNamesColumnHeaderSection'}>{column.render('Header')}</div>
                          <div className={'fieldNamesColumnHeaderSort'}>{column.canSort ? column.isSorted ? column.isSortedDesc ? <FaSortDown color="#367c2b"/> : <FaSortUp color="#367c2b"/> : <FaSort /> : ''}</div>
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                {!isLoading && !fetchStatus && (
                  <>
                      <tbody {...getTableBodyProps()} className={ styles.loadHistoryRow }>
                        {rows.map((row) => {
                          prepareRow(row);
                          return (
                            <tr {...row.getRowProps()} style={{border: 'none'}}>
                              {row.cells.map((cell) => {
                                return <td {...cell.getCellProps()}>{cell.render('Cell')}</td>;
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                      </>
                  )}
              {!!fetchStatus && (<div className="markdown" style={{paddingTop: '10px'}}>{fetchStatus}</div>)}
              {!loadHistory?.length && (<div className="markdown" style={{paddingTop: '10px'}}>No load history found</div>)}
            </Table>
            </div>

            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" className={"loadHistoryTableCloseBtn"} onClick={() => {onCancel()}}>
                    Close
                </Button>
            </Modal.Footer>
        </Modal>
      </>
    )
}

export default EnhancedLoadHistoryModal;
