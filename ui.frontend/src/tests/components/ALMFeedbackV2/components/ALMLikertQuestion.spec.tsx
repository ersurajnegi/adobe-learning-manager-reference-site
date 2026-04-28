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
import { ALMLikertQuestionComponent } from '@components/ALMFeedbackV2/components/ALMLikertQuestion';
import { LikertQuestion, QuestionType } from '@models/FeedbackModel';

const mockGetTranslation = jest.fn((key: string) => key);
const mockGetTranslationsReplaced = jest.fn((key: string, params: any) => `${key}:${JSON.stringify(params)}`);
const mockOnAnswerChange = jest.fn();
let mockScreenWidth = 800;

jest.mock('@utils/translationService', () => ({
  GetTranslation: (key: string) => mockGetTranslation(key),
  GetTranslationsReplaced: (key: string, params: any) => mockGetTranslationsReplaced(key, params),
}));

jest.mock('@contextProviders/DeviceContextProvider', () => ({
  useDeviceTypeContext: () => ({ screenWidth: mockScreenWidth }),
}));

jest.mock('@react-spectrum/layout', () => ({
  Flex: ({ children }: any) => <>{children}</>,
}));

jest.mock('@react-spectrum/radio', () => ({
  RadioGroup: ({ children, isDisabled, isRequired, orientation, labelPosition, onChange }: any) => (
    <div
      role="radiogroup"
      data-disabled={String(isDisabled)}
      data-required={String(isRequired)}
      data-orientation={orientation}
      data-label-position={labelPosition}
      onClick={() => onChange?.('selected-value')}
    >
      {children}
    </div>
  ),
  Radio: ({ value, children, UNSAFE_className, marginStart }: any) => (
    <label className={UNSAFE_className} data-margin-start={marginStart}>
      <input type="radio" value={value} />
      <span>{children}</span>
    </label>
  ),
}));

jest.mock('@react-spectrum/text', () => ({
  Text: ({ children }: any) => <span>{children}</span>,
}));

const mockQuestion: LikertQuestion = {
  id: 'q1',
  type: QuestionType.LIKERT,
  questionText: 'I am satisfied with this course',
  translations: {},
  required: true,
};

const defaultProps = {
  question: mockQuestion,
  questionText: 'I am satisfied with this course',
  onAnswerChange: mockOnAnswerChange,
  locale: 'en-US',
  disabled: false,
  order: 1,
};

describe('ALMLikertQuestionComponent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockScreenWidth = 800;
  });

  it('render_questionText_displayedInLabel', () => {
    const { container } = render(<ALMLikertQuestionComponent {...defaultProps} />);

    expect(container.querySelector(`#${mockQuestion.id}`)?.textContent).toBe('I am satisfied with this course');
  });

  it('render_locale_setAsLangAttribute', () => {
    const { container } = render(
      <ALMLikertQuestionComponent {...defaultProps} locale="fr-FR" />
    );

    expect(container.querySelector('label[lang="fr-FR"]')).not.toBeNull();
  });

  it('render_required_appliesMandatoryClass', () => {
    const { container } = render(<ALMLikertQuestionComponent {...defaultProps} />);

    expect(container.querySelector('.feedback_mandatory')).not.toBeNull();
  });

  it('render_notRequired_noMandatoryClass', () => {
    const { container } = render(
      <ALMLikertQuestionComponent {...defaultProps} question={{ ...mockQuestion, required: false }} />
    );

    expect(container.querySelector('.feedback_mandatory')).toBeNull();
  });

  it('render_order_passedToAriaSpan', () => {
    render(<ALMLikertQuestionComponent {...defaultProps} order={4} />);

    expect(mockGetTranslationsReplaced).toHaveBeenCalledWith('alm.feedback.text.question', { n: 4 });
  });

  it('render_5Options_allValueAndLabelKeysRequested', () => {
    render(<ALMLikertQuestionComponent {...defaultProps} />);

    expect(mockGetTranslation).toHaveBeenCalledWith('text.strongly.agree');
    expect(mockGetTranslation).toHaveBeenCalledWith('text.agree');
    expect(mockGetTranslation).toHaveBeenCalledWith('text.ok');
    expect(mockGetTranslation).toHaveBeenCalledWith('text.disagree');
    expect(mockGetTranslation).toHaveBeenCalledWith('text.strongly.disagree');
    expect(mockGetTranslation).toHaveBeenCalledWith('alm.feedback.text.stronglyagree');
    expect(mockGetTranslation).toHaveBeenCalledWith('alm.feedback.text.agree');
    expect(mockGetTranslation).toHaveBeenCalledWith('alm.feedback.text.neutral');
    expect(mockGetTranslation).toHaveBeenCalledWith('alm.feedback.text.disagree');
    expect(mockGetTranslation).toHaveBeenCalledWith('alm.feedback.text.stronglydisagree');
  });

  it('wideScreen_radioGroup_horizontalWithTopLabel', () => {
    mockScreenWidth = 800;
    render(<ALMLikertQuestionComponent {...defaultProps} />);

    const radioGroup = screen.getByRole('radiogroup');
    expect(radioGroup.getAttribute('data-orientation')).toBe('horizontal');
    expect(radioGroup.getAttribute('data-label-position')).toBe('top');
  });

  it('narrowScreen_radioGroup_verticalWithSideLabel', () => {
    mockScreenWidth = 600;
    render(<ALMLikertQuestionComponent {...defaultProps} />);

    const radioGroup = screen.getByRole('radiogroup');
    expect(radioGroup.getAttribute('data-orientation')).toBe('vertical');
    expect(radioGroup.getAttribute('data-label-position')).toBe('side');
  });

  it('boundary_750px_treatedAsWide', () => {
    mockScreenWidth = 750;
    render(<ALMLikertQuestionComponent {...defaultProps} />);

    expect(screen.getByRole('radiogroup').getAttribute('data-orientation')).toBe('horizontal');
  });

  it('boundary_749px_treatedAsNarrow', () => {
    mockScreenWidth = 749;
    render(<ALMLikertQuestionComponent {...defaultProps} />);

    expect(screen.getByRole('radiogroup').getAttribute('data-orientation')).toBe('vertical');
  });

  it('wideScreen_radioLabel_classApplied', () => {
    mockScreenWidth = 800;
    const { container } = render(<ALMLikertQuestionComponent {...defaultProps} />);

    expect(container.querySelector('label.radio_label')).not.toBeNull();
  });

  it('narrowScreen_radioLabel_classNotApplied', () => {
    mockScreenWidth = 600;
    const { container } = render(<ALMLikertQuestionComponent {...defaultProps} />);

    expect(container.querySelector('label.radio_label')).toBeNull();
  });

  it('answerChange_click_callsOnAnswerChangeWithQuestionId', () => {
    render(<ALMLikertQuestionComponent {...defaultProps} />);

    fireEvent.click(screen.getByRole('radiogroup'));

    expect(mockOnAnswerChange).toHaveBeenCalledWith('q1', 'selected-value');
  });

  it('disabled_true_disablesRadioGroup', () => {
    render(<ALMLikertQuestionComponent {...defaultProps} disabled={true} />);

    expect(screen.getByRole('radiogroup').getAttribute('data-disabled')).toBe('true');
  });

  it('required_false_radioGroupNotRequired', () => {
    render(
      <ALMLikertQuestionComponent {...defaultProps} question={{ ...mockQuestion, required: false }} />
    );

    expect(screen.getByRole('radiogroup').getAttribute('data-required')).toBe('false');
  });
});
