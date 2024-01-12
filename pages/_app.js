import React from 'react';
import Router from 'next/router';
import App from 'next/app';
import Head from 'next/head';
import { AppStateProvider } from '../components/AppState';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Spinner from 'react-bootstrap/Spinner'
import ConfirmationModal from '../components/ConfirmationModal'
import 'beautiful-react-diagrams/styles.css';
import fetchIntercept from 'fetch-intercept';
class MyApp extends App {
  constructor(props) {
    super(props);
    this.state = {
      title: 'EDL Data Catalog',
      loggedInUser: props.serverUser || null,
      announcements: props.serverAnnouncements || [],
      allViews: props.serverAllViews || [],
      isLoading: true,
      domain: props.serverDomain || '',
      setLoading: this.setLoading,
      datasetApprovals: props.serverDatasetApprovals || [],
      permissionApprovals: props.serverPermissionApprovals || [],
      referenceData: props.serverReferences || {
        communities: [],
        countries: [],
        gicp: [],
        businessValues: [],
        categories: [],
        phases: [],
        technologies: [],
        physicalLocations: []
      },
      modal: null,
      isReloadDatasets: false,
      setReloadDatasets: this.setReloadDatasets,
      toggles: props.serverToggles || {},
      history: [],
      listedApplications:[],
      setListedApplications: this.setListedApplications,
      unitDepartment: props.unitDepartment || {}
    };

    fetchIntercept.register({
      responseError: function (error) {
        if(error.request.signal instanceof AbortSignal) {
          window.location.href = error.request.url;
        } else {
          return error;
        }
      }
  });
  }

  setLoading = isLoading => this.setState({ isLoading });
  setReloadDatasets = isReloadDatasets => this.setState({ isReloadDatasets })
  setListedApplications = listedApplications => this.setState({ listedApplications })

  componentDidMount() {
    Router.onRouteChangeStart = () => this.setLoading(true);
    Router.onRouteChangeComplete = () => this.setLoading(false);
    Router.onRouteChangeError = () => this.setLoading(false);

    if (!this.props.serverUser) this.loadUser();
    if (process.env.APP_ENV) {
      this.addAdrumConfig();
      this.injectScript();
    }

    this.setLoading(false);

    const { asPath } = this.props.router;
    this.setState(prevState => ({ history: [asPath, ...prevState.history] }));
  }

  componentDidUpdate() {
    if (process.env.APP_ENV) {
      this.addAdrumConfig();
    }

    const { history } = this.state;
    const { asPath } = this.props.router;
    if (history[0] !== asPath) {
      this.setState(prevState => ({ history: [asPath, ...prevState.history] }));
    }
  }

  setUserData = racfId => ( {userData: { RacfID: racfId }});

  getAppKey({ location: { hostname } }) {
    if(hostname === 'data-catalog.deere.com') return "AD-AAB-ABH-GZM";
    if(hostname.includes('dev')) return "AD-AAB-ABG-HJT";
    return "";
  }

  getUserEventInfo({username}) {
    return {
      VPageView: this.setUserData(username),
      PageView: this.setUserData(username),
      Ajax: this.setUserData(username)
    }
  }

  getAdrumConfig(window) {
    const {loggedInUser} = this.state;
    return {
      appKey: this.getAppKey(window),
      adrumExtUrlHttp: "http://cdn.appdynamics.com",
      adrumExtUrlHttps: "https://cdn.appdynamics.com",
      beaconUrlHttp: "http://pdx-col.eum-appdynamics.com",
      beaconUrlHttps: "https://pdx-col.eum-appdynamics.com",
      useHTTPSAlways: true,
      resTiming: {"bufSize": 200, "clearResTimingOnBeaconSend": true},
      maxUrlLength: 512,
      spa: {"spa2": false},
      page: {"captureTitle": false},
      ...(loggedInUser && {userEventInfo: this.getUserEventInfo(loggedInUser)})
    };
  }

  addAdrumConfig = () => {
    const adrumConfig = this.getAdrumConfig(window);
    window["adrum-start-time"] = new Date().getTime();
    window["adrum-config"] = adrumConfig;
  }

  injectScript = () => {
    const script = window.document.createElement('script');

    script.type = 'text/javascript';
    script.charset = 'UTF-8';
    script.src = `${window.document.location.protocol}//cdn.appdynamics.com/adrum/adrum-21.6.0.3448.js`;
    window.document.head.appendChild(script);
  }

  loadUser = async () => {
    const { loggedInUser } = this.state
    if (loggedInUser) return;
    try {
      const res = await fetch('/api/session/user', {credentials: 'same-origin'});
      const user = await res.json();

      const loggedInUser = user === null ? undefined : user;
      this.setState({loggedInUser});
    } catch (error) {
      console.error('failed to call /api/session/user with error: ', error.stack);
    }
  }

  handleClick = (path, onAccept = () => {}) => {
    const { router } = this.props;
    const pushPath = () => {
      onAccept();
      router.push(path);
    };
    const routes = ['edit=true', '/register', '/request'];
    const hasRoute = routes.some(route => router.asPath.toString().includes(route));

    if(hasRoute) this.setState({ modal: { onAccept: () => pushPath()}})
    else pushPath();
  }

  render() {
    const { Component } = this.props;
    const { announcements, datasetApprovals, isLoading, loggedInUser, modal, permissionApprovals, title } = this.state;
    const pendingLength = permissionApprovals.length + datasetApprovals.length;
    const badges = {pendingApprovals: pendingLength};
    return (
      <>
        <ConfirmationModal
            show={!!modal}
            showAcceptOnly=''
            acceptButtonText='Yes'
            body='Are you sure you want to leave this form?'
            onCancel={() => this.setState({modal: null})}
            onAccept={() => { this.setState({modal: null}); modal.onAccept() }}
        />
        <Head>
          <meta name="apple-mobile-web-app-capable" content="yes"></meta>
          <meta name="apple-mobile-web-app-title" content={title}></meta>
          {/* TODO optimization change these to modules and move to public/css dir */}
          <link rel="stylesheet" href="/static/css/uxframe-2019.2.1.min.css"></link>
          <link rel="stylesheet" href="/static/css/override.css"></link>
          <link rel="stylesheet" href="/static/css/chonky.css"></link>

          <link rel="stylesheet" href="/static/css/ErrorModal.module.css"></link>
          <link rel="stylesheet" href="/static/css/DataLineage.css"></link>
          <link rel="stylesheet" href="/static/css/DataCatalog.css"></link>
          <link rel="stylesheet" href="/static/css/MyApplicationForm.css"></link>
          <link rel="stylesheet" href="/static/css/components/datasets/EnhancedSchemaList.css"></link>
          <link rel="stylesheet" href="/static/css/components/datasets/EnhancedLoadHistoryModal.css"></link>
          <link rel="stylesheet" href="/static/css/components/datasets/EnhancedSchemaFieldNames.css"></link>
          <link rel="stylesheet" href="/static/css/components/datasets/EnhancedSchemaDetails.css"></link>
          <link rel="stylesheet" href="/static/css/components/datasets/EnhancedSearchBar.css"></link>
          <link rel="apple-touch-icon" sizes="180x180" href="/static/img/green-favicon/apple-touch-icon.png"></link>
          <link rel="icon" type="image/png" sizes="32x32" href="/static/img/green-favicon/favicon-32x32.png"></link>
          <link rel="icon" type="image/png" sizes="16x16" href="/static/img/green-favicon/favicon-16x16.png"></link>
          <link rel="manifest" crossOrigin="anonymous" href="/static/img/green-favicon/manifest.json"></link>
          <link rel="mask-icon" href="static/img/green-favicon/safari-pinned-tab.svg" color="#367c2b"></link>
          <link rel="preload" as="font" href="/static/typography/JDSansPro-Bold.woff" type="font/woff" crossOrigin="anonymous"></link>
          <link rel="preload" as="font" href="/static/typography/JDSansPro-Bold.woff2" type="font/woff2" crossOrigin="anonymous"></link>
          <link rel="preload" as="font" href="/static/typography/JDSansPro-Medium.woff" type="font/woff" crossOrigin="anonymous"></link>
          <link rel="preload" as="font" href="/static/typography/JDSansPro-Medium.woff2" type="font/woff2" crossOrigin="anonymous"></link>
          <link rel="preload" as="font" href="/static/typography/noto-sans-v7-latin-700.woff" type="font/woff" crossOrigin="anonymous"></link>
          <link rel="preload" as="font" href="/static/typography/noto-sans-v7-latin-700.woff2" type="font/woff2" crossOrigin="anonymous"></link>
          <link rel="preload" as="font" href="/static/typography/noto-sans-v7-latin-regular.woff" type="font/woff" crossOrigin="anonymous"></link>
          <link rel="preload" as="font" href="/static/typography/noto-sans-v7-latin-regular.woff2" type="font/woff2" crossOrigin="anonymous"></link>
          <title>{this.state.title}</title>
        </Head>
        <Header
            badges={badges}
            user={loggedInUser}
            announcements={announcements}
            title={title}
            inputProps={{ placeholder: "Search Datasets", name: 'searchTerm' }}
            formProps={{ action: '/datasets', method: 'GET' }}
        />
        <br />
        <AppStateProvider value={this.state}>
          <div className="container" hidden={isLoading}>
            {<Component {...this.props} handleClick={this.handleClick} history={this.state.history}/>}
            {!!isLoading &&
            <div className="text-center">
              <Spinner className="spinner-border uxf-spinner-border-lg" animation="border" role="status">
                <span className="sr-only">Loading...</span>
              </Spinner>
            </div>
            }
          </div>
        </AppStateProvider>
        <br />
        <Footer />
      </>
    );
  }

  static callService = async (service, serviceName) => {
    try {
      return (await service());
    } catch (error) {
      console.error(`failed to load ${serviceName} in _app with error: `, error.stack);
      return undefined;
    }
  }

  static async getInitialProps({ctx: {req}}) {
    if(!req) return {env: process.env.APP_ENV};

    const env = process.env.APP_ENV;
    const serverReferences = req.referenceService.getAllReferenceData();
    const {serverDomain, user: serverUser} = req;
    const [serverAnnouncements, serverAllViews, serverDatasetApprovals, serverPermissionApprovals, serverToggles, unitDepartment] = await Promise.all([
      this.callService(req.announcementService.getAnnouncements, 'announcements'),
      this.callService(req.metastoreService.getAllViews, 'allViews'),
      this.callService(() => req.datasetService.findAllForApproval(serverUser), 'dataset approvals'),
      this.callService(() => req.permissionService.findAllForApproval(serverUser), 'permission approvals'),
      this.callService(req.featureToggleService.getToggles, 'toggles'),
      this.callService(() => req.applicationService.getPnOData(serverUser?.username), 'pno'),
    ]);

    return {env, serverUser, serverReferences, serverDatasetApprovals, serverPermissionApprovals, serverDomain, serverAnnouncements, serverAllViews, serverToggles, unitDepartment};
  }
}

export default MyApp;
