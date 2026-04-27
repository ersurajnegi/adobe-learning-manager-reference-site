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
/**
 * Unit tests for useNotifications.tsx hook
 * Tests notification fetching, marking as read, pagination, and announcements
 */

// Mock dependencies BEFORE imports to prevent circular dependency issues
jest.mock('@utils/global', () => ({
  getALMConfig: jest.fn(() => ({
    primeApiURL: 'https://test.api.com/primeapi/v2',
    commerceURL: 'https://test.commerce.com',
    graphqlProxyPath: 'https://test.graphql.com',
    locale: 'en-US',
    accountId: 'test-account',
  })),
  getALMObject: jest.fn(() => ({
    storage: { getItem: jest.fn(), setItem: jest.fn(), removeItem: jest.fn() },
    isPrimeUserLoggedIn: jest.fn(() => true),
  })),
  getALMUser: jest.fn(() => Promise.resolve({ user: { id: 'user:123' } })),
  getALMAttribute: jest.fn(),
  getQueryParamsFromUrl: jest.fn(() => ({})),
}));
jest.mock('@utils/restAdapter', () => ({
  RestAdapter: { get: jest.fn(), post: jest.fn() },
}));
jest.mock('@utils/jsonAPIAdapter', () => ({
  JsonApiParse: jest.fn(data => (typeof data === 'string' ? JSON.parse(data).data : data.data)),
}));
jest.mock('@utils/translationService', () => ({
  GetTranslation: jest.fn(key => key),
  GetTranslationReplaced: jest.fn(),
  getPreferredLocalizedMetadata: jest.fn(),
}));

jest.mock('@utils/playback-utils', () => ({
  LaunchPlayer: jest.fn(),
}));

jest.mock('@utils/breadcrumbUtils', () => ({
  clearBreadcrumbPathDetails: jest.fn(),
}));

import { act } from '@testing-library/react';
import { waitFor } from '@testing-library/dom';
import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import { useNotifications } from '@hooks/notifications/useNotifications';
import APIServiceInstance from '@common/APIService';
import * as globalUtils from '@utils/global';
import * as playbackUtils from '@utils/playback-utils';
import * as breadcrumbUtils from '@utils/breadcrumbUtils';
import { RestAdapter } from '@utils/restAdapter';
import { JsonApiParse } from '@utils/jsonAPIAdapter';
import { PrimeUserNotification } from '../../../models';

// Custom renderHook implementation for React Testing Library v9
function renderHook<T, P = any>(
  hookCallback: (props?: P) => T,
  options?: { wrapper?: React.ComponentType<any>; initialProps?: P }
) {
  const result: any = { current: null };

  function TestComponent() {
    result.current = hookCallback();
    return null;
  }

  const Wrapper = options?.wrapper || React.Fragment;
  const container = document.createElement('div');

  if (document.body) {
    document.body.appendChild(container);
  }

  const renderComponent = (wrapperProps?: any) => {
    const testElement = React.createElement(TestComponent);
    const wrappedElement = React.createElement(Wrapper, wrapperProps, testElement);
    ReactDOM.render(wrappedElement, container);
  };

  // Initial render with initialProps passed to wrapper
  const initialProps = options?.initialProps || {};
  renderComponent(initialProps);

  return {
    result,
    rerender: (newProps?: any) => {
      renderComponent(newProps !== undefined ? newProps : initialProps);
    },
    unmount: () => {
      ReactDOM.unmountComponentAtNode(container);
      if (document.body && document.body.contains(container)) {
        document.body.removeChild(container);
      }
    },
  };
}

// Mock dependencies
const mockGetALMConfig = globalUtils.getALMConfig as jest.MockedFunction<
  typeof globalUtils.getALMConfig
>;
const mockGetALMObject = globalUtils.getALMObject as jest.MockedFunction<
  typeof globalUtils.getALMObject
>;
const mockGetALMUser = globalUtils.getALMUser as jest.MockedFunction<typeof globalUtils.getALMUser>;
const mockLaunchPlayer = playbackUtils.LaunchPlayer as jest.MockedFunction<
  typeof playbackUtils.LaunchPlayer
>;
const mockClearBreadcrumbPathDetails =
  breadcrumbUtils.clearBreadcrumbPathDetails as jest.MockedFunction<
    typeof breadcrumbUtils.clearBreadcrumbPathDetails
  >;
const mockRestAdapter = RestAdapter as jest.Mocked<typeof RestAdapter>;
const mockJsonApiParse = JsonApiParse as jest.MockedFunction<typeof JsonApiParse>;

// Mock store
const createMockStore = (initialState?: any) => {
  const defaultState = {
    notification: {
      notifications: [],
      next: '',
      announcements: null,
      unreadCount: 0,
    },
  };

  return createStore(() => ({ ...defaultState, ...initialState }));
};

// Test data factories
const createMockNotification = (
  overrides?: Partial<PrimeUserNotification>
): PrimeUserNotification =>
  ({
    id: 'notif-1',
    channel: 'course::completed',
    dateCreated: '2024-01-01T00:00:00Z',
    message: 'Course completed',
    modelIds: ['course:123'],
    modelNames: ['Test Course'],
    modelTypes: ['learningObject'],
    read: false,
    role: 'Learner',
    type: 'Success',
    actionTaken: false,
    ...overrides,
  }) as PrimeUserNotification;

const wrapper = ({ children, store }: any) => <Provider store={store}>{children}</Provider>;

describe('useNotifications', () => {
  let mockStore: any;
  let mockALMObject: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockStore = createMockStore();

    mockALMObject = {
      isPrimeUserLoggedIn: jest.fn().mockReturnValue(true),
      navigateToTrainingOverviewPage: jest.fn(),
    };

    mockGetALMConfig.mockReturnValue({
      primeApiURL: 'https://test.api.com',
      learnerMobileApp: false,
      csrfToken: 'test-token',
    } as any);

    mockGetALMObject.mockReturnValue(mockALMObject);

    (mockGetALMUser.mockResolvedValue as any)({
      user: { id: 'user-123' } as any,
    });

    mockRestAdapter.get = jest.fn();
    mockRestAdapter.put = jest.fn();
    mockRestAdapter.patch = jest.fn();
  });

  // ==========================================
  // Initialization
  // ==========================================

  describe('initialization', () => {
    it('should return initial values', () => {
      const { result } = renderHook(() => useNotifications(), {
        wrapper,
        initialProps: { store: mockStore },
      });

      expect(result.current.notifications).toEqual([]);
      expect(result.current.announcements).toBeNull();
      expect(result.current.isLoading).toBe(true);
      expect(result.current.unreadCount).toBe(0);
    });
  });

  // ==========================================
  // fetchNotifications
  // ==========================================

  describe('fetchNotifications', () => {
    it('should fetch notifications successfully', async () => {
      const mockNotifications = [
        createMockNotification({ id: 'n1', read: false }),
        createMockNotification({ id: 'n2', read: true }),
      ];

      mockRestAdapter.get.mockResolvedValue({ data: [] } as any);
      (mockJsonApiParse.mockReturnValue as any)({
        userNotificationList: mockNotifications,
        links: { next: 'next-url', self: 'url' } as any,
      });

      const { result } = renderHook(() => useNotifications(), {
        wrapper,
        initialProps: { store: mockStore },
      });

      await act(async () => {
        await result.current.fetchNotifications();
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockRestAdapter.get).toHaveBeenCalledWith({
        url: 'https://test.api.com/users/user-123/userNotifications',
        params: expect.objectContaining({
          'page[limit]': 10,
          announcementsOnly: false,
          userSelectedChannels: expect.any(Array),
        }),
      });
    });

    it('should not fetch if user not logged in', async () => {
      mockALMObject.isPrimeUserLoggedIn.mockReturnValue(false);

      const { result } = renderHook(() => useNotifications(), {
        wrapper,
        initialProps: { store: mockStore },
      });

      await act(async () => {
        await result.current.fetchNotifications();
      });

      expect(mockRestAdapter.get).not.toHaveBeenCalled();
    });

    it('should handle API error', async () => {
      mockRestAdapter.get.mockRejectedValue(new Error('API Error'));
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const { result } = renderHook(() => useNotifications(), {
        wrapper,
        initialProps: { store: mockStore },
      });

      await act(async () => {
        await result.current.fetchNotifications();
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    it('should calculate unread count correctly', async () => {
      const mockNotifications = [
        createMockNotification({ id: 'n1', read: false }),
        createMockNotification({ id: 'n2', read: false }),
        createMockNotification({ id: 'n3', read: true }),
      ];

      mockRestAdapter.get.mockResolvedValue({ data: [] } as any);
      (mockJsonApiParse.mockReturnValue as any)({
        userNotificationList: mockNotifications,
        links: { self: 'url' } as any,
      });

      const { result } = renderHook(() => useNotifications(), {
        wrapper,
        initialProps: { store: mockStore },
      });

      await act(async () => {
        await result.current.fetchNotifications();
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Unread count should be 2 (n1 and n2)
      expect(mockJsonApiParse).toHaveBeenCalled();
    });

    it('should use mobile channels if learnerMobileApp is true', async () => {
      mockGetALMConfig.mockReturnValue({
        primeApiURL: 'https://test.api.com',
        learnerMobileApp: true,
      } as any);

      mockRestAdapter.get.mockResolvedValue({ data: [] } as any);
      (mockJsonApiParse.mockReturnValue as any)({
        userNotificationList: [],
        links: { self: 'url' } as any,
      });

      const { result } = renderHook(() => useNotifications(), {
        wrapper,
        initialProps: { store: mockStore },
      });

      await act(async () => {
        await result.current.fetchNotifications();
      });

      // Should use MOBILE_IMMERSIVE_NOTIFICATION_CHANNELS
      expect(mockRestAdapter.get).toHaveBeenCalledWith(
        expect.objectContaining({
          params: expect.objectContaining({
            userSelectedChannels: expect.any(Array),
          }),
        })
      );
    });
  });

  // ==========================================
  // pollUnreadNotificationCount
  // ==========================================

  describe('pollUnreadNotificationCount', () => {
    it('should poll unread count', async () => {
      const mockNotifications = [
        createMockNotification({ id: 'n1', read: false }),
        createMockNotification({ id: 'n2', read: false }),
      ];

      mockRestAdapter.get.mockResolvedValue({ data: [] } as any);
      (mockJsonApiParse.mockReturnValue as any)({
        userNotificationList: mockNotifications,
      });

      const { result } = renderHook(() => useNotifications(), {
        wrapper,
        initialProps: { store: mockStore },
      });

      await act(async () => {
        await result.current.pollUnreadNotificationCount();
      });

      expect(mockRestAdapter.get).toHaveBeenCalledWith({
        url: 'https://test.api.com/users/user-123/userNotifications',
        params: expect.objectContaining({
          read: false,
        }),
      });
    });

    it('should not poll if user not logged in', async () => {
      mockALMObject.isPrimeUserLoggedIn.mockReturnValue(false);

      const { result } = renderHook(() => useNotifications(), {
        wrapper,
        initialProps: { store: mockStore },
      });

      await act(async () => {
        await result.current.pollUnreadNotificationCount();
      });

      expect(mockRestAdapter.get).not.toHaveBeenCalled();
    });

    it('should handle API error gracefully', async () => {
      mockRestAdapter.get.mockRejectedValue(new Error('Network Error'));
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const { result } = renderHook(() => useNotifications(), {
        wrapper,
        initialProps: { store: mockStore },
      });

      await act(async () => {
        await result.current.pollUnreadNotificationCount();
      });

      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  // ==========================================
  // loadMoreNotifications
  // ==========================================

  describe('loadMoreNotifications', () => {
    it('should load more notifications if next URL exists', async () => {
      const mockStore = createMockStore({
        notification: {
          notifications: [createMockNotification()],
          next: 'next-url',
          announcements: null,
          unreadCount: 1,
        },
      });

      const mockMoreNotifications = [createMockNotification({ id: 'n3' })];

      (APIServiceInstance.loadMore as jest.Mock).mockResolvedValue({
        userNotificationList: mockMoreNotifications,
        links: { next: 'next-url-2' },
      });

      const { result } = renderHook(() => useNotifications(), {
        wrapper,
        initialProps: { store: mockStore },
      });

      await act(async () => {
        await result.current.loadMoreNotifications();
      });

      expect(APIServiceInstance.loadMore).toHaveBeenCalledWith('next-url');
    });

    it('should not load more if no next URL', async () => {
      const mockStore = createMockStore({
        notification: {
          notifications: [createMockNotification()],
          next: '',
          announcements: null,
          unreadCount: 1,
        },
      });

      const { result } = renderHook(() => useNotifications(), {
        wrapper,
        initialProps: { store: mockStore },
      });

      await act(async () => {
        await result.current.loadMoreNotifications();
      });

      expect(APIServiceInstance.loadMore).not.toHaveBeenCalled();
    });

    it('should handle loadMore error', async () => {
      const mockStore = createMockStore({
        notification: {
          notifications: [],
          next: 'next-url',
          announcements: null,
          unreadCount: 0,
        },
      });

      (APIServiceInstance.loadMore as jest.Mock).mockRejectedValue(new Error('Load More Error'));
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const { result } = renderHook(() => useNotifications(), {
        wrapper,
        initialProps: { store: mockStore },
      });

      await act(async () => {
        await result.current.loadMoreNotifications();
      });

      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  // ==========================================
  // markReadNotification
  // ==========================================

  describe('markReadNotification', () => {
    it('should mark unread notifications as read', async () => {
      const mockNotifications = [
        createMockNotification({ id: 'n1', read: false }),
        createMockNotification({ id: 'n2', read: false }),
        createMockNotification({ id: 'n3', read: true }),
      ];

      const mockStore = createMockStore({
        notification: {
          notifications: mockNotifications,
          next: '',
          announcements: null,
          unreadCount: 2,
        },
      });

      mockRestAdapter.put.mockResolvedValue({} as any);

      const { result } = renderHook(() => useNotifications(), {
        wrapper,
        initialProps: { store: mockStore },
      });

      await act(async () => {
        await result.current.markReadNotification();
      });

      expect(mockRestAdapter.put).toHaveBeenCalledWith({
        url: 'https://test.api.com/users/user-123/userNotificationsMarkRead',
        method: 'PUT',
        headers: {
          'content-type': 'application/json;charset=UTF-8',
        },
        body: JSON.stringify(['n1', 'n2']),
      });
    });

    it('should mark specific notifications as read', async () => {
      const specificNotifications = [createMockNotification({ id: 'n1', read: false })];

      mockRestAdapter.put.mockResolvedValue({} as any);

      const { result } = renderHook(() => useNotifications(), {
        wrapper,
        initialProps: { store: mockStore },
      });

      await act(async () => {
        await result.current.markReadNotification(specificNotifications as any);
      });

      expect(mockRestAdapter.put).toHaveBeenCalledWith(
        expect.objectContaining({
          body: JSON.stringify(['n1']),
        })
      );
    });

    it('should not call API if no unread notifications', async () => {
      const mockNotifications = [createMockNotification({ id: 'n1', read: true })];

      const mockStore = createMockStore({
        notification: {
          notifications: mockNotifications,
          next: '',
          announcements: null,
          unreadCount: 0,
        },
      });

      const { result } = renderHook(() => useNotifications(), {
        wrapper,
        initialProps: { store: mockStore },
      });

      await act(async () => {
        await result.current.markReadNotification();
      });

      expect(mockRestAdapter.put).not.toHaveBeenCalled();
    });
  });

  // ==========================================
  // markReadSingleNotification
  // ==========================================

  describe('markReadSingleNotification', () => {
    it('should mark single notification as read with optimistic update', async () => {
      const mockNotifications = [
        createMockNotification({ id: 'n1', read: false }),
        createMockNotification({ id: 'n2', read: false }),
      ];

      const mockStore = createMockStore({
        notification: {
          notifications: mockNotifications,
          next: '',
          announcements: null,
          unreadCount: 2,
        },
      });

      mockRestAdapter.patch.mockResolvedValue({} as any);

      const { result } = renderHook(() => useNotifications(), {
        wrapper,
        initialProps: { store: mockStore },
      });

      await act(async () => {
        await result.current.markReadSingleNotification('n1');
      });

      expect(mockRestAdapter.patch).toHaveBeenCalledWith({
        url: 'https://test.api.com/users/user-123/userNotifications/n1',
        method: 'PATCH',
        headers: expect.objectContaining({
          'content-type': 'application/vnd.api+json',
          'x-csrf-token': 'test-token',
        }),
        body: expect.stringContaining('"read":true'),
      });
    });

    it('should not call API if notification ID is empty', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const { result } = renderHook(() => useNotifications(), {
        wrapper,
        initialProps: { store: mockStore },
      });

      await act(async () => {
        await result.current.markReadSingleNotification('');
      });

      expect(mockRestAdapter.patch).not.toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith('Invalid notification ID provided');
      consoleErrorSpy.mockRestore();
    });

    it('should handle API error and revert optimistic update', async () => {
      const mockNotifications = [createMockNotification({ id: 'n1', read: false })];

      const mockStore = createMockStore({
        notification: {
          notifications: mockNotifications,
          next: '',
          announcements: null,
          unreadCount: 1,
        },
      });

      mockRestAdapter.patch.mockRejectedValue(new Error('API Error'));
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const { result } = renderHook(() => useNotifications(), {
        wrapper,
        initialProps: { store: mockStore },
      });

      await act(async () => {
        await result.current.markReadSingleNotification('n1');
      });

      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    it('should handle notification not found', async () => {
      const mockNotifications = [createMockNotification({ id: 'n1', read: false })];

      const mockStore = createMockStore({
        notification: {
          notifications: mockNotifications,
          next: '',
          announcements: null,
          unreadCount: 1,
        },
      });

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const { result } = renderHook(() => useNotifications(), {
        wrapper,
        initialProps: { store: mockStore },
      });

      await act(async () => {
        await result.current.markReadSingleNotification('nonexistent');
      });

      expect(mockRestAdapter.patch).not.toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  // ==========================================
  // redirectOverviewPage
  // ==========================================

  describe('redirectOverviewPage', () => {
    it('should launch player for job aid', async () => {
      const { result } = renderHook(() => useNotifications(), {
        wrapper,
        initialProps: { store: mockStore },
      });

      const jobAidNotif = createMockNotification({
        modelTypes: ['learningObject'],
        modelIds: ['jobaid:123'],
      } as any);

      act(() => {
        result.current.redirectOverviewPage(jobAidNotif);
      });

      expect(mockLaunchPlayer).toHaveBeenCalledWith({ trainingId: 'jobaid:123' } as any);
      expect(mockALMObject.navigateToTrainingOverviewPage).not.toHaveBeenCalled();
    });

    it('should navigate to training overview for non-job aid', async () => {
      const { result } = renderHook(() => useNotifications(), {
        wrapper,
        initialProps: { store: mockStore },
      });

      const courseNotif = createMockNotification({
        modelTypes: ['learningObject'],
        modelIds: ['course:123'],
        metadata: [{ id: 'instance-1' }] as any,
      } as any);

      act(() => {
        result.current.redirectOverviewPage(courseNotif);
      });

      expect(mockClearBreadcrumbPathDetails).toHaveBeenCalledWith('course:123');
      expect(mockALMObject.navigateToTrainingOverviewPage).toHaveBeenCalledWith(
        'course:123',
        'instance-1'
      );
    });

    it('should handle missing metadata', async () => {
      const { result } = renderHook(() => useNotifications(), {
        wrapper,
        initialProps: { store: mockStore },
      });

      const notif = createMockNotification({
        modelTypes: ['learningObject'],
        modelIds: ['course:123'],
      } as any);

      act(() => {
        result.current.redirectOverviewPage(notif);
      });

      expect(mockALMObject.navigateToTrainingOverviewPage).toHaveBeenCalledWith('course:123', '');
    });
  });

  // ==========================================
  // fetchAnnouncements
  // ==========================================

  describe('fetchAnnouncements', () => {
    it('should fetch announcement successfully', async () => {
      const mockAnnouncement = {
        id: 'announcement-1',
        title: 'Test Announcement',
        message: 'Test message',
      };

      mockRestAdapter.get.mockResolvedValue({ data: {} } as any);
      (mockJsonApiParse.mockReturnValue as any)({
        adminAnnouncement: mockAnnouncement as any,
      });

      const { result } = renderHook(() => useNotifications(), {
        wrapper,
        initialProps: { store: mockStore },
      });

      await act(async () => {
        await result.current.fetchAnnouncements('announcement-1');
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockRestAdapter.get).toHaveBeenCalledWith({
        url: 'https://test.api.com/announcements/announcement-1',
      });
    });

    it('should not fetch if announcement ID is empty', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const { result } = renderHook(() => useNotifications(), {
        wrapper,
        initialProps: { store: mockStore },
      });

      await act(async () => {
        await result.current.fetchAnnouncements('');
      });

      expect(mockRestAdapter.get).not.toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith('Invalid announcement ID provided');
      consoleErrorSpy.mockRestore();
    });

    it('should handle API error', async () => {
      mockRestAdapter.get.mockRejectedValue(new Error('API Error'));
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const { result } = renderHook(() => useNotifications(), {
        wrapper,
        initialProps: { store: mockStore },
      });

      await act(async () => {
        await result.current.fetchAnnouncements('announcement-1');
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    it('should handle invalid response', async () => {
      mockRestAdapter.get.mockResolvedValue(null);
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const { result } = renderHook(() => useNotifications(), {
        wrapper,
        initialProps: { store: mockStore },
      });

      await act(async () => {
        await result.current.fetchAnnouncements('announcement-1');
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  // ==========================================
  // updateNotification
  // ==========================================

  describe('updateNotification', () => {
    it('should update notification successfully', async () => {
      mockRestAdapter.patch.mockResolvedValue({ data: {} } as any);

      const { result } = renderHook(() => useNotifications(), {
        wrapper,
        initialProps: { store: mockStore },
      });

      const requestBody = createMockNotification({ read: true } as any);

      await act(async () => {
        const response = await result.current.updateNotification(
          'user-123',
          'notif-1',
          requestBody
        );
        expect(response).toEqual({ data: {} });
      });

      expect(mockRestAdapter.patch).toHaveBeenCalledWith({
        url: 'https://test.api.com/users/user-123/userNotifications/notif-1',
        method: 'PATCH',
        headers: expect.objectContaining({
          'content-type': 'application/vnd.api+json',
        }),
        body: expect.any(String),
      });
    });

    it('should handle requestBody with data wrapper', async () => {
      mockRestAdapter.patch.mockResolvedValue({ data: {} } as any);

      const { result } = renderHook(() => useNotifications(), {
        wrapper,
        initialProps: { store: mockStore },
      });

      const requestBody = {
        data: {
          type: 'userNotification',
          id: 'notif-1',
          attributes: { read: true },
        },
      } as any;

      await act(async () => {
        await result.current.updateNotification('user-123', 'notif-1', requestBody);
      });

      expect(mockRestAdapter.patch).toHaveBeenCalled();
    });

    it('should retry on failure', async () => {
      mockRestAdapter.patch
        .mockRejectedValueOnce(new Error('Network Error'))
        .mockResolvedValueOnce({ data: {} } as any);

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      const { result } = renderHook(() => useNotifications(), {
        wrapper,
        initialProps: { store: mockStore },
      });

      const requestBody = createMockNotification();

      await act(async () => {
        await result.current.updateNotification('user-123', 'notif-1', requestBody);
      });

      expect(mockRestAdapter.patch).toHaveBeenCalledTimes(2);
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Retrying'));
      consoleErrorSpy.mockRestore();
      consoleLogSpy.mockRestore();
    });

    it('should fail after max retries', async () => {
      mockRestAdapter.patch.mockRejectedValue(new Error('Persistent Error'));
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const { result } = renderHook(() => useNotifications(), {
        wrapper,
        initialProps: { store: mockStore },
      });

      const requestBody = createMockNotification();

      await act(async () => {
        await expect(
          result.current.updateNotification('user-123', 'notif-1', requestBody)
        ).rejects.toThrow('Persistent Error');
      });

      expect(mockRestAdapter.patch).toHaveBeenCalledTimes(3); // Initial + 2 retries
      consoleErrorSpy.mockRestore();
    });

    it('should not call API if user ID or notification ID is empty', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const { result } = renderHook(() => useNotifications(), {
        wrapper,
        initialProps: { store: mockStore },
      });

      const requestBody = createMockNotification();

      await act(async () => {
        await result.current.updateNotification('', 'notif-1', requestBody);
      });

      expect(mockRestAdapter.patch).not.toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  // ==========================================
  // getUserNotification
  // ==========================================

  describe('getUserNotification', () => {
    it('should fetch single notification successfully', async () => {
      const mockNotification = createMockNotification();

      mockRestAdapter.get.mockResolvedValue({ data: {} } as any);
      (mockJsonApiParse.mockReturnValue as any)({
        userNotification: mockNotification,
      });

      const { result } = renderHook(() => useNotifications(), {
        wrapper,
        initialProps: { store: mockStore },
      });

      let notification: any;
      await act(async () => {
        notification = await result.current.getUserNotification('notif-1');
      });

      expect(mockRestAdapter.get).toHaveBeenCalledWith({
        url: 'https://test.api.com/users/userNotifications/notif-1',
        headers: expect.objectContaining({
          'content-type': 'application/vnd.api+json',
        }),
      });
      expect(notification).toEqual(mockNotification);
    });

    it('should return null if notification ID is empty', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const { result } = renderHook(() => useNotifications(), {
        wrapper,
        initialProps: { store: mockStore },
      });

      let notification: any;
      await act(async () => {
        notification = await result.current.getUserNotification('');
      });

      expect(notification).toBeNull();
      expect(mockRestAdapter.get).not.toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    it('should return null on API error', async () => {
      mockRestAdapter.get.mockRejectedValue(new Error('API Error'));
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const { result } = renderHook(() => useNotifications(), {
        wrapper,
        initialProps: { store: mockStore },
      });

      let notification: any;
      await act(async () => {
        notification = await result.current.getUserNotification('notif-1');
      });

      expect(notification).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    it('should handle invalid response data', async () => {
      mockRestAdapter.get.mockResolvedValue({ data: {} } as any);
      mockJsonApiParse.mockReturnValue({} as any);
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const { result } = renderHook(() => useNotifications(), {
        wrapper,
        initialProps: { store: mockStore },
      });

      let notification: any;
      await act(async () => {
        notification = await result.current.getUserNotification('notif-1');
      });

      expect(notification).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  // ==========================================
  // Edge Cases & Integration
  // ==========================================

  describe('edge cases and integration', () => {
    it('should handle user not logged in gracefully', async () => {
      mockALMObject.isPrimeUserLoggedIn.mockReturnValue(false);

      const { result } = renderHook(() => useNotifications(), {
        wrapper,
        initialProps: { store: mockStore },
      });

      await act(async () => {
        await result.current.fetchNotifications();
        await result.current.pollUnreadNotificationCount();
      });

      expect(mockRestAdapter.get).not.toHaveBeenCalled();
    });

    it('should handle undefined getALMUser response', async () => {
      mockGetALMUser.mockResolvedValue(undefined);

      const { result } = renderHook(() => useNotifications(), {
        wrapper,
        initialProps: { store: mockStore },
      });

      await act(async () => {
        await result.current.fetchNotifications();
      });

      expect(mockRestAdapter.get).not.toHaveBeenCalled();
    });

    it('should handle empty notifications list', async () => {
      mockRestAdapter.get.mockResolvedValue({ data: [] } as any);
      (mockJsonApiParse.mockReturnValue as any)({
        userNotificationList: [],
        links: { self: 'url' } as any,
      });

      const { result } = renderHook(() => useNotifications(), {
        wrapper,
        initialProps: { store: mockStore },
      });

      await act(async () => {
        await result.current.fetchNotifications();
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should handle CSRF token in requests', async () => {
      mockRestAdapter.patch.mockResolvedValue({} as any);

      const mockNotifications = [createMockNotification({ id: 'n1', read: false })];

      const mockStore = createMockStore({
        notification: {
          notifications: mockNotifications,
          next: '',
          announcements: null,
          unreadCount: 1,
        },
      });

      const { result } = renderHook(() => useNotifications(), {
        wrapper,
        initialProps: { store: mockStore },
      });

      await act(async () => {
        await result.current.markReadSingleNotification('n1');
      });

      expect(mockRestAdapter.patch).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: expect.objectContaining({
            'x-csrf-token': 'test-token',
          }),
        })
      );
    });

    it('should handle job aid with uppercase ID', async () => {
      const { result } = renderHook(() => useNotifications(), {
        wrapper,
        initialProps: { store: mockStore },
      });

      const jobAidNotif = createMockNotification({
        modelTypes: ['learningObject'],
        modelIds: ['JOBAID:123'],
      } as any);

      act(() => {
        result.current.redirectOverviewPage(jobAidNotif);
      });

      expect(mockLaunchPlayer).toHaveBeenCalled();
    });
  });
});
