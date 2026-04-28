/*
Copyright 2021 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/
export enum NATIVEAPPEVENTS {
  LOGOUT = 'Logout',
  LOGIN_IN_BROWSER = 'LogInBrowser',
  DOWNLOAD_LERANER_REPORT = 'DownloadLearnerReport',
  DOWNLOAD_BADGE = 'DownloadBadge',
  DOWNLOAD_JOB_AID = 'DownloadJobAid',
  DOWNLOAD_ATTACHMENT = 'DownloadAttachment',
  QR_CODE = 'QRCode',
  COPY_TO_CB = 'CopyToClipboard',
  MAIL_TO = 'MailTo',
  OPEN_EXTERNAL_URL = 'OpenExternalUrl',
  CLOSE_APP = 'CloseApp',
  RELOAD = 'Reload',
  IMMERSIVE_PARTIALLY_LOADED = 'ImmersivePartiallyLoaded',
  IMMERSIVE_LOADED = 'ImmersiveLoaded',
  IMMERSIVE_FULLY_LOADED = 'ImmersiveFullyLoaded',
  DOWNLOAD_STARTED = 'DownloadStarted',
  DOWNLOAD_FAILED = 'DownloadFailed',
  PLAYER_LOADED = 'PlayerLoaded',
  PLAYER_CLOSED = 'PlayerClosed',
  LOADING_PASSWORD_PAGE = 'LoadingPasswordPage',
  USER_LOCALES_INFO = 'UserLocaleInfo',
  ACCOUNT_HOST_NAME = 'AccountHostName',
  DOWNLOAD_LINKS = 'DownloadLinks',
  DOWNLOAD_CONTENT = 'DownloadContent',
  UPDATE_CONTENT = 'UpdateContent',
  DELETE_CONTENT = 'DeleteContent',
  LAUNCH_OFFLINE_PLAYER = 'LaunchOfflinePlayer',
  LAUNCH_ONLINE_PLAYER = 'LaunchOnlinePlayer',
  FETCH_OFFLINE_CATALOGS = 'FetchOfflineCatalogs',
  RELOAD_IMMERSIVE = 'ReloadImmersive',
  RETRY_NETWORK_CONNECTION = 'RetryNetworkConnection',
  STATIC_CONTENT_WITH_AUTH_FOR_OFFLINE = 'StaticContentWithAuthForOffline',
  STATIC_CONTENT_WITHOUT_AUTH_FOR_OFFLINE = 'StaticContentWithoutAuthForOffline',
  RELOAD_WEBVIEW = 'ReloadWebview',
  LOAD_APPLICATION_STORE = 'LoadApplicationStore',
  SAVE_RATING_INFO = 'SaveRatingInfo',
  ENTER_FULL_SCREEN = 'EnterFullScreen',
  EXIT_FULL_SCREEN = 'ExitFullScreen',
}

export const ContentType = {
  VIDEO: 'VIDEO',
  CP: 'CP',
  AUDIO: 'AUDIO',
  SCORM: 'SCORM',
  AICC: 'AICC',
  PR: 'PR',
  ACTIVITY: 'Activity',
  CR: 'Classroom',
  VCR: 'Virtual Classroom',
  QUIZ: 'QUIZ',
  HTML: 'HTML',
  OTHER: 'OTHER',
  LTI: 'LTI',
  ELEARNING: 'Elearning',
};

export const NetworkStatus = {
  ONLINE: 'online',
  OFFLINE: 'offline',
};

export const PLAYER_API_CONSTS = {
  LO_INFO: 'learningObjects/{loId}',
  LO_INFO_PREVIEW: 'learningObjects/{loId}?include=instances.loResources.resources.room',
  LO_INFO_FOR_LP:
    'learningObjects/{loId}?include=enrollment.loInstance,subLOs.enrollment.loInstance.loResources.resources',
  LO_INFO_WITH_GRADES_FOR_LP:
    'learningObjects/{loId}?include=enrollment.loInstance,subLOs.enrollment.loInstance.loResources.resources,subLOs.enrollment.loResourceGrades',
  LO_INFO_PREVIEW_FOR_LP:
    'learningObjects/{loId}?include=subLOs,instances.subLoInstances.loResources.resources',
  LO_INFO_TOC_PREVIEW_FOR_LP: 'learningObjects/{loId}?include=subLOs.instances.loResources',
  LO_INFO_MULTI_ENROLLMENT: 'learningObjects/{loId}?include=instances.enrollment.loResourceGrades',
  LO_ENROLLMENT:
    'enrollments/{enrollmentId}?include=loResourceGrades,loInstance.loResources.resources',
  LO_INFO_WITH_GRADES: 'learningObjects/{loId}?include=enrollment.loResourceGrades',
  LO_INFO_WITH_ROOM:
    'learningObjects/{loId}?include=enrollment.loResourceGrades,enrollment.loInstance.loResources.resources.room',
  LO_INFO_WITH_SOURCE:
    'learningObjects/{loId}?include=enrollment.loResourceGrades,enrollment.loInstance.loResources.resources&showLoContentSource={showLoContentSource}',
  LO_INFO_WITH_ROOM_SOURCE:
    'learningObjects/{loId}?include=enrollment.loResourceGrades,enrollment.loInstance.loResources.resources.room&showLoContentSource=true',
  LO_INFO_NEW: 'learningObjects/{loId}?include=enrollment.loInstance',
  LO_INFO_NEW_FOR_LP: 'learningObjects/{loId}?include=enrollment.loInstance,subLOs.enrollment',
  COURSE_NOTES: 'learningObjects/{courseId}/note',
  COURSE_INSTANCE_NOTES: 'learningObjects/{courseId}/instances/{instanceId}/note',
  LO_STATE: 'users/{userId}/playerLOState?loId={loId}',
  LO_STATE_WITH_INSTANCE_ID: 'users/{userId}/playerLOState?loId={loId}&loInstanceId={instanceId}',
  LO_RESOURCE_NOTES: 'learningObjects/{loId}/resources/{loResourceId}/note',
  LO_RESOURCE_NOTE: 'learningObjects/{loId}/resources/{loResourceId}/note/{noteId}',
  LO_RESOURCE_STATE: 'users/{userId}/playerState?loId={loId}&loResourceId={loResourceId}',
  LO_RESOURCE_LO_STATE: 'users/{userId}/playerLOState?loId={loId}&loResourceId={loResourceId}',
  LO_RESOURCE_LO_STATE_WITH_INSTANCE_ID:
    'users/{userId}/playerLOState?loId={loId}&loResourceId={loResourceId}&loInstanceId={instanceId}',
  CAN_START:
    'account/{accountId}/course/{courseId}/canStart?is_player=true&i_qp_root_lp_id={i_qp_root_lp_id}&i_qp_course_instance_id={courseInstanceId}&i_qp_lp_id={i_qp_lp_id}&i_qp_cert_id={i_qp_cert_id}',
  MODULE_RESET:
    'users/{userId}/moduleReset?loId={courseId}&loResourceId={loResourceId}&i_qp_reset={i_qp_reset}&i_qp_started_time={i_qp_started_time}&close={close}',
  LO_RESOURCE_GRADES: 'loResourceGrades/{loResourceGradeId}',
  COURSE_CONTROL_SETTINGS: 'learningObjects/{courseId}/playerControlSettings',
  LO_CONTROL_SETTINGS: 'learningObjects/{loId}/playerControlSettings',
  EXTERNAL_SESSION:
    'externalSessionUrl?loId={loId}&loResourceId={loResourceId}&resourceId={resourceId}',
  CONTENT_URL_VIDEO:
    'bcproxy/formal/video/{videoId}/metadata?asset_id={assetId}&asset_type={assetType}',
};

export enum AppMode {
  WEB = 'WEB',
  INSIDEAPP = 'INSIDEAPP',
}

export const FLUTTER_BRIDGE = 'FlutterBridge';
export const APPEVENT = 'APPEVENT';

export enum DownloadStatus {
  STARTED = 'started',
  FAILED = 'failed',
  COMPLETED = 'completed',
}

export const LO_DOWNLOAD_INCLUDES = {
  LEARNING_OBJECT_INCLUDES:
    'instances.enrollment.loResourceGrades,instances.loResources.resources,instances.badge,supplementaryResources,enrollment.loResourceGrades,skills.skillLevel.skill',

  LEARNING_OBJECT_INCLUDES_WITH_SUBLO:
    'instances.enrollment.loResourceGrades,instances.loResources.resources.room,instances.badge,supplementaryResources,enrollment.loResourceGrades,skills.skillLevel.skill,subLOs.prerequisiteLOs,subLOs.enrollment,subLOs.instances.loResources.resources,subLOs.instances.badge,enrollment.loInstance.loResources.resources.room',

  SEARCH_INCLUDES: 'model.instances',
  SEARCH_INCLUDES_FOR_SEARCH_PAGE:
    'model.instances.loResources.resources,model.instances.badge,model.supplementaryResources,model.enrollment.loResourceGrades,model.skills.skillLevel.skill',

  ENROLLMENT_INCLUDES: 'learningObject.subLOs.enrollment.loResourceGrades',
};

export const BooleanAsStrings = {
  TRUE: 'true',
  FALSE: 'false',
};

export const NativeAppEvents = {
  DEEPLINK: 'DEEPLINK',
  PUSH_NOTIFICATIONS: 'PUSH_NOTIFICATIONS',
  QRCODE: 'QRCODE',
  BACK_PRESSED_ON_APP: 'BACK_PRESSED_ON_APP',
  INVALID_QR_CODE: 'INVALID_QR_CODE',
  OFFLINE_INITIALIZE: 'OFFLINE_INITIALIZE',
  DOWNLOADED_LO_ITEMS: 'DOWNLOADED_LO_ITEMS',
  ONLINE_TO_OFFLINE: 'ONLINE_TO_OFFLINE',
  OFFLINE_TO_ONLINE: 'OFFLINE_TO_ONLINE',
  DOWNLOAD_PROGRESS: 'DOWNLOAD_PROGRESS',
  DOWNLOAD_STATUS: 'DOWNLOAD_STATUS',
  DOWNLOADED_LOS: 'DOWNLOADED_LOS',
  ORIENTATION_CHANGE: 'ORIENTATION_CHANGE',
  SET_DEVICE_INFO: 'SET_DEVICE_INFO',
  SET_APP_RATING_INFO: 'SET_APP_RATING_INFO',
  OPEN_APP_RATING_PANEL: 'OPEN_APP_RATING_PANEL',
};

export const CMI_ENFORCED_FIELDS_QP =
  '&enforcedFields%5Bresource%5D=inferPassOnComplete,clearStateOnCmiExitNormal';
