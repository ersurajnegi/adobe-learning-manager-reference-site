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
import { PrimeAccount, PrimeRecommendations, PrimeUserRecommendationCriteria } from '../models';
import { RECOMMENDATION_PRODUCTS, RECOMMENDATION_ROLES } from './constants';

export enum WIZARD_STEP {
  PRODUCTS = 'PRODUCTS',
  ROLES = 'ROLES',
  LEVELS = 'LEVELS',
}

export enum POPUP_VIEW {
  START = 'Start',
  WIZARD = 'Wizard',
  ERROR = 'Error',
  LOADING = 'Loading',
}

export interface ParallelFetchAPIType {
  networkCall?: Promise<void>;
  steps?: Array<string>;
}

export const isNextButtonEnable = (
  currentStep: string,
  selectedProducts: PrimeRecommendations[],
  selectedRoles: PrimeRecommendations[]
) => {
  if (currentStep === WIZARD_STEP.PRODUCTS) {
    return selectedProducts?.length > 0;
  }
  if (currentStep === WIZARD_STEP.ROLES) {
    return selectedRoles?.length > 0;
  }
  return true;
};

export const getIsRolesEnabled = (account: PrimeAccount) => {
  return account.prlCriteria?.roles?.enabled;
};

export const getIsProductsEnabled = (account: PrimeAccount) => {
  return account.prlCriteria?.products?.enabled;
};

export const getElement = (ele: string) => {
  return document.getElementById(ele);
};

export const focusOnWizardStep = (query: string) => {
  setTimeout(() => {
    const elementToFocus = getElement(query);
    if (elementToFocus) {
      (elementToFocus as HTMLElement).focus();
    }
  }, 0);
};

export const checkIfWeCanShowPRLWizard = (
  account: PrimeAccount,
  products: PrimeUserRecommendationCriteria[],
  roles: PrimeUserRecommendationCriteria[]
) => {
  //If Products/roles are enabled and Product/Roles options are not available, then skip PRL
  if (
    (getIsRolesEnabled(account) && roles.length === 0) ||
    (getIsProductsEnabled(account) && products.length === 0)
  ) {
    return false;
  }
  return true;
};

export const getProductsData = (account: PrimeAccount, getRecommendationsForType: Function) => {
  const returnObject: ParallelFetchAPIType = {};
  if (getIsProductsEnabled(account)) {
    returnObject.networkCall = getRecommendationsForType(RECOMMENDATION_PRODUCTS);
    returnObject.steps = account.prlCriteria?.products?.levelsEnabled
      ? [WIZARD_STEP.PRODUCTS, WIZARD_STEP.LEVELS]
      : [WIZARD_STEP.PRODUCTS];
  } else {
    returnObject.networkCall = Promise.resolve(undefined);
    returnObject.steps = [];
  }
  return returnObject;
};

export const getRolesData = (account: PrimeAccount, getRecommendationsForType: Function) => {
  const returnObject: ParallelFetchAPIType = {};
  if (getIsRolesEnabled(account)) {
    returnObject.networkCall = getRecommendationsForType(RECOMMENDATION_ROLES);
    returnObject.steps = account.prlCriteria?.roles?.levelsEnabled
      ? [WIZARD_STEP.ROLES, WIZARD_STEP.LEVELS]
      : [WIZARD_STEP.ROLES];
  } else {
    returnObject.networkCall = Promise.resolve(undefined);
    returnObject.steps = [];
  }
  return returnObject;
};

export const getLevelsData = (account: PrimeAccount, getRecommendationLevels: Function) => {
  const returnObject: ParallelFetchAPIType = {};
  const prlCriteria = account.prlCriteria || {};
  if (prlCriteria.roles?.levelsEnabled || prlCriteria.products?.levelsEnabled) {
    returnObject.networkCall = getRecommendationLevels();
  } else {
    returnObject.networkCall = Promise.resolve(undefined);
  }
  return returnObject;
};
