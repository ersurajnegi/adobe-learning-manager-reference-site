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

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/extend-expect';
import PrimeSelectedFiltersList from '@components/Catalog/PrimeCatalogFilters/PrimeSelectedFiltersList';
import { withProviders } from '../../common/hoc';
import * as translationService from '@utils/translationService';
import { FILTER } from '@utils/constants';

jest.mock('@utils/translationService', () => ({
  GetTranslation: jest.fn((key: string) => key),
}));

jest.mock('@utils/inline_svg', () => ({
  CLOSE_SVG: () => null,
}));

const SHOW_MORE = 'alm.text.showMore';
const SHOW_LESS = 'alm.text.showLess';

function makeFilter(overrides: any = {}) {
  return { labelToShow: 'Course', filterType: 'loTypes', checked: true, ...overrides };
}

function makeProps(overrides: any = {}) {
  return {
    updateFilters: jest.fn(),
    updatePriceRangeFilter: jest.fn(),
    selectedFilters: [],
    ...overrides,
  };
}

function renderComponent(props: any) {
  return render(withProviders(PrimeSelectedFiltersList, props));
}

// Remove buttons have aria-label; show more/less button has text only.
// queryAllByRole (no name option) avoids window.getComputedStyle issues in jsdom.
function getRemoveButtons() {
  return screen.queryAllByRole('button').filter(b => b.getAttribute('aria-label') !== null);
}

describe('PrimeSelectedFiltersList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (translationService.GetTranslation as jest.Mock).mockImplementation((key: string) => key);
  });

  describe('Rendering', () => {
    it('render_nullSelectedFilters_rendersNoChipsAndNoToggle', () => {
      renderComponent(makeProps({ selectedFilters: null }));
      expect(screen.queryAllByRole('button')).toHaveLength(0);
    });

    it('render_emptySelectedFilters_rendersNoChipsAndNoToggle', () => {
      renderComponent(makeProps({ selectedFilters: [] }));
      expect(screen.queryAllByRole('button')).toHaveLength(0);
    });

    it('render_fiveOrFewerFilters_showsAllChipsWithNoToggleButton', () => {
      const selectedFilters = [
        makeFilter({ labelToShow: 'Course' }),
        makeFilter({ labelToShow: 'Beginner' }),
        makeFilter({ labelToShow: 'Technology' }),
      ];
      renderComponent(makeProps({ selectedFilters }));
      expect(getRemoveButtons()).toHaveLength(3);
      expect(screen.queryByText(SHOW_MORE)).toBeNull();
    });

    it('render_moreThanFiveFilters_showsOnlyFiveChipsAndShowMoreButton', () => {
      const labels = ['Course', 'Program', 'Beginner', 'Intermediate', 'Technology', 'Business', 'Design', 'Marketing'];
      const selectedFilters = labels.map(label => makeFilter({ labelToShow: label }));
      renderComponent(makeProps({ selectedFilters }));
      expect(getRemoveButtons()).toHaveLength(5);
      expect(screen.getByText(SHOW_MORE).tagName.toLowerCase()).toBe('button');
    });
  });

  describe('Show More / Show Less toggle', () => {
    const labels8 = ['Course', 'Program', 'Beginner', 'Intermediate', 'Technology', 'Business', 'Design', 'Marketing'];

    it('toggleShowAll_clickShowMore_showsAllChipsAndButtonBecomesShowLess', () => {
      const selectedFilters = labels8.map(label => makeFilter({ labelToShow: label }));
      renderComponent(makeProps({ selectedFilters }));
      const toggleBtn = screen.getByText(SHOW_MORE);
      userEvent.click(toggleBtn);
      expect(getRemoveButtons()).toHaveLength(8);
      expect(toggleBtn.textContent).toBe(SHOW_LESS);
    });

    it('toggleShowAll_clickShowLess_collapsesBackToFiveChips', () => {
      const selectedFilters = labels8.map(label => makeFilter({ labelToShow: label }));
      renderComponent(makeProps({ selectedFilters }));
      const toggleBtn = screen.getByText(SHOW_MORE);
      userEvent.click(toggleBtn); // expand
      userEvent.click(toggleBtn); // collapse (same DOM node, text updated by React)
      expect(getRemoveButtons()).toHaveLength(5);
      expect(toggleBtn.textContent).toBe(SHOW_MORE);
    });
  });

  describe('Remove filter', () => {
    it('removeFilter_standardFilter_setsCheckedFalseAndCallsUpdateFilters', () => {
      const updateFilters = jest.fn();
      const updatePriceRangeFilter = jest.fn();
      const filter = makeFilter({ labelToShow: 'Course', filterType: 'loTypes', checked: true });
      renderComponent(makeProps({ selectedFilters: [filter], updateFilters, updatePriceRangeFilter }));
      userEvent.click(getRemoveButtons()[0]);
      expect(updateFilters).toHaveBeenCalledTimes(1);
      expect(updateFilters).toHaveBeenCalledWith(
        expect.objectContaining({ filterType: 'loTypes', checked: false })
      );
      expect(updatePriceRangeFilter).not.toHaveBeenCalled();
    });

    it('removeFilter_priceRangeFilter_resetsRangeToZeroAndCallsUpdatePriceRangeFilter', () => {
      const updateFilters = jest.fn();
      const updatePriceRangeFilter = jest.fn();
      const filter = {
        labelToShow: '$100 - $500',
        filterType: FILTER.PRICE_RANGE,
        data: { start: 100, end: 500 },
      };
      renderComponent(makeProps({ selectedFilters: [filter], updateFilters, updatePriceRangeFilter }));
      userEvent.click(getRemoveButtons()[0]);
      expect(updatePriceRangeFilter).toHaveBeenCalledTimes(1);
      expect(updatePriceRangeFilter).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ start: 0, end: 0 }) })
      );
      expect(updateFilters).not.toHaveBeenCalled();
    });

    it('removeFilter_catalogFilterWithDataId_callsUpdateFiltersWithIdAsLabel', () => {
      const updateFilters = jest.fn();
      const filter = {
        labelToShow: 'Technology Catalog',
        filterType: FILTER.CATALOGS,
        checked: true,
        data: { id: 'tech-123' },
      };
      renderComponent(makeProps({ selectedFilters: [filter], updateFilters }));
      userEvent.click(getRemoveButtons()[0]);
      expect(updateFilters).toHaveBeenCalledWith({
        filterType: FILTER.CATALOGS,
        label: 'tech-123',
        checked: false,
      });
    });

    it('removeFilter_catalogFilterWithoutDataId_fallsThroughToStandardRemoval', () => {
      const updateFilters = jest.fn();
      const filter = {
        labelToShow: 'Some Catalog',
        filterType: FILTER.CATALOGS,
        checked: true,
        data: {}, // no id — falls through to else branch
      };
      renderComponent(makeProps({ selectedFilters: [filter], updateFilters }));
      userEvent.click(getRemoveButtons()[0]);
      // Should use the standard payload (labelToShow, not label) — distinct from the id-based path
      expect(updateFilters).toHaveBeenCalledWith(
        expect.objectContaining({ labelToShow: 'Some Catalog', filterType: FILTER.CATALOGS, checked: false })
      );
    });
  });
});
