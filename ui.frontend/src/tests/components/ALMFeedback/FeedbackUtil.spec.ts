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
import { mapQuestionType, getPrimeFeedbackAnswer } from '@components/ALMFeedback/FeedbackUtil';
import { QuestionType } from '@models/FeedbackModel';
import { PrimeFeedbackQuestion } from '@models';

jest.mock('@utils/constants', () => ({
  ...jest.requireActual('@utils/constants'),
  SCALE_TEN: 'SCALE_TEN',
  LIKEABILITY: 'LIKEABILITY',
  L1_QUALITATIVE: 'L1_QUALITATIVE',
  NPS: 'NPS',
}));

const baseQuestion: PrimeFeedbackQuestion = {
  id: 'q1',
  questionId: 'q1',
  questionType: 'SCALE_TEN',
  mandatory: true,
  localizedMetadata: [
    { locale: 'en-US', name: 'How would you rate this course?' } as any,
    { locale: 'fr-FR', name: 'Comment évalueriez-vous ce cours?' } as any,
  ],
  answer: '',
  userResponseLocale: '',
  _transient: null,
};

describe('mapQuestionType', () => {
  it('SCALE_TEN_mapsToCorrectTypeAndBaseShape', () => {
    const result = mapQuestionType(baseQuestion);

    expect(result?.type).toBe(QuestionType.COURSE_EFFECTIVENESS);
    expect(result?.id).toBe('q1');
    expect(result?.questionText).toBe('How would you rate this course?');
    expect(result?.translations).toEqual({
      'en-US': 'How would you rate this course?',
      'fr-FR': 'Comment évalueriez-vous ce cours?',
    });
    expect(result?.required).toBe(true);
  });

  it('SCALE_TEN_nonMandatory_setsRequiredFalse', () => {
    const result = mapQuestionType({ ...baseQuestion, mandatory: false });

    expect(result?.required).toBe(false);
  });

  it('LIKEABILITY_returnsLikertType', () => {
    const result = mapQuestionType({ ...baseQuestion, questionType: 'LIKEABILITY' });

    expect(result?.type).toBe(QuestionType.LIKERT);
  });

  it('L1_QUALITATIVE_returnsTextTypeWithMaxLength', () => {
    const result = mapQuestionType({ ...baseQuestion, questionType: 'L1_QUALITATIVE' }) as any;

    expect(result?.type).toBe(QuestionType.TEXT);
    expect(result?.maxLength).toBe(500);
  });

  it('NPS_returnsNpsTypeWithRangeMinMax', () => {
    const result = mapQuestionType({
      ...baseQuestion,
      questionType: 'NPS',
      rangeStart: 0,
      rangeEnd: 10,
    }) as any;

    expect(result?.type).toBe(QuestionType.NPS);
    expect(result?.min).toBe(0);
    expect(result?.max).toBe(10);
  });

  it('unknownType_returnsNull', () => {
    const result = mapQuestionType({ ...baseQuestion, questionType: 'UNKNOWN' });

    expect(result).toBeNull();
  });

  it('emptyLocalizedMetadata_throws', () => {
    expect(() => mapQuestionType({ ...baseQuestion, localizedMetadata: [] })).toThrow();
  });
});

describe('getPrimeFeedbackAnswer', () => {
  const mockQuestions: PrimeFeedbackQuestion[] = [
    { id: 'q1', questionId: 'q1', questionType: 'SCALE_TEN', mandatory: true, localizedMetadata: [], answer: '', userResponseLocale: '', _transient: null },
    { id: 'q2', questionId: 'q2', questionType: 'LIKEABILITY', mandatory: false, localizedMetadata: [], answer: '', userResponseLocale: '', _transient: null },
  ];

  it('mapsAnswersToQuestionsPreservingAllFields', () => {
    const result = getPrimeFeedbackAnswer({ q1: '8', q2: 'Agree' }, mockQuestions, 'en-US');

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ questionId: 'q1', answer: '8', mandatory: true, questionType: 'SCALE_TEN' });
    expect(result[1]).toMatchObject({ questionId: 'q2', answer: 'Agree', mandatory: false, questionType: 'LIKEABILITY' });
  });

  it('missingAnswer_setsAnswerUndefined', () => {
    const result = getPrimeFeedbackAnswer({}, mockQuestions, 'en-US');

    expect(result[0].answer).toBeUndefined();
    expect(result[1].answer).toBeUndefined();
  });

  it('emptyQuestions_returnsEmptyArray', () => {
    const result = getPrimeFeedbackAnswer({ q1: '8' }, [], 'en-US');

    expect(result).toHaveLength(0);
  });

  it('locale_hyphenReplacedWithUnderscore', () => {
    const result = getPrimeFeedbackAnswer({ q1: '8' }, mockQuestions, 'en-US');

    expect(result[0].userResponseLocale).toBe('en_US');
  });

  it('locale_onlyFirstHyphenReplaced', () => {
    const result = getPrimeFeedbackAnswer({ q1: '8' }, mockQuestions, 'zh-Hans-CN');

    expect(result[0].userResponseLocale).toBe('zh_Hans-CN');
  });
});
