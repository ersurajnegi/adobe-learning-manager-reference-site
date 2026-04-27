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
export interface FeedbackForm {
  locales: string[];
  defaultLocale: string;
  questions: Question[];
}

export enum QuestionType {
  TEXT = 'TEXT',
  NPS = 'NPS',
  LIKERT = 'LIKERT',
  COURSE_EFFECTIVENESS = 'COURSE_EFFECTIVENESS',
}

export interface BaseQuestion {
  id: string;
  type: string;
  questionText: string;
  translations: Record<string, string>;
  required: boolean;
}

export interface TextQuestion extends BaseQuestion {
  type: QuestionType.TEXT;
  maxLength: number;
}

export interface NpsQuestion extends BaseQuestion {
  type: QuestionType.NPS;
  min: number;
  max: number;
}

export interface LikertQuestion extends BaseQuestion {
  type: QuestionType.LIKERT;
}

export interface CourseEffectivenessQuestion extends BaseQuestion {
  type: QuestionType.COURSE_EFFECTIVENESS;
}

export type Question = TextQuestion | NpsQuestion | LikertQuestion | CourseEffectivenessQuestion;

// add factory for creating questions
export function createTextQuestion(
  id: string,
  questionText: string,
  translations: Record<string, string>,
  required: boolean,
  maxLength: number
): TextQuestion {
  return { id, type: QuestionType.TEXT, questionText, translations, required, maxLength };
}

export function createNpsQuestion(
  id: string,
  questionText: string,
  translations: Record<string, string>,
  required: boolean,
  min: number,
  max: number
): NpsQuestion {
  return { id, type: QuestionType.NPS, questionText, translations, required, min: min, max: max };
}

export function createLikertQuestion(
  id: string,
  questionText: string,
  translations: Record<string, string>,
  required: boolean
): LikertQuestion {
  return { id, type: QuestionType.LIKERT, questionText, translations, required };
}

export function createCourseEffectivenessQuestion(
  id: string,
  questionText: string,
  translations: Record<string, string>,
  required: boolean
): CourseEffectivenessQuestion {
  return { id, type: QuestionType.COURSE_EFFECTIVENESS, questionText, translations, required };
}

export function createQuestionFromType(type: QuestionType): Question {
  const id = Math.random().toString(36).substring(7);
  switch (type) {
    case QuestionType.TEXT:
      return createTextQuestion(id, '', {}, false, 500);
    case QuestionType.NPS:
      return createNpsQuestion(id, '', {}, false, 0, 10);
    case QuestionType.LIKERT:
      return createLikertQuestion(id, '', {}, false);
    case QuestionType.COURSE_EFFECTIVENESS:
      return createCourseEffectivenessQuestion(id, '', {}, false);
  }
}
