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
import { getErrorMessagehandler, QuestionRendererProps } from './question-renderer-props';
import { Flex } from '@react-spectrum/layout';
import { Radio, RadioGroup } from '@react-spectrum/radio';
import { LikertQuestion, QuestionType } from '../../../models/FeedbackModel';
import { GetTranslation, GetTranslationsReplaced } from '../../../utils/translationService';
import styles from './index.module.css';
import { useDeviceTypeContext } from '../../../contextProviders/DeviceContextProvider';
import { Text } from '@react-spectrum/text';
interface LikertQuestionProps extends QuestionRendererProps {
  question: LikertQuestion;
  questionText: string;
}

export function ALMLikertQuestionComponent({
  question,
  questionText,
  onAnswerChange,
  locale,
  disabled,
  order,
}: LikertQuestionProps) {
  const handleAnswerChange = (value: string) => {
    onAnswerChange(question.id, value);
  };

  const { screenWidth } = useDeviceTypeContext();
  const isNarrow = screenWidth < 750;

  const likertScale = React.useMemo(() => {
    const radioLabelProps = {
      UNSAFE_className: isNarrow ? '' : styles.radio_label,
      marginStart: isNarrow ? '' : 'size-400',
    };
    return (
      <Flex direction={{ base: 'column', M: 'row' }} alignItems={{ base: 'start', M: 'center' }}>
        <RadioGroup
          errorMessage={getErrorMessagehandler(QuestionType.LIKERT)}
          isDisabled={disabled}
          isRequired={question.required}
          orientation={isNarrow ? 'vertical' : 'horizontal'}
          labelPosition={isNarrow ? 'side' : 'top'}
          aria-labelledby={`${question.id}-question-text`}
          onChange={handleAnswerChange}
        >
          <Radio
            UNSAFE_className={isNarrow ? '' : styles.radio_label}
            value={GetTranslation('text.strongly.disagree')}
          >
            {GetTranslation('alm.feedback.text.stronglydisagree')}
          </Radio>
          <Radio {...radioLabelProps} value={GetTranslation('text.disagree')}>
            {GetTranslation('alm.feedback.text.disagree')}
          </Radio>
          <Radio {...radioLabelProps} value={GetTranslation('text.ok')}>
            {GetTranslation('alm.feedback.text.neutral')}
          </Radio>
          <Radio {...radioLabelProps} value={GetTranslation('text.agree')}>
            {GetTranslation('alm.feedback.text.agree')}
          </Radio>
          <Radio {...radioLabelProps} value={GetTranslation('text.strongly.agree')}>
            {GetTranslation('alm.feedback.text.stronglyagree')}
          </Radio>
        </RadioGroup>
      </Flex>
    );
  }, [onAnswerChange]);
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
      {likertScale}
    </>
  );
}
