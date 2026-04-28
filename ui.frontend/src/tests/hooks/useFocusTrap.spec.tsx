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
import React from 'react';
import { render, act } from '@testing-library/react';
import { useFocusTrap } from '@hooks/useFocusTrap';

// Test component that renders a container with focusable children
interface TestProps {
  isOpen: boolean;
  onClose?: () => void;
  onKeyDown?: (e: KeyboardEvent, container: HTMLElement) => void;
  onArrowNavigation?: (e: KeyboardEvent, container: HTMLElement) => void;
  preventScroll?: boolean;
  restoreFocus?: boolean;
  initialFocusIndex?: number;
}

function FocusTrapTestComponent({
  isOpen,
  onClose,
  onKeyDown,
  onArrowNavigation,
  preventScroll,
  restoreFocus,
  initialFocusIndex,
}: TestProps) {
  const containerRef = useFocusTrap<HTMLDivElement>({
    isOpen,
    onClose,
    onKeyDown,
    onArrowNavigation,
    preventScroll,
    restoreFocus,
    initialFocusIndex,
  });
  return (
    <div ref={containerRef} data-testid="trap-container">
      <button data-testid="btn-1">Button 1</button>
      <button data-testid="btn-2">Button 2</button>
      <button data-testid="btn-3">Button 3</button>
    </div>
  );
}

function pressKey(element: HTMLElement, key: string, extras?: Partial<KeyboardEventInit>) {
  element.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...extras }));
}

describe('useFocusTrap', () => {
  describe('Scroll lock', () => {
    it('isOpen_true_setsBodyOverflowHidden', () => {
      render(<FocusTrapTestComponent isOpen={true} preventScroll={true} />);
      expect(document.body.style.overflow).toBe('hidden');
    });

    it('isOpen_false_doesNotLockBodyScroll', () => {
      document.body.style.overflow = '';
      render(<FocusTrapTestComponent isOpen={false} preventScroll={true} />);
      expect(document.body.style.overflow).toBe('');
    });

    it('preventScroll_false_doesNotModifyBodyOverflow', () => {
      document.body.style.overflow = '';
      render(<FocusTrapTestComponent isOpen={true} preventScroll={false} />);
      expect(document.body.style.overflow).toBe('');
    });
  });

  describe('Scroll restore on close', () => {
    it('isOpen_changesFromTrueToFalse_restoresBodyOverflow', () => {
      const { rerender } = render(
        <FocusTrapTestComponent isOpen={true} preventScroll={true} />
      );
      expect(document.body.style.overflow).toBe('hidden');

      act(() => {
        rerender(<FocusTrapTestComponent isOpen={false} preventScroll={true} />);
      });

      expect(document.body.style.overflow).toBe('');
    });
  });

  describe('Cleanup on unmount', () => {
    it('unmount_withPreventScroll_clearsBodyOverflow', () => {
      const { unmount } = render(
        <FocusTrapTestComponent isOpen={true} preventScroll={true} />
      );
      expect(document.body.style.overflow).toBe('hidden');

      act(() => { unmount(); });

      expect(document.body.style.overflow).toBe('');
    });
  });

  describe('Escape key', () => {
    it('escapeKey_pressed_callsOnClose', () => {
      const onClose = jest.fn();
      const { getByTestId } = render(
        <FocusTrapTestComponent isOpen={true} onClose={onClose} />
      );

      pressKey(getByTestId('trap-container'), 'Escape');

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('escapeKey_isOpenFalse_doesNotCallOnClose', () => {
      const onClose = jest.fn();
      const { getByTestId } = render(
        <FocusTrapTestComponent isOpen={false} onClose={onClose} />
      );

      pressKey(getByTestId('trap-container'), 'Escape');

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('Tab cycling', () => {
    it('tab_onLastElement_movesFocusToFirstElement', () => {
      const { getByTestId } = render(
        <FocusTrapTestComponent isOpen={true} />
      );

      const btn3 = getByTestId('btn-3') as HTMLElement;
      btn3.focus();
      // Verify focus is on btn3 (document.activeElement = last element)
      expect(document.activeElement).toBe(btn3);

      pressKey(getByTestId('trap-container'), 'Tab', { shiftKey: false });

      // Focus should wrap to the first focusable element
      expect(document.activeElement?.getAttribute('data-testid')).toBe('btn-1');
    });

    it('shiftTab_onFirstElement_movesFocusToLastElement', () => {
      const { getByTestId } = render(
        <FocusTrapTestComponent isOpen={true} />
      );

      const btn1 = getByTestId('btn-1') as HTMLElement;
      btn1.focus();
      // Verify focus is on btn1 (document.activeElement = first element)
      expect(document.activeElement).toBe(btn1);

      pressKey(getByTestId('trap-container'), 'Tab', { shiftKey: true });

      expect(document.activeElement?.getAttribute('data-testid')).toBe('btn-3');
    });
  });

  describe('Arrow navigation', () => {
    it('arrowDown_onArrowNavigationProvided_callsHandler', () => {
      const onArrowNavigation = jest.fn();
      const { getByTestId } = render(
        <FocusTrapTestComponent isOpen={true} onArrowNavigation={onArrowNavigation} />
      );

      pressKey(getByTestId('trap-container'), 'ArrowDown');

      expect(onArrowNavigation).toHaveBeenCalledTimes(1);
    });

    it('arrowUp_onArrowNavigationProvided_callsHandler', () => {
      const onArrowNavigation = jest.fn();
      const { getByTestId } = render(
        <FocusTrapTestComponent isOpen={true} onArrowNavigation={onArrowNavigation} />
      );

      pressKey(getByTestId('trap-container'), 'ArrowUp');

      expect(onArrowNavigation).toHaveBeenCalledTimes(1);
    });
  });

  describe('Custom onKeyDown handler', () => {
    it('onKeyDown_provided_isCalledBeforeDefaultHandling', () => {
      const onKeyDown = jest.fn();
      const onClose = jest.fn();
      const { getByTestId } = render(
        <FocusTrapTestComponent isOpen={true} onKeyDown={onKeyDown} onClose={onClose} />
      );

      pressKey(getByTestId('trap-container'), 'Escape');

      expect(onKeyDown).toHaveBeenCalledTimes(1);
    });

    it('onKeyDown_preventDefaultCalled_skipsDefaultHandling', () => {
      const onKeyDown = jest.fn((e: KeyboardEvent) => { e.preventDefault(); });
      const onClose = jest.fn();
      const { getByTestId } = render(
        <FocusTrapTestComponent isOpen={true} onKeyDown={onKeyDown} onClose={onClose} />
      );

      pressKey(getByTestId('trap-container'), 'Escape');

      // onKeyDown prevented default, so onClose should not be called
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('Event listener cleanup', () => {
    it('unmount_removesKeydownEventListener', () => {
      const removeSpy = jest.spyOn(HTMLElement.prototype, 'removeEventListener');
      const { unmount } = render(<FocusTrapTestComponent isOpen={true} />);

      act(() => { unmount(); });

      expect(removeSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
      removeSpy.mockRestore();
    });
  });
});
