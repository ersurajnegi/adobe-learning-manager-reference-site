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
import PrimeCatalogFilterListItem from '@components/Catalog/PrimeCatalogFilters/PrimeCatalogFilterListItem';
import '@testing-library/jest-dom/extend-expect';
import * as translationService from '@utils/translationService';
import { withProviders } from '../../common/hoc';
import { ALL, FILTER } from '@utils/constants';
import store from '../../../store/APIStore';
import { DeviceTypeProvider } from '@contextProviders/DeviceContextProvider';

jest.mock('@components/Common/ALMLoader', () => ({
  ALMLoader: () => <div data-testid="alm-loader">Loading...</div>,
}));

// Stub SearchField to expose onChange/onClear without depending on React Spectrum internals
jest.mock('@adobe/react-spectrum', () => ({
  ...jest.requireActual('@adobe/react-spectrum'),
  SearchField: ({ onChange, onClear, placeholder, 'data-automationid': automationId }: any) => (
    <>
      <input
        type="search"
        placeholder={placeholder}
        data-automationid={automationId}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
      />
      <button data-testid="search-clear" onClick={onClear}>
        Clear
      </button>
    </>
  ),
}));

function renderWithDevice(props: any, windowWidth = 1200) {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: windowWidth,
  });
  const Wrapper: React.FC<any> = () => (
    <DeviceTypeProvider>
      <PrimeCatalogFilterListItem {...props} />
    </DeviceTypeProvider>
  );
  return render(withProviders(Wrapper, {}));
}

describe('PrimeCatalogFilterListItem', () => {
  const mockUpdateFilters = jest.fn();
  const mockSearchFilters = jest.fn();
  const mockClearFilterSearch = jest.fn();

  const defaultFilter = {
    type: 'loTypes',
    label: 'Training Type',
    list: [
      { label: 'alm.catalog.loType.course', value: 'course', checked: false },
      { label: 'alm.catalog.loType.learningProgram', value: 'learningProgram', checked: false },
      { label: 'alm.catalog.loType.certification', value: 'certification', checked: true },
    ],
    canSearch: false,
    isLoading: false,
    isListDynamic: false,
  };

  const defaultProps = {
    filter: defaultFilter,
    searchFilters: mockSearchFilters,
    updateFilters: mockUpdateFilters,
    clearFilterSearch: mockClearFilterSearch,
    showNoResultsFound: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(translationService, 'GetTranslation').mockImplementation((key: string) => key);
    jest.spyOn(store, 'getState').mockReturnValue({
      catalog: {
        filterState: {
          showFilterLists: ALL,
          loTypes: {},
          skillName: {},
        },
      },
    } as any);
  });

  describe('Rendering', () => {
    it('render_nullFilter_returnsNull', () => {
      renderWithDevice({ ...defaultProps, filter: null });
      expect(screen.queryByRole('group')).not.toBeInTheDocument();
    });

    it('render_withFilter_rendersGroupWithCorrectAriaAttributes', () => {
      renderWithDevice(defaultProps);
      expect(screen.getByRole('group')).toHaveAttribute(
        'aria-labelledby',
        'filterText filterContainerloTypes'
      );
    });

    it('render_levelsType_appliesLevelsContainerClass', () => {
      const { container } = renderWithDevice({
        ...defaultProps,
        filter: { ...defaultFilter, type: 'levels' },
      });
      expect(container.querySelector('[role="group"]')?.className).toMatch(/levelsFilterContainer/);
    });

    it('render_nonLevelsType_doesNotApplyLevelsContainerClass', () => {
      const { container } = renderWithDevice(defaultProps);
      expect(container.querySelector('[role="group"]')?.className).not.toMatch(
        /levelsFilterContainer/
      );
    });
  });

  describe('Filter list and checkboxes', () => {
    it('render_showNoResultsFoundFalse_rendersAllCheckboxes', () => {
      renderWithDevice(defaultProps);
      expect(screen.getAllByRole('checkbox')).toHaveLength(3);
    });

    it('render_checkboxCheckedState_matchesFilterList', () => {
      renderWithDevice(defaultProps);
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes[0]).not.toBeChecked(); // course: checked=false
      expect(checkboxes[2]).toBeChecked(); // certification: checked=true
    });

    it('render_dynamicList_showsLabelDirectlyWithoutTranslation', () => {
      const mockTranslation = jest.fn((key: string) => key);
      jest.spyOn(translationService, 'GetTranslation').mockImplementation(mockTranslation);
      renderWithDevice({
        ...defaultProps,
        filter: {
          ...defaultFilter,
          isListDynamic: true,
          list: [{ label: 'React Skills', value: 'react', checked: false }],
        },
      });
      expect(screen.getByText('React Skills')).toBeInTheDocument();
      expect(mockTranslation).not.toHaveBeenCalledWith('React Skills', true);
    });

    it('render_showNoResultsFoundTrue_showsMessageAndHidesCheckboxes', () => {
      jest.spyOn(translationService, 'GetTranslation').mockImplementation((key: string) => {
        if (key === 'alm.text.noResultsFound') return 'No results found';
        return key;
      });
      renderWithDevice({ ...defaultProps, showNoResultsFound: true });
      expect(screen.getByText('No results found')).toBeInTheDocument();
      expect(screen.queryAllByRole('checkbox')).toHaveLength(0);
    });

    it('render_isLoadingSearchedFilterType_showsLoaderAndHidesCheckboxes', () => {
      renderWithDevice({
        ...defaultProps,
        filter: { ...defaultFilter, type: FILTER.SKILL_NAME, isLoading: true },
      });
      expect(screen.getByTestId('alm-loader')).toBeInTheDocument();
      expect(screen.queryAllByRole('checkbox')).toHaveLength(0);
    });
  });

  describe('Checkbox checked state — searchable filters', () => {
    it('render_searchedFilterType_usesFilterListCheckedState', () => {
      jest.spyOn(store, 'getState').mockReturnValue({
        catalog: {
          filterState: {
            showFilterLists: ALL,
            skillName: { react: false }, // store says false
          },
        },
      } as any);
      renderWithDevice({
        ...defaultProps,
        filter: {
          ...defaultFilter,
          canSearch: true,
          type: FILTER.SKILL_NAME,
          isListDynamic: true,
          list: [{ label: 'React', value: 'react', checked: true }], // list says true
        },
      });
      expect(screen.getByRole('checkbox')).toBeChecked(); // list takes precedence
    });

    it('render_nonSearchedFilterType_usesStoreCheckedState', () => {
      jest.spyOn(store, 'getState').mockReturnValue({
        catalog: {
          filterState: {
            showFilterLists: ALL,
            products: { react: true, angular: false },
          },
        },
      } as any);
      renderWithDevice({
        ...defaultProps,
        filter: {
          ...defaultFilter,
          canSearch: true,
          type: 'products',
          isListDynamic: true,
          list: [
            { label: 'React', value: 'react', checked: false }, // list says false
            { label: 'Angular', value: 'angular', checked: false },
          ],
        },
      });
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes[0]).toBeChecked(); // store says true for react
      expect(checkboxes[1]).not.toBeChecked(); // store says false for angular
    });
  });

  describe('Interactions', () => {
    it('updateFilters_onCheckboxClick_calledWithFilterTypeCheckedAndLabel', () => {
      renderWithDevice(defaultProps);
      userEvent.click(screen.getAllByRole('checkbox')[0]); // click unchecked 'course'
      expect(mockUpdateFilters).toHaveBeenCalledTimes(1);
      expect(mockUpdateFilters).toHaveBeenCalledWith({
        filterType: 'loTypes',
        checked: true,
        label: 'alm.catalog.loType.course',
      });
    });

    it('searchFilters_onSearchInputChange_calledWithQueryAndFilterType', () => {
      renderWithDevice({
        ...defaultProps,
        filter: { ...defaultFilter, canSearch: true, type: FILTER.SKILL_NAME },
      });
      userEvent.type(screen.getByRole('searchbox'), 'React');
      expect(mockSearchFilters).toHaveBeenLastCalledWith('React', FILTER.SKILL_NAME);
    });

    it('clearFilterSearch_onClearClick_calledWithFilterType', () => {
      renderWithDevice({
        ...defaultProps,
        filter: { ...defaultFilter, canSearch: true, type: FILTER.SKILL_NAME },
      });
      userEvent.click(screen.getByTestId('search-clear'));
      expect(mockClearFilterSearch).toHaveBeenCalledTimes(1);
      expect(mockClearFilterSearch).toHaveBeenCalledWith(FILTER.SKILL_NAME);
    });
  });

  describe('Search field visibility', () => {
    it('render_canSearchTrue_showsSearchField', () => {
      renderWithDevice({
        ...defaultProps,
        filter: { ...defaultFilter, canSearch: true, type: FILTER.SKILL_NAME },
      });
      // placeholder text is constructed from filter.type; GetTranslation is mocked to return the key
      expect(screen.getByRole('searchbox')).toHaveAttribute(
        'placeholder',
        'alm.catalog.skillName.search.placeholder'
      );
    });

    it('render_canSearchFalse_hidesSearchField', () => {
      renderWithDevice(defaultProps);
      expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
    });
  });

  describe('Visibility by device and store state', () => {
    it('visibility_desktop_showsFiltersRegardlessOfShowFilterLists', () => {
      jest.spyOn(store, 'getState').mockReturnValue({
        catalog: { filterState: { showFilterLists: 'none', loTypes: {} } },
      } as any);
      renderWithDevice(defaultProps, 1200); // desktop: width > 1024
      expect(screen.getAllByRole('checkbox')).toHaveLength(3);
    });

    it('visibility_mobile_showFilterListsAll_showsFilters', () => {
      jest.spyOn(store, 'getState').mockReturnValue({
        catalog: { filterState: { showFilterLists: ALL, loTypes: {} } },
      } as any);
      renderWithDevice(defaultProps, 375); // mobile: width < 450
      expect(screen.getAllByRole('checkbox')).toHaveLength(3);
    });

    it('visibility_mobile_showFilterListsMatchingType_showsFilters', () => {
      jest.spyOn(store, 'getState').mockReturnValue({
        catalog: { filterState: { showFilterLists: 'loTypes', loTypes: {} } },
      } as any);
      renderWithDevice(defaultProps, 375);
      expect(screen.getAllByRole('checkbox')).toHaveLength(3);
    });

    it('visibility_mobile_showFilterListsDifferentType_hidesFilters', () => {
      jest.spyOn(store, 'getState').mockReturnValue({
        catalog: { filterState: { showFilterLists: 'skills', loTypes: {} } },
      } as any);
      renderWithDevice(defaultProps, 375);
      expect(screen.queryAllByRole('checkbox')).toHaveLength(0);
    });
  });
});
