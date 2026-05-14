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
jest.mock('@utils/global', () => ({
  getALMObject: jest.fn(),
  getWindowObject: jest.fn(),
}));

import * as globalUtils from '@utils/global';
import { widgetHelperALM, initWidgetHelperALM } from '@utils/widgetHelperALM';

const mockGetALMObject = globalUtils.getALMObject as jest.MockedFunction<typeof globalUtils.getALMObject>;
const mockGetWindowObject = globalUtils.getWindowObject as jest.MockedFunction<typeof globalUtils.getWindowObject>;

describe('widgetHelperALM', () => {
  beforeEach(() => {
    // Reset singleton state before each test (private field access via any cast)
    (widgetHelperALM as any)._initialized = false;
    // Set up default mock return values (needed because resetMocks:true clears them)
    mockGetWindowObject.mockReturnValue({} as any);
    mockGetALMObject.mockReturnValue({
      getALMUser: jest.fn().mockResolvedValue(null),
    } as any);
  });

  describe('Singleton pattern', () => {
    it('widgetHelperALM_importedTwice_isSameInstance', () => {
      const { widgetHelperALM: instance2 } = require('@utils/widgetHelperALM');
      expect(widgetHelperALM).toBe(instance2);
    });
  });

  describe('init', () => {
    it('init_firstCall_attachesInstanceToWindow', () => {
      const mockWindow: any = {};
      mockGetWindowObject.mockReturnValue(mockWindow);

      widgetHelperALM.init();

      expect(mockWindow.widgetHelperALM).toBe(widgetHelperALM);
    });

    it('init_firstCall_setsInitializedToTrue', () => {
      mockGetWindowObject.mockReturnValue({} as any);

      widgetHelperALM.init();

      expect(widgetHelperALM.isInitialized()).toBe(true);
    });

    it('init_calledTwice_doesNotReattachToWindow', () => {
      const mockWindow: any = {};
      mockGetWindowObject.mockReturnValue(mockWindow);

      widgetHelperALM.init();
      // Reset call count to test second call
      mockGetWindowObject.mockClear();
      widgetHelperALM.init();

      // Second init() call returns early — getWindowObject NOT called again
      expect(mockGetWindowObject).not.toHaveBeenCalled();
    });

    it('isInitialized_beforeInit_returnsFalse', () => {
      expect(widgetHelperALM.isInitialized()).toBe(false);
    });
  });

  describe('getALMUser', () => {
    it('getALMUser_validResponse_returnsUserDataWithoutRelationships', async () => {
      const userWithRelationships = {
        attributes: { name: 'Test User', email: 'test@example.com' },
        relationships: { account: { data: { id: 'acc-1' } } },
      };
      const fullResponse = {
        data: userWithRelationships,
        included: [{ type: 'account', attributes: { id: 'acc-1' } }],
      };
      mockGetALMObject.mockReturnValue({
        getALMUser: jest.fn().mockResolvedValue(JSON.stringify(fullResponse)),
      } as any);

      const result = await widgetHelperALM.getALMUser();

      expect(result).not.toBeNull();
      expect((result as any).attributes?.name).toBe('Test User');
      expect((result as any).relationships).toBeUndefined();
    });

    it('getALMUser_nullResponse_returnsNull', async () => {
      mockGetALMObject.mockReturnValue({
        getALMUser: jest.fn().mockResolvedValue(null),
      } as any);

      const result = await widgetHelperALM.getALMUser();

      expect(result).toBeNull();
    });
  });

  describe('getALMAccount', () => {
    it('getALMAccount_responseWithIncluded_returnsFirstIncludedItem', async () => {
      const accountData = { type: 'account', attributes: { id: 'acc-1', name: 'My Account' } };
      const fullResponse = {
        data: { attributes: { name: 'Test User' }, relationships: {} },
        included: [accountData],
      };
      mockGetALMObject.mockReturnValue({
        getALMUser: jest.fn().mockResolvedValue(JSON.stringify(fullResponse)),
      } as any);

      const result = await widgetHelperALM.getALMAccount();

      expect(result).toEqual(accountData);
    });

    it('getALMAccount_responseWithEmptyIncluded_returnsNull', async () => {
      const fullResponse = {
        data: { attributes: { name: 'Test User' }, relationships: {} },
        included: [],
      };
      mockGetALMObject.mockReturnValue({
        getALMUser: jest.fn().mockResolvedValue(JSON.stringify(fullResponse)),
      } as any);

      const result = await widgetHelperALM.getALMAccount();

      expect(result).toBeNull();
    });

    it('getALMAccount_nullResponse_returnsNull', async () => {
      mockGetALMObject.mockReturnValue({
        getALMUser: jest.fn().mockResolvedValue(null),
      } as any);

      const result = await widgetHelperALM.getALMAccount();

      expect(result).toBeNull();
    });
  });

  describe('initWidgetHelperALM', () => {
    it('initWidgetHelperALM_called_delegatesToWidgetHelperALMInit', () => {
      const mockWindow: any = {};
      mockGetWindowObject.mockReturnValue(mockWindow);

      initWidgetHelperALM();

      expect(widgetHelperALM.isInitialized()).toBe(true);
      expect(mockWindow.widgetHelperALM).toBe(widgetHelperALM);
    });
  });
});
