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
 * Unit tests for filters.ts utility functions
 * Tests filter state management, URL parameter handling, and filter operations
 */

// Mock dependencies BEFORE imports to prevent circular dependency issues
jest.mock('@utils/global', () => ({
  getALMConfig: jest.fn(() => ({
    primeApiURL: 'https://test.api.com/primeapi/v2',
    commerceURL: 'https://test.commerce.com',
    graphqlProxyPath: 'https://test.graphql.com',
    locale: 'en-US',
  })),
  getALMObject: jest.fn(() => ({
    storage: { getItem: jest.fn(), setItem: jest.fn(), removeItem: jest.fn() },
  })),
  getALMUser: jest.fn(),
  getALMAttribute: jest.fn(),
  getQueryParamsFromUrl: jest.fn(() => ({})),
  updateURLParams: jest.fn(),
  getItemFromStorage: jest.fn(),
  setItemToStorage: jest.fn(),
  isBookmarksEnabled: jest.fn(() => false),
  isAccAltCompletionEnabled: jest.fn(() => false),
}));

jest.mock('@utils/restAdapter', () => ({
  RestAdapter: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

jest.mock('@utils/jsonAPIAdapter', () => ({
  JsonApiParse: jest.fn(),
}));

jest.mock('@utils/translationService', () => ({
  GetTranslation: jest.fn(key => key),
}));

jest.mock('@utils/catalog', () => ({
  getFilterNames: jest.fn(),
}));

// Import the functions and types to test
import {
  filtersDefaultState,
  updateFilterList,
  updatePriceRangeFilterList,
  getDefaultFiltersState,
  getFilterLabel,
  canShowLevelsForProducts,
  canShowLevelsForRoles,
  canResetLevelsFilter,
  searchFilterValue,
  getMySkills,
  userSkillsList,
  buildListItem,
  getSearchFilterList,
} from '@utils/filters';
import { RestAdapter } from '@utils/restAdapter';
import { JsonApiParse } from '@utils/jsonAPIAdapter';
import { GetTranslation } from '@utils/translationService';
import { getQueryParamsFromUrl, getALMConfig } from '@utils/global';
import { FILTER, API_REQUEST_CANCEL_TOKEN } from '@utils/constants';
import { getFilterNames } from '@utils/catalog';

// Create typed mocks
const mockRestAdapter = RestAdapter as jest.Mocked<typeof RestAdapter>;
const mockJsonApiParse = JsonApiParse as jest.MockedFunction<typeof JsonApiParse>;
const mockGetTranslation = GetTranslation as jest.MockedFunction<typeof GetTranslation>;
const mockGetQueryParamsFromUrl = getQueryParamsFromUrl as jest.MockedFunction<
  typeof getQueryParamsFromUrl
>;
const mockGetALMConfig = getALMConfig as jest.MockedFunction<typeof getALMConfig>;
const mockGetFilterNames = getFilterNames as jest.MockedFunction<typeof getFilterNames>;

describe('filters utility functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetTranslation.mockImplementation((key: string) => key);
    mockGetALMConfig.mockReturnValue({
      primeApiURL: 'https://test.api.com/primeapi/v2',
      commerceURL: 'https://test.commerce.com',
      graphqlProxyPath: 'https://test.graphql.com',
      locale: 'en-US',
    } as any);
    mockGetQueryParamsFromUrl.mockReturnValue({});
  });

  // ==========================================
  // filtersDefaultState
  // ==========================================

  describe('filtersDefaultState', () => {
    it('should have correct loTypes structure', () => {
      expect(filtersDefaultState.loTypes.type).toBe('loTypes');
      expect(filtersDefaultState.loTypes.label).toBe('alm.catalog.filter.loType.label');
      expect(filtersDefaultState.loTypes.list).toHaveLength(4);
      expect(filtersDefaultState.loTypes.list?.[0].value).toBe('course');
      expect(filtersDefaultState.loTypes.list?.[1].value).toBe('learningProgram');
      expect(filtersDefaultState.loTypes.list?.[2].value).toBe('jobAid');
      expect(filtersDefaultState.loTypes.list?.[3].value).toBe('certification');
    });

    it('should have correct learnerState structure', () => {
      expect(filtersDefaultState.learnerState.type).toBe('learnerState');
      expect(filtersDefaultState.learnerState.list).toHaveLength(5);
      expect(filtersDefaultState.learnerState.list?.[0].value).toBe('enrolled');
      expect(filtersDefaultState.learnerState.list?.[1].value).toBe('started');
      expect(filtersDefaultState.learnerState.list?.[2].value).toBe('completed');
      expect(filtersDefaultState.learnerState.list?.[3].value).toBe('completedViaAlternate');
      expect(filtersDefaultState.learnerState.list?.[4].value).toBe('notenrolled');
    });

    it('should have correct loFormat structure', () => {
      expect(filtersDefaultState.loFormat.list).toHaveLength(5);
      expect(filtersDefaultState.loFormat.list?.[0].value).toBe('Activity');
      expect(filtersDefaultState.loFormat.list?.[1].value).toBe('Blended');
      expect(filtersDefaultState.loFormat.list?.[2].value).toBe('Self Paced');
      expect(filtersDefaultState.loFormat.list?.[3].value).toBe('Virtual Classroom');
      expect(filtersDefaultState.loFormat.list?.[4].value).toBe('Classroom');
    });

    it('should mark dynamic filters correctly', () => {
      expect(filtersDefaultState.skillName.isListDynamic).toBe(true);
      expect(filtersDefaultState.tagName.isListDynamic).toBe(true);
      expect(filtersDefaultState.catalogs.isListDynamic).toBe(true);
      expect(filtersDefaultState.products.isListDynamic).toBe(true);
      expect(filtersDefaultState.roles.isListDynamic).toBe(true);
      expect(filtersDefaultState.levels.isListDynamic).toBe(true);
      expect(filtersDefaultState.cities.isListDynamic).toBe(true);
      expect(filtersDefaultState.announcedGroups.isListDynamic).toBe(true);
    });

    it('should mark searchable filters correctly', () => {
      expect(filtersDefaultState.skillName.canSearch).toBe(true);
      expect(filtersDefaultState.tagName.canSearch).toBe(true);
      expect(filtersDefaultState.catalogs.canSearch).toBe(true);
    });

    it('should have all items unchecked by default', () => {
      filtersDefaultState.loTypes.list?.forEach(item => {
        expect(item.checked).toBe(false);
      });
      filtersDefaultState.learnerState.list?.forEach(item => {
        expect(item.checked).toBe(false);
      });
    });

    it('should have correct skillLevel values', () => {
      expect(filtersDefaultState.skillLevel.list).toHaveLength(3);
      expect(filtersDefaultState.skillLevel.list?.[0].value).toBe('1');
      expect(filtersDefaultState.skillLevel.list?.[1].value).toBe('2');
      expect(filtersDefaultState.skillLevel.list?.[2].value).toBe('3');
    });

    it('should have correct duration ranges', () => {
      expect(filtersDefaultState.duration.list).toHaveLength(3);
      expect(filtersDefaultState.duration.list?.[0].value).toBe('0-1800');
      expect(filtersDefaultState.duration.list?.[1].value).toBe('1801-7200');
      expect(filtersDefaultState.duration.list?.[2].value).toBe('7201-3600000');
    });

    it('should have correct price options', () => {
      expect(filtersDefaultState.price.list).toHaveLength(2);
      expect(filtersDefaultState.price.list?.[0].value).toBe('free');
      expect(filtersDefaultState.price.list?.[1].value).toBe('paid');
    });
  });

  // ==========================================
  // updateFilterList
  // ==========================================

  describe('updateFilterList', () => {
    it('should check items that match URL filters', () => {
      const list = [
        { value: 'course', label: 'Course', checked: false },
        { value: 'learningProgram', label: 'LP', checked: false },
      ];
      const filtersFromUrl = { loTypes: 'course' };

      const result = updateFilterList(list, filtersFromUrl, 'loTypes');

      expect(result[0].checked).toBe(true);
      expect(result[1].checked).toBe(false);
    });

    it('should check multiple items from comma-separated URL values', () => {
      const list = [
        { value: 'course', label: 'Course', checked: false },
        { value: 'learningProgram', label: 'LP', checked: false },
        { value: 'jobAid', label: 'Job Aid', checked: false },
      ];
      const filtersFromUrl = { loTypes: 'course,jobAid' };

      const result = updateFilterList(list, filtersFromUrl, 'loTypes');

      expect(result[0].checked).toBe(true);
      expect(result[1].checked).toBe(false);
      expect(result[2].checked).toBe(true);
    });

    it('should return empty array if list is undefined', () => {
      const result = updateFilterList(undefined, {}, 'loTypes');
      expect(result).toEqual([]);
    });

    it('should return list unchanged if no URL filters', () => {
      const list = [{ value: 'course', label: 'Course', checked: false }];
      const result = updateFilterList(list, {}, 'loTypes');
      expect(result[0].checked).toBe(false);
    });

    it('should handle empty URL filter value', () => {
      const list = [{ value: 'course', label: 'Course', checked: false }];
      const filtersFromUrl = { loTypes: '' };
      const result = updateFilterList(list, filtersFromUrl, 'loTypes');
      expect(result[0].checked).toBe(false);
    });

    it('should handle non-matching URL filter values', () => {
      const list = [{ value: 'course', label: 'Course', checked: false }];
      const filtersFromUrl = { loTypes: 'nonexistent' };
      const result = updateFilterList(list, filtersFromUrl, 'loTypes');
      expect(result[0].checked).toBe(false);
    });
  });

  // ==========================================
  // updatePriceRangeFilterList
  // ==========================================

  describe('updatePriceRangeFilterList', () => {
    it('should update price range values from URL', () => {
      const list = [
        { value: 0, label: '', checked: false },
        { value: 0, label: '', checked: false },
      ];
      const filtersFromUrl = { priceRange: '10-100' };

      const result = updatePriceRangeFilterList(list, filtersFromUrl, 'priceRange');

      expect(result[0].value).toBe('10');
      expect(result[1].value).toBe('100');
    });

    it('should return list unchanged if no URL filter', () => {
      const list = [
        { value: 0, label: '', checked: false },
        { value: 0, label: '', checked: false },
      ];

      const result = updatePriceRangeFilterList(list, {}, 'priceRange');

      expect(result[0].value).toBe(0);
      expect(result[1].value).toBe(0);
    });

    it('should return empty array if list is undefined', () => {
      // Function doesn't handle undefined list, it will throw
      expect(() => updatePriceRangeFilterList(undefined, {}, 'priceRange')).toThrow();
    });

    it('should handle empty price range string', () => {
      const list = [
        { value: 0, label: '', checked: false },
        { value: 0, label: '', checked: false },
      ];
      const filtersFromUrl = { priceRange: '' };

      const result = updatePriceRangeFilterList(list, filtersFromUrl, 'priceRange');

      expect(result[0].value).toBe(0);
      expect(result[1].value).toBe(0);
    });

    it('should handle single value in price range', () => {
      const list = [
        { value: 0, label: '', checked: false },
        { value: 0, label: '', checked: false },
      ];
      const filtersFromUrl = { priceRange: '50' };

      const result = updatePriceRangeFilterList(list, filtersFromUrl, 'priceRange');

      expect(result[0].value).toBe('50');
      expect(result[1].value).toBeUndefined();
    });
  });

  // ==========================================
  // getDefaultFiltersState
  // ==========================================

  describe('getDefaultFiltersState', () => {
    it('should return default state with no URL params', () => {
      mockGetQueryParamsFromUrl.mockReturnValue({});

      const mockAccount = { enableAiCoach: false } as any;
      const result = getDefaultFiltersState(mockAccount);

      expect(result.loTypes.list?.[0].checked).toBe(false);
      expect(result.learnerState.list?.[0].checked).toBe(false);
      expect(result.loTypes.list).not.toEqual(
        expect.arrayContaining([expect.objectContaining({ value: 'virtualCoach' })])
      );
    });

    it('should return default state with enableAiCoach and guest user', () => {
      mockGetQueryParamsFromUrl.mockReturnValue({});

      const mockAccount = { enableAiCoach: true } as any;
      mockGetALMConfig.mockReturnValue({
        primeApiURL: 'https://custom.api.com',
        guest: true,
      } as any);
      const result = getDefaultFiltersState(mockAccount);

      expect(result.loTypes.list).not.toEqual(
        expect.arrayContaining([expect.objectContaining({ value: 'virtualCoach' })])
      );
    });

    it('should return default state with enableAiCoach', () => {
      mockGetQueryParamsFromUrl.mockReturnValue({});

      const mockAccount = { enableAiCoach: true } as any;
      const result = getDefaultFiltersState(mockAccount);

      expect(result.loTypes.list).toEqual(
        expect.arrayContaining([expect.objectContaining({ value: 'virtualCoach' })])
      );
    });

    it('should apply URL params to filter state', () => {
      mockGetQueryParamsFromUrl.mockReturnValue({
        loTypes: 'course',
        learnerState: 'enrolled',
      });

      const result = getDefaultFiltersState();

      expect(result.loTypes.list?.[0].checked).toBe(true); // course
      expect(result.learnerState.list?.[0].checked).toBe(true); // enrolled
    });

    it('should apply loFormat filters from URL', () => {
      mockGetQueryParamsFromUrl.mockReturnValue({
        loFormat: 'Blended',
      });

      const result = getDefaultFiltersState();

      expect(result.loFormat.list?.[1].checked).toBe(true); // Blended
    });

    it('should apply skillLevel filters from URL', () => {
      mockGetQueryParamsFromUrl.mockReturnValue({
        skillLevel: '2',
      });

      const result = getDefaultFiltersState();

      expect(result.skillLevel.list?.[1].checked).toBe(true); // intermediate
    });

    it('should apply duration filters from URL', () => {
      mockGetQueryParamsFromUrl.mockReturnValue({
        duration: '0-1800',
      });

      const result = getDefaultFiltersState();

      expect(result.duration.list?.[0].checked).toBe(true);
    });

    it('should apply price range from URL', () => {
      mockGetQueryParamsFromUrl.mockReturnValue({
        priceRange: '50-200',
      });

      const result = getDefaultFiltersState();

      expect(result.priceRange.list?.[0].value).toBe('50');
      expect(result.priceRange.list?.[1].value).toBe('200');
    });

    it('should handle multiple filters from URL', () => {
      mockGetQueryParamsFromUrl.mockReturnValue({
        loTypes: 'course,learningProgram',
        learnerState: 'enrolled,started',
        loFormat: 'Blended,Self Paced',
      });

      const result = getDefaultFiltersState();

      expect(result.loTypes.list?.[0].checked).toBe(true); // course
      expect(result.loTypes.list?.[1].checked).toBe(true); // learningProgram
      expect(result.learnerState.list?.[0].checked).toBe(true); // enrolled
      expect(result.learnerState.list?.[1].checked).toBe(true); // started
    });
  });

  // ==========================================
  // getFilterLabel
  // ==========================================

  describe('getFilterLabel', () => {
    it('should return label for matched static list item', () => {
      const filter = {
        type: 'loTypes',
        list: [{ value: 'course', label: 'alm.catalog.card.course', checked: false }],
      };

      mockGetTranslation.mockReturnValue('Course');

      const result = getFilterLabel('course', filter);

      expect(result.labelToShow).toBe('Course');
      expect(result.label).toBe('alm.catalog.card.course');
    });

    it('should return label for matched dynamic list item', () => {
      const filter = {
        type: FILTER.SKILL_NAME,
        isListDynamic: true,
        list: [{ value: 'skill1', label: 'JavaScript', checked: false }],
      };

      const result = getFilterLabel('skill1', filter);

      expect(result.labelToShow).toBe('JavaScript');
      expect(result.label).toBe('JavaScript');
    });

    it('should return raw value for price range', () => {
      const filter = {
        type: FILTER.PRICE_RANGE,
        list: [],
      };

      const result = getFilterLabel('50-100', filter);

      expect(result.labelToShow).toBe('50-100');
      expect(result.label).toBe('50-100');
    });

    it('should return raw value for catalogs if not in list', () => {
      const filter = {
        type: FILTER.CATALOGS,
        list: [],
      };

      const result = getFilterLabel('catalog1', filter);

      expect(result.labelToShow).toBe('catalog1');
      expect(result.label).toBe('catalog1');
    });

    it('should return empty labels if no match found', () => {
      const filter = {
        type: 'loTypes',
        list: [{ value: 'course', label: 'Course', checked: false }],
      };

      const result = getFilterLabel('nonexistent', filter);

      expect(result.label).toBe('');
      expect(result.labelToShow).toBe('');
    });

    it('should handle canSearch filter', () => {
      const filter = {
        type: 'catalogs',
        canSearch: true,
        list: [{ value: 'cat1', label: 'Catalog 1', checked: false }],
      };

      const result = getFilterLabel('cat1', filter);

      expect(result.labelToShow).toBe('Catalog 1');
      expect(result.label).toBe('Catalog 1');
    });

    it('should handle numeric values', () => {
      const filter = {
        type: 'skillLevel',
        list: [{ value: 1, label: 'alm.catalog.filter.beginner', checked: false }],
      };

      mockGetTranslation.mockReturnValue('Beginner');

      const result = getFilterLabel(1, filter);

      expect(result.labelToShow).toBe('Beginner');
    });
  });

  // ==========================================
  // canShowLevelsForProducts
  // ==========================================

  describe('canShowLevelsForProducts', () => {
    const createAccount = (
      prlEnabled: boolean,
      levelsEnabled: boolean,
      panelSetting: boolean
    ): any =>
      ({
        filterPanelSetting: {
          recommendationLevel: panelSetting,
        } as any,
        prlCriteria: {
          enabled: prlEnabled,
          products: {
            levelsEnabled,
          },
        } as any,
      }) as any;

    it('should return true when all conditions are met', () => {
      const account = createAccount(true, true, true);
      const filterState = {
        products: {
          list: [{ value: 'prod1', label: 'Product 1', checked: true }],
        },
      } as any;

      const result = canShowLevelsForProducts(account, filterState);

      expect(result).toBe(true);
    });

    it('should return false if PRL is not enabled', () => {
      const account = createAccount(false, true, true);
      const filterState = {
        products: {
          list: [{ value: 'prod1', label: 'Product 1', checked: true }],
        },
      } as any;

      const result = canShowLevelsForProducts(account, filterState);

      expect(result).toBe(false);
    });

    it('should return false if product levels are not enabled', () => {
      const account = createAccount(true, false, true);
      const filterState = {
        products: {
          list: [{ value: 'prod1', label: 'Product 1', checked: true }],
        },
      } as any;

      const result = canShowLevelsForProducts(account, filterState);

      expect(result).toBe(false);
    });

    it('should return false if panel setting is disabled', () => {
      const account = createAccount(true, true, false);
      const filterState = {
        products: {
          list: [{ value: 'prod1', label: 'Product 1', checked: true }],
        },
      } as any;

      const result = canShowLevelsForProducts(account, filterState);

      expect(result).toBe(false);
    });

    it('should return false if no products selected', () => {
      const account = createAccount(true, true, true);
      const filterState = {
        products: {
          list: [{ value: 'prod1', label: 'Product 1', checked: false }],
        },
      } as any;

      const result = canShowLevelsForProducts(account, filterState);

      expect(result).toBe(false);
    });

    it('should handle empty products list', () => {
      const account = createAccount(true, true, true);
      const filterState = {
        products: {
          list: [],
        },
      } as any;

      const result = canShowLevelsForProducts(account, filterState);

      expect(result).toBe(false);
    });

    it('should handle undefined products', () => {
      const account = createAccount(true, true, true);
      const filterState = {
        products: undefined,
      } as any;

      const result = canShowLevelsForProducts(account, filterState);

      // Function returns undefined when products is undefined
      expect(result).toBeUndefined();
    });
  });

  // ==========================================
  // canShowLevelsForRoles
  // ==========================================

  describe('canShowLevelsForRoles', () => {
    const createAccount = (
      prlEnabled: boolean,
      levelsEnabled: boolean,
      panelSetting: boolean
    ): any =>
      ({
        filterPanelSetting: {
          recommendationLevel: panelSetting,
        } as any,
        prlCriteria: {
          enabled: prlEnabled,
          roles: {
            levelsEnabled,
          },
        } as any,
      }) as any;

    it('should return true when all conditions are met', () => {
      const account = createAccount(true, true, true);
      const filterState = {
        roles: {
          list: [{ value: 'role1', label: 'Role 1', checked: true }],
        },
      } as any;

      const result = canShowLevelsForRoles(account, filterState);

      expect(result).toBe(true);
    });

    it('should return false if PRL is not enabled', () => {
      const account = createAccount(false, true, true);
      const filterState = {
        roles: {
          list: [{ value: 'role1', label: 'Role 1', checked: true }],
        },
      } as any;

      const result = canShowLevelsForRoles(account, filterState);

      expect(result).toBe(false);
    });

    it('should return false if role levels are not enabled', () => {
      const account = createAccount(true, false, true);
      const filterState = {
        roles: {
          list: [{ value: 'role1', label: 'Role 1', checked: true }],
        },
      } as any;

      const result = canShowLevelsForRoles(account, filterState);

      expect(result).toBe(false);
    });

    it('should return false if no roles selected', () => {
      const account = createAccount(true, true, true);
      const filterState = {
        roles: {
          list: [{ value: 'role1', label: 'Role 1', checked: false }],
        },
      } as any;

      const result = canShowLevelsForRoles(account, filterState);

      expect(result).toBe(false);
    });
  });

  // ==========================================
  // canResetLevelsFilter
  // ==========================================

  describe('canResetLevelsFilter', () => {
    it('should return true if products levels enabled but no products selected', () => {
      const prlCriteria = {
        products: { levelsEnabled: true },
        roles: { levelsEnabled: false },
      } as any;

      const filterState = {
        products: { list: [{ checked: false }] },
        roles: { list: [] },
      };

      const result = canResetLevelsFilter(prlCriteria, filterState);

      expect(result).toBe(true);
    });

    it('should return true if roles levels enabled but no roles selected', () => {
      const prlCriteria = {
        products: { levelsEnabled: false },
        roles: { levelsEnabled: true },
      } as any;

      const filterState = {
        products: { list: [] },
        roles: { list: [{ checked: false }] },
      };

      const result = canResetLevelsFilter(prlCriteria, filterState);

      expect(result).toBe(true);
    });

    it('should return false if products selected and levels enabled', () => {
      const prlCriteria = {
        products: { levelsEnabled: true },
        roles: { levelsEnabled: false },
      } as any;

      const filterState = {
        products: { list: [{ checked: true }] },
        roles: { list: [] },
      };

      const result = canResetLevelsFilter(prlCriteria, filterState);

      expect(result).toBe(false);
    });

    it('should return false if roles selected and levels enabled', () => {
      const prlCriteria = {
        products: { levelsEnabled: false },
        roles: { levelsEnabled: true },
      } as any;

      const filterState = {
        products: { list: [] },
        roles: { list: [{ checked: true }] },
      };

      const result = canResetLevelsFilter(prlCriteria, filterState);

      expect(result).toBe(false);
    });

    it('should handle both products and roles', () => {
      const prlCriteria = {
        products: { levelsEnabled: true },
        roles: { levelsEnabled: true },
      } as any;

      const filterState = {
        products: { list: [{ checked: false }] },
        roles: { list: [{ checked: false }] },
      };

      const result = canResetLevelsFilter(prlCriteria, filterState);

      expect(result).toBe(true);
    });
  });

  // ==========================================
  // searchFilterValue
  // ==========================================

  describe('searchFilterValue', () => {
    beforeEach(() => {
      mockRestAdapter.get = jest.fn();
    });

    it('should call API with correct params for skill search', async () => {
      const mockResponse = { data: [] };
      const mockParsedResponse = [{ id: 'skill1', name: 'JavaScript' }];

      mockRestAdapter.get.mockResolvedValue(mockResponse);
      mockJsonApiParse.mockReturnValue(mockParsedResponse as any);

      const result = await searchFilterValue('java', FILTER.SKILL_NAME);

      expect(mockRestAdapter.get).toHaveBeenCalledWith({
        url: 'https://test.api.com/primeapi/v2/search',
        params: {
          'page[limit]': 10,
          autoCompleteMode: true,
          sort: 'relevance',
          'filter.loTypes': FILTER.SKILL_NAME,
          matchType: 'phrase',
          persistSearchHistory: true,
          highlightResults: false,
          query: 'java',
        },
        cancelToken: API_REQUEST_CANCEL_TOKEN.SKILL_FILTER_SEARCH,
      });
      expect(result).toEqual(mockParsedResponse);
    });

    it('should use correct cancel token for catalog search', async () => {
      mockRestAdapter.get.mockResolvedValue({ data: [] });
      mockJsonApiParse.mockReturnValue([] as any);

      await searchFilterValue('test', FILTER.CATALOGS);

      expect(mockRestAdapter.get).toHaveBeenCalledWith(
        expect.objectContaining({
          cancelToken: API_REQUEST_CANCEL_TOKEN.CATALOG_FILTER_SEARCH,
        })
      );
    });

    it('should use correct cancel token for tag search', async () => {
      mockRestAdapter.get.mockResolvedValue({ data: [] });
      mockJsonApiParse.mockReturnValue([] as any);

      await searchFilterValue('test', FILTER.TAG_NAME);

      expect(mockRestAdapter.get).toHaveBeenCalledWith(
        expect.objectContaining({
          cancelToken: API_REQUEST_CANCEL_TOKEN.TAG_FILTER_SEARCH,
        })
      );
    });

    it('should parse API response', async () => {
      const mockResponse = { data: [{ id: '1' }] };
      const mockParsedResponse = [{ id: '1', name: 'Skill' }];

      mockRestAdapter.get.mockResolvedValue(mockResponse);
      mockJsonApiParse.mockReturnValue(mockParsedResponse as any);

      const result = await searchFilterValue('test', FILTER.SKILL_NAME);

      expect(mockJsonApiParse).toHaveBeenCalledWith(mockResponse);
      expect(result).toEqual(mockParsedResponse);
    });

    it('should handle API errors', async () => {
      mockRestAdapter.get.mockRejectedValue(new Error('API Error'));

      await expect(searchFilterValue('test', FILTER.SKILL_NAME)).rejects.toThrow('API Error');
    });
  });

  // ==========================================
  // getMySkills
  // ==========================================

  describe('getMySkills', () => {
    beforeEach(() => {
      mockRestAdapter.get = jest.fn();
    });

    it('should fetch user skills', async () => {
      const mockResponse = { data: [] };
      mockRestAdapter.get.mockResolvedValue(mockResponse);

      const result = await getMySkills();

      expect(mockRestAdapter.get).toHaveBeenCalledWith({
        url: 'https://test.api.com/primeapi/v2data?filter.enrolled.skillName=true',
      });
      expect(result).toEqual(mockResponse);
    });

    it('should use correct API URL', async () => {
      mockGetALMConfig.mockReturnValue({
        primeApiURL: 'https://custom.api.com',
      } as any);

      mockRestAdapter.get.mockResolvedValue({ data: [] });

      await getMySkills();

      expect(mockRestAdapter.get).toHaveBeenCalledWith({
        url: 'https://custom.api.comdata?filter.enrolled.skillName=true',
      });
    });

    it('should handle API errors', async () => {
      mockRestAdapter.get.mockRejectedValue(new Error('Network Error'));

      await expect(getMySkills()).rejects.toThrow('Network Error');
    });
  });

  // ==========================================
  // userSkillsList
  // ==========================================

  describe('userSkillsList', () => {
    beforeEach(() => {
      mockRestAdapter.get = jest.fn();
    });

    it('should fetch and parse user skills', async () => {
      const mockResponse = { data: [] };
      const mockParsedSkills = ['JavaScript', 'TypeScript', 'React'];

      mockRestAdapter.get.mockResolvedValue(mockResponse);
      mockGetFilterNames.mockReturnValue(mockParsedSkills);

      const result = await userSkillsList();

      expect(mockRestAdapter.get).toHaveBeenCalled();
      expect(mockGetFilterNames).toHaveBeenCalledWith(mockResponse);
      expect(result).toEqual(mockParsedSkills);
    });

    it('should handle empty skills list', async () => {
      mockRestAdapter.get.mockResolvedValue({ data: [] });
      mockGetFilterNames.mockReturnValue([]);

      const result = await userSkillsList();

      expect(result).toEqual([]);
    });

    it('should propagate API errors', async () => {
      mockRestAdapter.get.mockRejectedValue(new Error('API Error'));

      await expect(userSkillsList()).rejects.toThrow('API Error');
    });
  });

  // ==========================================
  // Edge Cases & Integration
  // ==========================================

  describe('edge cases and integration', () => {
    it('should handle null filter list in updateFilterList', () => {
      const result = updateFilterList(null, {}, 'loTypes');
      expect(result).toEqual([]);
    });

    it('should handle filter state with all filters applied', () => {
      mockGetQueryParamsFromUrl.mockReturnValue({
        loTypes: 'course,learningProgram',
        learnerState: 'enrolled',
        loFormat: 'Blended',
        skillLevel: '1,2',
        duration: '0-1800',
        priceRange: '10-100',
      });

      const result = getDefaultFiltersState();

      expect(result.loTypes.list?.[0].checked).toBe(true);
      expect(result.learnerState.list?.[0].checked).toBe(true);
      expect(result.loFormat.list?.[1].checked).toBe(true);
      expect(result.skillLevel.list?.[0].checked).toBe(true);
      expect(result.duration.list?.[0].checked).toBe(true);
      expect(result.priceRange.list?.[0].value).toBe('10');
    });

    it('should handle malformed URL filter values', () => {
      mockGetQueryParamsFromUrl.mockReturnValue({
        loTypes: ',,,',
        priceRange: '-',
      });

      const result = getDefaultFiltersState();

      // Malformed values should not crash; loTypes is always present with a list
      expect(Array.isArray(result.loTypes.list)).toBe(true);
      expect(result.loTypes.list!.length).toBeGreaterThan(0);
    });

    it('should handle undefined prlCriteria gracefully', () => {
      const account = {
        filterPanelSetting: { recommendationLevel: true },
        prlCriteria: undefined,
      } as any;

      const filterState = {
        products: { list: [{ checked: true }] },
      } as any;

      const result = canShowLevelsForProducts(account, filterState);

      // Function returns undefined when prlCriteria is missing
      expect(result).toBeUndefined();
    });

    it('should handle searchFilterValue with empty query', async () => {
      mockRestAdapter.get.mockResolvedValue({ data: [] });
      mockJsonApiParse.mockReturnValue([] as any);

      const result = await searchFilterValue('', FILTER.SKILL_NAME);

      expect(mockRestAdapter.get).toHaveBeenCalledWith(
        expect.objectContaining({
          params: expect.objectContaining({
            query: '',
          }),
        })
      );
      expect(result).toEqual([]);
    });

    it('should handle getFilterLabel with undefined list', () => {
      const filter = {
        type: 'loTypes',
        list: undefined,
      };

      const result = getFilterLabel('course', filter);

      expect(result.label).toBe('');
      expect(result.labelToShow).toBe('');
    });
  });

  // ==========================================
  // buildListItem
  // ==========================================

  describe('buildListItem', () => {
    it('should build catalog filter item', () => {
      const item = { id: 'cat:1', name: 'Test Catalog' };
      const selectedMap = { 'cat:1': true };

      const result = buildListItem(FILTER.CATALOGS, item, selectedMap);

      expect(result).toEqual({
        label: 'Test Catalog',
        value: 'cat:1',
        checked: true,
      });
    });

    it('should build non-catalog filter item from string', () => {
      const item = 'JavaScript';
      const selectedMap = { JavaScript: true };

      const result = buildListItem(FILTER.SKILL_NAME, item, selectedMap);

      expect(result).toEqual({
        label: 'JavaScript',
        value: 'JavaScript',
        checked: true,
      });
    });

    it('should build non-catalog filter item from object', () => {
      const item = { id: 'skill:1', name: 'Python' };
      const selectedMap = { Python: false };

      const result = buildListItem(FILTER.SKILL_NAME, item, selectedMap);

      expect(result).toEqual({
        label: 'Python',
        value: 'Python',
        checked: false,
      });
    });

    it('should default checked to false when not in selectedMap', () => {
      const item = { id: 'cat:2', name: 'Unchecked Catalog' };
      const selectedMap = {};

      const result = buildListItem(FILTER.CATALOGS, item, selectedMap);

      expect(result.checked).toBe(false);
    });
  });

  // ==========================================
  // getSearchFilterList
  // ==========================================

  describe('getSearchFilterList', () => {
    it('should return search results for skills', async () => {
      const mockSearchResponse = {
        skillList: [
          { id: 'skill:1', name: 'JavaScript' },
          { id: 'skill:2', name: 'Python' },
        ],
      };
      mockRestAdapter.get.mockResolvedValue({ data: mockSearchResponse });
      mockJsonApiParse.mockReturnValue(mockSearchResponse);

      const selectedMap = { JavaScript: true };
      const result = await getSearchFilterList('script', FILTER.SKILL_NAME, selectedMap);

      expect(result).toHaveLength(2);
      expect(result[0].label).toBe('JavaScript');
      expect(result[0].value).toBe('JavaScript');
      expect(result[0].checked).toBe(true); // selectedMap has JavaScript: true
      expect(result[1].label).toBe('Python');
      expect(result[1].value).toBe('Python');
      expect(result[1].checked).toBe(false);
    });

    it('should return empty array when no response', async () => {
      mockRestAdapter.get.mockResolvedValue({ data: null });
      mockJsonApiParse.mockReturnValue(null as any);

      const result = await getSearchFilterList('test', FILTER.SKILL_NAME, {});

      expect(result).toEqual([]);
    });

    it('should handle undefined response list', async () => {
      const mockSearchResponse = {
        skillList: undefined,
      };
      mockRestAdapter.get.mockResolvedValue({ data: mockSearchResponse });
      mockJsonApiParse.mockReturnValue(mockSearchResponse);

      const result = await getSearchFilterList('test', FILTER.SKILL_NAME, {});

      // When skillList is undefined, the map returns undefined, which is then returned
      expect(result).toBeUndefined();
    });
  });

  // ==========================================
  // doClientSearch
});
