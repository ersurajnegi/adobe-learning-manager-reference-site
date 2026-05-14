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
const mockModifyTime = jest.fn();

jest.mock('@utils/dateTime', () => ({
  modifyTime: (...args: any[]) => mockModifyTime(...args),
}));

jest.mock('@components/Notifications/PrimeNotificationText', () => ({
  PrimeNotificationText: ({ notification }: any) => (
    <div data-testid="notification-text">{notification.message}</div>
  ),
}));

jest.mock('../../../almLib/assets/images/announce.svg', () => 'announce.svg');

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { IntlProvider } from 'react-intl';
import PrimeNotificationItem from '@components/Notifications/PrimeNotificationItem/PrimeNotificationItem';

const mockRedirectOverviewPage = jest.fn();
const mockSetAnnouncementOpen = jest.fn();
const mockSetShowNotifications = jest.fn();
const mockSetAnnouncementData = jest.fn();

const baseNotification = {
  id: 'notif-1',
  message: 'Test notification message',
  channel: 'course::completed',
  dateCreated: '2024-01-01T12:00:00Z',
  read: false,
  announcement: null,
} as any;

const defaultProps = {
  notification: baseNotification,
  redirectOverviewPage: mockRedirectOverviewPage,
  setAnnouncementOpen: mockSetAnnouncementOpen,
  setShowNotifications: mockSetShowNotifications,
  setAnnouncementData: mockSetAnnouncementData,
};

const renderItem = (props: Partial<typeof defaultProps> = {}, locale = 'en-US') =>
  render(
    <IntlProvider locale={locale}>
      <PrimeNotificationItem {...defaultProps} {...props} />
    </IntlProvider>
  );

describe('PrimeNotificationItem', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders as a list item containing PrimeNotificationText', () => {
    const { container } = renderItem();
    expect(container.querySelector('li')!.tagName).toBe('LI');
    expect(screen.getByTestId('notification-text').textContent).toBe('Test notification message');
  });

  describe('Icon selection', () => {
    it('renders announcement SVG img for announcement channel', () => {
      const { container } = renderItem({
        notification: { ...baseNotification, channel: 'announcement::general' },
      });
      expect(container.querySelector('img[alt="AnnouncementIcon"]')).not.toBeNull();
    });

    it('does not render announcement icon for non-announcement channels', () => {
      const { container } = renderItem();
      expect(container.querySelector('img[alt="AnnouncementIcon"]')).toBeNull();
    });
  });

  describe('Thumbnail', () => {
    const announcementNotification = {
      ...baseNotification,
      channel: 'announcement::general',
      announcement: { thumbnailUrl: 'https://example.com/thumb.jpg', contentType: 'IMAGE' },
    } as any;

    it('shows thumbnail when announcement has a non-TEXT contentType', () => {
      const { container } = renderItem({ notification: announcementNotification });
      const img = container.querySelector('img[alt="thumbnail"]') as HTMLImageElement;
      expect(img).not.toBeNull();
      expect(img.src).toContain('thumb.jpg');
    });

    it('hides thumbnail when announcement contentType is TEXT', () => {
      const { container } = renderItem({
        notification: {
          ...announcementNotification,
          announcement: { ...announcementNotification.announcement, contentType: 'TEXT' },
        },
      });
      expect(container.querySelector('img[alt="thumbnail"]')).toBeNull();
    });

    it('hides thumbnail for non-announcement notifications', () => {
      const { container } = renderItem();
      expect(container.querySelector('img[alt="thumbnail"]')).toBeNull();
    });

    it('calls setAnnouncementOpen(true), setShowNotifications(false), and setAnnouncementData with the notification when thumbnail is clicked', () => {
      const { container } = renderItem({ notification: announcementNotification });
      userEvent.click(container.querySelector('img[alt="thumbnail"]') as HTMLElement);
      expect(mockSetAnnouncementOpen).toHaveBeenCalledWith(true);
      expect(mockSetShowNotifications).toHaveBeenCalledWith(false);
      expect(mockSetAnnouncementData).toHaveBeenCalledWith(announcementNotification);
    });
  });

  describe('Date/time formatting', () => {
    it('calls modifyTime with dateCreated and the IntlProvider locale', () => {
      renderItem();
      expect(mockModifyTime).toHaveBeenCalledWith('2024-01-01T12:00:00Z', 'en-US');
    });

    it('passes the current locale to modifyTime', () => {
      renderItem({}, 'fr-FR');
      expect(mockModifyTime).toHaveBeenCalledWith('2024-01-01T12:00:00Z', 'fr-FR');
    });
  });
});
