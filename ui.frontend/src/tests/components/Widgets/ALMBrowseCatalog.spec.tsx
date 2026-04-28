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
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ALMBrowseCatalog from '@components/Widgets/ALMBrowseCatalog/ALMBrowseCatalog';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockNavigateToCatalogPage = jest.fn();

jest.mock('@utils/global', () => ({
  getALMObject: jest.fn(() => ({ navigateToCatalogPage: mockNavigateToCatalogPage })),
}));

jest.mock('@utils/themes', () => ({
  GetTileColorFromIndex: jest.fn(() => '#aabbcc'),
}));

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const defaultProps = {
  catalog: { id: 'catalog-123', name: 'JavaScript Fundamentals', imageUrl: 'https://example.com/img.jpg' } as any,
  account: { id: 'account-123' } as any,
  user: { id: 'user-123' } as any,
  index: 2,
  widget: { type: 'catalog_browser', attributes: {} } as any,
};

const renderComponent = (props: any = {}) =>
  render(<ALMBrowseCatalog {...defaultProps} {...props} />);

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ALMBrowseCatalog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const { getALMObject } = require('@utils/global');
    getALMObject.mockReturnValue({ navigateToCatalogPage: mockNavigateToCatalogPage });
    const { GetTileColorFromIndex } = require('@utils/themes');
    GetTileColorFromIndex.mockReturnValue('#aabbcc');
  });

  describe('Catalog Name', () => {
    it('catalogName_renderedAsButtonWithAriaLabelAndAutomationId', () => {
      renderComponent();
      const button = screen.getByRole('button', { name: 'JavaScript Fundamentals' });
      expect(button).toBeInTheDocument();
      expect(button.getAttribute('data-automationid')).toBe('JavaScript Fundamentals');
      expect(screen.getByText('JavaScript Fundamentals')).toBeInTheDocument();
    });
  });

  describe('Background Style', () => {
    it('imageUrl_present_backgroundImageSetAndHasImageClassAdded', () => {
      const { container } = renderComponent();
      const button = container.querySelector('button') as HTMLButtonElement;
      expect(button.style.backgroundImage).toContain('example.com/img.jpg');
      expect(button.className).toContain('hasImage');
    });

    it('imageUrl_absent_backgroundColorSetAndHasImageClassAbsent', () => {
      const { container } = renderComponent({ catalog: { ...defaultProps.catalog, imageUrl: '' } });
      const button = container.querySelector('button') as HTMLButtonElement;
      expect(button.style.backgroundImage).toBe('');
      expect(button.style.backgroundColor).toBe('rgb(170, 187, 204)'); // #aabbcc
      expect(button.className).not.toContain('hasImage');
    });

    it('tileColor_GetTileColorFromIndex_calledWithIndex', () => {
      const { GetTileColorFromIndex } = require('@utils/themes');
      renderComponent({ index: 3 });
      expect(GetTileColorFromIndex).toHaveBeenCalledWith(3);
    });
  });

  describe('Click Handler', () => {
    it('click_callsNavigateToCatalogPageWithCatalogId', () => {
      renderComponent();
      fireEvent.click(screen.getByRole('button', { name: 'JavaScript Fundamentals' }));
      expect(mockNavigateToCatalogPage).toHaveBeenCalledWith({ selectedListableCatalogIds: 'catalog-123' });
    });

    it('click_noNavigation_whenNotClicked', () => {
      renderComponent();
      expect(mockNavigateToCatalogPage).not.toHaveBeenCalled();
    });
  });
});
