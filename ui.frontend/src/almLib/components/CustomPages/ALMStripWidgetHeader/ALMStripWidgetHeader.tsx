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
import { GetTranslation } from '../../../utils/translationService';
import { LEFT_ARROW_SVG } from '../../../utils/inline_svg';
import styles from './ALMStripWidgetHeader.module.css';

interface StripHeaderProps {
  heading: string;
  widgetId: string;
  widgetDescription?: string;
  isLeftNavIconDisabled: boolean;
  isRightNavIconDisabled: boolean;
  rollAPage: (right: boolean) => void;
  showNavIcons: boolean;
}

const StripHeader: React.FC<StripHeaderProps> = StripHeaderProps => {
  const {
    heading,
    widgetId,
    widgetDescription,
    isLeftNavIconDisabled,
    isRightNavIconDisabled,
    rollAPage,
    showNavIcons,
  } = StripHeaderProps;

  const leftArrowId = `cb-leftNav-${heading}`;
  const rightArrowId = `cb-rightNav-${heading}`;
  const widgetDescriptionId = `cb-description-${heading}`;
  const widgetTitleId = `cb-title-${heading}`;

  const getNavIcons = () => {
    return (
      <div className={styles.stripHeaderNavIcons}>
        <button
          id={leftArrowId}
          data-automationid={leftArrowId}
          disabled={isLeftNavIconDisabled}
          aria-label={`${heading}, ${GetTranslation('text.leftNavigation')}`}
          aria-disabled={isLeftNavIconDisabled}
          onClick={() => rollAPage(false)}
          className={`${styles.navIcon} ${styles.left}`}
        >
          {LEFT_ARROW_SVG()}
        </button>
        <button
          id={rightArrowId}
          data-automationid={rightArrowId}
          disabled={isRightNavIconDisabled}
          aria-label={`${heading}, ${GetTranslation('text.rightNavigation')}`}
          aria-disabled={isRightNavIconDisabled}
          onClick={() => rollAPage(true)}
          className={`${styles.navIcon}`}
        >
          {LEFT_ARROW_SVG()}
        </button>
      </div>
    );
  };

  if (!heading) return null;

  return (
    <div className={styles.stripHeaderContainer}>
      <div className={styles.stripHeader}>
        <div className={styles.stripHeaderLeft}>
          <h2
            className={styles.stripContainerName}
            data-automationid={widgetTitleId}
            title={heading}
            dangerouslySetInnerHTML={{ __html: heading }}
            data-skip-link-target={widgetId}
            aria-label={heading}
            tabIndex={-1}
          />
        </div>
        {widgetDescription && (
          <div
            className={styles.stripDescription}
            title={widgetDescription}
            data-automationid={widgetDescriptionId}
            aria-label={widgetDescription}
          >
            {widgetDescription}
          </div>
        )}
      </div>
      {showNavIcons ? <div className={styles.stripHeaderRight}>{getNavIcons()}</div> : null}
    </div>
  );
};

export default StripHeader;
