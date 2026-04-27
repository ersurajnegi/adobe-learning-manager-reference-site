/**
Copyright 2021 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/
import { render, act } from '@testing-library/react';
import ALMGoToTop from '@components/ALMGoToTop/ALMGoToTop';

const mockAddEventListener = jest.fn();
const mockRemoveEventListener = jest.fn();
const mockScrollTo = jest.fn();
const mockDebouncedFn = jest.fn();

jest.mock('@utils/global', () => ({
  getWindowObject: jest.fn(() => ({
    addEventListener: mockAddEventListener,
    removeEventListener: mockRemoveEventListener,
    scrollTo: mockScrollTo,
  })),
}));

jest.mock('@utils/catalog', () => ({
  debounce: jest.fn((fn) => {
    mockDebouncedFn.mockImplementation(fn);
    return mockDebouncedFn;
  }),
}));

jest.mock('@utils/inline_svg', () => ({
  LEFT_ARROW_SVG: () => <svg data-testid="go-to-top-icon" />,
}));

describe('ALMGoToTop', () => {
  beforeAll(() => {
    Object.defineProperty(document.documentElement, 'scrollTop', {
      configurable: true,
      writable: true,
      value: 0,
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    document.documentElement.scrollTop = 0;
    const { debounce } = require('@utils/catalog');
    (debounce as jest.Mock).mockImplementation((fn: any) => {
      mockDebouncedFn.mockImplementation(fn);
      return mockDebouncedFn;
    });
    const { getWindowObject } = require('@utils/global');
    (getWindowObject as jest.Mock).mockReturnValue({
      addEventListener: mockAddEventListener,
      removeEventListener: mockRemoveEventListener,
      scrollTo: mockScrollTo,
    });
  });

  it('render_initial_buttonHidden', () => {
    const { container } = render(<ALMGoToTop />);
    const button = container.querySelector('button');

    expect(button?.className).toContain('goToTopButton');
    expect(button?.className).not.toContain('show');
  });

  it('scroll_aboveThreshold_showsButton', () => {
    const { container } = render(<ALMGoToTop />);

    act(() => {
      document.documentElement.scrollTop = 350;
      mockDebouncedFn();
    });

    const button = container.querySelector('button');
    expect(button?.className).toContain('show');
    expect(button?.className).toContain('fixedButton');
  });

  it('scroll_atThreshold_buttonHidden', () => {
    const { container } = render(<ALMGoToTop />);

    act(() => {
      document.documentElement.scrollTop = 300;
      mockDebouncedFn();
    });

    expect(container.querySelector('button')?.className).not.toContain('show');
  });

  it('scroll_justAboveThreshold_showsButton', () => {
    const { container } = render(<ALMGoToTop />);

    act(() => {
      document.documentElement.scrollTop = 301;
      mockDebouncedFn();
    });

    expect(container.querySelector('button')?.className).toContain('show');
  });

  it('scroll_aboveThenBelow_hidesButton', () => {
    const { container } = render(<ALMGoToTop />);

    act(() => {
      document.documentElement.scrollTop = 400;
      mockDebouncedFn();
    });
    expect(container.querySelector('button')?.className).toContain('show');

    act(() => {
      document.documentElement.scrollTop = 200;
      mockDebouncedFn();
    });
    expect(container.querySelector('button')?.className).not.toContain('show');
  });

  it('click_scrollsToTopSmooth', () => {
    const { container } = render(<ALMGoToTop />);

    container.querySelector('button')!.click();

    expect(mockScrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
  });

  it('mount_registersScrollListenerWithDebounce', () => {
    const { debounce } = require('@utils/catalog');
    render(<ALMGoToTop />);

    expect(debounce).toHaveBeenCalledWith(expect.any(Function), 100);
    expect(mockAddEventListener).toHaveBeenCalledWith('scroll', mockDebouncedFn);
  });

  it('unmount_removesExactScrollListenerAdded', () => {
    const { unmount } = render(<ALMGoToTop />);
    expect(mockAddEventListener).toHaveBeenCalledWith('scroll', mockDebouncedFn);

    unmount();

    expect(mockRemoveEventListener).toHaveBeenCalledWith('scroll', mockDebouncedFn);
  });
});
