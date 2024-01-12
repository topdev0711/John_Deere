import CopyableText from "../../CopyableText";
import {useEffect, useState} from "react";
import { getTables } from "../../../apis/metastore";

const MetastoreTables = ({ schemaId, tables }) => {
  const [metastoreTables, setMetastoreTables] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadSchemaTables = async table => {
    const loadedTables = await getTables(table);
    setMetastoreTables(loadedTables);
    setIsLoading(false);
  }

  useEffect(() => {
    const getTableRecord = () => tables.find(table => table.schemaId === schemaId);
    const tableRecord = tables && getTableRecord();
    if(tableRecord) loadSchemaTables(tableRecord);
    else setIsLoading(false);

  }, []);

  if (!isLoading && !metastoreTables.length) return <div id='no-tables'>No tables defined in metastore</div>;
  if (isLoading) return <div id='loading-tables'>Loading...</div>;

  const createTableItem = table =>
    <li key={table} className="text-muted small" as="div">
      <CopyableText key={table}>{table}</CopyableText>
    </li>

  const tableItems = metastoreTables.map(createTableItem);
  return <ul id={'metastore-tables-list'} style={{ listStyleType: 'none' }}>{tableItems}</ul>
}

export default MetastoreTables;
