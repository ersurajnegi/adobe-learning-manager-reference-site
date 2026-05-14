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
import { Divider, Heading, Item, ListBox, Provider, lightTheme } from '@adobe/react-spectrum';
import styles from './PrimeAuthorPage.module.css';
import layoutStyles from '../Catalog/PrimeCatalogContainer/PrimeCatalogContainer.module.css';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  TILE_VIEW,
  LIST_VIEW,
  AUTHOR_ID_STR,
  IS_LEGACY_AUTHOR,
  AUTHOR_NAME,
  INTERNAL_STR,
  EXTERNAL_STR,
} from '../../utils/constants';
import { DEFAULT_USER_SVG } from '../../utils/inline_svg';
import { PrimeTrainingList } from '../Catalog/PrimeTrainingList';
import { useIntl } from 'react-intl';
import { useLoadMore } from '../../hooks';
import { BACK_BUTTON_ICON } from '../../utils/inline_svg';
import { useAuthor } from '../../hooks/author';
import {
  containsSubstr,
  customEncode,
  getALMConfig,
  getALMObject,
  getPathParams,
  getQueryParamsFromUrl,
  navigateToLo,
  setTrainingsLayout,
} from '../../utils/global';
import { PrimeTrainingCardV2 } from '../Catalog/PrimeTrainingCardV2';
import { GetTranslation } from '../../utils/translationService';
import { PrimeAccount, PrimeLearningObject } from '../../models';
import { ALMCustomPicker } from '../Common/ALMCustomPicker';
import { ALMLoader } from '../Common/ALMLoader';
import {
  canShowPrice,
  launchPlayerHandler,
} from '../Catalog/PrimeTrainingCardV2/PrimeTrainingCardV2.helper';
import { showEffectivenessIndex, showRating } from '../Widgets/ALMPrimeStrip/ALMPrimeStrip.helper';
import ViewList from '@spectrum-icons/workflow/ViewList';
import ClassicGridView from '@spectrum-icons/workflow/ClassicGridView';
import SortOrderDown from '@spectrum-icons/workflow/SortOrderDown';
import { PrimeFeedbackWrapper } from '../ALMFeedback';
import { useFeedback } from '../../hooks/feedback';
import { ALMGoToTop } from '../ALMGoToTop';
import { useUserContext } from '../../contextProviders/userContextProvider';
import { getInitialView } from '../../utils/catalog';
import { useDeviceTypeContext } from '../../contextProviders/DeviceContextProvider';
import { useDialog } from '../../contextProviders/ALMDialogContextProvider';
import { ALMDialog, ALMDialogHeader } from '../ALMDialog';

const PrimeAuthorPage = (props: any) => {
  const config = getALMConfig();
  const authorPath = config.authorPath;

  // Use props if available, else fallback to params
  let { authorId, authorName, isLegacyAuthor } = props;

  if (!(authorId && authorName && isLegacyAuthor)) {
    const pathParams = getPathParams(authorPath, [AUTHOR_ID_STR]);
    const queryParam = getQueryParamsFromUrl();
    if (!authorId) {
      authorId = containsSubstr(pathParams[AUTHOR_ID_STR], '?')
        ? pathParams[AUTHOR_ID_STR].split('?')[0]
        : pathParams[AUTHOR_ID_STR];
    }
    if (!authorName) {
      authorName = queryParam[AUTHOR_NAME];
    }
    if (typeof isLegacyAuthor === 'undefined') {
      isLegacyAuthor = queryParam[IS_LEGACY_AUTHOR];
    }
  }
  const authorType = isLegacyAuthor ? EXTERNAL_STR : INTERNAL_STR;
  const {
    trainings,
    totalTrainings,
    hasMoreItems,
    loadMoreTraining,
    enrollmentHandler,
    updateLearningObject,
    fetchTrainings,
    authorDetails,
    isLoading,
    addBookmarkHandler,
    removeBookmarkHandler,
  } = useAuthor(authorId, authorType);
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
  const elementRef = useRef(null);
  useLoadMore({
    items: trainings,
    callback: loadMoreTraining,
    elementRef,
  });
  const { user } = useUserContext() || {};
  const account = user?.account as PrimeAccount;
  const { formatMessage } = useIntl();
  const isAuthorExternal = authorType === EXTERNAL_STR;
  const isListView = () => {
    return view === LIST_VIEW;
  };
  const handleLoEnrollment = async (loId: string, loInstanceId: string) => {
    return enrollmentHandler && (await enrollmentHandler(loId, loInstanceId));
  };
  const [view, setView] = useState(getInitialView(account?.viewType || LIST_VIEW));

  const navigateToLOPage = (training: PrimeLearningObject) => {
    navigateToLo(training);
  };
  const sortByDropdown = [
    { id: '-date', name: GetTranslation('alm.picker.sort.recentlyPublished') },
    { id: 'name', name: GetTranslation('alm.picker.sort.nameAZ') },
    { id: '-name', name: GetTranslation('alm.picker.sort.nameZA') },
  ];
  const [selectedOptionId, setSelectedOptionId] = useState(sortByDropdown[0].id);
  const deviceContext = useDeviceTypeContext();
  const { isOpen, openDialog, closeDialog } = useDialog();

  const handleOptionSelected = (selectedOption: string) => {
    setSelectedOptionId(selectedOption);
    fetchTrainings(selectedOption);
  };
  const gridButtonTitle = useMemo(() => GetTranslation('alm.grid.view.aria', true), []);
  const listButtonTitle = useMemo(() => GetTranslation('alm.list.view.aria', true), []);

  const listHtml = trainings?.length ? (
    <ul className={isListView() ? styles.primeTrainingsList : styles.primeTrainingsCards}>
      {trainings?.map((training: PrimeLearningObject, index: number) =>
        isListView() ? (
          <PrimeTrainingList
            training={training}
            key={`${training.id}-${view}`}
            account={account}
          ></PrimeTrainingList>
        ) : (
          <li key={training.id}>
            <div className={styles.loCard}>
              <PrimeTrainingCardV2
                training={training}
                key={`${training.id}-${view}`}
                account={account}
                user={authorDetails}
                showProgressBar={!!training?.enrollment}
                showSkills={true}
                showPrice={canShowPrice(training, account)}
                showRating={showRating(training, account!)}
                showEffectivenessIndex={showEffectivenessIndex(training, account)}
                showActionButton={true}
                showRecommendedReason={true}
                handleLoEnrollment={handleLoEnrollment}
                updateLearningObject={updateLearningObject}
                handlePlayerLaunch={launchPlayerHandler}
                handleLoNameClick={() => navigateToLOPage(training)}
                handleL1FeedbackLaunch={handleL1FeedbackLaunch}
                handleAddBookmark={addBookmarkHandler}
                handleRemoveBookmark={removeBookmarkHandler}
                isAuthorPage={true}
              ></PrimeTrainingCardV2>
            </div>
          </li>
        )
      )}
    </ul>
  ) : (
    !isLoading && (
      <p className={styles.noResults}>{formatMessage({ id: 'alm.catalog.no.result' })}</p>
    )
  );
  const getAuthorImage = () => {
    if (isAuthorExternal) {
      return (
        <span className={styles.avatar} data-automationid="default-avatar">
          {DEFAULT_USER_SVG()}
        </span>
      );
    }
    return (
      <img
        className={styles.avatar}
        src={authorDetails.avatarUrl}
        alt={GetTranslation('author.avatar.text')}
      />
    );
  };
  const getAuthorName = useCallback(() => {
    if (isAuthorExternal) {
      return authorName;
    }
    return authorDetails.name;
  }, [authorDetails, authorType]);
  return (
    <Provider theme={lightTheme} colorScheme="light">
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
      <div className={styles.pageContainer}>
        <div className={styles.authorBox}>
          <div className={styles.back} data-automationid="back-button">
            <button
              className={styles.btn}
              onClick={() => window.history.back()}
              data-automationid="Back-Button"
            >
              <div
                className={styles.backIcon}
                aria-label={GetTranslation('cpw.back.button.aria.label')}
              >
                {BACK_BUTTON_ICON()}
              </div>
              {formatMessage({ id: 'alm.author.back.label' })}
            </button>
          </div>
          <div className={styles.authorDetails} data-automationid="author-details">
            {getAuthorImage()}
          </div>
          <div className={styles.about} data-automationid="trainings-note">
            <span className={styles.allLearningsHeader}>
              {GetTranslation('alm.author.trainings.note', true)}
            </span>
            <span
              className={styles.authorName}
              data-automationid={getAuthorName()}
              aria-label={`${formatMessage({
                id: 'alm.label.authorName',
                defaultMessage: 'Author name',
              })} ${getAuthorName()}`}
              tabIndex={0}
              data-skip="skip-target"
            >
              {getAuthorName()}
            </span>
          </div>
          <div className={styles.authorDescription} data-automationId="author-description">
            {authorDetails.bio}
          </div>
        </div>
        <div className={styles.authorLoContainer}>
          <div className={styles.actionsContainer}>
            <div
              className={styles.totalTrainingsDetails}
              data-automationid="total-trainings-by-author"
            >
              {deviceContext.isDesktop
                ? isLoading
                  ? ''
                  : formatMessage({ id: 'alm.author.trainings' }, { x: totalTrainings })
                : ''}
            </div>
            <div className={styles.right}>
              {deviceContext.isDesktop ? (
                <>
                  <div className={styles.sortText}>
                    {formatMessage({ id: 'alm.picker.sortBy' })}
                  </div>
                  <div className={styles.picker}>
                    <ALMCustomPicker
                      options={sortByDropdown}
                      onOptionSelected={handleOptionSelected}
                      defaultSelectedOptionId={selectedOptionId}
                    />
                  </div>
                </>
              ) : null}

              <div className={styles.toggle}>
                <button
                  className={`${styles.viewButton} ${
                    view === TILE_VIEW ? styles.selectedView : ''
                  }`}
                  onClick={() => setTrainingsLayout(TILE_VIEW, setView)}
                  title={gridButtonTitle}
                  aria-label={gridButtonTitle}
                  data-automationid="trainingsTileView"
                  aria-pressed={view === TILE_VIEW}
                >
                  <ClassicGridView />
                </button>

                <button
                  className={`${styles.viewButton} ${
                    view === LIST_VIEW ? styles.selectedView : ''
                  }`}
                  onClick={() => setTrainingsLayout(LIST_VIEW, setView)}
                  title={listButtonTitle}
                  aria-label={listButtonTitle}
                  data-automationid="trainingsListView"
                  aria-pressed={view === LIST_VIEW}
                >
                  <ViewList />
                </button>
              </div>

              {!deviceContext.isDesktop && (
                <div className={styles.mobileCount} aria-live="polite">
                  {isLoading
                    ? ''
                    : formatMessage({ id: 'alm.author.trainings' }, { x: totalTrainings })}
                </div>
              )}

              {!deviceContext.isDesktop && (
                <button
                  className={layoutStyles.filterAndSortButton}
                  onClick={() => openDialog('alm-sort-dialog')}
                  aria-label={GetTranslation('alm.picker.sortBy')}
                  aria-controls="alm-sort-dialog"
                  aria-expanded={isOpen('alm-sort-dialog')}
                >
                  <SortOrderDown />
                </button>
              )}
            </div>
          </div>
          {(deviceContext.isMobile || deviceContext.isTablet) && <Divider size="M" />}
          {isOpen('alm-sort-dialog') && (
            <ALMDialog
              id="alm-sort-dialog"
              height={30}
              stickyPosition={true}
              overlayClose={true}
              borderRadius={deviceContext.isMobile ? 'top' : 'all'}
            >
              <ALMDialogHeader>
                <Heading level={3} UNSAFE_className={layoutStyles.almDialogTitle}>
                  {GetTranslation('alm.community.board.sortBy')}
                </Heading>
              </ALMDialogHeader>
              <ListBox
                selectionMode="single"
                items={sortByDropdown}
                selectedKeys={new Set([selectedOptionId])}
                onSelectionChange={selected => {
                  const selectedSort = Array.from(selected);
                  if (selectedSort.length === 0) {
                    closeDialog('alm-sort-dialog');
                    return;
                  }
                  handleOptionSelected(selectedSort[0].toString());
                  closeDialog('alm-sort-dialog');
                }}
              >
                {(item: any) => <Item key={item.id}>{item.name}</Item>}
              </ListBox>
            </ALMDialog>
          )}

          <div className={styles.top}>
            <div
              className={layoutStyles.filtersAndListConatiner}
              data-automationid="authorListContainer"
            >
              <div className={`${layoutStyles.listContainer} ${layoutStyles.full}`}>
                {listHtml}
                <div
                  ref={elementRef}
                  id="load-more-trainings"
                  data-automationid="loadMoreTrainingsLoader"
                >
                  {isLoading || hasMoreItems ? <ALMLoader classes={styles.loader} /> : ''}
                </div>
              </div>
            </div>
          </div>
        </div>
        <ALMGoToTop />
      </div>
    </Provider>
  );
};

export default PrimeAuthorPage;
