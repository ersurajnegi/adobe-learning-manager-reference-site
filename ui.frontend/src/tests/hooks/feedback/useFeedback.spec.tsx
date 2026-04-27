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
 * Unit Tests for useFeedback Hook
 *
 * Hook handles:
 * - L1 feedback form state management
 * - Fetching notifications for feedback prompts
 * - Fetching learning object details with feedback info
 * - Submitting L1 feedback
 * - Opening and closing feedback wrapper
 * - Integration with RestAdapter for API calls
 */

// Mock dependencies BEFORE imports
jest.mock('../../../almLib/utils/global', () => ({
  getALMConfig: jest.fn(),
}));

jest.mock('../../../almLib/utils/restAdapter', () => ({
  RestAdapter: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

jest.mock('../../../almLib/utils/jsonAPIAdapter', () => ({
  JsonApiParse: jest.fn(),
}));

jest.mock('../../../almLib/utils/widgets/utils', () => ({
  getUserId: jest.fn(),
}));

import { act } from '@testing-library/react';
import React from 'react';
import ReactDOM from 'react-dom';
import { useFeedback } from '../../../almLib/hooks/feedback/useFeedback';
import { getALMConfig } from '../../../almLib/utils/global';
import { RestAdapter } from '../../../almLib/utils/restAdapter';
import { JsonApiParse } from '../../../almLib/utils/jsonAPIAdapter';
import { getUserId } from '../../../almLib/utils/widgets/utils';

// Custom renderHook implementation for React Testing Library v9
function renderHook<T>(hookCallback: () => T) {
  const result: any = { current: null };

  function TestComponent() {
    result.current = hookCallback();
    return null;
  }

  const container = document.createElement('div');

  if (document.body) {
    document.body.appendChild(container);
  }

  ReactDOM.render(React.createElement(TestComponent), container);

  return {
    result,
    rerender: () => {
      ReactDOM.render(React.createElement(TestComponent), container);
    },
    unmount: () => {
      ReactDOM.unmountComponentAtNode(container);
      if (container.parentNode) {
        container.parentNode.removeChild(container);
      }
    },
  };
}

describe('useFeedback', () => {
  const mockGetALMConfig = getALMConfig as jest.MockedFunction<typeof getALMConfig>;
  const mockRestAdapterGet = RestAdapter.get as jest.MockedFunction<typeof RestAdapter.get>;
  const mockRestAdapterPost = RestAdapter.post as jest.MockedFunction<typeof RestAdapter.post>;
  const mockJsonApiParse = JsonApiParse as jest.MockedFunction<typeof JsonApiParse>;
  const mockGetUserId = getUserId as jest.MockedFunction<typeof getUserId>;

  const mockConfig = {
    primeApiURL: 'https://learningmanager.adobe.com/primeapi/v2',
  };

  const mockWidget = {
    id: 'widget-1',
    type: 'feedback',
  };

  const mockLearningObject = {
    id: 'course:123',
    type: 'learningObject',
    attributes: {
      name: 'Test Course',
    },
  };

  const mockNotification = {
    id: 'notification:1',
    type: 'userNotification',
    attributes: {
      channel: 'course::l1FeedbackPrompt',
    },
  };

  const mockEnrollment = {
    id: 'enrollment:456',
    type: 'enrollment',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetALMConfig.mockReturnValue(mockConfig as any);
    mockGetUserId.mockResolvedValue('user:789');
    mockJsonApiParse.mockImplementation((data: any) => data);
  });

  describe('Hook Initialization', () => {
    it('should initialize with widget parameter', () => {
      const { result } = renderHook(() => useFeedback(mockWidget as any));
      expect(result.current.feedbackTrainingId).toBe('');
      expect(result.current.shouldLaunchFeedback).toBe(false);
    });

    it('should initialize with empty feedbackTrainingId', () => {
      const { result } = renderHook(() => useFeedback());
      expect(result.current.feedbackTrainingId).toBe('');
    });

    it('should initialize with empty trainingInstanceId', () => {
      const { result } = renderHook(() => useFeedback());
      expect(result.current.trainingInstanceId).toBe('');
    });

    it('should initialize with playerLaunchTimeStamp 0', () => {
      const { result } = renderHook(() => useFeedback());
      expect(result.current.playerLaunchTimeStamp).toBe(0);
    });

    it('should initialize with shouldLaunchFeedback false', () => {
      const { result } = renderHook(() => useFeedback());
      expect(result.current.shouldLaunchFeedback).toBe(false);
    });

    it('should initialize with empty notificationId', () => {
      const { result } = renderHook(() => useFeedback());
      expect(result.current.notificationId).toBe('');
    });
  });

  describe('handleL1FeedbackLaunch', () => {
    it('should set feedbackTrainingId', () => {
      const { result } = renderHook(() => useFeedback());

      act(() => {
        result.current.handleL1FeedbackLaunch('course:123', 'instance:456', 1234567890);
      });

      expect(result.current.feedbackTrainingId).toBe('course:123');
    });

    it('should set trainingInstanceId', () => {
      const { result } = renderHook(() => useFeedback());

      act(() => {
        result.current.handleL1FeedbackLaunch('course:123', 'instance:456', 1234567890);
      });

      expect(result.current.trainingInstanceId).toBe('instance:456');
    });

    it('should set playerLaunchTimeStamp', () => {
      const { result } = renderHook(() => useFeedback());

      act(() => {
        result.current.handleL1FeedbackLaunch('course:123', 'instance:456', 1234567890);
      });

      expect(result.current.playerLaunchTimeStamp).toBe(1234567890);
    });

    it('should set shouldLaunchFeedback to true', () => {
      const { result } = renderHook(() => useFeedback());

      act(() => {
        result.current.handleL1FeedbackLaunch('course:123', 'instance:456', 1234567890);
      });

      expect(result.current.shouldLaunchFeedback).toBe(true);
    });

    it('should set notificationId when provided', () => {
      const { result } = renderHook(() => useFeedback());

      act(() => {
        result.current.handleL1FeedbackLaunch(
          'course:123',
          'instance:456',
          1234567890,
          'notification:1'
        );
      });

      expect(result.current.notificationId).toBe('notification:1');
    });

    it('should set empty notificationId when not provided', () => {
      const { result } = renderHook(() => useFeedback());

      act(() => {
        result.current.handleL1FeedbackLaunch('course:123', 'instance:456', 1234567890);
      });

      expect(result.current.notificationId).toBe('');
    });

    it('should update all state values together', () => {
      const { result } = renderHook(() => useFeedback());

      act(() => {
        result.current.handleL1FeedbackLaunch(
          'course:999',
          'instance:888',
          9999999999,
          'notification:777'
        );
      });

      expect(result.current.feedbackTrainingId).toBe('course:999');
      expect(result.current.trainingInstanceId).toBe('instance:888');
      expect(result.current.playerLaunchTimeStamp).toBe(9999999999);
      expect(result.current.notificationId).toBe('notification:777');
      expect(result.current.shouldLaunchFeedback).toBe(true);
    });
  });

  describe('getNotificationsForUser', () => {
    it('should fetch notifications for user', async () => {
      mockRestAdapterGet.mockResolvedValue({ data: [mockNotification] });

      const { result } = renderHook(() => useFeedback());

      let response;
      await act(async () => {
        response = await result.current.getFilteredNotificationForFeedback({
          userSelectedChannels: 'course::l1FeedbackPrompt',
        });
      });

      expect(mockRestAdapterGet).toHaveBeenCalledWith({
        url: 'https://learningmanager.adobe.com/primeapi/v2/users/user:789/userNotifications',
        params: { userSelectedChannels: 'course::l1FeedbackPrompt' },
      });
    });

    it('should handle when userId is not available', async () => {
      mockGetUserId.mockResolvedValue(null);
      mockJsonApiParse.mockReturnValue({ userNotificationList: [] });

      const { result } = renderHook(() => useFeedback());

      let response;
      await act(async () => {
        response = await result.current.getFilteredNotificationForFeedback({});
      });

      // When userId is null, getNotificationsForUser returns undefined
      // JsonApiParse is still called on undefined, which returns mocked value
      expect(response).toEqual([]);
      expect(mockRestAdapterGet).not.toHaveBeenCalled();
      expect(mockGetUserId).toHaveBeenCalled();
    });

    it('should call getUserId', async () => {
      mockRestAdapterGet.mockResolvedValue({ data: [] });

      const { result } = renderHook(() => useFeedback());

      await act(async () => {
        await result.current.getFilteredNotificationForFeedback({});
      });

      expect(mockGetUserId).toHaveBeenCalled();
    });

    it('should use correct API endpoint', async () => {
      mockRestAdapterGet.mockResolvedValue({ data: [] });

      const { result } = renderHook(() => useFeedback());

      await act(async () => {
        await result.current.getFilteredNotificationForFeedback({ page: 1 });
      });

      expect(mockRestAdapterGet).toHaveBeenCalledWith({
        url: 'https://learningmanager.adobe.com/primeapi/v2/users/user:789/userNotifications',
        params: { page: 1 },
      });
    });
  });

  describe('getFilteredNotificationForFeedback', () => {
    it('should parse notification response', async () => {
      mockRestAdapterGet.mockResolvedValue({ data: [mockNotification] });
      mockJsonApiParse.mockReturnValue({ userNotificationList: [mockNotification] });

      const { result } = renderHook(() => useFeedback());

      let response;
      await act(async () => {
        response = await result.current.getFilteredNotificationForFeedback({});
      });

      expect(mockJsonApiParse).toHaveBeenCalled();
      expect(response).toEqual([mockNotification]);
    });

    it('should return parsed userNotificationList', async () => {
      const notifications = [mockNotification, { ...mockNotification, id: 'notification:2' }];
      mockRestAdapterGet.mockResolvedValue({ data: notifications });
      mockJsonApiParse.mockReturnValue({ userNotificationList: notifications });

      const { result } = renderHook(() => useFeedback());

      let response;
      await act(async () => {
        response = await result.current.getFilteredNotificationForFeedback({});
      });

      expect(response).toHaveLength(2);
      expect(response).toEqual(notifications);
    });
  });

  describe('fetchCurrentLo', () => {
    it('should fetch learning object with feedback info', async () => {
      mockRestAdapterGet.mockResolvedValue({ data: mockLearningObject });
      mockJsonApiParse.mockReturnValue({ learningObject: mockLearningObject });

      const { result } = renderHook(() => useFeedback());
      const mockCloseFeedback = jest.fn();

      let response;
      await act(async () => {
        response = await result.current.fetchCurrentLo('course:123', mockCloseFeedback);
      });

      expect(mockRestAdapterGet).toHaveBeenCalledWith({
        url: 'https://learningmanager.adobe.com/primeapi/v2/learningObjects/course:123',
        params: {
          include:
            'subLOs.enrollment.loInstance.l1FeedbackInfo,enrollment.loInstance.l1FeedbackInfo,instances.enrollment.loInstance.l1FeedbackInfo',
        },
      });
    });

    it('should return parsed learning object', async () => {
      mockRestAdapterGet.mockResolvedValue({ data: mockLearningObject });
      mockJsonApiParse.mockReturnValue({ learningObject: mockLearningObject });

      const { result } = renderHook(() => useFeedback());
      const mockCloseFeedback = jest.fn();

      let response;
      await act(async () => {
        response = await result.current.fetchCurrentLo('course:123', mockCloseFeedback);
      });

      expect(response).toEqual(mockLearningObject);
    });

    it('should call closeFeedbackPopUp on 400 error', async () => {
      mockRestAdapterGet.mockRejectedValue({ status: 400 });
      mockJsonApiParse.mockReturnValue({ learningObject: undefined });

      const { result } = renderHook(() => useFeedback());
      const mockCloseFeedback = jest.fn();

      await act(async () => {
        await result.current.fetchCurrentLo('course:123', mockCloseFeedback);
      });

      expect(mockCloseFeedback).toHaveBeenCalled();
    });

    it('should not call closeFeedbackPopUp on non-400 error', async () => {
      mockRestAdapterGet.mockRejectedValue({ status: 500 });
      mockJsonApiParse.mockReturnValue({ learningObject: undefined });

      const { result } = renderHook(() => useFeedback());
      const mockCloseFeedback = jest.fn();

      await act(async () => {
        await result.current.fetchCurrentLo('course:123', mockCloseFeedback);
      });

      expect(mockCloseFeedback).not.toHaveBeenCalled();
    });

    it('should handle successful fetch with correct includes', async () => {
      mockRestAdapterGet.mockResolvedValue({ data: mockLearningObject });
      mockJsonApiParse.mockReturnValue({ learningObject: mockLearningObject });

      const { result } = renderHook(() => useFeedback());
      const mockCloseFeedback = jest.fn();

      await act(async () => {
        await result.current.fetchCurrentLo('course:456', mockCloseFeedback);
      });

      const callArgs = mockRestAdapterGet.mock.calls[0][0];
      expect(callArgs.params.include).toContain('subLOs.enrollment.loInstance.l1FeedbackInfo');
      expect(callArgs.params.include).toContain('enrollment.loInstance.l1FeedbackInfo');
      expect(callArgs.params.include).toContain('instances.enrollment.loInstance.l1FeedbackInfo');
    });
  });

  describe('submitL1Feedback', () => {
    it('should submit feedback successfully', async () => {
      const feedbackBody = {
        type: 'l1Feedback',
        attributes: {
          rating: 5,
          comment: 'Great course!',
        },
      };
      mockRestAdapterPost.mockResolvedValue({ data: { success: true } });

      const { result } = renderHook(() => useFeedback());

      let response;
      await act(async () => {
        response = await result.current.submitL1Feedback(mockEnrollment as any, feedbackBody);
      });

      expect(mockRestAdapterPost).toHaveBeenCalledWith({
        url: 'https://learningmanager.adobe.com/primeapi/v2/enrollments/enrollment:456/l1Feedback',
        method: 'POST',
        body: JSON.stringify({ data: feedbackBody }),
        headers: {
          'content-type': 'application/vnd.api+json;charset=UTF-8',
        },
      });
      expect(response).toEqual({ data: { success: true } });
    });

    it('should throw error on submission failure', async () => {
      const feedbackBody = { type: 'l1Feedback' };
      const error = new Error('Submission failed');
      mockRestAdapterPost.mockRejectedValue(error);

      const { result } = renderHook(() => useFeedback());

      await act(async () => {
        await expect(
          result.current.submitL1Feedback(mockEnrollment as any, feedbackBody)
        ).rejects.toThrow('Submission failed');
      });
    });

    it('should use correct content-type header', async () => {
      const feedbackBody = { type: 'l1Feedback' };
      mockRestAdapterPost.mockResolvedValue({ data: {} });

      const { result } = renderHook(() => useFeedback());

      await act(async () => {
        await result.current.submitL1Feedback(mockEnrollment as any, feedbackBody);
      });

      const callArgs = mockRestAdapterPost.mock.calls[0][0];
      expect(callArgs.headers['content-type']).toBe('application/vnd.api+json;charset=UTF-8');
    });

    it('should stringify request body', async () => {
      const feedbackBody = { type: 'l1Feedback', attributes: { rating: 4 } };
      mockRestAdapterPost.mockResolvedValue({ data: {} });

      const { result } = renderHook(() => useFeedback());

      await act(async () => {
        await result.current.submitL1Feedback(mockEnrollment as any, feedbackBody);
      });

      const callArgs = mockRestAdapterPost.mock.calls[0][0];
      expect(callArgs.body).toBe(JSON.stringify({ data: feedbackBody }));
    });

    it('should handle undefined enrollment', async () => {
      const feedbackBody = { type: 'l1Feedback' };
      mockRestAdapterPost.mockResolvedValue({ data: {} });

      const { result } = renderHook(() => useFeedback());

      await act(async () => {
        await result.current.submitL1Feedback(undefined, feedbackBody);
      });

      expect(mockRestAdapterPost).toHaveBeenCalledWith({
        url: 'https://learningmanager.adobe.com/primeapi/v2/enrollments/undefined/l1Feedback',
        method: 'POST',
        body: expect.any(String),
        headers: expect.any(Object),
      });
    });
  });

  describe('closeFeedbackWrapper', () => {
    it('should reset shouldLaunchFeedback to false', () => {
      const { result } = renderHook(() => useFeedback());

      act(() => {
        result.current.handleL1FeedbackLaunch(
          'course:123',
          'instance:456',
          1234567890,
          'notification:1'
        );
      });

      expect(result.current.shouldLaunchFeedback).toBe(true);

      act(() => {
        result.current.closeFeedbackWrapper();
      });

      expect(result.current.shouldLaunchFeedback).toBe(false);
    });

    it('should reset feedbackTrainingId to empty string', () => {
      const { result } = renderHook(() => useFeedback());

      act(() => {
        result.current.handleL1FeedbackLaunch('course:123', 'instance:456', 1234567890);
      });

      expect(result.current.feedbackTrainingId).toBe('course:123');

      act(() => {
        result.current.closeFeedbackWrapper();
      });

      expect(result.current.feedbackTrainingId).toBe('');
    });

    it('should reset trainingInstanceId to empty string', () => {
      const { result } = renderHook(() => useFeedback());

      act(() => {
        result.current.handleL1FeedbackLaunch('course:123', 'instance:456', 1234567890);
      });

      expect(result.current.trainingInstanceId).toBe('instance:456');

      act(() => {
        result.current.closeFeedbackWrapper();
      });

      expect(result.current.trainingInstanceId).toBe('');
    });

    it('should reset playerLaunchTimeStamp to 0', () => {
      const { result } = renderHook(() => useFeedback());

      act(() => {
        result.current.handleL1FeedbackLaunch('course:123', 'instance:456', 1234567890);
      });

      expect(result.current.playerLaunchTimeStamp).toBe(1234567890);

      act(() => {
        result.current.closeFeedbackWrapper();
      });

      expect(result.current.playerLaunchTimeStamp).toBe(0);
    });

    it('should reset notificationId to empty string', () => {
      const { result } = renderHook(() => useFeedback());

      act(() => {
        result.current.handleL1FeedbackLaunch(
          'course:123',
          'instance:456',
          1234567890,
          'notification:1'
        );
      });

      expect(result.current.notificationId).toBe('notification:1');

      act(() => {
        result.current.closeFeedbackWrapper();
      });

      expect(result.current.notificationId).toBe('');
    });

    it('should reset all state values together', () => {
      const { result } = renderHook(() => useFeedback());

      act(() => {
        result.current.handleL1FeedbackLaunch(
          'course:999',
          'instance:888',
          9999999999,
          'notification:777'
        );
      });

      act(() => {
        result.current.closeFeedbackWrapper();
      });

      expect(result.current.feedbackTrainingId).toBe('');
      expect(result.current.trainingInstanceId).toBe('');
      expect(result.current.playerLaunchTimeStamp).toBe(0);
      expect(result.current.notificationId).toBe('');
      expect(result.current.shouldLaunchFeedback).toBe(false);
    });
  });

  describe('Constants', () => {
    it('should use correct L1 feedback channel constant', async () => {
      // Verify the L1 feedback channel is used correctly in notification calls
      mockRestAdapterGet.mockResolvedValue({ data: [] });
      mockJsonApiParse.mockReturnValue({ userNotificationList: [] });

      const { result } = renderHook(() => useFeedback());

      await act(async () => {
        await result.current.getFilteredNotificationForFeedback({ userSelectedChannels: 'course::l1FeedbackPrompt' });
      });

      expect(mockRestAdapterGet).toHaveBeenCalledWith(
        expect.objectContaining({
          params: expect.objectContaining({ userSelectedChannels: 'course::l1FeedbackPrompt' }),
        })
      );
    });

    it('should use baseApiUrl from config', async () => {
      mockRestAdapterGet.mockResolvedValue({ data: mockLearningObject });
      mockJsonApiParse.mockReturnValue({ learningObject: mockLearningObject });

      const { result } = renderHook(() => useFeedback());

      await act(async () => {
        await result.current.fetchCurrentLo('course:123', jest.fn());
      });

      expect(mockGetALMConfig).toHaveBeenCalled();
      const callUrl = mockRestAdapterGet.mock.calls[0][0].url;
      expect(callUrl).toContain('https://learningmanager.adobe.com/primeapi/v2');
    });
  });
});
