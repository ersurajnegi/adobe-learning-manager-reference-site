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
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ALMTextQuestionComponent } from '@components/ALMFeedbackV2/components/ALMTextQuestion';
import { TextQuestion, QuestionType } from '@models/FeedbackModel';

const mockGetTranslation = jest.fn((key: string) => key);
const mockGetTranslationsReplaced = jest.fn((key: string, params: any) => `${key}:${JSON.stringify(params)}`);
const mockOnAnswerChange = jest.fn();

jest.mock('@utils/translationService', () => ({
  GetTranslation: (key: string) => mockGetTranslation(key),
  GetTranslationReplaced: (key: string, params: any) => `${key}:${params}`,
  GetTranslationsReplaced: (key: string, params: any) => mockGetTranslationsReplaced(key, params),
}));

jest.mock('@react-spectrum/textfield', () => ({
  TextArea: ({ name, isRequired, maxLength, onChange, isDisabled, UNSAFE_className }: any) => (
    <textarea
      name={name}
      data-required={String(isRequired)}
      maxLength={maxLength}
      onChange={(e) => onChange?.(e.target.value)}
      disabled={isDisabled}
      className={UNSAFE_className}
    />
  ),
}));

jest.mock('@react-spectrum/text', () => ({
  Text: ({ children }: any) => <span>{children}</span>,
}));

const mockQuestion: TextQuestion = {
  id: 'q1',
  type: QuestionType.TEXT,
  questionText: 'What did you think?',
  translations: {},
  required: true,
  maxLength: 500,
};

const defaultProps = {
  question: mockQuestion,
  questionText: 'What did you think?',
  onAnswerChange: mockOnAnswerChange,
  locale: 'en-US',
  disabled: false,
  order: 1,
};

describe('ALMTextQuestionComponent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('render_questionText_displayedInLabel', () => {
    const { container } = render(<ALMTextQuestionComponent {...defaultProps} />);

    expect(container.querySelector(`#${mockQuestion.id}`)?.textContent).toBe('What did you think?');
  });

  it('render_locale_setAsLangAttribute', () => {
    const { container } = render(
      <ALMTextQuestionComponent {...defaultProps} locale="de-DE" />
    );

    expect(container.querySelector('label[lang="de-DE"]')).not.toBeNull();
  });

  it('render_required_appliesMandatoryClass', () => {
    const { container } = render(<ALMTextQuestionComponent {...defaultProps} />);

    expect(container.querySelector('.feedback_mandatory')).not.toBeNull();
  });

  it('render_notRequired_noMandatoryClass', () => {
    const { container } = render(
      <ALMTextQuestionComponent {...defaultProps} question={{ ...mockQuestion, required: false }} />
    );

    expect(container.querySelector('.feedback_mandatory')).toBeNull();
  });

  it('render_order_passedToAriaSpan', () => {
    render(<ALMTextQuestionComponent {...defaultProps} order={3} />);

    expect(mockGetTranslationsReplaced).toHaveBeenCalledWith('alm.feedback.text.question', { n: 3 });
  });

  it('render_charCounter_initializedToMaxLength', () => {
    render(<ALMTextQuestionComponent {...defaultProps} />);

    expect(mockGetTranslationsReplaced).toHaveBeenCalledWith('alm.feedback.text.textarea.counter', {
      count: 500,
    });
  });

  it('textInput_typing_updatesCharCounter', () => {
    render(<ALMTextQuestionComponent {...defaultProps} />);

    userEvent.type(screen.getByRole('textbox'), 'Hello');

    expect(mockGetTranslationsReplaced).toHaveBeenCalledWith('alm.feedback.text.textarea.counter', {
      count: 495,
    });
  });

  it('textInput_typing_callsOnAnswerChangeWithQuestionId', () => {
    render(<ALMTextQuestionComponent {...defaultProps} />);

    userEvent.type(screen.getByRole('textbox'), 'X');

    expect(mockOnAnswerChange).toHaveBeenCalledWith('q1', 'X');
  });

  it('disabled_true_disablesTextArea', () => {
    render(<ALMTextQuestionComponent {...defaultProps} disabled={true} />);

    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('required_false_textAreaNotRequired', () => {
    render(
      <ALMTextQuestionComponent {...defaultProps} question={{ ...mockQuestion, required: false }} />
    );

    expect(screen.getByRole('textbox').getAttribute('data-required')).toBe('false');
  });
});
