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
import { NpsQuestion, QuestionType } from '../../../models/FeedbackModel';
import { GetTranslation, GetTranslationsReplaced } from '../../../utils/translationService';
import { Text } from '@react-spectrum/text';
import styles from './index.module.css';
import { useDeviceTypeContext } from '../../../contextProviders/DeviceContextProvider';
import { lightTheme } from '@adobe/react-spectrum';
import { useProvider } from '@adobe/react-spectrum';
interface NPSQuestionProps extends QuestionRendererProps {
  question: NpsQuestion;
  questionText: string;
}

export function ALMNPSQuestionComponent({
  question,
  questionText,
  onAnswerChange,
  locale,
  disabled,
  order,
}: NPSQuestionProps) {
  const { max: max, min: min } = question;
  const handleAnswerChange = (value: string) => {
    onAnswerChange(question.id, value);
  };
  const { theme } = useProvider();

  const radioButtonColor =
    theme == lightTheme ? styles.nps_radio_button_light : styles.nps_radio_button_dark;
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
        {GetTranslationsReplaced('alm.feedback.text.nps.description', {
          min: min,
          max: max,
        })}
      </span>
      <Flex direction={'column'}>
        <Flex width={'100%'}>
          <RadioGroup
            errorMessage={getErrorMessagehandler(QuestionType.NPS)}
            width={'100%'}
            isDisabled={disabled}
            isRequired={question.required}
            aria-labelledby={`${question.id}-question-text ${question.id}-info`}
            orientation={'horizontal'}
            onChange={handleAnswerChange}
          >
            {Array.from({ length: max - min + 1 }, (_, i) => i + min).map(i => (
              <Radio
                UNSAFE_className={`${styles.nps_radio_button} ${radioButtonColor}`}
                value={i + ''}
                key={i}
              >
                {i}
              </Radio>
            ))}
          </RadioGroup>
        </Flex>
        <Flex justifyContent={'space-between'} marginTop={'size-50'}>
          <Text>{GetTranslation('alm.feedback.text.notAtAllLikely')}</Text>
          <Text>{GetTranslation('alm.feedback.text.extremelyLikely')}</Text>
        </Flex>
      </Flex>
    </>
  );
}
