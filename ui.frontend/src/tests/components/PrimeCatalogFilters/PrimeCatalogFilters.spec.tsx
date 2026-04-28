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
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PrimeCatalogFilters from '@components/Catalog/PrimeCatalogFilters/PrimeCatalogFilters';
import { FILTER, LEVELS } from '@utils/constants';
import * as globalUtils from '@utils/global';
import * as filterUtils from '@utils/filters';
import * as priceUtils from '@utils/price';
import * as catalogUtils from '@utils/catalog';
import * as translationService from '@utils/translationService';
import { DeviceTypeProvider } from '@contextProviders/DeviceContextProvider';
import { useDialog } from '@contextProviders/ALMDialogContextProvider';
import { withProviders } from '../../common/hoc';
import '@testing-library/jest-dom/extend-expect';

// Must mock the root reducer before importing the store to avoid initialization errors
jest.mock('../../../index', () => ({
  reducer: jest.fn((state = {}) => state),
}));

import store from '../../../store/APIStore';
import * as storeModule from '../../../almLib/store';

jest.mock('@components/Common/ALMLoader', () => {
  const React = require('react');
  return {
    ALMLoader: () => React.createElement('div', { 'data-testid': 'alm-loader' }, 'Loading...'),
  };
});

jest.mock('@components/Catalog/PrimeCatalogFilters/PrimeCatalogFilterListItem', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: (props: any) =>
      React.createElement(
        'div',
        { 'data-testid': `filter-list-item-${props.filter.type}` },
        `FilterListItem-${props.filter.type}`
      ),
  };
});

jest.mock('@components/Catalog/PrimeCatalogFilters/PrimeCatalogFiltersMobile', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: () => React.createElement('div', { 'data-testid': 'mobile-filters' }, 'Mobile Filters'),
  };
});

jest.mock('@utils/translationService', () => ({
  GetTranslation: jest.fn((key: string) => key),
}));

jest.mock('@utils/global', () => ({
  getALMObject: jest.fn(),
  getQueryParamsFromUrl: jest.fn(),
  isBookmarksEnabled: jest.fn(),
  updateURLParams: jest.fn(),
  getALMConfig: jest.fn(() => ({
    primeApiURL: 'https://test.api.com',
    graphqlProxyPath: 'https://test.graphql.com',
    commerceURL: 'https://test.commerce.com',
  })),
}));

jest.mock('@utils/filters', () => ({
  canShowLevelsForProducts: jest.fn(),
  canShowLevelsForRoles: jest.fn(),
  canResetLevelsFilter: jest.fn(),
}));

jest.mock('@utils/price', () => ({
  canShowPriceFilter: jest.fn(),
}));

jest.mock('@utils/catalog', () => ({
  isAttributeEnabled: jest.fn(),
  debounce: jest.fn(fn => fn),
}));

jest.mock('@utils/inline_svg', () => {
  const React = require('react');
  return {
    CATALOG_FILTERS_LOADER: () =>
      React.createElement('div', { 'data-testid': 'catalog-filters-loader' }, 'Filter Loader'),
  };
});

jest.mock('../../../almLib/store', () => ({
  clearAllFilters: jest.fn(() => ({ type: 'CLEAR_ALL_FILTERS' })),
  clearLevelsFilter: jest.fn(() => ({ type: 'CLEAR_LEVELS_FILTER' })),
  updateShowFilterLists: jest.fn(() => ({ type: 'UPDATE_SHOW_FILTER_LISTS' })),
}));

// Mock DialogProvider as a passthrough; control useDialog per test
jest.mock('@contextProviders/ALMDialogContextProvider', () => ({
  DialogProvider: ({ children }: any) => <>{children}</>,
  useDialog: jest.fn(),
}));

// --- Fixtures ---

const mockAccount = {
  prlCriteria: {
    enabled: true,
    products: { levelsEnabled: true },
    roles: { levelsEnabled: true },
  },
};

const mockFilterState = {
  loTypes: {
    type: FILTER.LO_TYPES,
    label: 'alm.catalog.filter.loType.label',
    list: [
      { value: 'course', label: 'Course', checked: false },
      { value: 'learningProgram', label: 'Learning Program', checked: false },
    ],
  },
  products: {
    type: FILTER.PRODUCTS,
    label: 'alm.catalog.filter.products.label',
    list: [{ value: 'product1', label: 'Product 1', checked: false }],
  },
  roles: {
    type: FILTER.ROLES,
    label: 'alm.catalog.filter.roles.label',
    list: [{ value: 'role1', label: 'Role 1', checked: false }],
  },
  levels: {
    type: FILTER.LEVELS,
    label: 'alm.catalog.filter.levels.label',
    list: [{ value: 'beginner', label: 'Beginner', checked: false }],
  },
  skillName: {
    type: FILTER.SKILL_NAME,
    label: 'alm.catalog.filter.skills.label',
    list: [{ value: 'skill1', label: 'Skill 1', checked: false }],
    canSearch: true,
  },
  tagName: {
    type: FILTER.TAG_NAME,
    label: 'alm.catalog.filter.tags.label',
    list: [{ value: 'tag1', label: 'Tag 1', checked: false }],
    canSearch: true,
  },
  catalogs: {
    type: FILTER.CATALOGS,
    label: 'alm.catalog.card.catalogs.label.plural',
    list: [{ value: 'catalog1', label: 'Catalog 1', checked: false }],
    canSearch: true,
  },
  learnerState: {
    type: FILTER.LEARNER_STATE,
    label: 'alm.catalog.filter.status.label',
    list: [{ value: 'enrolled', label: 'Enrolled', checked: false }],
  },
  duration: {
    type: FILTER.DURATION,
    label: 'alm.catalog.filter.duration.label',
    list: [{ value: '0-1800', label: 'Less than 30 min', checked: false }],
  },
  loFormat: {
    type: FILTER.LO_FORMAT,
    label: 'alm.catalog.filter.format.label',
    list: [{ value: 'Classroom', label: 'Classroom', checked: false }],
  },
  skillLevel: {
    type: FILTER.SKILL_LEVEL,
    label: 'alm.catalog.filter.skills.level.label',
    list: [{ value: '1', label: 'Beginner', checked: false }],
  },
  price: {
    type: FILTER.PRICE,
    label: 'alm.catalog.filter.price.label',
    list: [{ value: 'free', label: 'Free', checked: false }],
  },
  priceRange: {
    type: FILTER.PRICE_RANGE,
    label: 'alm.catalog.filter.priceRange.label',
    list: [
      { value: 0, label: '', checked: false },
      { value: 100, label: '', checked: false },
    ],
    maxPrice: 1000,
  },
  cities: {
    type: FILTER.CITIES,
    label: 'alm.catalog.filter.cities.label',
    list: [{ value: 'city1', label: 'City 1', checked: false }],
  },
  announcedGroups: {
    type: FILTER.ANNOUNCED_GROUPS,
    label: 'alm.catalog.filter.announcedGroups.label',
    list: [{ value: 'group1', label: 'Group 1', checked: false }],
  },
};

const mockCatalogAttributes = {
  [FILTER.LO_TYPES]: 'true',
  [FILTER.PRODUCTS]: 'true',
  [FILTER.ROLES]: 'true',
  [FILTER.LEVELS]: 'true',
  [FILTER.SKILL_NAME]: 'true',
  [FILTER.TAG_NAME]: 'true',
  [FILTER.CATALOGS]: 'true',
  [FILTER.LEARNER_STATE]: 'true',
  [FILTER.DURATION]: 'true',
  [FILTER.LO_FORMAT]: 'true',
  [FILTER.SKILL_LEVEL]: 'true',
  [FILTER.PRICE]: 'true',
  [FILTER.PRICE_RANGE]: 'true',
  [FILTER.CITIES]: 'true',
  [FILTER.ANNOUNCED_GROUPS]: 'true',
};

const defaultProps = {
  filterState: mockFilterState,
  updateFilters: jest.fn(),
  catalogAttributes: mockCatalogAttributes,
  updatePriceRangeFilter: jest.fn(),
  account: mockAccount,
  resetFilterList: jest.fn(),
  resetFilters: jest.fn(),
  areFiltersLoading: false,
  searchFilters: jest.fn(),
  clearFilterSearch: jest.fn(),
  updateFilterList: jest.fn(),
  getSelectedFilters: jest.fn(),
};

function renderWithDevice(props: any, windowWidth = 1200) {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: windowWidth,
  });
  const Wrapper: React.FC<any> = () => (
    <DeviceTypeProvider>
      <PrimeCatalogFilters {...props} />
    </DeviceTypeProvider>
  );
  return render(withProviders(Wrapper, {}));
}

// --- Tests ---

describe('PrimeCatalogFilters', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (translationService.GetTranslation as jest.Mock).mockImplementation((key: string) => key);
    (globalUtils.getALMObject as jest.Mock).mockReturnValue({
      isPrimeUserLoggedIn: () => true,
    });
    (globalUtils.getQueryParamsFromUrl as jest.Mock).mockReturnValue({});
    (filterUtils.canShowLevelsForProducts as jest.Mock).mockReturnValue(false);
    (filterUtils.canShowLevelsForRoles as jest.Mock).mockReturnValue(false);
    (filterUtils.canResetLevelsFilter as jest.Mock).mockReturnValue(false);
    (priceUtils.canShowPriceFilter as jest.Mock).mockReturnValue(true);
    (catalogUtils.isAttributeEnabled as unknown as jest.Mock).mockReturnValue(true);
    (useDialog as jest.Mock).mockReturnValue({ isOpen: () => false });
    jest.spyOn(store, 'getState').mockReturnValue({
      catalog: { filterState: { showFilterLists: '' } },
    } as any);
  });

  describe('Loading states', () => {
    it('render_filterStateIsLoading_showsALMLoaderOnly', () => {
      renderWithDevice({ ...defaultProps, filterState: { ...mockFilterState, isLoading: true } });
      expect(screen.getByTestId('alm-loader')).toHaveTextContent('Loading...');
      expect(screen.queryByRole('heading', { name: 'alm.catalog.filters' })).not.toBeInTheDocument();
    });

    it('render_areFiltersLoadingDesktop_showsSkeletonAndHidesFilterItems', () => {
      renderWithDevice({ ...defaultProps, areFiltersLoading: true });
      expect(screen.getByTestId('catalog-filters-loader')).toHaveTextContent('Filter Loader');
      expect(screen.queryByTestId(`filter-list-item-${FILTER.LO_TYPES}`)).not.toBeInTheDocument();
    });
  });

  describe('Desktop layout', () => {
    it('render_desktop_showsFiltersHeading', () => {
      renderWithDevice(defaultProps);
      // id="filterText" is referenced by aria-labelledby on each filter group
      expect(screen.getByRole('heading', { name: 'alm.catalog.filters', level: 3 })).toHaveAttribute('id', 'filterText');
    });

    it('render_desktop_rendersEnabledFilterItems', () => {
      renderWithDevice(defaultProps);
      expect(screen.getByTestId(`filter-list-item-${FILTER.LO_TYPES}`)).toHaveTextContent(
        `FilterListItem-${FILTER.LO_TYPES}`
      );
      expect(screen.getByTestId(`filter-list-item-${FILTER.DURATION}`)).toHaveTextContent(
        `FilterListItem-${FILTER.DURATION}`
      );
    });
  });

  describe('Mobile/tablet layout', () => {
    it('render_mobileDialogOpen_showsMobileFiltersComponent', () => {
      (useDialog as jest.Mock).mockReturnValue({
        isOpen: (id: string) => id === 'alm-filters-dialog',
      });
      renderWithDevice(defaultProps, 375); // mobile width < 450
      expect(screen.getByTestId('mobile-filters')).toHaveTextContent('Mobile Filters');
      expect(screen.queryByRole('heading', { name: 'alm.catalog.filters' })).not.toBeInTheDocument();
    });

    it('render_mobileDialogClosed_showsNothing', () => {
      (useDialog as jest.Mock).mockReturnValue({ isOpen: () => false });
      renderWithDevice(defaultProps, 375);
      expect(screen.queryByTestId('mobile-filters')).not.toBeInTheDocument();
      expect(screen.queryByRole('heading', { name: 'alm.catalog.filters' })).not.toBeInTheDocument();
    });
  });

  describe('Clear All filters button', () => {
    it('showClearFiltersButton_activeQueryParamMatchesFilter_showsButton', () => {
      (globalUtils.getQueryParamsFromUrl as jest.Mock).mockReturnValue({ loTypes: 'course' });
      renderWithDevice(defaultProps);
      expect(screen.getByRole('button', { name: 'alm.filter.clearAll' })).not.toBeDisabled();
    });

    it('showClearFiltersButton_noMatchingQueryParams_hidesButton', () => {
      (globalUtils.getQueryParamsFromUrl as jest.Mock).mockReturnValue({});
      renderWithDevice(defaultProps);
      expect(screen.queryByRole('button', { name: 'alm.filter.clearAll' })).not.toBeInTheDocument();
    });

    it('showClearFiltersButton_catalogsDisabledAttribute_skipsCatalogsAndHidesButton', () => {
      (globalUtils.getQueryParamsFromUrl as jest.Mock).mockReturnValue({ catalogs: 'cat1' });
      (catalogUtils.isAttributeEnabled as unknown as jest.Mock).mockReturnValue(false);
      renderWithDevice(defaultProps);
      expect(screen.queryByRole('button', { name: 'alm.filter.clearAll' })).not.toBeInTheDocument();
    });

    it('resetFilters_onClearAllClick_calledOnce', () => {
      (globalUtils.getQueryParamsFromUrl as jest.Mock).mockReturnValue({ loTypes: 'course' });
      const resetFilters = jest.fn();
      renderWithDevice({ ...defaultProps, resetFilters });
      userEvent.click(screen.getByRole('button', { name: 'alm.filter.clearAll' }));
      expect(resetFilters).toHaveBeenCalledTimes(1);
    });
  });

  describe('Filter visibility — catalog attributes', () => {
    it('renderFilterList_catalogAttributeFalse_hidesFilterItem', () => {
      renderWithDevice({
        ...defaultProps,
        catalogAttributes: { ...mockCatalogAttributes, [FILTER.DURATION]: 'false' },
      });
      expect(screen.queryByTestId(`filter-list-item-${FILTER.DURATION}`)).not.toBeInTheDocument();
    });

    it('renderFilterList_emptyListNonSearchableFilter_hidesFilterItem', () => {
      renderWithDevice({
        ...defaultProps,
        filterState: { ...mockFilterState, duration: { ...mockFilterState.duration, list: [] } },
      });
      expect(screen.queryByTestId(`filter-list-item-${FILTER.DURATION}`)).not.toBeInTheDocument();
    });

    it('renderFilterList_emptyListSkillName_showsFilterItem', () => {
      // SEARCHED_FILTER_TYPES render even with empty list (to show "no results")
      renderWithDevice({
        ...defaultProps,
        filterState: { ...mockFilterState, skillName: { ...mockFilterState.skillName, list: [] } },
      });
      expect(screen.getByTestId(`filter-list-item-${FILTER.SKILL_NAME}`)).toHaveTextContent(
        `FilterListItem-${FILTER.SKILL_NAME}`
      );
    });

    it('renderFilterList_emptyListCatalogs_showsFilterItem', () => {
      renderWithDevice({
        ...defaultProps,
        filterState: { ...mockFilterState, catalogs: { ...mockFilterState.catalogs, list: [] } },
      });
      expect(screen.getByTestId(`filter-list-item-${FILTER.CATALOGS}`)).toHaveTextContent(
        `FilterListItem-${FILTER.CATALOGS}`
      );
    });

    it('renderFilterList_emptyListTagName_showsFilterItem', () => {
      renderWithDevice({
        ...defaultProps,
        filterState: { ...mockFilterState, tagName: { ...mockFilterState.tagName, list: [] } },
      });
      expect(screen.getByTestId(`filter-list-item-${FILTER.TAG_NAME}`)).toHaveTextContent(
        `FilterListItem-${FILTER.TAG_NAME}`
      );
    });
  });

  describe('Levels filter visibility', () => {
    it('levelsFilter_canShowForProducts_showsLevels', () => {
      (filterUtils.canShowLevelsForProducts as jest.Mock).mockReturnValue(true);
      renderWithDevice(defaultProps);
      expect(screen.getByTestId(`filter-list-item-${FILTER.LEVELS}`)).toHaveTextContent(
        `FilterListItem-${FILTER.LEVELS}`
      );
    });

    it('levelsFilter_canShowForRoles_showsLevels', () => {
      (filterUtils.canShowLevelsForRoles as jest.Mock).mockReturnValue(true);
      renderWithDevice(defaultProps);
      expect(screen.getByTestId(`filter-list-item-${FILTER.LEVELS}`)).toHaveTextContent(
        `FilterListItem-${FILTER.LEVELS}`
      );
    });

    it('levelsFilter_neitherProductsNorRolesMet_hidesLevels', () => {
      renderWithDevice(defaultProps); // both return false in beforeEach
      expect(screen.queryByTestId(`filter-list-item-${FILTER.LEVELS}`)).not.toBeInTheDocument();
    });
  });

  describe('Learner state filter visibility', () => {
    it('learnerStateFilter_userLoggedIn_showsFilter', () => {
      (globalUtils.getALMObject as jest.Mock).mockReturnValue({
        isPrimeUserLoggedIn: () => true,
      });
      renderWithDevice(defaultProps);
      expect(screen.getByTestId(`filter-list-item-${FILTER.LEARNER_STATE}`)).toHaveTextContent(
        `FilterListItem-${FILTER.LEARNER_STATE}`
      );
    });

    it('learnerStateFilter_userNotLoggedIn_hidesFilter', () => {
      (globalUtils.getALMObject as jest.Mock).mockReturnValue({
        isPrimeUserLoggedIn: () => false,
      });
      renderWithDevice(defaultProps);
      expect(
        screen.queryByTestId(`filter-list-item-${FILTER.LEARNER_STATE}`)
      ).not.toBeInTheDocument();
    });
  });

  describe('Price filter visibility', () => {
    it('priceFilter_canShowPrice_showsFilter', () => {
      (priceUtils.canShowPriceFilter as jest.Mock).mockReturnValue(true);
      renderWithDevice(defaultProps);
      expect(screen.getByTestId(`filter-list-item-${FILTER.PRICE}`)).toHaveTextContent(
        `FilterListItem-${FILTER.PRICE}`
      );
    });

    it('priceFilter_cannotShowPrice_hidesFilter', () => {
      (priceUtils.canShowPriceFilter as jest.Mock).mockReturnValue(false);
      renderWithDevice(defaultProps);
      expect(screen.queryByTestId(`filter-list-item-${FILTER.PRICE}`)).not.toBeInTheDocument();
    });
  });

  describe('Price range filter visibility', () => {
    it('priceRangeFilter_allConditionsMet_showsLabel', () => {
      // canShowPriceFilter=true (default), attribute=true, maxPrice set
      renderWithDevice(defaultProps);
      expect(
        screen.getByText('alm.catalog.filter.priceRange.label')
      ).toHaveAttribute('data-automationid', 'priceRangeFilterLabel');
    });

    it('priceRangeFilter_attributeFalse_hidesLabel', () => {
      renderWithDevice({
        ...defaultProps,
        catalogAttributes: { ...mockCatalogAttributes, [FILTER.PRICE_RANGE]: 'false' },
      });
      expect(screen.queryByText('alm.catalog.filter.priceRange.label')).not.toBeInTheDocument();
    });

    it('priceRangeFilter_noMaxPrice_hidesLabel', () => {
      renderWithDevice({
        ...defaultProps,
        filterState: {
          ...mockFilterState,
          priceRange: { ...mockFilterState.priceRange, maxPrice: undefined },
        },
      });
      expect(screen.queryByText('alm.catalog.filter.priceRange.label')).not.toBeInTheDocument();
    });

    it('priceRangeFilter_cannotShowPrice_hidesLabel', () => {
      (priceUtils.canShowPriceFilter as jest.Mock).mockReturnValue(false);
      renderWithDevice(defaultProps);
      expect(screen.queryByText('alm.catalog.filter.priceRange.label')).not.toBeInTheDocument();
    });
  });

  describe('Levels reset effect', () => {
    it('levelsResetEffect_canResetLevelsTrue_callsResetFilterListAndDispatches', () => {
      (filterUtils.canResetLevelsFilter as jest.Mock).mockReturnValue(true);
      const resetFilterList = jest.fn();
      renderWithDevice({ ...defaultProps, resetFilterList });
      expect(resetFilterList).toHaveBeenCalledWith(LEVELS);
      expect(storeModule.clearLevelsFilter).toHaveBeenCalled();
    });

    it('levelsResetEffect_canResetLevelsFalse_doesNotCallReset', () => {
      (filterUtils.canResetLevelsFilter as jest.Mock).mockReturnValue(false);
      const resetFilterList = jest.fn();
      renderWithDevice({ ...defaultProps, resetFilterList });
      expect(resetFilterList).not.toHaveBeenCalled();
    });

    it('levelsResetEffect_prlCriteriaDisabled_doesNotCallReset', () => {
      (filterUtils.canResetLevelsFilter as jest.Mock).mockReturnValue(true);
      const resetFilterList = jest.fn();
      renderWithDevice({
        ...defaultProps,
        resetFilterList,
        account: { prlCriteria: { enabled: false } },
      });
      expect(resetFilterList).not.toHaveBeenCalled();
    });
  });
});
