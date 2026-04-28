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
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router-dom';
import ALMNavigationBar from '@components/NavigationBar/ALMNavigationBar';

// Mock dependencies
jest.mock('@utils/constants', () => ({
  HOME: 'home',
  CATALOG: 'catalog',
}));

const mockGetRegistrationsURLs = jest.fn();
jest.mock('@utils/global', () => ({
  getRegistrationsURLs: (config: any, domain: any) => mockGetRegistrationsURLs(config, domain),
}));

jest.mock('@utils/translationService', () => ({
  GetTranslation: (key: string) => {
    const translations: { [key: string]: string } = {
      'alm.text.catalog': 'Catalog',
    };
    return translations[key] || key;
  },
}));

// Mock Spectrum icons
jest.mock('@spectrum-icons/workflow/ShowMenu', () => {
  return function ShowMenu() {
    return <svg data-testid="show-menu-icon">ShowMenu</svg>;
  };
});

jest.mock('@spectrum-icons/workflow/Close', () => {
  return function Close() {
    return <svg data-testid="close-icon">Close</svg>;
  };
});

describe('ALMNavigationBar', () => {
  const defaultMessages = {
    'alm.text.home': 'Home',
    'alm.text.signUp': 'Sign Up',
    'alm.text.signIn': 'Sign In',
  };

  const defaultAccountJson = {
    accountData: JSON.stringify({
      data: {
        attributes: {
          name: 'Test Company',
          logoUrl: 'https://example.com/logo.png',
          logoStyling: 'LOGO_NAME',
        },
      },
    }),
    accountConfig: { config: 'test' },
    almDomain: 'https://example.learningmanager.adobe.com',
  };

  const defaultProps = {
    accountJson: defaultAccountJson,
    homeLink: '/home',
    catalogLink: '/catalog',
  };

  const renderWithProviders = (component: React.ReactElement, { route = '/' } = {}) => {
    return render(
      <MemoryRouter initialEntries={[route]}>
        <IntlProvider locale="en" messages={defaultMessages}>
          {component}
        </IntlProvider>
      </MemoryRouter>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockGetRegistrationsURLs.mockReturnValue({
      signUpURL: 'https://example.com/signup',
      signInURL: 'https://example.com/signin',
    });

    // Mock getElementById for active tab functionality
    Object.defineProperty(document, 'getElementById', {
      writable: true,
      value: jest.fn((id: string) => {
        const element = document.createElement('div');
        element.id = id;
        element.style.borderBottom = 'none';
        return element;
      }),
    });
  });

  describe('Logo Styling', () => {
    it('should show logo when logoStyling contains LOGO', () => {
      renderWithProviders(<ALMNavigationBar {...defaultProps} />);

      const logo = screen.getByAltText('https://example.com/logo.png');
      expect(logo.getAttribute('src')).toBe('https://example.com/logo.png');
    });

    it('should show company name when logoStyling contains NAME', () => {
      renderWithProviders(<ALMNavigationBar {...defaultProps} />);

      expect(screen.getByText('Test Company')).toHaveTextContent('Test Company');
    });

    it('should hide logo when logoStyling does not contain LOGO', () => {
      const propsWithoutLogo = {
        ...defaultProps,
        accountJson: {
          ...defaultAccountJson,
          accountData: JSON.stringify({
            data: {
              attributes: {
                name: 'Test Company',
                logoUrl: 'https://example.com/logo.png',
                logoStyling: 'NAME',
              },
            },
          }),
        },
      };

      const { container } = renderWithProviders(<ALMNavigationBar {...propsWithoutLogo} />);

      expect(container.querySelector('.companyLogo')).toBeNull();
    });

    it('should hide company name when logoStyling does not contain NAME', () => {
      const propsWithoutName = {
        ...defaultProps,
        accountJson: {
          ...defaultAccountJson,
          accountData: JSON.stringify({
            data: {
              attributes: {
                name: 'Test Company',
                logoUrl: 'https://example.com/logo.png',
                logoStyling: 'LOGO',
              },
            },
          }),
        },
      };

      renderWithProviders(<ALMNavigationBar {...propsWithoutName} />);

      expect(screen.queryByText('Test Company')).toBeNull();
    });

    it('should default to showing both logo and name when logoStyling is missing', () => {
      const propsWithoutStyling = {
        ...defaultProps,
        accountJson: {
          ...defaultAccountJson,
          accountData: JSON.stringify({
            data: {
              attributes: {
                name: 'Test Company',
                logoUrl: 'https://example.com/logo.png',
              },
            },
          }),
        },
      };

      renderWithProviders(<ALMNavigationBar {...propsWithoutStyling} />);

      expect(screen.getByText('Test Company')).toHaveTextContent('Test Company');
      expect(screen.getByAltText('https://example.com/logo.png').getAttribute('src')).toBe('https://example.com/logo.png');
    });
  });

  describe('Navigation Links', () => {
    it('should have correct href for home link', () => {
      const { container } = renderWithProviders(<ALMNavigationBar {...defaultProps} />);

      const homeLink = container.querySelector('#home');
      expect(homeLink?.getAttribute('href')).toBe('/home');
    });

    it('should have correct href for catalog link', () => {
      const { container } = renderWithProviders(<ALMNavigationBar {...defaultProps} />);

      const catalogLink = container.querySelector('#catalog');
      expect(catalogLink?.getAttribute('href')).toBe('/catalog');
    });

    it('should have correct href for sign up button', () => {
      const { container } = renderWithProviders(<ALMNavigationBar {...defaultProps} />);

      const signUpButtons = container.querySelectorAll('.signUpButton');
      expect(signUpButtons[0]?.getAttribute('href')).toBe('https://example.com/signup');
    });

    it('should have correct href for sign in button', () => {
      const { container } = renderWithProviders(<ALMNavigationBar {...defaultProps} />);

      const signInButtons = container.querySelectorAll('.signInButton');
      expect(signInButtons[0]?.getAttribute('href')).toBe('https://example.com/signin');
    });
  });

  describe('Registration URLs', () => {
    it('should call getRegistrationsURLs with correct parameters', () => {
      renderWithProviders(<ALMNavigationBar {...defaultProps} />);

      expect(mockGetRegistrationsURLs).toHaveBeenCalledWith(
        { config: 'test' },
        'https://example.learningmanager.adobe.com'
      );
    });

    it('should use registration URLs from getRegistrationsURLs', () => {
      mockGetRegistrationsURLs.mockReturnValue({
        signUpURL: 'https://custom.com/signup',
        signInURL: 'https://custom.com/signin',
      });

      const { container } = renderWithProviders(<ALMNavigationBar {...defaultProps} />);

      const signUpButtons = container.querySelectorAll('.signUpButton');
      const signInButtons = container.querySelectorAll('.signInButton');

      expect(signUpButtons[0]?.getAttribute('href')).toBe('https://custom.com/signup');
      expect(signInButtons[0]?.getAttribute('href')).toBe('https://custom.com/signin');
    });
  });

  describe('Mobile Menu', () => {
    it('should initially hide mobile menu', () => {
      const { container } = renderWithProviders(<ALMNavigationBar {...defaultProps} />);

      expect(container.querySelector('.mobileMenu')).toBeNull();
    });

    it('should toggle mobile menu on icon click', () => {
      const { container } = renderWithProviders(<ALMNavigationBar {...defaultProps} />);

      const menuIcon = container.querySelector('.mobileMenuIcon');
      expect(menuIcon?.tagName).toBe('DIV');

      fireEvent.click(menuIcon!);

      expect(container.querySelector('.mobileMenu')?.tagName).toBe('DIV');
    });

    it('should close mobile menu on close button click', () => {
      const { container } = renderWithProviders(<ALMNavigationBar {...defaultProps} />);

      const menuIcon = container.querySelector('.mobileMenuIcon');
      fireEvent.click(menuIcon!);

      expect(container.querySelector('.mobileMenu')?.tagName).toBe('DIV');

      const closeButton = container.querySelector('.closeMenuButton');
      fireEvent.click(closeButton!);

      expect(container.querySelector('.mobileMenu')).toBeNull();
    });

    it('should close mobile menu on menu option click', () => {
      const { container } = renderWithProviders(<ALMNavigationBar {...defaultProps} />);

      const menuIcon = container.querySelector('.mobileMenuIcon');
      fireEvent.click(menuIcon!);

      const mobileMenuOptions = container.querySelectorAll('.mobileMenuOption');
      fireEvent.click(mobileMenuOptions[0]);

      expect(container.querySelector('.mobileMenu')).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing logoUrl', () => {
      const propsWithoutLogo = {
        ...defaultProps,
        accountJson: {
          ...defaultAccountJson,
          accountData: JSON.stringify({
            data: {
              attributes: {
                name: 'Test Company',
                logoUrl: '',
              },
            },
          }),
        },
      };

      const { container } = renderWithProviders(<ALMNavigationBar {...propsWithoutLogo} />);

      const logo = container.querySelector('.companyLogo');
      expect(logo?.getAttribute('src')).toBe('');
    });

    it('should handle missing company name', () => {
      const propsWithoutName = {
        ...defaultProps,
        accountJson: {
          ...defaultAccountJson,
          accountData: JSON.stringify({
            data: {
              attributes: {
                name: '',
                logoUrl: 'https://example.com/logo.png',
              },
            },
          }),
        },
      };

      const { container } = renderWithProviders(<ALMNavigationBar {...propsWithoutName} />);

      const companyName = container.querySelector('.companyName');
      expect(companyName?.textContent).toBe('');
    });

    it('should handle undefined account attributes', () => {
      const propsWithoutAttributes = {
        ...defaultProps,
        accountJson: {
          ...defaultAccountJson,
          accountData: JSON.stringify({
            data: {
              attributes: {},
            },
          }),
        },
      };

      const { container } = renderWithProviders(<ALMNavigationBar {...propsWithoutAttributes} />);

      // Component should still render even with empty attributes
      expect(container.querySelector('.navbar')?.tagName).toBe('DIV');
    });
  });
});
