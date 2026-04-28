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
import { ALMQuestionRenderer } from '@components/ALMFeedbackV2/components/ALMQuestionRenderer';
import { QuestionType } from '@models/FeedbackModel';

const mockGetTranslationsReplaced = jest.fn((key: string, params: any, _fallback?: boolean) => `${key}:${params.n}`);

jest.mock('@utils/translationService', () => ({
  GetTranslationsReplaced: (key: string, params: any, fallback?: boolean) =>
    mockGetTranslationsReplaced(key, params, fallback),
}));

jest.mock('@components/ALMFeedbackV2/components/ALMTextQuestion', () => ({
  ALMTextQuestionComponent: ({ questionText }: any) => (
    <div data-testid="text-question">{questionText}</div>
  ),
}));

jest.mock('@components/ALMFeedbackV2/components/ALMNPSQuestion', () => ({
  ALMNPSQuestionComponent: ({ questionText }: any) => (
    <div data-testid="nps-question">{questionText}</div>
  ),
}));

jest.mock('@components/ALMFeedbackV2/components/ALMLikertQuestion', () => ({
  ALMLikertQuestionComponent: ({ questionText }: any) => (
    <div data-testid="likert-question">{questionText}</div>
  ),
}));

jest.mock('@components/ALMFeedbackV2/components/ALMCourseEffectivenessQuestion', () => ({
  ALMCourseEffectivenessQuestionComponent: ({ questionText }: any) => (
    <div data-testid="ce-question">{questionText}</div>
  ),
}));

jest.mock('@react-spectrum/layout', () => ({
  Flex: ({ children }: any) => <>{children}</>,
}));

jest.mock('@react-spectrum/text', () => ({
  Text: ({ children }: any) => <span>{children}</span>,
}));

const baseProps = {
  locale: 'en-US',
  onAnswerChange: jest.fn(),
  disabled: false,
  order: 1,
};

describe('ALMQuestionRenderer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('type_text_rendersTextQuestion', () => {
    render(
      <ALMQuestionRenderer
        {...baseProps}
        question={{ id: 'q1', type: QuestionType.TEXT, questionText: 'q', translations: {}, maxLength: 500, required: false }}
      />
    );

    expect(screen.getByTestId('text-question')).not.toBeNull();
    expect(screen.queryByTestId('nps-question')).toBeNull();
    expect(screen.queryByTestId('likert-question')).toBeNull();
    expect(screen.queryByTestId('ce-question')).toBeNull();
  });

  it('type_nps_rendersNPSQuestion', () => {
    render(
      <ALMQuestionRenderer
        {...baseProps}
        question={{ id: 'q1', type: QuestionType.NPS, questionText: 'q', translations: {}, min: 0, max: 10, required: false }}
      />
    );

    expect(screen.getByTestId('nps-question')).not.toBeNull();
    expect(screen.queryByTestId('text-question')).toBeNull();
  });

  it('type_likert_rendersLikertQuestion', () => {
    render(
      <ALMQuestionRenderer
        {...baseProps}
        question={{ id: 'q1', type: QuestionType.LIKERT, questionText: 'q', translations: {}, required: false }}
      />
    );

    expect(screen.getByTestId('likert-question')).not.toBeNull();
    expect(screen.queryByTestId('text-question')).toBeNull();
  });

  it('type_courseEffectiveness_rendersCEQuestion', () => {
    render(
      <ALMQuestionRenderer
        {...baseProps}
        question={{ id: 'q1', type: QuestionType.COURSE_EFFECTIVENESS, questionText: 'q', translations: {}, required: false }}
      />
    );

    expect(screen.getByTestId('ce-question')).not.toBeNull();
    expect(screen.queryByTestId('text-question')).toBeNull();
  });

  it('questionText_matchingLocale_usesTranslation', () => {
    render(
      <ALMQuestionRenderer
        {...baseProps}
        locale="fr"
        question={{
          id: 'q1',
          type: QuestionType.TEXT,
          questionText: 'Default text',
          translations: { en: 'English', fr: 'Texte français' },
          maxLength: 500,
          required: false,
        }}
      />
    );

    expect(screen.getByTestId('text-question').textContent).toBe('Texte français');
  });

  it('questionText_noLocaleMatch_usesQuestionText', () => {
    render(
      <ALMQuestionRenderer
        {...baseProps}
        locale="ja"
        question={{
          id: 'q1',
          type: QuestionType.TEXT,
          questionText: 'Default text',
          translations: { en: 'English' },
          maxLength: 500,
          required: false,
        }}
      />
    );

    expect(screen.getByTestId('text-question').textContent).toBe('Default text');
  });

  it('questionText_emptyTranslations_usesQuestionText', () => {
    render(
      <ALMQuestionRenderer
        {...baseProps}
        question={{
          id: 'q1',
          type: QuestionType.TEXT,
          questionText: 'Fallback text',
          translations: {},
          maxLength: 500,
          required: false,
        }}
      />
    );

    expect(screen.getByTestId('text-question').textContent).toBe('Fallback text');
  });

  it('render_order_passedToQuestionNumber', () => {
    render(
      <ALMQuestionRenderer
        {...baseProps}
        order={4}
        question={{ id: 'q1', type: QuestionType.TEXT, questionText: 'q', translations: {}, maxLength: 500, required: false }}
      />
    );

    expect(mockGetTranslationsReplaced).toHaveBeenCalledWith(
      'alm.feedback.text.question',
      { n: 4 },
      false
    );
  });
});
