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
import { AnyAction } from 'redux';
import { PRLCriteria, PrimeAccount, PrimeUser } from '../models';
import {
  updateCatalogsFilter,
  updateDurationFilter,
  updateLearnerStateFilter,
  updateLoFormatFilter,
  updateLoTypesFilter,
  updatePriceRangeFilter,
  updateSkillLevelFilter,
  updateSkillNameFilter,
  updateTagsFilter,
  updateCitiesFilter,
  updateProductsFilter,
  updateRolesFilter,
  updateLevelsFilter,
  updatePriceFilter,
  updateAnnouncedGroupsFilter,
} from '../store/actions/catalog/action';
import { CatalogFilterState } from '../store/reducers/catalog';
import { getFilterNames } from './catalog';
import { API_REQUEST_CANCEL_TOKEN, FILTER } from './constants';
import {
  getALMConfig,
  getQueryParamsFromUrl,
  isAccAltCompletionEnabled,
  updateURLParams,
} from './global';
import { JsonApiParse } from './jsonAPIAdapter';
import { QueryParams, RestAdapter } from './restAdapter';
import { GetTranslation } from './translationService';
import { useUserContext } from '../contextProviders/userContextProvider';
export const filtersDefaultState: FilterState = {
  loTypes: {
    type: 'loTypes',
    label: 'alm.catalog.filter.loType.label',
    list: [
      {
        value: 'course',
        label: 'alm.catalog.card.course.plural',
        checked: false,
      },
      {
        value: 'learningProgram',
        label: 'alm.catalog.card.learningProgram.plural',
        checked: false,
      },
      {
        value: 'jobAid',
        label: 'alm.catalog.card.jobAid.plural',
        checked: false,
      },
      {
        value: 'certification',
        label: 'alm.catalog.card.certification.plural',
        checked: false,
      },
    ],
  },
  learnerState: {
    type: 'learnerState',
    label: 'alm.catalog.filter.status.label',
    list: [
      {
        value: 'enrolled',
        label: 'alm.catalog.filter.yetToStart',
        checked: false,
      },
      {
        value: 'started',
        label: 'alm.catalog.filter.inProgress',
        checked: false,
      },
      {
        value: 'completed',
        label: 'alm.catalog.filter.completed',
        checked: false,
      },
      {
        value: 'completedViaAlternate',
        label: 'alm.catalog.filter.completedViaAlternate',
        checked: false,
      },
      {
        value: 'notenrolled',
        label: 'alm.catalog.filter.notenrolled',
        checked: false,
      },
    ],
  },
  loFormat: {
    type: 'loFormat',
    label: 'alm.catalog.filter.format.label',
    list: [
      {
        value: 'Activity',
        label: 'alm.catalog.card.activity',
        checked: false,
      },
      { value: 'Blended', label: 'alm.catalog.card.blended', checked: false },
      {
        value: 'Self Paced',
        label: 'alm.catalog.card.self.paced',
        checked: false,
      },
      {
        value: 'Virtual Classroom',
        label: 'alm.catalog.card.virtual.classroom',
        checked: false,
      },
      {
        value: 'Classroom',
        label: 'alm.catalog.card.classroom',
        checked: false,
      },
    ],
  },
  //TO-DO : Add pagination for filters
  skillName: {
    type: FILTER.SKILL_NAME,
    label: 'alm.catalog.filter.skills.label',
    list: [],
    isListDynamic: true,
    canSearch: true,
    searchText: '',
    isLoading: false,
  },
  products: {
    type: 'products',
    label: 'alm.catalog.filter.products.label',
    list: [],
    isListDynamic: true,
  },
  roles: {
    type: 'roles',
    label: 'alm.catalog.filter.roles.label',
    list: [],
    isListDynamic: true,
  },
  levels: {
    type: 'levels',
    label: 'alm.catalog.filter.levels.label',
    list: [],
    isListDynamic: true,
  },
  announcedGroups: {
    type: 'announcedGroups',
    label: 'alm.catalog.filter.announcedGroups.label',
    list: [],
    isListDynamic: true,
  },
  tagName: {
    type: FILTER.TAG_NAME,
    label: 'alm.catalog.filter.tags.label',
    list: [],
    isListDynamic: true,
    canSearch: true,
    searchText: '',
    isLoading: false,
  },
  cities: {
    type: 'cities',
    label: 'alm.catalog.filter.cities.label',
    list: [],
    isListDynamic: true,
  },

  catalogs: {
    type: 'catalogs',
    label: 'alm.catalog.card.catalogs.label.plural',
    list: [],
    isListDynamic: true,
    canSearch: true,
  },
  skillLevel: {
    type: 'skillLevel',
    label: 'alm.catalog.filter.skills.level.label',
    list: [
      { value: '1', label: 'alm.catalog.filter.beginner', checked: false },
      {
        value: '2',
        label: 'alm.catalog.filter.intermediate',
        checked: false,
      },
      { value: '3', label: 'alm.catalog.filter.advanced', checked: false },
    ],
  },
  duration: {
    type: 'duration',
    label: 'alm.catalog.filter.duration.label',
    list: [
      {
        value: '0-1800',
        label: 'alm.catalog.filter.lessThan30Minutes',
        checked: false,
      },
      {
        value: '1801-7200',
        label: 'alm.catalog.filter.30minutesTo2Hours',
        checked: false,
      },
      {
        value: '7201-3600000',
        label: 'alm.catalog.filter.moreThan2Hours',
        checked: false,
      },
    ],
  },
  priceRange: {
    type: 'priceRange',
    label: 'alm.catalog.filter.priceRange.label',
    list: [
      {
        value: 0,
        label: '',
        checked: false,
      },
      {
        value: 0,
        label: '',
        checked: false,
      },
    ],
  },
  price: {
    type: 'price',
    label: 'alm.catalog.filter.price.label',
    list: [
      {
        value: 'free',
        label: 'alm.catalog.filter.price.free',
        checked: false,
      },
      {
        value: 'paid',
        label: 'alm.catalog.filter.price.paid',
        checked: false,
      },
    ],
  },
};

export interface FilterListObject {
  value: string | number;
  label: string;
  checked: boolean;
}
export interface FilterType {
  type?: string;
  label?: string;
  show?: boolean;
  list?: Array<FilterListObject>;
  isListDynamic?: boolean;
  maxPrice?: number;
  canSearch?: boolean;
  searchText?: string;
  isLoading?: boolean;
}

// export interface PriceFilterType {
//   maxPrice: number;
//   minPrice: number;
//   label?: string;
//   type?: string;
// }

export interface ActionMap {
  loTypes: Function;
  skillName: (
    payload:
      | string
      | {
          [key: string]: string;
        }
  ) => AnyAction;
}
export const ACTION_MAP = {
  loTypes: updateLoTypesFilter,
  learnerState: updateLearnerStateFilter,
  skillName: updateSkillNameFilter,
  loFormat: updateLoFormatFilter,
  tagName: updateTagsFilter,
  skillLevel: updateSkillLevelFilter,
  duration: updateDurationFilter,
  catalogs: updateCatalogsFilter,
  priceRange: updatePriceRangeFilter,
  cities: updateCitiesFilter,
  products: updateProductsFilter,
  roles: updateRolesFilter,
  levels: updateLevelsFilter,
  price: updatePriceFilter,
  announcedGroups: updateAnnouncedGroupsFilter,
};

export interface UpdateFiltersEvent {
  filterType: string;
  checked?: boolean;
  label?: string;
  data?: any;
  resetLevels?: boolean;
}

export interface FilterState {
  loTypes: FilterType;
  learnerState: FilterType;
  skillName: FilterType;
  loFormat: FilterType;
  tagName: FilterType;
  cities: FilterType;
  catalogs: FilterType;
  skillLevel: FilterType;
  duration: FilterType;
  price: FilterType;
  priceRange: FilterType;
  products: FilterType;
  roles: FilterType;
  levels: FilterType;
  announcedGroups: FilterType;
}

// Mapping from React filter types to Learner Desktop URL param names
const LEARNER_DESKTOP_PARAM_MAP: { [key: string]: string } = {
  catalogs: 'selectedListableCatalogIds',
  products: 'selectedRecommendationProducts',
  roles: 'selectedRecommendationRoles',
  levels: 'selectedPrlLevels',
};

// Helper to parse Learner Desktop format: ["value1","value2"] -> ["value1", "value2"]
const parseLearnerDesktopFormat = (param: string): string[] => {
  if (!param) return [];
  // Remove brackets and quotes, then split by comma
  const parsed = param.replace(/^\[|\]$/g, '').replace(/"/g, '');
  return parsed ? parsed.split(',').map(s => s.trim()) : [];
};

export const updateFilterList = (list: any, filtersFromUrl: any, type: string) => {
  // Check for React format first (e.g., catalogs=cat1,cat2)
  let filtersFromUrlTypeSplitArray = filtersFromUrl[type] ? filtersFromUrl[type].split(',') : [];

  // If empty, check for Learner Desktop format (e.g., selectedListableCatalogIds=["cat1","cat2"])
  if (filtersFromUrlTypeSplitArray.length === 0) {
    const learnerDesktopParam = LEARNER_DESKTOP_PARAM_MAP[type];
    if (learnerDesktopParam && filtersFromUrl[learnerDesktopParam]) {
      filtersFromUrlTypeSplitArray = parseLearnerDesktopFormat(filtersFromUrl[learnerDesktopParam]);
    }
  }

  list?.forEach((item: any) => {
    if (
      filtersFromUrlTypeSplitArray?.includes(String(item.value)) ||
      filtersFromUrlTypeSplitArray?.includes(item.label)
    ) {
      item.checked = true;
    }
  });
  return list || [];
};

export const updatePriceRangeFilterList = (list: any, filtersFromUrl: any, type: string) => {
  let filtersFromUrlTypeSplitArray = filtersFromUrl[type] ? filtersFromUrl[type].split('-') : [];

  if (list.length && filtersFromUrlTypeSplitArray.length) {
    list[0].value = filtersFromUrlTypeSplitArray[0];
    list[1].value = filtersFromUrlTypeSplitArray[1];
  }
  return list || [];
};

export const getDefaultFiltersState = (account?: PrimeAccount) => {
  const filtersFromUrl = getQueryParamsFromUrl();
  let filtersDefault = filtersDefaultState;

  // Filter out completedViaAlternate if not enabled at account level
  if (!account || !isAccAltCompletionEnabled(account)) {
    filtersDefault.learnerState.list = filtersDefault.learnerState.list?.filter(
      item => item.value !== 'completedViaAlternate'
    );
    // Remove completedViaAlternate related params from URL
    const { completedViaAlternateSelected, learnerState } = filtersFromUrl;
    const hasAlternateInLearnerState =
      typeof learnerState === 'string' && learnerState.split(',').includes('completedViaAlternate');

    if (completedViaAlternateSelected || hasAlternateInLearnerState) {
      const urlParamsToUpdate: { [key: string]: string } = {};

      if (completedViaAlternateSelected) {
        urlParamsToUpdate.completedViaAlternateSelected = '';
      }
      if (hasAlternateInLearnerState) {
        urlParamsToUpdate.learnerState = learnerState
          .split(',')
          .filter(s => s !== 'completedViaAlternate')
          .join(',');
      }

      updateURLParams(urlParamsToUpdate);
    }
  }
  const guest = getALMConfig().guest;
  if (
    !guest &&
    account?.enableAiCoach &&
    !filtersDefault.loTypes.list?.some(item => item.value === 'virtualCoach')
  ) {
    filtersDefault.loTypes.list = [
      ...(filtersDefault.loTypes.list || []),
      { value: 'virtualCoach', label: 'alm.training.virtualCoachJobAids', checked: false },
    ];
  }
  filtersDefault.loTypes.list = updateFilterList(
    filtersDefault.loTypes.list,
    filtersFromUrl,
    'loTypes'
  );
  filtersDefault.learnerState.list = updateFilterList(
    filtersDefault.learnerState.list,
    filtersFromUrl,
    'learnerState'
  );
  filtersDefault.loFormat.list = updateFilterList(
    filtersDefault.loFormat.list,
    filtersFromUrl,
    'loFormat'
  );

  filtersDefault.skillLevel.list = updateFilterList(
    filtersDefault.skillLevel.list,
    filtersFromUrl,
    'skillLevel'
  );

  filtersDefault.duration.list = updateFilterList(
    filtersDefault.duration.list,
    filtersFromUrl,
    'duration'
  );

  filtersDefault.priceRange.list = updatePriceRangeFilterList(
    filtersDefault.priceRange.list,
    filtersFromUrl,
    'priceRange'
  );
  return filtersDefault;
};

const getLabelForDynamicList = (item: ReadonlyArray<{ label: string }>) => ({
  labelToShow: item[0]?.label,
  label: item[0]?.label,
});

const getLabelForStaticList = (item: ReadonlyArray<{ label: string }>) => ({
  labelToShow: GetTranslation(item[0]?.label, true),
  label: item[0]?.label,
});

const getRawValueLabel = (value: string | number) => ({
  labelToShow: value,
  label: value,
});

export const getFilterLabel = (value: string | number, filter: FilterType) => {
  const isCatalogs = filter?.type === FILTER.CATALOGS;
  const isPriceRange = filter?.type === FILTER.PRICE_RANGE;

  if (isPriceRange) {
    return getRawValueLabel(value);
  }

  const matchedFilterItem = filter?.list?.find(listItem => listItem.value === value);

  if (matchedFilterItem) {
    const shouldUseDynamic = Boolean(filter?.isListDynamic || filter?.canSearch || isCatalogs);
    const singleItemArray = [matchedFilterItem];
    return shouldUseDynamic
      ? getLabelForDynamicList(singleItemArray)
      : getLabelForStaticList(singleItemArray);
  }

  if (isCatalogs) {
    return getRawValueLabel(value);
  }

  return { label: '', labelToShow: '' };
};

export const canShowLevelsForProducts = (
  account: PrimeAccount,
  filterState: CatalogFilterState
): boolean => {
  const { filterPanelSetting, prlCriteria = {} as PRLCriteria } = account;
  const isPRLCriteriaEnabled = prlCriteria.enabled;
  const isAnyProductSelected = isAnyItemSelected(filterState.products);
  return (
    isPRLCriteriaEnabled &&
    filterPanelSetting.recommendationLevel &&
    prlCriteria.products?.levelsEnabled &&
    isAnyProductSelected
  );
};
export const canShowLevelsForRoles = (
  account: PrimeAccount,
  filterState: CatalogFilterState
): boolean => {
  const { filterPanelSetting, prlCriteria = {} as PRLCriteria } = account;
  const isPRLCriteriaEnabled = prlCriteria.enabled;
  const isAnyRoleSelected = isAnyItemSelected(filterState.roles);
  return (
    isPRLCriteriaEnabled &&
    filterPanelSetting.recommendationLevel &&
    prlCriteria.roles?.levelsEnabled &&
    isAnyRoleSelected
  );
};

function isAnyItemSelected(items: any) {
  return items?.list?.some((item: { checked: boolean }) => item.checked);
}

export const canResetLevelsFilter = (prlCriteria: PRLCriteria, filterState: any): boolean => {
  const { products, roles } = filterState;

  const isAnyProductSelected = isAnyItemSelected(products);
  const isAnyRoleSelected = isAnyItemSelected(roles);

  return (
    (prlCriteria.products?.levelsEnabled && !isAnyProductSelected) ||
    (prlCriteria.roles?.levelsEnabled && !isAnyRoleSelected)
  );
};

const FILTER_SEARCH_PAGE_LIMIT = 10;
const getCancelFilterType = (type: string): string => {
  if (type === FILTER.SKILL_NAME) return API_REQUEST_CANCEL_TOKEN.SKILL_FILTER_SEARCH;
  if (type === FILTER.CATALOGS) return API_REQUEST_CANCEL_TOKEN.CATALOG_FILTER_SEARCH;
  return API_REQUEST_CANCEL_TOKEN.TAG_FILTER_SEARCH;
};
export const searchFilterValue = async (query: string, type: string) => {
  const baseApiUrl = getALMConfig().primeApiURL;
  const params: QueryParams = {
    'page[limit]': FILTER_SEARCH_PAGE_LIMIT,
    autoCompleteMode: true,
    sort: 'relevance',
    'filter.loTypes': type,
    matchType: 'phrase',
    persistSearchHistory: true,
    highlightResults: false,
  };
  params.query = query;
  const cancelToken = getCancelFilterType(type);
  let response: any = await RestAdapter.get({
    url: `${baseApiUrl}/search`,
    params: params,
    cancelToken,
  });
  const parsedResponse = JsonApiParse(response);
  return parsedResponse;
};

export const getMySkills = async () => {
  const baseApiUrl = getALMConfig().primeApiURL;
  const response: any = await RestAdapter.get({
    url: `${baseApiUrl}data?filter.enrolled.skillName=true`,
  });

  return response;
};
export const userSkillsList = async () => {
  const userSkillsResponse = await getMySkills();
  const userSkills = getFilterNames(userSkillsResponse);
  return userSkills;
};

// Mapping constants for filter search
export const FILTER_TYPE_TO_API_PARAM: { [key: string]: string } = {
  skillName: 'skill',
  tagName: 'tag',
  catalogs: 'catalog',
};

export const FILTER_TYPE_TO_LIST_TYPE: { [key: string]: string } = {
  [FILTER.SKILL_NAME]: 'skillList',
  [FILTER.CATALOGS]: 'catalogList',
  [FILTER.TAG_NAME]: 'tagList',
};

// Mapping constants for ES filter search API
export const ES_FILTER_TYPE_TO_API_PARAM: { [key: string]: string } = {
  skillName: 'skill',
  tagName: 'tag',
  catalogs: 'catalog',
};

export const ES_FILTER_TYPE_TO_RESPONSE_KEY: { [key: string]: string } = {
  skillName: 'skills',
  tagName: 'tags',
  catalogs: 'catalogs',
};

/**
 * ES server-side filter search - fetches search results from ES API for non-logged-in users
 */
export const getESSearchFilterList = async (
  query: string,
  type: string,
  selectedItemsFromStore: { [key: string]: boolean }
): Promise<FilterListObject[]> => {
  const esBaseUrl = getALMConfig().esBaseUrl;
  const filterLoType = ES_FILTER_TYPE_TO_API_PARAM[type];
  const responseKey = ES_FILTER_TYPE_TO_RESPONSE_KEY[type];

  const response = await RestAdapter.post({
    url: `${esBaseUrl}/searchfilters`,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query,
      filterLoType,
      size: FILTER_SEARCH_PAGE_LIMIT,
    }),
  });

  const data = JSON.parse(response as string);
  const items = data[responseKey] || [];

  return items.map((name: string) => ({
    label: name,
    value: name,
    checked: selectedItemsFromStore[name] || false,
  }));
};

/**
 * Normalize an API/option item into the list item shape consumed by filters UI
 * - For catalogs: label=name, value=id, checked by id
 * - For other types: label=name, value=name, checked by name (supports string or { name })
 */
export const buildListItem = (
  filterType: string,
  item: { id: string; name: string } | string,
  selectedMap: { [key: string]: boolean }
): FilterListObject => {
  if (filterType === FILTER.CATALOGS) {
    const typedItem = item as { id: string; name: string };
    return {
      label: typedItem.name,
      value: typedItem.id,
      checked: selectedMap[typedItem.id] || false,
    };
  }
  const name = typeof item === 'string' ? item : item.name;
  return {
    label: name,
    value: name,
    checked: selectedMap[name] || false,
  };
};

/**
 * Server-side filter search - fetches search results from API
 */
export const getSearchFilterList = async (
  query: string,
  type: string,
  selectedItemsFromStore: { [key: string]: boolean }
): Promise<FilterListObject[]> => {
  const response = await searchFilterValue(query, FILTER_TYPE_TO_API_PARAM[type]);
  const listType = FILTER_TYPE_TO_LIST_TYPE[type];
  const list = response
    ? (response as any)[listType]?.map((item: any) =>
        buildListItem(type, item, selectedItemsFromStore)
      )
    : [];
  return list;
};
