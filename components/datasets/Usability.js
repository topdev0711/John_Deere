import { BiCheck, BiX } from "react-icons/bi";
import React from "react";
import { Button, OverlayTrigger, Popover } from "react-bootstrap";
import { MdAddTask } from "react-icons/md";

const usabilitySpanDefault = { position : 'absolute', top : 5, right : 20 };
const usabilityPopover = { borderRadius: 5, height: 150 };
const usabilityPopoverTitle = { fontSize: 10 };
const usabilityPopoverContent = { position : 'absolute', top : 60 };
const lineBreak = <br></br>;
const fieldSpacing = ' ';
const messages = {
  description: 'Has a description',
  documentation: 'Has documentation'
};

const createDisplayItem = ({field, passesCriteria}) => {
  const dimensionPass = passesCriteria ? <BiCheck size="18" color="green"/> : <BiX size="18" color="red"/>;
  const fieldMessage = messages[field] || field.charAt(0).toUpperCase() + field.slice(1);
  return [<span> {lineBreak} {fieldSpacing} {dimensionPass} {fieldSpacing} {fieldMessage} </span>];
};

const createDisplay = dimensions => dimensions.map(createDisplayItem);

const usabilityTitle = <>Usability is a score assigned to a dataset that indicates how easy it will be for others to understand the purpose of your data.
                          For more details refer to our <a href="https://confluence.deere.com/x/JNOVDw" target="_blank">help</a> documentation.
                       </>

const popover = dimensions => (
  <Popover className="usabilityPopover" style={usabilityPopover} placement="bottom">
    <Popover.Title style={usabilityPopoverTitle}><i>{usabilityTitle}</i></Popover.Title>
    <Popover.Content className="popoverClass" style={usabilityPopoverContent}>{createDisplay(dimensions)}</Popover.Content>
  </Popover>
);

const Usability = ({usabilityDetails, buttonVariant = "light", usabilitySpan = usabilitySpanDefault}) => {
  const {usability, dimensions} = usabilityDetails;
  const overlay = dimensions?.length ? popover(dimensions) : false;
  return (
      <OverlayTrigger key={`usability-${usability}`} trigger="click" rootClose placement="bottom" delay="200" overlay={overlay}>
        <span className="usabilitySpan" style={usabilitySpan}>
          <Button variant={buttonVariant} id="displayUsabilityButton">
            <span><MdAddTask size="20"/> Usability: {usability}</span>
          </Button>
        </span>
      </OverlayTrigger>
  )
};

export default Usability;
