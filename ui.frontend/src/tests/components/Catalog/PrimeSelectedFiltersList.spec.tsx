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
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import PrimeSelectedFiltersList from '@components/Catalog/PrimeCatalogFilters/PrimeSelectedFiltersList';

jest.mock('@utils/inline_svg', () => ({
  CLOSE_SVG: () => null,
}));

const mockGetTranslation = jest.fn();
jest.mock('@utils/translationService', () => ({
  GetTranslation: (key: string) => mockGetTranslation(key),
}));

jest.mock('@utils/constants', () => ({
  FILTER: {
    PRICE_RANGE: 'priceRange',
    CATALOGS: 'catalogs',
  },
}));

describe('PrimeSelectedFiltersList', () => {
  const mockUpdateFilters = jest.fn();
  const mockUpdatePriceRangeFilter = jest.fn();

  const makeFilter = (labelToShow: string, filterType: string, extra?: object) => ({
    labelToShow,
    filterType,
    checked: true,
    ...extra,
  });

  const defaultProps = {
    updateFilters: mockUpdateFilters,
    updatePriceRangeFilter: mockUpdatePriceRangeFilter,
    selectedFilters: [
      makeFilter('Course', 'loType'),
      makeFilter('Certification', 'loType'),
      makeFilter('0-30 minutes', 'duration'),
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetTranslation.mockImplementation((key: string) =>
      key === 'alm.text.showMore' ? 'Show More' : 'Show Less'
    );
  });

  describe('filter visibility', () => {
    it('shows all filters and no Show More button when count is 5 or fewer', () => {
      render(<PrimeSelectedFiltersList {...defaultProps} />);

      expect(screen.getByText('Course')).toBeInTheDocument();
      expect(screen.getByText('Certification')).toBeInTheDocument();
      expect(screen.getByText('0-30 minutes')).toBeInTheDocument();
      expect(screen.queryByText('Show More')).toBeNull();
    });

    it('shows only first 5 filters and a Show More button when count exceeds 5', () => {
      const sixFilters = Array.from({ length: 6 }, (_, i) => makeFilter(`Filter ${i + 1}`, 'loType'));
      render(<PrimeSelectedFiltersList {...defaultProps} selectedFilters={sixFilters} />);

      expect(screen.getByText('Filter 5')).toBeInTheDocument();
      expect(screen.queryByText('Filter 6')).toBeNull();
      expect(screen.getByText('Show More')).toBeInTheDocument();
    });

    it('shows all filters and Show Less button after clicking Show More', () => {
      const sixFilters = Array.from({ length: 6 }, (_, i) => makeFilter(`Filter ${i + 1}`, 'loType'));
      render(<PrimeSelectedFiltersList {...defaultProps} selectedFilters={sixFilters} />);

      userEvent.click(screen.getByText('Show More'));

      expect(screen.getByText('Filter 6')).toBeInTheDocument();
      expect(screen.getByText('Show Less')).toBeInTheDocument();
      expect(screen.queryByText('Show More')).toBeNull();
    });

    it('collapses back to 5 filters after clicking Show Less', () => {
      const sixFilters = Array.from({ length: 6 }, (_, i) => makeFilter(`Filter ${i + 1}`, 'loType'));
      render(<PrimeSelectedFiltersList {...defaultProps} selectedFilters={sixFilters} />);

      userEvent.click(screen.getByText('Show More'));
      userEvent.click(screen.getByText('Show Less'));

      expect(screen.getByText('Filter 5')).toBeInTheDocument();
      expect(screen.queryByText('Filter 6')).toBeNull();
      expect(screen.getByText('Show More')).toBeInTheDocument();
    });

    it('renders without crashing when selectedFilters is null', () => {
      const { container } = render(
        <PrimeSelectedFiltersList {...defaultProps} selectedFilters={null} />
      );
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('removeFilter — standard filter', () => {
    it('calls updateFilters with checked:false and does not call updatePriceRangeFilter', () => {
      render(<PrimeSelectedFiltersList {...defaultProps} />);

      userEvent.click(screen.getByRole('button', { name: 'Course' }));

      expect(mockUpdateFilters).toHaveBeenCalledTimes(1);
      expect(mockUpdateFilters).toHaveBeenCalledWith(
        expect.objectContaining({ labelToShow: 'Course', filterType: 'loType', checked: false })
      );
      expect(mockUpdatePriceRangeFilter).not.toHaveBeenCalled();
    });
  });

  describe('removeFilter — price range filter', () => {
    it('calls updatePriceRangeFilter with start/end reset to 0 and does not call updateFilters', () => {
      const priceFilter = makeFilter('$10 - $50', 'priceRange', { data: { start: 10, end: 50 } });
      render(<PrimeSelectedFiltersList {...defaultProps} selectedFilters={[priceFilter]} />);

      userEvent.click(screen.getByRole('button', { name: '$10 - $50' }));

      expect(mockUpdatePriceRangeFilter).toHaveBeenCalledTimes(1);
      const arg = mockUpdatePriceRangeFilter.mock.calls[0][0];
      expect(arg.data.start).toBe(0);
      expect(arg.data.end).toBe(0);
      expect(mockUpdateFilters).not.toHaveBeenCalled();
    });
  });

  describe('removeFilter — catalog filter', () => {
    it('calls updateFilters with data.id as label when catalog has a data.id', () => {
      const catalogFilter = makeFilter('Sales Catalog', 'catalogs', {
        data: { id: 'catalog-123', name: 'Sales Catalog' },
      });
      render(<PrimeSelectedFiltersList {...defaultProps} selectedFilters={[catalogFilter]} />);

      userEvent.click(screen.getByRole('button', { name: 'Sales Catalog' }));

      expect(mockUpdateFilters).toHaveBeenCalledWith({
        filterType: 'catalogs',
        label: 'catalog-123',
        checked: false,
      });
    });

    it('falls through to standard removal when catalog has no data.id', () => {
      const catalogNoId = makeFilter('Sales Catalog', 'catalogs', { data: {} });
      render(<PrimeSelectedFiltersList {...defaultProps} selectedFilters={[catalogNoId]} />);

      userEvent.click(screen.getByRole('button', { name: 'Sales Catalog' }));

      expect(mockUpdateFilters).toHaveBeenCalledWith(
        expect.objectContaining({ checked: false })
      );
    });
  });
});
