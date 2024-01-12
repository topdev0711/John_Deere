import React, { Fragment, useState, useEffect } from 'react'
import { Card, Button, Col, Row, Accordion as ReactAccordion } from 'react-bootstrap'
import { MdKeyboardArrowDown, MdKeyboardArrowUp } from 'react-icons/md'
import SearchBar from './SearchBar'

const Accordion = props => {
  const [active, setActive] = useState()
  const [filteredIds, setFilteredIds] = useState()

  useEffect(() => {
    setActive(props.activeKey || '')
  }, [props.activeKey])

  const toggleActive = (id) => {
    setActive(active === id ? '' : id)
  }

  return (
    <>
      {!!props.filterable &&
        <div hidden={props.items.length < 5}>
          <SearchBar
            style={{maxWidth: '250px', marginTop: '-5px', float: 'right', borderColor: '#ccc'}}
            key={props.items.length}
            placeholder="Filter..."
            size="sm"
            items={props.items.map(item => item.filterContent)}
            onChange={filteredItems => {
              setFilteredIds(filteredItems.map(f => f.id))
            }}
          />
          <br/>
        </div>
      }
      <ReactAccordion activeKey={active} style={{ border: 0 }}>
        {(props.items || []).filter(({ id }) => !filteredIds || filteredIds.includes(id)).map((item, idx) =>
          <Fragment key={item.id}>
            <Card id={item.id} style={{ overflow: 'initial', marginBottom: '12px' }}>
              <ReactAccordion.Toggle as={Card.Header} className={`accordion-header ${!!item.invalid ? 'invalid' : ''} ${!!item.isModified ? 'is-modified' : ''}  ${!!item.isRemoved ? 'is-removed' : ''} ${!!item.isNew ? 'is-new' : ''} bg-light`} eventKey={item.id} onClick={() => toggleActive(item.id)}>
                <Row>
                  <Col>
                    {item.header}
                    {!!item.headerAccessory &&
                    <span className="d-block d-md-none">
                      <span testlocator="headerAccessory" style={{ fontSize: '9pt', color: 'gray' }}>{item.headerAccessory}</span>
                    </span>
                    }
                  </Col>
                  <Col className="justify-content-right align-self-center">
                    <span className="float-right" style={{ marginTop: '6px', whiteSpace: 'nowrap', fontSize: '9pt', color: 'gray' }}>
                    {!!item.headerAccessory && <span className="d-none d-md-inline">{item.headerAccessory} </span>}{item.id === active ? <MdKeyboardArrowUp size="20" /> : <MdKeyboardArrowDown size="20" />}
                    </span>
                  </Col>
                </Row>
              </ReactAccordion.Toggle>
              <ReactAccordion.Collapse eventKey={item.id}>
                <div style={{borderTop: '1px solid #ddd'}}>
                <Row style={{marginRight: 0, marginLeft: 0}}>
                  <span hidden={!item.actions} style={{ whiteSpace: 'nowrap' }} style={{width: '100%', padding: '8px', paddingRight: '12px'}}>
                    <span className="float-right">
                      {(item.actions || []).map((act, i) =>
                        <Button style={{marginRight: '8px'}} key={i} size="sm" variant="outline-primary" disabled={!!act.disabled} onClick={act.handler}>{act.icon}&nbsp;&nbsp;{act.text}</Button>
                      )}
                    </span>
                  </span>
                </Row>
                <Card.Body style={{ borderBottom: '1px solid rgba(0,0,0,.125)', marginTop: !!item.actions ? '-18px' : '0px' }}>
                  {(active === item.id || idx === 0) && item.body}
                </Card.Body>
                </div>
              </ReactAccordion.Collapse>
            </Card>
          </Fragment>
        )}
      </ReactAccordion>
    </>
  )
}
export default Accordion;
