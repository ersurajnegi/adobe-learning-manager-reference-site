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
import { Item } from '@react-spectrum/tabs';
import React from 'react';
import { PrimeLearningObject, PrimeDiscussionPost } from '../../../models/PrimeModels';
import { GetTranslation } from '../../../utils/translationService';
import InfoOutline from '@spectrum-icons/workflow/InfoOutline';
import { Picker } from '@adobe/react-spectrum';
import { PrimeDiscussionItem } from '../PrimeDiscussionItem';
import styles from './PrimeDiscussionList.module.css';

const PrimeDiscussionList: React.FC<{
  training: PrimeLearningObject;
  discussionList: PrimeDiscussionPost[];
  deleteDiscussion: (loId: string, discussionPostId: string) => Promise<void | undefined>;
  getAllDiscussion: (sort: string) => Promise<void | undefined>;
}> = (props: any) => {
  const { training, discussionList, deleteDiscussion, getAllDiscussion } = props;

  const sortByNew = GetTranslation('alm.text.discussion.sortBy.new', true);
  const sortByOld = GetTranslation('alm.text.discussion.sortBy.old', true);

  const sortHandler = (event: any) => {
    event === sortByNew ? getAllDiscussion(true) : getAllDiscussion(false);
  };

  return (
    <>
      {discussionList?.length === 0 ? (
        <div className={styles.noDiscussionContainer}>
          <div data-automationid="NoDiscussionPostIcon">
            <InfoOutline />
          </div>
          <span data-automationid="NoDiscussionPostText">
            {GetTranslation('alm.text.noDiscussion', true)}
          </span>
        </div>
      ) : (
        <>
          <div className={styles.discussCommentFilter}>
            <span className={styles.filterTextContainer}>
              {GetTranslation('alm.text.dicussion.sortBy', true)}
            </span>
            <Picker
              onSelectionChange={(event: any) => {
                sortHandler(event);
              }}
              data-automationid="comment-type-filter"
              defaultSelectedKey={sortByNew}
              UNSAFE_className={styles.discussionSort}
              isQuiet
            >
              <Item data-automationid="sort-by-new-comment" key={sortByNew}>
                {sortByNew}
              </Item>
              <Item data-automationid="sort-by-old-comment" key={sortByOld}>
                {sortByOld}
              </Item>
            </Picker>
          </div>

          <div className={styles.discussionList}>
            {discussionList?.map((item: PrimeDiscussionPost) => (
              <PrimeDiscussionItem
                key={item.id}
                training={training}
                discussion={item}
                deleteDiscussion={deleteDiscussion}
              />
            ))}
          </div>
        </>
      )}
    </>
  );
};

export default PrimeDiscussionList;
