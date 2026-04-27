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
import { FLUTTER_BRIDGE, NATIVEAPPEVENTS, NetworkStatus } from './appConstants';
import { getQueryParamsFromUrl, getWindowObject } from '../global';
import { AppMode } from './appConstants';
import { NativeAppEventBody } from '../../models/custom';
import store from '../../../store/APIStore';

export interface OfflinePlayerParams {
  offlinePlayerUrl: string;
  offlineSyncLinks?: string[];
  loOverviewLink?: string;
  subLoOverviewLinks?: string[];
}

export function sendEventsToApp(action: string, params: NativeAppEventBody): void {
  console.log(`Sending event : [${action}] with params : ${JSON.stringify(params)}`);
  const windowObject = getWindowObject();
  windowObject.flutter_inappwebview &&
    typeof windowObject.flutter_inappwebview.callHandler === 'function' &&
    windowObject.flutter_inappwebview.callHandler(FLUTTER_BRIDGE, {
      action,
      params,
    });
}

export function isLoadedInsideApp(appMode?: string): boolean {
  if (!appMode) {
    const state = store.getState();
    appMode = state.appState.appMode;
  }
  return appMode === AppMode.INSIDEAPP;
}

export function isOfflineModeInApp(): boolean {
  const state = store.getState();
  const isInsideApp = state.appState?.appMode === AppMode.INSIDEAPP;
  if (!isInsideApp) {
    return false;
  }
  const isOnline = state.appState?.isOnline;
  const { networkStatus } = getQueryParamsFromUrl();
  return !isOnline && networkStatus === NetworkStatus.OFFLINE;
}

export function launchOfflinePlayer(params: OfflinePlayerParams): void {
  sendEventsToApp(NATIVEAPPEVENTS.LAUNCH_OFFLINE_PLAYER, params as NativeAppEventBody);
}
