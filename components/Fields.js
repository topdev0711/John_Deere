import { MdVpnKey } from "react-icons/md";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import VisualDiff from 'react-visual-diff';
import utils from './utils';
import { FaQuestion } from "react-icons/fa";

const isNullOrNone = (value) => {
  return ['None', '', null, undefined].includes(value)
}

const Fields = (
  { fields = [], showDiff = false, added = '', removed = '', previous = '', diffFormatter = '' }
) => {
  return (
    <table className="text-muted">
      <tbody>
      {fields.map(field => {
        const { id, datatype: originalDatatype, attribute: originalAttribute, precision, scale, nullable } = field;
        const prevField = (previous || {fields: []}).fields.find(f => f.name === field.name) || {};
        const datatype = originalDatatype.name || originalDatatype;
        const attribute = originalAttribute.name || originalAttribute;
        const icon = utils.getIconForDataTypeName(datatype);
        const isId = attribute === 'id';
        const isNullable = !!nullable;
        return (
          <tr key={field.id}>
            <td key={field.name + 'icon'} valign="top" style={{ border: 0, whiteSpace: 'nowrap', textAlign: 'right' }} >
              <i style={{ color: '#bbb', marginRight: '8px' }}>
                {isId &&
                  <OverlayTrigger
                    placement="top"
                    overlay={
                      <Tooltip id={`tooltip-key-${id}`}>
                        Unique Identifier
                      </Tooltip>
                    }
                  >
                    <span style={{ marginRight: '3px' }}><MdVpnKey /></span>
                  </OverlayTrigger>
                }
                {isNullable &&
                  <OverlayTrigger
                    placement="top"
                    overlay={
                      <Tooltip id={`tooltip-null-${id}`}>
                        Allows Missing Values
                      </Tooltip>
                    }
                  >
                    <span style={{ marginRight: '3px' }}><FaQuestion size="12" /></span>
                  </OverlayTrigger>
                }
                <OverlayTrigger
                  placement="top"
                  overlay={
                    <Tooltip id={`tooltip-type-${id}`}>
                      {datatype}{datatype === 'decimal' && ` (${precision}, ${scale})`}
                    </Tooltip>
                  }
                >
                  {icon}
                </OverlayTrigger>
              </i>
            </td>
            <td key={field.name + 'name'} valign="top" style={{ border: 0 }} >
              <span style={{ fontWeight: 'bolder' }}>
                {showDiff &&
                  <VisualDiff
                    left={<span>{!added && prevField.name}</span>}
                    right={<span>{!removed && field.name}</span>}
                    renderChange={diffFormatter}
                  />
                }
                {!showDiff && field.name}
              </span>
              <span style={{ marginLeft: '8px', color: '#aaa' }}>
                {showDiff &&
                  <VisualDiff
                    left={<i>{!added && !isNullOrNone(prevField.description) && prevField.description}</i>}
                    right={<i>{!removed && !isNullOrNone(field.description) && field.description}</i>}
                    renderChange={diffFormatter}
                  />
                }
                {!showDiff &&
                  <i>{!isNullOrNone(field.description) && field.description}</i>
                }
              </span>
            </td>
          </tr>
        )
      })}
      </tbody>
    </table>
  )
};

export default Fields;