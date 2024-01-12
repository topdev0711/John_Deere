// Unpublished Work © 2022 Deere & Company.
import { Container, Row, Col } from '@deere/ux.uxframe-react';
import React, { useEffect, useState } from 'react';
import { OverlayTrigger, Popover } from "react-bootstrap";

const DiagramNode = ({ namespace, attributes }) => {
    const [attributeList, setAttributeList] = useState([]);

    useEffect(() => {
        const nodeDetails = attributes.map((attribute, index) => {
            return (
                <Row key={"attr-" + index} className='lineage-popover-grid-row'>
                    <Col md={8}>{attribute.label}</Col>
                    <Col>{attribute.value}</Col>
                </Row>
            )
        });
        setAttributeList(nodeDetails);
    }, [attributes]);

    return (
        <OverlayTrigger placement="right"
            className="diagram-node-overlay"
            delay={{ show: 100, hide: 300 }}
            overlay={
                <Popover className="diagram-node-popover" id="diagram-node-popover">
                    <Popover.Title>Details</Popover.Title>
                    <Popover.Content className="no-padding">
                        <Container className="no-padding container-padding">
                            {
                                attributeList.length > 0 ? attributeList : <p style={{
                                    textAlign: 'center',
                                    padding: '0.5em',
                                    margin: '0'
                                }}>No additional fields</p>
                            }
                        </Container>
                    </Popover.Content>
                </Popover>
            }
        >
            <div className="diagram-node" id="diagram-node">{namespace}</div>
        </OverlayTrigger>
    );
}

export default DiagramNode;