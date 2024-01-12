import React from 'react';
import Select from './Select';
import { AppStateConsumer } from './AppState';
import { Card, Row, Col, Form, Button } from 'react-bootstrap';
import utils from './utils';
import { getSourceDBFilters } from './../apis/lineage';

const styles = {
  filterCard: {
    backgroundColor: '#f7f7f7'
  },
  right: {
    float: 'right',
    marginRight: '14px'
  }
}

const initialState = {
  phase: [],
  category: [],
  community: [],
  subCommunity: [],
  gicp: [],
  countriesRepresented: [],
  personalInformation: [],
  development: [],
  access: [],
  roleType: [],
  custodian: [],
  myDataset: [],
  servers: [],
  databases: [],
  tableNames: [],
  lineageFilters: {}
};

export class SearchFilter extends React.Component {
  constructor(props) {
    super(props);
    this.state = initialState;
  }

  componentDidMount() {
    this.setLineageFilters();
  }

  setLineageFilters = async () => {
    const lineageFilters = await getSourceDBFilters();
    const lineageOptions = {};
    Object.keys(lineageFilters).flatMap(key => {
      if (lineageFilters[key]?.constructor.name === 'Array') {
        lineageOptions[key] = lineageFilters[key].flatMap(filter => {
          return { id: filter, name: filter };
        });
      }
    });

    this.setState({ lineageFilters: lineageOptions });
  }

  resetState = () => {
    this.setState({...initialState, lineageFilters: this.state.lineageFilters}, () => {
      const onChange = (this.props.onChange || (() => { }));
      onChange({});
    })
  }

  handleUpdate = (field, values) => {
    this.setState({ [field]: values });
  }

  subCommunityOptions = () => {
    const { referenceData: { communities } } = this.props.context
    const allSubcommunities = this.props.context.referenceData.communities.map(c => c.subCommunities).reduce((a, b) => a.concat(b), []);
    if (this.state.community && this.state.community.length > 0) {
      return communities.filter(allComm => this.state.community.some(selectedComm => selectedComm.id === allComm.id))
        .map(c => c.subCommunities)
        .reduce((a, b) => a.concat(b), []);
    } else {
      return allSubcommunities;
    }
  }

  chunk = (size, array) => {
    let finalArray = []
    for (let i = 0; i < array.length; i += size) {
      let temp = array.slice(i, i + size);
      finalArray.push(temp)
    }
    return finalArray
  }

  applySearch = () => {
    this.props.onChange(this.state);
  }

  getFilters = (referenceData, loggedInUser, hiddenFilters) => {
    const { communities, countries, phases, categories } = referenceData;
    const yesNoOptions = [{ id: true, name: 'true' }, { id: false, name: 'false' }];
    const custodians = loggedInUser.groups.map(group => {
      return {
        id: group,
        name: group
      };
    });
    const roleTypes = [{ id: 'human', name: 'human' }, { id: 'system', name: 'system' }];
    const myDatasets = [
      { id: true, name: 'true', createdBy: loggedInUser.username },
      { id: false, name: 'false', createdBy: loggedInUser.username }
    ];
    const {
      roleType,
      phase,
      gicp,
      category,
      community,
      subCommunity,
      countriesRepresented,
      personalInformation,
      development,
      access,
      custodian,
      myDataset
    } = this.state;

    const filterOptions = [
      { key: 'roleType', label: 'Role Type', options: roleTypes, value: roleType },
      { key: 'phase', label: 'Phase', options: phases, value: phase },
      { key: 'gicp', label: 'GICP', options: utils.createGicpOpts({getDeprecated : true}), value: gicp, isSorted: true },
      { key: 'category', label: 'Category', options: categories, value: category },
      { key: 'community', label: 'Community', options: communities, value: community },
      { key: 'subCommunity', label: 'Sub-Community', options: this.subCommunityOptions(), value: subCommunity },
      { key: 'countriesRepresented', label: 'Country Represented', options: countries, value: countriesRepresented },
      { key: 'personalInformation', label: 'Personal Information', options: yesNoOptions, value: personalInformation },
      { key: 'development', label: 'Development', options: yesNoOptions, value: development },
      { key: 'access', label: 'Access Allowed', options: yesNoOptions, value: access },
      { key: 'custodian', label: 'Custodian', options: custodians, value: custodian },
      { key: 'myDataset', label: 'My Dataset', options: myDatasets, value: myDataset }
    ];

    return this.chunk(2, filterOptions.filter(item => !hiddenFilters.includes(item.key)));
  }

  getLineageFilters = (hiddenFilters) => {
    const {
      servers,
      databases,
      tableNames,
      lineageFilters
    } = this.state;
    const filterOptions = [];
    if (Object.keys(this.state.lineageFilters).length) {
      filterOptions.push({ key: 'servers', label: 'Server', options: lineageFilters.servers, value: servers },
        { key: 'databases', label: 'Database', options: lineageFilters.databases, value: databases },
        { key: 'tableNames', label: 'Table Name', options: lineageFilters.tableNames, value: tableNames }
      );
    }
    return this.chunk(2, filterOptions.filter(item => !hiddenFilters.includes(item.key)));
  }

  render() {
    const { referenceData, loggedInUser } = this.props.context;
    const { hiddenFilters = [] } = this.props;
    const filters = this.getFilters(referenceData, loggedInUser, hiddenFilters);
    const lineageFilters = this.getLineageFilters(hiddenFilters);

    return (
      <>
        <Card>
          <Card.Body style={styles.filterCard}>
            {filters.map((row, rowInd) => (
              <Row key={`row-${rowInd}`}>
                {row.map(column => (
                  <Col key={column.key} md={{ span: 12 }}>
                    <Form.Group as={Col} controlId={`formGrid${column.key}Filter`}>
                      <Form.Label>{column.label}</Form.Label>
                      <Select
                        id={column.key}
                        instanceId={`${column.key}Selector`}
                        options={column.options}
                        value={column.value}
                        isSorted={column.isSorted}
                        onChange={this.handleUpdate.bind(this, column.key)}
                        isMulti
                      />
                    </Form.Group>
                  </Col>
                ))}
              </Row>
            ))}
            {
              lineageFilters.length && (
                <>
                <hr/>
                  <h5>Dataset Source</h5>
                  {
                    lineageFilters.map((row, rowInd) => (
                      <Row key={`row-${rowInd}`}>
                        {row.map(column => (
                          <Col key={column.key} md={{ span: 12 }}>
                            <Form.Group as={Col} controlId={`formGrid${column.key}Filter`}>
                              <Form.Label>{column.label}</Form.Label>
                              <Select
                                id={column.key}
                                instanceId={`${column.key}Selector`}
                                options={column.options}
                                value={column.value}
                                isSorted={column.isSorted}
                                onChange={this.handleUpdate.bind(this, column.key)}
                                isMulti
                              />
                            </Form.Group>
                          </Col>
                        ))}
                      </Row>
                    ))
                  }
                </>
              )
            }
            <div style={styles.right}>
              <span><Button size="sm" variant="secondary" onClick={this.resetState}>Clear</Button></span>&nbsp;&nbsp;
              <span><Button size="sm" variant="primary" onClick={this.applySearch}>Apply</Button></span>
            </div>
          </Card.Body>
        </Card>
      </>
    );
  }
}

/* istanbul ignore next */
const SearchFilterComponent = React.forwardRef((props, ref) => (
  <AppStateConsumer>
    {ctx => <SearchFilter ref={ref} {...props} context={ctx} />}
  </AppStateConsumer>
))

export default SearchFilterComponent;
