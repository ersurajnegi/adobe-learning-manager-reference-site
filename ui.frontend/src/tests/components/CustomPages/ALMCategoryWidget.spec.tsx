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
const mockFetchMore = jest.fn();
const mockRollAPage = jest.fn();
const mockIsLeftNavIconDisabled = jest.fn(() => false);
const mockIsRightNavIconDisabled = jest.fn(() => false);
const mockUpdateItemsPerPage = jest.fn();
const mockChangeHoverState = jest.fn();

jest.mock('@hooks/customPages/useALMCategoryWidget');
jest.mock('@hooks/customPages/useStripScroll');
jest.mock('@hooks/customPages/useALMInspectMode');
jest.mock('@utils/translationService');

jest.mock('@components/CustomPages/ALMCategoryCard', () => ({
  ALMCategoryCard: ({ item, index, hideImage, hideDescription, disableLinks }: any) => (
    <div
      data-testid={`category-card-${index}`}
      data-item-id={item.id}
      data-hide-image={String(hideImage)}
      data-hide-description={String(hideDescription)}
      data-disable-links={String(disableLinks)}
    />
  ),
}));

jest.mock('@components/CustomPages/ALMStripWidgetHeader/ALMStripWidgetHeader', () => ({
  __esModule: true,
  default: ({ heading, showNavIcons }: any) => (
    <div data-testid="strip-header">
      <span data-testid="heading">{heading}</span>
      {showNavIcons && <div data-testid="nav-icons" />}
    </div>
  ),
}));

jest.mock('@components/CustomPages/ALMNoAccessContainer/ALMNoAccessContainer', () => ({
  __esModule: true,
  default: () => <div data-testid="no-access" />,
}));

jest.mock('@components/CustomPages/ALMWidgetInspectMode/ALMWidgetInspectMode', () => ({
  __esModule: true,
  default: () => <div data-testid="inspect-mode" />,
}));

jest.mock('@components/CustomPages/ALMWidgetLoader', () => ({
  ALMWidgetLoader: () => <div data-testid="widget-loader" />,
}));

import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ALMCategoryWidget from '@components/CustomPages/ALMCategoryWidget/ALMCategoryWidget';
import { useALMCategoryWidget } from '@hooks/customPages/useALMCategoryWidget';
import { useStripScroll } from '@hooks/customPages/useStripScroll';
import { useWidgetInspectMode } from '@hooks/customPages/useALMInspectMode';
import { GetTranslation } from '@utils/translationService';
import { CategorySource } from '@models/CustomPages';

const mockUseALMCategoryWidget = useALMCategoryWidget as jest.MockedFunction<typeof useALMCategoryWidget>;
const mockUseStripScroll = useStripScroll as jest.MockedFunction<typeof useStripScroll>;
const mockUseWidgetInspectMode = useWidgetInspectMode as jest.MockedFunction<typeof useWidgetInspectMode>;
const mockGetTranslation = GetTranslation as jest.MockedFunction<typeof GetTranslation>;

const items = [
  { id: 'i1', name: 'Cat 1' },
  { id: 'i2', name: 'Cat 2' },
];

const baseWidget = {
  id: 'w1',
  widgetRef: 'cat-widget',
  attributes: {
    source: CategorySource.CATALOGS,
    showImage: true,
    showDescription: true,
  },
};

const baseStripScroll = {
  rollContainer: { current: null },
  onScroll: jest.fn(),
  rollAPage: mockRollAPage,
  isLeftNavIconDisabled: mockIsLeftNavIconDisabled,
  isRightNavIconDisabled: mockIsRightNavIconDisabled,
  updateItemsPerPage: mockUpdateItemsPerPage,
  itemsPerPage: 4,
};

const baseInspectMode = {
  isHovered: false,
  widgetContainerWidth: 800,
  widgetContainerHeight: 400,
  changeHoverState: mockChangeHoverState,
};

const renderWidget = (props: any = {}) =>
  render(<ALMCategoryWidget widget={baseWidget as any} {...props} />);

describe('ALMCategoryWidget', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseALMCategoryWidget.mockReturnValue({
      fetchingData: false,
      items,
      fetchMore: mockFetchMore,
      searchString: 'q',
    } as any);
    mockUseStripScroll.mockReturnValue(baseStripScroll as any);
    mockUseWidgetInspectMode.mockReturnValue(baseInspectMode);
    mockGetTranslation.mockImplementation((key: string) =>
      key.endsWith('.title') ? 'Widget Title' : 'Widget Desc'
    );
  });

  describe('Content rendering', () => {
    it('renders one card per item when items exist', () => {
      renderWidget();
      expect(screen.getByTestId('category-card-0')).toHaveAttribute('data-item-id', 'i1');
      expect(screen.getByTestId('category-card-1')).toHaveAttribute('data-item-id', 'i2');
      expect(screen.queryByTestId('widget-loader')).not.toBeInTheDocument();
      expect(screen.queryByTestId('no-access')).not.toBeInTheDocument();
    });

    it('renders the loader when fetchingData is true and items is empty', () => {
      mockUseALMCategoryWidget.mockReturnValue({
        fetchingData: true,
        items: [],
        fetchMore: mockFetchMore,
        searchString: '',
      } as any);
      renderWidget();
      expect(screen.getByTestId('widget-loader')).toBeInTheDocument();
      expect(screen.queryByTestId('no-access')).not.toBeInTheDocument();
    });

    it('renders NoAccessContainer when items is empty and not fetching', () => {
      mockUseALMCategoryWidget.mockReturnValue({
        fetchingData: false,
        items: [],
        fetchMore: mockFetchMore,
        searchString: '',
      } as any);
      renderWidget();
      expect(screen.getByTestId('no-access')).toBeInTheDocument();
      expect(screen.queryByTestId('widget-loader')).not.toBeInTheDocument();
    });
  });

  describe('Navigation icons', () => {
    it('shows nav icons when items.length exceeds itemsPerPage', () => {
      mockUseStripScroll.mockReturnValue({ ...baseStripScroll, itemsPerPage: 1 } as any);
      renderWidget();
      expect(screen.getByTestId('nav-icons').tagName.toLowerCase()).toBe('div');
    });

    it('hides nav icons when items.length does not exceed itemsPerPage', () => {
      mockUseStripScroll.mockReturnValue({ ...baseStripScroll, itemsPerPage: 4 } as any);
      renderWidget();
      expect(screen.queryByTestId('nav-icons')).not.toBeInTheDocument();
    });
  });

  describe('Inspect mode overlay', () => {
    it('shows inspect overlay when isInspectMode=true and widget is hovered', () => {
      mockUseWidgetInspectMode.mockReturnValue({ ...baseInspectMode, isHovered: true });
      renderWidget({ isInspectMode: true });
      expect(screen.getByTestId('inspect-mode').tagName.toLowerCase()).toBe('div');
    });

    it('hides inspect overlay when isInspectMode=false even if hovered', () => {
      mockUseWidgetInspectMode.mockReturnValue({ ...baseInspectMode, isHovered: true });
      renderWidget({ isInspectMode: false });
      expect(screen.queryByTestId('inspect-mode')).not.toBeInTheDocument();
    });

    it('hides inspect overlay when isInspectMode=true but not hovered', () => {
      renderWidget({ isInspectMode: true });
      expect(screen.queryByTestId('inspect-mode')).not.toBeInTheDocument();
    });
  });

  describe('Card attributes from widget.attributes', () => {
    it('passes hideImage=false and hideDescription=false when showImage and showDescription are true', () => {
      renderWidget();
      const card = screen.getByTestId('category-card-0');
      expect(card).toHaveAttribute('data-hide-image', 'false');
      expect(card).toHaveAttribute('data-hide-description', 'false');
    });

    it('passes hideImage=true and hideDescription=true when showImage and showDescription are false', () => {
      renderWidget({
        widget: {
          ...baseWidget,
          attributes: { ...baseWidget.attributes, showImage: false, showDescription: false },
        },
      });
      const card = screen.getByTestId('category-card-0');
      expect(card).toHaveAttribute('data-hide-image', 'true');
      expect(card).toHaveAttribute('data-hide-description', 'true');
    });

    it('passes disableLinks prop down to cards', () => {
      renderWidget({ disableLinks: true });
      expect(screen.getByTestId('category-card-0')).toHaveAttribute('data-disable-links', 'true');
    });
  });

  describe('fetchMore side effect', () => {
    it('calls fetchMore on mount when items.length < itemsPerPage * 2', () => {
      // items.length=2, itemsPerPage=4 → 2 < 8 → fetchMore called
      renderWidget();
      expect(mockFetchMore).toHaveBeenCalledWith('q');
    });

    it('does not call fetchMore when items.length >= itemsPerPage * 2', () => {
      const manyItems = Array.from({ length: 8 }, (_, i) => ({ id: `i${i}`, name: `C${i}` }));
      mockUseALMCategoryWidget.mockReturnValue({
        fetchingData: false,
        items: manyItems,
        fetchMore: mockFetchMore,
        searchString: 'q',
      } as any);
      renderWidget();
      expect(mockFetchMore).not.toHaveBeenCalled();
    });
  });
});
