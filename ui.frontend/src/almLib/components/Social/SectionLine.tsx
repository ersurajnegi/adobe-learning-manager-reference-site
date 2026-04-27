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
import Send from '@spectrum-icons/workflow/Send';
import Archive from '@spectrum-icons/workflow/Archive';

import styles from './styles/SideBar.module.css';
import { LEADERBOARD, SKILLS, FAVOURITES } from '../../utils/constants';
import { useIntl } from 'react-intl';

const SectionLine = (props: any) => {
  const { formatMessage } = useIntl();
  let thumbnail;

  switch (props?.type) {
    case FAVOURITES:
      thumbnail = (
        <div className={styles.sectionImage}>
          <Archive />
        </div>
      );
      break;
    case SKILLS:
      thumbnail = (
        <div className={styles.sectionImage}>
          <Send />
        </div>
      );
      break;
  }

  if (props.type !== SKILLS && props.src) {
    thumbnail = (
      <div className={styles.sectionImageContainer}>
        {' '}
        <img className={styles.sectionImage} src={props.src} alt="Icon thummnail" />
      </div>
    );
  }
  let metaData;
  if (props.count) {
    metaData = (
      <>
        {' '}
        {props.count}
        {props.type === LEADERBOARD ? (
          <>
            {' '}
            {formatMessage({
              id: 'alm.text.points',
              defaultMessage: ' Points',
            })}
          </>
        ) : (
          <>{formatMessage({ id: 'alm.text.posts', defaultMessage: ' Posts' })}</>
        )}
      </>
    );
  }
  return (
    <>
      <div className={styles.sectionGridContainer}>
        {thumbnail}

        <div>
          <div className={styles.subTitle} tabIndex={0}>
            {props.title}
          </div>
          <div className={styles.metaData}>{metaData}</div>
        </div>
      </div>
    </>
  );
};
export default SectionLine;
