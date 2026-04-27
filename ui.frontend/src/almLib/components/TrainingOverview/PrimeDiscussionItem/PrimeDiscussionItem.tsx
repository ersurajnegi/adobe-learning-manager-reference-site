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
import React from 'react';
import { useState } from 'react';
import { PrimeDiscussionPost, PrimeLearningObject } from '../../../models/PrimeModels';
import {
  ENGLISH_LOCALE,
  DEFAULT_USER_AVATAR,
  USER_ADMIN,
  IMG_PROFILE,
  UNKNOWN,
} from '../../../utils/constants';
import { useUserContext } from '../../../contextProviders/userContextProvider';
import DeleteOutline from '@spectrum-icons/workflow/DeleteOutline';
import styles from './PrimeDiscussionItem.module.css';
import { modifyTimeFor24hourCycle } from '../../../utils/dateTime';
import { ALMImage } from '../../Common/ALMImage';
import { useIntl } from 'react-intl';

const PrimeDiscussionItem: React.FC<{
  training: PrimeLearningObject;
  discussion: PrimeDiscussionPost;
  deleteDiscussion: (loId: string, discussionPostId: string) => Promise<void | undefined>;
}> = (props: any) => {
  const { training, discussion, deleteDiscussion } = props;
  const { formatMessage } = useIntl();

  const { user } = useUserContext() || {};
  const interfaceLocale = user?.uiLocale || ENGLISH_LOCALE;
  const contentLocale = user?.contentLocale || ENGLISH_LOCALE;
  const isUserAdmin = user?.roles?.includes(USER_ADMIN);

  const [isDeleting, setisDeleting] = useState(false);
  const learner = discussion.learner || {
    name: formatMessage({
      id: 'alm.text.unknown',
    }),
    id: UNKNOWN,
  };

  const deleteHandler = async (discussionId: string) => {
    if (isDeleting) {
      return;
    }
    setisDeleting(true);
    try {
      await deleteDiscussion(training.id, discussionId);
    } catch (error) {
      console.error('Error deleting discussion', error);
    } finally {
      setisDeleting(false);
    }
  };

  return (
    <>
      <div className={styles.discussCommentContainer}>
        <div className={styles.discussCommentHeader}>
          <span className={styles.discussProfileImage}>
            <ALMImage
              data-automationid={'discussions-comment-user-avatar-' + learner.id}
              src={learner.avatarUrl || DEFAULT_USER_AVATAR}
              altText={IMG_PROFILE}
            />
          </span>
          <span
            data-automationid={'discussions-comment-author-name-' + learner.name}
            className={styles.discussLearnerName}
          >
            {learner.name}
          </span>
          <span className={styles.deleteDiscussContainer}>
            {(learner.id === user.id || isUserAdmin) && (
              <button
                data-automationid={'discussions-comment-delete-comment-' + discussion.id}
                onClick={() => deleteHandler(discussion.id)}
                className={styles.removeItem}
                disabled={isDeleting}
                aria-label={formatMessage({
                  id: 'alm.text.deleteComment',
                })}
              >
                <DeleteOutline></DeleteOutline>
              </button>
            )}
          </span>
        </div>
        <div className={styles.discussionsCommentBody}>
          <span data-automationid={'discussions-comment-' + discussion.comment}>
            {discussion.comment}
          </span>
        </div>
        <div className={styles.discussionsCommentTime}>
          <span data-automationid={'discussions-comment-time-' + discussion.dateCreated}>
            {modifyTimeFor24hourCycle(discussion.dateCreated, interfaceLocale)}
          </span>
        </div>
      </div>
    </>
  );
};

export default PrimeDiscussionItem;
