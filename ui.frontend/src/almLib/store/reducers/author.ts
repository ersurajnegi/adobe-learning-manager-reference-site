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
import { PrimeLearningObject } from '../../models';

import { AnyAction, Reducer, combineReducers } from 'redux';
import {
  LOAD_TRAININGS_AUTHOR,
  PAGINATE_TRAININGS_AUTHOR,
  UPDATE_SORT_AUTHOR,
  UPDATE_TRAININGS_AUTHOR,
} from '../actions/author/actionTypes';
export interface authorState {
  trainings: PrimeLearningObject[] | null;
  next: string;
  sort: 'name' | 'date' | '-name' | '-date' | 'effectiveness' | 'rating' | '-rating' | 'dueDate';
}

const trainings: Reducer<PrimeLearningObject[] | null, AnyAction> = (
  state: PrimeLearningObject[] | null | undefined,
  action: AnyAction
) => {
  switch (action.type) {
    case LOAD_TRAININGS_AUTHOR:
      return action.payload?.trainings || [];
    case PAGINATE_TRAININGS_AUTHOR:
      return [...state!, ...action.payload?.trainings];
    case UPDATE_TRAININGS_AUTHOR:
      return action.payload?.trainings || [];
    default:
      return state || [];
  }
};

const sort: Reducer<
  'name' | 'date' | '-name' | '-date' | 'effectiveness' | 'rating' | '-rating' | 'dueDate',
  AnyAction
> = (
  state:
    | 'name'
    | 'date'
    | '-name'
    | '-date'
    | 'effectiveness'
    | 'rating'
    | '-rating'
    | 'dueDate'
    | undefined,
  action: AnyAction
) => {
  switch (action.type) {
    case UPDATE_SORT_AUTHOR:
      return action.payload;
    default:
      return state || '-date';
  }
};

const next: Reducer<string, AnyAction> = (state: string | undefined, action: AnyAction) => {
  switch (action.type) {
    case LOAD_TRAININGS_AUTHOR:
    case PAGINATE_TRAININGS_AUTHOR:
      return action.payload?.next || '';
    default:
      return state || '';
  }
};

const authorTrainings: Reducer<authorState, AnyAction> = combineReducers({
  trainings,
  next,
  sort,
});

export default authorTrainings;
