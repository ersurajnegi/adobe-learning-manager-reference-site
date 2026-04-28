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
const mockNavigateToCatalog = jest.fn();
const mockNavigateToCustomPage = jest.fn();

jest.mock('@hooks/customPages/useCategoryCard', () => ({
  useCategoryCard: jest.fn(),
  IMAGE_HEIGHT: 120,
  IMAGE_HIDDEN_HEIGHT: 8,
}));

import { render, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import ALMCategoryCard from '@components/CustomPages/ALMCategoryCard/ALMCategoryCard';
import { useCategoryCard, IMAGE_HEIGHT, IMAGE_HIDDEN_HEIGHT } from '@hooks/customPages/useCategoryCard';
import { CategorySource } from '@models/CustomPages';
import { JAVASCRIPT_VOID_0 } from '@utils/constants';

const mockUseCategoryCard = useCategoryCard as jest.MockedFunction<typeof useCategoryCard>;

const baseHook = {
  imageHeight: IMAGE_HEIGHT,
  imageUrl: 'https://example.com/image.jpg',
  color: '#FF5733',
  name: 'Test Category',
  description: 'Test description',
  id: 'cat-1',
  navigateToCatalog: mockNavigateToCatalog,
  navigateToCustomPage: mockNavigateToCustomPage,
};

const catalogItem = { id: 'cat-1', name: 'Test Catalog' };
const customPageItem = { id: 'page-1', name: 'Custom Page', pageId: 'pg-123' };

const defaultProps = {
  item: catalogItem,
  index: 0,
  source: CategorySource.CATALOGS,
};

const byId = (container: HTMLElement, id: string) =>
  container.querySelector(`[data-automationid="${id}"]`);

describe('ALMCategoryCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseCategoryCard.mockReturnValue(baseHook);
  });

  it('renders an anchor with title and description from the hook', () => {
    const { container } = render(<ALMCategoryCard {...defaultProps} />);
    const card = byId(container, 'category-card-Test Category');
    expect(card?.tagName.toLowerCase()).toBe('a');
    expect(card?.getAttribute('href')).toBe(JAVASCRIPT_VOID_0);
    expect(byId(container, 'category-card-title-Test Category')?.textContent).toBe('Test Category');
    expect(byId(container, 'category-card-description-Test Category')?.textContent).toBe('Test description');
  });

  it('passes item, source, and hideImage to useCategoryCard', () => {
    render(<ALMCategoryCard {...defaultProps} hideImage={true} />);
    expect(mockUseCategoryCard).toHaveBeenCalledWith({
      item: catalogItem,
      source: CategorySource.CATALOGS,
      hideImage: true,
    });
  });

  describe('Image header', () => {
    it('shows role=img with background-image, color, and height when imageUrl exists and hideImage is false', () => {
      const { container } = render(<ALMCategoryCard {...defaultProps} />);
      const img = byId(container, 'category-card-image-Test Category');
      expect(img?.getAttribute('role')).toBe('img');
      expect(img?.getAttribute('aria-label')).toBe('Test Category');
      const style = img?.getAttribute('style');
      expect(style).toContain(`height: ${IMAGE_HEIGHT}px`);
      expect(style).toContain('background-image');
      expect(style).toContain('background-color');
    });

    it('omits role and background when hideImage is true, rendering height only', () => {
      mockUseCategoryCard.mockReturnValue({ ...baseHook, imageHeight: IMAGE_HIDDEN_HEIGHT });
      const { container } = render(<ALMCategoryCard {...defaultProps} hideImage={true} />);
      const img = byId(container, 'category-card-image-Test Category');
      expect(img?.getAttribute('role')).toBeNull();
      const style = img?.getAttribute('style');
      expect(style).toContain(`height: ${IMAGE_HIDDEN_HEIGHT}px`);
      expect(style).not.toContain('background-color');
      expect(style).not.toContain('background-image');
    });

    it('omits role and background-image but keeps background-color when imageUrl is empty', () => {
      mockUseCategoryCard.mockReturnValue({ ...baseHook, imageUrl: '' });
      const { container } = render(<ALMCategoryCard {...defaultProps} />);
      const img = byId(container, 'category-card-image-Test Category');
      expect(img?.getAttribute('role')).toBeNull();
      const style = img?.getAttribute('style');
      expect(style).not.toContain('background-image');
      expect(style).toContain('background-color');
    });
  });

  describe('Description visibility', () => {
    it('hides the description element when hideDescription is true', () => {
      const { container } = render(<ALMCategoryCard {...defaultProps} hideDescription={true} />);
      expect(byId(container, 'category-card-description-Test Category')).toBeNull();
    });

    it('shows the description element when hideDescription is false', () => {
      const { container } = render(<ALMCategoryCard {...defaultProps} hideDescription={false} />);
      expect(byId(container, 'category-card-description-Test Category')).not.toBeNull();
    });
  });

  describe('Navigation on click', () => {
    it('calls navigateToCatalog when item has no pageId', async () => {
      const { container } = render(<ALMCategoryCard {...defaultProps} item={catalogItem} />);
      await act(async () => { fireEvent.click(byId(container, 'category-card-Test Category')!); });
      expect(mockNavigateToCatalog).toHaveBeenCalledTimes(1);
      expect(mockNavigateToCustomPage).not.toHaveBeenCalled();
    });

    it('calls navigateToCustomPage when item has a pageId', async () => {
      const { container } = render(<ALMCategoryCard {...defaultProps} item={customPageItem} />);
      await act(async () => { fireEvent.click(byId(container, 'category-card-Test Category')!); });
      expect(mockNavigateToCustomPage).toHaveBeenCalledTimes(1);
      expect(mockNavigateToCatalog).not.toHaveBeenCalled();
    });

    it('does not navigate and sets tabIndex=-1 when disableLinks is true', async () => {
      const { container } = render(<ALMCategoryCard {...defaultProps} disableLinks={true} />);
      const card = byId(container, 'category-card-Test Category');
      expect(card?.getAttribute('tabIndex')).toBe('-1');
      await act(async () => { fireEvent.click(card!); });
      expect(mockNavigateToCatalog).not.toHaveBeenCalled();
      expect(mockNavigateToCustomPage).not.toHaveBeenCalled();
    });
  });
});
