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

import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/extend-expect';
import PrimeCatalogFiltersMobile from '@components/Catalog/PrimeCatalogFilters/PrimeCatalogFiltersMobile';
import { withProviders } from '../../common/hoc';
import * as translationService from '@utils/translationService';
import { FILTER } from '@utils/constants';

jest.mock('@utils/translationService', () => ({
  GetTranslation: jest.fn((key: string) => key),
}));

jest.mock('@components/ALMDialog', () => ({
  ALMDialog: ({ children, id, height, stickyPosition, overlayClose, borderRadius }: any) => (
    <div
      data-testid="alm-dialog"
      id={id}
      data-height={String(height)}
      data-overlayclose={String(overlayClose)}
      data-stickyposition={String(stickyPosition)}
      data-borderradius={borderRadius}
    >
      {children}
    </div>
  ),
  ALMDialogHeader: ({ children }: any) => <div data-testid="alm-dialog-header">{children}</div>,
  ALMDialogContent: ({ children }: any) => <div data-testid="alm-dialog-content">{children}</div>,
  ALMDialogFooter: ({ children }: any) => <div data-testid="alm-dialog-footer">{children}</div>,
}));

jest.mock('@components/Catalog/PrimeCatalogFilters/PrimeCatalogFilterListItem', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: (props: any) =>
      React.createElement('div', {
        'data-testid': 'filter-list-item',
        'data-filter-type': props.filter?.type,
      }),
  };
});

jest.mock('@components/Catalog/PrimeCatalogFilters/PrimeSelectedFiltersList', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: (props: any) =>
      React.createElement('div', {
        'data-testid': 'selected-filters-list',
        'data-count': props.selectedFilters?.length ?? 0,
      }),
  };
});

jest.mock('@spectrum-icons/workflow/ChevronRight', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: () => React.createElement('span', { 'data-testid': 'chevron-right' }),
  };
});

const mockDeviceContext = { isMobile: false, isTablet: false, isDesktop: true };

jest.mock('@contextProviders/DeviceContextProvider', () => ({
  useDeviceTypeContext: () => mockDeviceContext,
  DeviceTypeProvider: ({ children }: any) => children,
}));

const mockCloseDialog = jest.fn();
jest.mock('@contextProviders/ALMDialogContextProvider', () => ({
  useDialog: () => ({
    openDialog: jest.fn(),
    closeDialog: mockCloseDialog,
    currentOpenDialogId: '',
  }),
  DialogProvider: ({ children }: any) => children,
}));

const mockDispatch = jest.fn();
jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => mockDispatch,
}));

// --- Fixtures ---

const mockFilterState = {
  loTypes: {
    type: FILTER.LO_TYPES,
    label: 'alm.catalog.filter.type',
    list: [{ label: 'alm.catalog.loType.course', value: 'course', checked: false }],
  },
  skillLevel: {
    type: FILTER.SKILL_LEVEL,
    label: 'alm.catalog.filter.level',
    list: [{ label: 'alm.catalog.level.beginner', value: 'beginner', checked: false }],
  },
  duration: {
    type: FILTER.DURATION,
    label: 'alm.catalog.filter.duration',
    list: [{ label: 'Less than 30 min', value: '0-1800', checked: false }],
  },
};

function makeProps(overrides: any = {}) {
  return {
    filterOrder: [FILTER.LO_TYPES, FILTER.SKILL_LEVEL, FILTER.DURATION],
    filterState: mockFilterState,
    selectedFilter: mockFilterState.loTypes,
    updateShowFilterLists: jest.fn((type: string) => ({ type: 'UPDATE_SHOW_FILTER_LISTS', payload: type })),
    renderPriceRangeFilter: jest.fn(() => <div data-testid="price-range-filter" />),
    searchFilters: jest.fn(),
    updateFilters: jest.fn(),
    clearFilterSearch: jest.fn().mockResolvedValue(undefined),
    showFilterLists: FILTER.LO_TYPES,
    updateFilterList: jest.fn(),
    showClearFiltersButton: jest.fn(() => null),
    updatePriceRangeFilter: jest.fn(),
    resetFilters: jest.fn(),
    getSelectedFilters: jest.fn(() => []),
    ...overrides,
  };
}

function renderComponent(props: any) {
  return render(withProviders(PrimeCatalogFiltersMobile, props));
}

// --- Tests ---

describe('PrimeCatalogFiltersMobile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDeviceContext.isMobile = false;
    mockDeviceContext.isTablet = false;
    mockDeviceContext.isDesktop = true;
    (translationService.GetTranslation as jest.Mock).mockImplementation((key: string) => key);
  });

  describe('Dialog attributes', () => {
    it('render_rendersDialogWithCorrectIdAndStaticAttributes', () => {
      renderComponent(makeProps());
      const dialog = screen.getByTestId('alm-dialog');
      expect(dialog).toHaveAttribute('id', 'alm-filters-dialog');
      expect(dialog).toHaveAttribute('data-overlayclose', 'true');
      expect(dialog).toHaveAttribute('data-stickyposition', 'true');
    });

    it('render_mobile_usesHeight80AndTopBorderRadius', () => {
      mockDeviceContext.isMobile = true;
      renderComponent(makeProps());
      const dialog = screen.getByTestId('alm-dialog');
      expect(dialog).toHaveAttribute('data-height', '80');
      expect(dialog).toHaveAttribute('data-borderradius', 'top');
    });

    it('render_tablet_usesHeight60AndAllBorderRadius', () => {
      mockDeviceContext.isTablet = true;
      renderComponent(makeProps());
      const dialog = screen.getByTestId('alm-dialog');
      expect(dialog).toHaveAttribute('data-height', '60');
      expect(dialog).toHaveAttribute('data-borderradius', 'all');
    });
  });

  describe('Filter list (left pane)', () => {
    it('filterList_rendersLabelForEachFilterOrderEntry', () => {
      const { container } = renderComponent(makeProps());
      const labels = container.querySelectorAll('[data-automationid="filtersText"]');
      expect(labels).toHaveLength(3);
    });

    it('filterList_emptyListNonSearchableFilter_hidesFromList', () => {
      const props = makeProps({
        filterState: {
          ...mockFilterState,
          duration: { ...mockFilterState.duration, list: [] },
        },
      });
      const { container } = renderComponent(props);
      const labels = container.querySelectorAll('[data-automationid="filtersText"]');
      expect(labels).toHaveLength(2); // duration hidden
    });

    it('filterList_emptyListSkillNameOrTagName_showsInList', () => {
      const props = makeProps({
        filterOrder: [FILTER.SKILL_NAME],
        filterState: {
          skillName: { type: FILTER.SKILL_NAME, label: 'alm.catalog.filter.skills', list: [] },
        },
        selectedFilter: { type: FILTER.SKILL_NAME, label: 'alm.catalog.filter.skills', list: [] },
      });
      const { container } = renderComponent(props);
      const labels = container.querySelectorAll('[data-automationid="filtersText"]');
      expect(labels).toHaveLength(1);
    });

    it('filterList_missingFilterStateEntry_skipsIt', () => {
      const props = makeProps({
        filterOrder: [FILTER.LO_TYPES, 'nonExistent', FILTER.DURATION],
        filterState: {
          loTypes: mockFilterState.loTypes,
          duration: mockFilterState.duration,
        },
      });
      const { container } = renderComponent(props);
      const labels = container.querySelectorAll('[data-automationid="filtersText"]');
      expect(labels).toHaveLength(2);
    });

    it('filterList_selectedFilter_showsChevronIcon', () => {
      // selectedFilter = loTypes → only that label gets the chevron (exactly 1 of 3)
      renderComponent(makeProps());
      expect(screen.getAllByTestId('chevron-right')).toHaveLength(1);
    });

    it('filterList_nonSelectedFilter_hasNoChevronIcon', () => {
      const props = makeProps({ selectedFilter: mockFilterState.duration });
      renderComponent(props);
      // Only one chevron (for duration); loTypes and skillLevel have none
      expect(screen.getAllByTestId('chevron-right')).toHaveLength(1);
    });

    it('filterList_labelClick_dispatchesWithCorrectFilterType', () => {
      const updateShowFilterLists = jest.fn((type: string) => ({
        type: 'UPDATE_SHOW_FILTER_LISTS',
        payload: type,
      }));
      const { container } = renderComponent(makeProps({ updateShowFilterLists }));
      const labels = container.querySelectorAll('[data-automationid="filtersText"]');
      (labels[1] as HTMLElement).click(); // native click — userEvent v7 crashes on label without associated input
      expect(updateShowFilterLists).toHaveBeenCalledWith(FILTER.SKILL_LEVEL);
      expect(mockDispatch).toHaveBeenCalledWith({ type: 'UPDATE_SHOW_FILTER_LISTS', payload: FILTER.SKILL_LEVEL });
    });
  });

  describe('Right pane content', () => {
    it('rightPane_nonPriceFilter_showsFilterListItemWithSelectedFilter', () => {
      renderComponent(makeProps());
      expect(screen.getByTestId('filter-list-item')).toHaveAttribute('data-filter-type', FILTER.LO_TYPES);
    });

    it('rightPane_priceRangeFilter_callsRenderPriceRangeFilterWithSelectedFilter', () => {
      const priceRangeFilter = {
        type: FILTER.PRICE_RANGE,
        label: 'alm.catalog.filter.price',
        list: [{ value: 0 }, { value: 500 }],
        maxPrice: 1000,
      };
      const renderPriceRangeFilter = jest.fn(() => <div data-testid="price-range-filter" />);
      renderComponent(makeProps({ selectedFilter: priceRangeFilter, renderPriceRangeFilter }));
      expect(renderPriceRangeFilter).toHaveBeenCalledWith(priceRangeFilter);
      expect(screen.getByTestId('price-range-filter')).toBeInTheDocument();
    });
  });

  describe('Selected filters list', () => {
    it('selectedFiltersList_passesGetSelectedFiltersResultToList', () => {
      const selectedFiltersResult = [{ filterType: 'loTypes', label: 'Course', checked: true }];
      const getSelectedFilters = jest.fn(() => selectedFiltersResult);
      renderComponent(makeProps({ getSelectedFilters }));
      expect(screen.getByTestId('selected-filters-list')).toHaveAttribute('data-count', '1');
    });
  });

  describe('Cancel button', () => {
    it('cancelButton_click_resetsFiltersToInitialStateAndClosesDialog', () => {
      const initialFiltersValue = [{ filterType: 'loTypes', label: 'Course', checked: true }];
      const getSelectedFilters = jest.fn(() => initialFiltersValue);
      const resetFilters = jest.fn();
      renderComponent(makeProps({ getSelectedFilters, resetFilters }));
      userEvent.click(screen.getByText('Cancel'));
      expect(resetFilters).toHaveBeenCalledWith(initialFiltersValue);
      expect(mockCloseDialog).toHaveBeenCalledWith('alm-filters-dialog');
    });
  });

  describe('Apply button', () => {
    it('applyButton_click_callsUpdateFilterListAndClosesDialog', () => {
      const updateFilterList = jest.fn();
      renderComponent(makeProps({ updateFilterList }));
      userEvent.click(screen.getByText('Apply'));
      expect(updateFilterList).toHaveBeenCalledTimes(1);
      expect(mockCloseDialog).toHaveBeenCalledWith('alm-filters-dialog');
    });
  });

  describe('Cleanup on unmount', () => {
    it('unmount_callsClearFilterSearchForSkillNameAndTagName', async () => {
      const clearFilterSearch = jest.fn().mockResolvedValue(undefined);
      const { unmount } = renderComponent(makeProps({ clearFilterSearch }));
      await act(async () => {
        unmount();
      });
      expect(clearFilterSearch).toHaveBeenCalledWith(FILTER.SKILL_NAME);
      expect(clearFilterSearch).toHaveBeenCalledWith(FILTER.TAG_NAME);
    });
  });
});
