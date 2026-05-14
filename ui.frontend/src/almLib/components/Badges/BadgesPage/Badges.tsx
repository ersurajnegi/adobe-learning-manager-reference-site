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

import { useRef } from 'react';
import styles from './Badges.module.css';
import { useBadges } from '../../../hooks/badges';
import { useLoadMore } from '../../../hooks/loadMore';
import { ALMLoader } from '../../Common/ALMLoader';
import { BadgeList } from '../BadgeList';
import { GetTranslation } from '../../../utils/translationService';
import { Provider, lightTheme } from '@adobe/react-spectrum';
import { EMPTY_STATE_CARD } from '../../../utils/inline_svg';
import { BADGES_EXL_URL } from '../../../utils/constants';

const Badges = (props: any) => {
  const { badges, loadMoreBadge, isLoading, handleDownloadPdfClick, handleDownloadImgClick } =
    useBadges();
  const elementRef = useRef(null);
  useLoadMore({
    items: badges,
    callback: loadMoreBadge,
    containerId: 'badges',
    elementRef,
  });

  return (
    <Provider theme={lightTheme} colorScheme="light">
      <div className={styles.dashboardcontainer} id="badges">
        <div className={styles.pagecontainer}>
          <div className={styles.headingContainer}>
            <h1 className={styles.heading}>{GetTranslation('alm.text.badges.header', true)}</h1>
            <div className={styles.text}>{GetTranslation('alm.text.badges.summary', true)}</div>
          </div>

          <div className={styles.badgebody}>
            <div className={styles.badgecontainer}>
              {isLoading ? (
                <ALMLoader classes={styles.loader} />
              ) : badges && badges.length > 0 ? (
                <>
                  <BadgeList
                    badges={badges}
                    handleDownloadPdfClick={handleDownloadPdfClick}
                    handleDownloadImgClick={handleDownloadImgClick}
                  />
                </>
              ) : (
                <div className={styles.emptyState}>
                  <div className={styles.emptyStateIcon}>{EMPTY_STATE_CARD()}</div>
                  <div className={styles.emptyStateText}>
                    {GetTranslation('alm.badges.empty.header', true)}
                  </div>
                  <div className={styles.emptyStateLink}>
                    <a
                      href={BADGES_EXL_URL}
                      className={styles.link}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {GetTranslation('alm.badges.empty.link', true)}
                    </a>
                  </div>
                </div>
              )}
              <div ref={elementRef}></div>
            </div>
          </div>
        </div>
      </div>
    </Provider>
  );
};

export default Badges;
