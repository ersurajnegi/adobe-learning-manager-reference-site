/**
Copyright 2021 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/
import { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import { PrimeUserRecommendationCriteria } from '../../../models';
import { ADVANCED } from '../../../utils/widgets/common';
import { PrlChips } from '../PrlChips';
import { PrlLevelSelector } from '../PrlLevelSelector';
import { ALMDialog, ALMDialogHeader } from '../../ALMDialog';
import { useDialog } from '../../../contextProviders/ALMDialogContextProvider';

import styles from './PrlPreference.module.css';
import { Heading } from '@adobe/react-spectrum';

const PrlPreference = (props: any) => {
  const { formatMessage } = useIntl();
  const [isEditMode, setIsEditMode] = useState(false);
  const [updatedSelectedCriteria, setUpdatedSelectedCriteria] = useState([props.selectedCriteria]);
  const [isLevelsScreen, setIsLevelsScreen] = useState(false);
  const { isOpen, openDialog, closeDialog } = useDialog();
  const DIALOG_ID = 'alm-prl-dialog';

  useEffect(() => {
    if (props.selectedCriteria) {
      setUpdatedSelectedCriteria(props.selectedCriteria);
    }
  }, [props]);

  const addSelected = (item: PrimeUserRecommendationCriteria) => {
    setUpdatedSelectedCriteria([
      ...updatedSelectedCriteria,
      {
        id: item.id,
        name: item.name,
        levels: props.isLevelsEnabled ? [ADVANCED] : undefined,
      },
    ]);
  };
  const removeSelected = (item: PrimeUserRecommendationCriteria) => {
    setUpdatedSelectedCriteria(
      updatedSelectedCriteria.filter((criteria: any) => criteria.id !== item.id)
    );
  };

  const showMobileView = () => {
    return window.innerWidth < 768;
  };

  const toggleEditMode = () => {
    const currentMode = isEditMode;
    setIsEditMode(isEditMode => {
      if (showMobileView()) {
        if (isEditMode) {
          closeDialog(DIALOG_ID);
        } else {
          openDialog(DIALOG_ID);
        }
      }
      return !isEditMode;
    });
    setUpdatedSelectedCriteria(props.selectedCriteria);
    if (showMobileView()) {
      if (currentMode) {
        closeDialog(DIALOG_ID);
      } else {
        openDialog(DIALOG_ID);
      }
      setIsLevelsScreen(false);
    }
  };

  const handleCritiaSave = () => {
    if (typeof props.onUpdate === 'function') {
      props.onUpdate({
        detail: {
          criteria: updatedSelectedCriteria,
        },
      });
      toggleEditMode();
    }
  };

  const updateLevel = (event: CustomEvent) => {
    const item = event.detail?.item;
    if (!item?.id) {
      console.error('NO data in custom event : ', JSON.stringify(event.detail));
      return;
    }
    const index = updatedSelectedCriteria.findIndex((criteria: any) => criteria.id === item.id);
    if (index > -1) {
      updatedSelectedCriteria[index] = item;
      setUpdatedSelectedCriteria([...updatedSelectedCriteria]);
    }
  };

  const getPrlChips = () => {
    return (
      <>
        <div className={styles.prlPCriteriaSection}>
          {(!showMobileView() || (showMobileView() && !isLevelsScreen)) && (
            <PrlChips
              className={styles.prlPPrlChips}
              options={props.allCriteria}
              selectedOptions={
                new Map(
                  updatedSelectedCriteria.map((obj: PrimeUserRecommendationCriteria) => [
                    obj.id,
                    obj.name,
                  ])
                )
              }
              onAdd={addSelected}
              onRemove={removeSelected}
            />
          )}
          {props.isLevelsEnabled && (!showMobileView() || (showMobileView() && isLevelsScreen)) && (
            <div className={styles.levelSelectorContainer}>
              <PrlLevelSelector
                options={updatedSelectedCriteria}
                levels={props.levels}
                onChangeHandler={updateLevel}
              />
            </div>
          )}
        </div>
      </>
    );
  };

  const renderCriteria = () => {
    if (isEditMode) {
      return showMobileView() ? getMobileView() : getPrlChips();
    }
    return getFormattedCriterias();
  };

  const getFormattedCriterias = () => {
    return (
      <div className={styles.prlPCriteria}>
        {props.selectedCriteria?.map((item: any) => item.name).join(', ')}
      </div>
    );
  };

  const isMobileAndLevelsEnabled = () => {
    return showMobileView() && props.isLevelsEnabled;
  };

  const isMobileAndLevelsDisabled = () => {
    return showMobileView() && !props.isLevelsEnabled;
  };

  const isMobileLevelsScreen = () => {
    return isMobileAndLevelsEnabled() && isLevelsScreen;
  };

  const isMobileCriteriaScreen = () => {
    return isMobileAndLevelsEnabled() && !isLevelsScreen;
  };

  const getUpdateActionButtons = () => {
    const shouldDisableSave = updatedSelectedCriteria?.length === 0 || props.isSaving;
    return (
      <div className={showMobileView() ? styles.updateActionsButton : ''}>
        {(!showMobileView() || isMobileAndLevelsDisabled() || isMobileCriteriaScreen()) && (
          <button className={styles.prlPSecondaryButton} onClick={toggleEditMode}>
            {formatMessage({
              id: 'alm.text.cancel',
              defaultMessage: 'Cancel',
            })}
          </button>
        )}
        {isMobileCriteriaScreen() && (
          <button
            className={styles.prlPPrimaryButton}
            onClick={() => setIsLevelsScreen(true)}
            disabled={shouldDisableSave}
          >
            {formatMessage({
              id: 'prl.next.text',
              defaultMessage: 'Next',
            })}
          </button>
        )}
        {isMobileLevelsScreen() && (
          <button className={styles.prlPSecondaryButton} onClick={() => setIsLevelsScreen(false)}>
            {formatMessage({
              id: 'alm.author.back.label',
              defaultMessage: 'Back',
            })}
          </button>
        )}
        {(!showMobileView() || isMobileAndLevelsDisabled() || isMobileLevelsScreen()) && (
          <button
            className={styles.prlPPrimaryButton}
            onClick={handleCritiaSave}
            disabled={shouldDisableSave}
          >
            {formatMessage({
              id: 'alm.text.save',
              defaultMessage: 'Save',
            })}
          </button>
        )}
      </div>
    );
  };
  const renderActionButtons = () => {
    if (isEditMode) {
      return !showMobileView() && getUpdateActionButtons();
    }
    return (
      <button className={styles.prlPSecondaryButton} onClick={toggleEditMode}>
        {formatMessage({
          id: 'alm.text.edit',
          defaultMessage: 'Edit',
        })}
      </button>
    );
  };

  const getHeading = () => {
    return `${formatMessage({ id: 'alm.prl.selectPrefered', defaultMessage: 'Select Prefered' })} ${isLevelsScreen ? formatMessage({ id: 'levels', defaultMessage: 'Levels' }) : props.heading}`;
  };

  const getMobileView = () => {
    return (
      <>
        {isOpen(DIALOG_ID) && (
          <ALMDialog id={DIALOG_ID} overlayClose={false}>
            <ALMDialogHeader>
              <Heading level={3} UNSAFE_className={styles.almDialogTitle}>
                {getHeading()}
              </Heading>
            </ALMDialogHeader>
            {isEditMode && getPrlChips()}
            {isEditMode && getUpdateActionButtons()}
          </ALMDialog>
        )}
        {getFormattedCriterias()}
      </>
    );
  };

  return (
    <>
      <div className={styles.prlPContainer}>
        <div className={styles.prlPHeader}>
          <div className={styles.prlPHeading}>{props.heading}</div>
          {renderActionButtons()}
        </div>
        {renderCriteria()}
      </div>
    </>
  );
};
export default PrlPreference;
