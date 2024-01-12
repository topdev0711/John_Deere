import {Button, OverlayTrigger, Tooltip} from "react-bootstrap";

const nonPublicStyle = {
  padding: 0
}

// pointerEvents required for tooltip to appear when button is disabled
const publicStyle = {
  padding: 0,
  pointerEvents: 'none'
}

const AddClassificationButton = ({onClick, isPublicDataset, style}) => {
  return <Button id="addClassification" style={style} onClick={onClick} size="sm" variant='link'
                 disabled={isPublicDataset}>+ Add Another Classification</Button>
}

const AddClassificationLink = ({onClick, isPublicDataset}) => {
  if (!isPublicDataset) return <AddClassificationButton onClick={onClick} isPublicDataset={isPublicDataset} style={nonPublicStyle}/>

  return (
    <OverlayTrigger
      placement='top'
      trigger={['focus','hover']}
      overlay={
        <Tooltip id='tooltip-disabled-add-classification'>
          Unable to add additional classification, public GICP grants access to all users.
        </Tooltip>}
    >
        <span>
          <AddClassificationButton onClick={onClick} isPublicDataset={isPublicDataset} style={publicStyle}/>
        </span>
    </OverlayTrigger> )
}

export default AddClassificationLink;
