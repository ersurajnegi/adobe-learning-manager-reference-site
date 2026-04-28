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
import styles from './styles/SideBar.module.css';
import SectionLine from './SectionLine';
import { useIntl } from 'react-intl';
import { GetTranslation } from '../../utils/translationService';
const SKILLS = 'skills';
const FOLLOW = 'follow';
const LEADERBOARD = 'leaderboard';

const RightSideBar = (props: any) => {
  const { formatMessage } = useIntl();

  const src = 'https://wallpapers.com/images/hd/tiger-predator-eyes-portrait-29kla8c3maawuxb8.webp'; // default img

  function Section(props: any) {
    return (
      <div className={styles.section}>
        <div className={styles.title}>
          {props.title}
          <hr />
        </div>

        {props.data?.map((entry: any, i: number) => {
          return (
            <div key={i}>
              <SectionLine title={entry.name} type={props.type} src={props.src} />
            </div>
          );
        })}
      </div>
    );
  }
  return (
    <>
      <div className={styles.rightSideBar}>
        <div>
          <h1>{props.skills}</h1>

          {props.skillsData ? (
            <Section
              type={SKILLS}
              title={GetTranslation('alm.text.mySkills', true)}
              src={src}
              data={props.skillsData}
            />
          ) : (
            <></>
          )}
          {props.followData ? (
            <Section
              type={FOLLOW}
              title={formatMessage({
                id: 'alm.text.peopleIfollow',
                defaultMessage: 'People I follow',
              })}
              src={src}
            />
          ) : (
            <></>
          )}
          {props.leaderBoard ? (
            <Section
              type={LEADERBOARD}
              title={GetTranslation('alm.text.leaderboard', true)}
              src={src}
            />
          ) : (
            <></>
          )}
        </div>
      </div>
    </>
  );
};
export default RightSideBar;
