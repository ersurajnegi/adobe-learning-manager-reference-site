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
const mockIsPrimeUserLoggedIn = jest.fn();
const mockChangeHoverState = jest.fn();

jest.mock('@utils/global', () => ({
  getALMConfig: jest.fn(),
  getTokenForNativeExtensions: jest.fn(),
  getALMObject: jest.fn(),
}));

jest.mock('@contextProviders/userContextProvider');
jest.mock('@hooks/customPages/useALMInspectMode');

jest.mock('@components/CustomPages/ALMWidgetInspectMode/ALMWidgetInspectMode', () => ({
  __esModule: true,
  default: () => <div data-testid="inspect-overlay" />,
}));

import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ALMIframeWidget from '@components/CustomPages/ALMIframeWidget/ALMIframeWidget';
import { useUserContext } from '@contextProviders/userContextProvider';
import { useWidgetInspectMode } from '@hooks/customPages/useALMInspectMode';
import { getALMConfig, getTokenForNativeExtensions, getALMObject } from '@utils/global';

const mockUseUserContext = useUserContext as jest.MockedFunction<typeof useUserContext>;
const mockUseWidgetInspectMode = useWidgetInspectMode as jest.MockedFunction<typeof useWidgetInspectMode>;
const mockGetALMConfig = getALMConfig as jest.MockedFunction<typeof getALMConfig>;
const mockGetTokenForNativeExtensions = getTokenForNativeExtensions as jest.MockedFunction<typeof getTokenForNativeExtensions>;
const mockGetALMObject = getALMObject as jest.MockedFunction<typeof getALMObject>;

const mockWidget = {
  id: 'widget-123',
  widgetRef: 'IFRAME',
  attributes: { url: 'https://example.com/embed', height: 600 },
};

const baseInspectMode = {
  isHovered: false,
  widgetContainerWidth: 1200,
  widgetContainerHeight: 600,
  changeHoverState: mockChangeHoverState,
};

const renderWidget = (props: any = {}) =>
  render(<ALMIframeWidget widget={mockWidget as any} {...props} />);

describe('ALMIframeWidget', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsPrimeUserLoggedIn.mockReturnValue(true);
    mockGetALMConfig.mockReturnValue({ locale: 'en-US', almBaseURL: 'https://test.adobe.com' } as any);
    mockGetTokenForNativeExtensions.mockReturnValue('test-auth-token');
    mockGetALMObject.mockReturnValue({ isPrimeUserLoggedIn: mockIsPrimeUserLoggedIn } as any);
    mockUseUserContext.mockReturnValue({
      user: { id: 'user-123', account: { id: 'account-456' } },
    } as any);
    mockUseWidgetInspectMode.mockReturnValue(baseInspectMode);
  });

  describe('iframe src URL', () => {
    it('appends userId, authToken, accountId, and locale when user is logged in', () => {
      const { container } = renderWidget();
      const src = container.querySelector('iframe')!.src;
      expect(src).toContain('https://example.com/embed');
      expect(src).toContain('userId=user-123');
      expect(src).toContain('authToken=test-auth-token');
      expect(src).toContain('accountId=account-456');
      expect(src).toContain('locale=en-US');
    });

    it('omits userId and authToken but keeps accountId and locale when not logged in', () => {
      mockIsPrimeUserLoggedIn.mockReturnValue(false);
      const { container } = renderWidget();
      const src = container.querySelector('iframe')!.src;
      expect(src).not.toContain('userId=');
      expect(src).not.toContain('authToken=');
      expect(src).toContain('accountId=account-456');
      expect(src).toContain('locale=en-US');
    });

    it('preserves existing query params already in the URL', () => {
      const widget = { ...mockWidget, attributes: { url: 'https://example.com/embed?foo=bar', height: 600 } };
      const { container } = render(<ALMIframeWidget widget={widget as any} />);
      const src = container.querySelector('iframe')!.src;
      expect(src).toContain('foo=bar');
      expect(src).toContain('userId=user-123');
    });

    it('returns empty src when url is empty', () => {
      const widget = { ...mockWidget, attributes: { url: '', height: 600 } };
      const { container } = render(<ALMIframeWidget widget={widget as any} />);
      expect(container.querySelector('iframe')!.getAttribute('src')).toBe('');
    });

    it('returns empty src and logs an error when url is not a valid URL', () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
      const widget = { ...mockWidget, attributes: { url: 'not-a-valid-url', height: 600 } };
      const { container } = render(<ALMIframeWidget widget={widget as any} />);
      expect(container.querySelector('iframe')!.getAttribute('src')).toBe('');
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Error constructing iframe URL'),
        expect.anything()
      );
      (console.error as jest.Mock).mockRestore();
    });
  });

  describe('Layout', () => {
    it('sets the section id to widget.id', () => {
      const { container } = renderWidget();
      expect(container.querySelector('section')!.id).toBe('widget-123');
    });

    it('applies height from widget attributes as inline style', () => {
      const { container } = renderWidget();
      expect(container.querySelector('section')!.style.height).toBe('600px');
    });

    it('renders an empty height style when height is not set', () => {
      const widget = { ...mockWidget, attributes: { url: 'https://example.com' } };
      const { container } = render(<ALMIframeWidget widget={widget as any} />);
      expect(container.querySelector('section')!.style.height).toBe('');
    });
  });

  describe('Inspect mode overlay', () => {
    it('shows overlay when isInspectMode=true and widget is hovered', () => {
      mockUseWidgetInspectMode.mockReturnValue({ ...baseInspectMode, isHovered: true });
      const { container } = renderWidget({ isInspectMode: true });
      expect(container.querySelector('[data-testid="inspect-overlay"]')!.tagName.toLowerCase()).toBe('div');
    });

    it('hides overlay when isInspectMode=false even when hovered', () => {
      mockUseWidgetInspectMode.mockReturnValue({ ...baseInspectMode, isHovered: true });
      const { container } = renderWidget({ isInspectMode: false });
      expect(container.querySelector('[data-testid="inspect-overlay"]')).not.toBeInTheDocument();
    });

    it('hides overlay when isInspectMode=true but not hovered', () => {
      const { container } = renderWidget({ isInspectMode: true });
      expect(container.querySelector('[data-testid="inspect-overlay"]')).not.toBeInTheDocument();
    });
  });

  describe('Hover state', () => {
    it('calls changeHoverState on mouseEnter and mouseLeave', () => {
      const { container } = renderWidget();
      const section = container.querySelector('section')!;
      fireEvent.mouseEnter(section);
      fireEvent.mouseLeave(section);
      expect(mockChangeHoverState).toHaveBeenCalledTimes(2);
    });
  });
});
