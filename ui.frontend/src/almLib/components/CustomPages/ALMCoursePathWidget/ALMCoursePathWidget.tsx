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
import { useCallback, useEffect, useState, useRef } from 'react';
import { CARD_WIDTH, CARD_WIDTH_EXCLUDING_PADDING } from '../../../utils/widgets/common';
import { PrimeAccount, PrimeLearningObject } from '../../../models';
import styles from './ALMCoursePathWidget.module.css';
import PrimeTrainingCardV2 from '../../Catalog/PrimeTrainingCardV2/PrimeTrainingCardV2';
import {
  showAuthorInfo,
  showEffectivenessIndex,
  showPRLInfo,
  showProgressBar,
  showRating,
  showSkills,
  showRecommendedReason,
} from '../../Widgets/ALMPrimeStrip/ALMPrimeStrip.helper';
import { JOBAID } from '../../../utils/constants';
import {
  handleLinkCLick,
  canShowPrice,
  launchPlayerHandler,
  openJobAid,
} from '../../Catalog/PrimeTrainingCardV2/PrimeTrainingCardV2.helper';
import { PrimeFeedbackWrapper } from '../../ALMFeedback';
import { useFeedback } from '../../../hooks/feedback';
import { useCoursePathWidget } from '../../../hooks/customPages/useALMCoursePathWidget';
import { useStripScroll } from '../../../hooks/customPages/useStripScroll';
import { useWidgetInspectMode } from '../../../hooks/customPages/useALMInspectMode';
import ALMStripWidgetHeader from '../ALMStripWidgetHeader/ALMStripWidgetHeader';
import { GetTranslation } from '../../../utils/translationService';
import { useUserContext } from '../../../contextProviders/userContextProvider';
import ALMNoAccessContainer from '../ALMNoAccessContainer/ALMNoAccessContainer';
import ALMWidgetInspectMode from '../ALMWidgetInspectMode/ALMWidgetInspectMode';
import { ALMWidgetLoader } from '../ALMWidgetLoader';
import { isPrimeLearningObject } from '../../../utils/widgets/utils';

const ALMCoursePathWidget: React.FC<{
  widget: any;
  disableLinks?: boolean;
  isInspectMode?: boolean;
  onMetaReceived?: (meta: any) => void;
}> = ({ widget, disableLinks = false, isInspectMode = false, onMetaReceived }) => {
  const { user } = useUserContext() || {};
  const account = user.account as PrimeAccount;
  const widgetsectionRef = useRef<HTMLElement>(null);
  const { isHovered, widgetContainerWidth, widgetContainerHeight, changeHoverState } =
    useWidgetInspectMode({
      sectionRef: widgetsectionRef,
    });

  const {
    fetchingData,
    items,
    fetchMore,
    searchString,
    meta,
    addBookmarkHandler,
    removeBookmarkHandler,
    enrollmentHandler,
    updateLearningObject,
    hideList,
  } = useCoursePathWidget(widget);

  const {
    feedbackTrainingId,
    trainingInstanceId,
    playerLaunchTimeStamp,
    shouldLaunchFeedback,
    handleL1FeedbackLaunch,
    fetchCurrentLo,
    getFilteredNotificationForFeedback,
    submitL1Feedback,
    closeFeedbackWrapper,
  } = useFeedback();

  useEffect(() => {
    if (onMetaReceived && meta) {
      onMetaReceived(meta);
    }
  }, [meta, onMetaReceived]);

  const heading = GetTranslation(`${widget.id}.title`) || widget.attributes?.title;
  const widgetDescription =
    GetTranslation(`${widget.id}.description`) || widget.attributes?.description;
  const cardContainerId = `cb-cardHolder-${heading}`;
  const hasWidgetItems = items?.length > 0;

  const {
    rollContainer,
    onScroll,
    rollAPage,
    isLeftNavIconDisabled,
    isRightNavIconDisabled,
    updateItemsPerPage,
    itemsPerPage,
  } = useStripScroll({
    cardWidth: CARD_WIDTH,
    items,
    fetchingData,
    fetchMore,
    searchString,
  });

  useEffect(() => {
    if (items.length < itemsPerPage * 2) {
      fetchMore();
    }
  }, [items]);

  const showNavIcons = items?.length > itemsPerPage;

  const handleAddBookmark = async (loId: string) => {
    return addBookmarkHandler && (await addBookmarkHandler(loId));
  };
  const handleRemoveBookmark = async (loId: string) => {
    return removeBookmarkHandler && (await removeBookmarkHandler(loId));
  };

  const handleLoEnrollment = async (loId: string, loInstanceId: string) => {
    return enrollmentHandler && (await enrollmentHandler(loId, loInstanceId));
  };

  const handleLoNameClick = (training: PrimeLearningObject, resourceLocation?: string) => {
    if (training.loType === JOBAID) {
      openJobAid(training, resourceLocation);
      return;
    }
    handleLinkCLick(training, widget);
  };
  const handleActionClick = (training: PrimeLearningObject) => {
    handleLinkCLick(training, widget);
  };

  const categoryWidgetWidth = rollContainer.current?.clientWidth;

  const rowTemplate = useCallback((items: any) => {
    return (
      <div className={styles.stripCardContainerRow}>
        <ul className={styles.cardRow}>
          {items.map((element: any, idx: number) => {
            const item = isPrimeLearningObject(element.learningObject)
              ? (element.learningObject as PrimeLearningObject)
              : element;
            return (
              <li key={`${item.id}_${widget.widgetRef}`} data-index={idx}>
                <div className={`${styles.loCard} ${styles.catalogCard}`}>
                  {getItemTemplate(item, element)}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }, []);

  const getItemTemplate = (item: any, element: any) => {
    return (
      <PrimeTrainingCardV2
        widget={widget}
        training={item}
        showProgressBar={showProgressBar(item)}
        showDontRecommend={false}
        showSkills={showSkills(widget)}
        showPRLInfo={showPRLInfo(widget)}
        showRating={showRating(item, account)}
        showEffectivenessIndex={showEffectivenessIndex(item, account)}
        showAuthorInfo={showAuthorInfo(item)}
        showPrice={canShowPrice(item, account)}
        account={account}
        user={user}
        handleAddBookmark={handleAddBookmark}
        handleRemoveBookmark={handleRemoveBookmark}
        handleLoEnrollment={handleLoEnrollment}
        updateLearningObject={updateLearningObject}
        handleLoNameClick={handleLoNameClick}
        handleActionClick={handleActionClick}
        handlePlayerLaunch={launchPlayerHandler}
        handleL1FeedbackLaunch={handleL1FeedbackLaunch}
        disableLinks={disableLinks}
        showRecommendedReason={showRecommendedReason(widget, item)}
        recoReason={element?.reason}
        recoReasonModel={element?.reasonModel}
      ></PrimeTrainingCardV2>
    );
  };

  useEffect(() => {
    const noCardsWithGap = categoryWidgetWidth ? Math.floor(categoryWidgetWidth / CARD_WIDTH) : 0;
    const cardWithoutGap = categoryWidgetWidth
      ? Math.floor(
          (categoryWidgetWidth - noCardsWithGap * CARD_WIDTH) / CARD_WIDTH_EXCLUDING_PADDING
        )
      : 0;
    updateItemsPerPage({ itemsPerPage: categoryWidgetWidth ? noCardsWithGap + cardWithoutGap : 0 });
  }, [categoryWidgetWidth]);

  const renderContent = () => {
    if (hasWidgetItems) {
      return rowTemplate(items);
    }
    if (fetchingData) {
      return (
        <div className={styles.loadingContainerSection}>
          <ALMWidgetLoader />
        </div>
      );
    }
    return <ALMNoAccessContainer />;
  };

  return (
    <>
      {shouldLaunchFeedback && (
        <PrimeFeedbackWrapper
          trainingId={feedbackTrainingId}
          trainingInstanceId={trainingInstanceId}
          playerLaunchTimeStamp={playerLaunchTimeStamp}
          fetchCurrentLo={fetchCurrentLo}
          getFilteredNotificationForFeedback={getFilteredNotificationForFeedback}
          submitL1Feedback={submitL1Feedback}
          closeFeedbackWrapper={closeFeedbackWrapper}
        />
      )}
      <section
        ref={widgetsectionRef}
        role="region"
        id={widget.id}
        className={styles.container}
        onMouseEnter={changeHoverState}
        onMouseLeave={changeHoverState}
        style={{
          display: hideList ? 'none' : '',
        }}
      >
        {isInspectMode && isHovered && (
          <ALMWidgetInspectMode
            widget={widget}
            widgetWidth={widgetContainerWidth}
            widgetHeight={widgetContainerHeight}
          />
        )}
        <ALMStripWidgetHeader
          heading={heading}
          widgetId={widget.id}
          widgetDescription={widgetDescription}
          isLeftNavIconDisabled={isLeftNavIconDisabled()}
          isRightNavIconDisabled={isRightNavIconDisabled()}
          rollAPage={rollAPage}
          showNavIcons={showNavIcons}
        />
        <div
          id={cardContainerId}
          data-automationid={cardContainerId}
          className={styles.stripCardContainer}
          tabIndex={-1}
          ref={rollContainer}
          onScroll={onScroll}
        >
          {renderContent()}
        </div>
      </section>
    </>
  );
};

export default ALMCoursePathWidget;
