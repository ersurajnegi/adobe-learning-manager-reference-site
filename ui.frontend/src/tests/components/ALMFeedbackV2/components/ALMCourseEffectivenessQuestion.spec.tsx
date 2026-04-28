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
import { ALMCourseEffectivenessQuestionComponent } from '@components/ALMFeedbackV2/components/ALMCourseEffectivenessQuestion';
import { CourseEffectivenessQuestion, QuestionType } from '@models/FeedbackModel';

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

jest.mock('@react-spectrum/provider', () => ({
  useProvider: () => mockUseProvider(),
}));

jest.mock('@adobe/react-spectrum', () => ({
  lightTheme: 'light-theme',
}));

jest.mock('@react-spectrum/layout', () => ({
  Flex: ({ children }: any) => <>{children}</>,
}));

jest.mock('@react-spectrum/radio', () => ({
  RadioGroup: ({ children, isDisabled, onChange }: any) => (
    <div role="radiogroup" data-disabled={String(isDisabled)} onClick={() => onChange?.('5')}>
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

const mockQuestion: CourseEffectivenessQuestion = {
  id: 'q1',
  type: QuestionType.COURSE_EFFECTIVENESS,
  questionText: 'How effective was this course?',
  translations: {},
  required: true,
};

const defaultProps = {
  question: mockQuestion,
  questionText: 'How effective was this course?',
  onAnswerChange: mockOnAnswerChange,
  locale: 'en-US',
  disabled: false,
  order: 1,
};

describe('ALMCourseEffectivenessQuestionComponent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseProvider.mockReturnValue({ theme: 'light-theme' });
  });

  it('render_questionText_displayedInLabel', () => {
    const { container } = render(<ALMCourseEffectivenessQuestionComponent {...defaultProps} />);

    const label = container.querySelector(`#${mockQuestion.id}`);
    expect(label?.textContent).toBe('How effective was this course?');
  });

  it('render_locale_setAsLangAttribute', () => {
    const { container } = render(
      <ALMCourseEffectivenessQuestionComponent {...defaultProps} locale="fr-FR" />
    );

    expect(container.querySelector('label[lang="fr-FR"]')).not.toBeNull();
  });

  it('render_order_passedToAriaSpan', () => {
    render(<ALMCourseEffectivenessQuestionComponent {...defaultProps} order={3} />);

    expect(mockGetTranslationsReplaced).toHaveBeenCalledWith('alm.feedback.text.question', { n: 3 });
  });

  it('render_radioGroup_has10Options', () => {
    const { container } = render(<ALMCourseEffectivenessQuestionComponent {...defaultProps} />);

    expect(container.querySelectorAll('input[type="radio"]').length).toBe(10);
  });

  it('render_radioValues_1through10', () => {
    const { container } = render(<ALMCourseEffectivenessQuestionComponent {...defaultProps} />);

    const radios = container.querySelectorAll('input[type="radio"]');
    radios.forEach((radio, i) => {
      expect(radio.getAttribute('value')).toBe(String(i + 1));
    });
  });

  it('answerChange_radioGroupClick_callsOnAnswerChangeWithQuestionId', () => {
    render(<ALMCourseEffectivenessQuestionComponent {...defaultProps} />);

    fireEvent.click(screen.getByRole('radiogroup'));

    expect(mockOnAnswerChange).toHaveBeenCalledWith('q1', '5');
  });

  it('disabled_true_disablesRadioGroup', () => {
    render(<ALMCourseEffectivenessQuestionComponent {...defaultProps} disabled={true} />);

    expect(screen.getByRole('radiogroup').getAttribute('data-disabled')).toBe('true');
  });

  it('disabled_false_enablesRadioGroup', () => {
    render(<ALMCourseEffectivenessQuestionComponent {...defaultProps} disabled={false} />);

    expect(screen.getByRole('radiogroup').getAttribute('data-disabled')).toBe('false');
  });

  it('theme_light_appliesLightClass', () => {
    mockUseProvider.mockReturnValue({ theme: 'light-theme' });
    const { container } = render(<ALMCourseEffectivenessQuestionComponent {...defaultProps} />);

    expect(container.querySelector('label.nps_radio_button_light')).not.toBeNull();
  });

  it('theme_dark_appliesDarkClass', () => {
    mockUseProvider.mockReturnValue({ theme: 'dark-theme' });
    const { container } = render(<ALMCourseEffectivenessQuestionComponent {...defaultProps} />);

    expect(container.querySelector('label.nps_radio_button_dark')).not.toBeNull();
  });

  it('render_helperText_bothLabelsDisplayed', () => {
    render(<ALMCourseEffectivenessQuestionComponent {...defaultProps} />);

    expect(mockGetTranslation).toHaveBeenCalledWith('alm.feedback.text.notAtAllLikely');
    expect(mockGetTranslation).toHaveBeenCalledWith('alm.feedback.text.extremelyLikely');
  });
});
