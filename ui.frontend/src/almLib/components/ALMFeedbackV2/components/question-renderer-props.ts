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
import { Question, QuestionType } from '../../../models/FeedbackModel';
import { GetTranslation } from '../../../utils/translationService';

export interface QuestionRendererProps {
  locale: string;
  question: Question;
  onAnswerChange: (questionId: string, answer: any) => void;
  disabled?: boolean;
  order: number;
}

export function getErrorMessagehandler(questionType: QuestionType) {
  if (questionType === QuestionType.TEXT) {
    return (error: { isInvalid: boolean }) => {
      if (error.isInvalid) {
        return GetTranslation('alm.feedback.text.required');
      }
      return null;
    };
  } else {
    return (error: { isInvalid: boolean }) => {
      if (error.isInvalid) {
        return GetTranslation('alm.feedback.text.likert.required');
      }
      return null;
    };
  }
}
