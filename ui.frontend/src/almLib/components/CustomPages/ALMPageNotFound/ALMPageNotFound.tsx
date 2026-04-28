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
/* eslint-disable jsx-a11y/anchor-is-valid */
import styles from './ALMPageNotFound.module.css';
import image from '../../../assets/images/almPageNotFound.png';
import { LEFT_ARROW_SVG } from '../../../utils/inline_svg';
import { GetTranslation, GetTranslationsReplaced } from '../../../utils/translationService';
import { PrimePage } from '../../../models';
import { getLocalizedData } from '../../../utils/hooks';
import { getALMConfig } from '../../../utils/global';
import { memo } from 'react';

interface ALMPageNotFoundProps {
  url?: string;
  page?: PrimePage;
  showNavigationLink?: boolean;
  handleNavigation?: (event: React.MouseEvent<HTMLAnchorElement>, page: PrimePage) => void;
}

const getPageName = (page: PrimePage): string => {
  if (!page) {
    return GetTranslation('alm.default.page.HOME', true);
  }
  if (page.isDefault) {
    return GetTranslation(`alm.default.page.${page.pageType}`, true);
  }
  return getLocalizedData(page?.localizedMetadata || [], getALMConfig().locale).name;
};

const ALMPageNotFound: React.FC<ALMPageNotFoundProps> = memo(
  ({ url = '', page = {} as PrimePage, showNavigationLink = false, handleNavigation }) => {
    const pageName = getPageName(page);

    // Handle navigation click
    const handleNavigationClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
      if (handleNavigation) {
        handleNavigation(event, page);
      }
    };

    return (
      <div className={styles.centerWrapper}>
        <div className={styles.content}>
          {/* Message Section */}
          <div className={styles.messageContainer}>
            <h1 className={styles.messageTitle}>{GetTranslation('alm.custom.page.not.found')}</h1>
            <p className={styles.messageDescription}>
              {GetTranslation('alm.custom.page.not.found.message')}
            </p>

            {/* Conditional Navigation Link */}
            {showNavigationLink && (
              <a
                className={styles.link}
                href={url || 'javascript:void(0)'}
                onClick={handleNavigationClick}
              >
                {GetTranslationsReplaced('alm.custom.page.not.found.action', { pageName })}
                <span>{LEFT_ARROW_SVG('--prime-color-link')}</span>
              </a>
            )}
          </div>

          {/* Image Section */}
          <div className={styles.imageContainer}>
            <img
              src={image}
              alt={GetTranslation('alm.custom.page.not.found')}
              className={styles.image}
              role="presentation"
            />
          </div>
        </div>
      </div>
    );
  }
);
ALMPageNotFound.displayName = 'ALMPageNotFound';
export default ALMPageNotFound;
