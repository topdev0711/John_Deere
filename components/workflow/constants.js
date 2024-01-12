// MDI Notifications
export const MDINotificationsConst = {
  MDI_NOTIFICATION_PROTOCOLS: ['SQS'],
  NOTIFICATION_EVENT_TOPIC: 'subscription_notification_topic',
  NOTIFICATION_STATUS_LIST: ['PENDING', 'COMPLETE', 'COMPLETE_WITH_ERRORS', 'FAILED'],
  SP_NOTIFICATION_STATUS_LIST: ['COMPLETE', 'FAILED'],
  MDI_NOTIFICATION_HEADER: 'MDI Notifications',
  MDI_NOTIFICATION_SETTINGS: 'Notification Settings:',
  AWS_PROTOCOL_LABEL: 'AWS Protocol:',
  PROTOCOL_ENDPOINT_ARN_LABEL: 'Protocol Endpoint Arn:',
  OWNER_USER_ID: 'Protocol Owner User ID:',
  NOTIFICATION_STATUS_HEADER: 'Notification Status:',
  PROTOCOL_OWNER_INVALID_MESSAGE: 'Must provide protocol owner user ID',
  PROTOCOL_ENDPOINT_ARN_INVALID_MESSAGE: 'Must provide protocol endpoint arn',
  TASK_CREATION_WITH_NOTIFICATION_SUCCESSFUL_TITLE: 'Task Created Successfully',
  CONFLUENCE_HELP_LINK: 'https://confluence.deere.com/display/EDAP/Managed+Data+Ingest%3A+Notifications'
}

export const GlobalConst = {
  DB_TYPE_SHAREPOINT: 'Sharepoint',
  SUPPORT_LINK: 'https://johndeere.service-now.com/ep?id=sc_cat_item&sys_id=fa64d0eb1332a34cb43fbcaf3244b0b5'
}
