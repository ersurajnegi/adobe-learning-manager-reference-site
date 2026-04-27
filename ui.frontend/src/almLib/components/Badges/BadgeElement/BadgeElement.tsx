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
/***
 *
 * Please Do not use this Component.
 */

import styles from './BadgeElement.module.css';
import { GetFormattedDate } from '../../../utils/dateTime';
import { getALMConfig, getALMObject } from '../../../utils/global';
import { Checkbox } from '@adobe/react-spectrum';
import { useState } from 'react';
import {
  GetTranslation,
  GetTranslationsReplaced,
  getPreferredLocalizedMetadata,
} from '../../../utils/translationService';
import { useUserContext } from '../../../contextProviders/userContextProvider';
import { ENGLISH_LOCALE, SKILL_LEVEL } from '../../../utils/constants';

const BadgeElement = (props: any) => {
  const showSelectCheckbox = !getALMConfig().learnerMobileApp;
  const { user } = useUserContext() || {};
  const uiLocale = user?.uiLocale || ENGLISH_LOCALE;

  const {
    id,
    badge,
    dateAchieved,
    loModel,
    num,
    setNum,
    handleDownloadPdfClick,
    handleDownloadImgClick,
  } = props;

  const status = dateAchieved ? true : false;
  const formattedDate = dateAchieved && GetFormattedDate(dateAchieved, uiLocale);
  const [selected, setSelected] = useState(false);

  const loDetails = loModel?.id;
  const badgeAquiredForType = loModel?.loType
    ? GetTranslation(`alm.text.${loModel.loType}`, true)
    : GetTranslation('alm.text.skill', true);

  const localizedMetadata = loModel?.localizedMetadata
    ? getPreferredLocalizedMetadata(loModel.localizedMetadata, uiLocale)
    : null;
  const badgeTypeName =
    loModel?.type === SKILL_LEVEL ? loModel?.skill?.name : (localizedMetadata as any)?.name;

  const badgeName = badge?.name || '';

  const handleSelect = () => {
    setSelected(!selected);
    if (selected) {
      setNum(num - 1);
    } else {
      setNum(num + 1);
    }
  };

  const handleBadgeModelClick = () => {
    if (loModel?.loType) {
      getALMObject().navigateToTrainingOverviewPage(loDetails);
    } else {
      getALMObject().navigateToMyLearningPage({ skillName: loModel?.skill?.name });
    }
  };

  const renderBadgeTypeText = () => {
    const badgeTypeLink = (
      <a
        href="javascript:void(0)"
        className={styles.inline}
        tabIndex={0}
        onClick={handleBadgeModelClick}
        role="button"
        aria-label={
          status
            ? badgeTypeName
            : GetTranslationsReplaced(
                'alm.badge.type.notCompleted.label',
                {
                  badgeTypeName: badgeTypeName,
                },
                true
              )
        }
      >
        {badgeTypeName}
      </a>
    );

    if (status) {
      const completedText = GetTranslationsReplaced(
        'alm.badge.type.completed',
        {
          badgeAquiredForType,
          formattedDate,
        },
        true
      );
      const parts = completedText.split(badgeAquiredForType);
      return (
        <>
          {parts[0]}
          {badgeAquiredForType} {badgeTypeLink}
          {parts[1]}
        </>
      );
    } else {
      const notCompletedText = GetTranslationsReplaced(
        'alm.badge.type.notCompleted',
        {
          badgeAquiredForType,
        },
        true
      );
      const parts = notCompletedText.split(badgeAquiredForType);
      return (
        <>
          {parts[0]}
          {badgeAquiredForType} {badgeTypeLink}
          {parts[1]}
        </>
      );
    }
  };

  return (
    <div className={styles.itemview}>
      <div className={styles.badgebox}>
        <div className={status ? styles.downloadicons : styles.downloadiconsdisabled}>
          <div className={styles.downloadoptions}>
            <a
              href="javascript:void(0)"
              className={styles.downloadLink}
              tabIndex={status ? 0 : -1}
              onClick={e => {
                if (status) {
                  e.preventDefault();
                  handleDownloadPdfClick(e, id);
                }
              }}
              role="button"
              aria-label={GetTranslationsReplaced('alm.badge.downloadPdf', { badgeName }, true)}
              aria-hidden={status ? false : true}
            >
              {GetTranslation('alm.text.pdf', true)}
            </a>
            <span>| </span>
            <a
              href="javascript:void(0)"
              className={styles.downloadLink}
              tabIndex={status ? 0 : -1}
              onClick={e => {
                if (status) {
                  e.preventDefault();
                  handleDownloadImgClick(e, badge.imageUrl);
                }
              }}
              role="button"
              aria-label={GetTranslationsReplaced('alm.badge.downloadImg', { badgeName }, true)}
              aria-hidden={status ? false : true}
            >
              {GetTranslation('alm.text.badge', true)}
            </a>
          </div>
        </div>
        <div className={styles.contentrow}>
          {showSelectCheckbox && (
            <Checkbox
              UNSAFE_className={styles.checkbox}
              isDisabled={!status}
              excludeFromTabOrder={!status}
              aria-label={GetTranslationsReplaced('alm.badge.checkbox', { badgeName }, true)}
              aria-hidden={status ? false : true}
              isSelected={selected}
              onChange={handleSelect}
            />
          )}
          <div className={styles.imagecontainer}>
            <img className={styles.image} src={badge.imageUrl} alt="" />
          </div>
          <div className={styles.containertext}>
            <div className={styles.badgename}>{badgeName}</div>
            <div className={styles.badgestatus}>
              {GetTranslation('alm.badge.status', true)}
              {status ? (
                <span className={styles.achieved}>
                  {GetTranslation('alm.badge.status.achieved', true)}
                </span>
              ) : (
                <span className={styles.inprogress}>
                  {GetTranslation('alm.badge.status.inProgress', true)}
                </span>
              )}
            </div>
            <div className={styles.para}>{renderBadgeTypeText()}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BadgeElement;
