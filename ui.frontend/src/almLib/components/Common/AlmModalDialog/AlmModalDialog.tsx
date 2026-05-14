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
import { useEffect } from 'react';
import { GetPrimeEmitEventLinks } from '../../../utils/global';
import { SendMessageToParent } from '../../../utils/widgets/base/EventHandlingBase';
import { PrimeEvent } from '../../../utils/widgets/common';
import styles from './AlmModalDialog.module.css';
import { GetTranslation } from '../../../utils/translationService';
import { CROSS_ICON } from '../../../utils/inline_svg';

const AlmModalDialog: React.FC<{
  title: string;
  showCrossButton: boolean;
  showCloseButton: boolean;
  body: any;
  closeDialog?: () => void;
}> = props => {
  const { title, showCloseButton, showCrossButton, body, closeDialog } = props;
  const connectedCallback = () => {
    SendMessageToParent({ type: PrimeEvent.MODAL_DIALOG_LAUNCHED }, GetPrimeEmitEventLinks());
  };
  useEffect(() => {
    connectedCallback();
  }, []);
  return (
    <div className={`${styles.modalDialogOverlay} ${styles.modalFadeIn}`} tabIndex={-1}>
      <div className={styles.modalDialog}>
        <div className={styles.modalDialogContent}>
          <div className={styles.modalDialogHeader}>
            {showCrossButton && (
              <div className={styles.modalDialogCloseButton}>
                <button className={styles.modalCloseButton} onClick={closeDialog}>
                  {CROSS_ICON()}
                </button>
              </div>
            )}
            <div className={styles.modalTitle}>{title}</div>
          </div>
          <div className={styles.modalBody}>
            <div className={styles.modalBootstrapDialogBody}>{body}</div>
          </div>
          <div className={styles.modalFooter}>
            {showCloseButton && (
              <div className={styles.modalBootstrapDialogBody}>
                <div>
                  <button
                    className={styles.modalPrimaryButton}
                    id="close"
                    data-automationid="close"
                    onClick={closeDialog}
                  >
                    <div>{GetTranslation('text.ok')}</div>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlmModalDialog;
