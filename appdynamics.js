// Unpublished Work (c) 2021-2022 Deere & Company.
const path = require('path');

try {
    const appConfig = {
      controllerHostName: process.env.APPDYNAMICS_CONTROLLER_HOST_NAME,
      controllerPort: process.env.APPDYNAMICS_CONTROLLER_PORT, 
      controllerSslEnabled: true,
      accountName: process.env.APPDYNAMICS_AGENT_ACCOUNT_NAME,
      accountAccessKey: process.env.APPDYNAMICS_AGENT_ACCOUNT_ACCESS_KEY,
      applicationName: process.env.APPDYNAMICS_AGENT_APPLICATION_NAME,
      tierName: process.env.APPDYNAMICS_AGENT_TIER_NAME, 
      nodeName: process.env.APPDYNAMICS_AGENT_NODE_NAME,
      reuseNode: true,
      reuseNodePrefix: process.env.APPDYNAMICS_AGENT_NODE_NAME,
      logging: {

        logfiles: [
      
             {'filename': 'nodejs_agent_%N.log', 'level': 'TRACE'},
      
             {'filename': 'nodejs_agent_%N.protolog', 'level': 'TRACE', 'channel': 'protobuf'}
      
         ]
      
      }
    }
    console.log(JSON.stringify(appConfig));
    console.log("current working directory", process.cwd());
    let modifiedPath = path.format({root: '/ignored', dir: '/opt/agent/node_modules', base: 'appdynamics'});
    console.log("current working directory", modifiedPath);
    /* eslint-disable */
      require(modifiedPath).profile(appConfig);
    } catch (e) {
      console.log(e);
      console.log(e.message);
      console.log('Continuing without appdynamics');
    }