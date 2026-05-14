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
const mockUseLoadMore = jest.fn();

jest.mock('@hooks/loadMore', () => ({
  useLoadMore: (...args: any[]) => mockUseLoadMore(...args),
}));

jest.mock('@components/Notifications/PrimeNotificationItem', () => ({
  PrimeNotificationItem: ({ notification }: any) => (
    <li data-testid={`notification-${notification.id}`}>{notification.message}</li>
  ),
}));

jest.mock('@components/Common/ALMLoader', () => ({
  ALMLoader: () => <div data-testid="loader" />,
}));

import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { IntlProvider } from 'react-intl';
import PrimeNotificationsList from '@components/Notifications/PrimeNotificationList/PrimeNotificationList';

const mockLoadMoreNotifications = jest.fn();
const mockRedirectOverviewPage = jest.fn();
const mockSetAnnouncementOpen = jest.fn();
const mockSetShowNotifications = jest.fn();
const mockSetAnnouncementData = jest.fn();

const mockNotifications = [
  { id: 'n1', message: 'You completed React Course', channel: 'course::completed', dateCreated: '2024-01-01T12:00:00Z' },
  { id: 'n2', message: 'Session starts at 10 AM', channel: 'course::sessionReminder', dateCreated: '2024-01-02T12:00:00Z' },
  { id: 'n3', message: 'New announcement available', channel: 'announcement::general', dateCreated: '2024-01-03T12:00:00Z' },
];

const defaultProps = {
  notifications: mockNotifications,
  loadMoreNotifications: mockLoadMoreNotifications,
  redirectOverviewPage: mockRedirectOverviewPage,
  isLoading: false,
  setAnnouncementOpen: mockSetAnnouncementOpen,
  setShowNotifications: mockSetShowNotifications,
  setAnnouncementData: mockSetAnnouncementData,
};

const renderList = (props: Partial<typeof defaultProps> = {}) =>
  render(
    <IntlProvider locale="en-US">
      <PrimeNotificationsList {...defaultProps} {...props} />
    </IntlProvider>
  );

describe('PrimeNotificationsList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the #notifications container', () => {
    const { container } = renderList();
    expect(container.querySelector('#notifications')!.tagName.toLowerCase()).toBe('div');
  });

  describe('Notification items', () => {
    it('renders one item per notification', () => {
      renderList();
      expect(screen.getByTestId('notification-n1').textContent).toBe('You completed React Course');
      expect(screen.getByTestId('notification-n2').textContent).toBe('Session starts at 10 AM');
      expect(screen.getByTestId('notification-n3').textContent).toBe('New announcement available');
    });

    it('renders items inside a <ul>', () => {
      const { container } = renderList();
      expect(container.querySelector('ul')).not.toBeNull();
    });
  });

  describe('Empty state', () => {
    it('shows "No notifications available" when notifications is an empty array', () => {
      const { container } = renderList({ notifications: [] });
      expect(container.textContent).toContain('No notifications available');
      expect(container.querySelector('ul')).toBeNull();
    });

    it('shows empty state when notifications is null', () => {
      const { container } = renderList({ notifications: null as any });
      expect(container.textContent).toContain('No notifications available');
    });

    it('shows empty state when notifications is undefined', () => {
      const { container } = renderList({ notifications: undefined as any });
      expect(container.textContent).toContain('No notifications available');
    });
  });

  describe('Loading state', () => {
    it('shows the loader and hides notifications when isLoading is true', () => {
      renderList({ isLoading: true });
      expect(screen.getByTestId('loader')).not.toBeNull();
      expect(screen.queryByTestId('notification-n1')).toBeNull();
    });

    it('hides empty state text while loading even when notifications is empty', () => {
      const { container } = renderList({ isLoading: true, notifications: [] });
      expect(container.textContent).not.toContain('No notifications available');
    });

    it('hides loader and shows items once isLoading switches to false', () => {
      const { rerender } = renderList({ isLoading: true });
      expect(screen.getByTestId('loader')).not.toBeNull();

      rerender(
        <IntlProvider locale="en-US">
          <PrimeNotificationsList {...defaultProps} isLoading={false} />
        </IntlProvider>
      );

      expect(screen.queryByTestId('loader')).toBeNull();
      expect(screen.getByTestId('notification-n1').textContent).toBe('You completed React Course');
    });
  });

  describe('useLoadMore integration', () => {
    it('calls useLoadMore with items, callback, containerId, and a ref', () => {
      renderList();
      expect(mockUseLoadMore).toHaveBeenCalledWith({
        items: mockNotifications,
        callback: mockLoadMoreNotifications,
        containerId: 'notifications',
        elementRef: expect.objectContaining({ current: expect.anything() }),
      });
    });
  });
});
