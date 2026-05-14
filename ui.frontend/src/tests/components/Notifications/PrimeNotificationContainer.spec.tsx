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
const mockFetchNotifications = jest.fn();
const mockMarkReadNotification = jest.fn();
const mockLoadMoreNotifications = jest.fn();
const mockRedirectOverviewPage = jest.fn();
const mockPollUnreadNotificationCount = jest.fn();

jest.mock('@hooks', () => ({
  useNotifications: jest.fn(),
}));

jest.mock('@components/Common/ALMErrorBoundary', () => ({
  ALMErrorBoundary: ({ children }: any) => <>{children}</>,
}));

jest.mock('@components/Notifications/PrimeNotificationList', () => ({
  PrimeNotificationList: ({ notifications }: any) => (
    <div data-testid="notification-list">Notifications: {notifications?.length ?? 0}</div>
  ),
}));

jest.mock('@components/Notifications/PrimeAnnoucementContainer', () => ({
  PrimeAnnouncementContainer: () => <div data-testid="announcement-container" />,
}));

jest.mock('@spectrum-icons/workflow/Bell', () => () => <svg data-testid="bell-icon" />);

import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { IntlProvider } from 'react-intl';
import PrimeNotificationContainer from '@components/Notifications/PrimeNotificationContainer/PrimeNotificationContainer';
import { useNotifications } from '@hooks';

const mockUseNotifications = useNotifications as jest.MockedFunction<typeof useNotifications>;

const baseHookReturn = {
  notifications: [{ id: 'n1' }, { id: 'n2' }, { id: 'n3' }],
  isLoading: false,
  unreadCount: 3,
  fetchNotifications: mockFetchNotifications,
  loadMoreNotifications: mockLoadMoreNotifications,
  markReadNotification: mockMarkReadNotification,
  redirectOverviewPage: mockRedirectOverviewPage,
  pollUnreadNotificationCount: mockPollUnreadNotificationCount,
};

const renderContainer = () =>
  render(
    <IntlProvider locale="en-US">
      <PrimeNotificationContainer />
    </IntlProvider>
  );

describe('PrimeNotificationContainer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockUseNotifications.mockReturnValue(baseHookReturn as any);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Bell button', () => {
    it('renders #userNotificationIcon as a button element', () => {
      const { container } = renderContainer();
      expect(container.querySelector('#userNotificationIcon')!.tagName.toLowerCase()).toBe('button');
    });

    it('has title "User Notifications"', () => {
      const { container } = renderContainer();
      expect(container.querySelector('#userNotificationIcon')!.getAttribute('title')).toBe('User Notifications');
    });
  });

  describe('Unread count badge', () => {
    it('shows unreadCount inside the bell button when unreadCount > 0', () => {
      const { container } = renderContainer();
      const badge = container.querySelector('#userNotificationIcon > div');
      expect(badge).not.toBeNull();
      expect(badge!.textContent).toBe('3');
    });

    it('renders no badge element when unreadCount is 0', () => {
      mockUseNotifications.mockReturnValue({ ...baseHookReturn, unreadCount: 0 } as any);
      const { container } = renderContainer();
      expect(container.querySelector('#userNotificationIcon > div')).toBeNull();
    });
  });

  describe('Toggle notification list', () => {
    it('does not show the notification list on initial render', () => {
      renderContainer();
      expect(screen.queryByTestId('notification-list')).toBeNull();
    });

    it('shows the list and calls fetchNotifications when bell is clicked', () => {
      const { container } = renderContainer();
      act(() => { userEvent.click(container.querySelector('#userNotificationIcon') as HTMLElement); });
      expect(screen.getByTestId('notification-list')).not.toBeNull();
      expect(mockFetchNotifications).toHaveBeenCalledTimes(1);
    });

    it('passes the notifications array length to the list', () => {
      const { container } = renderContainer();
      userEvent.click(container.querySelector('#userNotificationIcon') as HTMLElement);
      expect(screen.getByTestId('notification-list').textContent).toBe('Notifications: 3');
    });

    it('hides the list and calls markReadNotification when bell is clicked again', () => {
      const { container } = renderContainer();
      const bell = container.querySelector('#userNotificationIcon') as HTMLElement;
      userEvent.click(bell);
      userEvent.click(bell);
      expect(screen.queryByTestId('notification-list')).toBeNull();
      expect(mockMarkReadNotification).toHaveBeenCalled();
    });
  });

  describe('Click outside to close', () => {
    it('closes the notification list when clicking outside the wrapper', () => {
      const { container } = renderContainer();
      userEvent.click(container.querySelector('#userNotificationIcon') as HTMLElement);
      expect(screen.getByTestId('notification-list')).not.toBeNull();
      userEvent.click(document.body);
      expect(screen.queryByTestId('notification-list')).toBeNull();
    });

    it('keeps the notification list open when clicking inside the wrapper', () => {
      const { container } = renderContainer();
      userEvent.click(container.querySelector('#userNotificationIcon') as HTMLElement);
      userEvent.click(screen.getByTestId('notification-list'));
      expect(screen.getByTestId('notification-list')).not.toBeNull();
    });
  });

  describe('Polling', () => {
    it('polls every 60 seconds when the list is closed', () => {
      renderContainer();
      act(() => { jest.advanceTimersByTime(60000); });
      expect(mockPollUnreadNotificationCount).toHaveBeenCalledTimes(1);
      act(() => { jest.advanceTimersByTime(60000); });
      expect(mockPollUnreadNotificationCount).toHaveBeenCalledTimes(2);
    });

    it('does not poll while the list is open', () => {
      const { container } = renderContainer();
      act(() => { userEvent.click(container.querySelector('#userNotificationIcon') as HTMLElement); });
      act(() => { jest.advanceTimersByTime(120000); });
      expect(mockPollUnreadNotificationCount).not.toHaveBeenCalled();
    });
  });

  describe('Announcement container', () => {
    it('does not render the announcement container on initial render', () => {
      renderContainer();
      expect(screen.queryByTestId('announcement-container')).toBeNull();
    });
  });
});
