const expectedStatus = ['FAILED', 'PENDING', false]

module.exports = {

    /**
     * API call to check the status of the infra
     * @param awsAccountNo
     * @param rdsIpAddress
     * @returns {Promise<any>}
     */

    configureMDECrossAccountStatus: async (awsAccountNo, rdsIpAddress) => {
        const response = await fetch(`/api/mds-status?accountNumber=${awsAccountNo}&rdsIpAddress=${rdsIpAddress}`, {
            credentials: "same-origin",
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });
        return await response.json();
    },

    /**
     * API call to trigger infra creation
     * @param awsAccountNo
     * @param accountName
     * @param region
     * @param rdsIpAddress
     * @param rdsPort
     * @param subnetIds
     * @param vpcId
     * @param subnetsAzIds
     * @param rdsEngine
     * @param rdsEndpoint
     * @returns {Promise<{}>}
     */

    configureMDECrossAccount: async (awsAccountNo, accountName, region, rdsIpAddress, rdsPort,
                                     subnetIds, vpcId, subnetsAzIds, rdsEngine, rdsEndpoint) => {
        const body = {
            accountNumber: awsAccountNo,
            accountName: accountName,
            awsRegion: region,
            rdsIpAddress: rdsIpAddress,
            rdsPort: rdsPort,
            subnetIds: subnetIds,
            vpcId: vpcId,
            subnetsAzIds: subnetsAzIds,
            rdsEngine: rdsEngine,
            rdsEndpoint: rdsEndpoint
        };
        const response = await fetch("/api/configure-mds", {
            credentials: "same-origin",
            method: "POST",
            body: JSON.stringify(body),
            headers: {
                "Content-Type": "application/json",
            },
        });
        return await response.json();
    },

    /**
     * Update mde progress bar
     * @param resData
     * @returns {Promise<{setEnableConfigureBtnStatus: boolean, currentStatus, setConfigureMDEStatus: boolean, statusBar: number}|*>}
     */

    updateMDEProgressBar: async (resData) => {
        if (!resData.status || resData.status === 'FAILED' || resData.status === 'COMPLETE') {
            return getProgressStats(resData.status)
        } else {
            let prStatusCheck = expectedStatus.includes(resData.prStatus)
            let nlbCheck = expectedStatus.includes(resData.networkLoadBalancer)
            let vpcEndpointCheck = expectedStatus.includes(resData.vpcEndpointService)
            let vpcEndpointDNSCheck = expectedStatus.includes(resData.vpcEndpointDNS)
            return await getProgressBarValue(resData, prStatusCheck, nlbCheck, vpcEndpointCheck, vpcEndpointDNSCheck)
        }
    },
}

/**
 * This method return progress stats of three cases
 * @param status
 * @returns {*}
 */

let getProgressStats = (status) => {
    let statusSet = {
        'false': {
            statusBar: 10,
            setConfigureMDEStatus: false,
            currentStatus: false,
            setEnableConfigureBtnStatus: false
        },
        'FAILED': {
            statusBar: 0,
            setConfigureMDEStatus: false,
            currentStatus: status,
            setEnableConfigureBtnStatus: false
        },
        'COMPLETE': {
            statusBar: 100,
            setConfigureMDEStatus: true,
            currentStatus: status,
            setEnableConfigureBtnStatus: true
        }
    }
    return statusSet[status.toString()]
}

/**
 * this method is responsible to get value of progress bar
 * @param resData
 * @param prStatusCheck
 * @param nlbCheck
 * @param vpcEndpointCheck
 * @param vpcEndpointDNSCheck
 * @returns {Promise<{setEnableConfigureBtnStatus: boolean, currentStatus, setConfigureMDEStatus: boolean, statusBar: number}>}
 */
let getProgressBarValue = async (resData, prStatusCheck, nlbCheck, vpcEndpointCheck, vpcEndpointDNSCheck) => {
    let status = {
        statusBar: 0,
        setConfigureMDEStatus: false,
        currentStatus: resData.status,
        setEnableConfigureBtnStatus: false
    }
    if (!prStatusCheck && nlbCheck && vpcEndpointCheck && vpcEndpointDNSCheck) {
        status.statusBar = 20
    }
    if (!prStatusCheck && !nlbCheck && vpcEndpointCheck && vpcEndpointDNSCheck) {
        status.statusBar = 50
    }
    if (!prStatusCheck && !nlbCheck && !vpcEndpointCheck && vpcEndpointDNSCheck) {
        status.statusBar = 70
    }
    if (!prStatusCheck && !nlbCheck && !vpcEndpointCheck && !vpcEndpointDNSCheck) {
        status.statusBar = 100
        status.setConfigureMDEStatus = true
        status.currentStatus = resData.status
        status.setEnableConfigureBtnStatus = true
    }
    return status
}

