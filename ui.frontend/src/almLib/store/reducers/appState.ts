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

import { AnyAction, Reducer, combineReducers } from 'redux';
import { AppEvents } from '../actions/appState';
import { AppMode } from '../../utils/mobileAppUtils/appConstants';
import { DownloadProgress, ContentToBeUpdated } from '../../models';

export interface AppState {
  // client: BrowserClient;
  appMode: string;
  isOnline: boolean;
  downloadProgress: DownloadProgress[];
  contentToBeUpdated: ContentToBeUpdated[];
  //   appRatingPanel: AppRatingPanel;
  //   appDownloadPanel: AppDownloadPanel;
}

const appMode: Reducer<string, AnyAction> = (state: string | undefined, action: AnyAction) => {
  switch (action.type) {
    case AppEvents.SETUP_PARAMS_FOR_OFFLINE_ON_LOAD:
      return action.mode;
    default:
      return state ?? AppMode.WEB;
  }
};

const isOnline: Reducer<boolean, AnyAction> = (state: boolean | undefined, action: AnyAction) => {
  switch (action.type) {
    case AppEvents.CHANGE_NETWORK_STATUS:
      return action.value;
    default:
      return state ?? true;
  }
};

const downloadProgress: Reducer<DownloadProgress[], AnyAction> = (
  state: DownloadProgress[] | undefined,
  action: AnyAction
) => {
  switch (action.type) {
    case AppEvents.UPDATE_DOWNLOAD_PROGRESS:
      return action.value;
    case AppEvents.UPDATE_DOWNLOAD_STATUS:
      return action.value;
    case AppEvents.DELETE_DOWNLOAD:
      // remove items from state array
      return state?.filter(item => item.loId !== action.value.loId);
    default:
      return state ?? [];
  }
};

const contentToBeUpdated: Reducer<ContentToBeUpdated[], AnyAction> = (
  state: ContentToBeUpdated[] | undefined,
  action: AnyAction
) => {
  switch (action.type) {
    case AppEvents.SET_CONTENT_TO_BE_UPDATED:
      return action.value;
    default:
      return state ?? [];
  }
};

const appState: Reducer<AppState, AnyAction> = combineReducers({
  appMode,
  isOnline,
  downloadProgress,
  contentToBeUpdated,
});

export { appState };
