import { Button, OverlayTrigger, Tooltip } from "react-bootstrap";
import { MdContentCopy } from "react-icons/md";
import uuid from 'uuid';
import React from 'react';
import utils from './utils';

const styles = {
  copied: { marginLeft: '32px', marginRight: '32px' }
}

const CopyableText = ({children}) => {
  const [clicked, setClicked] = React.useState(false)

  React.useEffect(() => {
    if (clicked) {
      setTimeout(setClicked.bind(null, false), 1000)
    }
  }, [clicked])

  return (
    <>
      {children}
      <OverlayTrigger
        placement="top"
        overlay={
          <Tooltip id={`tooltip-key-${uuid.v4()}`}>
            {clicked ? <span style={styles.copied}>Copied!</span> : 'Copy to clipboard'}
          </Tooltip>
        }
      >
        <Button
          style={{ marginTop: '-5px' }}
          size="sm"
          variant="link"
          onClick={() => {
            setClicked(true);
            const doc = utils.getDocument()
            const dummy = doc.createElement("input");
            doc.body.appendChild(dummy);
            dummy.setAttribute('value', children);
            dummy.select();
            doc.execCommand("copy");
            doc.body.removeChild(dummy);
          }}
        >
          <MdContentCopy />
        </Button>
      </OverlayTrigger>
    </>
  )
}

export default CopyableText;
