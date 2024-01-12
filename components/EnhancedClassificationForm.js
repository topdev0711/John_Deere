import React from 'react';
import Select from './Select';
import { Row, Col, Form, Button } from 'react-bootstrap';
import { AppStateConsumer } from './AppState';
import ValidatedInput from './ValidatedInput';
import utils from './utils';
const { uniqBy } = require("lodash");

const gicpLabels = {
  '7ef24262-e13e-43a6-b0e9-dcfc0638a46f': 'Highly Confidential: Highly sensitive',
  '5f48ffda-9c01-4416-89e9-326d0a7bcd3c': 'Confidential: Sensitive information',
  'e43046c8-2472-43c5-9b63-e0b23ec09399': 'Company Use: Minimally sensitive information',
  '10710b7a-7391-4860-a18d-1d7edc746fe7': 'Public: Non-sensitive information (Note: If public is selected, everyone will have access and no other additional classification are allowed)'
};
export class EnhancedClassificationForm extends React.Component {
  state = {
    community: null,
    gicp: null,
    subCommunity: null,
    countriesRepresented: [],
    additionalTags: [],
    personalInformation: false,
    development: false,
    personalInformationDisabled: false,
    personalInformationPreviousState : false
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

  handleGICPChange = (value) => {
    if(value.name === "Public") {
      this.setState({["personalInformationPreviousState"]: this.state["personalInformation"]});
      this.setState({["personalInformation"]: false }, () => {
        this.props.onChange('personalInformation', false);
      });
      this.setState({["personalInformationDisabled"]: true });
    }
    else {
      const prevState = this.state["personalInformationPreviousState"];
      this.setState({["personalInformation"]: prevState}, () => {
        this.props.onChange('personalInformation', prevState);
      });
      this.setState({["personalInformationDisabled"]: false });
    }
  };

  handleChange = (field, kind) => {
    return (event) => {
      const value = this.getValue(field, kind, event);     
      const onChangeCallback = () => {
        this.props.onChange(field, value);
        if (field === 'community') this.handleCommunityChange();
        if (field === 'gicp') this.handleGICPChange(value);        
      }
      this.setState({[field]: value}, onChangeCallback);
      if(field === "personalInformation") this.setState({["personalInformationPreviousState"]: value});
    };
  }

  componentDidMount() {
    const { defaultValue: vals } = this.props;

    const modified = Object.assign({}, vals, {
      additionalTags: (vals.additionalTags || []).map(tag => {
        return (typeof tag === 'string') ? ({ value: tag, label: tag }) : tag;
      })
    });
    if(modified.gicp?.id === "10710b7a-7391-4860-a18d-1d7edc746fe7") {
      modified.personalInformation = false;
      this.setState({["personalInformationDisabled"]: true });
    }
    this.setState({ ...modified , personalInformationPreviousState: modified.personalInformation });
  }

  render() {
    const { communities, countries } = this.props.referenceData;
    const errors = this.props.errors || [];
    const subCommDisabled = !this.state.community || !this.state.community.id;
    const gicpOpts = utils.createGicpOpts({getDeprecated : false});

    if (this.props.gicpPublicDisabled) {
      const gicpPublicId = "10710b7a-7391-4860-a18d-1d7edc746fe7";
      const gicpPublic = gicpOpts.map((group) => group.options).flat().find((opt) => opt.id === gicpPublicId);
      gicpPublic.isDisabled = true;
    }

    gicpOpts.map((group) => group.options).flat().forEach((opt) => { opt.label = gicpLabels[opt.id] || opt.name });

    const form = [
      [
        {
          label: 'Community',
          key: "community",
          opts: communities,
          props: {
            isInvalid: errors.some(err => err.context.key === 'community'),
            invalidMessage: 'Must select a community',
            placeholder: 'Select a community'
          },
          required: true,
        },
        {
          label: 'GICP (Global Information Classification Policy)',
          key: "gicp",
          opts: gicpOpts,
          props: {
            isSorted: true,
            isInvalid: errors.some(err => err.context.key === 'gicp'),
            invalidMessage: 'Must select a GICP value',
            placeholder: 'Select a GICP classification'
          },
          required: true,
          extra: <a href='https://deere.sharepoint.com/sites/Compliance-Center-for-Global-Business-Conduct/SitePages/Global-Information-Classification-Resources.aspx' target='_blank' className='btn btn-link' style={{padding: 0, marginLeft: '1rem', fontWeight: 'normal', marginTop: '-0.375rem'}}>GICP Policy</a>
        }
      ],
      [
        {
          label: 'Sub-Community',
          key: "subCommunity",
          opts: this.subCommunitiesOptions(),
          props: {
            isDisabled: subCommDisabled,
            placeholder: subCommDisabled ? 'Select a sub-community' : 'Select...' ,
            isInvalid: errors.some(err => err.context.key === 'subCommunity'),
            invalidMessage: 'Must select a valid sub-community'
          },
          required: true,
        },
        {
          label: 'Countries Represented',
          key: "countriesRepresented",
          opts: countries,
          props: { isMulti: true, placeholder: 'Select or enter countries' }
        }
      ],
      [
        {
          label: 'Additional Tags',
          key: "additionalTags",
          opts: [],
          props: { isMulti: true, createable: true, placeholder: 'Additional tags for further classification...', noOptionsMessage: () => "Type a value and press enter..." }
        },
        [
          {
            label: '',
            kind: 'label',
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
        ]
      ]
    ];

    const renderForm = f => {
      if (Array.isArray(f)) {
        return (
          <Col>
            {f.map(renderForm)}
          </Col>
        );
      }
      if (f.kind === 'label') {
        return (
          <Form.Label>{f.label}</Form.Label>
        )
      }
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
              disabled={this.state[`${f.key}Disabled`] === true}
            />
          </Form.Group>
        );
      }
      return (
        <Form.Group key={f.key} as={Col} controlId={`formGrid${f.key}`}>
          <Form.Label>
            {f.label}
            {f.required && <span style={{color: 'red'}}>&nbsp;*</span>}
            {!!f.extra && f.extra}
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
    };

    return (
      <>
        {this.props.showRemoveButton && (
          <div style={{display: 'flex', justifyContent: 'end'}}>
            <Button variant='link' style={{padding: 0}} onClick={this.props.onRemove}>X Remove Classification</Button>
          </div>
        )}
        {form.map((row) => (
          <Row>
            {row.map(renderForm)}
          </Row>
        ))}
        <hr />
      </>
    );
  }
}

/* istanbul ignore next */
const EnhancedClassificationFormComponent = props => <AppStateConsumer>
  { ctx => <EnhancedClassificationForm {...props} referenceData={ctx.referenceData} /> }
</AppStateConsumer>;

export default EnhancedClassificationFormComponent;
