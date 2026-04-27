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
import { AnyAction } from 'redux';
import { AppEvents } from './actionTypes';
import { AppMode } from '../../../utils/mobileAppUtils/appConstants';
import { ContentToBeUpdated, DownloadProgress, PrimeLearningObject } from '../../../models';

export const changeNetworkStatus = (value: boolean): AnyAction => ({
  type: AppEvents.CHANGE_NETWORK_STATUS,
  value,
});

export const setAppMode = (mode: AppMode) => {
  return {
    type: AppEvents.SETUP_PARAMS_FOR_OFFLINE_ON_LOAD,
    mode,
  };
};

export const setContentToBeUpdated = (contentToBeUpdated: ContentToBeUpdated[]) => {
  return {
    type: AppEvents.SET_CONTENT_TO_BE_UPDATED,
    value: [...contentToBeUpdated],
  };
};

export const updateDownloadStatusState = (downloadProgress: DownloadProgress[]) => {
  return {
    type: AppEvents.UPDATE_DOWNLOAD_STATUS,
    value: [...downloadProgress],
  };
};

export const updateDownloadProgressState = (downloadProgress: DownloadProgress[]) => {
  return {
    type: AppEvents.UPDATE_DOWNLOAD_PROGRESS,
    value: [...downloadProgress],
  };
};

export const updateOfflineCatalogs = (lo: PrimeLearningObject, loId: string) => {
  return {
    type: AppEvents.UPDATE_OFFLINE_CATALOGS,
    data: {
      loOverviewAPIResponse: lo,
      id: loId,
    },
  };
};

export const loadOfflineCatalogs = (catalogAPIResponse: any) => {
  return { type: AppEvents.LOAD_OFFLINE_CATALOGS, data: catalogAPIResponse };
};
