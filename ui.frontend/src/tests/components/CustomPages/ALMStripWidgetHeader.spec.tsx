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
jest.mock('@utils/translationService');

import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import ALMStripWidgetHeader from '@components/CustomPages/ALMStripWidgetHeader/ALMStripWidgetHeader';
import { GetTranslation } from '@utils/translationService';

const mockGetTranslation = GetTranslation as jest.MockedFunction<typeof GetTranslation>;

const defaultProps = {
  heading: 'Test Heading',
  widgetId: 'widget-123',
  widgetDescription: 'Test description',
  isLeftNavIconDisabled: false,
  isRightNavIconDisabled: false,
  rollAPage: jest.fn(),
  showNavIcons: true,
};

const renderHeader = (props: Partial<typeof defaultProps> = {}) =>
  render(<ALMStripWidgetHeader {...defaultProps} {...props} />);

describe('ALMStripWidgetHeader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetTranslation.mockImplementation((key: string) => `t:${key}`);
  });

  it('returns null when heading is falsy', () => {
    const { container } = renderHeader({ heading: '' });
    expect(container.firstChild).toBeNull();
  });

  describe('Heading', () => {
    it('renders heading via dangerouslySetInnerHTML with correct attributes', () => {
      const { container } = renderHeader();
      const h2 = container.querySelector('h2')!;
      expect(h2.innerHTML).toBe('Test Heading');
      expect(h2.getAttribute('title')).toBe('Test Heading');
      expect(h2.getAttribute('aria-label')).toBe('Test Heading');
      expect(h2.getAttribute('data-automationid')).toBe('cb-title-Test Heading');
      expect(h2.getAttribute('data-skip-link-target')).toBe('widget-123');
      expect(h2.getAttribute('tabindex')).toBe('-1');
    });

    it('renders HTML markup in heading via dangerouslySetInnerHTML', () => {
      const { container } = renderHeader({ heading: '<strong>Bold</strong>' });
      expect(container.querySelector('h2')!.innerHTML).toBe('<strong>Bold</strong>');
    });
  });

  describe('Description', () => {
    it('renders description with correct text and attributes when provided', () => {
      const { container } = renderHeader();
      const desc = container.querySelector('[data-automationid="cb-description-Test Heading"]')!;
      expect(desc.textContent).toBe('Test description');
      expect(desc.getAttribute('title')).toBe('Test description');
      expect(desc.getAttribute('aria-label')).toBe('Test description');
    });

    it('omits description element when widgetDescription is falsy', () => {
      const { container } = renderHeader({ widgetDescription: undefined });
      expect(container.querySelector('[data-automationid="cb-description-Test Heading"]')).not.toBeInTheDocument();
    });
  });

  describe('Nav icons visibility', () => {
    it('renders two nav buttons when showNavIcons is true', () => {
      const { container } = renderHeader();
      expect(container.querySelectorAll('button').length).toBe(2);
    });

    it('renders no nav buttons when showNavIcons is false', () => {
      const { container } = renderHeader({ showNavIcons: false });
      expect(container.querySelectorAll('button').length).toBe(0);
    });
  });

  describe('Button disabled state', () => {
    it('disables left button and sets aria-disabled when isLeftNavIconDisabled=true', () => {
      const { container } = renderHeader({ isLeftNavIconDisabled: true });
      const left = container.querySelector('#cb-leftNav-Test\\ Heading') as HTMLButtonElement;
      expect(left.disabled).toBe(true);
      expect(left.getAttribute('aria-disabled')).toBe('true');
    });

    it('disables right button and sets aria-disabled when isRightNavIconDisabled=true', () => {
      const { container } = renderHeader({ isRightNavIconDisabled: true });
      const right = container.querySelector('#cb-rightNav-Test\\ Heading') as HTMLButtonElement;
      expect(right.disabled).toBe(true);
      expect(right.getAttribute('aria-disabled')).toBe('true');
    });
  });

  describe('Click handlers', () => {
    it('calls rollAPage(false) when left button is clicked', () => {
      const mockRollAPage = jest.fn();
      const { container } = renderHeader({ rollAPage: mockRollAPage });
      userEvent.click(container.querySelector('#cb-leftNav-Test\\ Heading')!);
      expect(mockRollAPage).toHaveBeenCalledWith(false);
    });

    it('calls rollAPage(true) when right button is clicked', () => {
      const mockRollAPage = jest.fn();
      const { container } = renderHeader({ rollAPage: mockRollAPage });
      userEvent.click(container.querySelector('#cb-rightNav-Test\\ Heading')!);
      expect(mockRollAPage).toHaveBeenCalledWith(true);
    });

    it('does not call rollAPage when left button is disabled', () => {
      const mockRollAPage = jest.fn();
      const { container } = renderHeader({ rollAPage: mockRollAPage, isLeftNavIconDisabled: true });
      userEvent.click(container.querySelector('#cb-leftNav-Test\\ Heading')!);
      expect(mockRollAPage).not.toHaveBeenCalled();
    });

    it('does not call rollAPage when right button is disabled', () => {
      const mockRollAPage = jest.fn();
      const { container } = renderHeader({ rollAPage: mockRollAPage, isRightNavIconDisabled: true });
      userEvent.click(container.querySelector('#cb-rightNav-Test\\ Heading')!);
      expect(mockRollAPage).not.toHaveBeenCalled();
    });
  });

  describe('Button aria-labels', () => {
    it('sets aria-label on nav buttons combining heading and translated direction text', () => {
      const { container } = renderHeader();
      const left = container.querySelector('#cb-leftNav-Test\\ Heading')!;
      const right = container.querySelector('#cb-rightNav-Test\\ Heading')!;
      expect(left.getAttribute('aria-label')).toBe('Test Heading, t:text.leftNavigation');
      expect(right.getAttribute('aria-label')).toBe('Test Heading, t:text.rightNavigation');
    });
  });
});
