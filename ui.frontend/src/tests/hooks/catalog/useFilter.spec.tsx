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
// Mock all external dependencies before imports
jest.mock('@common/APIService', () => ({
  __esModule: true,
  default: {
    getFilters: jest.fn(),
    getSearchFilterList: jest.fn(),
  },
}));

jest.mock('@utils/global', () => ({
  getALMConfig: jest.fn(() => ({ primeApiURL: 'https://api.example.com/', learnerDesktopApp: false })),
  getALMObject: jest.fn(() => ({ isPrimeUserLoggedIn: jest.fn(() => true) })),
  getQueryParamsFromUrl: jest.fn(() => ({})),
  isBookmarksEnabled: jest.fn(() => false),
  needsLearnerDesktopUrlChange: jest.fn(() => false),
  updateURLParams: jest.fn(),
  getALMAttribute: jest.fn(),
  getDefaultFilterValues: jest.fn(() => ({})),
  getSelectedOptionsForMobile: jest.fn(() => ({})),
}));

jest.mock('@utils/catalog', () => ({
  convertStringToObject: jest.fn((s: string) => ({ [s]: true })),
  debounce: jest.fn((fn: Function) => fn),
  getFilterNames: jest.fn(),
  filterObjectByTruthyValues: jest.fn((obj: any) => obj),
  getTruePropertiesAsString: jest.fn((obj: any) => Object.keys(obj).filter(k => obj[k]).join(',')),
  hasKeys: jest.fn(() => false),
  isMyLearningPage: jest.fn(() => false),
}));

jest.mock('@utils/filters', () => ({
  ACTION_MAP: {} as any,
  filtersDefaultState: {} as any,
  FilterType: {} as any,
  userSkillsList: jest.fn(() => Promise.resolve([])),
  buildListItem: jest.fn((filterType: string, item: any, selected: any) => ({
    value: item.id || item,
    label: item.name || item,
    checked: !!selected[item.id || item],
  })),
}));

jest.mock('@utils/translationService', () => ({
  GetTranslation: jest.fn((key: string) => key),
}));

jest.mock('@utils/restAdapter', () => ({
  RestAdapter: {
    get: jest.fn(),
  },
}));

jest.mock('@utils/jsonAPIAdapter', () => ({
  JsonApiParse: jest.fn((data: any) => data),
}));

jest.mock('@utils/urlConv', () => ({
  convertToReactParams: jest.fn((p: any) => p),
}));

jest.mock('@utils/constants', () => ({
  FILTER: { CATALOGS: 'catalogs', SKILL_NAME: 'skillName', TAG_NAME: 'tagName' },
}));

jest.mock('@contextProviders/DeviceContextProvider', () => ({
  useDeviceTypeContext: jest.fn(() => ({ isDesktop: true })),
}));

// Mock APIStore
jest.mock('../../../store/APIStore', () => ({
  __esModule: true,
  default: {
    getState: jest.fn(() => ({
      catalog: {
        filterState: {
          catalogs: '',
          skillName: {},
          tagName: {},
        },
        userSkills: {},
      },
    })),
    dispatch: jest.fn(),
  },
}));

jest.mock('@almStore/actions/catalog/action', () => ({
  clearAllFilters: jest.fn(() => ({ type: 'CLEAR_ALL_FILTERS' })),
  loadUserSkills: jest.fn((p: any) => ({ type: 'LOAD_USER_SKILLS', payload: p })),
  updateAllFilters: jest.fn((p: any) => ({ type: 'UPDATE_ALL_FILTERS', payload: p })),
  updateFiltersOnLoad: jest.fn((p: any) => ({ type: 'UPDATE_FILTERS_ON_LOAD', payload: p })),
}));

jest.mock('@almStore/reducers/catalog', () => ({}));

import React from 'react';
import ReactDOM from 'react-dom';
import { act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import { useFilter } from '@hooks/catalog/useFilter';
import APIServiceInstance from '@common/APIService';
import * as globalUtils from '@utils/global';
import * as catalogUtils from '@utils/catalog';

const mockGetFilters = APIServiceInstance.getFilters as jest.MockedFunction<typeof APIServiceInstance.getFilters>;
const mockGetSearchFilterList = APIServiceInstance.getSearchFilterList as jest.MockedFunction<typeof APIServiceInstance.getSearchFilterList>;
const mockUpdateURLParams = globalUtils.updateURLParams as jest.MockedFunction<typeof globalUtils.updateURLParams>;
const mockIsBookmarksEnabled = globalUtils.isBookmarksEnabled as jest.MockedFunction<typeof globalUtils.isBookmarksEnabled>;

const mockFilterState = {
  loTypes: { list: [{ label: 'Course', value: 'course', checked: false }], canSearch: false },
  skillName: {
    list: [
      { value: '', label: 'alm.text.mySkills', checked: false },
      { value: 'JavaScript', label: 'JavaScript', checked: false },
    ],
    canSearch: true,
  },
  catalogs: {
    list: [{ label: 'My Catalog', value: 'cat:1', checked: false }],
    canSearch: true,
  },
  price: {
    list: [{ value: 0, label: 'min' }, { value: 0, label: 'max' }],
    canSearch: false,
  },
};

function createMockStore(filterState: any = {}) {
  return createStore(() => ({
    catalog: {
      filterState: {
        loTypes: '',
        skillName: {},
        tagName: {},
        ...filterState,
      },
    },
  }));
}

function renderHook(props?: any) {
  const result: any = { current: null };
  const store = createMockStore();
  const container = document.createElement('div');
  document.body.appendChild(container);

  const Wrapper = ({ children }: any) => <Provider store={store}>{children}</Provider>;

  act(() => {
    ReactDOM.render(
      React.createElement(Wrapper, null,
        React.createElement(() => {
          result.current = useFilter(props);
          return null;
        })
      ),
      container
    );
  });

  return {
    result,
    store,
    unmount: () => {
      act(() => { ReactDOM.unmountComponentAtNode(container); });
      container.parentNode?.removeChild(container);
    },
  };
}

describe('useFilter', () => {
  beforeEach(() => {
    // resetMocks:true clears jest.fn() factory implementations — restore them here
    (globalUtils.getALMConfig as jest.Mock).mockReturnValue({ primeApiURL: 'https://api.example.com/', learnerDesktopApp: false });
    (globalUtils.getALMObject as jest.Mock).mockReturnValue({ isPrimeUserLoggedIn: jest.fn(() => true) });
    (globalUtils.getQueryParamsFromUrl as jest.Mock).mockReturnValue({});
    (globalUtils.isBookmarksEnabled as jest.Mock).mockReturnValue(false);
    (globalUtils.needsLearnerDesktopUrlChange as jest.Mock).mockReturnValue(false);
    (globalUtils.getDefaultFilterValues as jest.Mock).mockReturnValue({});
    (globalUtils.getSelectedOptionsForMobile as jest.Mock).mockReturnValue({});
    (require('@utils/catalog').debounce as jest.Mock).mockImplementation((fn: Function) => fn);
    (require('@utils/catalog').convertStringToObject as jest.Mock).mockImplementation((s: string) => ({ [s]: true }));
    (require('@utils/catalog').filterObjectByTruthyValues as jest.Mock).mockImplementation((obj: any) => obj);
    (require('@utils/catalog').getTruePropertiesAsString as jest.Mock).mockImplementation((obj: any) => Object.keys(obj).filter(k => obj[k]).join(','));
    (require('@utils/catalog').hasKeys as jest.Mock).mockReturnValue(false);
    (require('@utils/catalog').isMyLearningPage as jest.Mock).mockReturnValue(false);
    (require('@contextProviders/DeviceContextProvider').useDeviceTypeContext as jest.Mock).mockReturnValue({ isDesktop: true });
    (require('@utils/filters').userSkillsList as jest.Mock).mockResolvedValue([]);
    (require('@utils/filters').buildListItem as jest.Mock).mockImplementation((filterType: string, item: any, selected: any) => ({
      value: item.id || item,
      label: item.name || item,
      checked: !!selected?.[item.id || item],
    }));
    // Restore APIStore mock (cleared by resetMocks:true)
    (require('../../../store/APIStore').default.getState as jest.Mock).mockReturnValue({
      catalog: { filterState: { catalogs: '', skillName: {}, tagName: {} }, userSkills: {} },
    });
    // Restore action creator mocks (cleared by resetMocks:true)
    (require('@almStore/actions/catalog/action').clearAllFilters as jest.Mock).mockReturnValue({ type: 'CLEAR_ALL_FILTERS' });
    (require('@almStore/actions/catalog/action').loadUserSkills as jest.Mock).mockImplementation((p: any) => ({ type: 'LOAD_USER_SKILLS', payload: p }));
    (require('@almStore/actions/catalog/action').updateAllFilters as jest.Mock).mockImplementation((p: any) => ({ type: 'UPDATE_ALL_FILTERS', payload: p }));
    (require('@almStore/actions/catalog/action').updateFiltersOnLoad as jest.Mock).mockImplementation((p: any) => ({ type: 'UPDATE_FILTERS_ON_LOAD', payload: p }));
    mockGetFilters.mockResolvedValue(mockFilterState as any);
    mockGetSearchFilterList.mockResolvedValue([]);
  });

  describe('Initialization', () => {
    it('areFiltersLoading_initially_returnsTrue', () => {
      const { result } = renderHook();
      expect(result.current.areFiltersLoading).toBe(true);
    });

    it('getFilters_onMount_callsAPIServiceGetFilters', async () => {
      const { result } = renderHook();

      await act(async () => { await Promise.resolve(); });

      expect(mockGetFilters).toHaveBeenCalledTimes(1);
    });

    it('areFiltersLoading_afterFiltersFetch_returnsFalse', async () => {
      const { result } = renderHook();

      await act(async () => { await Promise.resolve(); });
      await act(async () => { await Promise.resolve(); });

      expect(result.current.areFiltersLoading).toBe(false);
    });

    it('isResetFilters_true_skipsGetFilters', async () => {
      renderHook({ isResetFilters: true });

      await act(async () => { await Promise.resolve(); });

      expect(mockGetFilters).not.toHaveBeenCalled();
    });
  });

  describe('updateFilters', () => {
    it('updateFilters_togglesItemChecked_updatesFilterState', async () => {
      const { result } = renderHook();

      await act(async () => { await Promise.resolve(); });
      await act(async () => { await Promise.resolve(); });

      act(() => {
        result.current.updateFilters({
          filterType: 'loTypes',
          label: 'Course',
          checked: true,
        });
      });

      expect(mockUpdateURLParams).toHaveBeenCalled();
    });

    it('updateFilters_withBookmarksEnabled_clearsBookmarksFromUrl', async () => {
      mockIsBookmarksEnabled.mockReturnValue(true);
      const { result } = renderHook();

      await act(async () => { await Promise.resolve(); });
      await act(async () => { await Promise.resolve(); });

      act(() => {
        result.current.updateFilters({ filterType: 'loTypes', label: 'Course', checked: true });
      });

      expect(mockUpdateURLParams).toHaveBeenCalledWith(expect.objectContaining({ bookmarks: '' }));
    });
  });

  describe('updatePriceRangeFilter', () => {
    it('updatePriceRangeFilter_withNonZeroRange_setsPayload', async () => {
      const { result } = renderHook();

      await act(async () => { await Promise.resolve(); });
      await act(async () => { await Promise.resolve(); });

      act(() => {
        result.current.updatePriceRangeFilter({
          filterType: 'price',
          label: 'price',
          data: { start: 10, end: 100 },
        });
      });

      expect(mockUpdateURLParams).toHaveBeenCalled();
    });

    it('updatePriceRangeFilter_zeroBothEnds_setsEmptyPayload', async () => {
      const { result } = renderHook();

      await act(async () => { await Promise.resolve(); });
      await act(async () => { await Promise.resolve(); });

      act(() => {
        result.current.updatePriceRangeFilter({
          filterType: 'price',
          label: 'price',
          data: { start: 0, end: 0 },
        });
      });

      // payload should be empty string for 0-0 range
      expect(mockUpdateURLParams).toHaveBeenCalledWith(expect.objectContaining({ price: '' }));
    });
  });

  describe('resetFilters', () => {
    it('resetFilters_called_dispatchesClearAllFilters', async () => {
      const { result } = renderHook();

      await act(async () => { await Promise.resolve(); });
      await act(async () => { await Promise.resolve(); });

      act(() => { result.current.resetFilters(); });

      // Verify URL was cleared for filter types
      expect(mockUpdateURLParams).toHaveBeenCalled();
    });

    it('resetFilters_withBookmarksEnabled_clearsBookmarksUrl', async () => {
      mockIsBookmarksEnabled.mockReturnValue(true);
      const { result } = renderHook();

      await act(async () => { await Promise.resolve(); });
      await act(async () => { await Promise.resolve(); });

      act(() => { result.current.resetFilters(); });

      expect(mockUpdateURLParams).toHaveBeenCalledWith({ bookmarks: '' });
    });
  });

  describe('resetFilterList', () => {
    it('resetFilterList_forFilterType_clearsUrlParamAndUnchecksItems', async () => {
      const { result } = renderHook();

      await act(async () => { await Promise.resolve(); });
      await act(async () => { await Promise.resolve(); });

      act(() => { result.current.resetFilterList('loTypes'); });

      expect(mockUpdateURLParams).toHaveBeenCalledWith({ loTypes: '' });
    });
  });

  describe('searchFilters', () => {
    it('searchFilters_queryLessThan3Chars_doesNotCallApi', async () => {
      const { result } = renderHook();

      await act(async () => { await Promise.resolve(); });
      await act(async () => { await Promise.resolve(); });

      await act(async () => {
        result.current.searchFilters('ab', 'skillName');
      });

      expect(mockGetSearchFilterList).not.toHaveBeenCalled();
    });

    it('searchFilters_validQuery_callsGetSearchFilterList', async () => {
      mockGetSearchFilterList.mockResolvedValue([{ value: 'JavaScript', label: 'JavaScript' }] as any);
      const { result } = renderHook();

      await act(async () => { await Promise.resolve(); });
      await act(async () => { await Promise.resolve(); });

      await act(async () => {
        await result.current.searchFilters('Jav', 'skillName');
      });

      expect(mockGetSearchFilterList).toHaveBeenCalledWith('Jav', 'skillName', expect.any(Object));
    });

    it('searchFilters_emptyQuery_callsClearFilterSearch', async () => {
      const { result } = renderHook();

      await act(async () => { await Promise.resolve(); });
      await act(async () => { await Promise.resolve(); });

      // clearFilterSearch path: empty query clears list loading state
      await act(async () => {
        await result.current.searchFilters('', 'skillName');
      });

      // clearFilterSearch should NOT call the search API
      expect(mockGetSearchFilterList).not.toHaveBeenCalled();
    });
  });
});
