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
import { ALMNPSQuestionComponent } from '@components/ALMFeedbackV2/components/ALMNPSQuestion';
import { NpsQuestion, QuestionType } from '@models/FeedbackModel';

const mockGetTranslation = jest.fn((key: string) => key);
const mockGetTranslationsReplaced = jest.fn((key: string, params: any) => `${key}:${JSON.stringify(params)}`);
const mockOnAnswerChange = jest.fn();
const mockUseProvider = jest.fn(() => ({ theme: 'light-theme' }));

jest.mock('@utils/translationService', () => ({
  GetTranslation: (key: string) => mockGetTranslation(key),
  GetTranslationsReplaced: (key: string, params: any) => mockGetTranslationsReplaced(key, params),
}));

jest.mock('@contextProviders/DeviceContextProvider', () => ({
  useDeviceTypeContext: () => ({ isMobile: false }),
}));

jest.mock('@adobe/react-spectrum', () => ({
  useProvider: () => mockUseProvider(),
  lightTheme: 'light-theme',
}));

jest.mock('@react-spectrum/layout', () => ({
  Flex: ({ children }: any) => <>{children}</>,
}));

jest.mock('@react-spectrum/radio', () => ({
  RadioGroup: ({ children, isDisabled, isRequired, onChange }: any) => (
    <div
      role="radiogroup"
      data-disabled={String(isDisabled)}
      data-required={String(isRequired)}
      onClick={() => onChange?.('5')}
    >
      {children}
    </div>
  ),
  Radio: ({ value, children, UNSAFE_className }: any) => (
    <label className={UNSAFE_className}>
      <input type="radio" value={value} />
      <span>{children}</span>
    </label>
  ),
}));

jest.mock('@react-spectrum/text', () => ({
  Text: ({ children }: any) => <span>{children}</span>,
}));

const mockQuestion: NpsQuestion = {
  id: 'q1',
  type: QuestionType.NPS,
  questionText: 'How likely are you to recommend this course?',
  translations: {},
  required: true,
  min: 0,
  max: 10,
};

const defaultProps = {
  question: mockQuestion,
  questionText: 'How likely are you to recommend this course?',
  onAnswerChange: mockOnAnswerChange,
  locale: 'en-US',
  disabled: false,
  order: 1,
};

describe('ALMNPSQuestionComponent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseProvider.mockReturnValue({ theme: 'light-theme' });
  });

  it('render_questionText_displayedInLabel', () => {
    const { container } = render(<ALMNPSQuestionComponent {...defaultProps} />);

    expect(container.querySelector(`#${mockQuestion.id}`)?.textContent).toBe(
      'How likely are you to recommend this course?'
    );
  });

  it('render_locale_setAsLangAttribute', () => {
    const { container } = render(
      <ALMNPSQuestionComponent {...defaultProps} locale="ja-JP" />
    );

    expect(container.querySelector('label[lang="ja-JP"]')).not.toBeNull();
  });

  it('render_required_appliesMandatoryClass', () => {
    const { container } = render(<ALMNPSQuestionComponent {...defaultProps} />);

    expect(container.querySelector('.feedback_mandatory')).not.toBeNull();
  });

  it('render_notRequired_noMandatoryClass', () => {
    const { container } = render(
      <ALMNPSQuestionComponent {...defaultProps} question={{ ...mockQuestion, required: false }} />
    );

    expect(container.querySelector('.feedback_mandatory')).toBeNull();
  });

  it('render_order_passedToAriaSpan', () => {
    render(<ALMNPSQuestionComponent {...defaultProps} order={3} />);

    expect(mockGetTranslationsReplaced).toHaveBeenCalledWith('alm.feedback.text.question', { n: 3 });
  });

  it('render_minMax_passedToInfoSpan', () => {
    render(<ALMNPSQuestionComponent {...defaultProps} />);

    expect(mockGetTranslationsReplaced).toHaveBeenCalledWith('alm.feedback.text.nps.description', {
      min: 0,
      max: 10,
    });
  });

  it('render_radioButtons_countFromMinToMax', () => {
    const { container } = render(<ALMNPSQuestionComponent {...defaultProps} />);

    // 0..10 inclusive = 11 buttons
    expect(container.querySelectorAll('input[type="radio"]').length).toBe(11);
  });

  it('render_customScale_correctCount', () => {
    const { container } = render(
      <ALMNPSQuestionComponent
        {...defaultProps}
        question={{ ...mockQuestion, min: 1, max: 5 }}
      />
    );

    expect(container.querySelectorAll('input[type="radio"]').length).toBe(5);
  });

  it('render_customMinMax_passedToDescription', () => {
    render(
      <ALMNPSQuestionComponent
        {...defaultProps}
        question={{ ...mockQuestion, min: 1, max: 5 }}
      />
    );

    expect(mockGetTranslationsReplaced).toHaveBeenCalledWith('alm.feedback.text.nps.description', {
      min: 1,
      max: 5,
    });
  });

  it('theme_light_appliesLightClass', () => {
    mockUseProvider.mockReturnValue({ theme: 'light-theme' });
    const { container } = render(<ALMNPSQuestionComponent {...defaultProps} />);

    expect(container.querySelector('label.nps_radio_button_light')).not.toBeNull();
  });

  it('theme_dark_appliesDarkClass', () => {
    mockUseProvider.mockReturnValue({ theme: 'dark-theme' });
    const { container } = render(<ALMNPSQuestionComponent {...defaultProps} />);

    expect(container.querySelector('label.nps_radio_button_dark')).not.toBeNull();
  });

  it('answerChange_click_callsOnAnswerChangeWithQuestionId', () => {
    render(<ALMNPSQuestionComponent {...defaultProps} />);

    fireEvent.click(screen.getByRole('radiogroup'));

    expect(mockOnAnswerChange).toHaveBeenCalledWith('q1', '5');
  });

  it('disabled_true_disablesRadioGroup', () => {
    render(<ALMNPSQuestionComponent {...defaultProps} disabled={true} />);

    expect(screen.getByRole('radiogroup').getAttribute('data-disabled')).toBe('true');
  });

  it('disabled_false_enablesRadioGroup', () => {
    render(<ALMNPSQuestionComponent {...defaultProps} disabled={false} />);

    expect(screen.getByRole('radiogroup').getAttribute('data-disabled')).toBe('false');
  });

  it('required_false_radioGroupNotRequired', () => {
    render(
      <ALMNPSQuestionComponent {...defaultProps} question={{ ...mockQuestion, required: false }} />
    );

    expect(screen.getByRole('radiogroup').getAttribute('data-required')).toBe('false');
  });

  it('render_helperText_bothLabelsRequested', () => {
    render(<ALMNPSQuestionComponent {...defaultProps} />);

    expect(mockGetTranslation).toHaveBeenCalledWith('alm.feedback.text.notAtAllLikely');
    expect(mockGetTranslation).toHaveBeenCalledWith('alm.feedback.text.extremelyLikely');
  });
});
