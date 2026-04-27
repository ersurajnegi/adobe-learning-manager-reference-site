/**
Copyright 2021 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/
export enum AppEvents {
  LOADING = 'LOADING',
  ERROR = 'ERROR',
  INITIALIZE = 'INITIALIZE',
  COMMON_DATA_LOADED = 'COMMON_DATA_LOADED',
  SETUP_PARAMS_FOR_OFFLINE_ON_LOAD = 'SETUP_PARAMS_FOR_OFFLINE_ON_LOAD',
  LOAD_DOWNLOADS = 'LOAD_DOWNLOADS',
  LOAD_OFFLINE_PAGE = 'LOAD_OFFLINE_PAGE',
  CHANGE_NETWORK_STATUS = 'CHANGE_NETWORK_STATUS',
  UPDATE_DOWNLOAD_PROGRESS = 'UPDATE_DOWNLOAD_PROGRESS',
  UPDATE_DOWNLOAD_STATUS = 'UPDATE_DOWNLOAD_STATUS',
  CLOSE_DIALOG_ON_BACK = 'CLOSE_DIALOG_ON_BACK',
  DELETE_DOWNLOAD = 'DELETE_DOWNLOAD',
  HIDE_CONFIRMATION_DIALOG = 'HIDE_CONFIRMATION_DIALOG',
  UPDATE_OFFLINE_CATALOGS = 'UPDATE_OFFLINE_CATALOGS',
  SET_CONTENT_TO_BE_UPDATED = 'SET_CONTENT_TO_BE_UPDATED',
  LOAD_OFFLINE_CATALOGS = 'LOAD_OFFLINE_CATALOGS',
}
