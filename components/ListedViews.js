import React , { useState, useEffect } from 'react';
import { Row, Col, Button } from "react-bootstrap";

const styles = {
  driftedDeletedViewColor: { marginLeft: '8px', color: '#c21020' }
};

const ListedViews = (
  { views, prevViews = [], showDiff = false,  changeDetectedCallback = () => false }
) => {
  const [showAll, setShowAll] = useState(false);
  const visibleViews = showAll ? views: views.slice(0, 10)
  useEffect(() => {
    const hasChanges = (prevViews.length !== views.length) || (views.toString() !== prevViews.toString());
    changeDetectedCallback(hasChanges);
  }, [views]);

  function returnViews(view) {
    switch (view.status) {
      case 'DRIFTED':
        return (<>{view.name} <span style={styles.driftedDeletedViewColor}><i> (Drifted)</i></span> </>);
        break;
      case 'DELETED':
        return (<>{view.name} <span style={styles.driftedDeletedViewColor}><i> (Deleted)</i></span> </>);
        break;
      default:
        return (<>{view.name} </>);
    }
  }

  return (
      <>
        <div>
          <ul style={{paddingTop: '5px'}}>
            {prevViews.map(view => {
              if (showDiff && !views.find(v => v.name === view.name )) {
                return (<Col id="removedViews"><Row><li> <div style={{padding: '0.3em', background: '#FFEEEE', color: '#BD2E28', display: 'inline-block'}}> <i>{returnViews(view)} </i> </div> </li></Row></Col>)
              } 
            })}
            {visibleViews.map(view =>{
              if (showDiff && !prevViews.find(preView => preView.name === view.name)) {
                return (<Col id="addedViews"><Row><li> <div style={{padding: '0.3em', background: '#EAF7E8', color: '#367C2B', display: 'inline-block'}}> <i>{returnViews(view)} </i> </div> </li></Row></Col>)
              }
              return (<Col id="views"><Row><li className="mb-1">{ returnViews(view) } </li></Row></Col>)
            })}
            {visibleViews.length < views.length &&
              <Col id="views" className="float-center">
                <Button
                  style={{ marginTop: '-5px' }}
                  size="sm"
                  onClick={() => setShowAll(true)}
                  variant="tabs">
                  Show remaining {views.length - visibleViews.length} views...
                </Button>
              </Col>
            }
          </ul>
        </div>
      </>
  )
};

export default ListedViews;