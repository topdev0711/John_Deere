import React, { useState, useEffect, useMemo } from 'react';
import { MdVpnKey } from "react-icons/md";
import { FaQuestion } from 'react-icons/fa';
import utils from '../../utils';
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import Table from 'react-bootstrap/Table';
import {useTable} from 'react-table';

const EnhancedSchemasFieldNamesDiff = ({ selectedSchema }) => {
  if (!selectedSchema) return <></>;
  if(selectedSchema.error) return <></>;

  const [updatedSelectedSchema, setUpdatedSelectedSchema] = useState([]);
  const addIcons = field => {
    const isId = field.attribute === 'id';
    const isNullable = !!field.nullable;
    const icon = utils.getIconForDataTypeName(field.datatype);
    return {icon, isId, isNullable, ...field};
  }

  const getUpdatedSchema = () => setUpdatedSelectedSchema(selectedSchema?.fields?.map(addIcons) || [{}]);
  useEffect(() => {getUpdatedSchema()},[]);

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
    ],[selectedSchema]
  );

  const {getTableProps, getTableBodyProps, headerGroups, rows, prepareRow} = useTable({ columns, data: updatedSelectedSchema });

  return (
    <div id={"EnhancedSchemaFieldNames"}>
      { selectedSchema.id && (
        <Table striped hover {...getTableProps()}>
          <thead>
          {headerGroups.map((headerGroup) => (
            <tr {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map((column) => (
                <th {...column.getHeaderProps()}>
                  <div className={'fieldNamesColumnHeaderSection'}>{column.render('Header')}</div>
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
      )}
    </div>
  );
}

export default EnhancedSchemasFieldNamesDiff;
