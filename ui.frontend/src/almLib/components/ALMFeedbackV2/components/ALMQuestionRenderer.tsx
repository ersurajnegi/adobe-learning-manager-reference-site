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
import { QuestionRendererProps } from './question-renderer-props';

import { ALMNPSQuestionComponent } from './ALMNPSQuestion';
import { ALMTextQuestionComponent } from './ALMTextQuestion';
import { ALMLikertQuestionComponent } from './ALMLikertQuestion';
import { ALMCourseEffectivenessQuestionComponent } from './ALMCourseEffectivenessQuestion';

import { Flex } from '@react-spectrum/layout';
import { Text } from '@react-spectrum/text';
import {
  QuestionType,
  TextQuestion,
  NpsQuestion,
  LikertQuestion,
  CourseEffectivenessQuestion,
} from '../../../models/FeedbackModel';
import { GetTranslationsReplaced } from '../../../utils/translationService';

export function ALMQuestionRenderer(props: QuestionRendererProps) {
  const { locale, onAnswerChange, question } = props;

  const questionText = question.translations[locale] || question.questionText;

  const _props = { questionText, onAnswerChange, locale, order: props.order };

  return (
    <div>
      <Flex direction="column" gap="size-100" marginBottom="size-300" marginTop="size-200">
        <Text UNSAFE_className="question-text">
          {GetTranslationsReplaced('alm.feedback.text.question', { n: props.order }, false)}
        </Text>
        {question.type == QuestionType.TEXT && (
          <ALMTextQuestionComponent {..._props} question={question as TextQuestion} />
        )}
        {question.type == QuestionType.NPS && (
          <ALMNPSQuestionComponent {..._props} question={question as NpsQuestion} />
        )}
        {question.type == QuestionType.LIKERT && (
          <ALMLikertQuestionComponent {..._props} question={question as LikertQuestion} />
        )}
        {question.type == QuestionType.COURSE_EFFECTIVENESS && (
          <ALMCourseEffectivenessQuestionComponent
            {..._props}
            question={question as CourseEffectivenessQuestion}
          />
        )}
      </Flex>
    </div>
  );
}
