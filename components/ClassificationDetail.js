import React from 'react'
import {Card, Row, Col, Badge} from "react-bootstrap"
import Accordion from "./Accordion"
import { Form } from "react-bootstrap"
import { MdContentCopy,MdAddCircleOutline,MdUpdate,MdRemoveCircleOutline } from "react-icons/md"
import VisualDiff from 'react-visual-diff';
import diff from 'deep-diff';

const diffFormatter = ({ type, children }) => {
  return <code className={type !== 'added' ? 'code-remove': ''}>{children}</code>
}

const diffPrefilter = (path, key) => {
  return ['added', 'removed', 'isNew'].includes(key);
}

const GovDetail = (props) => (
  <div {...props} style={{ paddingBottom: '5px' }}>{props.children}</div>
)

const tagBadge = (tag, index) => (
  <Badge key={`additional-tag-${index}`} style={{backgroundColor: '#eee', fontWeight: 'semibold', marginRight: '5px'}}>{tag}</Badge>
)

const additionalTagsDisplay = (block) => {
  if (block && block.additionalTags && block.additionalTags.length) {
    const badges = block.additionalTags.map((tag, index) => tagBadge(tag, index))
    return (
      <span>
        {badges}
      </span>
    )
  }
  return '-'
}

const showCountries = (block) => {
  if (block && block.countriesRepresented && block.countriesRepresented.length) {
    return (
      <span>
        <i>{block.countriesRepresented.join(', ')}</i>
      </span>
    )
  }
  return '-'
}

const Details = ({block}) => (
  <div className="text-muted small">
    <GovDetail><b>GICP:</b> <i>{ block && block.gicp ? block.gicp.name : '-'}</i></GovDetail>
    <GovDetail><b>Countries Represented:</b> {showCountries(block)}</GovDetail>
    <GovDetail><b>Additional Tags:</b> {additionalTagsDisplay(block)}</GovDetail>
    <GovDetail><b>Personal Information:</b> <i>{!!block && (!!block.personalInformation).toString()}</i></GovDetail>
    <GovDetail><b>Development:</b> <i>{!!block && (!!block.development).toString()}</i></GovDetail>
  </div>
)

const HeaderContent = ({block}) => (
  <span>
    <span style={{ display: 'block' }} className="text-muted small"><b>Community:</b> <i>{block ? (block.community && block.community.name ? block.community.name : 'None') : ''}</i></span>
    <span style={{ display: 'block' }} className="text-muted small"><b>Sub-Community:</b> <i>{block ? (block.subCommunity && block.subCommunity.name ? block.subCommunity.name : 'None') : ''}</i></span>
  </span>
)

class ClassificationDetail extends React.Component {
  state = {
    selected: []
  }

  handleChange = (item) => {
    const { onSelect, items } = this.props
    const { selected } = this.state
    const newSelected = selected.includes(item.id) ? selected.filter(id => id !== item.id) : selected.concat([item.id])
    this.setState({
      selected: newSelected
    }, () => {
      onSelect(items.filter(item => newSelected.includes(item.id)))
    })
  }

  componentDidUpdate(prev) {
    if (prev.selected && prev.selected.length !== this.props.selected.length) {
      this.setState({ selected: this.props.selected })
    }
  }

  buildDetails = (current, previous, showDiff) => {
    if (showDiff) {
      return (
        <VisualDiff
          left={<Details block={previous}/>}
          right={<Details block={current}/>}
          renderChange={diffFormatter}
        />
      );
    }
    return (
      <Details block={current}/>
    );
  }

  buildHeaderContent = (current, previous, showDiff) => {
    if (showDiff) {
      return (
        <VisualDiff
          left={<HeaderContent block={previous}/>}
          right={<HeaderContent block={current}/>}
          renderChange={diffFormatter}
        />
      );
    }
    return (
      <HeaderContent block={current}/>
    );
  }

  getMergedItems = (items, prevItems) => {
    const fullyRemoved = [...prevItems].filter(({id: prevId}) => !items.some(({id}) => id === prevId)).map(i => ({...i, removed: true}));
    const mutated = [...items].map(i => ({
      ...i,
      added: !prevItems.some(({id: prevId}) => i.id === prevId)
    }));
    return [...mutated, ...fullyRemoved];
  }

  buildHeaderAccessory = (block, hasChanges, showDiff) => {
    if (showDiff) {
      if (block.removed) {
        return (<><MdRemoveCircleOutline style={{marginTop:'-2px'}}/> Removed</>);
      } else if (block.added) {
        return (<><MdAddCircleOutline style={{marginTop:'-2px'}}/> New</>);
      } else if (hasChanges) {
        return (<><MdUpdate style={{marginTop:'-2px'}}/> Modified</>);
      }
    }
    return block.from && <><MdContentCopy/> From {block.from}</>;
  }

  componentDidMount() {
    const {changeDetectedCallback = () => {}, items = [], prevItems = []} = this.props;
    const itemsToCompare = items.map(this.createComparableItem);
    const prevItemsToCompare = prevItems.map(this.createComparableItem);

    const moreOrLessItems = itemsToCompare.length !== prevItemsToCompare.length;
    const hasChanges = moreOrLessItems || itemsToCompare.some(item => {
      return !!diff.diff(item, prevItemsToCompare.find(p => p.id === item.id), diffPrefilter);
    });

    changeDetectedCallback(hasChanges);
  }

  createComparableItem = ({ additionalTags, community, countriesRepresented, development, gicp, id, personalInformation, subCommunity}) => {
    return {
      additionalTags,
      community,
      countriesRepresented: countriesRepresented.map(i => !!i.label ? i.label : i.name),
      development,
      gicp,
      id,
      personalInformation,
      subCommunity
    }
  }

  render() {
    const { selected } = this.state
    const { items = [], selectable, prevItems = [], showDiff } = this.props
    const previousComparableItems = prevItems.map(this.createComparableItem);

    const displayItems = showDiff ? this.getMergedItems(items, prevItems) : items;
    
    return (
      <>
        <Card.Body hidden={!displayItems.length}>
          <Accordion
            filterable
            items={displayItems.map((block, i) => {
              const previous = previousComparableItems.find(({id}) => id === block.id);
              const current = !block.removed && this.createComparableItem(block);
              const hasChanges = showDiff && !!diff.diff(previous, current, diffPrefilter);
              return {
                id: block.id || i,
                headerAccessory: this.buildHeaderAccessory(block, hasChanges, showDiff),
                filterContent: {...block, id: block.id || i},
                isRemoved: showDiff && block.removed,
                isNew: showDiff && block.added,
                isModified: showDiff && !block.removed && !block.added && hasChanges,
                header: (
                  
                  <Row>
                    {!!selectable &&
                      <Col md={{span: 2}}>
                      <span>
                        <Form.Check
                          checked={selected.includes(block.id)}
                          onChange={this.handleChange.bind(this, block)}
                          type="checkbox"
                          id={`custom-checkbox-${block.id}-${Date.now()}`}
                          custom
                          label=""
                        />
                      </span>
                      </Col>
                    }
                    <Col>
                      {this.buildHeaderContent(current, previous, showDiff)}
                    </Col>
                  </Row>
                ),
                body: this.buildDetails(current, previous, showDiff)
              }
            })}
          />
        </Card.Body>
        <Card.Body className="text-muted" hidden={!!displayItems.length}><i>No classifications specified</i></Card.Body>
      </>
    )
  }
}

export default ClassificationDetail;
