import { OverlayTrigger, Tooltip } from "react-bootstrap";

const ValidatedInput = ({ component: Component, invalidMessage, invalidPopover, refContext, ...props }) => {
  return (
   
    <>
      {!invalidPopover &&
        <>
          <Component
            {...props}
            className={!!props.isInvalid ? 'is-invalid' : ''}
            ref={refContext}
          />
          <div hidden={!props.isInvalid} style={{ display: !!props.isInvalid ? 'block' : 'none' }} className="invalid-feedback">
            {invalidMessage}
          </div>
        </>
      }
      {!!invalidPopover &&
        <OverlayTrigger
          placement="top"
          overlay={
            <Tooltip hidden={!props.isInvalid} className="tooltip-invalid">
              {invalidMessage}
            </Tooltip>
          }
        >
          <span className={!!props.isInvalid ? 'is-invalid' : ''} style={{width: '100%'}}><Component
            {...props}
          /></span>
        </OverlayTrigger>
      }
    </>
  )
}

export default ValidatedInput;
