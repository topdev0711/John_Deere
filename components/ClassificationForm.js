import React from 'react';
import Select from './Select';
import { Col, Form } from 'react-bootstrap';
import { AppStateConsumer } from './AppState';
import ValidatedInput from './ValidatedInput';
import utils from './utils';
const { uniqBy } = require("lodash");

export class ClassificationForm extends React.Component {
  state = {
    community: null,
    gicp: null,
    subCommunity: null,
    countriesRepresented: [],
    additionalTags: [],
    personalInformation: false,
    development: false
  }

  subCommunitiesOptions = () => {
    const { communities } = this.props.referenceData;
    const block = this.state;
    const selectedCommunityId = block.community ? block.community.id : null;
    const selectedCommunity = communities.find(c => c.id === selectedCommunityId);
    const opts = selectedCommunity ? selectedCommunity?.subCommunities?.filter(subcomm => subcomm.enabled) : [];
    return opts;
  }

  handleAdditionalTagsChange = (event)  => {
    const tags = (event || []).map(tag => {
      tag.value = tag.value.trim();
      tag.label = tag.label.trim();
      return tag;
    }).filter(tag => tag.value.length);

    return uniqBy(tags, 'label');
  };

  getValue(field, kind, event) {
    if (field === 'additionalTags') return this.handleAdditionalTagsChange(event);
    if (kind === 'checkbox') return event.target.checked;
    return event;
  }

  handleCommunityChange = () => {
    this.setState({subCommunity: null}, () => {
      this.props.onChange('subCommunity', null);
    });
  };

  handleChange = (field, kind) => {
    return (event) => {
      const value = this.getValue(field, kind, event);
      const onChangeCallback = () => {
        this.props.onChange(field, value);
        if (field === 'community') this.handleCommunityChange();
      }

      this.setState({[field]: value}, onChangeCallback);
    };
  }

  componentDidMount() {
    const { defaultValue: vals } = this.props;

    const modified = Object.assign({}, vals, {
      additionalTags: (vals.additionalTags || []).map(tag => {
        return (typeof tag === 'string') ? ({ value: tag, label: tag }) : tag;
      })
    });

    this.setState({ ...modified });
  }

  render() {
    const { communities, countries } = this.props.referenceData;
    const errors = this.props.errors || [];
    const subCommDisabled = !this.state.community || !this.state.community.id;

    const form = [
      {
        label: 'Community',
        key: "community",
        opts: communities,
        props: {
          isInvalid: errors.some(err => err.context.key === 'community'),
          invalidMessage: 'Must select a community'
        },
        required: true
      },
      {
        label: 'Sub-Community',
        key: "subCommunity",
        opts: this.subCommunitiesOptions(),
        props: {
          isDisabled: subCommDisabled,
          placeholder: subCommDisabled ? 'Select a community' : 'Select...' ,
          isInvalid: errors.some(err => err.context.key === 'subCommunity'),
          invalidMessage: 'Must select a valid sub-community'
        },
        required: true
      },
      {
        label: 'GICP',
        key: "gicp",
        opts: utils.createGicpOpts({getDeprecated : true}),
        props: {
          isSorted: true,
          isInvalid: errors.some(err => err.context.key === 'gicp'),
          invalidMessage: 'Must select a GICP value',
        },
        required: true
      },
      {
        label: 'Countries Represented',
        key: "countriesRepresented",
        opts: countries,
        props: { isMulti: true, placeholder: '(Optional) Select...' }
      },
      {
        label: 'Additional Tags',
        key: "additionalTags",
        opts: [],
        props: { isMulti: true, createable: true, placeholder: '(Optional) Additional tags for further classification...', noOptionsMessage: () => "Type a value and press enter..." }
      },
      {
        label: 'Personal Information',
        key: 'personalInformation',
        kind: 'checkbox'
      },
      {
        label: 'Development',
        key: 'development',
        kind: 'checkbox'
      }
    ];

    return (
      <>
        {form.map(f => {
          if (f.kind === 'checkbox') {
            return (
              <Form.Group key={f.key} as={Col} id={`formGrid${f.key}`}>
                <Form.Check
                  checked={this.state[f.key] === true}
                  onChange={this.handleChange(f.key, 'checkbox')}
                  type="checkbox"
                  id={`custom-checkbox-${f.key}-${Date.now()}`}
                  custom
                  label={f.label}
                />
              </Form.Group>
            );
          }
          return (
            <Form.Group key={f.key} as={Col} controlId={`formGrid${f.key}`}>
              <Form.Label>
                {f.label}
                {f.required && <span style={{color: 'red'}}>&nbsp;*</span>}
                </Form.Label>
              <ValidatedInput
                component={Select}
                {...f.props}
                value={this.state[f.key]}
                onChange={this.handleChange(f.key)}
                options={f.opts || []}
              />
            </Form.Group>
          );
        })}
        <br />
      </>
    );
  }
}

/* istanbul ignore next */
const ClassificationFormComponent = props => <AppStateConsumer>
  { ctx => <ClassificationForm {...props} referenceData={ctx.referenceData} /> }
</AppStateConsumer>;

export default ClassificationFormComponent;
