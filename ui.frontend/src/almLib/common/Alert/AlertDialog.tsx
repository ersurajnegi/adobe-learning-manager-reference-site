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
import styles from './AlertDialog.module.css';
import Alert from '@spectrum-icons/workflow/Alert';
import CheckmarkCircleOutline from '@spectrum-icons/workflow/CheckmarkCircleOutline';
import { Provider } from '@adobe/react-spectrum';
import { getALMConfig, getModalColorScheme, getModalTheme } from '../../utils/global';

export enum AlertType {
  success = 'success',
  error = 'error',
}

export const renderAlert = (type: 'success' | 'error') => {
  switch (AlertType[type]) {
    case AlertType.success:
      return <CheckmarkCircleOutline UNSAFE_className={`${styles.alertIcon} ${styles.success}`} />;
    case AlertType.error:
      return <Alert UNSAFE_className={`${styles.alertIcon} ${styles.error}`} />;
  }
};
const AlertDialog: React.FC<{
  type: 'success' | 'error';
  show: boolean;
  message: string;
}> = ({ type, show, message }) => {
  const themeName = getALMConfig().themeData?.name;
  return (
    <Provider theme={getModalTheme(themeName)} colorScheme={getModalColorScheme(themeName)}>
      {show && (
        <div className={styles.alertbackdrop}>
          <div className={`${styles.alert} ${styles.dialog}`}>
            <div className={styles.alertIconType}>{renderAlert(type)}</div>
            <div
              className={styles.alertMessage}
              role="alert"
              aria-atomic="true"
              aria-live="assertive"
              dangerouslySetInnerHTML={{ __html: message }}
            ></div>
          </div>
        </div>
      )}
    </Provider>
  );
};
export { AlertDialog };
