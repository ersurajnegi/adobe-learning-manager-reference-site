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
const mockReplaceLoType = jest.fn();
const mockModifyTimeDDMMYY = jest.fn();
const mockModifyTimeForSessionReminderNotif = jest.fn();

jest.mock('@utils/translationService', () => ({
  ReplaceLoTypeWithAccountTerminology: (type: string) => mockReplaceLoType(type),
}));

jest.mock('@utils/dateTime', () => ({
  modifyTimeDDMMYY: (...args: any[]) => mockModifyTimeDDMMYY(...args),
  modifyTimeForSessionReminderNotif: (...args: any[]) => mockModifyTimeForSessionReminderNotif(...args),
}));

import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { IntlProvider } from 'react-intl';
import PrimeNotificationText from '@components/Notifications/PrimeNotificationText/PrimeNotificationText';

const mockRedirectOverviewPage = jest.fn();
const mockSetAnnouncementOpen = jest.fn();
const mockSetShowNotifications = jest.fn();
const mockSetAnnouncementData = jest.fn();

const defaultProps = {
  redirectOverviewPage: mockRedirectOverviewPage,
  setAnnouncementOpen: mockSetAnnouncementOpen,
  setShowNotifications: mockSetShowNotifications,
  setAnnouncementData: mockSetAnnouncementData,
};

const renderText = (notification: any, locale = 'en-US') =>
  render(
    <IntlProvider locale={locale}>
      <PrimeNotificationText {...defaultProps} notification={notification} />
    </IntlProvider>
  );

describe('PrimeNotificationText', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockReplaceLoType.mockImplementation((type: string) => type);
    mockModifyTimeDDMMYY.mockReturnValue('Formatted Date');
    mockModifyTimeForSessionReminderNotif.mockReturnValue('Session Time');
  });

  it('calls ReplaceLoTypeWithAccountTerminology for course, learningProgram, and certification on every render', () => {
    renderText({ message: 'msg', channel: 'course::completed', modelNames: ['N'], modelTypes: ['learningObject'] });
    expect(mockReplaceLoType).toHaveBeenCalledWith('course');
    expect(mockReplaceLoType).toHaveBeenCalledWith('learningProgram');
    expect(mockReplaceLoType).toHaveBeenCalledWith('certification');
  });

  describe('learningObject name', () => {
    const loNotification = {
      message: 'You completed {{{name0}}}',
      channel: 'course::completed',
      modelNames: ['React Course'],
      modelTypes: ['learningObject'],
      modelIds: ['lo-123', ''],
      announcement: null,
    };

    it('renders the model name as an anchor element', () => {
      const { container } = renderText(loNotification);
      expect(container.querySelector('a')!.textContent!.trim()).toBe('React Course');
    });

    it('applies the loLink CSS class to the anchor', () => {
      const { container } = renderText(loNotification);
      expect(container.querySelector('a')!.className).toContain('loLink');
    });

    it('calls redirectOverviewPage with the notification when the link is clicked', () => {
      const { container } = renderText(loNotification);
      userEvent.click(container.querySelector('a') as HTMLElement);
      expect(mockRedirectOverviewPage).toHaveBeenCalledWith(loNotification);
      expect(mockRedirectOverviewPage).toHaveBeenCalledTimes(1);
    });
  });

  describe('date/time formatting', () => {
    it('calls modifyTimeDDMMYY with the model name and locale for non-reminder channels', () => {
      renderText({
        message: 'Deadline: {{{name0}}}',
        channel: 'course::completed',
        modelNames: ['2024-01-15'],
        modelTypes: ['date'],
        modelIds: ['lo-123', ''],
        announcement: null,
      });
      expect(mockModifyTimeDDMMYY).toHaveBeenCalledWith('2024-01-15 ', 'en-US');
    });

    it('passes the IntlProvider locale to modifyTimeDDMMYY', () => {
      renderText(
        {
          message: 'Deadline: {{{name0}}}',
          channel: 'course::completed',
          modelNames: ['2024-01-15'],
          modelTypes: ['date'],
          modelIds: ['lo-123', ''],
          announcement: null,
        },
        'fr-FR'
      );
      expect(mockModifyTimeDDMMYY).toHaveBeenCalledWith('2024-01-15 ', 'fr-FR');
    });

    it('calls modifyTimeForSessionReminderNotif with modelIds[1] and locale for reminder channels', () => {
      renderText({
        message: '{{{name0}}} starts at {{{name1}}}',
        channel: 'course::sessionReminder',
        modelNames: ['React Course', '2024-01-15T10:00:00Z'],
        modelTypes: ['learningObject', 'date'],
        modelIds: ['lo-123', 'session-456'],
        announcement: null,
      });
      expect(mockModifyTimeForSessionReminderNotif).toHaveBeenCalledWith('session-456', 'en-US');
    });
  });

  describe('feedback channel', () => {
    it('strips the name1 placeholder for course::l1FeedbackPrompt so the second model name is not rendered', () => {
      const { container } = renderText({
        message: 'Please provide feedback for {{{name0}}}\n{{{name1}}}',
        channel: 'course::l1FeedbackPrompt',
        modelNames: ['React Course', 'Extra Info'],
        modelTypes: ['learningObject', 'text'],
        modelIds: ['lo-123', ''],
        announcement: null,
      });
      expect(container.textContent).toContain('React Course');
      expect(container.textContent).not.toContain('Extra Info');
    });

    it('strips the name1 placeholder for learningProgram::l1Feedback', () => {
      const { container } = renderText({
        message: 'Feedback for {{{name0}}}\n{{{name1}}}',
        channel: 'learningProgram::l1Feedback',
        modelNames: ['Program Name', 'Extra'],
        modelTypes: ['learningObject', 'text'],
        modelIds: ['lp-123', ''],
        announcement: null,
      });
      expect(container.textContent).toContain('Program Name');
      expect(container.textContent).not.toContain('Extra');
    });
  });

  describe('announcement click handler', () => {
    it('calls setAnnouncementOpen(true), setShowNotifications(false), and setAnnouncementData with the notification when a link is clicked on an announcement notification; does not call redirectOverviewPage', () => {
      const notification = {
        message: 'Read {{{name0}}}',
        channel: 'announcement::general',
        modelNames: ['Important Update'],
        modelTypes: ['learningObject'],
        modelIds: ['lo-123', ''],
        announcement: { id: 'ann-1', title: 'Update' },
      };
      const { container } = renderText(notification);
      userEvent.click(container.querySelector('a') as HTMLElement);
      expect(mockSetAnnouncementOpen).toHaveBeenCalledWith(true);
      expect(mockSetShowNotifications).toHaveBeenCalledWith(false);
      expect(mockSetAnnouncementData).toHaveBeenCalledWith(notification);
      expect(mockRedirectOverviewPage).not.toHaveBeenCalled();
    });
  });
});
