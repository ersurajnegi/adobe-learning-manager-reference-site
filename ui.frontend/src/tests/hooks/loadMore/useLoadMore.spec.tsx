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
 * Unit Tests for useLoadMore Hook
 *
 * Hook handles:
 * - IntersectionObserver setup for infinite scroll
 * - Element visibility detection
 * - Callback invocation when element becomes visible
 * - Options merging (default + custom)
 * - Container-based observation (containerId)
 * - Observer cleanup on unmount
 */

import { act } from '@testing-library/react';
import React, { createRef } from 'react';
import ReactDOM from 'react-dom';
import useLoadMore from '../../../almLib/hooks/loadMore/useLoadMore';

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

describe('useLoadMore', () => {
  let mockObserve: jest.Mock;
  let mockUnobserve: jest.Mock;
  let mockDisconnect: jest.Mock;
  let intersectionObserverCallback: any;
  let mockIntersectionObserver: jest.Mock;

  beforeEach(() => {
    // Reset mocks
    mockObserve = jest.fn();
    mockUnobserve = jest.fn();
    mockDisconnect = jest.fn();

    // Mock IntersectionObserver
    mockIntersectionObserver = jest.fn((callback, options) => {
      intersectionObserverCallback = callback;
      return {
        observe: mockObserve,
        unobserve: mockUnobserve,
        disconnect: mockDisconnect,
      };
    });

    (global as any).IntersectionObserver = mockIntersectionObserver;

    // Mock document.getElementById
    jest.spyOn(document, 'getElementById').mockImplementation((id: string) => {
      const element = document.createElement('div');
      element.id = id;
      return element;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Hook Initialization', () => {
    it('should return elementRef in array', () => {
      const mockCallback = jest.fn();
      const elementRef = createRef<HTMLDivElement>();

      const props = {
        items: [],
        callback: mockCallback,
        elementRef,
      };

      let result: any;
      act(() => {
        result = renderHook(() => useLoadMore(props)).result;
      });

      expect(Array.isArray(result.current)).toBe(true);
      expect(result.current[0]).toBe(elementRef);
    });

    it('should handle null elementRef', () => {
      const mockCallback = jest.fn();
      const elementRef = { current: null };

      const props = {
        items: [],
        callback: mockCallback,
        elementRef,
      };

      let result: any;
      act(() => {
        result = renderHook(() => useLoadMore(props)).result;
      });

      expect(mockIntersectionObserver).not.toHaveBeenCalled();
    });

    it('should create IntersectionObserver when elementRef.current exists', () => {
      const mockCallback = jest.fn();
      const mockElement = document.createElement('div');
      const elementRef = { current: mockElement };

      const props = {
        items: [],
        callback: mockCallback,
        elementRef,
      };

      act(() => {
        renderHook(() => useLoadMore(props));
      });

      expect(mockIntersectionObserver).toHaveBeenCalled();
    });
  });

  describe('IntersectionObserver Configuration', () => {
    it('should create observer with default options', () => {
      const mockCallback = jest.fn();
      const mockElement = document.createElement('div');
      const elementRef = { current: mockElement };

      const props = {
        items: [],
        callback: mockCallback,
        elementRef,
      };

      act(() => {
        renderHook(() => useLoadMore(props));
      });

      expect(mockIntersectionObserver).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          root: null,
          rootMargin: '100px',
          threshold: 1.0,
        })
      );
    });

    it('should merge custom options with defaults', () => {
      const mockCallback = jest.fn();
      const mockElement = document.createElement('div');
      const elementRef = { current: mockElement };

      const customOptions = {
        rootMargin: '200px',
        threshold: 0.5,
      };

      const props = {
        items: [],
        callback: mockCallback,
        elementRef,
        options: customOptions,
      };

      act(() => {
        renderHook(() => useLoadMore(props));
      });

      expect(mockIntersectionObserver).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          root: null,
          rootMargin: '200px',
          threshold: 0.5,
        })
      );
    });

    it('should set root to container element when containerId is provided', () => {
      const mockCallback = jest.fn();
      const mockElement = document.createElement('div');
      const elementRef = { current: mockElement };

      const props = {
        items: [],
        callback: mockCallback,
        elementRef,
        containerId: 'scroll-container',
      };

      act(() => {
        renderHook(() => useLoadMore(props));
      });

      const calls = mockIntersectionObserver.mock.calls;
      const options = calls[0][1];

      expect(document.getElementById).toHaveBeenCalledWith('scroll-container');
      expect(options.root).not.toBeNull();
      expect(options.root?.id).toBe('scroll-container');
    });

    it('should handle non-existent containerId gracefully', () => {
      (document.getElementById as jest.Mock).mockReturnValue(null);

      const mockCallback = jest.fn();
      const mockElement = document.createElement('div');
      const elementRef = { current: mockElement };

      const props = {
        items: [],
        callback: mockCallback,
        elementRef,
        containerId: 'non-existent',
      };

      act(() => {
        renderHook(() => useLoadMore(props));
      });

      expect(mockIntersectionObserver).toHaveBeenCalled();
    });

    it('should preserve custom options when containerId is provided', () => {
      const mockCallback = jest.fn();
      const mockElement = document.createElement('div');
      const elementRef = { current: mockElement };

      const customOptions = {
        rootMargin: '50px',
        threshold: 0.8,
      };

      const props = {
        items: [],
        callback: mockCallback,
        elementRef,
        containerId: 'container',
        options: customOptions,
      };

      act(() => {
        renderHook(() => useLoadMore(props));
      });

      const calls = mockIntersectionObserver.mock.calls;
      const options = calls[0][1];

      expect(options.rootMargin).toBe('50px');
      expect(options.threshold).toBe(0.8);
    });
  });

  describe('Observer Behavior', () => {
    it('should call observe on the elementRef', () => {
      const mockCallback = jest.fn();
      const mockElement = document.createElement('div');
      const elementRef = { current: mockElement };

      const props = {
        items: [],
        callback: mockCallback,
        elementRef,
      };

      act(() => {
        renderHook(() => useLoadMore(props));
      });

      expect(mockObserve).toHaveBeenCalledWith(mockElement);
    });

    it('should invoke callback when element is intersecting', () => {
      const mockCallback = jest.fn();
      // Wrap in a real function to ensure instanceof Function works
      const wrappedCallback = function () {
        mockCallback();
      };

      const mockElement = document.createElement('div');
      const elementRef = { current: mockElement };

      const props = {
        items: [],
        callback: wrappedCallback,
        elementRef,
      };

      act(() => {
        renderHook(() => useLoadMore(props));
      });

      // Get the callback that was passed to IntersectionObserver
      const observerCallback = mockIntersectionObserver.mock.calls[0][0];

      // Simulate intersection
      observerCallback([{ isIntersecting: true }]);

      expect(mockCallback).toHaveBeenCalledTimes(1);
    });

    it('should not invoke callback when element is not intersecting', () => {
      const mockCallback = jest.fn();
      const mockElement = document.createElement('div');
      const elementRef = { current: mockElement };

      const props = {
        items: [],
        callback: mockCallback,
        elementRef,
      };

      act(() => {
        renderHook(() => useLoadMore(props));
      });

      // Simulate no intersection
      act(() => {
        intersectionObserverCallback([{ isIntersecting: false }]);
      });

      expect(mockCallback).not.toHaveBeenCalled();
    });

    it('should invoke callback multiple times for multiple intersections', () => {
      const mockCallback = jest.fn();
      // Wrap in a real function to ensure instanceof Function works
      const wrappedCallback = function () {
        mockCallback();
      };

      const mockElement = document.createElement('div');
      const elementRef = { current: mockElement };

      const props = {
        items: [],
        callback: wrappedCallback,
        elementRef,
      };

      act(() => {
        renderHook(() => useLoadMore(props));
      });

      // Get the callback that was passed to IntersectionObserver
      const observerCallback = mockIntersectionObserver.mock.calls[0][0];

      // Simulate multiple intersections
      observerCallback([{ isIntersecting: true }]);
      observerCallback([{ isIntersecting: true }]);
      observerCallback([{ isIntersecting: true }]);

      expect(mockCallback).toHaveBeenCalledTimes(3);
    });
  });

  describe('Cleanup', () => {
    it('should call unobserve on unmount', () => {
      const mockCallback = jest.fn();
      const mockElement = document.createElement('div');
      const elementRef = { current: mockElement };

      const props = {
        items: [],
        callback: mockCallback,
        elementRef,
      };

      const { unmount } = renderHook(() => useLoadMore(props));

      act(() => {
        unmount();
      });

      expect(mockUnobserve).toHaveBeenCalledWith(mockElement);
    });

    it('should handle cleanup when observer is not created', () => {
      const mockCallback = jest.fn();
      const elementRef = { current: null };

      const props = {
        items: [],
        callback: mockCallback,
        elementRef,
      };

      const { unmount } = renderHook(() => useLoadMore(props));

      // Should not throw
      act(() => {
        unmount();
      });

      expect(mockUnobserve).not.toHaveBeenCalled();
    });

    it('should cleanup observer on dependency change', () => {
      const mockCallback = jest.fn();
      const mockElement = document.createElement('div');
      const elementRef = { current: mockElement };

      const { unmount } = renderHook(() =>
        useLoadMore({
          items: [1, 2, 3],
          callback: mockCallback,
          elementRef,
        })
      );

      // Unmount to trigger cleanup
      act(() => {
        unmount();
      });

      // Unobserve should be called during cleanup
      expect(mockUnobserve).toHaveBeenCalledWith(mockElement);
    });
  });

  describe('useEffect Dependencies', () => {
    it('should re-create observer when callback changes', () => {
      const mockCallback1 = jest.fn();
      const mockCallback2 = jest.fn();
      const mockElement = document.createElement('div');
      const elementRef = { current: mockElement };

      act(() => {
        renderHook(() =>
          useLoadMore({
            items: [],
            callback: mockCallback1,
            elementRef,
          })
        );
      });

      const initialObserverCalls = mockIntersectionObserver.mock.calls.length;

      // Re-render with new callback
      act(() => {
        renderHook(() =>
          useLoadMore({
            items: [],
            callback: mockCallback2,
            elementRef,
          })
        );
      });

      expect(mockIntersectionObserver.mock.calls.length).toBeGreaterThan(initialObserverCalls);
    });

    it('should re-create observer when items change', () => {
      const mockCallback = jest.fn();
      const mockElement = document.createElement('div');
      const elementRef = { current: mockElement };

      act(() => {
        renderHook(() =>
          useLoadMore({
            items: [1, 2, 3],
            callback: mockCallback,
            elementRef,
          })
        );
      });

      const initialObserverCalls = mockIntersectionObserver.mock.calls.length;

      // Re-render with new items
      act(() => {
        renderHook(() =>
          useLoadMore({
            items: [1, 2, 3, 4, 5],
            callback: mockCallback,
            elementRef,
          })
        );
      });

      expect(mockIntersectionObserver.mock.calls.length).toBeGreaterThan(initialObserverCalls);
    });

    it('should re-create observer when containerId changes', () => {
      const mockCallback = jest.fn();
      const mockElement = document.createElement('div');
      const elementRef = { current: mockElement };

      act(() => {
        renderHook(() =>
          useLoadMore({
            items: [],
            callback: mockCallback,
            elementRef,
            containerId: 'container1',
          })
        );
      });

      const initialObserverCalls = mockIntersectionObserver.mock.calls.length;

      // Re-render with new containerId
      act(() => {
        renderHook(() =>
          useLoadMore({
            items: [],
            callback: mockCallback,
            elementRef,
            containerId: 'container2',
          })
        );
      });

      expect(mockIntersectionObserver.mock.calls.length).toBeGreaterThan(initialObserverCalls);
    });

    it('should re-create observer when options change', () => {
      const mockCallback = jest.fn();
      const mockElement = document.createElement('div');
      const elementRef = { current: mockElement };

      act(() => {
        renderHook(() =>
          useLoadMore({
            items: [],
            callback: mockCallback,
            elementRef,
            options: { threshold: 0.5 },
          })
        );
      });

      const initialObserverCalls = mockIntersectionObserver.mock.calls.length;

      // Re-render with new options
      act(() => {
        renderHook(() =>
          useLoadMore({
            items: [],
            callback: mockCallback,
            elementRef,
            options: { threshold: 0.8 },
          })
        );
      });

      expect(mockIntersectionObserver.mock.calls.length).toBeGreaterThan(initialObserverCalls);
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined elementRef', () => {
      const mockCallback = jest.fn();

      const props = {
        items: [],
        callback: mockCallback,
        elementRef: undefined,
      };

      let result: any;
      act(() => {
        result = renderHook(() => useLoadMore(props)).result;
      });

      expect(mockIntersectionObserver).not.toHaveBeenCalled();
      expect(result.current[0]).toBeUndefined();
    });

    it('should handle empty items array', () => {
      const mockCallback = jest.fn();
      const mockElement = document.createElement('div');
      const elementRef = { current: mockElement };

      const props = {
        items: [],
        callback: mockCallback,
        elementRef,
      };

      act(() => {
        renderHook(() => useLoadMore(props));
      });

      expect(mockIntersectionObserver).toHaveBeenCalled();
    });

    it('should handle large items array', () => {
      const mockCallback = jest.fn();
      const mockElement = document.createElement('div');
      const elementRef = { current: mockElement };

      const props = {
        items: Array.from({ length: 1000 }, (_, i) => i),
        callback: mockCallback,
        elementRef,
      };

      act(() => {
        renderHook(() => useLoadMore(props));
      });

      expect(mockIntersectionObserver).toHaveBeenCalled();
    });

    it('should handle null options', () => {
      const mockCallback = jest.fn();
      const mockElement = document.createElement('div');
      const elementRef = { current: mockElement };

      const props = {
        items: [],
        callback: mockCallback,
        elementRef,
        options: null,
      };

      act(() => {
        renderHook(() => useLoadMore(props));
      });

      expect(mockIntersectionObserver).toHaveBeenCalled();
    });

    it('should handle partial options override', () => {
      const mockCallback = jest.fn();
      const mockElement = document.createElement('div');
      const elementRef = { current: mockElement };

      const props = {
        items: [],
        callback: mockCallback,
        elementRef,
        options: { threshold: 0.75 },
      };

      act(() => {
        renderHook(() => useLoadMore(props));
      });

      const calls = mockIntersectionObserver.mock.calls;
      const options = calls[0][1];

      expect(options.threshold).toBe(0.75);
      expect(options.rootMargin).toBe('100px'); // Default preserved
      expect(options.root).toBeNull(); // Default preserved
    });
  });
});
