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
const mockNavigateToCustomPage = jest.fn();
const mockGetALMObject = jest.fn();
const mockGetTranslation = jest.fn();
const mockGetIconByName = jest.fn();
const mockObserve = jest.fn();
const mockDisconnect = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: jest.fn(),
}));

jest.mock('@utils/global', () => ({
  getALMObject: () => mockGetALMObject(),
}));

jest.mock('@utils/translationService', () => ({
  GetTranslation: (key: string) => mockGetTranslation(key),
}));

jest.mock('@utils/template_icons_svg', () => ({
  getIconByName: (name: string, isSelected: boolean) => mockGetIconByName(name, isSelected),
}));

jest.mock('@utils/inline_svg', () => ({
  MORE_ICON: () => <svg data-testid="more-icon" />,
  CHEVRON_DOWN_ICON: () => <svg data-testid="chevron-down" />,
}));

(global as any).ResizeObserver = class ResizeObserver {
  observe = mockObserve;
  unobserve = jest.fn();
  disconnect = mockDisconnect;
};

import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import ALMNavMenu, { ALMNavMenuItem } from '@components/NavMenu/ALMNavMenu';
import { useLocation } from 'react-router-dom';

const mockUseLocation = useLocation as jest.MockedFunction<typeof useLocation>;

// Home has automationId and no iconName (tests navigation without icon).
// Catalog has /catalog route (tests catalog navigation + active-via-sub-path).
// Custom Page has pageId (tests custom page navigation + pageId active state).
// Menu is a submenu with two sub items — one catalog route and one pageId — covering all sub item branches.
const mockMenuItems: ALMNavMenuItem[] = [
  { id: 'home', label: 'Home', route: '/home', automationId: 'home-nav' },
  { id: 'catalog', label: 'Catalog', route: '/catalog' },
  { id: 'custom', label: 'Custom Page', pageId: 'page123' },
  {
    id: 'menu',
    label: 'Menu',
    isSubmenu: true,
    iconName: 'menu',
    subItems: [
      { id: 'sub-catalog', label: 'Sub Catalog', route: '/catalog', iconName: 'sub' },
      { id: 'sub-page', label: 'Sub Page', pageId: 'page:456' },
    ],
  },
];

const mockLocation = { pathname: '/home', search: '', hash: '', state: null };

const renderNav = (props: Partial<React.ComponentProps<typeof ALMNavMenu>> = {}) =>
  render(
    <BrowserRouter>
      <ALMNavMenu menuItems={mockMenuItems} {...props} />
    </BrowserRouter>
  );

describe('ALMNavMenu', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLocation.mockReturnValue(mockLocation as any);
    mockGetTranslation.mockImplementation((key: string) => key);
    mockGetIconByName.mockReturnValue('<svg></svg>');
    mockGetALMObject.mockReturnValue({
      navigateToCatalogPage: mockNavigateToCatalogPage,
      navigateToCustomPage: mockNavigateToCustomPage,
    });
  });

  describe('Rendering and layout', () => {
    it('renders a nav element with aria-label from the translation key', () => {
      renderNav();
      expect(screen.getByRole('navigation').getAttribute('aria-label')).toBe('alm.navmenu.navigation');
    });

    it('applies insideHeader CSS class by default', () => {
      const { container } = renderNav();
      expect(container.querySelector('nav')!.className).toContain('insideHeader');
    });

    it('applies belowHeader CSS class when layout prop is belowHeader', () => {
      const { container } = renderNav({ layout: 'belowHeader' });
      expect(container.querySelector('nav')!.className).toContain('belowHeader');
    });

    it('appends a custom className to the nav element', () => {
      const { container } = renderNav({ className: 'my-custom-nav' });
      expect(container.querySelector('nav')!.className).toContain('my-custom-nav');
    });
  });

  describe('Navigation', () => {
    it('calls navigateToCatalogPage when a /catalog route item is clicked', () => {
      renderNav();
      userEvent.click(screen.getByText('Catalog'));
      expect(mockNavigateToCatalogPage).toHaveBeenCalledTimes(1);
    });

    it('calls navigateToCustomPage with the correct pageId when a page item is clicked', () => {
      renderNav();
      userEvent.click(screen.getByText('Custom Page'));
      expect(mockNavigateToCustomPage).toHaveBeenCalledWith('page123');
    });

    it('does not call any navigation handler when almObject is null', () => {
      mockGetALMObject.mockReturnValue(null);
      renderNav();
      userEvent.click(screen.getByText('Catalog'));
      expect(mockNavigateToCatalogPage).not.toHaveBeenCalled();
    });

    it('does not call any navigation handler for a non-catalog route-only item', () => {
      renderNav();
      userEvent.click(screen.getByText('Home'));
      expect(mockNavigateToCatalogPage).not.toHaveBeenCalled();
      expect(mockNavigateToCustomPage).not.toHaveBeenCalled();
    });

    it('does not navigate when clicking the submenu parent button', () => {
      renderNav();
      userEvent.click(screen.getByText('Menu'));
      expect(mockNavigateToCatalogPage).not.toHaveBeenCalled();
      expect(mockNavigateToCustomPage).not.toHaveBeenCalled();
    });
  });

  describe('Active state — isItemActive', () => {
    it('marks item active and adds aria-current="page" when route exactly matches pathname', () => {
      renderNav();
      const homeButton = screen.getByText('Home').closest('button')!;
      expect(homeButton.className).toContain('navItemSelected');
      expect(homeButton.getAttribute('aria-current')).toBe('page');
    });

    it('does not mark an item active when its route does not match the current pathname', () => {
      renderNav();
      expect(screen.getByText('Catalog').closest('button')!.className).not.toContain('navItemSelected');
    });

    it('marks an item active when the pathname contains the page/<id> segment derived from pageId', () => {
      mockUseLocation.mockReturnValue({ ...mockLocation, pathname: '/page/123' } as any);
      renderNav();
      expect(screen.getByText('Custom Page').closest('button')!.className).toContain('navItemSelected');
    });

    it('does not mark a pageId item active when the path format is incorrect', () => {
      mockUseLocation.mockReturnValue({ ...mockLocation, pathname: '/pages/123' } as any);
      renderNav();
      expect(screen.getByText('Custom Page').closest('button')!.className).not.toContain('navItemSelected');
    });

    it('marks the catalog item active when the pathname is a catalog sub-path', () => {
      mockUseLocation.mockReturnValue({ ...mockLocation, pathname: '/catalog/filters' } as any);
      renderNav();
      expect(screen.getByText('Catalog').closest('button')!.className).toContain('navItemSelected');
    });

    it('marks the submenu parent active when a subItem route matches the pathname', () => {
      mockUseLocation.mockReturnValue({ ...mockLocation, pathname: '/catalog' } as any);
      renderNav();
      expect(screen.getByText('Menu').closest('button')!.className).toContain('navItemSelected');
    });

    it('marks the submenu parent active when a subItem pageId path matches the pathname', () => {
      mockUseLocation.mockReturnValue({ ...mockLocation, pathname: '/page/456' } as any);
      renderNav();
      expect(screen.getByText('Menu').closest('button')!.className).toContain('navItemSelected');
    });
  });

  describe('Submenu — show and hide', () => {
    it('renders chevron icon and aria-haspopup="menu" on the submenu trigger button', () => {
      renderNav();
      const menuButton = screen.getByText('Menu').closest('button')!;
      expect(menuButton.getAttribute('aria-haspopup')).toBe('menu');
      expect(menuButton.querySelector('[data-testid="chevron-down"]')).not.toBeNull();
    });

    it('sets aria-expanded=false on the submenu trigger before any interaction', () => {
      renderNav();
      expect(screen.getByText('Menu').closest('button')!.getAttribute('aria-expanded')).toBe('false');
    });

    it('shows all sub items and sets aria-expanded=true when the parent li receives mouseEnter', () => {
      renderNav();
      fireEvent.mouseEnter(screen.getByText('Menu').closest('li')!);
      expect(screen.getByText('Sub Catalog').tagName).toBe('SPAN');
      expect(screen.getByText('Sub Page').tagName).toBe('SPAN');
      expect(screen.getByText('Menu').closest('button')!.getAttribute('aria-expanded')).toBe('true');
    });

    it('hides sub items and resets aria-expanded=false when the parent li receives mouseLeave', () => {
      renderNav();
      const menuLi = screen.getByText('Menu').closest('li')!;
      fireEvent.mouseEnter(menuLi);
      fireEvent.mouseLeave(menuLi);
      expect(screen.queryByText('Sub Catalog')).toBeNull();
      expect(screen.getByText('Menu').closest('button')!.getAttribute('aria-expanded')).toBe('false');
    });

    it('does not show submenu dropdown or aria-haspopup when isSubmenu=true but subItems is empty', () => {
      const items: ALMNavMenuItem[] = [{ id: 'x', label: 'Empty Menu', isSubmenu: true, subItems: [] }];
      render(<BrowserRouter><ALMNavMenu menuItems={items} /></BrowserRouter>);
      expect(screen.getByText('Empty Menu').closest('button')!.getAttribute('aria-haspopup')).toBeNull();
    });
  });

  describe('Submenu — sub item navigation', () => {
    it('calls navigateToCatalogPage when a sub item with /catalog route is clicked', () => {
      renderNav();
      fireEvent.mouseEnter(screen.getByText('Menu').closest('li')!);
      userEvent.click(screen.getByText('Sub Catalog'));
      expect(mockNavigateToCatalogPage).toHaveBeenCalledTimes(1);
    });

    it('calls navigateToCustomPage with the sub item pageId when a sub page item is clicked', () => {
      renderNav();
      fireEvent.mouseEnter(screen.getByText('Menu').closest('li')!);
      userEvent.click(screen.getByText('Sub Page'));
      expect(mockNavigateToCustomPage).toHaveBeenCalledWith('page:456');
    });

    it('closes the submenu after clicking a sub item', () => {
      renderNav();
      fireEvent.mouseEnter(screen.getByText('Menu').closest('li')!);
      userEvent.click(screen.getByText('Sub Page'));
      expect(screen.queryByText('Sub Page')).toBeNull();
    });
  });

  describe('Submenu — sub item active state', () => {
    it('applies dropdownItemSelected to a subItem whose route matches the pathname', () => {
      mockUseLocation.mockReturnValue({ ...mockLocation, pathname: '/catalog' } as any);
      renderNav();
      fireEvent.mouseEnter(screen.getByText('Menu').closest('li')!);
      expect(screen.getByText('Sub Catalog').closest('button')!.className).toContain('dropdownItemSelected');
    });

    // NOTE: isItemActive called directly on a pageId subItem uses replace(PAGE, '') which strips
    // only 'page' from 'page:456', producing ':456'. This does not match '/page/456'.
    // The parent's navItemSelected correctly uses the inner subItems.some() branch.
    // As a result dropdownItemSelected is never applied to pageId-based sub items.

    it('does not apply dropdownItemSelected when no sub item matches the pathname', () => {
      renderNav();
      fireEvent.mouseEnter(screen.getByText('Menu').closest('li')!);
      expect(screen.getByText('Sub Catalog').closest('button')!.className).not.toContain('dropdownItemSelected');
      expect(screen.getByText('Sub Page').closest('button')!.className).not.toContain('dropdownItemSelected');
    });
  });

  describe('Icon rendering', () => {
    it('calls getIconByName when showIcons=true and an item has an iconName', () => {
      renderNav({ showIcons: true });
      expect(mockGetIconByName).toHaveBeenCalledWith('menu', false);
    });

    it('does not call getIconByName when showIcons=false', () => {
      renderNav({ showIcons: false });
      expect(mockGetIconByName).not.toHaveBeenCalled();
    });

    it('does not call getIconByName for items without an iconName even when showIcons=true', () => {
      const items: ALMNavMenuItem[] = [{ id: 'x', label: 'No Icon', route: '/home' }];
      render(<BrowserRouter><ALMNavMenu menuItems={items} showIcons={true} /></BrowserRouter>);
      expect(mockGetIconByName).not.toHaveBeenCalled();
    });

    it('calls getIconByName with isSelected=true for an active sub item when the submenu is open', () => {
      mockUseLocation.mockReturnValue({ ...mockLocation, pathname: '/catalog' } as any);
      renderNav({ showIcons: true });
      fireEvent.mouseEnter(screen.getByText('Menu').closest('li')!);
      expect(mockGetIconByName).toHaveBeenCalledWith('sub', true);
    });
  });

  describe('Accessibility', () => {
    it('applies data-automation-id from the automationId prop', () => {
      renderNav();
      expect(screen.getByText('Home').closest('button')!.getAttribute('data-automation-id')).toBe('home-nav');
    });

    it('does not set data-automation-id when automationId is not provided', () => {
      renderNav();
      expect(screen.getByText('Catalog').closest('button')!.getAttribute('data-automation-id')).toBeNull();
    });
  });

  describe('Cleanup', () => {
    it('disconnects the ResizeObserver when the component unmounts', () => {
      const { unmount } = renderNav();
      unmount();
      expect(mockDisconnect).toHaveBeenCalled();
    });

    it('registers a mousedown listener on the document for outside-click detection', () => {
      const addSpy = jest.spyOn(EventTarget.prototype, 'addEventListener');
      renderNav();
      expect(addSpy).toHaveBeenCalledWith('mousedown', expect.any(Function));
      addSpy.mockRestore();
    });
  });
});
