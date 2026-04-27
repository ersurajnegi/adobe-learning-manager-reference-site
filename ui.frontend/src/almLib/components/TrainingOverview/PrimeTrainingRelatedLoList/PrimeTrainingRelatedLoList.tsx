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
import { useState, useEffect, useRef } from 'react';
import { Portal } from '../../Portal';
import { PrimeAccount, PrimeLearningObject } from '../../../models/PrimeModels';
import styles from './PrimeTrainingRelatedLoList.module.css';
import { PrimeTrainingRelatedLO } from '../PrimeTrainingRelatedLO';
import { Skill } from '../../../models';
import { GetTranslation, GetTranslationsReplaced } from '../../../utils/translationService';
import { CROSS_ICON } from '../../../utils/inline_svg';
import { PrimeTrainingList } from '../../Catalog/PrimeTrainingList';
import {
  showEffectivenessIndex,
  showRating,
} from '../../Widgets/ALMPrimeStrip/ALMPrimeStrip.helper';
import { ALMLoader } from '../../Common/ALMLoader';
import { ALMPopup } from '../../ALMPopup';

const PrimeTrainingRelatedLoList: React.FC<{
  relatedLOs: PrimeLearningObject[];
  skills: Skill[];
  relatedLoText: string;
  showDescription?: string;
  totalCount?: number;
  trainingName?: string;
  account?: PrimeAccount;
  loadAllItems?: () => Promise<void>;
  updateBookMark: (isBookmarked: boolean, loId: string) => Promise<void | undefined>;
}> = props => {
  const {
    relatedLOs,
    skills,
    relatedLoText,
    showDescription,
    totalCount,
    trainingName,
    account,
    loadAllItems,
    updateBookMark,
  } = props;

  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const remainingCount = totalCount ? totalCount - 3 : 0;
  const showSeeAllButton = remainingCount > 0;
  const allItemsLoaded = relatedLOs.length >= (totalCount || 0);

  // Prevent background scroll + focus close button when modal opens
  useEffect(() => {
    if (showModal) {
      document.body.classList.add(styles.noScroll);
      closeButtonRef.current?.focus();
    } else {
      document.body.classList.remove(styles.noScroll);
    }
    return () => document.body.classList.remove(styles.noScroll);
  }, [showModal]);

  const openModal = async () => {
    setShowModal(true);
    // Load all items only if not already loaded
    if (loadAllItems && !allItemsLoaded) {
      setIsLoading(true);
      await loadAllItems();
      setIsLoading(false);
    }
  };
  const closeModal = () => setShowModal(false);

  // Only show 3 items outside of modal
  const displayedLOs = relatedLOs.slice(0, 3);

  return (
    <>
      <div className={styles.headerText} data-automationid={relatedLoText}>
        {relatedLoText}
      </div>
      <div className={styles.descriptionText}>{showDescription}</div>
      <ul className={styles.relatedLoList} role="list">
        {displayedLOs.map((relatedLO, id) => (
          <li key={relatedLO.id}>
            <PrimeTrainingRelatedLO
              relatedLO={relatedLO}
              skills={skills}
              updateBookMark={updateBookMark}
            />
            {id !== displayedLOs.length - 1 && <div className={styles.seperator}></div>}
          </li>
        ))}
      </ul>
      {showSeeAllButton && (
        <button className={styles.seeAllButton} onClick={openModal}>
          {GetTranslationsReplaced('text.seeAllMore', { count: remainingCount }, true)}
        </button>
      )}

      {/* Modal rendered via Portal to escape stacking context */}
      {showModal && (
        <Portal selector="body">
          {/* Modal Overlay */}
          <div className={styles.modalOverlay} onClick={closeModal} />

          {/* Modal using ALMPopup */}
          <ALMPopup
            id="related-lo-modal"
            direction="center"
            isOpen={showModal}
            onClose={closeModal}
            dialogClass={styles.relatedLoModal}
          >
            <div
              className={styles.modalContainer}
              role="dialog"
              aria-modal="true"
              aria-labelledby="related-lo-modal-title"
            >
              <div className={styles.modalHeader}>
                <span id="related-lo-modal-title" className={styles.modalTitle}>
                  {trainingName}
                </span>
                <button
                  ref={closeButtonRef}
                  className={styles.modalCloseButton}
                  onClick={closeModal}
                  aria-label={GetTranslation('text.close', true)}
                  role="button"
                >
                  {CROSS_ICON()}
                </button>
              </div>
              <div className={styles.modalSubHeader}>
                {GetTranslationsReplaced(
                  'text.alternateCoursesCount',
                  { count: totalCount || 0 },
                  true
                )}
              </div>
              <div className={styles.modalBody}>
                <ul className={styles.trainingListContainer}>
                  {relatedLOs.map((lo, index) => (
                    <PrimeTrainingList
                      training={lo}
                      key={lo.id}
                      account={account!}
                      showRating={showRating(lo, account!)}
                      showEffectivenessIndex={showEffectivenessIndex(lo, account!)}
                      closeModal={closeModal}
                    />
                  ))}
                </ul>
                {isLoading && (
                  <div className={styles.loaderContainer}>
                    <ALMLoader />
                  </div>
                )}
              </div>
              {/* Hidden element to trap focus back to close button */}
              <div
                tabIndex={0}
                onFocus={() => closeButtonRef.current?.focus()}
                aria-hidden="true"
              />
            </div>
          </ALMPopup>
        </Portal>
      )}
    </>
  );
};
export default PrimeTrainingRelatedLoList;
