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
const mockNavigateToCatalogPage = jest.fn();
const mockHandleLogIn = jest.fn();
const mockNavigateToCustomPage = jest.fn();

jest.mock('react-router-dom', () => ({
  useLocation: () => ({ pathname: '/' }),
}));

jest.mock('@utils/catalog', () => ({
  getSearchOrCatalog: () => 'catalog',
}));

jest.mock('@utils/inline_svg', () => ({
  SEARCH_ICON: () => null,
  CROSS_ICON: () => null,
}));

jest.mock('@utils/global', () => ({
  getALMObject: jest.fn(),
}));

jest.mock('@utils/translationService', () => ({
  GetTranslation: (key: string) => {
    const map: Record<string, string> = {
      'alm.header.companyLogo': 'Company Logo',
      'alm.header.search': 'Search',
      'alm.header.signUp': 'Sign Up',
      'alm.header.clearSearch': 'Clear search',
    };
    return map[key] ?? key;
  },
}));

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import ALMHeader from '@components/Header/ALMHeader';
import { getALMObject } from '@utils/global';

const mockGetALMObject = getALMObject as jest.MockedFunction<typeof getALMObject>;

const accountJson = (attributes: Record<string, any>) =>
  JSON.stringify({ data: { attributes } });

const renderHeader = (attrs: Record<string, any> = {}, children?: React.ReactNode) =>
  render(
    <ALMHeader
      accountJson={accountJson({ logoUrl: 'https://example.com/logo.png', name: 'Test Company', logoStyling: 'LOGO_NAME', ...attrs })}
    >
      {children}
    </ALMHeader>
  );

// Returns the logo section button (type="button", appears before the clear button which only shows with search text)
const getLogoButton = (container: HTMLElement) =>
  container.querySelector('button[type="button"]') as HTMLElement;

describe('ALMHeader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetALMObject.mockReturnValue({
      navigateToCatalogPage: mockNavigateToCatalogPage,
      handleLogIn: mockHandleLogIn,
      navigateToCustomPage: mockNavigateToCustomPage,
    } as any);
  });

  describe('Logo section — logoStyling', () => {
    it('renders both logo image and company name when logoStyling is LOGO_NAME', () => {
      const { container } = renderHeader();
      expect(container.querySelector('img')!.getAttribute('src')).toBe('https://example.com/logo.png');
      expect(screen.getByText('Test Company').tagName.toLowerCase()).toBe('span');
    });

    it('renders logo image only when logoStyling is LOGO', () => {
      const { container } = renderHeader({ logoStyling: 'LOGO' });
      expect(container.querySelector('img')!.getAttribute('src')).toBe('https://example.com/logo.png');
      expect(screen.queryByText('Test Company')).not.toBeInTheDocument();
    });

    it('renders company name only when logoStyling is NAME', () => {
      const { container } = renderHeader({ logoStyling: 'NAME' });
      expect(container.querySelector('img')).toBeNull();
      expect(screen.getByText('Test Company').tagName.toLowerCase()).toBe('span');
    });

    it('defaults to LOGO_NAME behavior when logoStyling is absent', () => {
      const { container } = renderHeader({ logoStyling: undefined });
      expect(container.querySelector('img')).not.toBeNull();
      expect(screen.getByText('Test Company').tagName.toLowerCase()).toBe('span');
    });

    it('omits logo image when logoUrl is empty even with LOGO styling', () => {
      const { container } = renderHeader({ logoUrl: '', logoStyling: 'LOGO' });
      expect(container.querySelector('img')).toBeNull();
    });

    it('omits company name span when name is empty', () => {
      renderHeader({ name: '' });
      expect(screen.queryByText('Test Company')).not.toBeInTheDocument();
    });

    it('uses companyName as logo alt text when name is present', () => {
      const { container } = renderHeader();
      expect(container.querySelector('img')!.getAttribute('alt')).toBe('Test Company');
    });

    it('falls back to translated alt text when companyName is absent', () => {
      const { container } = renderHeader({ name: undefined, logoStyling: 'LOGO' });
      expect(container.querySelector('img')!.getAttribute('alt')).toBe('Company Logo');
    });

    it('calls navigateToCustomPage when logo button is clicked', () => {
      const { container } = renderHeader();
      userEvent.click(getLogoButton(container));
      expect(mockNavigateToCustomPage).toHaveBeenCalledTimes(1);
    });

    it('does not call navigateToCustomPage or any other navigation when it is absent', () => {
      mockGetALMObject.mockReturnValue({ navigateToCatalogPage: mockNavigateToCatalogPage, handleLogIn: mockHandleLogIn } as any);
      const { container } = renderHeader();
      userEvent.click(getLogoButton(container));
      expect(mockNavigateToCatalogPage).not.toHaveBeenCalled();
    });
  });

  describe('Search', () => {
    it('reflects typed text in the input', () => {
      renderHeader();
      const input = screen.getByPlaceholderText('Search') as HTMLInputElement;
      userEvent.type(input, 'React');
      expect(input.value).toBe('React');
    });

    it('calls navigateToCatalogPage with searchText on form submit', () => {
      renderHeader();
      userEvent.type(screen.getByPlaceholderText('Search'), 'JavaScript');
      userEvent.click(screen.getByRole('button', { name: 'Search' }));
      expect(mockNavigateToCatalogPage).toHaveBeenCalledWith({ searchText: 'JavaScript' });
    });

    it('calls navigateToCatalogPage with empty string when submitted with no input', () => {
      renderHeader();
      userEvent.click(screen.getByRole('button', { name: 'Search' }));
      expect(mockNavigateToCatalogPage).toHaveBeenCalledWith({ searchText: '' });
    });

    it('does not call navigateToCatalogPage when it is absent', () => {
      mockGetALMObject.mockReturnValue({ handleLogIn: mockHandleLogIn } as any);
      renderHeader();
      userEvent.click(screen.getByRole('button', { name: 'Search' }));
      expect(mockNavigateToCatalogPage).not.toHaveBeenCalled();
    });
  });

  describe('Clear button', () => {
    it('is hidden when search input is empty', () => {
      renderHeader();
      expect(screen.queryByLabelText('Clear search')).not.toBeInTheDocument();
    });

    it('appears once search input has text', () => {
      renderHeader();
      userEvent.type(screen.getByPlaceholderText('Search'), 'x');
      expect(screen.getByLabelText('Clear search').tagName.toLowerCase()).toBe('button');
    });

    it('clears the input and calls navigateToCatalogPage with no args when clicked', () => {
      renderHeader();
      const input = screen.getByPlaceholderText('Search') as HTMLInputElement;
      userEvent.type(input, 'something');
      userEvent.click(screen.getByLabelText('Clear search'));
      expect(input.value).toBe('');
      expect(mockNavigateToCatalogPage).toHaveBeenCalledWith();
    });

    it('disappears after clearing', () => {
      renderHeader();
      userEvent.type(screen.getByPlaceholderText('Search'), 'something');
      userEvent.click(screen.getByLabelText('Clear search'));
      expect(screen.queryByLabelText('Clear search')).not.toBeInTheDocument();
    });

    it('still clears input text when navigateToCatalogPage is absent', () => {
      mockGetALMObject.mockReturnValue({ handleLogIn: mockHandleLogIn } as any);
      renderHeader();
      const input = screen.getByPlaceholderText('Search') as HTMLInputElement;
      userEvent.type(input, 'test');
      userEvent.click(screen.getByLabelText('Clear search'));
      expect(input.value).toBe('');
    });
  });

  describe('Sign-up button', () => {
    it('is always rendered', () => {
      renderHeader();
      expect(screen.getByText('Sign Up').tagName.toLowerCase()).toBe('button');
    });

    it('calls handleLogIn when clicked', () => {
      renderHeader();
      userEvent.click(screen.getByText('Sign Up'));
      expect(mockHandleLogIn).toHaveBeenCalledTimes(1);
    });
  });

  describe('Children / nav section', () => {
    it('renders children when provided', () => {
      renderHeader({}, <span data-testid="child">Nav item</span>);
      expect(screen.getByTestId('child').textContent).toBe('Nav item');
    });

    it('renders no children content when none are provided', () => {
      renderHeader();
      expect(screen.queryByTestId('child')).not.toBeInTheDocument();
    });
  });

  describe('JSON parsing', () => {
    it('throws when accountJson is invalid JSON', () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
      expect(() => render(<ALMHeader accountJson="not-json" />)).toThrow();
      (console.error as jest.Mock).mockRestore();
    });

    it('reflects updated account data when accountJson prop changes', () => {
      const { rerender } = renderHeader({ name: 'Old Company', logoStyling: 'NAME' });
      expect(screen.getByText('Old Company').tagName.toLowerCase()).toBe('span');
      rerender(<ALMHeader accountJson={accountJson({ name: 'New Company', logoStyling: 'NAME' })} />);
      expect(screen.queryByText('Old Company')).not.toBeInTheDocument();
      expect(screen.getByText('New Company').tagName.toLowerCase()).toBe('span');
    });
  });
});
