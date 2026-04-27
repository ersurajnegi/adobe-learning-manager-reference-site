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
import { render, wait } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import ALMMasthead from '@components/Masthead/ALMMasthead';

const mockGetAnnouncements = jest.fn();

jest.mock('@adobe/react-spectrum', () => ({
  Provider: ({ children }: any) => <>{children}</>,
  lightTheme: {},
}));

jest.mock('@hooks/widgets/masthead/useMasthead', () => ({
  useMasthead: () => ({
    getAnnouncements: mockGetAnnouncements,
    mastheadImageMap: { en: 'https://example.com/en/masthead.jpg' },
  }),
}));

jest.mock('@utils/translationService', () => ({
  getPreferredLocalizedMetadata: (data: any) => data,
  GetTranslation: (key: string) => key,
}));

jest.mock('@utils/jsonAPIAdapter', () => ({
  JsonApiParse: (data: any) => data,
}));

jest.mock('@utils/widgets/utils', () => ({
  IsAnyUrl: (url: string) => url.startsWith('http://') || url.startsWith('https://'),
  LoadScript: jest.fn().mockResolvedValue(true),
}));

jest.mock('@utils/widgets/windowWrapper', () => ({
  GetBrightCoveAccountId: () => 'test-account-id',
  GetBrightCovePlayerId: () => 'test-player-id',
  GetPrimeWindow: () => ({ videojs: jest.fn() }),
}));

jest.mock('@utils/swipeDetector', () => ({
  swipeEvents: jest.fn(),
}));

jest.mock('@contextProviders/DeviceContextProvider', () => ({
  useDeviceTypeContext: () => ({ isMobile: false, isTablet: false, isDesktop: true }),
}));

jest.mock('@spectrum-icons/workflow/ChevronLeft', () => () => <svg data-testid="chevron-left" />);
jest.mock('@spectrum-icons/workflow/ChevronRight', () => () => <svg data-testid="chevron-right" />);

jest.mock('@components/Common/ALMErrorBoundary', () => ({
  ALMErrorBoundary: ({ children }: any) => <>{children}</>,
}));

const defaultMessages = {
  'alm.text.mastHeadDot': 'Slide {0}',
  'alm.text.learnMore': 'Learn More',
  'alm.text.previousSlide': 'Previous Slide',
  'alm.text.nextSlide': 'Next Slide',
  'alm.text.mastHeadHeading': 'Carousel with {0} slides',
  'alm.text.mastHeadHeadingWithOneSlide': 'Masthead',
  'alm.text.masthead.sr.description': 'Use arrow keys to navigate',
};

const defaultWidget = {
  attributes: { size: 'medium', heading: '' },
  layoutAttributes: { id: 'masthead-1' },
};

const wrap = (ui: React.ReactElement) =>
  render(<IntlProvider locale="en" messages={defaultMessages}>{ui}</IntlProvider>);

describe('ALMMasthead', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAnnouncements.mockResolvedValue({ adminAnnouncementList: [] });
    global.setInterval = jest.fn(() => 123 as any) as any;
    global.clearInterval = jest.fn();
  });

  it('carousel_hasAccessibilityAttributes', () => {
    const { container } = wrap(
      <ALMMasthead widget={defaultWidget} mastHeads={[]} />
    );

    const carousel = container.querySelector('#carousel');
    expect(carousel?.getAttribute('role')).toBe('complementary');
    expect(carousel?.getAttribute('aria-labelledby')).toBe('masthead_title');
    expect(carousel?.getAttribute('aria-describedby')).toBe('masthead_desc');
  });

  it('render_withMastHeads_imageDisplayedWithAltText', async () => {
    const mastHeads = [{
      actionUrl: 'https://example.com/action',
      contentMetaData: { contentUrl: 'https://example.com/img.jpg', contentType: 'IMAGE', altText: 'First Slide' },
    }];

    wrap(<ALMMasthead widget={defaultWidget} mastHeads={mastHeads} />);

    await wait(() => {
      expect(document.querySelector('[alt="First Slide"]')).not.toBeNull();
    });
  });

  it('render_mastHeadMissingAltText_usesDefaultTranslation', async () => {
    const mastHeads = [{
      contentMetaData: { contentUrl: 'https://example.com/img.jpg', contentType: 'IMAGE' },
    }];

    wrap(<ALMMasthead widget={defaultWidget} mastHeads={mastHeads} />);

    await wait(() => {
      expect(document.querySelector('[alt="alm.text.mastHeadImageAltText"]')).not.toBeNull();
    });
  });

  it('render_withActionUrl_learnMoreButtonVisible', async () => {
    const mastHeads = [{
      actionUrl: 'https://example.com/action',
      contentMetaData: { contentUrl: 'https://example.com/img.jpg', contentType: 'IMAGE', altText: 'Slide' },
    }];

    wrap(<ALMMasthead widget={defaultWidget} mastHeads={mastHeads} />);

    await wait(() => {
      const button = document.getElementById('continue') as HTMLElement;
      expect(button?.style.visibility).toBe('visible');
    });
  });

  it('render_withoutActionUrl_learnMoreButtonHidden', async () => {
    const mastHeads = [{
      contentMetaData: { contentUrl: 'https://example.com/img.jpg', contentType: 'IMAGE', altText: 'Slide' },
    }];

    wrap(<ALMMasthead widget={defaultWidget} mastHeads={mastHeads} />);

    await wait(() => {
      expect(document.querySelector('[alt="Slide"]')).not.toBeNull();
    });

    const button = document.getElementById('continue') as HTMLElement;
    expect(button?.style.visibility).toBe('hidden');
  });
});
