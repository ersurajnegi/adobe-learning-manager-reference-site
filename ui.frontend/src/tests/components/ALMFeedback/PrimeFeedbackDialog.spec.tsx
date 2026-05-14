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
import { render, screen, act } from '@testing-library/react';
import { waitFor } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import PrimeFeedbackDialog from '@components/ALMFeedback/PrimeFeedbackDialog';
import { SendMessageToParent } from '@utils/widgets/base/EventHandlingBase';
import { emitL1FeedbackClosed } from '@components/ALMFeedback/FeedbackUtil';

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('react-intl', () => ({
  useIntl: jest.fn(() => ({ locale: 'en-US' })),
}));

jest.mock('@utils/translationService', () => ({
  GetTranslation: jest.fn((key: string) => key),
  getPreferredLocalizedMetadata: jest.fn(() => ({ name: 'Test Course' })),
}));

jest.mock('@utils/widgets/base/EventHandlingBase', () => ({
  SendMessageToParent: jest.fn(),
}));

jest.mock('@utils/global', () => ({
  GetPrimeEmitEventLinks: jest.fn(() => []),
  getWidgetConfig: jest.fn(() => ({ isMobile: false })),
}));

jest.mock('@components/ALMFeedback/FeedbackUtil', () => ({
  emitL1FeedbackClosed: jest.fn(),
  getPrimeFeedbackAnswer: jest.fn((userAnswers: any, questions: any[], locale: string) =>
    questions.map((q: any) => ({
      questionId: q.questionId,
      mandatory: q.mandatory,
      questionType: q.questionType,
      answer: userAnswers[q.questionId] ?? '',
      userResponseLocale: locale.replace('-', '_'),
    }))
  ),
  mapQuestionType: jest.fn((q: any) => ({
    id: q.questionId,
    type: 'text',
    required: q.mandatory,
    questionText: q.localizedMetadata?.[0]?.name ?? '',
    translations: {},
  })),
}));

jest.mock('@components/ALMFeedback/PrimeFeedbackForm', () => ({
  __esModule: true,
  default: ({ questionItem }: any) => (
    <div data-testid={`feedback-form-${questionItem.questionId}`} />
  ),
}));

jest.mock('@components/ALMFeedbackV2', () => ({
  FormRenderer: ({ onFormSubmit, onCancel }: any) => (
    <div data-testid="form-renderer">
      <button data-testid="v2-submit" onClick={() => onFormSubmit({ 'q-scale': '7' })}>
        Submit
      </button>
      <button data-testid="v2-cancel" onClick={onCancel}>
        Cancel
      </button>
    </div>
  ),
}));

// The component imports hooks via '../../hooks' (a directory path), which Jest resolves
// differently from the '@hooks' alias (explicit index.ts). Mock the directory path directly.
jest.mock('../../../almLib/hooks', () => ({
  useAccount: jest.fn(),
  useNotifications: jest.fn(),
}));

jest.mock('@utils/widgets/utils', () => ({
  getUserId: jest.fn().mockResolvedValue('user123'),
}));

jest.mock('@contextProviders/DeviceContextProvider', () => ({
  useDeviceTypeContext: jest.fn(() => ({ isMobile: false })),
}));

jest.mock('react-redux', () => ({
  useDispatch: jest.fn(() => jest.fn()),
}));

jest.mock('@almStore/actions/notification/action', () => ({
  updateNotification: jest.fn(),
}));

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const mockScaleQuestion = {
  id: 'q1',
  questionId: 'q-scale',
  questionType: 'scaleTen',
  mandatory: true,
  answer: '',
  _transient: null,
  userResponseLocale: '',
  localizedMetadata: [{ locale: 'en-US', name: 'Rate this course' }],
};

const mockLikeabilityQuestion = {
  id: 'q2',
  questionId: 'q-likeability',
  questionType: 'likeability',
  mandatory: true,
  answer: '',
  _transient: null,
  userResponseLocale: '',
  localizedMetadata: [{ locale: 'en-US', name: 'Did you like this course?' }],
};

const mockQualitativeQuestion = {
  id: 'q3',
  questionId: 'q-qualitative',
  questionType: 'l1Qualitative',
  mandatory: false,
  answer: '',
  _transient: null,
  userResponseLocale: '',
  localizedMetadata: [{ locale: 'en-US', name: 'Any comments?' }],
};

const mockEnrollment = {
  id: 'enrollment1',
  loInstance: {
    id: 'instance1',
    enrollment: null,
    l1FeedbackInfo: {
      questions: [mockScaleQuestion],
      showAutomatically: false,
    },
  },
};

const mockTraining: any = {
  id: 'course1',
  loType: 'course',
  localizedMetadata: [{ locale: 'en-US', name: 'Test Course', description: '' }],
  enrollment: mockEnrollment,
};

const mockTrainingInstance: any = {
  id: 'instance1',
  enrollment: mockEnrollment,
};

const mockParentLo: any = {
  id: 'parent1',
  loType: 'course',
  localizedMetadata: [{ locale: 'en-US', name: 'Parent Course' }],
};

const mockUserNotification: any = {
  id: 'notif1',
  channel: 'email',
  modelIds: ['model1'],
  dateCreated: '2024-01-01',
  actionTaken: false,
  message: 'Feedback request',
  modelNames: ['Course Name'],
  modelTypes: ['learningObject'],
  read: false,
  role: 'learner',
};

const defaultProps = {
  training: mockTraining,
  trainingInstance: mockTrainingInstance,
  parentLo: mockParentLo,
  userNotification: mockUserNotification,
  closeFeedbackPopUp: jest.fn(),
  submitL1Feedback: jest.fn().mockResolvedValue(undefined),
};

const renderComponent = (props: Partial<typeof defaultProps> = {}) =>
  render(<PrimeFeedbackDialog {...defaultProps} {...props} />);

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('PrimeFeedbackDialog', () => {
  // Resolved via jest.mock('../../../almLib/hooks') above
  const { useAccount, useNotifications } = require('../../../almLib/hooks');
  let mockUpdateNotificationAPI: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Re-establish all mock implementations after clearAllMocks()
    const reactIntl = require('react-intl');
    reactIntl.useIntl.mockReturnValue({ locale: 'en-US' });

    const translationService = require('@utils/translationService');
    translationService.GetTranslation.mockImplementation((key: string) => key);
    translationService.getPreferredLocalizedMetadata.mockReturnValue({ name: 'Test Course' });

    const globalUtils = require('@utils/global');
    globalUtils.GetPrimeEmitEventLinks.mockReturnValue([]);
    globalUtils.getWidgetConfig.mockReturnValue({ isMobile: false });

    const deviceContext = require('@contextProviders/DeviceContextProvider');
    deviceContext.useDeviceTypeContext.mockReturnValue({ isMobile: false });

    const widgetUtils = require('@utils/widgets/utils');
    widgetUtils.getUserId.mockResolvedValue('user123');

    mockUpdateNotificationAPI = jest.fn();
    useAccount.mockReturnValue({ account: { newFeedbackFormEnabled: false } });
    useNotifications.mockReturnValue({ updateNotification: mockUpdateNotificationAPI });
  });

  describe('On mount', () => {
    it('sends L1_FEEDBACK_DIALOG_LAUNCHED postMessage exactly once', () => {
      renderComponent();
      expect(SendMessageToParent).toHaveBeenCalledTimes(1);
      expect(SendMessageToParent).toHaveBeenCalledWith(
        { type: 'L1_FEEDBACK_DIALOG_LAUNCHED' },
        []
      );
    });
  });

  describe('Header', () => {
    it('shows course feedback title when parentLo is a course', () => {
      renderComponent();
      expect(screen.getByText('heading.courseFeedback')).toHaveTextContent('heading.courseFeedback');
    });

    it('shows program feedback title when training is an LP', () => {
      const lpTraining = { ...mockTraining, loType: 'learningProgram' };
      renderComponent({ training: lpTraining });
      expect(screen.getByText('text.programFeedback')).toHaveTextContent('text.programFeedback');
    });

    it('displays the training name resolved from localizedMetadata', () => {
      renderComponent();
      expect(screen.getByText(/Test Course/)).toHaveTextContent('Test Course');
    });
  });

  describe('Form variant — old form (newFeedbackFormEnabled: false)', () => {
    it('renders a PrimeFeedbackForm stub for each question', () => {
      renderComponent();
      expect(screen.getByTestId('feedback-form-q-scale')).toHaveAttribute('data-testid', 'feedback-form-q-scale');
    });

    it('renders the submit button footer', () => {
      renderComponent();
      expect(screen.getByText('text.done')).toHaveTextContent('text.done');
    });
  });

  describe('Form variant — new form (newFeedbackFormEnabled: true)', () => {
    beforeEach(() => {
      useAccount.mockReturnValue({ account: { newFeedbackFormEnabled: true } });
    });

    it('renders FormRenderer and hides the old form footer', () => {
      renderComponent();
      expect(screen.getByTestId('form-renderer')).toBeInTheDocument();
      expect(screen.queryByText('text.done')).toBeNull();
    });
  });

  describe('Close button', () => {
    it('calls closeFeedbackPopUp with parentLo.id and notification id', () => {
      const closeFeedbackPopUp = jest.fn();
      renderComponent({ closeFeedbackPopUp });
      userEvent.click(screen.getByRole('button', { name: 'text.closeFeedbackModal' }));
      expect(closeFeedbackPopUp).toHaveBeenCalledTimes(1);
      expect(closeFeedbackPopUp).toHaveBeenCalledWith('parent1', 'notif1');
    });

    it('calls emitL1FeedbackClosed with an empty array', () => {
      renderComponent();
      userEvent.click(screen.getByRole('button', { name: 'text.closeFeedbackModal' }));
      expect(emitL1FeedbackClosed).toHaveBeenCalledWith([]);
    });
  });

  describe('Old form — mandatory error', () => {
    beforeEach(() => {
      jest.spyOn(document, 'getElementById').mockReturnValue(
        Object.assign(document.createElement('input'), { checked: false, value: '' })
      );
    });

    it('shows the mandatory error when a required question is unanswered', () => {
      renderComponent();
      userEvent.click(screen.getByText('text.done'));
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('text.mandatory.question.error')).toHaveTextContent('text.mandatory.question.error');
    });

    it('does not call submitL1Feedback when mandatory question is unanswered', () => {
      const submitL1Feedback = jest.fn();
      renderComponent({ submitL1Feedback });
      userEvent.click(screen.getByText('text.done'));
      expect(submitL1Feedback).not.toHaveBeenCalled();
    });
  });

  describe('Old form — successful submission', () => {
    beforeEach(() => {
      jest.spyOn(document, 'getElementById').mockImplementation((id: string) => {
        // Simulate the 7th radio button (index 6) checked with value '7'
        if (id === 'scaleTen-q-scale-6') {
          return Object.assign(document.createElement('input'), { checked: true, value: '7' });
        }
        return Object.assign(document.createElement('input'), { checked: false, value: '' });
      });
    });

    it('calls submitL1Feedback with the correct enrollment and full feedback payload', async () => {
      const submitL1Feedback = jest.fn().mockResolvedValue(undefined);
      renderComponent({ submitL1Feedback });
      await act(async () => { userEvent.click(screen.getByText('text.done')); });
      expect(submitL1Feedback).toHaveBeenCalledTimes(1);
      expect(submitL1Feedback).toHaveBeenCalledWith(
        mockEnrollment,
        {
          id: 'enrollment1',
          type: 'learningObjectInstanceEnrollment',
          attributes: expect.objectContaining({
            score: 70,
            questions: expect.arrayContaining([
              expect.objectContaining({ questionId: 'q-scale', answer: '7' }),
            ]),
          }),
        }
      );
    });

    it('shows the success banner after submission', async () => {
      renderComponent();
      await act(async () => { userEvent.click(screen.getByText('text.done')); });
      await waitFor(() => {
        expect(screen.getByText('succMsg.L1Feedback.submitted')).toHaveTextContent('succMsg.L1Feedback.submitted');
      });
    });

    it('calls updateNotificationAPI with userId, notificationId, and body after submission', async () => {
      renderComponent();
      await act(async () => { userEvent.click(screen.getByText('text.done')); });
      await waitFor(() => {
        expect(mockUpdateNotificationAPI).toHaveBeenCalledTimes(1);
        expect(mockUpdateNotificationAPI).toHaveBeenCalledWith(
          'user123',
          'notif1',
          expect.objectContaining({ data: expect.objectContaining({ id: 'notif1' }) })
        );
      });
    });

    it('closes the dialog and emits L1_FEEDBACK_CLOSED with notification id after the 2s timer', async () => {
      jest.useFakeTimers();
      const closeFeedbackPopUp = jest.fn();
      renderComponent({ closeFeedbackPopUp });
      await act(async () => { userEvent.click(screen.getByText('text.done')); });
      expect(closeFeedbackPopUp).not.toHaveBeenCalled();
      act(() => { jest.advanceTimersByTime(2000); });
      expect(closeFeedbackPopUp).toHaveBeenCalledWith('parent1', 'notif1');
      expect(emitL1FeedbackClosed).toHaveBeenCalledWith(['notif1']);
      jest.useRealTimers();
    });
  });

  describe('Old form — getUserId returns null', () => {
    beforeEach(() => {
      jest.spyOn(document, 'getElementById').mockImplementation((id: string) => {
        if (id === 'scaleTen-q-scale-6') {
          return Object.assign(document.createElement('input'), { checked: true, value: '7' });
        }
        return Object.assign(document.createElement('input'), { checked: false, value: '' });
      });
      const widgetUtils = require('@utils/widgets/utils');
      widgetUtils.getUserId.mockResolvedValue(null);
    });

    it('does not call updateNotificationAPI when getUserId returns null', async () => {
      renderComponent();
      await act(async () => { userEvent.click(screen.getByText('text.done')); });
      await waitFor(() => {
        expect(screen.getByText('succMsg.L1Feedback.submitted')).toHaveTextContent('succMsg.L1Feedback.submitted');
      });
      expect(mockUpdateNotificationAPI).not.toHaveBeenCalled();
    });
  });

  describe('Old form — feedback already submitted', () => {
    const alreadyGivenError = {
      responseText: JSON.stringify({ source: { info: 'Feedback for the LO is already given.' } }),
    };

    beforeEach(() => {
      jest.spyOn(document, 'getElementById').mockImplementation((id: string) => {
        if (id === 'scaleTen-q-scale-6') {
          return Object.assign(document.createElement('input'), { checked: true, value: '7' });
        }
        return Object.assign(document.createElement('input'), { checked: false, value: '' });
      });
    });

    it('shows the failure banner when the API returns "already given" error', async () => {
      const submitL1Feedback = jest.fn().mockRejectedValue(alreadyGivenError);
      renderComponent({ submitL1Feedback });
      await act(async () => { userEvent.click(screen.getByText('text.done')); });
      await waitFor(() => {
        expect(screen.getByText('errMsg.L1feedback')).toHaveTextContent('errMsg.L1feedback');
      });
    });

    it('calls updateNotificationAPI even when feedback was already given', async () => {
      const submitL1Feedback = jest.fn().mockRejectedValue(alreadyGivenError);
      renderComponent({ submitL1Feedback });
      await act(async () => { userEvent.click(screen.getByText('text.done')); });
      await waitFor(() => {
        expect(mockUpdateNotificationAPI).toHaveBeenCalledTimes(1);
      });
    });

    it('closes the dialog after the 2s timer on already-given error', async () => {
      jest.useFakeTimers();
      const closeFeedbackPopUp = jest.fn();
      const submitL1Feedback = jest.fn().mockRejectedValue(alreadyGivenError);
      renderComponent({ closeFeedbackPopUp, submitL1Feedback });
      await act(async () => { userEvent.click(screen.getByText('text.done')); });
      expect(closeFeedbackPopUp).not.toHaveBeenCalled();
      act(() => { jest.advanceTimersByTime(2000); });
      expect(closeFeedbackPopUp).toHaveBeenCalledWith('parent1', 'notif1');
      jest.useRealTimers();
    });
  });

  describe('Old form — unknown error', () => {
    beforeEach(() => {
      jest.spyOn(document, 'getElementById').mockImplementation((id: string) => {
        if (id === 'scaleTen-q-scale-6') {
          return Object.assign(document.createElement('input'), { checked: true, value: '7' });
        }
        return Object.assign(document.createElement('input'), { checked: false, value: '' });
      });
    });

    it('shows no banner and does not close when error info is not "already given"', async () => {
      const otherError = {
        responseText: JSON.stringify({ source: { info: 'Some unexpected server error.' } }),
      };
      const closeFeedbackPopUp = jest.fn();
      const submitL1Feedback = jest.fn().mockRejectedValue(otherError);
      renderComponent({ closeFeedbackPopUp, submitL1Feedback });
      await act(async () => { userEvent.click(screen.getByText('text.done')); });
      expect(screen.queryByText('succMsg.L1Feedback.submitted')).toBeNull();
      expect(screen.queryByText('errMsg.L1feedback')).toBeNull();
      expect(closeFeedbackPopUp).not.toHaveBeenCalled();
    });
  });

  describe('Old form — LIKEABILITY question type', () => {
    it('submits successfully when a likeability radio is answered', async () => {
      const likeabilityEnrollment = {
        ...mockEnrollment,
        loInstance: {
          ...mockEnrollment.loInstance,
          l1FeedbackInfo: {
            questions: [mockLikeabilityQuestion],
            showAutomatically: false,
          },
        },
      };
      const training = { ...mockTraining, enrollment: likeabilityEnrollment };
      const trainingInstance = { ...mockTrainingInstance, enrollment: likeabilityEnrollment };

      jest.spyOn(document, 'getElementById').mockImplementation((id: string) => {
        // Simulate radio index 2 (middle option) checked
        if (id === 'likeability-q-likeability-2') {
          return Object.assign(document.createElement('input'), { checked: true, value: 'agree' });
        }
        return Object.assign(document.createElement('input'), { checked: false, value: '' });
      });

      const submitL1Feedback = jest.fn().mockResolvedValue(undefined);
      renderComponent({ training, trainingInstance, submitL1Feedback });
      await act(async () => { userEvent.click(screen.getByText('text.done')); });
      expect(submitL1Feedback).toHaveBeenCalledTimes(1);
      expect(submitL1Feedback).toHaveBeenCalledWith(
        likeabilityEnrollment,
        expect.objectContaining({
          type: 'learningObjectInstanceEnrollment',
          attributes: expect.objectContaining({
            questions: expect.arrayContaining([
              expect.objectContaining({ questionId: 'q-likeability', answer: 'agree' }),
            ]),
          }),
        })
      );
    });
  });

  describe('Old form — L1_QUALITATIVE question type', () => {
    it('submits successfully when a qualitative textarea is answered', async () => {
      const qualitativeEnrollment = {
        ...mockEnrollment,
        loInstance: {
          ...mockEnrollment.loInstance,
          l1FeedbackInfo: {
            questions: [mockQualitativeQuestion],
            showAutomatically: false,
          },
        },
      };
      const training = { ...mockTraining, enrollment: qualitativeEnrollment };
      const trainingInstance = { ...mockTrainingInstance, enrollment: qualitativeEnrollment };

      jest.spyOn(document, 'getElementById').mockImplementation((id: string) => {
        // For l1Qualitative, source reads getElementById(question.questionId) as textarea
        if (id === 'q-qualitative') {
          return Object.assign(document.createElement('textarea'), {
            value: 'Great course, very informative!',
          });
        }
        return Object.assign(document.createElement('input'), { checked: false, value: '' });
      });

      const submitL1Feedback = jest.fn().mockResolvedValue(undefined);
      renderComponent({ training, trainingInstance, submitL1Feedback });
      await act(async () => { userEvent.click(screen.getByText('text.done')); });
      expect(submitL1Feedback).toHaveBeenCalledTimes(1);
      expect(submitL1Feedback).toHaveBeenCalledWith(
        qualitativeEnrollment,
        expect.objectContaining({
          type: 'learningObjectInstanceEnrollment',
          attributes: expect.objectContaining({
            questions: expect.arrayContaining([
              expect.objectContaining({
                questionId: 'q-qualitative',
                answer: 'Great course, very informative!',
              }),
            ]),
          }),
        })
      );
    });
  });

  describe('New form (FormRenderer) — successful submission', () => {
    beforeEach(() => {
      useAccount.mockReturnValue({ account: { newFeedbackFormEnabled: true } });
    });

    it('calls submitL1Feedback with the enrollment and full feedback payload', async () => {
      const submitL1Feedback = jest.fn().mockResolvedValue(undefined);
      renderComponent({ submitL1Feedback });
      await act(async () => { userEvent.click(screen.getByTestId('v2-submit')); });
      expect(submitL1Feedback).toHaveBeenCalledTimes(1);
      expect(submitL1Feedback).toHaveBeenCalledWith(
        mockEnrollment,
        {
          id: 'enrollment1',
          type: 'learningObjectInstanceEnrollment',
          attributes: expect.objectContaining({ score: 70 }),
        }
      );
    });

    it('shows the success banner after submission', async () => {
      renderComponent();
      await act(async () => { userEvent.click(screen.getByTestId('v2-submit')); });
      await waitFor(() => {
        expect(screen.getByText('succMsg.L1Feedback.submitted')).toHaveTextContent('succMsg.L1Feedback.submitted');
      });
    });

    it('closes the dialog and emits L1_FEEDBACK_CLOSED with notification id after the 2s timer', async () => {
      jest.useFakeTimers();
      const closeFeedbackPopUp = jest.fn();
      renderComponent({ closeFeedbackPopUp });
      await act(async () => { userEvent.click(screen.getByTestId('v2-submit')); });
      expect(closeFeedbackPopUp).not.toHaveBeenCalled();
      act(() => { jest.advanceTimersByTime(2000); });
      expect(closeFeedbackPopUp).toHaveBeenCalledWith('parent1', 'notif1');
      expect(emitL1FeedbackClosed).toHaveBeenCalledWith(['notif1']);
      jest.useRealTimers();
    });
  });

  describe('New form (FormRenderer) — feedback already submitted', () => {
    beforeEach(() => {
      useAccount.mockReturnValue({ account: { newFeedbackFormEnabled: true } });
    });

    it('shows the failure banner when the API returns "already given" error', async () => {
      const alreadyGivenError = {
        responseText: JSON.stringify({ source: { info: 'Feedback for the LO is already given.' } }),
      };
      const submitL1Feedback = jest.fn().mockRejectedValue(alreadyGivenError);
      renderComponent({ submitL1Feedback });
      await act(async () => { userEvent.click(screen.getByTestId('v2-submit')); });
      await waitFor(() => {
        expect(screen.getByText('errMsg.L1feedback')).toHaveTextContent('errMsg.L1feedback');
      });
    });
  });

  describe('New form — cancel', () => {
    beforeEach(() => {
      useAccount.mockReturnValue({ account: { newFeedbackFormEnabled: true } });
    });

    it('calls closeFeedbackPopUp when FormRenderer cancel is triggered', () => {
      const closeFeedbackPopUp = jest.fn();
      renderComponent({ closeFeedbackPopUp });
      userEvent.click(screen.getByTestId('v2-cancel'));
      expect(closeFeedbackPopUp).toHaveBeenCalledWith('parent1', 'notif1');
    });
  });

  describe('Enrollment resolution', () => {
    it('uses training.enrollment when parentLo is an LP (isParentCourse = false)', async () => {
      // When parentLo is an LP, the component reads from training.enrollment, not trainingInstance.enrollment
      const lpParentLo = { ...mockParentLo, loType: 'learningProgram' };
      const lpEnrollment = {
        id: 'lp-enrollment1',
        loInstance: {
          id: 'lp-instance1',
          enrollment: null,
          l1FeedbackInfo: {
            questions: [mockScaleQuestion],
            showAutomatically: false,
          },
        },
      };
      // training.enrollment points to lpEnrollment; trainingInstance.enrollment is the old one
      const training = { ...mockTraining, enrollment: lpEnrollment };

      jest.spyOn(document, 'getElementById').mockImplementation((id: string) => {
        if (id === 'scaleTen-q-scale-6') {
          return Object.assign(document.createElement('input'), { checked: true, value: '7' });
        }
        return Object.assign(document.createElement('input'), { checked: false, value: '' });
      });

      const submitL1Feedback = jest.fn().mockResolvedValue(undefined);
      renderComponent({ training, parentLo: lpParentLo, submitL1Feedback });
      await act(async () => { userEvent.click(screen.getByText('text.done')); });

      // Enrollment passed to submitL1Feedback should come from training.enrollment
      expect(submitL1Feedback).toHaveBeenCalledWith(
        lpEnrollment,
        expect.objectContaining({ id: 'lp-enrollment1' })
      );
    });

    it('uses enrolledInstance.enrollment as enrollment when it is non-null', async () => {
      // When loInstance.enrollment is truthy, it takes precedence over trainingEnrollment.
      // innerEnrollment must have a loInstance so getFeedbackSubmissionPayload can read l1FeedbackInfo.
      const innerEnrollment = {
        id: 'inner-enrollment1',
        loInstance: {
          id: 'inner-instance1',
          l1FeedbackInfo: { showAutomatically: false, questions: [] },
        },
      } as any;
      const enrollmentWithInner = {
        ...mockEnrollment,
        loInstance: {
          ...mockEnrollment.loInstance,
          enrollment: innerEnrollment,
        },
      };
      const training = { ...mockTraining, enrollment: enrollmentWithInner };
      const trainingInstance = { ...mockTrainingInstance, enrollment: enrollmentWithInner };

      jest.spyOn(document, 'getElementById').mockImplementation((id: string) => {
        if (id === 'scaleTen-q-scale-6') {
          return Object.assign(document.createElement('input'), { checked: true, value: '7' });
        }
        return Object.assign(document.createElement('input'), { checked: false, value: '' });
      });

      const submitL1Feedback = jest.fn().mockResolvedValue(undefined);
      renderComponent({ training, trainingInstance, submitL1Feedback });
      await act(async () => { userEvent.click(screen.getByText('text.done')); });

      // First arg to submitL1Feedback and feedbackBody.id both reflect innerEnrollment
      expect(submitL1Feedback).toHaveBeenCalledWith(
        innerEnrollment,
        expect.objectContaining({ id: 'inner-enrollment1' })
      );
    });
  });
});
