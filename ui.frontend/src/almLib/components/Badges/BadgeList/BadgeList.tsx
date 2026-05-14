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
import styles from './BadgeList.module.css';
import { BadgeElement } from '../BadgeElement';
import { useState } from 'react';
import {
  GetTranslation,
  GetTranslationReplaced,
  GetTranslationsReplaced,
} from '../../../utils/translationService';
import { useUserContext } from '../../../contextProviders/userContextProvider';
import { RestAdapter } from '../../../utils/restAdapter';
import { getALMConfig } from '../../../utils/global';
import { BADGE_DOWNLOAD_PDF_ENDPOINT, BADGE_DOWNLOAD_IMG_ENDPOINT } from '../../../utils/constants';

const BadgeList = (props: any) => {
  const { badges, handleDownloadPdfClick, handleDownloadImgClick } = props;
  const [downloadNum, setDownloadNum] = useState(0);
  const { user } = useUserContext();
  const accountId = user.account?.id;
  const userId = user?.id;
  const HOST_URL = getALMConfig().almBaseURL;
  const isMobileWeb = getALMConfig().learnerMobileApp;

  return (
    <>
      {!isMobileWeb && (
        <div className={styles.rightaligned}>
          <div className={styles.downloadicons}>
            {!downloadNum
              ? GetTranslation('alm.text.downloadAll')
              : GetTranslation('alm.text.download')}
            <div className={styles.downloadoptions}>
              <div className={styles.downloadlink}>
                <a
                  href={`${HOST_URL}${BADGE_DOWNLOAD_PDF_ENDPOINT.replace('{accountId}', accountId).replace('{userId}', userId)}`}
                  target="_blank"
                  className={styles.alignRight}
                  tabIndex={0}
                  aria-label={
                    downloadNum
                      ? GetTranslationsReplaced('alm.badge.downloadNumPdf', { downloadNum })
                      : GetTranslation('alm.badge.downloadAllPdf', true)
                  }
                >
                  {downloadNum
                    ? GetTranslationsReplaced('alm.text.pdfNum', { num: downloadNum })
                    : GetTranslation('alm.text.pdf', true)}
                </a>
              </div>
              <div className={styles.downloadlink}>
                <span>| </span>
                <a
                  href={`${HOST_URL}${BADGE_DOWNLOAD_IMG_ENDPOINT.replace('{accountId}', accountId).replace('{userId}', userId)}`}
                  target="_blank"
                  className={styles.alignRight}
                  tabIndex={0}
                  aria-label={
                    downloadNum
                      ? GetTranslationsReplaced('alm.badge.downloadNumImg', { downloadNum })
                      : GetTranslation('alm.badge.downloadAllImg', true)
                  }
                >
                  {downloadNum
                    ? GetTranslationsReplaced('alm.text.badgeNum', { num: downloadNum })
                    : GetTranslation('alm.text.badge', true)}
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className={styles.badgelist}>
        <ul className={styles.list}>
          {badges?.map((el: any) => (
            <li key={el.id}>
              <BadgeElement
                id={el.id}
                badge={el.badge}
                dateAchieved={el.dateAchieved}
                loModel={el.model}
                num={downloadNum}
                setNum={setDownloadNum}
                handleDownloadPdfClick={handleDownloadPdfClick}
                handleDownloadImgClick={handleDownloadImgClick}
              />
            </li>
          ))}
          <li>
            <div className={styles.new}></div>
          </li>
        </ul>
      </div>
    </>
  );
};

export default BadgeList;
