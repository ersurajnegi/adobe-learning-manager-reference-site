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
import styles from './GamificationModal.module.css';
import { GetTranslation, GetTranslationReplaced } from '../../utils/translationService';
import { getALMObject } from '../../utils/global';
import GAMIFICATION_ICON from '../../assets/images/gamificationModalPoints.svg';
import { ActionButton, Provider, Dialog, Content, DialogContainer } from '@adobe/react-spectrum';
import { getALMConfig, getModalTheme } from '../../utils/global';
const GamificationModal: React.FC<{
  awardedPoints: number;
  closeGamificationModal: () => void;
}> = props => {
  const { awardedPoints, closeGamificationModal } = props;
  const themeData = getALMConfig()?.themeData;

  const goToLeaderBoard = () => {
    getALMObject().navigateToLeaderboardPage();
  };
  return (
    <Provider theme={getModalTheme(themeData?.name)} colorScheme={'light'}>
      <>
        <ActionButton
          id="showAlert"
          UNSAFE_className={styles.primeAlertDialogButton}
        ></ActionButton>
        <DialogContainer onDismiss={closeGamificationModal} isDismissable={true}>
          <Dialog>
            <Content>
              <div className={styles.gamificationModalBody}>
                <div className={styles.gamificationImgContainer}>
                  <img
                    alt={GetTranslation('gamification.points.achieved.img')}
                    src={GAMIFICATION_ICON}
                  />
                  <span className={styles.points}>{awardedPoints}</span>
                </div>
                <div
                  className={styles.gamificationCongratsText}
                  data-automationId="gamificationCongratsMsg"
                >
                  {GetTranslationReplaced('gamification.congrats.msg', awardedPoints.toString())}
                </div>
                <div
                  className={styles.learnerImprovementText}
                  data-automationId="learningImprovementMsg"
                >
                  {GetTranslation('learning.improvement.msg')}
                </div>
              </div>
              <div className={styles.modalFooter}>
                <div className={styles.modalBootstrapDialogBody}>
                  {!getALMConfig().widgetConfig?.disableLeaderBoardWidgetLink && (
                    <>
                      <span className={styles.viewText} data-automationid="footerViewText">
                        {GetTranslation('alm.instance.view')}
                      </span>

                      <a
                        className={styles.leaderBoardLink}
                        href="#"
                        data-automationid="modalLeaderBoardLink"
                        onClick={goToLeaderBoard}
                        aria-label={GetTranslation('gamification.leaderBoard.link')}
                      >
                        {GetTranslation('gamification.text.leaderboard', true)}
                      </a>
                    </>
                  )}
                </div>
                <div>
                  <button
                    className={styles.modalPrimaryButton}
                    data-automationid="close"
                    onClick={closeGamificationModal}
                  >
                    <div>{GetTranslation('text.gamification.awesome')}</div>
                  </button>
                </div>
              </div>
            </Content>
          </Dialog>
        </DialogContainer>
      </>
    </Provider>
  );
};

export default GamificationModal;
