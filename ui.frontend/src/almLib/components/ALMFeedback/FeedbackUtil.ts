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
import { PrimeFeedbackQuestion } from '../../models';
import {
  QuestionType,
  BaseQuestion,
  Question,
  CourseEffectivenessQuestion,
  LikertQuestion,
  TextQuestion,
  NpsQuestion,
} from '../../models/FeedbackModel';
import { L1_QUALITATIVE, NPS, LIKEABILITY, SCALE_TEN } from '../../utils/constants';
import { PrimeEvent } from '../../utils/widgets/common';
import { SendMessageToParent } from '../../utils/widgets/base/EventHandlingBase';
import { GetPrimeEmitEventLinks, sendEvent } from '../../utils/global';
import { hideBody, showBody } from '../../utils/lo-utils';

/** Emits launch setup: hideBody, disable nav controls. */
export function emitL1FeedbackLaunchSetup(): void {
  hideBody();
  sendEvent(PrimeEvent.ALM_DISABLE_NAV_CONTROLS);
}

/** Emits L1_FEEDBACK_LAUNCHED to parent. */
export function emitL1FeedbackLaunched(): void {
  SendMessageToParent({ type: PrimeEvent.L1_FEEDBACK_LAUNCHED }, GetPrimeEmitEventLinks());
}

/** Emits close: showBody, enable nav, L1_FEEDBACK_CLOSED with notificationIds. */
export function emitL1FeedbackClosed(notificationIds: string[] = []): void {
  showBody();
  sendEvent(PrimeEvent.ALM_ENABLE_NAV_CONTROLS);
  SendMessageToParent(
    { type: PrimeEvent.L1_FEEDBACK_CLOSED, notificationIds },
    GetPrimeEmitEventLinks()
  );
}

function createBaseQuestion(question: PrimeFeedbackQuestion, type: QuestionType): BaseQuestion {
  return {
    id: question.questionId,
    questionText: question.localizedMetadata[0].name,
    translations: question.localizedMetadata.reduce((acc: Record<string, string>, curr) => {
      acc[curr.locale] = curr.name;
      return acc;
    }, {}),
    required: question.mandatory,
    type: type,
  };
}

export function mapQuestionType(question: PrimeFeedbackQuestion): Question | null {
  const questionType = question.questionType;

  switch (questionType) {
    case SCALE_TEN:
      return createBaseQuestion(
        question,
        QuestionType.COURSE_EFFECTIVENESS
      ) as CourseEffectivenessQuestion;

    case LIKEABILITY:
      return createBaseQuestion(question, QuestionType.LIKERT) as LikertQuestion;

    case L1_QUALITATIVE:
      return {
        ...createBaseQuestion(question, QuestionType.TEXT),
        maxLength: 500,
      } as TextQuestion;

    case NPS:
      return {
        ...createBaseQuestion(question, QuestionType.NPS),
        min: question.rangeStart,
        max: question.rangeEnd,
      } as NpsQuestion;
  }

  return null;
}

export function getPrimeFeedbackAnswer(
  userAnswers: Record<string, any>,
  questions: PrimeFeedbackQuestion[],
  locale: string
): PrimeFeedbackQuestion[] {
  const answeredQuestions: PrimeFeedbackQuestion[] = questions.map(question => {
    return {
      questionId: question.questionId,
      mandatory: question.mandatory,
      questionType: question.questionType,
      answer: userAnswers[question.questionId],
      userResponseLocale: locale.replace('-', '_'),
    } as PrimeFeedbackQuestion;
  });

  return answeredQuestions;
}
