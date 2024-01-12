import { Button, OverlayTrigger, Tooltip } from "react-bootstrap";
import uuid from 'uuid';
import utils from './utils';

const EmailableText = ({ children, email, placement }) => {
  return <>
    <OverlayTrigger
      id={`${email}-tip-trigger`}
      placement={placement ? placement : "top"}
      overlay={
        <Tooltip id={`tooltip-key-${uuid.v4()}`}>
          Send Email to {children}
        </Tooltip>
      }
    >
      <Button
        style={{ margin: '-7px', marginTop: '-11px', color: '#666' }}
        size="sm"
        variant="link"
        onClick={() => {
          utils.sendEmail(!!email ? `mailto:${email}` : `mailto:${children.replace(/\s/g, '')}@deere.com`)
        }}
      >
        {children}
      </Button>
    </OverlayTrigger>
  </>;
} 

export default EmailableText;
