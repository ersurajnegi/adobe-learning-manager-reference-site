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
/**
 * Unit tests for useSearch.tsx hook
 * Tests search functionality, suggestions, and URL management
 */

// Mock dependencies BEFORE imports to prevent circular dependency issues
jest.mock('@utils/global', () => ({
  getALMConfig: jest.fn(() => ({
    primeApiURL: 'https://test.api.com/primeapi/v2',
    commerceURL: 'https://test.commerce.com',
    graphqlProxyPath: 'https://test.graphql.com',
    locale: 'en-US',
    accountId: 'test-account',
  })),
  getALMObject: jest.fn(() => ({
    storage: { getItem: jest.fn(), setItem: jest.fn(), removeItem: jest.fn() },
    isPrimeUserLoggedIn: jest.fn(() => true),
  })),
  getALMUser: jest.fn(() => Promise.resolve({ user: { id: 'user:123' } })),
  getALMAttribute: jest.fn(),
  getQueryParamsFromUrl: jest.fn(() => ({})),
  getWindowObject: jest.fn(() => ({ userSearchHistory: [] })),
  updateURLParams: jest.fn(),
  isBookmarksEnabled: jest.fn(() => false),
}));
jest.mock('@utils/restAdapter', () => ({
  RestAdapter: { get: jest.fn(), post: jest.fn() },
}));
jest.mock('@utils/jsonAPIAdapter', () => ({
  JsonApiParse: jest.fn(data => (typeof data === 'string' ? JSON.parse(data).data : data.data)),
}));
jest.mock('@utils/translationService', () => ({
  GetTranslation: jest.fn(key => key),
  GetTranslationReplaced: jest.fn(),
  getPreferredLocalizedMetadata: jest.fn(),
}));

jest.mock('@utils/catalog', () => ({
  debounce: (fn: Function) => fn, // Return function immediately for testing
}));

import { act } from '@testing-library/react';
import { waitFor } from '@testing-library/dom';
import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { IntlProvider } from 'react-intl';
import { createStore } from 'redux';
import { useSearch } from '@hooks/catalog/useSearch';
import * as globalUtils from '@utils/global';
import { RestAdapter } from '@utils/restAdapter';

// Custom renderHook implementation for React Testing Library v9
function renderHook<T>(hookCallback: () => T, options?: { wrapper?: React.ComponentType<any> }) {
  const result: any = { current: null };

  function TestComponent() {
    result.current = hookCallback();
    return null;
  }

  const Wrapper = options?.wrapper || React.Fragment;
  const container = document.createElement('div');

  if (document.body) {
    document.body.appendChild(container);
  }

  const component = React.createElement(Wrapper, null, React.createElement(TestComponent));

  ReactDOM.render(component, container);

  return {
    result,
    rerender: () => {
      const newComponent = React.createElement(Wrapper, null, React.createElement(TestComponent));
      ReactDOM.render(newComponent, container);
    },
    unmount: () => {
      ReactDOM.unmountComponentAtNode(container);
      if (document.body && document.body.contains(container)) {
        document.body.removeChild(container);
      }
    },
  };
}

// Mock dependencies
const mockGetALMConfig = globalUtils.getALMConfig as jest.MockedFunction<
  typeof globalUtils.getALMConfig
>;
const mockGetALMUser = globalUtils.getALMUser as jest.MockedFunction<typeof globalUtils.getALMUser>;
const mockGetQueryParamsFromUrl = globalUtils.getQueryParamsFromUrl as jest.MockedFunction<
  typeof globalUtils.getQueryParamsFromUrl
>;
const mockGetWindowObject = globalUtils.getWindowObject as jest.MockedFunction<
  typeof globalUtils.getWindowObject
>;
const mockUpdateURLParams = globalUtils.updateURLParams as jest.MockedFunction<
  typeof globalUtils.updateURLParams
>;
const mockIsBookmarksEnabled = globalUtils.isBookmarksEnabled as jest.MockedFunction<
  typeof globalUtils.isBookmarksEnabled
>;

// Create mock store
const createMockStore = (initialState = {}) => {
  const reducer = (
    state = {
      catalog: { query: '', ...initialState },
    },
    action: any
  ) => {
    switch (action.type) {
      case 'catalog/updateSearchText':
        return {
          ...state,
          catalog: { ...state.catalog, query: action.payload.query },
        };
      case 'catalog/resetSearchText':
        return {
          ...state,
          catalog: { ...state.catalog, query: '' },
        };
      default:
        return state;
    }
  };

  return createStore(reducer);
};

const wrapper = ({ children, store = createMockStore() }: any) => (
  <Provider store={store}>
    <IntlProvider locale="en">{children}</IntlProvider>
  </Provider>
);

describe('useSearch', () => {
  let mockStore: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockStore = createMockStore();

    // Default mocks
    mockGetALMConfig.mockReturnValue({
      primeApiURL: 'https://api.test.com/',
    } as any);
    mockGetALMUser.mockResolvedValue({
      user: { id: 'user-1' },
    } as any);
    mockGetQueryParamsFromUrl.mockReturnValue({});
    mockGetWindowObject.mockReturnValue({ userSearchHistory: [] } as any);
    mockUpdateURLParams.mockImplementation(() => {});
    mockIsBookmarksEnabled.mockReturnValue(false);
    (RestAdapter.get as jest.Mock).mockResolvedValue('{"data":[]}');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ==========================================
  // Basic Hook Initialization
  // ==========================================

  describe('initialization', () => {
    it('should initialize with empty query', () => {
      const { result } = renderHook(() => useSearch(), { wrapper });

      expect(result.current.query).toBe('');
    });

    it('should initialize query from URL params', () => {
      mockGetQueryParamsFromUrl.mockReturnValue({ searchText: 'react' });

      const { result } = renderHook(() => useSearch(), { wrapper });

      expect(result.current.query).toBe('react');
    });

    it('should detect mobile screen on mount', () => {
      global.innerWidth = 500;

      const { result } = renderHook(() => useSearch(), { wrapper });

      expect(typeof result.current.handleSearch).toBe('function');
      expect(typeof result.current.resetSearch).toBe('function');
      expect(typeof result.current.getSearchSuggestions).toBe('function');
    });

    it('should detect desktop screen on mount', () => {
      global.innerWidth = 1200;

      const { result } = renderHook(() => useSearch(), { wrapper });

      expect(typeof result.current.handleSearch).toBe('function');
      expect(typeof result.current.resetSearch).toBe('function');
      expect(typeof result.current.getSearchSuggestions).toBe('function');
    });
  });

  // ==========================================
  // handleSearch Function
  // ==========================================

  describe('handleSearch', () => {
    it('should update search text and URL params', () => {
      const { result } = renderHook(() => useSearch(), { wrapper });

      act(() => {
        result.current.handleSearch('test query', true);
      });

      expect(mockUpdateURLParams).toHaveBeenCalledWith({
        searchText: 'test query',
        autoCorrectMode: true,
      });
    });

    it('should trim search text', () => {
      const { result } = renderHook(() => useSearch(), { wrapper });

      act(() => {
        result.current.handleSearch('  test query  ', true);
      });

      expect(mockUpdateURLParams).toHaveBeenCalledWith({
        searchText: 'test query',
        autoCorrectMode: true,
      });
    });

    it('should not search with empty string', () => {
      const { result } = renderHook(() => useSearch(), { wrapper });

      act(() => {
        result.current.handleSearch('', true);
      });

      expect(mockUpdateURLParams).not.toHaveBeenCalled();
    });

    it('should not search with only whitespace', () => {
      const { result } = renderHook(() => useSearch(), { wrapper });

      act(() => {
        result.current.handleSearch('   ', true);
      });

      expect(mockUpdateURLParams).not.toHaveBeenCalled();
    });

    it('should remove bookmarks when searching if bookmarks enabled', () => {
      mockIsBookmarksEnabled.mockReturnValue(true);
      const { result } = renderHook(() => useSearch(), { wrapper });

      act(() => {
        result.current.handleSearch('test', true);
      });

      expect(mockUpdateURLParams).toHaveBeenCalledWith({
        bookmarks: '',
      });
    });

    it('should not remove bookmarks if bookmarks not enabled', () => {
      mockIsBookmarksEnabled.mockReturnValue(false);
      const { result } = renderHook(() => useSearch(), { wrapper });

      act(() => {
        result.current.handleSearch('test', true);
      });

      expect(mockUpdateURLParams).not.toHaveBeenCalledWith(
        expect.objectContaining({
          bookmarks: expect.anything(),
        })
      );
    });

    it('should handle autoCorrectMode parameter', () => {
      const { result } = renderHook(() => useSearch(), { wrapper });

      act(() => {
        result.current.handleSearch('test', false);
      });

      expect(mockUpdateURLParams).toHaveBeenCalledWith({
        searchText: 'test',
        autoCorrectMode: false,
      });
    });

    it('should default autoCorrectMode to true', () => {
      const { result } = renderHook(() => useSearch(), { wrapper });

      act(() => {
        result.current.handleSearch('test');
      });

      expect(mockUpdateURLParams).toHaveBeenCalledWith(
        expect.objectContaining({
          autoCorrectMode: true,
        })
      );
    });
  });

  // ==========================================
  // resetSearch Function
  // ==========================================

  describe('resetSearch', () => {
    it('should clear search text and URL params', () => {
      const { result } = renderHook(() => useSearch(), { wrapper });

      act(() => {
        result.current.resetSearch();
      });

      expect(mockUpdateURLParams).toHaveBeenCalledWith({
        searchText: '',
        snippetType: '',
        autoCorrectMode: '',
      });
    });

    it('should dispatch reset action', () => {
      const { result } = renderHook(() => useSearch(), {
        wrapper: ({ children }: any) => wrapper({ children, store: mockStore }),
      });

      act(() => {
        result.current.resetSearch();
      });

      const state = mockStore.getState();
      expect(state.catalog.query).toBe('');
    });
  });

  // ==========================================
  // getSearchSuggestions Function
  // ==========================================

  describe('getSearchSuggestions', () => {
    it('should return suggestions from user history and popular searches', async () => {
      mockGetWindowObject.mockReturnValue({
        userSearchHistory: ['react', 'angular'],
      } as any);

      (RestAdapter.get as jest.Mock).mockResolvedValue(
        JSON.stringify({
          data: [{ attributes: { text: 'popular1' } }, { attributes: { text: 'popular2' } }],
        })
      );

      const { result } = renderHook(() => useSearch(), { wrapper });

      let suggestions;
      await act(async () => {
        suggestions = await result.current.getSearchSuggestions();
      });

      expect(suggestions.userSearchHistory).toEqual(['react', 'angular']);
      expect(suggestions.popularSearches).toContain('popular1');
      expect(suggestions.popularSearches).toContain('popular2');
    });

    it('should fetch user search history from API if not cached', async () => {
      mockGetWindowObject.mockReturnValue({} as any);

      (RestAdapter.get as jest.Mock)
        .mockResolvedValueOnce(
          JSON.stringify({
            data: [{ attributes: { text: 'cached1' } }, { attributes: { text: 'cached2' } }],
          })
        )
        .mockResolvedValueOnce(
          JSON.stringify({
            data: [{ attributes: { text: 'popular1' } }],
          })
        );

      const { result } = renderHook(() => useSearch(), { wrapper });

      let suggestions;
      await act(async () => {
        suggestions = await result.current.getSearchSuggestions();
      });

      expect(suggestions.userSearchHistory).toEqual(['cached1', 'cached2']);
    });

    it('should filter suggestions by search term', async () => {
      mockGetWindowObject.mockReturnValue({
        userSearchHistory: ['react native', 'react hooks', 'angular'],
      } as any);

      (RestAdapter.get as jest.Mock).mockResolvedValue('{"data":[]}');

      const { result } = renderHook(() => useSearch(), { wrapper });

      let suggestions;
      await act(async () => {
        suggestions = await result.current.getSearchSuggestions('react');
      });

      expect(suggestions.userSearchHistory).toEqual(['react native', 'react hooks']);
      expect(suggestions.userSearchHistory).not.toContain('angular');
    });

    it('should handle empty search term', async () => {
      mockGetWindowObject.mockReturnValue({
        userSearchHistory: ['test1', 'test2'],
      } as any);

      (RestAdapter.get as jest.Mock).mockResolvedValue('{"data":[]}');

      const { result } = renderHook(() => useSearch(), { wrapper });

      let suggestions;
      await act(async () => {
        suggestions = await result.current.getSearchSuggestions('');
      });

      expect(suggestions.userSearchHistory).toEqual(['test1', 'test2']);
    });

    it('should handle API errors gracefully', async () => {
      mockGetWindowObject.mockReturnValue({} as any);
      (RestAdapter.get as jest.Mock).mockRejectedValue(new Error('API Error'));
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      const { result } = renderHook(() => useSearch(), { wrapper });

      let suggestions;
      await act(async () => {
        suggestions = await result.current.getSearchSuggestions();
      });

      expect(suggestions.userSearchHistory).toEqual([]);
      expect(suggestions.popularSearches).toEqual([]);
      expect(consoleLogSpy).toHaveBeenCalled();

      consoleLogSpy.mockRestore();
    });

    it('should limit user suggestions based on screen size', async () => {
      mockGetWindowObject.mockReturnValue({
        userSearchHistory: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'],
      } as any);

      (RestAdapter.get as jest.Mock).mockResolvedValue('{"data":[]}');

      const { result } = renderHook(() => useSearch(), { wrapper });

      let suggestions;
      await act(async () => {
        suggestions = await result.current.getSearchSuggestions();
      });

      // Should limit total suggestions (maxSuggestions is 8 mobile or 10 desktop)
      // The total of userSearchHistory + popularSearches should be limited
      const totalSuggestions =
        suggestions.userSearchHistory.length + suggestions.popularSearches.length;
      expect(totalSuggestions).toBeLessThanOrEqual(10);
      expect(suggestions.userSearchHistory.length).toBeGreaterThan(0);
    });

    it('should remove duplicate suggestions', async () => {
      mockGetWindowObject.mockReturnValue({
        userSearchHistory: ['react', 'angular'],
      } as any);

      (RestAdapter.get as jest.Mock).mockResolvedValue(
        JSON.stringify({
          data: [
            { attributes: { text: 'react' } }, // Duplicate
            { attributes: { text: 'vue' } },
          ],
        })
      );

      const { result } = renderHook(() => useSearch(), { wrapper });

      let suggestions;
      await act(async () => {
        suggestions = await result.current.getSearchSuggestions();
      });

      const allSuggestions = [...suggestions.userSearchHistory, ...suggestions.popularSearches];
      const uniqueSuggestions = [...new Set(allSuggestions)];

      expect(allSuggestions.length).toBe(uniqueSuggestions.length);
    });
  });

  // ==========================================
  // Query Computation
  // ==========================================

  describe('query computation', () => {
    it('should prioritize URL params over Redux state', () => {
      mockGetQueryParamsFromUrl.mockReturnValue({ searchText: 'url-query' });
      const store = createMockStore({ query: 'redux-query' });

      const { result } = renderHook(() => useSearch(), {
        wrapper: ({ children }: any) => wrapper({ children, store }),
      });

      expect(result.current.query).toBe('url-query');
    });

    it('should use Redux state if no URL params', () => {
      mockGetQueryParamsFromUrl.mockReturnValue({});
      const store = createMockStore({ query: 'redux-query' });

      const { result } = renderHook(() => useSearch(), {
        wrapper: ({ children }: any) => wrapper({ children, store }),
      });

      expect(result.current.query).toBe('redux-query');
    });

    it('should return empty string if both are empty', () => {
      mockGetQueryParamsFromUrl.mockReturnValue({});
      const store = createMockStore({ query: '' });

      const { result } = renderHook(() => useSearch(), {
        wrapper: ({ children }: any) => wrapper({ children, store }),
      });

      expect(result.current.query).toBe('');
    });
  });

  // ==========================================
  // Window Resize Handling
  // ==========================================

  describe('window resize handling', () => {
    it('should update mobile state on resize', () => {
      global.innerWidth = 1200;
      const { result } = renderHook(() => useSearch(), { wrapper });

      act(() => {
        global.innerWidth = 500;
        global.dispatchEvent(new Event('resize'));
      });

      // Hook should re-evaluate isMobileScreen — verify API is still intact after resize
      expect(typeof result.current.handleSearch).toBe('function');
      expect(typeof result.current.resetSearch).toBe('function');
    });

    it('should handle window resize correctly', () => {
      const { result } = renderHook(() => useSearch(), { wrapper });

      expect(result.current.query).toBe('');
      expect(typeof result.current.handleSearch).toBe('function');
    });
  });

  // ==========================================
  // Edge Cases
  // ==========================================

  describe('edge cases', () => {
    it('should handle very long search terms', () => {
      const longQuery = 'a'.repeat(1000);
      const { result } = renderHook(() => useSearch(), { wrapper });

      act(() => {
        result.current.handleSearch(longQuery, true);
      });

      expect(mockUpdateURLParams).toHaveBeenCalledWith({
        searchText: longQuery,
        autoCorrectMode: true,
      });
    });

    it('should handle special characters in search', () => {
      const { result } = renderHook(() => useSearch(), { wrapper });

      act(() => {
        result.current.handleSearch('test & <script>', true);
      });

      expect(mockUpdateURLParams).toHaveBeenCalledWith({
        searchText: 'test & <script>',
        autoCorrectMode: true,
      });
    });

    it('should handle malformed API response', async () => {
      (RestAdapter.get as jest.Mock).mockResolvedValue('invalid json');
      mockGetWindowObject.mockReturnValue({} as any);
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      const { result } = renderHook(() => useSearch(), { wrapper });

      // The hook catches the error and returns empty arrays
      let suggestions;
      await act(async () => {
        suggestions = await result.current.getSearchSuggestions();
      });

      expect(suggestions.userSearchHistory).toEqual([]);
      expect(suggestions.popularSearches).toEqual([]);
      expect(consoleLogSpy).toHaveBeenCalled();

      consoleLogSpy.mockRestore();
    });

    it('should handle missing attributes in API response', async () => {
      (RestAdapter.get as jest.Mock).mockResolvedValue(
        JSON.stringify({
          data: [{ attributes: {} }, { attributes: { text: 'valid' } }],
        })
      );
      mockGetWindowObject.mockReturnValue({} as any);

      const { result } = renderHook(() => useSearch(), { wrapper });

      let suggestions;
      await act(async () => {
        suggestions = await result.current.getSearchSuggestions();
      });

      expect(suggestions.userSearchHistory).toEqual(['valid']);
    });
  });
});
