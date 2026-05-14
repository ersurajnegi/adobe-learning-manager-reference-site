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
jest.mock('@almLib/utils/constants', () => ({
  RECOMMENDATION_PRODUCTS: 'products',
  RECOMMENDATION_ROLES: 'roles',
}));

import {
  WIZARD_STEP,
  POPUP_VIEW,
  isNextButtonEnable,
  getIsRolesEnabled,
  getIsProductsEnabled,
  checkIfWeCanShowPRLWizard,
  getProductsData,
  getRolesData,
  getLevelsData,
} from '@almLib/utils/prlWizardUtils';

describe('prlWizardUtils', () => {
  it('enums', () => {
    expect(WIZARD_STEP.PRODUCTS).toBe('PRODUCTS');
    expect(POPUP_VIEW.START).toBe('Start');
  });

  it('isNextButtonEnable', () => {
    expect(isNextButtonEnable('PRODUCTS', [{} as any], [])).toBe(true);
    expect(isNextButtonEnable('PRODUCTS', [], [])).toBe(false);
    isNextButtonEnable('ROLES', [], [{} as any]);
    isNextButtonEnable('LEVELS', [], []);
  });

  it('getIsRolesEnabled', () => {
    const account = { prlCriteria: { roles: { enabled: true } } } as any;
    expect(getIsRolesEnabled(account)).toBe(true);
    getIsRolesEnabled({} as any);
  });

  it('getIsProductsEnabled', () => {
    const account = { prlCriteria: { products: { enabled: true } } } as any;
    expect(getIsProductsEnabled(account)).toBe(true);
    getIsProductsEnabled({} as any);
  });

  it('checkIfWeCanShowPRLWizard', () => {
    const account = {
      prlCriteria: { roles: { enabled: true }, products: { enabled: true } },
    } as any;
    expect(checkIfWeCanShowPRLWizard(account, [{}] as any, [{}] as any)).toBe(true);
    checkIfWeCanShowPRLWizard(account, [], [{}] as any);
  });

  it('getProductsData', () => {
    const account = { prlCriteria: { products: { enabled: true, levelsEnabled: false } } } as any;
    const result = getProductsData(account, jest.fn());
    expect(result.steps).toEqual(['PRODUCTS']);
    getProductsData({} as any, jest.fn());
  });

  it('getRolesData', () => {
    const account = { prlCriteria: { roles: { enabled: true, levelsEnabled: true } } } as any;
    const result = getRolesData(account, jest.fn());
    expect(result.steps).toEqual(['ROLES', 'LEVELS']);
    getRolesData({} as any, jest.fn());
  });

  it('getLevelsData', () => {
    const mockGetLevels = jest.fn().mockReturnValue(Promise.resolve());
    const account = { prlCriteria: { roles: { levelsEnabled: true } } } as any;
    const result = getLevelsData(account, mockGetLevels);
    // levelsEnabled is true so networkCall should be set from getRecommendationLevels
    expect(mockGetLevels).toHaveBeenCalledTimes(1);
    expect(result.networkCall).toBeInstanceOf(Promise);

    const emptyResult = getLevelsData({} as any, jest.fn());
    // No prlCriteria — networkCall resolves immediately without calling callback
    expect(emptyResult.networkCall).toBeInstanceOf(Promise);
  });
});
