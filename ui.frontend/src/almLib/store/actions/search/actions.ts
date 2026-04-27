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
import { AnyAction } from 'redux';
import {
  CLOSE_AUTOCOMPLETE,
  CLOSE_SEARCH,
  OPEN_SEARCH,
  SET_SEARCH_SUGGESTIONS,
  SET_SEARCH_TERM,
} from './actionTypes';

export const onOpenSearch = (payload: { e: MouseEvent }): AnyAction => ({
  type: OPEN_SEARCH,
  payload,
});

export const onCloseSearch = (payload: { e: MouseEvent }): AnyAction => ({
  type: CLOSE_SEARCH,
  payload,
});

export const showSuggestionsList = (payload: {
  userSearchHistory: string[] | null;
  popularSearches: string[] | null;
}): AnyAction => ({
  type: SET_SEARCH_SUGGESTIONS,
  payload,
});

export const closeSuggestionsList = (): AnyAction => ({
  type: CLOSE_AUTOCOMPLETE,
  payload: '',
});

export const searchInput = (payload: any): AnyAction => ({
  type: SET_SEARCH_TERM,
  payload,
});
