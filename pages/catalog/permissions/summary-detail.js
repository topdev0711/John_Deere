import React from 'react';
import Link from 'next/link';
import {Breadcrumb, Card, Tab, Nav, Spinner} from 'react-bootstrap';
import {withRouter} from 'next/router';
import { AppStateConsumer } from '../../../components/AppState';
import Spacer from '../../../components/Spacer';
import { MdLockOutline } from 'react-icons/md'
import utils from '../../../components/utils'
import AccessibleDatasets from '../../../components/ListedDatasets';
import ClassificationDetail from '../../../components/ClassificationDetail';
import ListedViews from '../../../components/ListedViews';

const styles = {
  breadcrumb: {
    marginLeft: '-17px',
    marginTop: '-17px'
  },
  meta: {
    paddingRight: '15px',
    paddingBottom: '5px',
    display: 'block',
    color: '#777'
  }
};

function truncateText(str) {
  const value = `${str}`.trim();
  if (value.length > 200) {
    return value.substring(0, 200) + '...'
  }
  return str
}

class PermissionDetail extends React.Component {
  state = {
    permissions: [],
    accessibleDatasets: [],
    loadingAccessibleDatasets: true,
    isLoading: true,
    effectiveEntitlements: [],
    views: []
  }

  componentDidMount() {
    this.loadPerms(this.props.router.query.group, this.props.router.query.clientId);
  }

  loadPerms = async (group, clientId) => {
    let fetchUrl = `/api/permissions?group=${group}`;
    if (clientId) {
      fetchUrl = `/api/permissions?clientId=${clientId}`;
    }
    const permissionResponse = await fetch(fetchUrl, {
      credentials: 'same-origin'
    });
    const permissions = await permissionResponse.json();
    const effectiveEntitlements = this.getUniqueFlattenedEntitlements(this.getEffectivePerms(permissions));

    this.setState({
      permissions,
      isLoading: false,
      effectiveEntitlements
    }, () => {
      this.loadDatasetsAccessible();
      this.loadViewsAccessible();
      this.props.setLoading(false);
    });
  }

  loadViewsAccessible = () => {
    const { permissions } = this.state 
    const totalViews = permissions.filter(perm => !!perm.views).flatMap(perm => perm.views)
    const views = _.uniqBy(totalViews,'name')
    this.setState( { views } )
  }

  loadDatasetsAccessible = async () => {
    const permissions = this.getEffectivePerms(this.state.permissions);
    if (permissions.length) {
      try {
        const res = await fetch(`/api/accessible-datasets`, {
          credentials: 'same-origin',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(permissions.reduce((a,b) => a.concat(b.entitlements), []))
        })

        const datasets = await res.json()

        this.setState({
          accessibleDatasets: utils.findLatestAvailableVersions(datasets),
          loadingAccessibleDatasets: false
        })
      } catch (err) {
        this.setState({
          loadingAccessibleDatasets: false
        })
        console.log(err)
      }
    }
  }

  sortItems = (items) => {
    items.sort((a,b) => {
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();
      return aName > bName ? 1 : aName < bName ? -1 : 0;
    });
    return items;
  };

  displayDate = (perm) => {
    const isEffective = utils.isPermEffective(perm);
    const isExpired = utils.isPermExpired(perm);
    return (<i>
      <span>Valid from {utils.formatTimeframe(perm)}
        <span hidden={!isExpired} style={{color: '#c21020'}}> (Expired)</span>
        <span hidden={isEffective || isExpired} style={{color: '#c21020'}}> (Not-Active)</span>
      </span>
    </i>);
  }

  getEffectivePerms = (permissions) => {
    return permissions.filter(utils.isPermEffective);
  }

  getUniqueFlattenedEntitlements = (effectivePermissions) => {
    const flatEntitlements = effectivePermissions.reduce((a, perm) => [...a, ...perm.entitlements.map(e => ({...e, from: perm.name}))], []);
    return flatEntitlements.reduce((acc, entitlement) => {
      if(acc.find(e => utils.isEqualObject(e, entitlement, ['id', 'from']))) return acc;
      const duplicates = flatEntitlements.filter(e => utils.isEqualObject(e, entitlement, ['id','from']));
      const updatedEntitlement = duplicates.length > 1 ? {...entitlement, from: 'Multiple Permissions'} : entitlement;
      return [...acc, updatedEntitlement];
    }, []);
  }

  render() {
    const { isLoading, accessibleDatasets, loadingAccessibleDatasets, permissions, effectiveEntitlements, views } = this.state;
    const { handleClick, history } = this.props
    const { group, clientId } = this.props.router.query;
    const viewCounts = views.length;
    const catalogPath = history.find((item) => item.startsWith("/catalog/permissions?")) ?? "/catalog/permissions";
    return (
      <>
        <div hidden={isLoading}>
          <Breadcrumb hidden={!!this.props.breadcrumbHidden} style={styles.breadcrumb}>
            <Breadcrumb.Item>
              <a onClick={() => handleClick(catalogPath)}><span>Catalog</span></a>
            </Breadcrumb.Item>
            <Breadcrumb.Item active>
              Summary Detail
            </Breadcrumb.Item>
          </Breadcrumb>
          {(!!group || !!clientId) &&
          <>
            <div>
              <Spacer height="10px" />
              <Card>
                <Card.Body>
                  <h3>
                    {group || clientId}
                  </h3>
                  <hr />
                  <Spacer height="14px" />
                  <Card.Text className="text-muted small">
                    <span style={styles.meta}>
                      <MdLockOutline size="18" /> <b>Permissions</b>
                      <ul style={{paddingTop: '5px'}}>
                      {this.sortItems(permissions).map(p =>{
                        const businessCase = truncateText(p.businessCase);
                        return (
                          <li className="mb-1">
                            <Link href={`/catalog/permissions/detail?id=${p.id}`}>{p.name}</Link> <br/>
                            <span hidden={!businessCase.length}><span style={{color: '#444'}}>{truncateText(p.businessCase)}</span><br/></span>
                            {this.displayDate(p)}
                          </li>
                        )
                      })}
                      </ul>
                    </span>
                  </Card.Text>
                </Card.Body>
              </Card>
              <Spacer/>
              <Tab.Container transition={false} defaultActiveKey="entitlements">
                <Nav size="sm" variant="tabs" className="uxf-nav-tabs-medium">
                  <Nav.Item>
                    <Nav.Link eventKey="entitlements">Entitlements{!!effectiveEntitlements.length ? ` (${effectiveEntitlements.length})` : ''}</Nav.Link>
                  </Nav.Item>
                  {!!viewCounts &&
                    <Nav.Item>
                      <Nav.Link eventKey="views">Views{!!viewCounts ? ` (${viewCounts})` : ''}</Nav.Link>
                    </Nav.Item>
                  }
                </Nav>
                <Tab.Content>
                  <Tab.Pane eventKey="entitlements">
                    <ClassificationDetail items={effectiveEntitlements} showActions />
                  </Tab.Pane>
                  <Tab.Pane eventKey="views">
                    <ListedViews views={views} />
                  </Tab.Pane>
                </Tab.Content>
              </Tab.Container>
              <br/>
              <AccessibleDatasets displayedDatasets={accessibleDatasets} type={'accessible'} isLoading={loadingAccessibleDatasets} />
            </div>
          </>
          }
          <div hidden={!!group || !!clientId}>No group or client selected</div>
        </div>
        <div hidden={!isLoading} className="text-center">
          <Spinner className="spinner-border uxf-spinner-border-lg" animation="border" role="status">
            <span className="sr-only">Loading...</span>
          </Spinner>
        </div>
      </>
    );
  }
}

const SummaryDetail = withRouter(props => (
  <AppStateConsumer>
    {({ setLoading, allViews }) => <PermissionDetail {...props} setLoading={setLoading} allViews={allViews} />}
  </AppStateConsumer>
));

export default SummaryDetail;
