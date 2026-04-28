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
/**
 * Unit Tests for ALMSidebar Component
 * 
 * Component handles:
 * - Sidebar navigation with menu items
 * - Submenu flyout on hover
 * - Active state tracking based on routes
 * - Navigation to custom pages and catalog
 * 
 * Testing Strategy:
 * - Focused tests for user interactions
 * - Navigation API call verification
 * - Submenu hover behavior and state transitions
 * - Active state detection based on routes
 * - Error handling when navigation methods are unavailable
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { waitFor } from '@testing-library/dom';
import ALMSidebar, { ALMSidebarMenuItem } from '../../../almLib/components/Sidebar/ALMSidebar';

// Mock dependencies
const mockUseLocation = jest.fn();
const mockGetALMObject = jest.fn();
const mockGetIconByName = jest.fn();
const mockGetTranslation = jest.fn();

jest.mock('react-router-dom', () => ({
  useLocation: () => mockUseLocation(),
}));

jest.mock('../../../almLib/utils/global', () => ({
  getALMObject: () => mockGetALMObject(),
}));

jest.mock('../../../almLib/utils/template_icons_svg', () => ({
  getIconByName: (...args: any[]) => mockGetIconByName(...args),
}));

jest.mock('../../../almLib/utils/translationService', () => ({
  GetTranslation: (...args: any[]) => mockGetTranslation(...args),
}));

jest.mock('../../../almLib/utils/inline_svg', () => ({
  CHEVRON_RIGHT_ICON: () => require('react').createElement('svg', { 'data-testid': 'chevron-right' }),
}));

describe('ALMSidebar', () => {
  const mockNavigateToCustomPage = jest.fn();
  const mockNavigateToCatalogPage = jest.fn();

  const mockMenuItems: ALMSidebarMenuItem[] = [
    {
      id: 'home',
      label: 'Home',
      route: '/home',
      iconName: 'home-icon',
      automationId: 'home-menu',
    },
    {
      id: 'catalog',
      label: 'Catalog',
      route: '/catalog',
      iconName: 'catalog-icon',
      automationId: 'catalog-menu',
    },
    {
      id: 'learning',
      label: 'Learning',
      route: '/learning',
      iconName: 'learning-icon',
      isSubmenu: true,
      subItems: [
        {
          id: 'courses',
          label: 'Courses',
          route: '/learning/courses',
          iconName: 'course-icon',
        },
        {
          id: 'paths',
          label: 'Learning Paths',
          route: '/learning/paths',
          iconName: 'path-icon',
        },
      ],
    },
    {
      id: 'custom',
      label: 'Custom Page',
      pageId: 'custom-page-123',
      iconName: 'custom-icon',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseLocation.mockReturnValue({
      pathname: '/home',
    });

    mockGetALMObject.mockReturnValue({
      navigateToCustomPage: mockNavigateToCustomPage,
      navigateToCatalogPage: mockNavigateToCatalogPage,
    });

    mockGetIconByName.mockImplementation((iconName: string, isSelected: boolean) => {
      return `<svg data-icon="${iconName}" data-selected="${isSelected}"></svg>`;
    });

    mockGetTranslation.mockImplementation((key: string) => {
      if (key === 'alm.sidebar.navigation') return 'Sidebar Navigation';
      return key;
    });
  });

  describe('Navigation API Calls', () => {
    it('should call navigateToCustomPage with correct pageId when custom page item is clicked', () => {
      render(<ALMSidebar menuItems={mockMenuItems} />);

      const customButton = screen.getByRole('button', { name: 'Custom Page' });
      fireEvent.click(customButton);

      expect(mockNavigateToCustomPage).toHaveBeenCalledTimes(1);
      expect(mockNavigateToCustomPage).toHaveBeenCalledWith('custom-page-123');
    });

    it('should call navigateToCatalogPage when catalog item is clicked', () => {
      render(<ALMSidebar menuItems={mockMenuItems} />);

      const catalogButton = screen.getByRole('button', { name: 'Catalog' });
      fireEvent.click(catalogButton);

      expect(mockNavigateToCatalogPage).toHaveBeenCalledTimes(1);
      expect(mockNavigateToCatalogPage).toHaveBeenCalledWith();
    });

    it('should not call navigation methods when getALMObject returns null', () => {
      mockGetALMObject.mockReturnValue(null);

      render(<ALMSidebar menuItems={mockMenuItems} />);

      const customButton = screen.getByRole('button', { name: 'Custom Page' });
      fireEvent.click(customButton);

      expect(mockNavigateToCustomPage).not.toHaveBeenCalled();
      expect(mockNavigateToCatalogPage).not.toHaveBeenCalled();
    });

    it('should not call navigation methods when navigateToCustomPage is missing', () => {
      mockGetALMObject.mockReturnValue({
        navigateToCatalogPage: mockNavigateToCatalogPage,
      });

      render(<ALMSidebar menuItems={mockMenuItems} />);

      const customButton = screen.getByRole('button', { name: 'Custom Page' });
      fireEvent.click(customButton);

      expect(mockNavigateToCustomPage).not.toHaveBeenCalled();
      expect(mockNavigateToCatalogPage).not.toHaveBeenCalled();
    });

    it('should not call navigation methods when submenu parent item is clicked', () => {
      render(<ALMSidebar menuItems={mockMenuItems} />);

      const learningButton = screen.getByRole('button', { name: 'Learning' });
      fireEvent.click(learningButton);

      expect(mockNavigateToCustomPage).not.toHaveBeenCalled();
      expect(mockNavigateToCatalogPage).not.toHaveBeenCalled();
    });

    it('should call navigateToCustomPage when submenu item with pageId is clicked', () => {
      const itemsWithCustomSubmenu: ALMSidebarMenuItem[] = [
        {
          id: 'parent',
          label: 'Parent',
          isSubmenu: true,
          subItems: [
            {
              id: 'custom-sub',
              label: 'Custom Sub',
              pageId: 'sub-page-456',
            },
          ],
        },
      ];

      render(<ALMSidebar menuItems={itemsWithCustomSubmenu} />);

      const parentItem = screen.getByRole('button', { name: 'Parent' }).closest('li');
      fireEvent.mouseEnter(parentItem!);

      const customSubButton = screen.getByRole('menuitem', { name: 'Custom Sub' });
      fireEvent.click(customSubButton);

      expect(mockNavigateToCustomPage).toHaveBeenCalledTimes(1);
      expect(mockNavigateToCustomPage).toHaveBeenCalledWith('sub-page-456');
    });

    it('should call navigateToCatalogPage when submenu item with catalog route is clicked', () => {
      const itemsWithCatalogSubmenu: ALMSidebarMenuItem[] = [
        {
          id: 'parent',
          label: 'Parent',
          isSubmenu: true,
          subItems: [
            {
              id: 'catalog-sub',
              label: 'Catalog Sub',
              route: '/catalog',
            },
          ],
        },
      ];

      render(<ALMSidebar menuItems={itemsWithCatalogSubmenu} />);

      const parentItem = screen.getByRole('button', { name: 'Parent' }).closest('li');
      fireEvent.mouseEnter(parentItem!);

      const catalogSubButton = screen.getByRole('menuitem', { name: 'Catalog Sub' });
      fireEvent.click(catalogSubButton);

      expect(mockNavigateToCatalogPage).toHaveBeenCalledTimes(1);
      expect(mockNavigateToCatalogPage).toHaveBeenCalledWith();
    });

    it('should not call navigation methods when submenu item has no pageId or catalog route', () => {
      render(<ALMSidebar menuItems={mockMenuItems} />);

      const learningItem = screen.getByRole('button', { name: 'Learning' }).closest('li');
      fireEvent.mouseEnter(learningItem!);

      const coursesButton = screen.getByRole('menuitem', { name: 'Courses' });
      fireEvent.click(coursesButton);

      expect(mockNavigateToCustomPage).not.toHaveBeenCalled();
      expect(mockNavigateToCatalogPage).not.toHaveBeenCalled();
    });
  });

  describe('Active State Detection', () => {
    it('should mark item as active when route exactly matches current pathname', () => {
      mockUseLocation.mockReturnValue({ pathname: '/home' });

      render(<ALMSidebar menuItems={mockMenuItems} />);

      const homeButton = screen.getByRole('button', { name: 'Home' });
      expect(homeButton).toHaveAttribute('aria-current', 'page');
    });

    it('should not mark item as active when route does not match', () => {
      mockUseLocation.mockReturnValue({ pathname: '/other' });

      render(<ALMSidebar menuItems={mockMenuItems} />);

      const homeButton = screen.getByRole('button', { name: 'Home' });
      expect(homeButton).not.toHaveAttribute('aria-current');
    });

    it('should not set aria-current on parent submenu item even when child route matches', () => {
      mockUseLocation.mockReturnValue({ pathname: '/learning/courses' });

      render(<ALMSidebar menuItems={mockMenuItems} />);

      const learningButton = screen.getByRole('button', { name: 'Learning' });
      // Submenu parents use aria-expanded/aria-haspopup/aria-controls instead of aria-current
      expect(learningButton).not.toHaveAttribute('aria-current');
      expect(learningButton).toHaveAttribute('aria-expanded');
    });

    it('should mark submenu item as active when its route matches', () => {
      mockUseLocation.mockReturnValue({ pathname: '/learning/courses' });

      render(<ALMSidebar menuItems={mockMenuItems} />);

      const learningItem = screen.getByRole('button', { name: 'Learning' }).closest('li');
      fireEvent.mouseEnter(learningItem!);

      const coursesButton = screen.getByRole('menuitem', { name: 'Courses' });
      expect(coursesButton).toHaveAttribute('aria-current', 'page');
    });

    it('should not mark item as active when pathname is partial match', () => {
      mockUseLocation.mockReturnValue({ pathname: '/home/page' });

      render(<ALMSidebar menuItems={mockMenuItems} />);

      const homeButton = screen.getByRole('button', { name: 'Home' });
      expect(homeButton).not.toHaveAttribute('aria-current');
    });
  });

  describe('Submenu State Transitions', () => {
    it('should show submenu when hovering over submenu parent item', async () => {
      render(<ALMSidebar menuItems={mockMenuItems} />);

      const learningItem = screen.getByRole('button', { name: 'Learning' }).closest('li');
      fireEvent.mouseEnter(learningItem!);

      await waitFor(() => {
        expect(screen.getByRole('menuitem', { name: 'Courses' })).toHaveTextContent('Courses');
        expect(screen.getByRole('menuitem', { name: 'Learning Paths' })).toHaveTextContent('Learning Paths');
      });
    });

    it('should hide submenu when mouse leaves submenu parent item', async () => {
      render(<ALMSidebar menuItems={mockMenuItems} />);

      const learningButton = screen.getByRole('button', { name: 'Learning' });
      const learningItem = learningButton.closest('li');
      fireEvent.mouseEnter(learningItem!);

      await waitFor(() => {
        expect(learningButton).toHaveAttribute('aria-expanded', 'true');
      });

      fireEvent.mouseLeave(learningItem!);

      // Submenu items remain in DOM (CSS-hidden); verify state via aria-expanded
      await waitFor(() => {
        expect(learningButton).toHaveAttribute('aria-expanded', 'false');
      });
    });

    it('should keep submenu visible when hovering over submenu itself', async () => {
      render(<ALMSidebar menuItems={mockMenuItems} />);

      const learningItem = screen.getByRole('button', { name: 'Learning' }).closest('li');
      fireEvent.mouseEnter(learningItem!);

      await waitFor(() => {
        expect(screen.getByRole('menuitem', { name: 'Courses' })).toHaveTextContent('Courses');
      });

      const submenu = screen.getByRole('menu');
      fireEvent.mouseEnter(submenu);

      await waitFor(() => {
        expect(screen.getByRole('menuitem', { name: 'Courses' })).toHaveTextContent('Courses');
      });
    });

    it('should hide submenu when mouse leaves submenu', async () => {
      render(<ALMSidebar menuItems={mockMenuItems} />);

      const learningButton = screen.getByRole('button', { name: 'Learning' });
      const learningItem = learningButton.closest('li');
      fireEvent.mouseEnter(learningItem!);

      await waitFor(() => {
        expect(learningButton).toHaveAttribute('aria-expanded', 'true');
      });

      const submenu = screen.getByRole('menu');
      fireEvent.mouseLeave(submenu);

      // Submenu items remain in DOM (CSS-hidden); verify state via aria-expanded
      await waitFor(() => {
        expect(learningButton).toHaveAttribute('aria-expanded', 'false');
      });
    });

    it('should hide submenu after clicking submenu item', async () => {
      render(<ALMSidebar menuItems={mockMenuItems} />);

      const learningButton = screen.getByRole('button', { name: 'Learning' });
      const learningItem = learningButton.closest('li');
      fireEvent.mouseEnter(learningItem!);

      await waitFor(() => {
        expect(learningButton).toHaveAttribute('aria-expanded', 'true');
      });

      const coursesButton = screen.getByRole('menuitem', { name: 'Courses' });
      fireEvent.click(coursesButton);

      // Submenu items remain in DOM (CSS-hidden); verify state via aria-expanded
      await waitFor(() => {
        expect(learningButton).toHaveAttribute('aria-expanded', 'false');
      });
    });

    it('should update aria-expanded when submenu is shown', async () => {
      render(<ALMSidebar menuItems={mockMenuItems} />);

      const learningButton = screen.getByRole('button', { name: 'Learning' });
      expect(learningButton).toHaveAttribute('aria-expanded', 'false');

      const learningItem = learningButton.closest('li');
      fireEvent.mouseEnter(learningItem!);

      await waitFor(() => {
        expect(learningButton).toHaveAttribute('aria-expanded', 'true');
      });
    });

    it('should not show submenu for items without subItems', () => {
      const itemsWithoutSubmenu: ALMSidebarMenuItem[] = [
        {
          id: 'no-submenu',
          label: 'No Submenu',
          isSubmenu: true,
          subItems: [],
        },
      ];

      render(<ALMSidebar menuItems={itemsWithoutSubmenu} />);

      const item = screen.getByRole('button', { name: 'No Submenu' }).closest('li');
      fireEvent.mouseEnter(item!);

      expect(screen.queryByRole('menu')).toBeNull();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle item without route or pageId without crashing', () => {
      const itemWithoutRoute: ALMSidebarMenuItem[] = [
        { id: 'no-route', label: 'No Route' },
      ];

      render(<ALMSidebar menuItems={itemWithoutRoute} />);

      const button = screen.getByRole('button', { name: 'No Route' });
      fireEvent.click(button);

      expect(mockNavigateToCustomPage).not.toHaveBeenCalled();
      expect(mockNavigateToCatalogPage).not.toHaveBeenCalled();
    });

    it('should handle empty pathname', () => {
      mockUseLocation.mockReturnValue({ pathname: '' });

      render(<ALMSidebar menuItems={mockMenuItems} />);

      const homeButton = screen.getByRole('button', { name: 'Home' });
      expect(homeButton).not.toHaveAttribute('aria-current');
    });

    it('should handle root pathname', () => {
      mockUseLocation.mockReturnValue({ pathname: '/' });

      render(<ALMSidebar menuItems={mockMenuItems} />);

      const homeButton = screen.getByRole('button', { name: 'Home' });
      expect(homeButton).not.toHaveAttribute('aria-current');
    });
  });
});
