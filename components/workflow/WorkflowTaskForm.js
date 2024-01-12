// Unpublished Work © 2021-2022 Deere & Company
import {
  Button,
  Card,
  Form,
  Tooltip,
  OverlayTrigger,
  Col,
  Collapse,
  Toast,
  InputGroup,
  Spinner,
} from "react-bootstrap";
import ConfirmationModal from "../ConfirmationModal";
import Select from "../Select";
import React, { useState, useEffect } from "react";
import Spacer from "../Spacer";
import ValidatedInput from "../ValidatedInput";
import {
  MdInfoOutline,
  MdAddCircleOutline,
  MdRemoveCircleOutline,
  MdDelete,
} from "react-icons/md";
import { FaEyeSlash, FaEye } from "react-icons/fa";
import managedIngestModel from "../../src/model/managedIngestModel";
import uuid from "uuid";
import Accordion from "../Accordion";
import SourceTableForm from "./SourceTableForm";
import SchedulerFrequency from "./SchedulerFrequency";
import SharepointUIForm from "./SharepointUIForm";
import ProgressBar from "react-bootstrap/ProgressBar";
import Router from "next/router";
import MDINotificationForm from "./MDINotificationForm";
import "./styles/mdiNotification.module.css";
import { GlobalConst, MDINotificationsConst } from "./constants";
import ProgressIndicator from "./ProgressIndicator";
import {configureMDECrossAccount, configureMDECrossAccountStatus, updateMDEProgressBar} from "./WorkflowMde";

const dataIngestedTrigger = { value: "data ingested", label: "data ingested" };
const dataProfileTrigger = { value: "current state", label: "current state" };
const dataScheduledTrigger = { value: "scheduled", label: "scheduled" };

const styles = {
  card: {
    minHeight: "210px",
    overflow: "visible",
  },
  add: {
    float: "right",
    marginTop: "-4px",
    whiteSpace: "nowrap",
  },
  show: {
    display: "block",
  },
};

async function createManagedIngestTask(body) {
  return fetch("/api/managedtasks/", {
    credentials: "same-origin",
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
    },
  });
}

const isCurrentState = (task) =>
  task.task_definition.action &&
  task.task_definition.action.operation.name === "CURRENT_STATE";
const isManagedIngest = (task) =>
  task.task_definition.trigger.event === "managed_ingest_request";
const isDataProfile = (task) =>
  task.task_definition.action &&
  task.task_definition.action.operation.name === "DATA_PROFILE";
const getSourceSchema = (task) => task.task_definition.source.representation;
const getSelectorValue = ({ environmentName, name, version }) => ({
  value: `${environmentName}@${version}`,
  label: `${name}@${version}`,
});
const taskExists = ({ environmentName, version }, workflowTaskSchemas) =>
  workflowTaskSchemas.includes(`${environmentName}@${version}`);

const currentStateAction = { value: "current state", label: "current state" };
const managedIngestAction = {
  value: "managed ingest",
  label: "managed ingest",
};
const managedEgressAction = {
  value: "managed egress",
  label: "managed egress",
};
const dataProfileAction = { value: "data profile", label: "data profile" };
const IBMZOSOption = { value: "IBM_zos", label: "IBM DB2 for z/OS" };
const OnPremMSSQL = { value: "MSSQL", label: "On Premise Microsoft SQL" };
const OnPremOracle = { value: "Oracle", label: "On Premise Oracle" };
const SharepointOption = { value: "Sharepoint", label: "Sharepoint" };
const PostgresRdsOption = { value: "aws postgres rds", label: "AWS Postgres" };
const MsSqlOption = { value: "aws mssql", label: "AWS Microsoft SQL" };
const MySqlOption = { value: "aws mysql", label: "AWS MYSQL" };

const WorkflowTaskForm = ({
  dataset = {},
  setCreatingTask = false,
  setCopyingTask = false,
  copyingTask = false,
  setRefreshTasks = false,
  showConfigureMDI = false,
  setModal = () => {},
  tasks = [],
  task = {},
  enableDataProfile = true,
  enableManagedIngestRdsTask = true,
  datasetId = "",
}) => {
  const [selectedSchema, setSelectedSchema] = useState({});
  const [action, setAction] = useState({ value: "", label: "" });
  const [trigger, setTrigger] = useState({ value: "", label: "" });
  const [sourceSchemasOptions, setSourceSchemasOptions] = useState([]);
  const [isTaskSubmitLoading, setIsTaskSubmitLoading] = useState(false);
  const [dbType, setDBType] = useState({});
  const [mdiTaskName, setMdiTaskName] = useState("");
  const [mdiTaskErrors, setMdiTaskErrors] = useState([]);
  const [dbUserName, setDbUserName] = useState("");
  const [dbPassword, setDbPassword] = useState("");
  const [dbServer, setDbServer] = useState("");
  const [dbPort, setDbPort] = useState("");
  const [dbLocation, setDbLocation] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [enableCDC, setEnableCDC] = useState(false);
  const [udtfFunction, setUdtfFunction] = useState("");
  const [sourceEndPoint, setSourceEndPoint] = useState("");
  const [targetEndPoint, setTargetEndPoint] = useState("");
  const [viewSource, setViewSource] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [modalBody, setModalBody] = useState(null);
  const [sourceTables, setSourceTables] = useState([]);
  const [openAdvancedSettings, setOpenAdvancedSettings] = useState(false);
  const [addDisabled, setAddDisabled] = useState(false);
  const [isSchedule, setIsSchedule] = useState(false);
  const [sourceTableMsg, setSourceTableMsg] = useState(false);
  const [startDay, setStartDay] = useState("");
  const [startTime, setStartTime] = useState("");
  const [hourValue, setHourValue] = useState("0");
  const [startDate, setStartDate] = useState("");
  const [scheduleFrequency, setScheduleFrequency] = useState("");
  const [sharepointDetails, setSharepointDetails] = useState({});
  const [endDate, setEndDate] = useState("");
  const [toastMsg, setToastMsg] = useState("");
  const [isFormComplete, setIsFormComplete] = useState(false);
  const [testConnectionSuccess, setTestConnectionSuccess] = useState(false);
  const [disableTaskButton, setDisableTaskButton] = useState(true);
  const [isSpinner, setSpinner] = useState(false);
  const [isUpdate, setUpdate] = useState(false);
  const [ConfigureMDI, setconfigureMDI] = useState(false);
  const [showDatabaseConfiguration, setShowDatabaseConfiguration] =
    useState(false);
  const [enableConfigureBtn, setEnableConfigureBtn] = useState(false);
  const [awsAccountName, setawsAccountName] = useState("");
  const [awsAccountNo, setawsAccountNo] = useState("");
  const [awsAccountRegion, setawsAccountRegion] = useState("");
  const [awsAccountVPC, setawsAccountVPC] = useState("");
  const [subnetAvailabilityZoneID, setsubnetAvailabilityZoneID] = useState("");
  const [subnetIDs, setSubnetIDs] = useState("");
  const [ipAddress, setIPAddress] = useState("");
  const [rdsEndpoint, setRdsEndpoint] = useState("");
  const [rdsPort, setRdsPort] = useState();
  const [sourceTableName, setSourceTableName] = useState("");
  const [isProgressBar, setProgressBar] = useState(false);
  const [count, setCount] = useState(0);
  const [taskNameError, settaskNameError] = useState("");
  const [replicationInstanceName, setReplicationInstanceName] = useState("");
  const [notificationBody, setNotificationBody] = useState({});
  const [mdiNotificationError, setMdiNotificationError] = useState(false);
  const [isCreateTaskDisabled, setIsCreateTaskDisabled] = useState(true);
  const [connectionUrl, setConnectionUrl] = useState("")
  const [showNotificationSuccessModal, setShowNotificationSuccessModal] =
    useState(false);
  const [notificationSuccessModalDetails, setNotificationSuccessModalDetails] =
    useState({ taskId: null, notificationId: null });
  const [taskSuccess, setTaskSuccess] = useState(false);

  const isManagedEgress = action?.value === "managed egress";

  const awsAccountNameValue = (accountName) => {
    setawsAccountName(accountName);
  };
  const awsAccountNoValue = (accountNo) => {
    setawsAccountNo(accountNo);
  };
  const awsAccountRegionValue = (accountRegion) => {
    setawsAccountRegion(accountRegion);
  };

  const awsAccountVPCValue = (accountVPC) => {
    setawsAccountVPC(accountVPC);
  };

  const subnetAvailabilityZoneIDValue = (subnetAZ) => {
    setsubnetAvailabilityZoneID(subnetAZ);
  };

  const subnetIDsValue = (subnets) => {
    setSubnetIDs(subnets);
  };

  const rdsIPAddressValue = (address) => {
    setIPAddress(address);
  };

  const rdsEndpointValue = (value) => {
    setRdsEndpoint(value);
  };

  const rdsPortValue = (port) => {
    setRdsPort(port);
  };

  const sourceTableNameValue = (tableName) => {
    setSourceTableName(tableName);
  };

  const taskNameValidate = (inValidTaskName) => {
    return inValidTaskName.length > 0;
  };

  const createTaskSubmitModalBodySuccess = () => {
    return (
      <div style={{ whiteSpace: "pre-wrap" }}>
        {`Task Name: ${mdiTaskName}\n`}
        {`Task Id: ${notificationSuccessModalDetails?.taskId}\n`}
        {`Subscription Id: ${notificationSuccessModalDetails?.notificationId}\n`}
        {`Notification Status: ${notificationBody?.status}\n\n`}
        {`Please follow the steps mentioned `}
        <a
          href={MDINotificationsConst?.CONFLUENCE_HELP_LINK}
          target="_blank"
          rel="noreferrer"
        >
          here
        </a>
        {` to confirm your subscription.`}
      </div>
    );
  };

  const createTaskSubmitModalBodyNotifyFailure = () => {
    return (
      <div style={{ whiteSpace: "pre-wrap" }}>
        {`Task Name: ${mdiTaskName}\n`}
        {`Task Id: ${notificationSuccessModalDetails?.taskId}\n\n`}
        {`Notification could not be enabled. Please reach out to us `}
        <a href={GlobalConst?.SUPPORT_LINK} target="_blank" rel="noreferrer">
          here
        </a>
      </div>
    );
  };

  const schedulerDetails = (event, key, copyingTask = false) => {
    if (copyingTask) {
      setScheduleFrequency(event.frequency);
      setStartTime(event.startTime);
      setStartDay(event.startDate);
      setHourValue(event.everyNHours);
      setStartDate(event.startDate);
      setEndDate(event.endDate);
    } else {
      switch (key || event.target.id) {
        case "frequency":
          setScheduleFrequency(event.value);
          setStartTime("");
          setStartDay("");
          setHourValue("");
          setStartDate("");
          setEndDate("");
          setMdiTaskErrors([]);
          break;
        case "starttime":
          setStartTime(event.target.value);
          break;
        case "startdate":
          setStartDate(event.target.value);
          break;
        case "everyNHours":
          setHourValue(event.target.value);
          break;
        case "startday":
          setStartDay(event.value);
          break;
        case "endDate":
          setEndDate(event.target.value);
          break;
      }
    }
  };
  const setIsScheduleCheck = (checked) => {
    setIsSchedule(checked);
    if (!!checked) {
      setScheduleFrequency("empty");
    } else {
      setScheduleFrequency("");
    }
    setMdiTaskErrors([]);
    setStartTime("");
    setStartDay("");
    setHourValue("");
    setStartDate("");
    setEndDate("");
  };

  const tasknameValue = (mdiTaskName) => {
    setUpdate(false);
    setMdiTaskName(mdiTaskName);
    const { details: errors = [] } =
      managedIngestModel.validateMDiTaskName({ taskName: mdiTaskName }) || {};
    if (errors.length) {
      settaskNameError(errors);
    } else settaskNameError("");
  };

  const redirectToTaskList = () => {
    copyingTask = false;
    setCopyingTask(false);
    Router.push("/workflow/tasks?datasetId=" + datasetId);
  };

  const databaseSourceOptions = () => {
    const options = [
      IBMZOSOption,
      OnPremMSSQL,
      OnPremOracle,
      PostgresRdsOption,
      MsSqlOption,
      MySqlOption,
    ];
    const limitedOptions = [
      IBMZOSOption,
      PostgresRdsOption,
      MsSqlOption,
      MySqlOption,
      OnPremMSSQL,
    ];
    const enhanceOptions = enableManagedIngestRdsTask
      ? options
      : limitedOptions;
    const rawOptions = enableManagedIngestRdsTask
      ? [...options, SharepointOption]
      : [...limitedOptions, SharepointOption];
    const egressOptions = [PostgresRdsOption, MsSqlOption, MySqlOption];
    if (isManagedEgress) {
      return egressOptions;
    } else if (dataset.phase.name.toLowerCase() === "enhance") {
      return enhanceOptions;
    } else {
      return rawOptions;
    }
  };

  useEffect(() => {
    if (taskSuccess && !showNotificationSuccessModal) {
      if (copyingTask) {
        Router.push("/workflow/tasks?datasetId=" + datasetId);
      } else {
        setRefreshTasks(true);
        setCreatingTask(false);
      }
    }
  }, [taskSuccess, showNotificationSuccessModal]);

  useEffect(() => {
    if (dataset.schemas) {
      const allSchemas = [...dataset.schemas, ...dataset.linkedSchemas];
      const taskType =
        action.value === "managed ingest"
          ? isManagedIngest
          : action.value === "current state"
          ? isCurrentState
          : isDataProfile;
      const workflowTaskSchemas = tasks.filter(taskType).map(getSourceSchema);
      const sourceSchemas = allSchemas
        .filter((schema) => !taskExists(schema, workflowTaskSchemas))
        .map(getSelectorValue);
      setSourceSchemasOptions(sourceSchemas);
    }
    if (copyingTask && action.value !== "managed ingest") {
      setawsAccountName("");
      setawsAccountNo("");
      setawsAccountRegion("");
      setawsAccountVPC("");
      setReplicationInstanceName("");
      setconfigureMDI(false);
      setTrigger({ value: "", label: "" });
      setDBType({ value: "", label: "" });
      setDbServer("");
      setDbLocation("");
      addSourceTable(false, []);
      setOpenAdvancedSettings(false);
      setEnableCDC(false);
      setIsScheduleCheck(false);
      setIsSchedule(false);
      schedulerDetails("", " ", false);
    }
  }, [action.value]);

  useEffect(() => {
    var value = "";
    if (copyingTask === true) {
      if (task.task_definition.trigger.metadata.sourceDBType.includes("aws")) {
        setawsAccountName(task.task_definition.trigger.metadata.account_name);
        setawsAccountNo(task.task_definition.trigger.metadata.account_number);
        setawsAccountRegion(task.task_definition.trigger.metadata.aws_region);
        setawsAccountVPC(task.task_definition.trigger.metadata.vpc_id);
      }
      value = "managed ingest";
      setAction({ value: value, label: value });
      setTrigger({ value: "data ingested", label: "data ingested" });
      setDBType({
        value: task.task_definition.trigger.metadata.sourceDBType,
        label: "",
      });
      setDbServer(task.task_definition.trigger.metadata.server);
      setDbLocation(task.task_definition.trigger.metadata.database);
      let tableNameArray =
        task.task_definition.trigger.metadata.sourceTable.split(",");
      let tableObjArr = [];
      tableNameArray.forEach((tableName) => {
        let tableObj = {
          dbSchemaName: tableName.split(".")[0],
          dbTableName: tableName.split(".")[1],
        };
        tableObjArr = [tableObj, ...tableObjArr];
      });
      addSourceTable(copyingTask, tableObjArr);
      setOpenAdvancedSettings(true);
      if (task.task_definition.trigger.metadata.ingestType.includes("CDC")) {
        setEnableCDC(true);
      }
      if (task.task_definition.trigger.metadata.schedule) {
        setIsScheduleCheck(true);
        setIsSchedule(true);
        schedulerDetails(
          task.task_definition.trigger.metadata.schedule,
          " ",
          copyingTask
        );
      }
    }
  }, []);

  useEffect(() => {
    if (
      !!mdiTaskName &&
      !!dbUserName &&
      !!dbPassword &&
      !!dbServer &&
      !!dbPort &&
      !!dbLocation
    ) {
      setIsFormComplete(true);
      setUdtfFunction(`R4Z.R4Z2_CDC_UDTF__DB${dbLocation.slice(3)}`);
    } else setIsFormComplete(false);
  }, [dbUserName, dbPassword, dbServer, dbPort, dbLocation, mdiTaskName]);

  useEffect(() => {
    const managedEgressValidation =
      !!subnetAvailabilityZoneID && !!ipAddress && !!subnetIDs && !!rdsPort && !!rdsEndpoint;
    if (
      !!awsAccountName &&
      !!awsAccountNo &&
      !!awsAccountRegion &&
      !!awsAccountVPC &&
      (isManagedEgress ? managedEgressValidation : true)
    ) {
      setEnableConfigureBtn(true);
    } else setEnableConfigureBtn(false);
  }, [
    awsAccountName,
    awsAccountNo,
    awsAccountRegion,
    awsAccountVPC,
    subnetAvailabilityZoneID,
    ipAddress,
    subnetIDs,
    rdsPort,
    rdsEndpoint
  ]);

  const testconnection = async () => {
    try {
      setIsFormComplete(false);
      setSpinner(true);

      const engineNames = require(`../../src/data/reference/engines.json`);
      let engineValue;
      for (let i = 0; i <= engineNames.length - 1; i++) {
        if (dbType.label === engineNames[i].label) {
          engineValue = engineNames[i].enginevalue;
          break;
        }
      }

      const body = {
        db_details: {
          engine: engineValue,
          server: dbServer,
          username: dbUserName,
          password: dbPassword,
          port: dbPort,
          database: dbLocation,
        },
        datatype: dataset.environmentName,
        representation: selectedSchema.value,
        source: dbType.value,
        taskName: mdiTaskName,
        isUpdate: isUpdate,
        sourceEndPoint: sourceEndPoint,
        targetEndPoint: targetEndPoint,
        awsAccountRegion: awsAccountRegion,
        awsAccountNo: awsAccountNo,
        phase: dataset.phase.name.toLowerCase(),
      };
      const taskNameBody = {
        taskName: mdiTaskName,
      };
      const { details: errors = [] } =
        managedIngestModel.validateMDiTaskName(taskNameBody) || {};
      if (errors.length) {
        setSpinner(false);
        setMdiTaskErrors(errors);
        setShowToast(true);
        return;
      }
      if (
        !selectedSchema.value &&
        dataset.phase.name.toLowerCase() === "enhance"
      ) {
        setSpinner(false);
        setToastMsg("Please select EDL Schema");
        setShowToast(true);
        setIsFormComplete(true);
        return;
      }

      const response = await fetch("/api/create-endpoint", {
        credentials: "same-origin",
        method: "POST",
        body: JSON.stringify(body),
        headers: {
          "Content-Type": "application/json",
        },
      });
      const resData = await response.json();
      if (response.status === 200) {
        setSourceEndPoint(resData.sourceEndPoint);
        setTargetEndPoint(resData.targetEndPoint);
        const responseTest = await fetch("/api/test-endpoint", {
          credentials: "same-origin",
          method: "POST",
          body: JSON.stringify({
            sourceEndPoint: resData.sourceEndPoint,
            isUpdate: isUpdate,
            awsAccountRegion: awsAccountRegion,
            awsAccountNo: awsAccountNo,
            replicationInstanceName: replicationInstanceName,
          }),
          headers: {
            "Content-Type": "application/json",
          },
        });
        const resDataTest = await responseTest.json();
        setSpinner(false);
        if (responseTest.status === 200) {
          setDisableTaskButton(false);
          setTestConnectionSuccess(true);
        } else {
          setUpdate(true);
          setIsFormComplete(true);
          setDisableTaskButton(true);
          setToastMsg(JSON.stringify(resDataTest));
          setShowToast(true);
        }
      } else {
        setSpinner(false);
        setIsFormComplete(true);
        setDisableTaskButton(true);
        setToastMsg(JSON.stringify(resData));
        setShowToast(true);
      }
    } catch (error) {
      setUpdate(true);
      setSpinner(false);
      setIsFormComplete(true);
      setToastMsg(
        "Please review the DB details and make any necessary corrections"
      );
      setShowToast(true);
    }
  };

  const checkCofigureMDIStatus = () => {
    let interval;
    setCount(10);
    interval = setInterval(async () => {
      const response = await configureMDICrossAccount(true);
      const isProgressBarComplete = await updateProgressBar(response);
      if (isProgressBarComplete === true) {
        setReplicationInstanceName(response.replication_instance_name);
        clearInterval(interval);
        setProgressBar(false);
      }
    }, 40000);
    setDisableTaskButton(false);
  };

  const checkConfigureMDEStatus = async () => {
    let subNetList = subnetIDs.replace(" ", "").split(',')
    let azIdsList = subnetAvailabilityZoneID.replace(" ", "").split(',')
    setShowDatabaseConfiguration(false);
    setSpinner(true);
    setEnableConfigureBtn(false);
    const response = await configureMDECrossAccountStatus(awsAccountNo, ipAddress);
    let {isFirst, isFailedAndRetry, isCompleted} = await triggerType(response)
    setSpinner(false);
    const engineNames = require(`../../src/data/reference/engines.json`);
    let engineValue, engineName;
    for (let i = 0; i <= engineNames.length - 1; i++) {
      if (dbType.label === engineNames[i].label) {
        engineValue = engineNames[i].enginevalue;
        engineName = engineNames[i].engineName;
        break;
      }
    }

    if (isCompleted) {
      setProgressBar(false);
      setEnableConfigureBtn(false);
      setShowDatabaseConfiguration(true);
      response.vpcEndpointDNS ? setConnectionUrl(`jdbc:${engineName}://${response.vpcEndpointDNS}:${rdsPort}`) : setConnectionUrl(false)
    } else {
      let interval;
      setProgressBar(true);
      setCount(10);
      isFirst || isFailedAndRetry ? await configureMDECrossAccount(awsAccountNo, awsAccountName, awsAccountRegion,
          ipAddress, rdsPort, subNetList, awsAccountVPC, azIdsList,
          engineValue, rdsEndpoint) : {}
      interval = setInterval(async () => {
        let progressResponse = await configureMDECrossAccountStatus(awsAccountNo, ipAddress);
        isFirst = false
        isFailedAndRetry = false
        const {
          statusBar,
          currentStatus,
          setEnableConfigureBtnStatus
        } = await updateMDEProgressBar(progressResponse);

        setCount(statusBar);
        setEnableConfigureBtn(setEnableConfigureBtnStatus);
        if (currentStatus === 'COMPLETE' || currentStatus === 'FAILED') {
          await haltProgress(currentStatus, interval, engineName, response.vpcEndpointDNS)
        }
      }, 62000);
      setDisableTaskButton(false);
    }
  };

  const haltProgress = async (currentStatus, interval, engineName, endpoint) => {
    if (currentStatus === 'COMPLETE') {
      clearInterval(interval);
      setProgressBar(false);
      setShowDatabaseConfiguration(true);
      endpoint ? setConnectionUrl(`jdbc:${engineName}://${response.vpcEndpointDNS}:${rdsPort}`) : setConnectionUrl(false)
    } else if (currentStatus === 'FAILED') {
      clearInterval(interval);
      setProgressBar(false);
      setToastMsg('Configure MDE failed');
      setShowToast(true);
      setEnableConfigureBtn(true);
    }
  }

  const triggerType = async (response) => {
    return {
      isFirst: response.error,
      isFailedAndRetry: (response.status && response.status === 'FAILED') ||
          (!response.status && response.prStatus === 'FAILED'),
      isCompleted: response.status && response.status === 'COMPLETE',
    }
  }

  const configureMDI = async () => {
    try {
      setconfigureMDI(false);
      const response = await configureMDICrossAccount();
      const isProgressBarComplete = await updateProgressBar(response);
      if (isProgressBarComplete === true) {
        setReplicationInstanceName(response.replication_instance_name);
        setProgressBar(false);
        setDisableTaskButton(false);
      } else {
        setProgressBar(true);
        checkCofigureMDIStatus();
      }
    } catch (error) {
      setToastMsg("Some internal error occured,Please try after sometime.");
      setShowToast(true);
    }
  };

  const configureMDE = async () => {
    try {
      await checkConfigureMDEStatus()
    } catch (error) {
      setToastMsg("Some internal error occurred,Please try after sometime.");
      setShowToast(true);
    }
  }

  const configureMDICrossAccount = async (isSearchOnly) => {
    const body = {
      datatype: dataset.environmentName,
      representation: selectedSchema.value,
      source: dbType.value,
      phase: "enhance",
      awsAccountNumber: awsAccountNo,
      awsAccountName: awsAccountName,
      awsAccountRegion: awsAccountRegion,
      awsVpcId: awsAccountVPC,
      isUpdate: isSearchOnly ? false : true,
    };
    const response = await fetch("/api/configure-mdi", {
      credentials: "same-origin",
      method: "POST",
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
      },
    });
    return await response.json();
  };

  const subscriptionApi = async (taskId, taskName) => {
    let body = {
      ...notificationBody,
    };
    body["taskId"] = [taskId];
    body["dataType"] = [dataset?.environmentName];

    const response = await fetch("/api/subscriptions", {
      credentials: "same-origin",
      method: "POST",
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response;
  };

  const updateProgressBar = async (resData) => {
    if (
      resData.pr_policy_status === "COMPLETE" &&
      resData.pr_role_status !== "COMPLETE" &&
      resData.configure_resources !== "COMPLETE" &&
      resData.replication_instance_status !== "COMPLETE"
    ) {
      setCount(40);
    }
    if (
      resData.pr_policy_status === "COMPLETE" &&
      resData.pr_role_status === "COMPLETE" &&
      resData.configure_resources !== "COMPLETE" &&
      resData.replication_instance_status !== "COMPLETE"
    ) {
      setCount(70);
    }
    if (
      resData.pr_policy_status === "COMPLETE" &&
      resData.pr_role_status === "COMPLETE" &&
      resData.configure_resources === "COMPLETE" &&
      resData.replication_instance_status !== "COMPLETE"
    ) {
      setCount(80);
    }
    if (
      resData.pr_policy_status === "COMPLETE" &&
      resData.pr_role_status === "COMPLETE" &&
      resData.configure_resources === "COMPLETE" &&
      resData.replication_instance_status === "COMPLETE"
    ) {
      setCount(100);
      setconfigureMDI(true);
      setEnableConfigureBtn(false);
      return true;
    }
    if (
      resData.pr_role_status === "FAILED" ||
      resData.pr_policy_status === "FAILED" ||
      resData.configure_resources === "FAILED" ||
      resData.replication_instance_status === "FAILED"
    ) {
      setToastMsg(resData.errorMsg);
      setShowToast(true);
      return true;
    }
    return false;
  };

  const schedule = (frequency) => {
    switch (frequency) {
      case "daily":
        return {
          frequency: scheduleFrequency,
          startTime: startTime,
          startDate: startDate,
          everyNHours: hourValue.length === 0 ? 0 : hourValue,
          endDate: endDate,
        };
      case "weekly":
        return {
          frequency: scheduleFrequency,
          startTime: startTime,
          dayOfWeek: startDay,
          endDate: endDate,
        };
      case "monthly":
        return {
          frequency: scheduleFrequency,
          startTime: startTime,
          startDate: startDate,
          endDate: endDate,
        };
      default:
        return {
          frequency: scheduleFrequency,
        };
    }
  };

  const getManagedEgressTaskDefinition = () => {
    const destinationTable = `${sourceTables[0].dbSchemaName}.${sourceTables[0].dbTableName}`
    return {
      source: {
        dataType: dataset.environmentName,
        representation: !!selectedSchema.value ? selectedSchema.value : "",
      },
      trigger: {
        event: "managed_egress_request",
        metadata: {
          fullLoadCompleted: false,
          ingestType: enableCDC ? "FULL_LOAD,CDC" : "FULL_LOAD",
          phase: dataset.phase.name.toLowerCase(),
          destinationTable
        },
        dbDetails: {
          dbType: dbType.value,
          server: connectionUrl,
          database: dbLocation,
          dbUser: dbUserName,
          password: dbPassword,
          port: rdsPort,
          ipAddress,
          accountNumber: awsAccountNo,
          region: awsAccountRegion,
        }
      }
    }
  }

  const submitEgressTask = async() => {
    setToastMsg("");
    setIsTaskSubmitLoading(true);
    setShowToast(false);
    console.log(connectionUrl)
    const egress = getManagedEgressTaskDefinition();
    const response = await createTask(egress);

    if (!response.ok) {
      const { error = {} } = await response.json();
      if (error.length) {
        setToastMsg("");
        setIsTaskSubmitLoading(false);
        setToastMsg(JSON.stringify(error));
        setShowToast(true);
        return;
      }
    }
    setTaskSuccess(true);
    setIsTaskSubmitLoading(false);
  }

  const constructBody = (phase, frequency) => {
    const dbDetails = {
      username: dbUserName,
      password: dbPassword,
      server: dbServer,
      port: dbPort,
      database: dbLocation,
      ...(dbType.value === "IBM_zos" && { udtf: udtfFunction }),
    };

    const tableDetails = sourceTables.map((sourceTable) => {
      return {
        schema: sourceTable.dbSchemaName,
        tableName:
          dbType.value === "IBM_zos"
            ? sourceTable.dbTableName.toUpperCase()
            : sourceTable.dbTableName,
        tableType: viewSource ? "view" : "table",
        columns_to_add: (sourceTable.columns || []).map(
          (column) => column.value
        ),
        ...(sourceTable.tableFilter && { filter: sourceTable.tableFilter }),
      };
    });

    return {
      taskName: mdiTaskName,
      source: dbType.value,
      phase,
      ...(awsResources.includes(dbType.value) && {
        sourceEndpointArn: sourceEndPoint,
        targetEndpointArn: targetEndPoint,
        userRoleARN: `arn:aws:iam::${awsAccountNo}:role/system-roles/edl-cross-replication`,
        awsAccountNumber: awsAccountNo,
        awsAccountRegion: awsAccountRegion,
        replicationInstanceName: replicationInstanceName,
      }),
      transform: "parquet",
      datatype: dataset.environmentName,
      representation: !!selectedSchema.value ? selectedSchema.value : "",
      ingestType: enableCDC ? "FULL_LOAD,CDC" : "FULL_LOAD",
      isView: viewSource,
      db_details: dbDetails,
      source_table: tableDetails,
      ...(frequency.length > 0 && { schedule: schedule(frequency) }),
    };
  };

  const constructSharepointBody = (phase, frequency) => {
    return {
      source: dbType.value,
      phase: "raw",
      datatype: dataset.environmentName,
      ingestType: "FULL_LOAD",
      sharepoint_details: {
        clientId: sharepointDetails.clientId,
        clientSecret: sharepointDetails.clientSecret,
        siteUrl: sharepointDetails.siteUrl,
        tenantId: sharepointDetails.tenantId,
        selectedItems: sharepointDetails.selectedItems,
        docFolder: sharepointDetails.docFolder,
        displayType: sharepointDetails.displayType,
        fileDestinationDir: sharepointDetails.fileDestinationDir,
      },
      // sharepoint_details: sharepointDetails,
      ...(frequency.length > 0 && { schedule: schedule(frequency) }),
    };
  };

  useEffect(() => {
    const dbTypeValidation =
      ((isManagedEgress || action.value === "managed ingest") &&
        !dbType.value) ||
      !action.value;

    const schemaValidation =
      dataset.phase.name.toLowerCase() === "enhance" && !selectedSchema.value;
    const currentStateValidation =
      action.value === "current state" || action.value === "data profile";
    if (
      (dbType.value && !awsResources.includes(dbType.value)) ||
      currentStateValidation
    ) {
      setIsCreateTaskDisabled(isTaskSubmitLoading || schemaValidation);
    } else {
      const awsTestConnectionValidation =
        awsResources.includes(dbType.value) && !testConnectionSuccess;

      setIsCreateTaskDisabled(
        isTaskSubmitLoading ||
          schemaValidation ||
          dbTypeValidation ||
          disableTaskButton ||
          awsTestConnectionValidation
      );
    }
  }, [
    isTaskSubmitLoading,
    disableTaskButton,
    action,
    dbType,
    selectedSchema,
    testConnectionSuccess,
  ]);

  const submitTask = async (phase, frequency) => {
    if (
      dbType.value &&
      dbType.value.toLowerCase().match(/aws[a-z ]*/) &&
      enableCDC &&
      !isSchedule
    ) {
      setShowToast(true);
      setToastMsg(
        "You must select Schedule Task with CDC for AWS data sources"
      );
    } else {
      setToastMsg("");
      setIsTaskSubmitLoading(true);
      setShowToast(false);
      try {
        let response;
        if (dbType.value) {
          let body;
          if (
            notificationBody?.status?.length > 0 &&
            (!notificationBody?.endpoint || !notificationBody?.owner)
          ) {
            setMdiNotificationError(true);
            setIsTaskSubmitLoading(false);
            setShowToast(true);
            return;
          } else {
            setMdiNotificationError(false);
          }
          if (dbType.value === "Sharepoint") {
            body = constructSharepointBody(phase, frequency);
            const { details: errors = [] } =
              managedIngestModel.validateSharepointTask(body) || {};
            if (errors.length) {
              setMdiTaskErrors(errors);
              setIsTaskSubmitLoading(false);
              setShowToast(true);
              return;
            }
          } else {
            body = constructBody(phase, frequency);
            const { details: errors = [] } = managedIngestModel.validateMDITask(
              body
            ) || { error: "error in else" };
            if (errors.length) {
              setSourceTableMsg(!sourceTables.length);
              setMdiTaskErrors(errors);
              setIsTaskSubmitLoading(false);
              setShowToast(true);
              return;
            } else {
              if (
                copyingTask &&
                sourceTables.length > 0 &&
                !sourceTables[0].isColumnSelect &&
                sourceTables[0].columns.length == 0
              ) {
                setShowToast(true);
                setIsTaskSubmitLoading(false);
                setToastMsg("Columns should not be empty");
                return;
              }
            }
          }
          response = await createManagedIngestTask(body);
        } else {
          const curr = createCurrentStateTaskJson(
            dataset.environmentName,
            selectedSchema.value
          );
          response = await createTask(curr);
        }

        if (!response.ok) {
          const { error = {} } = await response.json();
          if (error.length) {
            setToastMsg("");
            setIsTaskSubmitLoading(false);
            setToastMsg(JSON.stringify(error));
            setShowToast(true);
            return;
          }
        } else {
          if (notificationBody?.status?.length > 0) {
            const taskId =
              dbType.value === GlobalConst?.DB_TYPE_SHAREPOINT
                ? (await response.json())?.taskId
                : (await response.text()).split(":")[1].trim().slice(0, -1);
            const notificationResponse = await subscriptionApi(
              taskId,
              mdiTaskName
            );
            let notificationId;
            if (notificationResponse.ok) {
              notificationId = (await notificationResponse.json())?.id;
            }
            setShowNotificationSuccessModal(true);
            setNotificationSuccessModalDetails({ notificationId, taskId });
          }
        }
      } catch (error) {
        console.error("button threw error: ", error);
      }
      setTaskSuccess(true);
      setIsTaskSubmitLoading(false);
    }
  };

  const getNewSourceTable = (copyingTask = false, tableObj = {}) => {
    return {
      id: uuid.v4(),
      isNew: true,
      dbSchemaName: copyingTask ? tableObj.dbSchemaName : "",
      dbTableName: copyingTask ? tableObj.dbTableName : "",
      columns: [],
      tableFilter: null,
      isColumnSelect: true,
    };
  };

  const addSourceTable = (copyingTask = false, tableObjs = []) => {
    let newSourceTableArray = [];

    if (tableObjs.length > 0) {
      tableObjs.forEach((tableObj) => {
        const newSourceTable = getNewSourceTable(copyingTask, tableObj);
        newSourceTableArray = [newSourceTable, ...newSourceTableArray];
      });
    } else {
      const newSourceTable = getNewSourceTable();
      newSourceTableArray = [newSourceTable, ...newSourceTableArray];
    }
    const disable =
      dataset.phase.name.toLowerCase() === "enhance"
        ? sourceTables.length === 0
        : sourceTables.length === 9;

    if (disable) {
      setAddDisabled(true);
    } else {
      setAddDisabled(false);
    }
    setSourceTables(newSourceTableArray.concat(sourceTables));
  };

  const removeSourceTable = (id) => {
    const enable =
      dataset.phase.name.toLowerCase() === "enhance"
        ? sourceTables.length <= 1
        : sourceTables.length <= 10;
    if (enable) {
      setAddDisabled(false);
    }
    setSourceTables(
      sourceTables.filter((sourceTable) => sourceTable.id !== id)
    );
    setModalBody(null);
  };

  const sourceTableDetailsChanged = (newSourceTable) => {
    const changedSourceTables = sourceTables.map((s) => {
      if (s.id == newSourceTable.id) {
        return newSourceTable;
      }
      return s;
    });
    setSourceTables(changedSourceTables);
  };

  const isInValid = (keyName) =>
    mdiTaskErrors.some(({ context: { key } }) => key === keyName);

  const handleSharepointDetails = (details) => {
    setSharepointDetails(details);
  };

  const showPassHandler = (event) => {
    event.preventDefault();
    setShowPass(!showPass);
  };
  const awsResources = ["aws postgres rds", "aws mssql", "aws mysql"];
  const onPremServers = ["IBM_zos", "Sharepoint", "MSSQL", "Oracle"];

  const actionOptions = enableDataProfile
    ? [
        currentStateAction,
        dataProfileAction,
        managedIngestAction,
        managedEgressAction,
      ]
    : [currentStateAction, managedIngestAction];
  const actionSelector = () => (
    <Select
      id="actionSelector"
      value={action.value !== "" ? action : "Select..."}
      options={actionOptions.filter((action) => {
        return dataset.phase.name.toLowerCase() !== "enhance"
          ? action.value !== "current state" && action.value !== "data profile"
          : true;
      })}
      onChange={(selection) => {
        setAction(selection);
        setTrigger({ value: "", label: "" });
      }}
    />
  );
  const sourceSchemaSelector = () => (
    <Select
      id="sourceSchemaSelector"
      options={sourceSchemasOptions}
      onChange={(selection) => setSelectedSchema(selection)}
    />
  );
  const triggerOptions =
    action.value === "data profile"
      ? [dataProfileTrigger]
      : isManagedEgress
      ? [dataScheduledTrigger, dataIngestedTrigger, dataProfileTrigger]
      : [dataIngestedTrigger];
  const triggerSelector = () => (
    <Select
      id="triggerSelector"
      value={
        trigger.value !== ""
          ? trigger
          : triggerOptions.length === 1
          ? triggerOptions[0]
          : "Select..."
      }
      options={triggerOptions}
      isDisabled={action.value === ""}
      onChange={(selection) => {
        setTrigger(selection);
      }}
    />
  );

  function createCurrentStateTaskJson(dataType, representation) {
    if (action.value === "current state") {
      return {
        trigger: {
          event: "async_ingest_request",
        },
        source: {
          dataType,
          representation,
        },
        destination: {
          dataType,
        },
        action: {
          service: "TRANSFORM",
          operation: {
            name: "CURRENT_STATE",
          },
        },
      };
    } else {
      return {
        trigger: {
          event: "current_state",
        },
        source: {
          dataType,
          representation,
        },
        destination: {
          dataType,
        },
        action: {
          service: "TRANSFORM",
          operation: {
            name: "DATA_PROFILE",
          },
        },
      };
    }
  }

  async function createTask(json) {
    return fetch("/api/tasks/", {
      credentials: "same-origin",
      method: "POST",
      body: JSON.stringify(json),
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  const closeCreateTaskModal = () => {
    setShowNotificationSuccessModal(false);
  };

  return (
    <>
      <ConfirmationModal
        id="workflow-create-form-error"
        show={!!modalBody}
        showAcceptOnly={(modalBody || {}).showAcceptOnly}
        acceptButtonText={(modalBody || {}).acceptButtonText}
        body={(modalBody || {}).body}
        onCancel={() => setModalBody(null)}
        onAccept={() => modalBody.onAccept()}
      />
      <ConfirmationModal
        id="workflow-create-task-modal"
        title={
          MDINotificationsConst?.TASK_CREATION_WITH_NOTIFICATION_SUCCESSFUL_TITLE
        }
        show={showNotificationSuccessModal}
        showAcceptOnly={true}
        acceptButtonText={"OK"}
        body={
          notificationSuccessModalDetails?.notificationId
            ? createTaskSubmitModalBodySuccess()
            : createTaskSubmitModalBodyNotifyFailure()
        }
        onAccept={closeCreateTaskModal}
      />
      <Card>
        {isTaskSubmitLoading && <ProgressIndicator overlay={true} />}
        <Card.Body>
          Action
          {actionSelector()}
          Trigger
          {triggerSelector()}
          {dataset.phase.name.toLowerCase() === "enhance" ? "EDL Schema" : ""}
          {dataset.phase.name.toLowerCase() === "enhance" &&
            sourceSchemaSelector()}
          {dataset.phase.name.toLowerCase() === "raw" && isManagedEgress && (
            <Form>
              <Form.Group controlId="formGridSourceTable">
                <Form.Label>Source Table Name</Form.Label>
                <ValidatedInput
                  component={Form.Control}
                  id="sourceTableName"
                  type="text"
                  placeholder="Source Table Name"
                  defaultValue={sourceTableName}
                  onBlur={(e) => sourceTableNameValue(e.target.value)}
                  invalidMessage="Please enter valid Source Table Name"
                  isInvalid={isInValid("sourceTableName")}
                />
              </Form.Group>
            </Form>
          )}
          {(copyingTask ||
            selectedSchema.value ||
            dataset.phase.name.toLowerCase() !== "enhance") &&
            (action.value === "managed ingest" || isManagedEgress) && (
              <Form>
                <Form.Group>
                  <Form.Label>
                    {isManagedEgress ? "Target Database" : "Database Source"}
                  </Form.Label>
                  <Select
                    id="dbTypeSelector"
                    isDisabled={copyingTask}
                    value={databaseSourceOptions().filter(
                      ({ value }) => value === dbType.value
                    )}
                    options={databaseSourceOptions()}
                    onChange={(selection) => setDBType(selection)}
                  />
                </Form.Group>
                <Spacer height="20px" />
                {dbType.value && dbType.value === "Sharepoint" && (
                  <>
                    <SharepointUIForm
                      handleSharepointDetails={handleSharepointDetails}
                      isInValid={isInValid}
                    />
                  </>
                )}
                {awsResources.includes(dbType.value) && (
                  <>
                    <Form.Row>
                      <Form.Group as={Col} className="mb-0">
                        <Form.Label>Account Name</Form.Label>
                        <ValidatedInput
                          component={Form.Control}
                          id="awsAccountName"
                          type="text"
                          placeholder="AWS Account Name"
                          defaultValue={awsAccountName}
                          onBlur={(e) => awsAccountNameValue(e.target.value)}
                          invalidMessage="Please enter valid AWS Account Name"
                          isInvalid={isInValid("awsAccountName")}
                        />
                      </Form.Group>
                      <Form.Group as={Col} className="mb-0">
                        <Form.Label>Account Number</Form.Label>
                        <ValidatedInput
                          component={Form.Control}
                          id="awsAccountNo"
                          type="number"
                          placeholder="AWS Account Number"
                          defaultValue={awsAccountNo}
                          onBlur={(e) => awsAccountNoValue(e.target.value)}
                          invalidMessage="Please enter valid AWS Account Number"
                          isInvalid={isInValid("awsAccountNo")}
                        />
                      </Form.Group>
                    </Form.Row>
                    <Form.Row>
                      <Form.Group as={Col} className="mb-0">
                        <Form.Label>Account Region</Form.Label>
                        <ValidatedInput
                          component={Form.Control}
                          id="awsAccountRegion"
                          type="text"
                          placeholder="AWS Account Region"
                          defaultValue={awsAccountRegion}
                          onBlur={(e) => awsAccountRegionValue(e.target.value)}
                          invalidMessage="Please enter valid AWS Account Region"
                          isInvalid={isInValid("awsAccountRegion")}
                        />
                      </Form.Group>
                      <Form.Group as={Col} className="mb-0">
                        <Form.Label>AWS Vpc-Id</Form.Label>
                        <ValidatedInput
                          component={Form.Control}
                          id="awsAccountVPC"
                          type="text"
                          placeholder="AWS VPC-Id"
                          defaultValue={awsAccountVPC}
                          onBlur={(e) => awsAccountVPCValue(e.target.value)}
                          invalidMessage="Please enter valid Vpc-Id "
                          isInvalid={isInValid("awsAccountVPC")}
                        />
                      </Form.Group>
                    </Form.Row>
                    {isManagedEgress && (
                      <>
                        <Form.Row>
                          <Form.Group as={Col} className="mb-0">
                            <Form.Label>Subnet IDs</Form.Label>
                            <ValidatedInput
                              component={Form.Control}
                              id="subnetIDs"
                              type="text"
                              placeholder="Subnet IDs (Comma separated)"
                              defaultValue={subnetIDs}
                              onBlur={(e) => subnetIDsValue(e.target.value)}
                              invalidMessage="Please enter valid Subnet IDs"
                              isInvalid={isInValid("subnetIDs")}
                            />
                          </Form.Group>
                          <Form.Group as={Col} className="mb-0">
                            <Form.Label>Subnet Availability Zone ID</Form.Label>
                            <ValidatedInput
                              component={Form.Control}
                              id="subnetAvailabilityZoneID"
                              type="text"
                              placeholder="Subnet Availability Zone ID (Comma separated)"
                              defaultValue={subnetAvailabilityZoneID}
                              onBlur={(e) =>
                                subnetAvailabilityZoneIDValue(e.target.value)
                              }
                              invalidMessage="Please enter valid Subnet Availability Zone"
                              isInvalid={isInValid("subnetAvailabilityZoneID")}
                            />
                          </Form.Group>
                        </Form.Row>
                        <Form.Row>
                          <Form.Group as={Col} className="mb-0">
                            <Form.Label>RDS IP Address</Form.Label>
                            <ValidatedInput
                              component={Form.Control}
                              id="ipAddress"
                              type="text"
                              placeholder="IP Address"
                              defaultValue={ipAddress}
                              onBlur={(e) => rdsIPAddressValue(e.target.value)}
                              invalidMessage="Please enter valid IP Address"
                              isInvalid={isInValid("ipAddress")}
                            />
                          </Form.Group>
                          <Form.Group as={Col} className="mb-0">
                            <Form.Label>RDS Port</Form.Label>
                            <ValidatedInput
                              component={Form.Control}
                              id="rdsPort"
                              type="number"
                              placeholder="RDS Port"
                              defaultValue={rdsPort}
                              onBlur={(e) => rdsPortValue(e.target.value)}
                              invalidMessage="Please enter valid RDS Port"
                              isInvalid={isInValid("rdsPort")}
                            />
                          </Form.Group>
                        </Form.Row>
                        <Form.Row>
                          <Form.Group as={Col} className="mb-0">
                            <Form.Label>RDS Endpoint</Form.Label>
                            <ValidatedInput
                              component={Form.Control}
                              id="rdsEndpoint"
                              type="text"
                              placeholder="RDS Endpoint"
                              defaultValue={rdsEndpoint}
                              onBlur={(e) => rdsEndpointValue(e.target.value)}
                              invalidMessage="Please enter valid RDS Endpoint"
                              isInvalid={isInValid("rdsEndpoint")}
                            />
                          </Form.Group>
                        </Form.Row>
                      </>
                    )}
                  </>
                )}
                <Spacer height="20px" />
                {awsResources.includes(dbType.value) && (
                  <Form.Group>
                    <Form.Row>
                      <Button
                        disabled={isProgressBar || !enableConfigureBtn}
                        onClick={isManagedEgress ? configureMDE : configureMDI}
                        size="sm"
                        variant="primary"
                        id="ConfigureMDI"
                      >
                        {isManagedEgress ? "Configure MDE" : "Configure MDI"}
                      </Button>
                    </Form.Row>
                  </Form.Group>
                )}
                {isSpinner && (
                    <div className="text-center">
                      <Spinner
                          id="loading"
                          className="spinner-border uxf-spinner-border-lg"
                          animation="border"
                          role="status"
                      >
                        <span className="sr-only">Loading...</span>
                      </Spinner>
                    </div>
                )}
                {isProgressBar && (
                  <div className="text-center">
                    <span>
                      Please wait while we  {isManagedEgress ? "configure MDE" : "configure MDI"} environment, it will
                      take approximately 30 mins. 
                    </span>
                    <ProgressBar now={count} label={`${count}%`} />
                  </div>
                )}
                {dbType.value &&
                  (dbType.value === "IBM_zos" ||
                    dbType.value === "MSSQL" ||
                    dbType.value === "Oracle" ||
                    showConfigureMDI ||
                    ConfigureMDI ||
                    showDatabaseConfiguration) && (
                    <>
                      {!isManagedEgress && (<Form.Group>
                        <Form.Label>
                          Task Name{"  "}
                          <OverlayTrigger
                            placement="right"
                            overlay={
                              <Tooltip id={`tooltip-key`}>
                                Task name should NOT a. Be more than 32
                                characters, b. Contain any special characters
                                except '-' and c. Contain 'test'
                              </Tooltip>
                            }
                          >
                            <span style={{ marginRight: "3px" }}>
                              <MdInfoOutline />
                            </span>
                          </OverlayTrigger>
                        </Form.Label>
                        <ValidatedInput
                          component={Form.Control}
                          id="mdiTaskName"
                          type="text"
                          placeholder="Task Name"
                          defaultValue={mdiTaskName}
                          // maxLength={32}
                          onBlur={(e) => tasknameValue(e.target.value)}
                          invalidMessage="Task name should NOT a. Be more than 32 characters, b. Contain any special characters except '-' and c. Contain 'test'"
                          isInvalid={taskNameValidate(taskNameError)}
                        />
                      </Form.Group>)}
                      <Form.Row>
                        <Form.Group as={Col} className="mb-0">
                          <h4>Database Configuration</h4>
                        </Form.Group>
                      </Form.Row>
                      {!isSpinner && (
                        <Form.Group>
                          <Card style={styles.card}>
                            <Card.Body className="bg-light">
                              <Form.Row>
                                <Form.Group as={Col}>
                                  <Form.Label>Username</Form.Label>
                                  <ValidatedInput
                                    component={Form.Control}
                                    id="dbUserName"
                                    type="text"
                                    placeholder="Database username"
                                    defaultValue={dbUserName}
                                    onBlur={(e) =>
                                      setDbUserName(e.target.value)
                                    }
                                    invalidMessage="Must provide database username"
                                    isInvalid={isInValid("username")}
                                  />
                                </Form.Group>
                                <Form.Group as={Col}>
                                  <Form.Label>Password</Form.Label>
                                  <InputGroup>
                                    <ValidatedInput
                                      component={Form.Control}
                                      id="dbPassword"
                                      type={showPass ? "text" : "password"}
                                      placeholder="Database password"
                                      defaultValue={dbPassword}
                                      onBlur={(e) =>
                                        setDbPassword(e.target.value)
                                      }
                                      invalidMessage="Must provide database password"
                                      isInvalid={isInValid("password")}
                                    />
                                    <Button
                                      onClick={showPassHandler}
                                      variant="outline-primary"
                                    >
                                      {showPass ? <FaEyeSlash /> : <FaEye />}
                                    </Button>
                                  </InputGroup>
                                </Form.Group>
                              </Form.Row>
                              {!isManagedEgress && (<Form.Row>
                                <Form.Group as={Col}>
                                  <Form.Label>Server</Form.Label>
                                  <ValidatedInput
                                    component={Form.Control}
                                    id="dbServer"
                                    type="text"
                                    placeholder="hostname or IP address"
                                    defaultValue={dbServer}
                                    onBlur={(e) => setDbServer(e.target.value)}
                                    invalidMessage="Must provide database server hostname/ip"
                                    isInvalid={isInValid("server")}
                                  />
                                </Form.Group>
                                <Form.Group as={Col}>
                                  <Form.Label>Port</Form.Label>
                                  <ValidatedInput
                                    component={Form.Control}
                                    id="dbPort"
                                    type="number"
                                    placeholder="Port"
                                    defaultValue={dbPort}
                                    onBlur={(e) => setDbPort(e.target.value)}
                                    invalidMessage="Must provide database server port"
                                    isInvalid={isInValid("port")}
                                  />
                                </Form.Group>
                              </Form.Row>)}
                              <Form.Group>
                                <Form.Label>
                                  {awsResources.includes(dbType.value) ? (
                                    <>
                                      Database Name
                                      <OverlayTrigger
                                        placement="right"
                                        overlay={
                                          <Tooltip id={`tooltip-key`}>
                                            The Database name defined during the
                                            installation.
                                          </Tooltip>
                                        }
                                      >
                                        <span style={{ marginRight: "3px" }}>
                                          <MdInfoOutline />
                                        </span>
                                      </OverlayTrigger>
                                    </>
                                  ) : dbType.value === "IBM_zos" ||
                                    dbType.value === "MSSQL" ||
                                    dbType.value === "Oracle" ? (
                                    "Database"
                                  ) : (
                                    <>
                                      Location
                                      <OverlayTrigger
                                        placement="right"
                                        overlay={
                                          <Tooltip id={`tooltip-key`}>
                                            The DB2 location name defined during
                                            the installation. This should be a
                                            relational database management
                                            system – under z/OS, either a
                                            subsystem or a group connection.
                                          </Tooltip>
                                        }
                                      >
                                        <span style={{ marginRight: "3px" }}>
                                          <MdInfoOutline />
                                        </span>
                                      </OverlayTrigger>
                                    </>
                                  )}
                                </Form.Label>
                                <ValidatedInput
                                  component={Form.Control}
                                  id="dbLocation"
                                  type="text"
                                  placeholder={
                                    awsResources.includes(dbType.value)
                                      ? "Database Name"
                                      : dbType.value === "IBM_zos" ||
                                        dbType.value === "MSSQL" ||
                                        dbType.value === "Oracle"
                                      ? "Database"
                                      : "Location"
                                  }
                                  defaultValue={dbLocation}
                                  onBlur={(e) => setDbLocation(e.target.value)}
                                  invalidMessage="Must provide database"
                                  isInvalid={isInValid("database")}
                                />
                              </Form.Group>
                              {awsResources.includes(dbType.value) && (
                                <Form.Group>
                                  <Form.Row>
                                    <Button
                                      disabled={isManagedEgress || !isFormComplete}
                                      onClick={testconnection}
                                      size="sm"
                                      variant="outline-primary"
                                      id="testconnection"
                                    >
                                      Test Connection
                                    </Button>
                                  </Form.Row>
                                </Form.Group>
                              )}
                              {!isManagedEgress && (
                                <Form.Group>
                                  <Form.Row>
                                    <Form.Check
                                      id="mdi-table"
                                      name="mdi-source-type-radio"
                                      checked={!viewSource}
                                      type="radio"
                                      label="Table"
                                      onClick={() => setViewSource(false)}
                                      custom
                                    />
                                    <Form.Check
                                      id="mdi-view"
                                      name="mdi-source-type-radio"
                                      checked={viewSource}
                                      type="radio"
                                      label="View"
                                      onClick={() => setViewSource(true)}
                                      custom
                                    />
                                  </Form.Row>
                                </Form.Group>
                              )}
                            </Card.Body>
                          </Card>
                        </Form.Group>
                      )}
                      {isSpinner && (
                        <div className="text-center">
                          <Spinner
                            id="loading"
                            className="spinner-border uxf-spinner-border-lg"
                            animation="border"
                            role="status"
                          >
                            <span className="sr-only">Loading...</span>
                          </Spinner>
                        </div>
                      )}
                      <Spacer height="20px" />
                      <Form.Row>
                        <Form.Group as={Col} className="mb-0">
                          <h4>{viewSource ? "View" : "Table"} Details</h4>
                          {sourceTableMsg && (
                            <div class="invalid-feedback" style={styles.show}>
                              Must provide {viewSource ? "View" : "Table"}
                              Details
                            </div>
                          )}
                        </Form.Group>
                        <Form.Group as={Col} className="mb-0">
                          <span style={styles.add}>
                            <Button
                              id="addSourceTable"
                              disabled={addDisabled}
                              onClick={() => addSourceTable()}
                              size="sm"
                              variant="outline-primary"
                            >
                              Add
                              {isManagedEgress
                                ? " Target Table"
                                : " Source Table"}
                            </Button>
                          </span>
                        </Form.Group>
                      </Form.Row>
                      <hr />
                      {sourceTables.length > 0 && (
                        <Accordion
                          id="sourceTableAccordion"
                          filterable
                          activeKey={
                            (
                              sourceTables
                                .filter((s) => s.isNew)
                                .find((s) => s.isNew) || {}
                            ).id
                          }
                          items={sourceTables.map((sourceTable, idx) => {
                            return {
                              id: sourceTable.id,
                              filterContent: sourceTable,
                              actions: [
                                {
                                  text: "Remove",
                                  icon: <MdDelete size="18" />,
                                  handler: () => {
                                    setModalBody({
                                      onAccept: () =>
                                        removeSourceTable(sourceTable.id),
                                      body: (
                                        <div>
                                          <div>
                                            Are you sure you want to remove?
                                          </div>
                                        </div>
                                      ),
                                    });
                                  },
                                },
                              ],
                              header: (
                                <>
                                  <span
                                    style={{ display: "block" }}
                                    className="text-muted small"
                                  >
                                    <b>Schema:</b>
                                    <i>{sourceTable.dbSchemaName || "None"}</i>
                                  </span>
                                  <span
                                    style={{ display: "block" }}
                                    className="text-muted small"
                                  >
                                    <b>{viewSource ? "View:" : "Table:"}</b>
                                    <i>{sourceTable.dbTableName || "None"}</i>
                                  </span>
                                </>
                              ),
                              body: (
                                <SourceTableForm
                                  action={action}
                                  currentSourceTable={sourceTable}
                                  viewSource={viewSource}
                                  isInValid={isInValid}
                                  copyingTask={copyingTask}
                                  sourceTableDetailsChanged={
                                    sourceTableDetailsChanged
                                  }
                                />
                              ),
                            };
                          })}
                        />
                      )}
                    </>
                  )}
                {dbType.value &&
                  (onPremServers.includes(dbType.value) || ConfigureMDI) && (
                    <>
                      <MDINotificationForm
                        representation={selectedSchema}
                        dbType={dbType}
                        setNotificationBody={setNotificationBody}
                        mdiNotificationError={mdiNotificationError}
                        taskName={mdiTaskName}
                      />
                      <Spacer height="25px" />
                      <Form.Row>
                        <div style={{ justifyContent: "center" }}>
                          <div
                            className="mb-0"
                            style={{ display: "inline-block" }}
                          >
                            <Button
                              id="openadvancesettings"
                              style={{ margin: 0, padding: "0 0 7px 0" }}
                              onClick={() =>
                                setOpenAdvancedSettings(!openAdvancedSettings)
                              }
                              aria-controls="mdi-collapse-control"
                              aria-expanded={openAdvancedSettings}
                              variant="link"
                            >
                              {openAdvancedSettings ? (
                                <MdRemoveCircleOutline />
                              ) : (
                                <MdAddCircleOutline />
                              )}
                            </Button>
                          </div>
                          <div
                            className="mb-0"
                            style={{ display: "inline-block" }}
                          >
                            <h4 style={{ margin: 0, paddingLeft: "5px" }}>
                              Advanced Settings&nbsp;&nbsp;
                              <small>
                                <i
                                  style={{ color: "#909090", fontSize: "70%" }}
                                >
                                  Optional
                                </i>
                              </small>
                            </h4>
                          </div>
                        </div>
                      </Form.Row>
                      <hr />
                      <Collapse
                        id="advancedSettingsCollapse"
                        in={openAdvancedSettings}
                      >
                        <Card>
                          <Card.Body className="bg-light">
                            {dbType.value === "IBM_zos" && (
                              <>
                                <Form.Label className="uxf-label">
                                  CDC reader UDTF name:&nbsp;
                                  <OverlayTrigger
                                    placement="right"
                                    overlay={
                                      <Tooltip id={`udtf-tooltip-key`}>
                                        User-Defined Table Function, which is to
                                        access CDC data. Specify the two-part
                                        name resulting from the values you have
                                        chosen for schema name, &#38;R4ZSCNM and
                                        the function name, &#38;R4ZIFITF.
                                      </Tooltip>
                                    }
                                  >
                                    <span style={{ marginRight: "3px" }}>
                                      <MdInfoOutline />
                                    </span>
                                  </OverlayTrigger>
                                </Form.Label>
                                <br />
                                <Form.Label dataTestId="udtf-function-new">
                                  {udtfFunction}
                                </Form.Label>
                              </>
                            )}
                            <br />
                            <Form.Label className="uxf-label">
                              Ingest Type:
                            </Form.Label>
                            <Form.Group>
                              <Form.Row>
                                <Form.Check
                                  id="ingestType-fullLoad"
                                  checked
                                  type="checkbox"
                                  label="Full Load"
                                  custom
                                />
                                {(dbType.value === "IBM_zos" ||
                                  dbType.value === "MSSQL" ||
                                  dbType.value === "Oracle" ||
                                  awsResources.includes(dbType.value)) && (
                                  <Form.Check
                                    id="ingestType-CDC"
                                    checked={enableCDC}
                                    disabled={viewSource}
                                    type="checkbox"
                                    label="CDC"
                                    onClick={() => {
                                      setEnableCDC(!enableCDC);
                                    }}
                                    custom
                                  />
                                )}
                              </Form.Row>
                            </Form.Group>

                            <Form.Label className="uxf-label">
                              Scheduler:
                            </Form.Label>
                            <Form.Group>
                              <Form.Row>
                                {(onPremServers.includes(dbType.value) ||
                                  awsResources.includes(dbType.value)) && (
                                  <Form.Check
                                    id="schedule"
                                    checked={isSchedule}
                                    type="checkbox"
                                    label="Schedule Task"
                                    onClick={() =>
                                      setIsScheduleCheck(!isSchedule)
                                    }
                                    custom
                                  />
                                )}
                              </Form.Row>
                            </Form.Group>
                            <Form.Group>
                              {isSchedule && (
                                <SchedulerFrequency
                                  schedulerDetails={schedulerDetails}
                                  existingSchedulerDetails={
                                    copyingTask
                                      ? task.task_definition.trigger.metadata
                                          .schedule
                                      : {}
                                  }
                                  isInValid={isInValid}
                                />
                              )}
                            </Form.Group>
                          </Card.Body>
                        </Card>
                      </Collapse>
                    </>
                  )}
              </Form>
            )}
          <br />
          <span className="float-right">
            <Button
              onClick={() => {
                copyingTask ? redirectToTaskList() : setCreatingTask(false);
              }}
              size="sm"
              variant="secondary"
            >
              Cancel
            </Button>
            &nbsp;&nbsp;
            <Button
              disabled={!(isManagedEgress && !!dbUserName 
                && !!dbPassword 
                && !!dbLocation 
                && sourceTables.some((sourceTable) => sourceTable.dbSchemaName && sourceTable.dbTableName)) 
                && isCreateTaskDisabled}
              onClick={() => {
                switch(action?.value) {
                  case 'managed egress': 
                    submitEgressTask()
                  break
                  default: submitTask(dataset.phase.name.toLowerCase(), scheduleFrequency);
                }
              }}
              size="sm"
              variant="primary"
            >
              Create Task
            </Button>
          </span>
        </Card.Body>
      </Card>
      <Toast
        hidden={!showToast}
        show={showToast}
        onClose={() => setShowToast(false)}
        style={{
          position: "fixed",
          top: 20,
          right: 20,
          zIndex: 9999,
          borderColor: "#c21020",
        }}
      >
        {toastMsg ? (
          <React.Fragment>
            <Toast.Header>
              <strong className="mr-auto">Invalid for submission</strong>
            </Toast.Header>
            <Toast.Body>{toastMsg}</Toast.Body>
          </React.Fragment>
        ) : (
          <React.Fragment>
            <Toast.Header>
              <strong className="mr-auto">Invalid for submission</strong>
            </Toast.Header>
            <Toast.Body>
              Please review the errors and make any necessary corrections.
            </Toast.Body>
          </React.Fragment>
        )}
      </Toast>
    </>
  );
};

export default WorkflowTaskForm;
