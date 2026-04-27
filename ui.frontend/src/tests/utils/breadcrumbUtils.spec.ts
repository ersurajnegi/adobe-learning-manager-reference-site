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
const mockStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};

jest.mock('@almLib/utils/global', () => ({
  getALMObject: jest.fn(),
}));
jest.mock('@almLib/utils/catalog', () => ({
  splitStringIntoArray: jest.fn(),
}));
jest.mock('@almLib/utils/constants', () => ({
  CURRENT_BREADCRUMB_PATH: 'current',
  PREVIOUS_BREADCRUMB_PATH: 'previous',
}));

import {
  getBreadcrumbPath,
  pushToBreadcrumbPath,
  popFromBreadcrumbPath,
  clearBreadcrumbPathDetails,
  restorePreviousBreadcrumbPath,
} from '@almLib/utils/breadcrumbUtils';
import { getALMObject } from '@almLib/utils/global';
import { splitStringIntoArray } from '@almLib/utils/catalog';

describe('breadcrumbUtils', () => {
  beforeEach(() => {
    mockStorage.getItem.mockClear();
    mockStorage.setItem.mockClear();
    mockStorage.removeItem.mockClear();
    mockStorage.getItem.mockReturnValue(null);
    (getALMObject as jest.Mock).mockReturnValue({ storage: mockStorage });
    (splitStringIntoArray as jest.Mock).mockImplementation(
      (s: string, sep: string) => s?.split(sep) || []
    );
  });

  it('getBreadcrumbPath', () => {
    const result = getBreadcrumbPath();
    expect(mockStorage.getItem).toHaveBeenCalled();
    expect(result).toEqual({ parentPath: [], currentTrainingId: '' });
  });

  it('pushToBreadcrumbPath', () => {
    mockStorage.getItem.mockReturnValue({ parentPath: [], currentTrainingId: '' });
    pushToBreadcrumbPath('path1', 'id1');
    expect(mockStorage.setItem).toHaveBeenCalled();
  });

  it('popFromBreadcrumbPath', () => {
    mockStorage.getItem.mockReturnValue({
      parentPath: ['id1::url1', 'id2::url2'],
      currentTrainingId: 'id3',
    });
    popFromBreadcrumbPath('id2');
    expect(mockStorage.setItem).toHaveBeenCalled();
  });

  it('clearBreadcrumbPathDetails', () => {
    mockStorage.getItem.mockReturnValue({ parentPath: ['path1'], currentTrainingId: 'oldId' });
    clearBreadcrumbPathDetails('newId');
    expect(mockStorage.setItem).toHaveBeenCalled();
  });

  it('restorePreviousBreadcrumbPath', () => {
    mockStorage.getItem.mockReturnValueOnce({ parentPath: [], currentTrainingId: 'id1' });
    restorePreviousBreadcrumbPath();
    expect(mockStorage.setItem).toHaveBeenCalled();
  });
});
