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
jest.mock('@utils/global', () => ({
  getALMConfig: jest.fn(),
  getAuthKey: jest.fn(),
}));

jest.mock('@utils/translationService', () => ({
  GetTranslation: (key: string) => key,
  getPreferredLocalizedMetadata: () => null,
}));

jest.mock('@components/Common/ALMLoader/ALMLoader', () => ({
  ALMLoader: () => <div data-testid="loader" />,
}));

jest.mock('@utils/dateTime', () => ({
  modifyTimeDDMMYY: jest.fn(),
}));

jest.mock('../../../almLib/assets/images/aposInv.svg', () => 'aposInv.svg');

import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { IntlProvider } from 'react-intl';
import PrimeAnnouncementContainer from '@components/Notifications/PrimeAnnoucementContainer/PrimeAnnouncementContainer';
import { getALMConfig, getAuthKey } from '@utils/global';
import { modifyTimeDDMMYY } from '@utils/dateTime';

const mockGetALMConfig = getALMConfig as jest.MockedFunction<typeof getALMConfig>;
const mockGetAuthKey = getAuthKey as jest.MockedFunction<typeof getAuthKey>;
const mockModifyTimeDDMMYY = modifyTimeDDMMYY as jest.MockedFunction<typeof modifyTimeDDMMYY>;

const baseNotification = {
  id: 'notif-1',
  modelIds: ['asset-123'],
  modelTypes: ['course'],
  announcement: {
    description: 'Important announcement about new features',
    contentType: 'IMAGE',
    contentUrl: 'https://example.com/image.jpg',
    sentDate: '2024-01-15T10:00:00Z',
    contentId: 'content-123',
  },
} as any;

const mockSetAnnouncementOpen = jest.fn();

const renderContainer = (overrides: any = {}, locale = 'en-US') =>
  render(
    <IntlProvider locale={locale} messages={{ 'alm.text.sentOn': 'Sent On ' }}>
      <PrimeAnnouncementContainer
        notifications={{ ...baseNotification, ...overrides }}
        setAnnouncementOpen={mockSetAnnouncementOpen}
      />
    </IntlProvider>
  );

describe('PrimeAnnouncementContainer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetALMConfig.mockReturnValue({ almBaseURL: 'https://example.com' } as any);
    mockGetAuthKey.mockReturnValue('auth_key=test123');
    mockModifyTimeDDMMYY.mockReturnValue('01/15/2024');
  });

  describe('Content rendering', () => {
    it('renders the announcement description text', () => {
      renderContainer();
      expect(screen.getByText('Important announcement about new features')).not.toBeNull();
    });

    it('renders the "Sent On" label and the formatted date', () => {
      renderContainer();
      expect(screen.getByText(/Sent On/)).not.toBeNull();
      expect(screen.getByText(/01\/15\/2024/)).not.toBeNull();
    });

    it('calls modifyTimeDDMMYY with the sentDate and the current locale', () => {
      renderContainer();
      expect(mockModifyTimeDDMMYY).toHaveBeenCalledWith('2024-01-15T10:00:00Z', 'en-US');
    });

    it('passes the IntlProvider locale to modifyTimeDDMMYY', () => {
      renderContainer({}, 'fr-FR');
      expect(mockModifyTimeDDMMYY).toHaveBeenCalledWith('2024-01-15T10:00:00Z', 'fr-FR');
    });
  });

  describe('VIDEO content type', () => {
    const videoNotification = {
      announcement: {
        ...baseNotification.announcement,
        contentType: 'VIDEO',
        contentId: 'video-456',
      },
    };

    it('renders an iframe with title "primePostVideo" for VIDEO content', () => {
      renderContainer(videoNotification);
      expect(screen.getByTitle('primePostVideo').tagName.toLowerCase()).toBe('iframe');
    });

    it('iframe src includes videoId, assetId, assetType, authKey, and almBaseURL', () => {
      renderContainer(videoNotification);
      const src = screen.getByTitle('primePostVideo').getAttribute('src')!;
      expect(src).toContain('https://example.com');
      expect(src).toContain('videoId=video-456');
      expect(src).toContain('asset_id=asset-123');
      expect(src).toContain('asset_type=course');
      expect(src).toContain('auth_key=test123');
    });

    it('iframe has allow="autoplay" and loading="lazy"', () => {
      renderContainer(videoNotification);
      const iframe = screen.getByTitle('primePostVideo');
      expect(iframe.getAttribute('allow')).toBe('autoplay');
      expect(iframe.getAttribute('loading')).toBe('lazy');
    });
  });

  describe('Non-VIDEO content type', () => {
    it('does not render an iframe for IMAGE content', () => {
      const { container } = renderContainer();
      expect(container.querySelector('iframe')).toBeNull();
    });

    it('does not render an iframe for TEXT content', () => {
      const { container } = renderContainer({
        announcement: { ...baseNotification.announcement, contentType: 'TEXT' },
      });
      expect(container.querySelector('iframe')).toBeNull();
    });
  });
});
