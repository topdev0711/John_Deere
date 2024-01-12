import {ToggleButton, ToggleButtonGroup} from "react-bootstrap";

const AllowedPermissionsToggleGroup = ({selectedStatus, handleStatusSelection}) => {

  return(
    <ToggleButtonGroup orientation="horizontal" name="permission-status-selection" value={selectedStatus}
                       onChange={handleStatusSelection}>
      <ToggleButton value="active" size="sm" variant="outline-primary">Active</ToggleButton>
      <ToggleButton value="expired" size="sm" variant="outline-primary">Expired</ToggleButton>
    </ToggleButtonGroup>
  )
}

export default AllowedPermissionsToggleGroup;