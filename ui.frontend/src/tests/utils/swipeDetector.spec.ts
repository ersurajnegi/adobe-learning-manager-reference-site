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
 * Unit tests for swipeDetector utility
 * Tests swipe gesture detection on touch devices
 */

import { swipeEvents } from '@almLib/utils/swipeDetector';

describe('swipeDetector - swipeEvents', () => {
  let mockElement: HTMLElement;
  let mockCallback: jest.Mock;
  let touchStartEvent: TouchEvent;
  let touchMoveEvent: TouchEvent;
  let touchEndEvent: TouchEvent;

  beforeEach(() => {
    // Create mock element
    mockElement = document.createElement('div');
    mockCallback = jest.fn();

    // Mock touch events
    touchStartEvent = new TouchEvent('touchstart', {
      touches: [{ screenX: 100, screenY: 100 } as Touch],
    });

    touchMoveEvent = new TouchEvent('touchmove', {
      touches: [{ screenX: 200, screenY: 100 } as Touch],
    });

    touchEndEvent = new TouchEvent('touchend', {
      target: mockElement,
    });
  });

  it('should detect right swipe', () => {
    swipeEvents(mockElement, [], mockCallback);

    // Simulate swipe right
    mockElement.dispatchEvent(
      new TouchEvent('touchstart', {
        touches: [{ screenX: 100, screenY: 100 } as Touch],
      })
    );

    mockElement.dispatchEvent(
      new TouchEvent('touchmove', {
        touches: [{ screenX: 250, screenY: 100 } as Touch],
      })
    );

    mockElement.dispatchEvent(
      new TouchEvent('touchend', {
        target: mockElement,
      })
    );

    expect(mockCallback).toHaveBeenCalledWith('right');
  });

  it('should detect left swipe', () => {
    swipeEvents(mockElement, [], mockCallback);

    // Simulate swipe left
    mockElement.dispatchEvent(
      new TouchEvent('touchstart', {
        touches: [{ screenX: 250, screenY: 100 } as Touch],
      })
    );

    mockElement.dispatchEvent(
      new TouchEvent('touchmove', {
        touches: [{ screenX: 100, screenY: 100 } as Touch],
      })
    );

    mockElement.dispatchEvent(
      new TouchEvent('touchend', {
        target: mockElement,
      })
    );

    expect(mockCallback).toHaveBeenCalledWith('left');
  });

  it('should not trigger callback for small movements below deltaMin', () => {
    swipeEvents(mockElement, [], mockCallback, 90);

    // Simulate small movement (less than deltaMin of 90)
    mockElement.dispatchEvent(
      new TouchEvent('touchstart', {
        touches: [{ screenX: 100, screenY: 100 } as Touch],
      })
    );

    mockElement.dispatchEvent(
      new TouchEvent('touchmove', {
        touches: [{ screenX: 130, screenY: 100 } as Touch],
      })
    );

    mockElement.dispatchEvent(
      new TouchEvent('touchend', {
        target: mockElement,
      })
    );

    expect(mockCallback).not.toHaveBeenCalled();
  });

  it('should use custom deltaMin parameter', () => {
    const customDeltaMin = 50;
    swipeEvents(mockElement, [], mockCallback, customDeltaMin);

    // Simulate movement above custom deltaMin
    mockElement.dispatchEvent(
      new TouchEvent('touchstart', {
        touches: [{ screenX: 100, screenY: 100 } as Touch],
      })
    );

    mockElement.dispatchEvent(
      new TouchEvent('touchmove', {
        touches: [{ screenX: 160, screenY: 100 } as Touch],
      })
    );

    mockElement.dispatchEvent(
      new TouchEvent('touchend', {
        target: mockElement,
      })
    );

    expect(mockCallback).toHaveBeenCalledWith('right');
  });

  it('should not trigger callback for vertical swipes', () => {
    swipeEvents(mockElement, [], mockCallback);

    // Simulate vertical swipe (should be ignored)
    mockElement.dispatchEvent(
      new TouchEvent('touchstart', {
        touches: [{ screenX: 100, screenY: 100 } as Touch],
      })
    );

    mockElement.dispatchEvent(
      new TouchEvent('touchmove', {
        touches: [{ screenX: 100, screenY: 250 } as Touch],
      })
    );

    mockElement.dispatchEvent(
      new TouchEvent('touchend', {
        target: mockElement,
      })
    );

    expect(mockCallback).not.toHaveBeenCalled();
  });

  it('should not trigger callback if touch ends on excluded element', () => {
    const excludedElement = document.createElement('button');
    // Add excluded element as child of mockElement so events can bubble
    mockElement.appendChild(excludedElement);
    
    swipeEvents(mockElement, [excludedElement], mockCallback);

    // Simulate swipe - start and move on mockElement
    mockElement.dispatchEvent(
      new TouchEvent('touchstart', {
        touches: [{ screenX: 100, screenY: 100 } as Touch],
        bubbles: true,
      })
    );

    mockElement.dispatchEvent(
      new TouchEvent('touchmove', {
        touches: [{ screenX: 250, screenY: 100 } as Touch],
        bubbles: true,
      })
    );

    // End on excluded element - event will bubble to mockElement
    excludedElement.dispatchEvent(
      new TouchEvent('touchend', {
        bubbles: true,
      })
    );

    expect(mockCallback).not.toHaveBeenCalled();
  });

  it('should not trigger callback if touch ends on child of excluded element', () => {
    const excludedElement = document.createElement('div');
    const childElement = document.createElement('span');
    
    // Set up DOM structure: mockElement > excludedElement > childElement
    excludedElement.appendChild(childElement);
    mockElement.appendChild(excludedElement);

    swipeEvents(mockElement, [excludedElement], mockCallback);

    // Simulate swipe - start and move on mockElement
    mockElement.dispatchEvent(
      new TouchEvent('touchstart', {
        touches: [{ screenX: 100, screenY: 100 } as Touch],
        bubbles: true,
      })
    );

    mockElement.dispatchEvent(
      new TouchEvent('touchmove', {
        touches: [{ screenX: 250, screenY: 100 } as Touch],
        bubbles: true,
      })
    );

    // End on child element - event will bubble to mockElement
    childElement.dispatchEvent(
      new TouchEvent('touchend', {
        bubbles: true,
      })
    );

    expect(mockCallback).not.toHaveBeenCalled();
  });

  it('should not trigger callback if touch ends on grandchild of excluded element', () => {
    const excludedElement = document.createElement('div');
    const childElement = document.createElement('span');
    const grandchildElement = document.createElement('a');
    
    // Set up DOM structure: mockElement > excludedElement > childElement > grandchildElement
    childElement.appendChild(grandchildElement);
    excludedElement.appendChild(childElement);
    mockElement.appendChild(excludedElement);

    swipeEvents(mockElement, [excludedElement], mockCallback);

    // Simulate swipe - start and move on mockElement
    mockElement.dispatchEvent(
      new TouchEvent('touchstart', {
        touches: [{ screenX: 100, screenY: 100 } as Touch],
        bubbles: true,
      })
    );

    mockElement.dispatchEvent(
      new TouchEvent('touchmove', {
        touches: [{ screenX: 250, screenY: 100 } as Touch],
        bubbles: true,
      })
    );

    // End on grandchild element - event will bubble to mockElement
    grandchildElement.dispatchEvent(
      new TouchEvent('touchend', {
        bubbles: true,
      })
    );

    expect(mockCallback).not.toHaveBeenCalled();
  });

  it('should trigger callback if ancestor is beyond 3 levels from excluded element', () => {
    const excludedElement = document.createElement('div');
    const level1 = document.createElement('div');
    const level2 = document.createElement('div');
    const level3 = document.createElement('div');
    const level4 = document.createElement('div'); // Beyond 3 levels
    
    // Set up DOM structure: mockElement > excludedElement > level1 > level2 > level3 > level4
    level3.appendChild(level4);
    level2.appendChild(level3);
    level1.appendChild(level2);
    excludedElement.appendChild(level1);
    mockElement.appendChild(excludedElement);

    swipeEvents(mockElement, [excludedElement], mockCallback);

    // Simulate swipe - start and move on mockElement
    mockElement.dispatchEvent(
      new TouchEvent('touchstart', {
        touches: [{ screenX: 100, screenY: 100 } as Touch],
        bubbles: true,
      })
    );

    mockElement.dispatchEvent(
      new TouchEvent('touchmove', {
        touches: [{ screenX: 250, screenY: 100 } as Touch],
        bubbles: true,
      })
    );

    // End on level4 (4 levels deep from excluded element)
    // The function checks up to 3 levels: level4 -> level3 -> level2 -> level1
    // It stops at 3 levels and never reaches excludedElement, so callback should trigger
    level4.dispatchEvent(
      new TouchEvent('touchend', {
        bubbles: true,
      })
    );

    expect(mockCallback).toHaveBeenCalledWith('right');
  });

  it('should handle multiple excluded elements', () => {
    const excludedElement1 = document.createElement('button');
    const excludedElement2 = document.createElement('div');
    
    // Add both excluded elements as children of mockElement
    mockElement.appendChild(excludedElement1);
    mockElement.appendChild(excludedElement2);

    swipeEvents(mockElement, [excludedElement1, excludedElement2], mockCallback);

    // Test with first excluded element
    mockElement.dispatchEvent(
      new TouchEvent('touchstart', {
        touches: [{ screenX: 100, screenY: 100 } as Touch],
        bubbles: true,
      })
    );

    mockElement.dispatchEvent(
      new TouchEvent('touchmove', {
        touches: [{ screenX: 250, screenY: 100 } as Touch],
        bubbles: true,
      })
    );

    excludedElement1.dispatchEvent(
      new TouchEvent('touchend', {
        bubbles: true,
      })
    );

    expect(mockCallback).not.toHaveBeenCalled();

    // Reset mock for second test
    mockCallback.mockClear();

    // Test with second excluded element
    mockElement.dispatchEvent(
      new TouchEvent('touchstart', {
        touches: [{ screenX: 100, screenY: 100 } as Touch],
        bubbles: true,
      })
    );

    mockElement.dispatchEvent(
      new TouchEvent('touchmove', {
        touches: [{ screenX: 250, screenY: 100 } as Touch],
        bubbles: true,
      })
    );

    excludedElement2.dispatchEvent(
      new TouchEvent('touchend', {
        bubbles: true,
      })
    );

    expect(mockCallback).not.toHaveBeenCalled();
  });

  it('should handle diagonal swipes correctly', () => {
    swipeEvents(mockElement, [], mockCallback);

    // Simulate diagonal swipe with more horizontal than vertical movement
    mockElement.dispatchEvent(
      new TouchEvent('touchstart', {
        touches: [{ screenX: 100, screenY: 100 } as Touch],
      })
    );

    mockElement.dispatchEvent(
      new TouchEvent('touchmove', {
        touches: [{ screenX: 250, screenY: 130 } as Touch],
      })
    );

    mockElement.dispatchEvent(
      new TouchEvent('touchend', {
        target: mockElement,
      })
    );

    expect(mockCallback).toHaveBeenCalledWith('right');
  });

  it('should not trigger for diagonal swipes with more vertical movement', () => {
    swipeEvents(mockElement, [], mockCallback);

    // Simulate diagonal swipe with more vertical than horizontal movement
    mockElement.dispatchEvent(
      new TouchEvent('touchstart', {
        touches: [{ screenX: 100, screenY: 100 } as Touch],
      })
    );

    mockElement.dispatchEvent(
      new TouchEvent('touchmove', {
        touches: [{ screenX: 130, screenY: 250 } as Touch],
      })
    );

    mockElement.dispatchEvent(
      new TouchEvent('touchend', {
        target: mockElement,
      })
    );

    expect(mockCallback).not.toHaveBeenCalled();
  });

  it('should handle case where deltaY is zero', () => {
    swipeEvents(mockElement, [], mockCallback);

    // Simulate perfectly horizontal swipe (deltaY = 0)
    mockElement.dispatchEvent(
      new TouchEvent('touchstart', {
        touches: [{ screenX: 100, screenY: 100 } as Touch],
      })
    );

    mockElement.dispatchEvent(
      new TouchEvent('touchmove', {
        touches: [{ screenX: 250, screenY: 100 } as Touch],
      })
    );

    mockElement.dispatchEvent(
      new TouchEvent('touchend', {
        target: mockElement,
      })
    );

    expect(mockCallback).toHaveBeenCalledWith('right');
  });

  it('should only call callback if func is a function', () => {
    const notAFunction = 'not a function' as any;

    // Register a real function first to confirm it would fire for a valid swipe
    const validCallback = jest.fn();
    swipeEvents(mockElement, [], validCallback);

    // Then register the non-function — this should NOT replace or break the listener
    swipeEvents(mockElement, [], notAFunction);

    mockElement.dispatchEvent(
      new TouchEvent('touchstart', {
        touches: [{ screenX: 100, screenY: 100 } as Touch],
      })
    );

    mockElement.dispatchEvent(
      new TouchEvent('touchmove', {
        touches: [{ screenX: 250, screenY: 100 } as Touch],
      })
    );

    mockElement.dispatchEvent(
      new TouchEvent('touchend', {
        target: mockElement,
      })
    );

    // The non-function guard prevents a TypeError; validCallback still fires from its own listener
    expect(validCallback).toHaveBeenCalledWith('right');
  });
});

