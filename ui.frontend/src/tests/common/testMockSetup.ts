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
// Common mock setup for tests that have circular dependency issues
// Add this BEFORE any imports in test files

export const setupGlobalMocks = () => {
  jest.mock('../../utils/global', () => ({
    getALMConfig: jest.fn(() => ({
      primeApiURL: 'https://test.api.com/primeapi/v2',
      commerceURL: 'https://test.commerce.com',
      graphqlProxyPath: 'https://test.graphql.com',
      locale: 'en-US',
      accountId: 'test-account',
      baseUrl: 'https://test.example.com',
      accessToken: 'test-token',
      csrfToken: 'test-csrf',
    })),
    getALMObject: jest.fn(() => ({
      storage: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      },
      isPrimeUserLoggedIn: jest.fn(() => true),
      getAccessToken: jest.fn(() => 'test-token'),
      getCsrfToken: jest.fn(() => 'test-csrf'),
    })),
    getALMUser: jest.fn(() => Promise.resolve({ user: { id: 'user:123' } })),
    getALMAttribute: jest.fn(),
    getQueryParamsFromUrl: jest.fn(() => ({})),
    updateURLParams: jest.fn(),
    getItemFromStorage: jest.fn(),
    setItemToStorage: jest.fn(),
    getWindowObject: () => ({ location: { href: '' } }),
    isBookmarksEnabled: jest.fn(() => false),
    containsElement: jest.fn(() => false),
    containsSubstr: jest.fn(() => false),
  }));

  jest.mock('../../utils/restAdapter', () => ({
    RestAdapter: {
      get: jest.fn(),
      post: jest.fn(),
      patch: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      ajax: jest.fn(),
      resetPreviousRequest: jest.fn(),
    },
  }));

  jest.mock('../../utils/jsonAPIAdapter', () => ({
    JsonApiParse: jest.fn(data => {
      if (typeof data === 'string') {
        const parsed = JSON.parse(data);
        return parsed.data || {};
      }
      return data.data || {};
    }),
  }));

  jest.mock('../../utils/translationService', () => ({
    GetTranslation: jest.fn(key => key),
    GetTranslationReplaced: jest.fn((key, value) => `${key}_${value}`),
    GetTranslationsReplaced: jest.fn((key, values) => JSON.stringify(values)),
    ReplaceAccountTerminology: jest.fn(text => text),
    getPreferredLocalizedMetadata: jest.fn(item => item?.localizedMetadata?.[0]),
  }));
};

// Usage in test files:
// Place this at the very top of the file, before any imports:
//
// jest.mock('../../utils/global', () => ({ ... }));
// jest.mock('../../utils/restAdapter', () => ({ ... }));
// // etc.
//
// import { ... } from '../../utils/...';
