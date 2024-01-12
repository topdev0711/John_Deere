import React from 'react'
import { MdBuild, MdKeyboardArrowDown, MdLink, MdVisibility } from "react-icons/md";
import { Modal, Button, Tab, Nav, Dropdown, Col, Row } from "react-bootstrap"
import utils from '../../utils';
import Spacer from "../../Spacer";
import Fields from '../../Fields';
import { marked } from 'marked';
import SchemaUsage from './SchemaUsage';

function generateReactFromJSON(object) {
  return Object.keys(object).reduce((acc, key, index) => {
    const value = object[key];
    const displayValue = value.toString();
    const isNullObject = typeof(value) === 'object' && !Object.keys(value).length;
    if(key === 'path' || !displayValue || isNullObject) return acc;
    if (['string', 'number', 'boolean'].includes(typeof(value))){
      return [...acc, (
        <tr>
          <td className="text-muted small" as="div">{key}: </td>
          <td className="text-muted small" as="div"><i>{displayValue}</i></td>
        </tr>
      )];
    }
    if (value.length) {
      return [...acc, (
        <tr>
          <td className="text-muted small" as="div" style={{ verticalAlign: 'top'}}>{key}: </td>
          <td>
              {value.map((v, i) =>
                <tr key={v + i} className="text-muted small" as="div"><i>{v}</i></tr>
              )}
          </td>
        </tr>
      )];
    }
    return [...acc, (
      <>
        <tr>
          <td className="text-muted small" as="div">
            {index !== 0 &&
              <Spacer height="10px"/>
            }
            <b>{key}</b>
          </td>
        </tr>
        {generateReactFromJSON(value)}
      </>
    )]
  }, []);
}

export default class SchemaModal extends React.Component {
  render() {
    const { schema = {}, show, onCancel, environmentApprovalSchemas } = this.props
    const { id = '', environmentName = '', version = '', partitionedBy = [], fields = [], documentation = '', name = '', discovered = '', glueTables = [] } = schema;
    const description = !utils.isNullOrNone(schema.description) ? schema.description : 'No description provided';
    const glueTable = glueTables.length ? glueTables[0] : {};

    return (
      <Modal show={show} onHide={onCancel} size="xl" className="modal-xl-90ht">
        <Modal.Header closeButton>
          <Modal.Title style={{ height: '40px', fontSize: 'large'}}>
            <div style={{ color: 'green'}}>{name}</div>
            <div style={{ color: '#aaa' }}>
              <small>
                {!!discovered ? '' : version}
                {!!discovered && <span style={{ color: '#aaa' }}><i>Discovered ({utils.formatDate(discovered)})</i></span>}
                {!!schema.linkedFrom && <span style={{ marginLeft: '8px', color: '#aaa' }}><i><MdLink /> Linked</i></span>}
                {!!schema.testing && !discovered && <span style={{ marginLeft: '8px', color: '#aaa' }}><i><MdBuild /> Testing</i></span>}
              </small>
            </div>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body closeButton>
          {!!id &&
            <Tab.Container mountOnEnter={true} unmountOnExit={true} id="schema-container" defaultActiveKey={`schema-${id}`}>
              <Row>
                <Col>
                      <h5>Schema Description</h5>
                      <i className="text-muted">{description}</i>
                      <Spacer height='8px' />
                </Col>
              </Row>
              <hr />
              <Tab.Content key={id} style={{ width: '100%' }}>
                <Tab.Pane eventKey={`schema-${id}`} style={{ boxShadow: 'none', marginTop: '10px'  }}>
                  <Tab.Container mountOnEnter={true} unmountOnExit={true} transition={false} defaultActiveKey={`structure-${id}`}>
                    <Nav id={`${id}tabs`} size="sm" variant="tabs" className="uxf-nav-tabs-medium" style={{ margin: 0 }}>
                      <Nav.Item>
                        <Nav.Link eventKey={`structure-${id}`}>Structure</Nav.Link>
                      </Nav.Item>
                      {!discovered &&
                        <Nav.Item className="d-none d-md-block d-lg-block d-xl-block">
                          <Nav.Link eventKey={`documentation-${id}`}>Documentation</Nav.Link>
                        </Nav.Item>
                      }
                      {environmentName !== undefined && !discovered &&
                        <Nav.Item className="d-none d-md-block d-lg-block d-xl-block">
                          <Nav.Link eventKey={`usage-${id}`}>EDL Usage</Nav.Link>
                        </Nav.Item>
                      }
                      {!!discovered &&
                        <Nav.Item className="d-none d-md-block d-lg-block d-xl-block">
                          <Nav.Link eventKey={`metadata-${id}`}>Metadata</Nav.Link>
                        </Nav.Item>
                      }
                      <Nav.Item className="d-block d-sm-block d-md-none">
                        <Dropdown style={{ border: 0 }}>
                          <Dropdown.Toggle style={{ border: 0, padding: '.375rem 1.25rem', marginTop: '3px' }} variant="success">
                            <span className="align-middle">More&nbsp;<MdKeyboardArrowDown size="18" /></span>
                          </Dropdown.Toggle>
                          <Dropdown.Menu>
                            {!discovered &&
                              <Dropdown.Item><Nav.Link eventKey={`documentation-${id}`}>Documentation</Nav.Link></Dropdown.Item>
                            }
                            {environmentName !== undefined  && !discovered &&
                              <Dropdown.Item><Nav.Link eventKey={`usage-${id}`}>EDL Usage</Nav.Link></Dropdown.Item>
                            }
                            {!!discovered &&
                              <Dropdown.Item><Nav.Link eventKey={`metadata-${id}`}>Metadata</Nav.Link></Dropdown.Item>
                            }
                          </Dropdown.Menu>
                        </Dropdown>
                      </Nav.Item>
                    </Nav>
                    <Tab.Content>
                      <Tab.Pane eventKey={`structure-${id}`}>
                        <Spacer height="20px" />
                        <Fields
                            id={id}
                            fields={fields}
                          />
                      </Tab.Pane>
                      <Tab.Pane eventKey={`documentation-${id}`}>
                        <Spacer height="20px" />
                        <div className="markdown" dangerouslySetInnerHTML={{ __html: marked((!utils.isNullOrNone(documentation) ? documentation : '<i>No additional schema documentation available</i>')) }} />
                      </Tab.Pane>
                      <Tab.Pane eventKey={`usage-${id}`}>
                        <SchemaUsage
                            fields={fields}
                            environmentApprovalSchemas={environmentApprovalSchemas}
                            version={version}
                            schemaEnvironmentName={environmentName}
                            partitionedBy={partitionedBy}
                          />
                      </Tab.Pane>
                      {!!discovered &&
                        <Tab.Pane eventKey={`metadata-${id}`}>
                          <table>
                            <tr>
                              <td className="text-muted small" as="div">
                                <b>General</b>
                                </td>
                            </tr>
                            {generateReactFromJSON(glueTable)}
                          </table>
                        </Tab.Pane>
                      }
                    </Tab.Content>
                  </Tab.Container>
                </Tab.Pane>
              </Tab.Content>
            </Tab.Container>
          }
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onCancel}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    )
  }
}
