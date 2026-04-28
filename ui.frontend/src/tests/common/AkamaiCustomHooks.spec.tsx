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

import AkamaiCustomHooksInstance from '@common/AkamaiCustomHooks';

const mockGetALMConfig = jest.fn();
const mockIsUserLoggedIn = jest.fn();
const mockJsonApiParse = jest.fn();
const mockRestAdapterGet = jest.fn();
const mockALMCustomHooksGetTraining = jest.fn();

jest.mock('@utils/global', () => ({
  getALMConfig: () => mockGetALMConfig(),
  isUserLoggedIn: () => mockIsUserLoggedIn(),
}));

jest.mock('@utils/jsonAPIAdapter', () => ({
  JsonApiParse: (response: unknown) => mockJsonApiParse(response),
}));

jest.mock('@utils/restAdapter', () => ({
  RestAdapter: {
    get: (params: unknown) => mockRestAdapterGet(params),
  },
}));

jest.mock('@common/ALMCustomHooks', () => ({
  __esModule: true,
  default: {
    getTraining: (id: string, params: unknown) => mockALMCustomHooksGetTraining(id, params),
  },
}));

const mockConfig = {
  primeCdnTrainingBaseEndpoint: 'https://cdn.example.com/training',
  esBaseUrl: 'https://es.example.com',
  almCdnBaseUrl: 'https://cdn.alm.example.com',
};

describe('AkamaiCustomHooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetALMConfig.mockReturnValue(mockConfig);
    mockIsUserLoggedIn.mockReturnValue(false);
    mockJsonApiParse.mockReturnValue({ learningObject: { id: 'course:123' } });
    mockRestAdapterGet.mockResolvedValue({ data: {} });
    mockALMCustomHooksGetTraining.mockResolvedValue({ id: 'course:123' });
    AkamaiCustomHooksInstance.setConfigUrls();
  });

  describe('getTraining - logged in', () => {
    beforeEach(() => {
      mockIsUserLoggedIn.mockReturnValue(true);
    });

    it('getTraining_loggedIn_delegatesToALMCustomHooksWithCorrectArgs', async () => {
      const params = { include: 'enrollment' };
      await AkamaiCustomHooksInstance.getTraining('course:123', params);
      expect(mockALMCustomHooksGetTraining).toHaveBeenCalledTimes(1);
      expect(mockALMCustomHooksGetTraining).toHaveBeenCalledWith('course:123', params);
    });

    it('getTraining_loggedIn_returnsResultFromALMCustomHooks', async () => {
      const mockTraining = { id: 'course:123', name: 'Test Course' };
      mockALMCustomHooksGetTraining.mockResolvedValue(mockTraining);
      const result = await AkamaiCustomHooksInstance.getTraining('course:123');
      expect(result).toEqual(mockTraining);
    });

    it('getTraining_loggedIn_doesNotCallRestAdapter', async () => {
      await AkamaiCustomHooksInstance.getTraining('course:123');
      expect(mockRestAdapterGet).not.toHaveBeenCalled();
    });

    it('getTraining_loggedIn_propagatesALMError', async () => {
      mockALMCustomHooksGetTraining.mockRejectedValue(new Error('Network error'));
      await expect(AkamaiCustomHooksInstance.getTraining('course:123')).rejects.toThrow('Network error');
    });
  });

  describe('getTraining - not logged in', () => {
    it('getTraining_notLoggedIn_callsCdnWithCorrectUrl', async () => {
      await AkamaiCustomHooksInstance.getTraining('course:123');
      expect(mockRestAdapterGet).toHaveBeenCalledTimes(1);
      expect(mockRestAdapterGet).toHaveBeenCalledWith({
        url: `${mockConfig.almCdnBaseUrl}/course/123.json`,
      });
    });

    it('getTraining_notLoggedIn_parsesResponseAndReturnsLearningObject', async () => {
      const mockLearningObject = { id: 'course:123', name: 'CDN Course' };
      const mockResponse = { data: {} };
      mockRestAdapterGet.mockResolvedValue(mockResponse);
      mockJsonApiParse.mockReturnValue({ learningObject: mockLearningObject });

      const result = await AkamaiCustomHooksInstance.getTraining('course:123');

      expect(mockJsonApiParse).toHaveBeenCalledWith(mockResponse);
      expect(result).toEqual(mockLearningObject);
    });

    it('getTraining_notLoggedIn_doesNotCallALMCustomHooks', async () => {
      await AkamaiCustomHooksInstance.getTraining('course:123');
      expect(mockALMCustomHooksGetTraining).not.toHaveBeenCalled();
    });

    it('getTraining_idWithMultipleColons_onlyFirstColonReplacedInUrl', async () => {
      await AkamaiCustomHooksInstance.getTraining('course:123:456');
      expect(mockRestAdapterGet).toHaveBeenCalledWith({
        url: `${mockConfig.almCdnBaseUrl}/course/123:456.json`,
      });
    });

    it('getTraining_notLoggedIn_propagatesCdnError', async () => {
      mockRestAdapterGet.mockRejectedValue(new Error('CDN error'));
      await expect(AkamaiCustomHooksInstance.getTraining('course:123')).rejects.toThrow('CDN error');
    });
  });

  describe('setConfigUrls', () => {
    it('setConfigUrls_updatesUrlsFromNewConfig', () => {
      const newConfig = { ...mockConfig, almCdnBaseUrl: 'https://new-cdn.alm.example.com' };
      mockGetALMConfig.mockReturnValue(newConfig);

      AkamaiCustomHooksInstance.setConfigUrls();

      expect(AkamaiCustomHooksInstance.almCdnBaseUrl).toBe('https://new-cdn.alm.example.com');
    });
  });
});
