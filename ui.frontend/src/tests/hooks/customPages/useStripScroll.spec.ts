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
 * Unit Tests for useStripScroll Hook
 *
 * Hook handles:
 * - Horizontal strip scrolling with navigation controls
 * - Automatic fetching when nearing end of items
 * - Left/right navigation with page-based scrolling
 * - Scroll position tracking and item visibility
 * - Disabling navigation icons based on scroll position
 * - Timeout-based scroll event handling
 * - Dynamic items per page calculation
 */

import { act } from '@testing-library/react';
import React from 'react';
import ReactDOM from 'react-dom';
import { useStripScroll } from '../../../almLib/hooks/customPages/useStripScroll';

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

describe('useStripScroll', () => {
  let mockFetchMore: jest.Mock;
  const defaultProps = {
    cardWidth: 200,
    items: Array.from({ length: 10 }, (_, i) => ({ id: `item-${i}` })),
    fetchingData: false,
    searchString: '',
  };

  beforeEach(() => {
    jest.useFakeTimers();
    mockFetchMore = jest.fn();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  describe('Hook Initialization', () => {
    it('should initialize firstVisibleItemPosition to 0', () => {
      const { result } = renderHook(() =>
        useStripScroll({
          ...defaultProps,
          fetchMore: mockFetchMore,
        })
      );
      expect(result.current.firstVisibleItemPosition).toBe(0);
    });

    it('should initialize disableRightNavIcon to false', () => {
      const { result } = renderHook(() =>
        useStripScroll({
          ...defaultProps,
          fetchMore: mockFetchMore,
        })
      );
      expect(result.current.disableRightNavIcon).toBe(false);
    });

    it('should initialize disableLeftNavIcon to false', () => {
      const { result } = renderHook(() =>
        useStripScroll({
          ...defaultProps,
          fetchMore: mockFetchMore,
        })
      );
      expect(result.current.disableLeftNavIcon).toBe(false);
    });

    it('should initialize itemsPerPage to 4', () => {
      const { result } = renderHook(() =>
        useStripScroll({
          ...defaultProps,
          fetchMore: mockFetchMore,
        })
      );
      expect(result.current.itemsPerPage).toBe(4);
    });

    it('should initialize rollContainer ref to null', () => {
      const { result } = renderHook(() =>
        useStripScroll({
          ...defaultProps,
          fetchMore: mockFetchMore,
        })
      );
      expect(result.current.rollContainer.current).toBeNull();
    });
  });

  describe('updateItemsPerPage', () => {
    it('should update itemsPerPage', () => {
      const { result } = renderHook(() =>
        useStripScroll({
          ...defaultProps,
          fetchMore: mockFetchMore,
        })
      );

      act(() => {
        result.current.updateItemsPerPage({ itemsPerPage: 6 });
      });

      expect(result.current.itemsPerPage).toBe(6);
    });

    it('should update firstVisibleItemPosition', () => {
      const { result } = renderHook(() =>
        useStripScroll({
          ...defaultProps,
          fetchMore: mockFetchMore,
        })
      );

      act(() => {
        result.current.updateItemsPerPage({ firstVisibleItemPosition: 4 });
      });

      expect(result.current.firstVisibleItemPosition).toBe(4);
    });

    it('should update disableRightNavIcon', () => {
      const { result } = renderHook(() =>
        useStripScroll({
          ...defaultProps,
          fetchMore: mockFetchMore,
        })
      );

      act(() => {
        result.current.updateItemsPerPage({ disableRightNavIcon: true });
      });

      expect(result.current.disableRightNavIcon).toBe(true);
    });

    it('should update multiple properties at once', () => {
      const { result } = renderHook(() =>
        useStripScroll({
          ...defaultProps,
          fetchMore: mockFetchMore,
        })
      );

      act(() => {
        result.current.updateItemsPerPage({
          itemsPerPage: 5,
          firstVisibleItemPosition: 5,
          disableLeftNavIcon: true,
        });
      });

      expect(result.current.itemsPerPage).toBe(5);
      expect(result.current.firstVisibleItemPosition).toBe(5);
      expect(result.current.disableLeftNavIcon).toBe(true);
    });
  });

  describe('isLeftNavIconDisabled', () => {
    it('should return true when firstVisibleItemPosition is 0', () => {
      const { result } = renderHook(() =>
        useStripScroll({
          ...defaultProps,
          fetchMore: mockFetchMore,
        })
      );
      expect(result.current.isLeftNavIconDisabled()).toBe(true);
    });

    it('should return false when firstVisibleItemPosition is greater than 0', () => {
      const { result } = renderHook(() =>
        useStripScroll({
          ...defaultProps,
          fetchMore: mockFetchMore,
        })
      );

      act(() => {
        result.current.updateItemsPerPage({ firstVisibleItemPosition: 4 });
      });

      expect(result.current.isLeftNavIconDisabled()).toBe(false);
    });

    it('should return true when disableLeftNavIcon is true', () => {
      const { result } = renderHook(() =>
        useStripScroll({
          ...defaultProps,
          fetchMore: mockFetchMore,
        })
      );

      act(() => {
        result.current.updateItemsPerPage({
          firstVisibleItemPosition: 4,
          disableLeftNavIcon: true,
        });
      });

      expect(result.current.isLeftNavIconDisabled()).toBe(true);
    });
  });

  describe('isRightNavIconDisabled', () => {
    it('should return true when items.length <= itemsPerPage', () => {
      const { result } = renderHook(() =>
        useStripScroll({
          ...defaultProps,
          items: [{ id: '1' }, { id: '2' }, { id: '3' }],
          fetchMore: mockFetchMore,
        })
      );
      expect(result.current.isRightNavIconDisabled()).toBe(true);
    });

    it('should return false when items.length > itemsPerPage and not at end', () => {
      const { result } = renderHook(() =>
        useStripScroll({
          ...defaultProps,
          items: Array.from({ length: 20 }, (_, i) => ({ id: `item-${i}` })),
          fetchMore: mockFetchMore,
        })
      );
      expect(result.current.isRightNavIconDisabled()).toBe(false);
    });

    it('should return true when at the end of items', () => {
      const { result } = renderHook(() =>
        useStripScroll({
          ...defaultProps,
          items: Array.from({ length: 8 }, (_, i) => ({ id: `item-${i}` })),
          fetchMore: mockFetchMore,
        })
      );

      act(() => {
        result.current.updateItemsPerPage({ firstVisibleItemPosition: 4 });
      });

      expect(result.current.isRightNavIconDisabled()).toBe(true);
    });

    it('should return true when disableRightNavIcon is true', () => {
      const { result } = renderHook(() =>
        useStripScroll({
          ...defaultProps,
          items: Array.from({ length: 20 }, (_, i) => ({ id: `item-${i}` })),
          fetchMore: mockFetchMore,
        })
      );

      act(() => {
        result.current.updateItemsPerPage({ disableRightNavIcon: true });
      });

      expect(result.current.isRightNavIconDisabled()).toBe(true);
    });
  });

  describe('rollAPage', () => {
    it('should scroll right by itemsPerPage', () => {
      const { result } = renderHook(() =>
        useStripScroll({
          ...defaultProps,
          items: Array.from({ length: 20 }, (_, i) => ({ id: `item-${i}` })),
          fetchMore: mockFetchMore,
        })
      );

      const mockScrollTo = jest.fn();
      act(() => {
        result.current.rollContainer.current = {
          scrollTo: mockScrollTo,
          scrollLeft: 0,
        } as any;
      });

      act(() => {
        result.current.rollAPage(true);
      });

      expect(result.current.firstVisibleItemPosition).toBe(4);
      expect(mockScrollTo).toHaveBeenCalled();
    });

    it('should scroll left by itemsPerPage', () => {
      const { result } = renderHook(() =>
        useStripScroll({
          ...defaultProps,
          items: Array.from({ length: 20 }, (_, i) => ({ id: `item-${i}` })),
          fetchMore: mockFetchMore,
        })
      );

      const mockScrollTo = jest.fn();
      act(() => {
        result.current.rollContainer.current = {
          scrollTo: mockScrollTo,
          scrollLeft: 0,
        } as any;
      });

      // First scroll right
      act(() => {
        result.current.updateItemsPerPage({ firstVisibleItemPosition: 8 });
      });

      // Then scroll left
      act(() => {
        result.current.rollAPage(false);
      });

      expect(result.current.firstVisibleItemPosition).toBe(4);
    });

    it('should not scroll left below 0', () => {
      const { result } = renderHook(() =>
        useStripScroll({
          ...defaultProps,
          fetchMore: mockFetchMore,
        })
      );

      const mockScrollTo = jest.fn();
      act(() => {
        result.current.rollContainer.current = {
          scrollTo: mockScrollTo,
          scrollLeft: 0,
        } as any;
      });

      act(() => {
        result.current.rollAPage(false);
      });

      expect(result.current.firstVisibleItemPosition).toBe(0);
    });

    it('should call fetchMore when scrolling right near the end', () => {
      const { result } = renderHook(() =>
        useStripScroll({
          ...defaultProps,
          items: Array.from({ length: 10 }, (_, i) => ({ id: `item-${i}` })),
          fetchMore: mockFetchMore,
        })
      );

      const mockScrollTo = jest.fn();
      act(() => {
        result.current.rollContainer.current = {
          scrollTo: mockScrollTo,
          scrollLeft: 0,
        } as any;
      });

      // With 10 items and itemsPerPage=4, scrolling to position 4 leaves 6 items
      // Since 6 < itemsPerPage * 2 (8), it should trigger fetchMore
      act(() => {
        result.current.updateItemsPerPage({ firstVisibleItemPosition: 2 });
      });

      act(() => {
        result.current.rollAPage(true);
      });

      // After scrolling right, we're at position 6, leaving 4 items
      // This should trigger fetchMore
      expect(mockFetchMore).toHaveBeenCalledWith('');
    });

    it('should not call fetchMore when already fetching', () => {
      const { result } = renderHook(() =>
        useStripScroll({
          ...defaultProps,
          items: Array.from({ length: 12 }, (_, i) => ({ id: `item-${i}` })),
          fetchingData: true,
          fetchMore: mockFetchMore,
        })
      );

      const mockScrollTo = jest.fn();
      act(() => {
        result.current.rollContainer.current = {
          scrollTo: mockScrollTo,
          scrollLeft: 0,
        } as any;
      });

      act(() => {
        result.current.rollAPage(true);
      });

      expect(mockFetchMore).not.toHaveBeenCalled();
    });
  });

  describe('onScroll', () => {
    it('should not process scroll events when fetchingData is true', () => {
      const { result } = renderHook(() =>
        useStripScroll({
          ...defaultProps,
          fetchingData: true,
          fetchMore: mockFetchMore,
        })
      );

      const mockEvent = {
        target: {
          scrollLeft: 800,
          offsetWidth: 800,
          scrollWidth: 2000,
        },
      };

      act(() => {
        result.current.onScroll(mockEvent);
        jest.advanceTimersByTime(100);
      });

      // Should not update state when fetching
      expect(result.current.firstVisibleItemPosition).toBe(0);
    });

    it('should call fetchMore when scrolled near the end', () => {
      const { result } = renderHook(() =>
        useStripScroll({
          ...defaultProps,
          items: Array.from({ length: 20 }, (_, i) => ({ id: `item-${i}` })),
          fetchMore: mockFetchMore,
        })
      );

      const mockEvent = {
        target: {
          scrollLeft: 2500, // Scrolled far right
          offsetWidth: 800,
          scrollWidth: 4000,
        },
      };

      act(() => {
        result.current.onScroll(mockEvent);
      });

      expect(mockFetchMore).toHaveBeenCalledWith('');
    });

    it('should update disableLeftNavIcon when scrollLeft is 0', () => {
      const { result } = renderHook(() =>
        useStripScroll({
          ...defaultProps,
          fetchMore: mockFetchMore,
        })
      );

      const mockEvent = {
        target: {
          scrollLeft: 0,
          offsetWidth: 800,
          scrollWidth: 2000,
        },
      };

      act(() => {
        result.current.onScroll(mockEvent);
        jest.advanceTimersByTime(100);
      });

      expect(result.current.disableLeftNavIcon).toBe(true);
    });

    it('should update disableRightNavIcon when at the end of scroll', () => {
      const { result } = renderHook(() =>
        useStripScroll({
          ...defaultProps,
          fetchMore: mockFetchMore,
        })
      );

      const mockEvent = {
        target: {
          scrollLeft: 1200,
          offsetWidth: 800,
          scrollWidth: 2000,
        },
      };

      act(() => {
        result.current.onScroll(mockEvent);
        jest.advanceTimersByTime(100);
      });

      expect(result.current.disableRightNavIcon).toBe(true);
    });

    it('should update firstVisibleItemPosition based on scrollLeft', () => {
      const { result } = renderHook(() =>
        useStripScroll({
          ...defaultProps,
          cardWidth: 200,
          items: Array.from({ length: 20 }, (_, i) => ({ id: `item-${i}` })),
          fetchMore: mockFetchMore,
        })
      );

      const mockEvent = {
        target: {
          scrollLeft: 400, // 2 cards worth
          offsetWidth: 800,
          scrollWidth: 4000,
        },
      };

      act(() => {
        result.current.onScroll(mockEvent);
        jest.advanceTimersByTime(100);
      });

      expect(result.current.firstVisibleItemPosition).toBeGreaterThan(0);
    });

    it('should clear previous timeout before setting new one', () => {
      const { result } = renderHook(() =>
        useStripScroll({
          ...defaultProps,
          fetchMore: mockFetchMore,
        })
      );

      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

      const mockEvent = {
        target: {
          scrollLeft: 100,
          offsetWidth: 800,
          scrollWidth: 2000,
        },
      };

      act(() => {
        result.current.onScroll(mockEvent);
        result.current.onScroll(mockEvent);
      });

      expect(clearTimeoutSpy).toHaveBeenCalled();
      clearTimeoutSpy.mockRestore();
    });

    it('should pass searchString to fetchMore', () => {
      const { result } = renderHook(() =>
        useStripScroll({
          ...defaultProps,
          items: Array.from({ length: 20 }, (_, i) => ({ id: `item-${i}` })),
          searchString: 'test-search',
          fetchMore: mockFetchMore,
        })
      );

      const mockEvent = {
        target: {
          scrollLeft: 2500,
          offsetWidth: 800,
          scrollWidth: 4000,
        },
      };

      act(() => {
        result.current.onScroll(mockEvent);
      });

      expect(mockFetchMore).toHaveBeenCalledWith('test-search');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty items array', () => {
      const { result } = renderHook(() =>
        useStripScroll({
          ...defaultProps,
          items: [],
          fetchMore: mockFetchMore,
        })
      );

      expect(result.current.isRightNavIconDisabled()).toBe(true);
    });

    it('should handle single item', () => {
      const { result } = renderHook(() =>
        useStripScroll({
          ...defaultProps,
          items: [{ id: '1' }],
          fetchMore: mockFetchMore,
        })
      );

      expect(result.current.isRightNavIconDisabled()).toBe(true);
    });

    it('should handle very small cardWidth', () => {
      const { result } = renderHook(() =>
        useStripScroll({
          ...defaultProps,
          cardWidth: 10,
          fetchMore: mockFetchMore,
        })
      );

      expect(result.current.firstVisibleItemPosition).toBe(0);
    });

    it('should handle very large items array', () => {
      const { result } = renderHook(() =>
        useStripScroll({
          ...defaultProps,
          items: Array.from({ length: 1000 }, (_, i) => ({ id: `item-${i}` })),
          fetchMore: mockFetchMore,
        })
      );

      expect(result.current.isRightNavIconDisabled()).toBe(false);
    });

    it('should handle null rollContainer', () => {
      const { result } = renderHook(() =>
        useStripScroll({
          ...defaultProps,
          fetchMore: mockFetchMore,
        })
      );

      // rollContainer is null initially, should not throw
      act(() => {
        result.current.rollAPage(true);
      });

      expect(result.current.firstVisibleItemPosition).toBe(4);
    });
  });
});
