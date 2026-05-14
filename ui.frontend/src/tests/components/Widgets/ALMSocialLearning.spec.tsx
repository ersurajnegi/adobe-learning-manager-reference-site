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
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import ALMSocialLearning from '@components/Widgets/ALMSocialLearningWidget/ALMSocialLearning';

// ─── Module-level mock handles (survive resetMocks:true as jest.fn() references) ─

const mockGetTranslation = jest.fn();
const mockGetTranslationReplaced = jest.fn();
const mockGetTranslationsReplaced = jest.fn();
const mockUseSocialLearning = jest.fn();
const mockUseWidgetLayout = jest.fn();
const mockUseUserContext = jest.fn();
const mockUseWidgetInspectMode = jest.fn();
const mockGetALMConfig = jest.fn();
const mockGetALMObject = jest.fn();
const mockGetWidgetConfig = jest.fn();
const mockGetIsCustomPage = jest.fn();
const mockGetFormattedDate = jest.fn();
const mockGetUserProfilePageLink = jest.fn();
const mockSendLinkEvent = jest.fn();
const mockChangeHoverState = jest.fn();
const mockNavigateToSocial = jest.fn();

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('@utils/translationService', () => ({
  GetTranslation: (key: string, returnKey?: boolean) => mockGetTranslation(key, returnKey),
  GetTranslationReplaced: (key: string, value: any) => mockGetTranslationReplaced(key, value),
  GetTranslationsReplaced: (key: string, params: any) => mockGetTranslationsReplaced(key, params),
}));

jest.mock('@hooks/widgets/socialLearning/useSocialLearning', () => ({
  useSocialLearning: () => mockUseSocialLearning(),
}));

jest.mock('@hooks/widgets/useWidgetLayout', () => ({
  useWidgetLayout: (config: any) => mockUseWidgetLayout(config),
}));

jest.mock('@contextProviders/userContextProvider', () => ({
  useUserContext: () => mockUseUserContext(),
}));

jest.mock('@hooks/customPages/useALMInspectMode', () => ({
  useWidgetInspectMode: (config: any) => mockUseWidgetInspectMode(config),
}));

jest.mock('@utils/global', () => ({
  getALMConfig: () => mockGetALMConfig(),
  getALMObject: () => mockGetALMObject(),
  getWidgetConfig: () => mockGetWidgetConfig(),
}));

jest.mock('@utils/widgets/utils', () => ({
  getIsCustomPage: () => mockGetIsCustomPage(),
  GetFormattedDate: (date: string, locale: string) => mockGetFormattedDate(date, locale),
  extractTextFromReactNode: (node: any) => (typeof node === 'string' ? node : ''),
}));

jest.mock('@utils/widgets/base/EventHandlingBase', () => ({
  GetUserProfilePageLink: () => mockGetUserProfilePageLink(),
  SendLinkEvent: (link: string) => mockSendLinkEvent(link),
}));

jest.mock('@utils/inline_svg', () => ({
  DEFAULT_USER_AVATAR_SVG: (altText: string) => <svg data-testid="default-avatar">{altText}</svg>,
  SOCIAL_EMPTY_STATE_SVG: (altText: string) => <svg data-testid="social-empty-state-image">{altText}</svg>,
}));

jest.mock('@components/Common/ALMImage', () => ({
  ALMImage: ({ src, altText }: any) => <img data-testid="alm-image" src={src} alt={altText} />,
}));

jest.mock('@components/CustomPages/ALMStripWidgetHeader/ALMStripWidgetHeader', () => ({
  __esModule: true,
  default: ({ heading }: any) => <div data-testid="strip-widget-header">{heading}</div>,
}));

jest.mock('@components/CustomPages/ALMNoAccessContainer/ALMNoAccessContainer', () => ({
  __esModule: true,
  default: () => <div data-testid="no-access-container" />,
}));

jest.mock('@components/CustomPages/ALMWidgetLoader/ALMWidgetLoader', () => ({
  __esModule: true,
  default: () => <div data-testid="widget-loader" />,
}));

jest.mock('@components/CustomPages/ALMWidgetInspectMode/ALMWidgetInspectMode', () => ({
  __esModule: true,
  default: () => <div data-testid="inspect-mode" />,
}));

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const mockWidget = { id: 'social-1', attributes: { heading: '' } } as any;

const makePost = (overrides: any = {}) => ({
  id: 'post-1',
  text: 'Test post text',
  dateUpdated: new Date().toISOString(),
  createdBy: {
    id: 'u1',
    name: 'John Doe',
    avatarUrl: 'https://example.com/avatar.jpg',
    state: 'ACTIVE',
  },
  parent: { id: 'board-1' },
  userMentions: [],
  ...overrides,
});

const renderComponent = (props: any = {}) =>
  render(
    <IntlProvider locale="en" messages={{}}>
      <ALMSocialLearning widget={mockWidget} {...props} />
    </IntlProvider>
  );

// querySelector helper for data-automationid attributes
const qAutoId = (id: string) => document.querySelector(`[data-automationid="${id}"]`);

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ALMSocialLearning', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockGetTranslation.mockImplementation((key: string) => key);
    mockGetTranslationReplaced.mockImplementation((key: string, value: any) => `${key}: ${value}`);
    mockGetTranslationsReplaced.mockImplementation(
      (key: string, params: any) => `${key}: ${JSON.stringify(params)}`
    );

    mockUseUserContext.mockReturnValue({ user: { account: { enableSocialLearning: true } } });
    mockGetIsCustomPage.mockReturnValue(false);

    mockUseSocialLearning.mockReturnValue({
      posts: [makePost()],
      showExploreBox: false,
      emptyView: false,
      fetchingData: false,
    });

    mockUseWidgetLayout.mockReturnValue({
      containerWidth: 400,
      widgetId: 'widget-123',
      sectionRef: { current: null },
    });

    mockUseWidgetInspectMode.mockReturnValue({
      isHovered: false,
      widgetContainerWidth: 400,
      widgetContainerHeight: 300,
      changeHoverState: mockChangeHoverState,
    });

    mockGetALMConfig.mockReturnValue({ learnerMobileApp: false });
    mockGetALMObject.mockReturnValue({ navigateToSocial: mockNavigateToSocial });
    mockGetWidgetConfig.mockReturnValue({ disableLinks: false, disableSocialWidgetLink: false });
    mockGetFormattedDate.mockReturnValue('2 hours ago');
    mockGetUserProfilePageLink.mockReturnValue('/profile');
  });

  describe('Guard Conditions', () => {
    it('socialLearningDisabled_notCustomPage_nothingRendered', () => {
      mockUseUserContext.mockReturnValue({ user: { account: { enableSocialLearning: false } } });
      const { container } = renderComponent();
      expect(container.firstChild).toBeNull();
    });

    it('socialLearningDisabled_customPage_noAccessContainerShown', () => {
      mockUseUserContext.mockReturnValue({ user: { account: { enableSocialLearning: false } } });
      mockGetIsCustomPage.mockReturnValue(true);
      renderComponent();
      expect(screen.getByTestId('no-access-container')).toBeInTheDocument();
    });

    it('userContext_null_nothingRendered', () => {
      mockUseUserContext.mockReturnValue(null);
      const { container } = renderComponent();
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Content States', () => {
    it('fetchingData_true_loaderShown_postsHidden', () => {
      mockUseSocialLearning.mockReturnValue({
        posts: [],
        showExploreBox: false,
        emptyView: false,
        fetchingData: true,
      });
      renderComponent();
      expect(screen.getByTestId('widget-loader')).toBeInTheDocument();
      expect(qAutoId('posts-section')).toBeNull();
    });

    it('emptyView_true_emptyStateImageShown_postsHidden', () => {
      mockUseSocialLearning.mockReturnValue({
        posts: [],
        showExploreBox: false,
        emptyView: true,
        fetchingData: false,
      });
      renderComponent();
      expect(screen.getByTestId('social-empty-state-image')).not.toBeNull();
      expect(qAutoId('posts-section')).toBeNull();
    });

    it('normalState_postsListRendered', () => {
      renderComponent();
      expect(qAutoId('posts-section')).not.toBeNull();
      expect(qAutoId('social-post-0')).not.toBeNull();
    });
  });

  describe('Explore Button Visibility', () => {
    // The footer explore button appears when: !emptyView && !showExploreBox && !isSocialLinkDisabled()
    it('normalState_socialLinkEnabled_footerExploreButtonShown', () => {
      renderComponent();
      expect(qAutoId('social-explore-button')).not.toBeNull();
    });

    it('configDisableSocialLink_footerExploreButtonHidden', () => {
      mockGetWidgetConfig.mockReturnValue({ disableLinks: true, disableSocialWidgetLink: false });
      renderComponent();
      expect(qAutoId('social-explore-button')).toBeNull();
    });

    it('learnerMobileApp_footerExploreButtonHidden', () => {
      mockGetALMConfig.mockReturnValue({ learnerMobileApp: true });
      renderComponent();
      expect(qAutoId('social-explore-button')).toBeNull();
    });

    it('showExploreBox_true_exploreBoxRendered_footerButtonHidden', () => {
      // hideExploreButton = true when showExploreBox=true, so footer button is hidden;
      // the explore box (with its own button) appears inside the posts list instead.
      mockUseSocialLearning.mockReturnValue({
        posts: [makePost()],
        showExploreBox: true,
        emptyView: false,
        fetchingData: false,
      });
      renderComponent();
      expect(qAutoId('social-explore')).not.toBeNull();
      // Explore box button is shown (not the footer one, since footer is hidden)
      expect(qAutoId('social-explore-button')).not.toBeNull();
    });

    it('emptyView_socialLinkEnabled_emptyCardExploreButtonShown', () => {
      mockUseSocialLearning.mockReturnValue({
        posts: [],
        showExploreBox: false,
        emptyView: true,
        fetchingData: false,
      });
      renderComponent();
      expect(qAutoId('social-explore-button')).not.toBeNull();
    });

    it('emptyView_socialLinkDisabled_emptyCardExploreButtonHidden', () => {
      mockUseSocialLearning.mockReturnValue({
        posts: [],
        showExploreBox: false,
        emptyView: true,
        fetchingData: false,
      });
      mockGetWidgetConfig.mockReturnValue({ disableLinks: true, disableSocialWidgetLink: false });
      renderComponent();
      expect(qAutoId('social-explore-button')).toBeNull();
    });
  });

  describe('Navigation', () => {
    it('exploreButton_click_navigationAllowed_navigatesToSocial', () => {
      renderComponent();
      userEvent.click(qAutoId('social-explore-button') as HTMLElement);
      expect(mockNavigateToSocial).toHaveBeenCalledTimes(1);
    });

    it('postClick_navigationAllowed_navigatesToSocialWithBoardUrl', () => {
      renderComponent();
      userEvent.click(qAutoId('social-post-0') as HTMLElement);
      expect(mockNavigateToSocial).toHaveBeenCalledWith('/board/board-1?postId=post-1');
    });

    it('postClick_disableLinksProp_doesNotNavigate', () => {
      // disableLinks prop (not config) affects shouldAllowNavigation but not button visibility
      renderComponent({ disableLinks: true });
      userEvent.click(qAutoId('social-post-0') as HTMLElement);
      expect(mockNavigateToSocial).not.toHaveBeenCalled();
    });
  });

  describe('Avatar Rendering', () => {
    it('activeUser_withAvatarUrl_almImageRendered', () => {
      renderComponent();
      expect(screen.getByTestId('alm-image')).toBeInTheDocument();
      expect(screen.queryByTestId('default-avatar')).toBeNull();
    });

    it('noAvatarUrl_defaultAvatarSvgRendered', () => {
      mockUseSocialLearning.mockReturnValue({
        posts: [makePost({ createdBy: { id: 'u1', name: 'Jane', avatarUrl: '', state: 'ACTIVE' } })],
        showExploreBox: false,
        emptyView: false,
        fetchingData: false,
      });
      renderComponent();
      expect(screen.getByTestId('default-avatar')).toBeInTheDocument();
      expect(screen.queryByTestId('alm-image')).toBeNull();
    });

    it('deletedUser_defaultAvatarRendered_anonymousNameShown', () => {
      mockUseSocialLearning.mockReturnValue({
        posts: [
          makePost({
            createdBy: { id: 'u1', name: 'Deleted', avatarUrl: 'https://example.com/a.jpg', state: 'DELETED' },
          }),
        ],
        showExploreBox: false,
        emptyView: false,
        fetchingData: false,
      });
      renderComponent();
      expect(screen.getByTestId('default-avatar')).toBeInTheDocument();
      // Deleted user → name replaced with anonymous translation key
      expect(qAutoId('userName-0')?.textContent).toBe('user.name.anonymous');
    });
  });

  describe('Custom Page vs Regular', () => {
    it('notCustomPage_h2HeaderShown_stripWidgetHeaderHidden', () => {
      renderComponent();
      expect(qAutoId('social-header')).not.toBeNull();
      expect(screen.queryByTestId('strip-widget-header')).toBeNull();
    });

    it('customPage_stripWidgetHeaderShown_h2HeaderHidden', () => {
      mockGetIsCustomPage.mockReturnValue(true);
      renderComponent();
      expect(screen.getByTestId('strip-widget-header')).toBeInTheDocument();
      expect(qAutoId('social-header')).toBeNull();
    });
  });

  describe('Inspect Mode Overlay', () => {
    it('customPage_inspectMode_hovered_overlayShown', () => {
      mockGetIsCustomPage.mockReturnValue(true);
      mockUseWidgetInspectMode.mockReturnValue({
        isHovered: true,
        widgetContainerWidth: 400,
        widgetContainerHeight: 300,
        changeHoverState: mockChangeHoverState,
      });
      renderComponent({ isInspectMode: true });
      expect(screen.getByTestId('inspect-mode')).toBeInTheDocument();
    });

    it('customPage_inspectMode_notHovered_overlayHidden', () => {
      mockGetIsCustomPage.mockReturnValue(true);
      // isHovered = false (default)
      renderComponent({ isInspectMode: true });
      expect(screen.queryByTestId('inspect-mode')).toBeNull();
    });

    it('notCustomPage_inspectMode_hovered_overlayHidden', () => {
      // isCustomPage = false (default) gates the overlay regardless of hover/inspectMode
      mockUseWidgetInspectMode.mockReturnValue({
        isHovered: true,
        widgetContainerWidth: 400,
        widgetContainerHeight: 300,
        changeHoverState: mockChangeHoverState,
      });
      renderComponent({ isInspectMode: true });
      expect(screen.queryByTestId('inspect-mode')).toBeNull();
    });
  });

  describe('Time Formatting', () => {
    it('recentPost_getFormattedDateReturnValueShown', () => {
      // Default post dateUpdated is within 7 days → GetFormattedDate branch
      renderComponent();
      expect(qAutoId('updatedOn-0')?.textContent).toBe('2 hours ago');
    });

    it('postOlderThanSevenDays_weekAgoTranslationKeyShown', () => {
      const oldDate = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();
      mockUseSocialLearning.mockReturnValue({
        posts: [makePost({ dateUpdated: oldDate })],
        showExploreBox: false,
        emptyView: false,
        fetchingData: false,
      });
      renderComponent();
      // > 7 days → GetTranslation('social.week.ago') → mock returns key as-is
      expect(qAutoId('updatedOn-0')?.textContent).toBe('social.week.ago');
    });
  });

  describe('User Mentions', () => {
    it('activeMention_userNameRenderedAsLink', () => {
      mockUseSocialLearning.mockReturnValue({
        posts: [
          makePost({
            text: 'Hello @[user:123]',
            userMentions: [{ id: '123', name: 'Alice', state: 'ACTIVE' }],
          }),
        ],
        showExploreBox: false,
        emptyView: false,
        fetchingData: false,
      });
      renderComponent();
      // processMentions inserts a clickable <a> with user.name for ACTIVE users
      expect(screen.getByText('Alice')).toBeInTheDocument();
    });

    it('inactiveMention_anonymousTranslationUsed', () => {
      mockUseSocialLearning.mockReturnValue({
        posts: [
          makePost({
            text: 'Hello @[user:456]',
            userMentions: [{ id: '456', name: 'Bob', state: 'INACTIVE' }],
          }),
        ],
        showExploreBox: false,
        emptyView: false,
        fetchingData: false,
      });
      renderComponent();
      // state !== 'ACTIVE' → GetTranslation('user.name.anonymous') inserted in place of mention;
      // mock returns the key as-is, so the post-text div renders the key string
      expect(qAutoId('post-text-0')?.textContent).toContain('user.name.anonymous');
    });

    it('nullPostText_sharedAFileKeyRenderedInPostBody', () => {
      mockUseSocialLearning.mockReturnValue({
        posts: [makePost({ text: null })],
        showExploreBox: false,
        emptyView: false,
        fetchingData: false,
      });
      renderComponent();
      // null text → postText = GetTranslation('sharedAFile') → mock returns key as-is
      expect(qAutoId('post-text-0')?.textContent).toContain('sharedAFile');
    });
  });
});
