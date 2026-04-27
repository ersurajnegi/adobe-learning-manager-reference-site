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

import styles from './ALMSocialLearning.module.css';
import { DEFAULT_USER_AVATAR_SVG, SOCIAL_EMPTY_STATE_SVG } from '../../../utils/inline_svg';
import { CARD_HEIGHT } from '../../../utils/widgets/common';
import {
  GetTranslation,
  GetTranslationReplaced,
  GetTranslationsReplaced,
} from '../../../utils/translationService';
import {
  extractTextFromReactNode,
  GetFormattedDate,
  getIsCustomPage,
} from '../../../utils/widgets/utils';

import { useSocialLearning } from '../../../hooks/widgets/socialLearning/useSocialLearning';
import { useIntl } from 'react-intl';
import { getALMConfig, getALMObject, getWidgetConfig } from '../../../utils/global';
import { DEFAULT_USER_AVATAR, DELETED } from '../../../utils/constants';
import { useEffect, useState, ReactNode } from 'react';
import { ALMImage } from '../../Common/ALMImage';
import ALMStripWidgetHeader from '../../CustomPages/ALMStripWidgetHeader/ALMStripWidgetHeader';
import { useWidgetLayout } from '../../../hooks/widgets/useWidgetLayout';
import { useUserContext } from '../../../contextProviders/userContextProvider';
import { PrimeAccount, PrimeUser } from '../../../models/PrimeModels';
import ALMNoAccessContainer from '../../CustomPages/ALMNoAccessContainer/ALMNoAccessContainer';
import ALMWidgetLoader from '../../CustomPages/ALMWidgetLoader/ALMWidgetLoader';
import ALMWidgetInspectMode from '../../CustomPages/ALMWidgetInspectMode/ALMWidgetInspectMode';
import { useWidgetInspectMode } from '../../../hooks/customPages/useALMInspectMode';
import {
  GetUserProfilePageLink,
  SendLinkEvent,
} from '../../../utils/widgets/base/EventHandlingBase';

const secondsInSevenDays = 604800;
const HEADER_WIDTH_WITHOUT_EXPLORE_BTN = 230;

const ALMSocialLearning = (props: any) => {
  const { user } = useUserContext() || {};
  const account = user?.account as PrimeAccount;
  const isCustomPage = getIsCustomPage();

  if (!account?.enableSocialLearning) {
    return isCustomPage ? <ALMNoAccessContainer /> : null;
  }

  const { widget, disableLinks = false, isInspectMode = false } = props;
  const { posts, showExploreBox, emptyView, fetchingData } = useSocialLearning();
  const { containerWidth, widgetId, sectionRef } = useWidgetLayout({ widget });

  useEffect(() => {
    widget.attributes!.heading = GetTranslation('text.skipToSocial', true);
  }, []);

  const { locale } = useIntl();
  const hideExploreButton = emptyView || showExploreBox;

  const getHeaderWidth = () => {
    if (isCustomPage) {
      return containerWidth;
    }
    return hideExploreButton ? containerWidth : HEADER_WIDTH_WITHOUT_EXPLORE_BTN;
  };

  const dimensions = {
    header: getHeaderWidth(),
    section: containerWidth,
    userName: containerWidth - 130,
  };

  const shouldAllowNavigation = () => {
    return !isSocialLinkDisabled() && !disableLinks;
  };

  function isSocialLinkDisabled() {
    if (widget?.attributes?.disableLinks) {
      return true;
    }
    const config = getWidgetConfig();
    const isMobileWeb = getALMConfig().learnerMobileApp;
    return config?.disableLinks || config?.disableSocialWidgetLink || isMobileWeb;
  }

  function onExploreClick() {
    if (shouldAllowNavigation()) {
      getALMObject().navigateToSocial();
    }
  }

  function getTimeAgoString(_postUpdatedDate: string) {
    const seconds = (new Date().getTime() - new Date(_postUpdatedDate).getTime()) / 1000;
    if (seconds > secondsInSevenDays) {
      return GetTranslation('social.week.ago');
    } else {
      return GetFormattedDate(_postUpdatedDate, locale);
    }
  }

  function renderEmptyCard() {
    return (
      <figure className={styles.emptyBody}>
        <div>{SOCIAL_EMPTY_STATE_SVG(GetTranslation('social.empty', true))}</div>
        <div className={styles.emptyContent}>
          <p className={styles.emptyCardConnectPeers}>
            {GetTranslation(`social.explore.message1`)}
          </p>
          {!isSocialLinkDisabled() && (
            <button
              onClick={onExploreClick}
              className={styles.emptyCardExplore}
              data-automationid={`social-explore-button`}
            >
              {GetTranslation(`social.explore.message2`, true)}
            </button>
          )}
        </div>
      </figure>
    );
  }

  const handlePostClick = (post: any) => {
    if (shouldAllowNavigation()) {
      getALMObject().navigateToSocial(`/board/${post.parent.id}?postId=${post.id}`);
    }
  };

  const handleMentionClick = (user: PrimeUser) => {
    const userProfileLink = `${GetUserProfilePageLink()}?userId=${user.id}`;
    SendLinkEvent(userProfileLink);
  };

  const processMentions = (post: any, text: string, users: PrimeUser[]): ReactNode[] => {
    const mentionRegex = /@\[(user|usergroup):(-1|\d+)\]/g;
    const parts: ReactNode[] = [];
    let lastIndex = 0;
    let match;

    while ((match = mentionRegex.exec(text)) !== null) {
      // Add text before the mention
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }

      const [fullMatch, type, id] = match;
      const user = users.find(u => u.id.toString() === id);

      // Addding username check.. as Proxy object has relationships but not included objects
      if (user && user.name && user.state === 'ACTIVE') {
        // Add clickable mention link
        parts.push(
          <a
            key={`mention-${id}-${match.index}`}
            href="javascript:void(0)"
            data-automationid={`user-profile-${user.id}`}
            onClick={() => handlePostClick(post)}
            className={styles.mentionLink}
          >
            {user.name}
          </a>
        );
      } else {
        // Add anonymous text if user not found
        parts.push(GetTranslation('user.name.anonymous'));
      }

      lastIndex = match.index + fullMatch.length;
    }
    // Add remaining text after last mention
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }
    return parts;
  };

  const renderPosts = () => {
    return (
      <section className={styles.posts} data-automationid="posts-section">
        <div className={styles.postsList} data-automationid="social-posts-list">
          {posts.map((post, index) => {
            let postText = post.text;
            if (!postText) {
              postText = GetTranslation('sharedAFile');
            }
            const userMentions = post.userMentions || [];
            const processedText = processMentions(post, postText, userMentions);
            const processedTextString = processedText.map(extractTextFromReactNode).join('');
            const avatarUrl = post.createdBy.avatarUrl;
            let showDefaultImg = false;
            if (!avatarUrl || avatarUrl.includes('default_user_avatar.svg')) {
              showDefaultImg = true;
            }
            const dateUpdatedStr = getTimeAgoString(post.dateUpdated);
            const isPostDeleted = post.createdBy.state === DELETED;
            const createdBy = isPostDeleted
              ? GetTranslation('user.name.anonymous')
              : post.createdBy.name;
            return (
              <a
                href="#"
                className={styles.postContainer}
                key={index}
                data-automationid={`social-post-${index.toString()}`}
                style={{
                  pointerEvents: shouldAllowNavigation() ? 'auto' : 'none',
                }}
                onClick={() => handlePostClick(post)}
                aria-label={GetTranslationsReplaced('text.viewPost', {
                  postNum: index + 1,
                  postedBy: createdBy,
                })}
              >
                <div className={styles.post}>
                  <div className={styles.metadata}>
                    <div
                      className={styles.profile}
                      data-automationid={`user-profile-${index.toString()}`}
                    >
                      {showDefaultImg || isPostDeleted ? (
                        DEFAULT_USER_AVATAR_SVG(GetTranslation('profilePic'))
                      ) : (
                        <ALMImage
                          altText={GetTranslation('profilePic')}
                          UNSAFE_className={styles.profileImage}
                          src={avatarUrl}
                          defaultImageSrc={DEFAULT_USER_AVATAR}
                        />
                      )}
                    </div>

                    <div className={styles.userInfo}>
                      <div className={styles.srOnly}>
                        {GetTranslationReplaced('text.postedBy', createdBy)}
                      </div>
                      <div
                        aria-hidden="true"
                        data-automationid={`userName-${index.toString()}`}
                        className={styles.userName}
                        title={createdBy ? createdBy : GetTranslation('user.name.anonymous')}
                        style={{
                          maxWidth: `${dimensions.userName}px`,
                        }}
                      >
                        {createdBy ? createdBy : GetTranslation('user.name.anonymous')}
                      </div>
                      <div className={styles.srOnly}>
                        {GetTranslationReplaced('text.posted', dateUpdatedStr)}
                      </div>
                      <div
                        aria-hidden="true"
                        className={styles.datePosted}
                        data-automationid={`updatedOn-${index.toString()}`}
                      >
                        {dateUpdatedStr}
                      </div>
                    </div>
                  </div>

                  <div
                    aria-hidden="true"
                    data-automationid={`post-text-${index.toString()}`}
                    title={processedTextString}
                    className={styles.textBox}
                  >
                    {processedText}
                  </div>
                  <div className={styles.srOnly}>{processedTextString}</div>
                </div>
              </a>
            );
          })}
          {showExploreBox && (
            <div className={styles.explore} data-automationid={`social-explore`}>
              <p
                className={styles.exploreBoxConnectPeers}
                data-automationid="social-explore-message"
              >
                {GetTranslation(`social.explore.message1`)}
              </p>
              {!isSocialLinkDisabled() && (
                <button
                  onClick={onExploreClick}
                  className={styles.exploreBoxExplore}
                  data-automationid="social-explore-button"
                  style={{
                    pointerEvents: shouldAllowNavigation() ? 'auto' : 'none',
                  }}
                >
                  {GetTranslation(`social.explore.message2`, true)}
                </button>
              )}
            </div>
          )}
        </div>
      </section>
    );
  };

  const heading = GetTranslation(`${widgetId}.title`) || widget.attributes?.title;
  const widgetDescription =
    GetTranslation(`${widgetId}.description`) || widget.attributes?.description;

  const renderContent = () => {
    if (fetchingData) {
      return (
        <div className={styles.loadingContainer}>
          <ALMWidgetLoader />
        </div>
      );
    }
    return emptyView ? renderEmptyCard() : renderPosts();
  };

  const { isHovered, widgetContainerWidth, widgetContainerHeight, changeHoverState } =
    useWidgetInspectMode({
      sectionRef,
    });

  return (
    <section
      className={styles.container}
      id={widgetId}
      ref={isCustomPage ? sectionRef : undefined}
      onMouseEnter={changeHoverState}
      onMouseLeave={changeHoverState}
    >
      {isCustomPage && isInspectMode && isHovered && (
        <ALMWidgetInspectMode
          widget={widget}
          widgetWidth={widgetContainerWidth}
          widgetHeight={widgetContainerHeight}
        />
      )}
      <div
        className={styles.widget}
        style={{
          width: `${dimensions.section}px`,
        }}
        data-automationid="social-container"
      >
        {isCustomPage ? (
          <ALMStripWidgetHeader
            heading={heading}
            widgetId={widgetId}
            widgetDescription={widgetDescription}
            isLeftNavIconDisabled={true}
            isRightNavIconDisabled={true}
            rollAPage={() => {}}
            showNavIcons={false}
          />
        ) : (
          <h2
            id="header"
            data-automationid="social-header"
            title={GetTranslation('socialFeed', true)}
            className={`${styles.header} ${emptyView ? styles.headerCenter : ''}`}
            style={{ width: `${dimensions.header}px` }}
            data-skip-link-target={widgetId}
            tabIndex={0}
          >
            {GetTranslation('socialFeed', true)}
          </h2>
        )}
        <section
          id="socialContainer"
          style={{ height: `${CARD_HEIGHT}px` }}
          role="complementary"
          aria-labelledby="header"
          data-automationid="social-card"
          className={styles.contentContainer}
        >
          {renderContent()}
        </section>
        {isSocialLinkDisabled()
          ? ''
          : !hideExploreButton && (
              <button
                className={styles.actionText}
                onClick={onExploreClick}
                data-automationid={`social-explore-button`}
                style={{
                  pointerEvents: shouldAllowNavigation() ? 'auto' : 'none',
                }}
              >
                {GetTranslation('alm.text.explore')}
              </button>
            )}
      </div>
    </section>
  );
};

export default ALMSocialLearning;
