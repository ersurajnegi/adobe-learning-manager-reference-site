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
import React, { useEffect, useRef } from 'react';
import styles from './index.module.css';
import { Form, Divider, Flex, Provider, darkTheme, lightTheme } from '@adobe/react-spectrum';
import { ALMQuestionRenderer } from './components/ALMQuestionRenderer';
import { FeedbackForm, QuestionType } from '../../models/FeedbackModel';
import { GetTranslation } from '../../utils/translationService';
import { getALMConfig, getModalTheme } from '../../utils/global';
import { DOMRefValue } from '@react-types/shared';

interface FormRendererProps {
  feedbackForm: FeedbackForm;
  locale: string;
  onFormSubmit: (form: Record<string, any>) => void;
  onCancel: () => void;
}
export function FormRenderer(props: FormRendererProps) {
  const [response, setResponse] = React.useState<Record<string, any>>({});
  const formRef = useRef<DOMRefValue<HTMLFormElement>>(null);
  const { feedbackForm } = props;

  const handleAnswerChange = (questionId: string, value: any) => {
    setResponse({ ...response, [questionId]: value });
  };

  // focus on the first question
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (formRef.current?.UNSAFE_getDOMNode()?.children) {
        if (feedbackForm.questions[0].type == QuestionType.TEXT) {
          const textQuestion = formRef.current?.UNSAFE_getDOMNode()?.querySelector('textarea');
          if (textQuestion) {
            textQuestion.focus();
          }
        } else {
          const firstInput = formRef.current?.UNSAFE_getDOMNode()?.querySelector('input');
          if (firstInput) {
            firstInput.focus();
          }
        }
      }
    }, 100);
    return () => clearTimeout(timeoutId);
  }, [feedbackForm]);

  return (
    <Provider
      locale={props.locale}
      theme={getModalTheme(getALMConfig()?.themeData.name)}
      UNSAFE_style={{ backgroundColor: 'transparent' }}
    >
      <div className="form-container" style={{ backgroundColor: 'transparent' }}>
        <Form
          ref={formRef}
          validationBehavior="native"
          onSubmit={e => {
            e.preventDefault();
            props.onFormSubmit(response);
          }}
        >
          <>
            {feedbackForm.questions.map((q, index) => (
              <React.Fragment key={q.id}>
                <ALMQuestionRenderer
                  key={q.id}
                  question={q}
                  locale={props.locale}
                  onAnswerChange={handleAnswerChange}
                  order={index + 1}
                />
                {index < feedbackForm.questions.length - 1 && (
                  <Divider size="S" marginTop={'size-250'} marginBottom={'size-150'} />
                )}
              </React.Fragment>
            ))}
          </>

          <Flex
            direction={{ base: 'column', M: 'row' }}
            justifyContent={{ base: 'start', M: 'end' }}
            gap="size-200"
            marginTop="size-300"
            marginBottom={'size-115'}
          >
            <button
              className={styles.feedback_cancel_button}
              type="button"
              onClick={props.onCancel}
            >
              {GetTranslation('alm.feedback.text.cancel')}
            </button>
            <button className={styles.feedback_submit_button} type="submit">
              {GetTranslation('alm.feedback.text.submit')}
            </button>
          </Flex>
        </Form>
      </div>
    </Provider>
  );
}
