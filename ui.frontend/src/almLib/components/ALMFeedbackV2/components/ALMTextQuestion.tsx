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
import React, { useState } from 'react';
import { getErrorMessagehandler, QuestionRendererProps } from './question-renderer-props';
import { TextArea } from '@react-spectrum/textfield';
import { Text } from '@react-spectrum/text';
import { TextQuestion, QuestionType } from '../../../models/FeedbackModel';
import styles from './index.module.css';
import {
  GetTranslation,
  GetTranslationReplaced,
  GetTranslationsReplaced,
} from '../../../utils/translationService';
interface TextQuestionProps extends QuestionRendererProps {
  question: TextQuestion;
  questionText: string;
}

export function ALMTextQuestionComponent({
  question,
  questionText,
  onAnswerChange,
  locale,
  disabled,
  order,
}: TextQuestionProps) {
  const { maxLength } = question;
  const [value, setValue] = useState('');
  const handleAnswerChange = (value: string) => {
    setValue(value);
    onAnswerChange(question.id, value);
  };
  return (
    <>
      <label
        id={question.id}
        lang={locale}
        className={question.required ? styles.feedback_mandatory : ''}
      >
        {questionText}
      </label>
      <span id={`${question.id}-question-text`} className={styles.aria_hidden}>
        {GetTranslationsReplaced('alm.feedback.text.question', { n: order })}. {questionText}
      </span>
      <span id={`${question.id}-info`} className={styles.aria_hidden}>
        {GetTranslation('alm.feedback.text.question.type.text')}
      </span>

      <TextArea
        errorMessage={getErrorMessagehandler(QuestionType.TEXT)}
        UNSAFE_className={styles.alm_feedback_textarea}
        placeholder={GetTranslation('alm.feedback.text.placeholder')}
        minHeight={100}
        width={'100%'}
        name={question.id}
        isRequired={question.required}
        aria-labelledby={`${question.id}-question-text ${question.id}-info`}
        maxLength={maxLength}
        onChange={handleAnswerChange}
        isDisabled={disabled}
      />
      <Text UNSAFE_style={{ color: 'var(--spectrum-global-color-gray-500)' }}>
        <span aria-live={'polite'}>
          {GetTranslationsReplaced('alm.feedback.text.textarea.counter', {
            count: maxLength - value.length,
          })}
        </span>
      </Text>
    </>
  );
}
