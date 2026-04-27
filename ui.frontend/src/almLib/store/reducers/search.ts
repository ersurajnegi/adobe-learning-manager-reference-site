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
import { AnyAction, combineReducers, Reducer } from 'redux';
import {
  CLOSE_AUTOCOMPLETE,
  CLOSE_SEARCH,
  OPEN_SEARCH,
  SET_SEARCH_SUGGESTIONS,
  SET_SEARCH_TERM,
} from '../actions/search/actionTypes';

export interface SearchState {
  searching: boolean;
  autocomplete: boolean;
  userSearchHistory: string[] | null;
  popularSearches: string[] | null;
}

const searching: Reducer<boolean, AnyAction> = (state: boolean | undefined, action: AnyAction) => {
  switch (action.type) {
    case OPEN_SEARCH:
      return true;
    case CLOSE_SEARCH:
      return false;
    default:
      return state ? state : false;
  }
};

const autocomplete: Reducer<boolean, AnyAction> = (
  state: boolean | undefined,
  action: AnyAction
) => {
  switch (action.type) {
    case OPEN_SEARCH:
    case SET_SEARCH_SUGGESTIONS:
      return true;
    case CLOSE_AUTOCOMPLETE:
    case CLOSE_SEARCH:
      return false;
    default:
      return state ? state : false;
  }
};

const userSearchHistory: Reducer<string[] | null, AnyAction> = (
  state: string[] | null | undefined,
  action: AnyAction
) => {
  switch (action.type) {
    case SET_SEARCH_SUGGESTIONS:
      if (action.payload.userSearchHistory) {
        return action.payload.userSearchHistory;
      } else {
        return state ? state : [];
      }
    case CLOSE_SEARCH:
      return [];
    default:
      return state ? state : [];
  }
};

const popularSearches: Reducer<string[] | null, AnyAction> = (
  state: string[] | null | undefined,
  action: AnyAction
) => {
  switch (action.type) {
    case SET_SEARCH_SUGGESTIONS:
      if (action.payload.popularSearches) {
        return action.payload.popularSearches;
      } else {
        return state ? state : [];
      }
    case CLOSE_SEARCH:
      return [];
    default:
      return state ? state : [];
  }
};

const search: Reducer<SearchState, AnyAction> = combineReducers({
  searching,
  autocomplete,
  userSearchHistory,
  popularSearches,
});

export default search;
