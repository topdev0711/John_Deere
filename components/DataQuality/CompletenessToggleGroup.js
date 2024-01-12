import {ToggleButton, ToggleButtonGroup} from "react-bootstrap";

const CompletenessToggleGroup = ({completenessSelection, setCompletenessSelection}) => {
  const handleCompletenessSelection = selection => setCompletenessSelection(selection);
  return <ToggleButtonGroup orientation="horizontal" name='completeness-selection' value={completenessSelection} onChange={handleCompletenessSelection}>
    <ToggleButton id="percentage" value="percentage" size="sm" variant="outline-primary">Percentage</ToggleButton>
    <ToggleButton id="count" value="count" size="sm" variant="outline-primary">Row Count</ToggleButton>
  </ToggleButtonGroup>
}

export default CompletenessToggleGroup;
