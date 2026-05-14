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
import { render, fireEvent } from '@testing-library/react';
import PrimeFeedbackForm from '@components/ALMFeedback/PrimeFeedbackForm';

const mockGetTranslation = jest.fn((key: string) => key);
const mockGetTranslationReplaced = jest.fn((key: string, val: string) => `${key}:${val}`);

jest.mock('@utils/constants', () => ({
  ...jest.requireActual('@utils/constants'),
  SCALE_TEN: 'SCALE_TEN',
  LIKEABILITY: 'LIKEABILITY',
}));

const mockUseIntl = jest.fn(() => ({ locale: 'en-US' }));

jest.mock('react-intl', () => ({
  useIntl: () => mockUseIntl(),
}));

jest.mock('@utils/translationService', () => ({
  GetTranslation: (key: string) => mockGetTranslation(key),
  GetTranslationReplaced: (key: string, val: string) => mockGetTranslationReplaced(key, val),
}));

const scaleTenQuestion: any = {
  id: 'q1',
  questionId: 'q1',
  questionType: 'SCALE_TEN',
  mandatory: true,
  localizedMetadata: [{ locale: 'en-US', name: 'Rate this course' }],
  answer: '',
  userResponseLocale: '',
  _transient: null,
};

const likeabilityQuestion: any = {
  ...scaleTenQuestion,
  questionId: 'q2',
  questionType: 'LIKEABILITY',
  localizedMetadata: [{ locale: 'en-US', name: 'Was content engaging?' }],
};

const textQuestion: any = {
  ...scaleTenQuestion,
  questionId: 'q3',
  questionType: 'L1_QUALITATIVE',
  localizedMetadata: [{ locale: 'en-US', name: 'What did you like?' }],
};

const scaleTenValues = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const likeabilityValues = ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'];

const renderForm = (props: Partial<React.ComponentProps<typeof PrimeFeedbackForm>> = {}) =>
  render(
    <PrimeFeedbackForm
      questionItem={scaleTenQuestion}
      scaleTenQuestionValues={scaleTenValues}
      likeabilityQuestionValues={likeabilityValues}
      index={0}
      isMandatory={true}
      {...props}
    />
  );

describe('PrimeFeedbackForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseIntl.mockReturnValue({ locale: 'en-US' });
  });

  it('render_mandatory_appliesMandatoryClass', () => {
    const { container } = renderForm({ isMandatory: true });

    expect(container.querySelector('.feedback_mandatory')).not.toBeNull();
  });

  it('render_optional_noMandatoryClass', () => {
    const { container } = renderForm({ isMandatory: false });

    expect(container.querySelector('.feedback_mandatory')).toBeNull();
  });

  it('render_index_usedAsQuestionNumber', () => {
    renderForm({ index: 2 });

    expect(mockGetTranslationReplaced).toHaveBeenCalledWith('text.sNo.fullstop', '3');
  });

  it('render_questionText_usesCurrentLocale', () => {
    const { container } = renderForm({
      questionItem: {
        ...scaleTenQuestion,
        localizedMetadata: [
          { locale: 'en-US', name: 'English text' },
          { locale: 'fr-FR', name: 'French text' },
        ],
      },
    });

    expect(container.textContent).toContain('English text');
    expect(container.textContent).not.toContain('French text');
  });

  it('render_questionText_fallsBackToEnUs', () => {
    mockUseIntl.mockReturnValue({ locale: 'ja-JP' });

    const { container } = renderForm({
      questionItem: {
        ...scaleTenQuestion,
        localizedMetadata: [
          { locale: 'en-US', name: 'English fallback' },
          { locale: 'fr-FR', name: 'French text' },
        ],
      },
    });

    expect(container.textContent).toContain('English fallback');
    expect(container.textContent).not.toContain('French text');
  });

  it('scaleTen_type_rendersRadioButtons', () => {
    const { container } = renderForm({ questionItem: scaleTenQuestion });

    expect(container.querySelectorAll('input[type="radio"]').length).toBe(10);
  });

  it('scaleTen_type_rendersRatingLabels', () => {
    renderForm({ questionItem: scaleTenQuestion });

    expect(mockGetTranslation).toHaveBeenCalledWith('text.notAtAllLikely');
    expect(mockGetTranslation).toHaveBeenCalledWith('text.extremelyLikely');
  });

  it('likeability_type_rendersOptions', () => {
    const { container } = renderForm({ questionItem: likeabilityQuestion });

    expect(container.querySelectorAll('input[type="radio"]').length).toBe(5);
    expect(container.textContent).toContain('Strongly Disagree');
    expect(container.textContent).toContain('Strongly Agree');
  });

  it('likeability_type_hasVerticalClass', () => {
    const { container } = renderForm({ questionItem: likeabilityQuestion });

    expect(container.querySelector('.feedback_likert_vertical')).not.toBeNull();
  });

  it('text_type_rendersTextareaWithMaxLength', () => {
    const { container } = renderForm({ questionItem: textQuestion });

    const textarea = container.querySelector('textarea');
    expect(textarea).not.toBeNull();
    expect(textarea?.getAttribute('maxLength')).toBe('500');
  });

  it('text_type_initializesCharCounter', () => {
    renderForm({ questionItem: textQuestion });

    expect(mockGetTranslationReplaced).toHaveBeenCalledWith('text.numCharsLeft', '500');
  });

  it('keyUp_typingText_updatesCounterWithRemainingChars', () => {
    const { container } = renderForm({ questionItem: textQuestion });
    const textarea = container.querySelector('textarea') as HTMLTextAreaElement;

    textarea.value = 'Hello';
    fireEvent.keyUp(textarea);

    expect(mockGetTranslationReplaced).toHaveBeenCalledWith('text.numCharsLeft', '495');
  });

  it('keyUp_noCharCountDiv_doesNotUpdateCounter', () => {
    const { container } = renderForm({ questionItem: textQuestion });
    const textarea = container.querySelector('textarea') as HTMLTextAreaElement;
    const charCountDiv = container.querySelector(`#${textQuestion.questionId}-charCount`);
    charCountDiv?.remove();

    jest.clearAllMocks();
    textarea.value = 'Test';
    fireEvent.keyUp(textarea);

    expect(mockGetTranslationReplaced).not.toHaveBeenCalled();
  });
});
