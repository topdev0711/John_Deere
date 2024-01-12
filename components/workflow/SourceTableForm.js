import {Button, Card, Form, Tooltip, OverlayTrigger, Col, Collapse} from 'react-bootstrap';
import Select from '../Select';
import React, {useState, useEffect} from 'react';
import ValidatedInput from '../ValidatedInput';
import {MdInfoOutline, MdAddCircleOutline, MdRemoveCircleOutline} from 'react-icons/md';

const SourceTableForm = ({action, currentSourceTable, viewSource = false,sourceTableDetailsChanged, isInValid}) => {
  const [sourceTable, setSourceTable] = useState(currentSourceTable);
  const [inputValue, setInputValue] = useState('');
  const [open, setOpen] = useState(false);
  const isManagedEgress = action?.value === "managed egress";
  
  useEffect(() => {
    sourceTableDetailsChanged(sourceTable)
  }, [sourceTable]);
  
  const createOption = (label) => ({label, value: label});
 
  const handleKeyDown = (event) => {
    if (!inputValue) return;
    switch (event.key) {
      case 'Enter':
      case 'Tab':
        setInputValue(' ');
        setSourceTable({
          ...sourceTable,
          columns: [...(!!sourceTable.columns ? sourceTable.columns : []), createOption(inputValue)]
        });
        event.preventDefault();
    }
  };

  return (
    <>
      <Form.Row>
        <Form.Group as={Col}>
          <Form.Label>Schema</Form.Label>
          <small>
            <i
              style={{
                color: "#909090",
                fontSize: "90%",
                margin: 0,
                paddingLeft: "5px",
              }}
            >
              {" "}
              Case Sensitive
            </i>
          </small>
          <ValidatedInput
            component={Form.Control}
            id="dbSchemaName"
            type="text"
            placeholder="Schema Name"
            defaultValue={sourceTable.dbSchemaName}
            onBlur={(e) =>
              setSourceTable({ ...sourceTable, dbSchemaName: e.target.value })
            }
            invalidMessage="Must provide database schema"
            isInvalid={isInValid("schema")}
          />
        </Form.Group>
        <Form.Group as={Col}>
          <Form.Label>{viewSource ? "View" : "Table"}</Form.Label>
          <small>
            <i
              style={{
                color: "#909090",
                fontSize: "90%",
                margin: 0,
                paddingLeft: "5px",
              }}
            >
              {" "}
              Case Sensitive
            </i>
          </small>
          <ValidatedInput
            component={Form.Control}
            id="dbTableName"
            type="text"
            placeholder="Table Name"
            defaultValue={sourceTable.dbTableName}
            onBlur={(e) =>
              setSourceTable({ ...sourceTable, dbTableName: e.target.value })
            }
            invalidMessage="Must provide table name"
            isInvalid={isInValid("tableName")}
          />
        </Form.Group>
      </Form.Row>
      {!isManagedEgress && (
        <Form.Group>
          <Form.Check
            id="all-columns-check"
            custom
            checked={!!sourceTable.isColumnSelect}
            type="checkbox"
            label="All Columns"
            onChange={({ target: { checked } }) =>
              setSourceTable({ ...sourceTable, isColumnSelect: checked })
            }
          />
        </Form.Group>
      )}
      {!sourceTable.isColumnSelect && (
        <Form.Group key="cloumnToAdd">
          <Form.Label>Columns To Add</Form.Label>
          <ValidatedInput
            id="dbColumns"
            component={Select}
            isClearable
            options={[]}
            isMulti={true}
            createable={true}
            menuIsOpen={false}
            placeholder="Type Source Column and press enter..."
            onChange={(item) =>
              setSourceTable({ ...sourceTable, columns: item })
            }
            onInputChange={(val) => setInputValue(val)}
            onKeyDown={(event) => handleKeyDown(event)}
            inputValue={inputValue}
            value={sourceTable.columns}
          />
        </Form.Group>
      )}
      {!isManagedEgress && (
        <Form.Row>
          <div style={{ justifyContent: "center" }}>
            <div className="mb-0" style={{ display: "inline-block" }}>
              <Button
                style={{ margin: 0, padding: "0 0 7px 0" }}
                onClick={() => setOpen(!open)}
                aria-controls="mdi-collapse-control"
                aria-expanded={open}
                variant="link"
              >
                {open ? <MdRemoveCircleOutline /> : <MdAddCircleOutline />}
              </Button>
            </div>
            <div className="mb-0" style={{ display: "inline-block" }}>
              <h4 style={{ margin: 0, paddingLeft: "5px" }}>
                Table Settings{" "}
                <small>
                  <i style={{ color: "#909090", fontSize: "70%" }}>Optional</i>
                </small>
              </h4>
            </div>
          </div>
        </Form.Row>
      )}
      <Collapse in={open}>
        <Card>
          <Card.Body className="bg-light">
            <Form.Group>
              <Form.Label>
                Table Filter{" "}
                <OverlayTrigger
                  placement="right"
                  overlay={
                    <Tooltip id={`table-filter-tooltip-key`}>
                      column prefixed with '$' e.g. $name = 'my_record'
                    </Tooltip>
                  }
                >
                  <span style={{ marginRight: "3px" }}>
                    <MdInfoOutline />
                  </span>
                </OverlayTrigger>
              </Form.Label>
              <Form.Control
                id="dbColumnFilter"
                as="textarea"
                placeholder="Sql Where Clause.."
                key="filter"
                component={Form.Control}
                defaultValue={sourceTable.tableFilter || ""}
                onBlur={(e) =>
                  setSourceTable({
                    ...sourceTable,
                    tableFilter: e.target.value,
                  })
                }
              />
            </Form.Group>
          </Card.Body>
        </Card>
      </Collapse>
    </>
  );
};

export default SourceTableForm; 