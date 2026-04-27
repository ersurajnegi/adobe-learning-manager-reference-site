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
const mockCleanupConfig = jest.fn();
const mockCleanupNavigation = jest.fn();
const mockSendCustomPageSkipLinks = jest.fn();

jest.mock('@utils/global', () => ({
  getALMConfig: jest.fn(() => ({})),
  getALMObject: jest.fn(() => ({ sendCustomPageSkipLinks: mockSendCustomPageSkipLinks })),
  GetPrimeEmitEventLinks: jest.fn(() => []),
  getAuthKey: jest.fn(() => 'Bearer test'),
}));

jest.mock('@utils/widgets/base/EventHandlingBase', () => ({
  SendMessageToParent: jest.fn(),
}));

jest.mock('@hooks');
jest.mock('@contextProviders/userContextProvider');
jest.mock('@utils/translationService');
jest.mock('@utils/widgets/utils', () => ({
  setIsCustomPage: jest.fn(),
  setupALMConfigEventListener: jest.fn(() => mockCleanupConfig),
  setupHTMLWidgetNavigationListener: jest.fn(() => mockCleanupNavigation),
}));

jest.mock('@components/CustomPages/ALMLayout/ALMLayout', () => ({
  __esModule: true,
  default: ({ layout }: any) => (
    <div data-testid="alm-layout" data-row-count={layout?.length} />
  ),
}));

jest.mock('@components/CustomPages/ALMCustomWidgetRenderer/ALMCustomWidgetRenderer', () => ({
  __esModule: true,
  default: () => <div />,
}));

jest.mock('@components/CustomPages/ALMWidgetLoader', () => ({
  ALMWidgetLoader: () => <div data-testid="widget-loader" />,
}));

jest.mock('@adobe/react-spectrum', () => ({
  lightTheme: {},
  Provider: ({ children }: any) => <>{children}</>,
  Switch: ({ isSelected, onChange, 'data-automationid': aid }: any) => (
    <input
      type="checkbox"
      data-testid="inspect-switch"
      data-automationid={aid}
      checked={isSelected}
      onChange={e => onChange(e.target.checked)}
    />
  ),
}));

jest.mock('@contextProviders/ALMCustomPageProvider', () => ({
  CustomPageProvider: ({ children }: any) => <>{children}</>,
}));

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import ALMCustomPage from '@components/CustomPages/ALMCustomPage/ALMCustomPage';
import { useLoadMore } from '@hooks';
import { useUserContext } from '@contextProviders/userContextProvider';
import { GetTranslation, getPreferredLocalizedMetadata } from '@utils/translationService';
import { setIsCustomPage, setupALMConfigEventListener, setupHTMLWidgetNavigationListener } from '@utils/widgets/utils';
import { SendMessageToParent } from '@utils/widgets/base/EventHandlingBase';

const mockUseLoadMore = useLoadMore as jest.MockedFunction<typeof useLoadMore>;
const mockUseUserContext = useUserContext as jest.MockedFunction<typeof useUserContext>;
const mockGetTranslation = GetTranslation as jest.MockedFunction<typeof GetTranslation>;
const mockGetPreferredLocalizedMetadata = getPreferredLocalizedMetadata as jest.MockedFunction<typeof getPreferredLocalizedMetadata>;
const mockSetIsCustomPage = setIsCustomPage as jest.MockedFunction<typeof setIsCustomPage>;
const mockSetupALMConfigEventListener = setupALMConfigEventListener as jest.MockedFunction<typeof setupALMConfigEventListener>;
const mockSetupHTMLWidgetNavigationListener = setupHTMLWidgetNavigationListener as jest.MockedFunction<typeof setupHTMLWidgetNavigationListener>;
const mockSendMessageToParent = SendMessageToParent as jest.MockedFunction<typeof SendMessageToParent>;

const makeRows = (n: number) =>
  Array.from({ length: n }, (_, i) => ({ id: `row-${i}`, columns: [] }));

const basePageConfig = {
  pageId: 'pg-1',
  desktop: makeRows(6),
  widgets: { w1: {} },
};

const basePageData = {
  id: 'page-1',
  localizedMetadata: [{ locale: 'en-US', name: 'My Page' }],
};

const renderPage = (props: any = {}) =>
  render(
    <ALMCustomPage
      pageConfig={basePageConfig as any}
      pageData={basePageData as any}
      {...props}
    />
  );

describe('ALMCustomPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseUserContext.mockReturnValue({ user: { id: 'u1', uiLocale: 'en-US' } } as any);
    mockUseLoadMore.mockReturnValue([{ current: null }] as any);
    mockGetPreferredLocalizedMetadata.mockReturnValue({ name: 'My Page' } as any);
    mockGetTranslation.mockImplementation((key: string) => {
      if (key.includes('inspectMode')) return 'Inspect Mode';
      if (key.includes('.on')) return 'On';
      if (key.includes('.off')) return 'Off';
      return key;
    });
    mockSetupALMConfigEventListener.mockReturnValue(mockCleanupConfig);
    mockSetupHTMLWidgetNavigationListener.mockReturnValue(mockCleanupNavigation);
  });

  it('returns null when pageConfig.desktop is empty', () => {
    const { container } = renderPage({
      pageConfig: { ...basePageConfig, desktop: [] },
    });
    expect(container.firstChild).toBeNull();
  });

  it('renders ALMLayout with first 4 rows (BATCH_SIZE) of the desktop layout', () => {
    renderPage();
    expect(screen.getByTestId('alm-layout')).toHaveAttribute('data-row-count', '4');
  });

  it('shows the loader when more rows remain beyond the visible batch', () => {
    // 6 desktop rows → visibleRows=4 → 4 < 6 → loader visible
    renderPage();
    expect(screen.getByTestId('widget-loader').tagName.toLowerCase()).toBe('div');
  });

  it('hides the loader when all rows fit within the initial batch', () => {
    // 3 desktop rows → visibleRows=3 → 3 < 3 is false → no loader
    renderPage({ pageConfig: { ...basePageConfig, desktop: makeRows(3) } });
    expect(screen.queryByTestId('widget-loader')).not.toBeInTheDocument();
  });

  describe('Inspect mode toggle', () => {
    it('does not show the toggle when disableLinks is false', () => {
      renderPage({ disableLinks: false });
      expect(screen.queryByTestId('inspect-switch')).not.toBeInTheDocument();
    });

    it('shows the toggle with Off state when disableLinks is true', () => {
      renderPage({ disableLinks: true });
      expect(screen.getByTestId('inspect-switch').getAttribute('type')).toBe('checkbox');
      expect(screen.getByText('Off').tagName.toLowerCase()).toBe('span');
    });

    it('toggles inspect mode on and off via the switch', () => {
      renderPage({ disableLinks: true });
      const toggle = screen.getByTestId('inspect-switch');
      expect(screen.queryByText('On')).not.toBeInTheDocument();
      userEvent.click(toggle);
      expect(screen.queryByText('Off')).not.toBeInTheDocument();
      userEvent.click(toggle);
      expect(screen.queryByText('On')).not.toBeInTheDocument();
    });
  });

  describe('Mount side effects', () => {
    it('calls setIsCustomPage(true) on mount and setIsCustomPage(false) on unmount', () => {
      const { unmount } = renderPage();
      expect(mockSetIsCustomPage).toHaveBeenCalledWith(true);
      unmount();
      expect(mockSetIsCustomPage).toHaveBeenCalledWith(false);
    });

    it('calls setupALMConfigEventListener and setupHTMLWidgetNavigationListener with widgets on mount', () => {
      renderPage();
      expect(mockSetupALMConfigEventListener).toHaveBeenCalledWith(basePageConfig.widgets);
      expect(mockSetupHTMLWidgetNavigationListener).toHaveBeenCalledWith(basePageConfig.widgets);
    });

    it('runs event listener cleanups on unmount', () => {
      const { unmount } = renderPage();
      unmount();
      expect(mockCleanupConfig).toHaveBeenCalledTimes(1);
      expect(mockCleanupNavigation).toHaveBeenCalledTimes(1);
    });

    it('sends the page title via SendMessageToParent on mount', () => {
      renderPage();
      expect(mockSendMessageToParent).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'My Page' }),
        undefined
      );
    });
  });

  describe('Keyboard shortcut', () => {
    it('sends KEYBOARD_SHORTCUTS message when Alt+1-4 is pressed', () => {
      renderPage();
      mockSendMessageToParent.mockClear();
      document.dispatchEvent(new KeyboardEvent('keydown', { altKey: true, which: 49, bubbles: true }));
      expect(mockSendMessageToParent).toHaveBeenCalledWith(
        expect.objectContaining({ key: 49 }),
        undefined
      );
    });

    it('does not send a message for non-Alt keys', () => {
      renderPage();
      mockSendMessageToParent.mockClear();
      document.dispatchEvent(new KeyboardEvent('keydown', { altKey: false, which: 49, bubbles: true }));
      expect(mockSendMessageToParent).not.toHaveBeenCalled();
    });

    it('does not send a message for Alt+key outside 1-4 range', () => {
      renderPage();
      mockSendMessageToParent.mockClear();
      document.dispatchEvent(new KeyboardEvent('keydown', { altKey: true, which: 65, bubbles: true }));
      expect(mockSendMessageToParent).not.toHaveBeenCalled();
    });
  });
});
