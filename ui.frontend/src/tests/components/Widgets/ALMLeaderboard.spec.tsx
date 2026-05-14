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
import { render, screen, act, fireEvent } from '@testing-library/react';
import { waitFor } from '@testing-library/dom';
import ALMLeaderboard from '../../../almLib/components/Widgets/ALMLeaderboard/ALMLeaderboard';

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('../../../almLib/hooks/widgets/leaderboard/useLeaderboard', () => ({
  useLeaderboard: jest.fn(),
}));

jest.mock('../../../almLib/contextProviders/userContextProvider', () => ({
  useUserContext: jest.fn(),
}));

jest.mock('../../../almLib/hooks/widgets/useWidgetLayout', () => ({
  useWidgetLayout: jest.fn(),
}));

jest.mock('../../../almLib/hooks/customPages/useALMInspectMode', () => ({
  useWidgetInspectMode: jest.fn(),
}));

jest.mock('../../../almLib/utils/translationService', () => ({
  GetTranslation: jest.fn((key: string) => key),
  GetTranslationReplaced: jest.fn((key: string, val: any) => `${key}:${val}`),
  GetTranslationsReplaced: jest.fn((key: string, params: any) => `${key}:${JSON.stringify(params)}`),
}));

jest.mock('../../../almLib/utils/global', () => ({
  getALMAccount: jest.fn(),
  getALMConfig: jest.fn(),
  getALMObject: jest.fn(),
  getWidgetConfig: jest.fn(),
}));

jest.mock('../../../almLib/utils/widgets/utils', () => ({
  getIsCustomPage: jest.fn(),
}));

jest.mock('../../../almLib/utils/inline_svg', () => ({
  BRONZE_LEVEL_SVG: () => <svg data-testid="bronze-level" />,
  SILVER_LEVEL_SVG: () => <svg data-testid="silver-level" />,
  GOLD_LEVEL_SVG: () => <svg data-testid="gold-level" />,
  PLATINUM_LEVEL_SVG: () => <svg data-testid="platinum-level" />,
  EMPTY_STATE_CARD: () => <svg data-testid="empty-state-card" />,
}));

jest.mock('../../../almLib/components/CustomPages/ALMStripWidgetHeader/ALMStripWidgetHeader', () => ({
  __esModule: true,
  default: () => <div data-testid="strip-widget-header" />,
}));

jest.mock('../../../almLib/components/CustomPages/ALMNoAccessContainer', () => ({
  ALMNoAccessContainer: () => <div data-testid="no-access-container" />,
}));

jest.mock('../../../almLib/components/CustomPages/ALMWidgetLoader/ALMWidgetLoader', () => ({
  __esModule: true,
  default: () => <div data-testid="widget-loader" />,
}));

jest.mock('../../../almLib/components/CustomPages/ALMWidgetInspectMode/ALMWidgetInspectMode', () => ({
  __esModule: true,
  default: () => <div data-testid="inspect-mode" />,
}));

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const mockWidget = { id: 'leaderboard-widget-1', attributes: { heading: 'Leaderboard' } };

const mockUser = { id: 'user-1', name: 'Test User', pointsEarned: 150, gamificationEnabled: true };

// Non-zero points so allCompetitorsHaveZeroPoints=false by default
const defaultCompetitors = [
  { id: 'user-1', name: 'Test User', pointsEarned: 150 },
  { id: 'user-2', name: 'Competitor A', pointsEarned: 200 },
  { id: 'user-3', name: 'Competitor B', pointsEarned: 100 },
];

// Bronze=100, Silver=300, Gold=600, Platinum=1000
const mockGamificationLevels = [
  { name: 'Bronze', points: 100 },
  { name: 'Silver', points: 300 },
  { name: 'Gold', points: 600 },
  { name: 'Platinum', points: 1000 },
];

const renderAndWait = async (props: any = {}) => {
  let result: any;
  await act(async () => {
    result = render(<ALMLeaderboard widget={mockWidget} {...props} />);
  });
  return result!;
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ALMLeaderboard', () => {
  let mockNavigate: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate = jest.fn();

    const { useUserContext } = require('../../../almLib/contextProviders/userContextProvider');
    useUserContext.mockReturnValue({ user: mockUser });

    const { useLeaderboard } = require('../../../almLib/hooks/widgets/leaderboard/useLeaderboard');
    useLeaderboard.mockReturnValue({
      getCompetitors: jest.fn().mockResolvedValue({ userList: [...defaultCompetitors] }),
      fetchingData: false,
    });

    const { useWidgetLayout } = require('../../../almLib/hooks/widgets/useWidgetLayout');
    useWidgetLayout.mockReturnValue({ containerWidth: 400, widgetId: 'widget-123', sectionRef: { current: null } });

    const { useWidgetInspectMode } = require('../../../almLib/hooks/customPages/useALMInspectMode');
    useWidgetInspectMode.mockReturnValue({
      isHovered: false,
      widgetContainerWidth: 400,
      widgetContainerHeight: 300,
      changeHoverState: jest.fn(),
    });

    const { GetTranslation, GetTranslationReplaced, GetTranslationsReplaced } = require('../../../almLib/utils/translationService');
    GetTranslation.mockImplementation((key: string) => key);
    GetTranslationReplaced.mockImplementation((key: string, val: any) => `${key}:${val}`);
    GetTranslationsReplaced.mockImplementation((key: string, params: any) => `${key}:${JSON.stringify(params)}`);

    const { getALMAccount, getALMConfig, getALMObject, getWidgetConfig } = require('../../../almLib/utils/global');
    getALMAccount.mockResolvedValue({ gamificationLevels: mockGamificationLevels });
    getALMConfig.mockReturnValue({ learnerMobileApp: false });
    getALMObject.mockReturnValue({ navigateToLeaderboardPage: mockNavigate });
    getWidgetConfig.mockReturnValue({ disableLinks: false, disableLeaderBoardWidgetLink: false });

    const { getIsCustomPage } = require('../../../almLib/utils/widgets/utils');
    getIsCustomPage.mockReturnValue(false);
  });

  describe('Gamification Disabled', () => {
    it('gamificationDisabled_nonCustomPage_rendersNull', () => {
      const { useUserContext } = require('../../../almLib/contextProviders/userContextProvider');
      useUserContext.mockReturnValue({ user: { ...mockUser, gamificationEnabled: false } });
      const { container } = render(<ALMLeaderboard widget={mockWidget} />);
      expect(container.firstChild).toBeNull();
    });

    it('gamificationDisabled_customPage_noAccessContainerShown', () => {
      const { useUserContext } = require('../../../almLib/contextProviders/userContextProvider');
      useUserContext.mockReturnValue({ user: { ...mockUser, gamificationEnabled: false } });
      const { getIsCustomPage } = require('../../../almLib/utils/widgets/utils');
      getIsCustomPage.mockReturnValue(true);
      render(<ALMLeaderboard widget={mockWidget} />);
      expect(screen.getByTestId('no-access-container')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('fetchingData_true_loaderShown_contentHidden', async () => {
      const { useLeaderboard } = require('../../../almLib/hooks/widgets/leaderboard/useLeaderboard');
      useLeaderboard.mockReturnValue({ getCompetitors: jest.fn().mockResolvedValue({ userList: [] }), fetchingData: true });
      await renderAndWait();
      await waitFor(() => expect(screen.getByTestId('widget-loader')).toBeInTheDocument());
      expect(document.querySelector('[data-automationid="ALMLeaderboardLevelContainer"]')).toBeNull();
    });

    it('fetchingData_false_leaderboardContentShown_loaderHidden', async () => {
      await renderAndWait();
      await waitFor(() => expect(document.querySelector('[data-automationid="ALMLeaderboardLevelContainer"]')).not.toBeNull());
      expect(screen.queryByTestId('widget-loader')).toBeNull();
    });
  });

  describe('Header', () => {
    it('nonCustomPage_h2HeaderShown_stripHeaderHidden', async () => {
      await renderAndWait();
      await waitFor(() => expect(document.querySelector('[data-automationid="leaderboardHeader"]')).not.toBeNull());
      expect(screen.queryByTestId('strip-widget-header')).toBeNull();
    });

    it('customPage_stripHeaderShown_h2HeaderHidden', async () => {
      const { getIsCustomPage } = require('../../../almLib/utils/widgets/utils');
      getIsCustomPage.mockReturnValue(true);
      await renderAndWait();
      await waitFor(() => expect(screen.getByTestId('strip-widget-header')).toBeInTheDocument());
      expect(document.querySelector('[data-automationid="leaderboardHeader"]')).toBeNull();
    });
  });

  describe('Inspect Mode', () => {
    it('inspectMode_customPage_hovered_overlayShown', async () => {
      const { getIsCustomPage } = require('../../../almLib/utils/widgets/utils');
      getIsCustomPage.mockReturnValue(true);
      const { useWidgetInspectMode } = require('../../../almLib/hooks/customPages/useALMInspectMode');
      useWidgetInspectMode.mockReturnValue({ isHovered: true, widgetContainerWidth: 400, widgetContainerHeight: 300, changeHoverState: jest.fn() });
      await renderAndWait({ isInspectMode: true });
      await waitFor(() => expect(screen.getByTestId('inspect-mode')).toBeInTheDocument());
    });

    it('inspectMode_notHovered_overlayHidden', async () => {
      const { getIsCustomPage } = require('../../../almLib/utils/widgets/utils');
      getIsCustomPage.mockReturnValue(true);
      // isHovered = false (default in beforeEach)
      await renderAndWait({ isInspectMode: true });
      await waitFor(() => expect(screen.getByTestId('strip-widget-header')).toBeInTheDocument());
      expect(screen.queryByTestId('inspect-mode')).toBeNull();
    });
  });

  describe('Level View', () => {
    it('firstTimeView_0points_getStartedTextAndProgressBarShown', async () => {
      const { useUserContext } = require('../../../almLib/contextProviders/userContextProvider');
      useUserContext.mockReturnValue({ user: { ...mockUser, pointsEarned: 0 } });
      await renderAndWait();
      await waitFor(() => expect(screen.getByText('lb.getStarted')).toBeInTheDocument());
      expect(document.querySelector('[data-automationid="alm_leaderboard_progressBar"]')).not.toBeNull();
    });

    it('firstTimeView_belowBronze_keepGoingTextShown', async () => {
      const { useUserContext } = require('../../../almLib/contextProviders/userContextProvider');
      useUserContext.mockReturnValue({ user: { ...mockUser, pointsEarned: 50 } });
      await renderAndWait();
      await waitFor(() => expect(screen.getByText('lb.keepGoing')).toBeInTheDocument());
    });

    it('currentLevel_bronzePoints_bronzeBadgeShown', async () => {
      // 150 pts: >= Bronze(100), < Silver(300) → bronze badge displayed
      await renderAndWait();
      await waitFor(() => expect(screen.getByTestId('bronze-level')).toBeInTheDocument());
      expect(screen.queryByTestId('silver-level')).toBeNull();
    });

    it('currentLevel_silverPoints_silverBadgeShown', async () => {
      const { useUserContext } = require('../../../almLib/contextProviders/userContextProvider');
      useUserContext.mockReturnValue({ user: { ...mockUser, pointsEarned: 400 } });
      await renderAndWait();
      await waitFor(() => expect(screen.getByTestId('silver-level')).toBeInTheDocument());
    });

    it('currentLevel_goldPoints_goldBadgeShown', async () => {
      const { useUserContext } = require('../../../almLib/contextProviders/userContextProvider');
      useUserContext.mockReturnValue({ user: { ...mockUser, pointsEarned: 700 } });
      await renderAndWait();
      await waitFor(() => expect(screen.getByTestId('gold-level')).toBeInTheDocument());
    });

    it('allLevelsAchieved_platinumPoints_allBadgesAndConfettiShown', async () => {
      const { useUserContext } = require('../../../almLib/contextProviders/userContextProvider');
      useUserContext.mockReturnValue({ user: { ...mockUser, pointsEarned: 1500 } });
      await renderAndWait();
      await waitFor(() => expect(screen.getByTestId('bronze-level')).toBeInTheDocument());
      expect(screen.getByTestId('silver-level')).toBeInTheDocument();
      expect(screen.getByTestId('gold-level')).toBeInTheDocument();
      expect(screen.getByTestId('platinum-level')).toBeInTheDocument();
      expect(document.querySelector('[data-automationid="ALMLbConfettiText"]')).not.toBeNull();
    });
  });

  describe('Competitors List', () => {
    it('competitors_nonZeroPoints_tableShownWithUserNames', async () => {
      await renderAndWait();
      await waitFor(() => expect(document.querySelector('[data-automationid="ALMCompetitorsTable"]')).not.toBeNull());
      expect(document.querySelector('[data-automationid="ALMUserNameTest User"]')).not.toBeNull();
      expect(document.querySelector('[data-automationid="ALMUserNameCompetitor A"]')).not.toBeNull();
    });

    it('competitors_allZeroPoints_emptyStateShown_tableHidden', async () => {
      const { useUserContext } = require('../../../almLib/contextProviders/userContextProvider');
      useUserContext.mockReturnValue({ user: { ...mockUser, pointsEarned: 0 } });
      const { useLeaderboard } = require('../../../almLib/hooks/widgets/leaderboard/useLeaderboard');
      useLeaderboard.mockReturnValue({
        getCompetitors: jest.fn().mockResolvedValue({
          userList: [
            { id: 'user-1', name: 'Test User', pointsEarned: 0 },
            { id: 'user-2', name: 'Competitor A', pointsEarned: 0 },
          ],
        }),
        fetchingData: false,
      });
      await renderAndWait();
      await waitFor(() => expect(screen.getByTestId('empty-state-card')).toBeInTheDocument());
      expect(document.querySelector('[data-automationid="ALMCompetitorsTable"]')).toBeNull();
    });

    it('currentUserNotInList_addedToCompetitorsTable', async () => {
      const { useLeaderboard } = require('../../../almLib/hooks/widgets/leaderboard/useLeaderboard');
      useLeaderboard.mockReturnValue({
        getCompetitors: jest.fn().mockResolvedValue({
          userList: [
            { id: 'user-2', name: 'Competitor A', pointsEarned: 200 },
            { id: 'user-3', name: 'Competitor B', pointsEarned: 100 },
          ],
        }),
        fetchingData: false,
      });
      await renderAndWait();
      // user-1 (Test User) not in list → component appends them
      await waitFor(() => expect(document.querySelector('[data-automationid="ALMUserNameTest User"]')).not.toBeNull());
    });
  });

  describe('Explore Button', () => {
    it('exploreButton_competitorsPresent_shown_clickNavigatesToLeaderboard', async () => {
      await renderAndWait();
      await waitFor(() => expect(document.querySelector('[data-automationid="social-explore-button"]')).not.toBeNull());
      fireEvent.click(document.querySelector('[data-automationid="social-explore-button"]')!);
      expect(mockNavigate).toHaveBeenCalledTimes(1);
    });

    it('exploreButton_disableLinks_shown_clickNoNavigation', async () => {
      await renderAndWait({ disableLinks: true });
      await waitFor(() => expect(document.querySelector('[data-automationid="social-explore-button"]')).not.toBeNull());
      fireEvent.click(document.querySelector('[data-automationid="social-explore-button"]')!);
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('exploreButton_mobileApp_buttonHidden', async () => {
      const { getALMConfig } = require('../../../almLib/utils/global');
      getALMConfig.mockReturnValue({ learnerMobileApp: true });
      await renderAndWait();
      await waitFor(() => expect(document.querySelector('[data-automationid="ALMLeaderboardLevelContainer"]')).not.toBeNull());
      expect(document.querySelector('[data-automationid="social-explore-button"]')).toBeNull();
    });

    it('exploreButton_widgetConfigDisableLinks_buttonHidden', async () => {
      const { getWidgetConfig } = require('../../../almLib/utils/global');
      getWidgetConfig.mockReturnValue({ disableLinks: true, disableLeaderBoardWidgetLink: false });
      await renderAndWait();
      await waitFor(() => expect(document.querySelector('[data-automationid="ALMLeaderboardLevelContainer"]')).not.toBeNull());
      expect(document.querySelector('[data-automationid="social-explore-button"]')).toBeNull();
    });
  });
});
