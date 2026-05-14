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
import { useEffect, useRef } from 'react';

interface FocusableElement extends HTMLElement {
  disabled?: boolean;
}

export interface UseFocusTrapOptions {
  isOpen: boolean;
  onClose?: () => void;
  focusableSelectors?: string;
  onKeyDown?: (e: KeyboardEvent, container: HTMLElement) => void;
  onArrowNavigation?: (e: KeyboardEvent, container: HTMLElement) => void;
  preventScroll?: boolean;
  initialFocusIndex?: number;
  restoreFocus?: boolean;
}

export const useFocusTrap = <T extends HTMLElement>({
  isOpen,
  onClose,
  focusableSelectors = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
  onKeyDown,
  onArrowNavigation,
  preventScroll = true,
  initialFocusIndex = 0,
  restoreFocus = true,
}: UseFocusTrapOptions) => {
  const containerRef = useRef<T | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      if (preventScroll) {
        document.body.style.overflow = 'hidden';
      }
    } else if (restoreFocus && previousFocusRef.current) {
      previousFocusRef.current.focus();
      if (preventScroll) {
        document.body.style.overflow = '';
      }
    }

    return () => {
      if (preventScroll) {
        document.body.style.overflow = '';
      }
    };
  }, [isOpen, preventScroll, restoreFocus]);

  useEffect(() => {
    if (!isOpen || !containerRef.current) return;

    const container = containerRef.current;

    const getFocusableElements = () => {
      const elements = container.querySelectorAll<FocusableElement>(focusableSelectors);
      return Array.from(elements).filter(el => {
        const style = window.getComputedStyle(el);
        return (
          !el.disabled &&
          style.display !== 'none' &&
          style.visibility !== 'hidden' &&
          style.opacity !== '0'
        );
      });
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (onKeyDown) {
        onKeyDown(e, container);
        if (e.defaultPrevented) return;
      }

      // Handle arrow navigation if provided
      if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && onArrowNavigation) {
        onArrowNavigation(e, container);
        if (e.defaultPrevented) return;
      }

      switch (e.key) {
        case 'Tab': {
          const focusableElements = getFocusableElements();
          const firstFocusable = focusableElements[0];
          const lastFocusable = focusableElements[focusableElements.length - 1];
          const activeElement = document.activeElement;

          if (!e.shiftKey && activeElement === lastFocusable) {
            e.preventDefault();
            firstFocusable?.focus();
          } else if (e.shiftKey && activeElement === firstFocusable) {
            e.preventDefault();
            lastFocusable?.focus();
          }
          break;
        }

        case 'Escape':
          if (onClose) {
            e.preventDefault();
            onClose();
          }
          break;
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    // Set initial focus
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      const initialFocusElement =
        focusableElements[Math.min(initialFocusIndex, focusableElements.length - 1)];
      initialFocusElement?.focus();
    }

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, onKeyDown, onArrowNavigation, focusableSelectors, initialFocusIndex]);

  return containerRef;
};
