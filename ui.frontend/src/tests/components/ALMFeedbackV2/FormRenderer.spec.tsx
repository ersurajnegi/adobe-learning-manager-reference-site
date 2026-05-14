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
import { render, screen, fireEvent } from '@testing-library/react';
import { FormRenderer } from '@components/ALMFeedbackV2/index';
import { QuestionType, TextQuestion, NpsQuestion } from '@models/FeedbackModel';

const mockGetTranslation = jest.fn((key: string) => key);
const mockGetALMConfig = jest.fn();
const mockGetModalTheme = jest.fn();
const mockOnFormSubmit = jest.fn();
const mockOnCancel = jest.fn();

jest.mock('@utils/translationService', () => ({
  GetTranslation: (key: string) => mockGetTranslation(key),
}));

jest.mock('@utils/global', () => ({
  getALMConfig: () => mockGetALMConfig(),
  getModalTheme: (name: string) => mockGetModalTheme(name),
}));

jest.mock('@components/ALMFeedbackV2/components/ALMQuestionRenderer', () => ({
  ALMQuestionRenderer: ({ question, onAnswerChange, order }: any) => (
    <div data-testid={`question-${question.id}`}>
      <span data-testid={`order-${question.id}`}>{order}</span>
      <input
        data-testid={`input-${question.id}`}
        onChange={(e) => onAnswerChange(question.id, e.target.value)}
      />
    </div>
  ),
}));

jest.mock('@adobe/react-spectrum', () => ({
  Provider: ({ children, locale, theme }: any) => (
    <div data-testid="provider" data-locale={locale} data-theme={theme}>
      {children}
    </div>
  ),
  Form: ({ children, onSubmit }: any) => (
    <form data-testid="form" onSubmit={onSubmit}>
      {children}
    </form>
  ),
  Divider: () => <hr data-testid="divider" />,
  Flex: ({ children }: any) => <div>{children}</div>,
  darkTheme: 'dark-theme',
  lightTheme: 'light-theme',
}));

const q1: TextQuestion = { id: 'q1', type: QuestionType.TEXT, questionText: 'What did you think?', translations: {}, required: true, maxLength: 500 };
const q2: NpsQuestion = { id: 'q2', type: QuestionType.NPS, questionText: 'How likely to recommend?', translations: {}, required: true, min: 0, max: 10 };

const twoQuestionForm = {
  locales: ['en-US'],
  defaultLocale: 'en-US',
  questions: [q1, q2],
};

const defaultProps = {
  feedbackForm: twoQuestionForm,
  locale: 'en-US',
  onFormSubmit: mockOnFormSubmit,
  onCancel: mockOnCancel,
};

describe('FormRenderer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockGetTranslation.mockImplementation((key: string) => key);
    mockGetALMConfig.mockReturnValue({ themeData: { name: 'light' } });
    mockGetModalTheme.mockReturnValue('light-theme');
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('render_allQuestions_displayed', () => {
    render(<FormRenderer {...defaultProps} />);

    expect(screen.getByTestId('question-q1')).not.toBeNull();
    expect(screen.getByTestId('question-q2')).not.toBeNull();
  });

  it('render_questionsOrdered_1based', () => {
    render(<FormRenderer {...defaultProps} />);

    expect(screen.getByTestId('order-q1').textContent).toBe('1');
    expect(screen.getByTestId('order-q2').textContent).toBe('2');
  });

  it('render_multipleQuestions_dividersN1', () => {
    render(<FormRenderer {...defaultProps} />);

    expect(screen.getAllByTestId('divider').length).toBe(1);
  });

  it('render_singleQuestion_noDivider', () => {
    render(
      <FormRenderer
        {...defaultProps}
        feedbackForm={{ ...twoQuestionForm, questions: [twoQuestionForm.questions[0]] }}
      />
    );

    expect(screen.queryByTestId('divider')).toBeNull();
  });

  it('locale_passedToProvider', () => {
    render(<FormRenderer {...defaultProps} locale="ja-JP" />);

    expect(screen.getByTestId('provider').getAttribute('data-locale')).toBe('ja-JP');
  });

  it('theme_fromGetModalTheme_passedToProvider', () => {
    mockGetALMConfig.mockReturnValue({ themeData: { name: 'dark' } });
    mockGetModalTheme.mockReturnValue('dark-theme');

    render(<FormRenderer {...defaultProps} />);

    expect(mockGetModalTheme).toHaveBeenCalledWith('dark');
    expect(screen.getByTestId('provider').getAttribute('data-theme')).toBe('dark-theme');
  });

  it('submit_emptyForm_callsOnFormSubmitWithEmptyObject', () => {
    render(<FormRenderer {...defaultProps} />);

    fireEvent.submit(screen.getByTestId('form'));

    expect(mockOnFormSubmit).toHaveBeenCalledWith({});
  });

  it('submit_withAnswers_callsOnFormSubmitWithCollectedData', () => {
    render(<FormRenderer {...defaultProps} />);

    fireEvent.change(screen.getByTestId('input-q1'), { target: { value: 'Great course' } });
    fireEvent.change(screen.getByTestId('input-q2'), { target: { value: '9' } });
    fireEvent.submit(screen.getByTestId('form'));

    expect(mockOnFormSubmit).toHaveBeenCalledWith({ q1: 'Great course', q2: '9' });
  });

  it('answerChange_overwrite_lastValueSubmitted', () => {
    render(<FormRenderer {...defaultProps} />);

    fireEvent.change(screen.getByTestId('input-q1'), { target: { value: 'First' } });
    fireEvent.change(screen.getByTestId('input-q1'), { target: { value: 'Updated' } });
    fireEvent.submit(screen.getByTestId('form'));

    expect(mockOnFormSubmit).toHaveBeenCalledWith({ q1: 'Updated' });
  });

  it('cancel_click_callsOnCancelNotOnFormSubmit', () => {
    render(<FormRenderer {...defaultProps} />);

    fireEvent.click(screen.getByText('alm.feedback.text.cancel'));

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
    expect(mockOnFormSubmit).not.toHaveBeenCalled();
  });

  it('cancelButton_typeButton_doesNotTriggerFormSubmit', () => {
    const { container } = render(<FormRenderer {...defaultProps} />);

    expect(container.querySelector('button[type="button"]')).not.toBeNull();
    expect(container.querySelector('button[type="submit"]')).not.toBeNull();
  });
});
