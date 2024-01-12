const approvers = {
  local: {
    systems: [
      {
        username: 'EDL',
        client_id: '0oab61no9hmKkuuMA0h7',
        groups: []
      },
      {
        username: '0oaj75755xAF3dJgQ0h7',
        client_id: '0oaj75755xAF3dJgQ0h7',
        groups: [
          'AWS-GIT-DWIS-DEV'
        ]
      },
      {
        username: 'Dev Regression Bot Admin',
        client_id: '0oaxhp7tocwc2SFAa0h7',
        groups: [
          'AWS-GIT-DWIS-DEV',
          'AWS-GIT-DWIS-ADMIN',
          'G90_COLLIBRA_APPROVER_SYSTEMS'
        ]
      },
      {
        username: 'Dev Regression Write Bot',
        client_id: '0oaxhpy5gbN2mtOry0h7',
        groups: [
          'AWS-GIT-DWIS-DEV',
          'AWS-GIT-DWIS-ADMIN',
          'G90_COLLIBRA_APPROVER_SYSTEMS'
        ]
      }
    ]
  },
  devl: {
    systems: [
      {
        username: 'EDL',
        client_id: '0oab61no9hmKkuuMA0h7',
        groups: []
      },
      {
        username: '0oaj75755xAF3dJgQ0h7',
        client_id: '0oaj75755xAF3dJgQ0h7',
        groups: [
          'AWS-GIT-DWIS-DEV'
        ]
      },
      {
        username: 'Dev Regression Bot Admin',
        client_id: '0oaxhp7tocwc2SFAa0h7',
        groups: [
          'AWS-GIT-DWIS-DEV',
          'AWS-GIT-DWIS-ADMIN',
          'G90_COLLIBRA_APPROVER_SYSTEMS'
        ]
      },
      {
        username: 'Dev Regression Write Bot',
        client_id: '0oaxhpy5gbN2mtOry0h7',
        groups: [
          'AWS-GIT-DWIS-DEV',
          'AWS-GIT-DWIS-ADMIN',
          'G90_COLLIBRA_APPROVER_SYSTEMS'
        ]
      },
      {
        username: 'Financial Services',
        client_id: '0oa7dw0k3yvPn679u1t7',
        groups: [
          'G90_COLLIBRA_APPROVER_FINANCIAL_SERVICES'
        ]
      },
      {
        username: 'Financial Services',
        client_id: '0oacxhuq6qkRBjorG1t7',
        groups: [
          'G90_COLLIBRA_APPROVER_FINANCIAL_SERVICES'
        ]
      }
    ]
  },
  prod: {
    systems: [
      {
        username: 'EDL',
        client_id: '0oa61ni17an6trklu1t7',
        groups: []
      },
      {
        username: 'Financial Services',
        client_id: '0oacxhwg1bGSRpxuS1t7',
        groups: [
          'G90_COLLIBRA_APPROVER_FINANCIAL_SERVICES '
        ]
      },
      {
        username: 'Prod Regression Bot Write',
        client_id: '0oahisleo30dToZsH1t7',
        groups: [
          'AWS-GIT-DWIS-DEV',
          'AWS-GIT-DWIS-ADMIN',
          'G90_COLLIBRA_APPROVER_SYSTEMS'
        ]
      },
      {
        username: 'Prod Regression Bot Admin',
        client_id: '0oahisocgke9L04HO1t7',
        groups: [
          'AWS-GIT-DWIS-DEV',
          'AWS-GIT-DWIS-ADMIN',
          'G90_COLLIBRA_APPROVER_SYSTEMS'
        ]
      }
    ]
  }
}

function getLocal() {
  return approvers.local.systems;
}

function getDevl() {
  return approvers.devl.systems;
}

function getProd() {
  return approvers.prod.systems;
}

module.exports = {
  getLocal,
  getDevl,
  getProd
}