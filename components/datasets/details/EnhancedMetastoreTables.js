import CopyableText from "../../CopyableText";
import {useEffect, useState} from "react";
import { getTables } from "../../../apis/metastore";

const EnhancedMetastoreTables = ({ schemaId, tables }) => {
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
    <li key={table} as="div" >
      <CopyableText key={table}>{table}</CopyableText>
    </li>

  const tableItems = metastoreTables.map(createTableItem);
  return <ul id={'metastore-tables-list'} style={{ listStyleType: 'none', margin: 0, padding: 0 }}>{tableItems}</ul>
}

export default EnhancedMetastoreTables;
