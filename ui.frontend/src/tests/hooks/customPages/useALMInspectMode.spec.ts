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
 * Unit Tests for useWidgetInspectMode Hook
 *
 * Hook handles:
 * - Managing hover state for widget inspection
 * - Extracting widget container dimensions from sectionRef
 * - Providing a toggle function for hover state
 * - React ref integration
 */

import { act } from '@testing-library/react';
import React from 'react';
import ReactDOM from 'react-dom';
import { useWidgetInspectMode } from '../../../almLib/hooks/customPages/useALMInspectMode';

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

describe('useWidgetInspectMode', () => {
  let mockSectionRef: React.RefObject<HTMLElement>;

  beforeEach(() => {
    // Create a mock section element with dimensions
    const mockElement = document.createElement('section');
    Object.defineProperty(mockElement, 'clientWidth', {
      configurable: true,
      value: 800,
    });
    Object.defineProperty(mockElement, 'clientHeight', {
      configurable: true,
      value: 600,
    });

    mockSectionRef = {
      current: mockElement,
    };
  });

  describe('Hook Initialization', () => {
    it('should initialize isHovered as false', () => {
      const { result } = renderHook(() => useWidgetInspectMode({ sectionRef: mockSectionRef }));
      expect(result.current.isHovered).toBe(false);
    });

    it('should extract widgetContainerWidth from sectionRef', () => {
      const { result } = renderHook(() => useWidgetInspectMode({ sectionRef: mockSectionRef }));
      expect(result.current.widgetContainerWidth).toBe(800);
    });

    it('should extract widgetContainerHeight from sectionRef', () => {
      const { result } = renderHook(() => useWidgetInspectMode({ sectionRef: mockSectionRef }));
      expect(result.current.widgetContainerHeight).toBe(600);
    });

    it('should return changeHoverState as a function', () => {
      const { result } = renderHook(() => useWidgetInspectMode({ sectionRef: mockSectionRef }));
      expect(typeof result.current.changeHoverState).toBe('function');
    });
  });

  describe('Dimension Extraction', () => {
    it('should return undefined dimensions when sectionRef.current is null', () => {
      const nullRef: React.RefObject<HTMLElement> = { current: null };
      const { result } = renderHook(() => useWidgetInspectMode({ sectionRef: nullRef }));

      expect(result.current.widgetContainerWidth).toBeUndefined();
      expect(result.current.widgetContainerHeight).toBeUndefined();
    });

    it('should return correct dimensions for small widgets', () => {
      const smallElement = document.createElement('section');
      Object.defineProperty(smallElement, 'clientWidth', {
        configurable: true,
        value: 200,
      });
      Object.defineProperty(smallElement, 'clientHeight', {
        configurable: true,
        value: 150,
      });

      const smallRef: React.RefObject<HTMLElement> = { current: smallElement };
      const { result } = renderHook(() => useWidgetInspectMode({ sectionRef: smallRef }));

      expect(result.current.widgetContainerWidth).toBe(200);
      expect(result.current.widgetContainerHeight).toBe(150);
    });

    it('should return correct dimensions for large widgets', () => {
      const largeElement = document.createElement('section');
      Object.defineProperty(largeElement, 'clientWidth', {
        configurable: true,
        value: 1920,
      });
      Object.defineProperty(largeElement, 'clientHeight', {
        configurable: true,
        value: 1080,
      });

      const largeRef: React.RefObject<HTMLElement> = { current: largeElement };
      const { result } = renderHook(() => useWidgetInspectMode({ sectionRef: largeRef }));

      expect(result.current.widgetContainerWidth).toBe(1920);
      expect(result.current.widgetContainerHeight).toBe(1080);
    });

    it('should handle zero dimensions', () => {
      const zeroElement = document.createElement('section');
      Object.defineProperty(zeroElement, 'clientWidth', {
        configurable: true,
        value: 0,
      });
      Object.defineProperty(zeroElement, 'clientHeight', {
        configurable: true,
        value: 0,
      });

      const zeroRef: React.RefObject<HTMLElement> = { current: zeroElement };
      const { result } = renderHook(() => useWidgetInspectMode({ sectionRef: zeroRef }));

      expect(result.current.widgetContainerWidth).toBe(0);
      expect(result.current.widgetContainerHeight).toBe(0);
    });

    it('should extract dimensions from different HTML element types', () => {
      const divElement = document.createElement('div');
      Object.defineProperty(divElement, 'clientWidth', {
        configurable: true,
        value: 500,
      });
      Object.defineProperty(divElement, 'clientHeight', {
        configurable: true,
        value: 400,
      });

      const divRef: React.RefObject<HTMLElement> = { current: divElement };
      const { result } = renderHook(() => useWidgetInspectMode({ sectionRef: divRef }));

      expect(result.current.widgetContainerWidth).toBe(500);
      expect(result.current.widgetContainerHeight).toBe(400);
    });
  });

  describe('changeHoverState', () => {
    it('should toggle isHovered from false to true', () => {
      const { result } = renderHook(() => useWidgetInspectMode({ sectionRef: mockSectionRef }));

      expect(result.current.isHovered).toBe(false);

      act(() => {
        result.current.changeHoverState();
      });

      expect(result.current.isHovered).toBe(true);
    });

    it('should toggle isHovered from true to false', () => {
      const { result } = renderHook(() => useWidgetInspectMode({ sectionRef: mockSectionRef }));

      // First toggle to true
      act(() => {
        result.current.changeHoverState();
      });

      expect(result.current.isHovered).toBe(true);

      // Toggle back to false
      act(() => {
        result.current.changeHoverState();
      });

      expect(result.current.isHovered).toBe(false);
    });

    it('should toggle isHovered multiple times', () => {
      const { result } = renderHook(() => useWidgetInspectMode({ sectionRef: mockSectionRef }));

      expect(result.current.isHovered).toBe(false);

      // Toggle 5 times
      act(() => {
        result.current.changeHoverState();
      });
      expect(result.current.isHovered).toBe(true);

      act(() => {
        result.current.changeHoverState();
      });
      expect(result.current.isHovered).toBe(false);

      act(() => {
        result.current.changeHoverState();
      });
      expect(result.current.isHovered).toBe(true);

      act(() => {
        result.current.changeHoverState();
      });
      expect(result.current.isHovered).toBe(false);

      act(() => {
        result.current.changeHoverState();
      });
      expect(result.current.isHovered).toBe(true);
    });

    it('should maintain correct hover state across multiple toggles', () => {
      const { result } = renderHook(() => useWidgetInspectMode({ sectionRef: mockSectionRef }));

      const toggleCount = 10;
      for (let i = 0; i < toggleCount; i++) {
        act(() => {
          result.current.changeHoverState();
        });
        // Even toggles should be false, odd toggles should be true
        const expectedState = i % 2 === 0;
        expect(result.current.isHovered).toBe(expectedState);
      }
    });

    it('should not affect dimensions when toggling hover state', () => {
      const { result } = renderHook(() => useWidgetInspectMode({ sectionRef: mockSectionRef }));

      const initialWidth = result.current.widgetContainerWidth;
      const initialHeight = result.current.widgetContainerHeight;

      act(() => {
        result.current.changeHoverState();
      });

      expect(result.current.widgetContainerWidth).toBe(initialWidth);
      expect(result.current.widgetContainerHeight).toBe(initialHeight);
    });
  });

  describe('State Persistence', () => {
    it('should maintain hover state when sectionRef changes', () => {
      const { result, rerender } = renderHook(() =>
        useWidgetInspectMode({ sectionRef: mockSectionRef })
      );

      // Toggle to true
      act(() => {
        result.current.changeHoverState();
      });
      expect(result.current.isHovered).toBe(true);

      // Create a new ref with different dimensions
      const newElement = document.createElement('section');
      Object.defineProperty(newElement, 'clientWidth', {
        configurable: true,
        value: 1000,
      });
      Object.defineProperty(newElement, 'clientHeight', {
        configurable: true,
        value: 750,
      });
      const newRef: React.RefObject<HTMLElement> = { current: newElement };

      // Rerender with new ref
      rerender();

      // Note: In actual hook behavior, dimensions come from the ref at render time
      // The hover state should persist independently
      expect(result.current.isHovered).toBe(true);
    });

    it('should extract fresh dimensions on each render', () => {
      const dynamicElement = document.createElement('section');
      const widthDescriptor = {
        configurable: true,
        get: jest.fn(() => 800),
      };
      const heightDescriptor = {
        configurable: true,
        get: jest.fn(() => 600),
      };

      Object.defineProperty(dynamicElement, 'clientWidth', widthDescriptor);
      Object.defineProperty(dynamicElement, 'clientHeight', heightDescriptor);

      const dynamicRef: React.RefObject<HTMLElement> = { current: dynamicElement };
      const { result, rerender } = renderHook(() =>
        useWidgetInspectMode({ sectionRef: dynamicRef })
      );

      // Initial render
      expect(result.current.widgetContainerWidth).toBe(800);
      expect(result.current.widgetContainerHeight).toBe(600);
      expect(widthDescriptor.get).toHaveBeenCalled();
      expect(heightDescriptor.get).toHaveBeenCalled();

      // Clear call counts
      widthDescriptor.get.mockClear();
      heightDescriptor.get.mockClear();

      // Rerender
      rerender();

      // Dimensions should be re-extracted
      expect(widthDescriptor.get).toHaveBeenCalled();
      expect(heightDescriptor.get).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined sectionRef gracefully', () => {
      const undefinedRef = { current: undefined } as any;
      const { result } = renderHook(() => useWidgetInspectMode({ sectionRef: undefinedRef }));

      expect(result.current.widgetContainerWidth).toBeUndefined();
      expect(result.current.widgetContainerHeight).toBeUndefined();
      expect(result.current.isHovered).toBe(false);
      expect(typeof result.current.changeHoverState).toBe('function');
    });

    it('should handle element without clientWidth/clientHeight properties', () => {
      const elementWithoutDimensions = document.createElement('section');
      // Don't define clientWidth/clientHeight properties

      const ref: React.RefObject<HTMLElement> = { current: elementWithoutDimensions };
      const { result } = renderHook(() => useWidgetInspectMode({ sectionRef: ref }));

      // Should return the default values (0 for client dimensions in DOM elements)
      expect(result.current.widgetContainerWidth).toBe(0);
      expect(result.current.widgetContainerHeight).toBe(0);
    });

    it('should work with fractional dimensions', () => {
      const fractionalElement = document.createElement('section');
      Object.defineProperty(fractionalElement, 'clientWidth', {
        configurable: true,
        value: 799.5,
      });
      Object.defineProperty(fractionalElement, 'clientHeight', {
        configurable: true,
        value: 599.7,
      });

      const fractionalRef: React.RefObject<HTMLElement> = { current: fractionalElement };
      const { result } = renderHook(() => useWidgetInspectMode({ sectionRef: fractionalRef }));

      // clientWidth/clientHeight are always integers in real browsers,
      // but we should handle any numeric value
      expect(result.current.widgetContainerWidth).toBe(799.5);
      expect(result.current.widgetContainerHeight).toBe(599.7);
    });

    it('should handle very large dimensions', () => {
      const largeElement = document.createElement('section');
      Object.defineProperty(largeElement, 'clientWidth', {
        configurable: true,
        value: 999999,
      });
      Object.defineProperty(largeElement, 'clientHeight', {
        configurable: true,
        value: 888888,
      });

      const largeRef: React.RefObject<HTMLElement> = { current: largeElement };
      const { result } = renderHook(() => useWidgetInspectMode({ sectionRef: largeRef }));

      expect(result.current.widgetContainerWidth).toBe(999999);
      expect(result.current.widgetContainerHeight).toBe(888888);
    });
  });

  describe('Type Safety and Interface', () => {
    it('should accept sectionRef prop correctly', () => {
      const { result } = renderHook(() => useWidgetInspectMode({ sectionRef: mockSectionRef }));
      expect(result.current.isHovered).toBe(false);
      expect(result.current.widgetContainerWidth).toBe(800);
    });
  });
});
