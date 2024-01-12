const {configureMDECrossAccountStatus, configureMDECrossAccount,
    updateMDEProgressBar} = require("../../../components/workflow/WorkflowMde");
global.fetch = require('jest-fetch-mock');

describe('WorkflowTasks MDE tests', () => {
    it('mds API status', async () => {
        //given
        fetch.mockImplementation(() => {
            return new Promise((resolve) =>
                resolve({
                    ok: true,
                    json: () => {
                        return {
                            "prStatus": "arn:aws:iam::362024894964:role/system-roles/edl-mds-infra",
                            "networkLoadBalancer": "arn:aws:elasticloadbalancing:us-east-1:362024894964:loadbalancer/net/NLB-RDS-edl-mds/bf72cdfc1cc068cf",
                            "vpcEndpointService": "COMPLETE",
                            "vpcEndpointDNS": "COMPLETE",
                            "status": "COMPLETE"
                        };
                    }
                })
            );
        });
        //when
        const checkStatus = await configureMDECrossAccountStatus('2351456363', '34.242.24324.24');
        //then
        expect(checkStatus).toEqual({
            "prStatus": "arn:aws:iam::362024894964:role/system-roles/edl-mds-infra",
            "networkLoadBalancer": "arn:aws:elasticloadbalancing:us-east-1:362024894964:loadbalancer/net/NLB-RDS-edl-mds/bf72cdfc1cc068cf",
            "vpcEndpointService": "COMPLETE",
            "vpcEndpointDNS": "COMPLETE",
            "status": "COMPLETE"
        });
        expect(fetch).toHaveBeenCalledTimes(1);
        expect(fetch).toHaveBeenCalledWith("/api/mds-status?accountNumber=2351456363&rdsIpAddress=34.242.24324.24", {
            credentials: "same-origin",
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        })
    });

    it('create mds API infra', async () => {
        //given
        let body = {
            "accountNumber": "362024894964", "accountName": "aws-ae-edl-ingest-devl", "awsRegion": "us-east-1",
            "rdsIpAddress": "10.187.7.217", "rdsPort": "5432",
            "subnetIds": ["subnet-07b79bf6638842732", "subnet-01f54db612ca97367"],
            "vpcId": "vpc-01fa16259e3c620f0", "subnetsAzIds": ["use1-az1", "use1-az2"],
            "rdsEngine": "postgres",
            "rdsEndpoint": "devledlpostgres1.cfplkre2zdbz.us-east-1.rds.amazonaws.com"
        }
        fetch.mockImplementation(() => {
            return new Promise((resolve) =>
                resolve({
                    ok: true,
                    json: () => {
                        return {
                            "prStatus": "arn:aws:iam::362024894964:role/system-roles/edl-mds-infra",
                            "networkLoadBalancer": "arn:aws:elasticloadbalancing:us-east-1:362024894964:loadbalancer/net/NLB-RDS-edl-mds/bf72cdfc1cc068cf",
                            "vpcEndpointService": "COMPLETE",
                            "vpcEndpointDNS": "COMPLETE",
                            "status": "COMPLETE"
                        };
                    }
                })
            );
        });
        //when
        const checkStatus = await configureMDECrossAccount('362024894964', 'aws-ae-edl-ingest-devl',
            'us-east-1', '10.187.7.217', '5432',
            ["subnet-07b79bf6638842732", "subnet-01f54db612ca97367"],
            'vpc-01fa16259e3c620f0',["use1-az1", "use1-az2"], 'postgres', 'devledlpostgres1.cfplkre2zdbz.us-east-1.rds.amazonaws.com');
        expect(fetch).toHaveBeenCalledTimes(1);
        expect(fetch).toHaveBeenCalledWith("/api/configure-mds", {
            credentials: "same-origin",
            method: "POST",
            body: JSON.stringify(body),
            headers: {
                "Content-Type": "application/json",
            },
        });

        expect(checkStatus).toEqual({"prStatus": "arn:aws:iam::362024894964:role/system-roles/edl-mds-infra",
            "networkLoadBalancer": "arn:aws:elasticloadbalancing:us-east-1:362024894964:loadbalancer/net/NLB-RDS-edl-mds/bf72cdfc1cc068cf",
            "vpcEndpointService": "COMPLETE",
            "vpcEndpointDNS": "COMPLETE",
            "status": "COMPLETE"});
    });

    it('progress bar status', async () => {
        let resData = {
            "prStatus": "arn:aws:iam::362024894964:role/system-roles/edl-mds-infra",
            "networkLoadBalancer": "arn:aws:elasticloadbalancing:us-east-1:362024894964:loadbalancer/net/NLB-RDS-edl-mds/bf72cdfc1cc068cf",
            "vpcEndpointService": "COMPLETE",
            "vpcEndpointDNS": "COMPLETE",
            "status": "COMPLETE"
        };
        let response = {
            statusBar: 10,
            setConfigureMDEStatus: false,
            currentStatus: false,
            setEnableConfigureBtnStatus: false
        }
        await updateMDEProgressBar(resData)
        expect(response).toEqual(response);
    });

    it('progress bar status 2', async () => {
        let resData = {
            "prStatus": "arn:aws:iam::362024894964:role/system-roles/edl-mds-infra",
            "networkLoadBalancer": "arn:aws:elasticloadbalancing:us-east-1:362024894964:loadbalancer/net/NLB-RDS-edl-mds/bf72cdfc1cc068cf",
            "vpcEndpointService": "FAILED",
            "vpcEndpointDNS": "FAILED",
            "status": "FAILED"
        };
        let response = {
            statusBar: 0,
            setConfigureMDEStatus: false,
            currentStatus: false,
            setEnableConfigureBtnStatus: false
        }
        await updateMDEProgressBar(resData)
        expect(response).toEqual(response);
    });
})