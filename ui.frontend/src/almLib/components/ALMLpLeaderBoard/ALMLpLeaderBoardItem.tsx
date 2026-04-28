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
import { GetTranslation, GetTranslationReplaced } from '../../utils/translationService';
import styles from './ALMLpLeaderBoard.module.css';
import { DEFAULT_USER_AVATAR_SVG } from '../../utils/inline_svg';
const ALMLeaderBoardItem: React.FC<{
  learnerName: string;
  learnerPoints: number;
  learnerRank: number;
  learnerImageUrl: string;
  previousLearnerRank?: number | null;
  isCurrentUser?: boolean;
}> = props => {
  const {
    learnerName,
    learnerPoints,
    learnerRank,
    learnerImageUrl,
    previousLearnerRank,
    isCurrentUser,
  } = props;
  const isExistingRank = learnerRank !== previousLearnerRank;
  const avatarClass = isCurrentUser
    ? `${styles.avatarIcon} ${styles.highlightForCurrentUser}`
    : styles.avatarIcon;
  const learnerAvatar = (learnerImageUrl: string) => {
    return (
      (learnerImageUrl && (
        <img
          className={avatarClass}
          src={learnerImageUrl}
          alt={GetTranslationReplaced('alm.lp.leaderboard.avatar', learnerName)}
        />
      )) || <div className={avatarClass}>{DEFAULT_USER_AVATAR_SVG()}</div>
    );
  };
  return (
    <div
      className={styles.leaderBoardUser}
      data-automationid={`leaderBoardDetailsOf-${learnerName}`}
    >
      {isExistingRank && (
        <div className={styles.leaderBoardUserRank} data-automationid={`Rank of ${learnerName}`}>
          {learnerRank}.
        </div>
      )}
      <div className={isExistingRank ? styles.leaderBoardItem : styles.leaderBoardExistingItem}>
        {learnerAvatar(learnerImageUrl)}

        <div>
          <div className={styles.leaderBoardUserDetails}>{learnerName}</div>
          <div
            className={styles.leaderBoardUserDetails}
            data-automationid={`Points-earned-by-${learnerName}`}
          >
            {learnerPoints} {GetTranslation('alm.text.points')}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ALMLeaderBoardItem;
