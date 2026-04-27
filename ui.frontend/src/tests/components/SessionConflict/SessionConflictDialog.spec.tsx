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
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SessionConflictDialog from '@components/SessionConflict/SessionConflictDialog';

const mockGetALMObject = jest.fn();
const mockGetTranslation = jest.fn();
const mockNavigateToTrainingOverviewPage = jest.fn();
const mockHandleEnrollment = jest.fn();
const mockConfirmationDialog = jest.fn();

jest.mock('@utils/global', () => ({
  getALMObject: () => mockGetALMObject(),
}));

jest.mock('@utils/translationService', () => ({
  GetTranslation: (key: string, flag?: boolean) => mockGetTranslation(key, flag),
}));

const defaultSession = {
  course: { id: 'course-123' },
  courseInstance: { id: 'instance-456' },
  courseName: [{ name: 'JavaScript Fundamentals' }],
  loResourceName: [{ name: 'Session 1: Introduction' }],
  timeSlot: {
    startTime: '2025-01-15T10:00:00Z',
    endTime: '2025-01-15T11:30:00Z',
  },
};

const defaultProps = {
  conflictingSessionsList: [defaultSession],
  locale: 'en-US',
  handleEnrollment: mockHandleEnrollment,
  confirmationDialog: mockConfirmationDialog,
  delay: 100,
};

describe('SessionConflictDialog', () => {
  beforeEach(() => {
    jest.useFakeTimers();

    // resetMocks: true clears all implementations — restore here
    mockGetALMObject.mockReturnValue({
      navigateToTrainingOverviewPage: mockNavigateToTrainingOverviewPage,
    });
    mockGetTranslation.mockImplementation((key: string) => key);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('confirmationDialog_called_withCorrectTitleAndButtonLabels', async () => {
    await SessionConflictDialog(defaultProps);

    expect(mockConfirmationDialog).toHaveBeenCalledWith(
      'text.warning',
      expect.anything(),
      'alm.overview.button.enroll',
      'alm.overview.cancel',
      expect.any(Function)
    );
  });

  it('sessionContent_rendersSessionDataAndConflictMessages', async () => {
    await SessionConflictDialog(defaultProps);

    const content = mockConfirmationDialog.mock.calls[0][1];
    render(content);

    expect(screen.getByText('JavaScript Fundamentals')).toBeInTheDocument();
    expect(screen.getByText(/Session 1: Introduction/)).toBeInTheDocument();
    expect(screen.getByText('alm.conflicting.sessions.message1')).toBeInTheDocument();
    expect(screen.getByText('alm.conflicting.sessions.message2')).toBeInTheDocument();
  });

  it('sessionSpan_onClick_navigatesToTrainingOverviewPageWithCorrectIds', async () => {
    await SessionConflictDialog(defaultProps);

    const content = mockConfirmationDialog.mock.calls[0][1];
    render(content);

    userEvent.click(screen.getByTitle('JavaScript Fundamentals'));

    expect(mockNavigateToTrainingOverviewPage).toHaveBeenCalledWith('course-123', 'instance-456');
  });

  it('enrollmentCallback_afterDelay_callsHandleEnrollment', async () => {
    await SessionConflictDialog(defaultProps);

    const callback = mockConfirmationDialog.mock.calls[0][4];
    callback();

    expect(mockHandleEnrollment).not.toHaveBeenCalled();
    jest.advanceTimersByTime(100);
    expect(mockHandleEnrollment).toHaveBeenCalledTimes(1);
  });

  it('enrollmentCallback_beforeDelayElapsed_doesNotCallHandleEnrollment', async () => {
    await SessionConflictDialog({ ...defaultProps, delay: 500 });

    const callback = mockConfirmationDialog.mock.calls[0][4];
    callback();

    jest.advanceTimersByTime(499);
    expect(mockHandleEnrollment).not.toHaveBeenCalled();
    jest.advanceTimersByTime(1);
    expect(mockHandleEnrollment).toHaveBeenCalledTimes(1);
  });

  it('multipleConflictingSessions_rendersEachCourseInContent', async () => {
    const twoSessions = [
      defaultSession,
      {
        ...defaultSession,
        course: { id: 'course-789' },
        courseInstance: { id: 'instance-789' },
        courseName: [{ name: 'Advanced React' }],
        loResourceName: [{ name: 'Session 2: Hooks' }],
      },
    ];

    await SessionConflictDialog({ ...defaultProps, conflictingSessionsList: twoSessions });

    const content = mockConfirmationDialog.mock.calls[0][1];
    render(content);

    expect(screen.getByText('JavaScript Fundamentals')).toBeInTheDocument();
    expect(screen.getByText('Advanced React')).toBeInTheDocument();
  });
});
