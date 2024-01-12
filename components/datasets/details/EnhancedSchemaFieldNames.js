import React, { useState, useEffect, useMemo } from 'react';
import { MdVpnKey } from "react-icons/md";
import { FaSortUp, FaSortDown, FaSort, FaQuestion } from 'react-icons/fa';
import utils from '../../utils';
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import Table from 'react-bootstrap/Table';
import { useTable, useSortBy} from 'react-table';

const EnhancedSchemaFieldNames = ({ selectedSchema }) => {
  if (!selectedSchema || selectedSchema.error) return <></>;

  const [updatedSelectedSchema, setUpdatedSelectedSchema] = useState([]);
  const [totalRows, setTotalRows] = useState('0');
  const [lastCalculated, setLastCalculated] = useState('NA');

  const calculateDecimal = percentage => {
    let percentageString = percentage.toString();
    const significantDigits = 1;
    const decimalIndex = percentageString.indexOf('.');

    percentageString = percentageString.substring(0, decimalIndex + significantDigits + 1);
    return parseFloat(percentageString);
  }

  const calculatePercentage = (field, total) => {
    const count = field.count;
    const percentage = ((count / total) * 100);
    const hasDecimal = percentage !== Math.trunc(percentage)
    return hasDecimal ? calculateDecimal(percentage) : percentage;
  }

  function getUpdatedSchema() {
    let finalCFields = [];
    let finalDFields = [];

    if(selectedSchema.createTime) {
      const D = new Date(selectedSchema.createTime);
      const result = String(D.getDate()).padStart(2,0)+"/"+String((D.getMonth()+1)).padStart(2,0)+"/"+D.getFullYear()
          +" "+String(D.getHours()).padStart(2,0)+":"+String(D.getMinutes()).padStart(2,0)
          +":"+String(D.getSeconds()).padStart(2,0);
      setLastCalculated(result);
    }

    if(selectedSchema.completeness) {
      const { completeness: {fields, total} } = selectedSchema;
      setTotalRows(total);
      const completenessFields = fields.filter(field => field.name);
      finalCFields = completenessFields.map(field => {
        const compPercent = calculatePercentage(field, total);
        return {
          completeness: `${compPercent}%`,
          name: field.name
        }
      });
    }
    else {
      setTotalRows('NA');
    }

    if(selectedSchema.distinctness) {
      const distinctnessFields = selectedSchema.distinctness.fields.filter(field => field.name);
      finalDFields = distinctnessFields.map(field => {
        return {
          distinctness: field.count,
          name: field.name
        }
      });
    }

    let newUpdatedSchema = selectedSchema?.fields?.map(field => {
      const isId = field.attribute === 'id';
      const isNullable = !!field.nullable;
      const icon = utils.getIconForDataTypeName(field.datatype);

      let distinctness = finalDFields?.filter(dfield => dfield.name == field.name)?.[0]?.distinctness;
      distinctness = (distinctness || distinctness == 0) ? distinctness : 'NA';
      let completeness = finalCFields?.filter(cfield => cfield.name == field.name)?.[0]?.completeness;
      completeness = (completeness) ? completeness : 'NA';
      return {icon, isId, isNullable, completeness, distinctness, ...field};
    });

    if(!newUpdatedSchema) newUpdatedSchema = [{}]
    setUpdatedSelectedSchema(newUpdatedSchema);
  }

  useEffect(() => {getUpdatedSchema();},[])

  const columns = useMemo(
    () => [
      {
        Header: '',
        accessor: 'icon',
        disableSortBy: true,
        Cell: ({ row }) => (
          <>
            <i style={{ color: '#bbb', marginRight: '8px' }}>
                {row.original.isId &&
              <OverlayTrigger placement="top" overlay={<Tooltip id={`tooltip-key-${row.original.id}`}>Unique Identifier</Tooltip>}>
                <span style={{ marginRight: '3px' }}><MdVpnKey /></span>
              </OverlayTrigger>
            }
            {row.original.isNullable &&
              <OverlayTrigger placement="top" overlay={<Tooltip id={`tooltip-null-${row.original.id}`}>Allows Missing Values</Tooltip>}>
                <span style={{ marginRight: '3px' }}><FaQuestion size="12" /></span>
              </OverlayTrigger>
            }
            <OverlayTrigger placement="top" overlay={<Tooltip id={`tooltip-type-${row.original.id}`}>{row.original.datatype}
                  {row.original.datatype === 'decimal' && ` (${row.original.precision}, ${row.original.scale})`}</Tooltip>}>
              {row.original.icon}
            </OverlayTrigger>
          </i>
          </>
        )
      },
      {
        Header: 'Column Name',
        accessor: 'name'
      },
      {
        Header: 'Description',
        accessor: 'description'
      },
      {
        Header: 'Completeness',
        accessor: 'completeness'
      },
      {
        Header: 'Distinctness',
        accessor: 'distinctness',
        Cell: ({ row }) => (<>{row.original.distinctness.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}</>)
      }
    ],[selectedSchema]
  );

  const {getTableProps, getTableBodyProps, headerGroups, rows, prepareRow} = useTable({ columns, data: updatedSelectedSchema }, useSortBy);

  return (
    <div key={`${selectedSchema.name}-${selectedSchema.version}`} id={"EnhancedSchemaFieldNames"}>
      { selectedSchema.id && (
        <>
          <div style={{ textAlign: 'end', paddingBottom: '10px' }}><b>Total Rows: {totalRows.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}</b></div>
          <Table striped hover {...getTableProps()}>
            <thead>
              {headerGroups.map((headerGroup) => (
                <tr {...headerGroup.getHeaderGroupProps()}>
                  {headerGroup.headers.map((column) => (
                    <th {...column.getHeaderProps(column.getSortByToggleProps())}>
                      <div className={'fieldNamesColumnHeaderSection'}>
                        {column.render('Header') == 'Completeness' &&
                            (<OverlayTrigger
                            placement="top"
                            overlay={
                              <Tooltip id={`tooltip-type-completeness}`} style={{fontSize: '12px', fontWeight: '400'}}>
                                <div style={{ textAlign: 'left', lineHeight: '16px'}}>Percent of rows containing data</div>
                                <div style={{ textAlign: 'left', lineHeight: '16px'}}>Last Calculated: {lastCalculated}</div>
                              </Tooltip>
                            }
                          >
                            <span>Completeness</span>
                        </OverlayTrigger>)}
                        {column.render('Header') == 'Distinctness'  &&
                            (<OverlayTrigger
                            placement="top"
                            overlay={
                              <Tooltip id={`tooltip-type-distinctness}`} style={{fontSize: '12px', fontWeight: '400'}}>
                                <div style={{ textAlign: 'left', lineHeight: '16px'}}>Number of distinct values</div>
                                <div style={{ textAlign: 'left', lineHeight: '16px'}}>Last Calculated: {lastCalculated}</div>
                              </Tooltip>
                            }
                          >
                            <span>Distinctness</span>
                          </OverlayTrigger>)}
                        {column.render('Header') !== 'Completeness' && column.render('Header') !== 'Distinctness' && column.render('Header')}
                      </div>
                      <div className={'fieldNamesColumnHeaderSort'}>{column.canSort ? column.isSorted ? column.isSortedDesc ? <FaSortDown color={'#367c2b'}/> : <FaSortUp color={'#367c2b'}/> : <FaSort /> : ''}</div>
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
        </>
      )}
    </div>
  );
}

export default EnhancedSchemaFieldNames;
