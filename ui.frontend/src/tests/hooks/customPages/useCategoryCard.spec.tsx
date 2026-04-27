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
 * Unit Tests for useCategoryCard Hook
 *
 * Hook handles:
 * - Category card data extraction and processing
 * - Determining catalog vs non-catalog items
 * - Image URL and height calculation
 * - Description extraction with localization
 * - Navigation to catalog page with different sources
 * - Navigation to custom pages
 * - Color theme extraction
 */

// Mock dependencies BEFORE imports
jest.mock('../../../almLib/utils/global', () => ({
  getALMConfig: jest.fn(),
  getALMObject: jest.fn(),
}));

jest.mock('../../../almLib/utils/hooks', () => ({
  getLocalizedData: jest.fn(),
}));

jest.mock('../../../almLib/utils/themes', () => ({
  GetTileColor: jest.fn(),
}));

import { act } from '@testing-library/react';
import React from 'react';
import ReactDOM from 'react-dom';
import {
  useCategoryCard,
  IMAGE_HEIGHT,
  IMAGE_HIDDEN_HEIGHT,
} from '../../../almLib/hooks/customPages/useCategoryCard';
import { getALMConfig, getALMObject } from '../../../almLib/utils/global';
import { getLocalizedData } from '../../../almLib/utils/hooks';
import { GetTileColor } from '../../../almLib/utils/themes';
import { CategorySource } from '../../../almLib/models';

// Custom renderHook implementation for React Testing Library v9
function renderHook<T>(hookCallback: () => T) {
  const result: any = { current: null };

  function TestComponent() {
    result.current = hookCallback();
    return null;
  }

  const container = document.createElement('div');

  if (document.body) {
    document.body.appendChild(container);
  }

  ReactDOM.render(React.createElement(TestComponent), container);

  return {
    result,
    rerender: () => {
      ReactDOM.render(React.createElement(TestComponent), container);
    },
    unmount: () => {
      ReactDOM.unmountComponentAtNode(container);
      if (container.parentNode) {
        container.parentNode.removeChild(container);
      }
    },
  };
}

describe('useCategoryCard', () => {
  const mockGetALMConfig = getALMConfig as jest.MockedFunction<typeof getALMConfig>;
  const mockGetALMObject = getALMObject as jest.MockedFunction<typeof getALMObject>;
  const mockGetLocalizedData = getLocalizedData as jest.MockedFunction<typeof getLocalizedData>;
  const mockGetTileColor = GetTileColor as jest.MockedFunction<typeof GetTileColor>;

  const mockNavigateToCatalogPage = jest.fn();
  const mockNavigateToCustomPage = jest.fn();

  const mockConfig = {
    locale: 'en-US',
  };

  const mockCatalogItem = {
    type: 'catalog',
    id: 'catalog:123',
    name: 'Test Catalog',
    contentImageUrl: 'https://example.com/catalog-image.jpg',
    localizedMetadata: [
      {
        locale: 'en-US',
        overview: 'Test catalog overview',
      },
    ],
  };

  const mockNonCatalogItem = {
    type: 'category',
    id: 'category:456',
    name: 'Test Category',
    imageUrl: 'https://example.com/category-image.jpg',
    description: 'Test category description',
    pageId: 'page:789',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetALMConfig.mockReturnValue(mockConfig as any);
    mockGetALMObject.mockReturnValue({
      navigateToCatalogPage: mockNavigateToCatalogPage,
      navigateToCustomPage: mockNavigateToCustomPage,
    } as any);
    mockGetLocalizedData.mockReturnValue({ overview: 'Test catalog overview' } as any);
    mockGetTileColor.mockReturnValue('#FF5733');
  });

  describe('Hook Initialization', () => {
    it('should extract id from item', () => {
      const { result } = renderHook(() =>
        useCategoryCard({
          item: mockCatalogItem,
          source: CategorySource.CATALOGS,
        })
      );
      expect(result.current.id).toBe('catalog:123');
    });

    it('should extract name from item', () => {
      const { result } = renderHook(() =>
        useCategoryCard({
          item: mockCatalogItem,
          source: CategorySource.CATALOGS,
        })
      );
      expect(result.current.name).toBe('Test Catalog');
    });
  });

  describe('Image Height Calculation', () => {
    it('should return IMAGE_HEIGHT when hideImage is false', () => {
      const { result } = renderHook(() =>
        useCategoryCard({
          item: mockCatalogItem,
          source: CategorySource.CATALOGS,
          hideImage: false,
        })
      );
      expect(result.current.imageHeight).toBe(IMAGE_HEIGHT);
      expect(result.current.imageHeight).toBe(160);
    });

    it('should return IMAGE_HEIGHT when hideImage is not provided', () => {
      const { result } = renderHook(() =>
        useCategoryCard({
          item: mockCatalogItem,
          source: CategorySource.CATALOGS,
        })
      );
      expect(result.current.imageHeight).toBe(IMAGE_HEIGHT);
    });

    it('should return IMAGE_HIDDEN_HEIGHT when hideImage is true', () => {
      const { result } = renderHook(() =>
        useCategoryCard({
          item: mockCatalogItem,
          source: CategorySource.CATALOGS,
          hideImage: true,
        })
      );
      expect(result.current.imageHeight).toBe(IMAGE_HIDDEN_HEIGHT);
      expect(result.current.imageHeight).toBe(8);
    });
  });

  describe('Image URL Extraction', () => {
    it('should extract contentImageUrl for catalog items', () => {
      const { result } = renderHook(() =>
        useCategoryCard({
          item: mockCatalogItem,
          source: CategorySource.CATALOGS,
        })
      );
      expect(result.current.imageUrl).toBe('https://example.com/catalog-image.jpg');
    });

    it('should extract imageUrl for non-catalog items', () => {
      const { result } = renderHook(() =>
        useCategoryCard({
          item: mockNonCatalogItem,
          source: CategorySource.CATEGORIES,
        })
      );
      expect(result.current.imageUrl).toBe('https://example.com/category-image.jpg');
    });

    it('should handle missing imageUrl for catalog', () => {
      const catalogWithoutImage = { ...mockCatalogItem, contentImageUrl: undefined };
      const { result } = renderHook(() =>
        useCategoryCard({
          item: catalogWithoutImage,
          source: CategorySource.CATALOGS,
        })
      );
      expect(result.current.imageUrl).toBeUndefined();
    });

    it('should handle missing imageUrl for non-catalog', () => {
      const categoryWithoutImage = { ...mockNonCatalogItem, imageUrl: undefined };
      const { result } = renderHook(() =>
        useCategoryCard({
          item: categoryWithoutImage,
          source: CategorySource.CATEGORIES,
        })
      );
      expect(result.current.imageUrl).toBeUndefined();
    });
  });

  describe('Description Extraction', () => {
    it('should extract localized description for catalog items', () => {
      const { result } = renderHook(() =>
        useCategoryCard({
          item: mockCatalogItem,
          source: CategorySource.CATALOGS,
        })
      );
      expect(result.current.description).toBe('Test catalog overview');
      expect(mockGetLocalizedData).toHaveBeenCalledWith(mockCatalogItem.localizedMetadata, 'en-US');
    });

    it('should extract description directly for non-catalog items', () => {
      const { result } = renderHook(() =>
        useCategoryCard({
          item: mockNonCatalogItem,
          source: CategorySource.CATEGORIES,
        })
      );
      expect(result.current.description).toBe('Test category description');
    });

    it('should handle missing localizedMetadata for catalog', () => {
      const catalogWithoutMetadata = { ...mockCatalogItem, localizedMetadata: [] };
      mockGetLocalizedData.mockReturnValue(null as any);

      const { result } = renderHook(() =>
        useCategoryCard({
          item: catalogWithoutMetadata,
          source: CategorySource.CATALOGS,
        })
      );
      // localizedMetadata defaults to [] when missing, not undefined
      expect(mockGetLocalizedData).toHaveBeenCalledWith([], 'en-US');
    });

    it('should handle empty localizedMetadata array for catalog', () => {
      const catalogWithEmptyMetadata = { ...mockCatalogItem, localizedMetadata: [] };
      mockGetLocalizedData.mockReturnValue({ overview: undefined } as any);

      const { result } = renderHook(() =>
        useCategoryCard({
          item: catalogWithEmptyMetadata,
          source: CategorySource.CATALOGS,
        })
      );
      expect(mockGetLocalizedData).toHaveBeenCalledWith([], 'en-US');
    });
  });

  describe('Color Extraction', () => {
    it('should get color using GetTileColor with item id', () => {
      const { result } = renderHook(() =>
        useCategoryCard({
          item: mockCatalogItem,
          source: CategorySource.CATALOGS,
        })
      );
      expect(result.current.color).toBe('#FF5733');
      expect(mockGetTileColor).toHaveBeenCalledWith('catalog:123');
    });

    it('should call GetTileColor with correct id for non-catalog items', () => {
      const { result } = renderHook(() =>
        useCategoryCard({
          item: mockNonCatalogItem,
          source: CategorySource.CATEGORIES,
        })
      );
      expect(mockGetTileColor).toHaveBeenCalledWith('category:456');
    });

    it('should return color from GetTileColor', () => {
      mockGetTileColor.mockReturnValue('#00FF00');
      const { result } = renderHook(() =>
        useCategoryCard({
          item: mockCatalogItem,
          source: CategorySource.CATALOGS,
        })
      );
      expect(result.current.color).toBe('#00FF00');
    });
  });

  describe('navigateToCatalog', () => {
    it('should navigate with selectedListableCatalogIds for CATALOGS source', () => {
      const { result } = renderHook(() =>
        useCategoryCard({
          item: mockCatalogItem,
          source: CategorySource.CATALOGS,
        })
      );

      act(() => {
        result.current.navigateToCatalog();
      });

      expect(mockNavigateToCatalogPage).toHaveBeenCalledWith({
        catalogs: 'catalog:123',
        roles: '',
        products: '',
        convertParams: true,
      });
    });

    it('should navigate with selectedRecommendationRoles for ROLES source', () => {
      const { result } = renderHook(() =>
        useCategoryCard({
          item: mockCatalogItem,
          source: CategorySource.ROLES,
        })
      );

      act(() => {
        result.current.navigateToCatalog();
      });

      expect(mockNavigateToCatalogPage).toHaveBeenCalledWith({
        catalogs: '',
        roles: 'Test Catalog',
        products: '',
        convertParams: true,
      });
    });

    it('should navigate with selectedRecommendationProducts for PRODUCTS source', () => {
      const { result } = renderHook(() =>
        useCategoryCard({
          item: mockCatalogItem,
          source: CategorySource.PRODUCTS,
        })
      );

      act(() => {
        result.current.navigateToCatalog();
      });

      expect(mockNavigateToCatalogPage).toHaveBeenCalledWith({
        catalogs: '',
        roles: '',
        products: 'Test Catalog',
        convertParams: true,
      });
    });

    it('should navigate with empty strings for unknown source', () => {
      const { result } = renderHook(() =>
        useCategoryCard({
          item: mockCatalogItem,
          source: 'UNKNOWN' as any,
        })
      );

      act(() => {
        result.current.navigateToCatalog();
      });

      expect(mockNavigateToCatalogPage).toHaveBeenCalledWith({
        catalogs: '',
        roles: '',
        products: '',
        convertParams: true,
      });
    });

    it('should use item name for navigation params', () => {
      const itemWithDifferentName = { ...mockCatalogItem, name: 'Special Category Name' };
      const { result } = renderHook(() =>
        useCategoryCard({
          item: itemWithDifferentName,
          source: CategorySource.ROLES,
        })
      );

      act(() => {
        result.current.navigateToCatalog();
      });

      expect(mockNavigateToCatalogPage).toHaveBeenCalledWith({
        catalogs: '',
        roles: 'Special Category Name',
        products: '',
        convertParams: true,
      });
    });
  });

  describe('navigateToCustomPage', () => {
    it('should navigate to custom page when pageId exists', () => {
      const { result } = renderHook(() =>
        useCategoryCard({
          item: mockNonCatalogItem,
          source: CategorySource.CATEGORIES,
        })
      );

      act(() => {
        result.current.navigateToCustomPage();
      });

      expect(mockNavigateToCustomPage).toHaveBeenCalledWith('page:789');
    });

    it('should not navigate when pageId is missing', () => {
      const itemWithoutPageId = { ...mockNonCatalogItem, pageId: undefined };
      const { result } = renderHook(() =>
        useCategoryCard({
          item: itemWithoutPageId,
          source: CategorySource.CATEGORIES,
        })
      );

      act(() => {
        result.current.navigateToCustomPage();
      });

      expect(mockNavigateToCustomPage).not.toHaveBeenCalled();
    });

    it('should not navigate when pageId is null', () => {
      const itemWithNullPageId = { ...mockNonCatalogItem, pageId: null };
      const { result } = renderHook(() =>
        useCategoryCard({
          item: itemWithNullPageId,
          source: CategorySource.CATEGORIES,
        })
      );

      act(() => {
        result.current.navigateToCustomPage();
      });

      expect(mockNavigateToCustomPage).not.toHaveBeenCalled();
    });

    it('should not navigate when pageId is empty string', () => {
      const itemWithEmptyPageId = { ...mockNonCatalogItem, pageId: '' };
      const { result } = renderHook(() =>
        useCategoryCard({
          item: itemWithEmptyPageId,
          source: CategorySource.CATEGORIES,
        })
      );

      act(() => {
        result.current.navigateToCustomPage();
      });

      expect(mockNavigateToCustomPage).not.toHaveBeenCalled();
    });

    it('should navigate with different pageId values', () => {
      const itemWithDifferentPageId = { ...mockNonCatalogItem, pageId: 'custom-page-123' };
      const { result } = renderHook(() =>
        useCategoryCard({
          item: itemWithDifferentPageId,
          source: CategorySource.CATEGORIES,
        })
      );

      act(() => {
        result.current.navigateToCustomPage();
      });

      expect(mockNavigateToCustomPage).toHaveBeenCalledWith('custom-page-123');
    });
  });

  describe('Catalog vs Non-Catalog Differentiation', () => {
    it('should identify catalog type correctly', () => {
      const { result } = renderHook(() =>
        useCategoryCard({
          item: mockCatalogItem,
          source: CategorySource.CATALOGS,
        })
      );

      // Catalog should use contentImageUrl and localized description
      expect(result.current.imageUrl).toBe('https://example.com/catalog-image.jpg');
      expect(mockGetLocalizedData).toHaveBeenCalled();
    });

    it('should identify non-catalog type correctly', () => {
      const { result } = renderHook(() =>
        useCategoryCard({
          item: mockNonCatalogItem,
          source: CategorySource.CATEGORIES,
        })
      );

      // Non-catalog should use imageUrl and direct description
      expect(result.current.imageUrl).toBe('https://example.com/category-image.jpg');
      expect(result.current.description).toBe('Test category description');
    });

    it('should handle item without type property', () => {
      const itemWithoutType = { ...mockCatalogItem, type: undefined };
      const { result } = renderHook(() =>
        useCategoryCard({
          item: itemWithoutType,
          source: CategorySource.CATALOGS,
        })
      );

      // Should default to non-catalog behavior
      expect(result.current.imageUrl).toBeUndefined();
      expect(result.current.description).toBeUndefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle item with missing properties', () => {
      const minimalItem = {
        id: 'item:1',
        name: 'Minimal Item',
      };

      const { result } = renderHook(() =>
        useCategoryCard({
          item: minimalItem,
          source: CategorySource.CATALOGS,
        })
      );

      expect(result.current.id).toBe('item:1');
      expect(result.current.name).toBe('Minimal Item');
      expect(result.current.imageUrl).toBeUndefined();
      expect(result.current.description).toBeUndefined();
    });

    it('should handle null item (causes destructuring error - not null-safe)', () => {
      // NOTE: The hook destructures `const { id, name } = item` on line 19,
      // which will throw a TypeError when item is null.
      // This is expected behavior - the hook is not designed to handle null items.

      expect(() => {
        renderHook(() =>
          useCategoryCard({
            item: null as any,
            source: CategorySource.CATALOGS,
          })
        );
      }).toThrow();
    });

    it('should handle undefined item properties', () => {
      const itemWithUndefinedProps = {
        id: undefined,
        name: undefined,
        type: undefined,
      };

      const { result } = renderHook(() =>
        useCategoryCard({
          item: itemWithUndefinedProps,
          source: CategorySource.CATALOGS,
        })
      );

      expect(result.current.id).toBeUndefined();
      expect(result.current.name).toBeUndefined();
    });
  });
});
