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
import { render, screen, fireEvent } from '@testing-library/react';
import { waitFor } from '@testing-library/dom';
import '@testing-library/jest-dom';
import { IntlProvider } from 'react-intl';
import PrimeLoLeaderBoard from '@components/ALMLpLeaderBoard/ALMLpLeaderBoard';

// Mock data
const mockCurrentUser = {
  id: 'user-1',
  name: 'Current User',
  points: 100,
  rank: 5,
  avatarUrl: 'https://example.com/user1.jpg',
};

const mockLeaderBoardList = [
  {
    id: 'user-2',
    name: 'Leader 1',
    points: 500,
    rank: 1,
    avatarUrl: 'https://example.com/leader1.jpg',
  },
  {
    id: 'user-3',
    name: 'Leader 2',
    points: 400,
    rank: 2,
    avatarUrl: 'https://example.com/leader2.jpg',
  },
  {
    id: 'user-4',
    name: 'Leader 3',
    points: 300,
    rank: 3,
    avatarUrl: 'https://example.com/leader3.jpg',
  },
  {
    id: 'user-5',
    name: 'Leader 4',
    points: 200,
    rank: 4,
    avatarUrl: 'https://example.com/leader4.jpg',
  },
  {
    id: 'user-1',
    name: 'Current User',
    points: 100,
    rank: 5,
    avatarUrl: 'https://example.com/user1.jpg',
  },
];

const mockGamificationRules = [
  { name: 'Early Completion', enabled: true, count: 3, points: 50 },
  { name: 'Better Assessment', enabled: true, count: 5, points: 30 },
  { name: 'Comprehensive Learner', enabled: true, count: 10, points: 100 },
];

const mockTraining = {
  id: 'training-1',
  attributes: { name: 'Test Training' },
} as any;

const mockTrainingInstance = {
  id: 'instance-1',
} as any;

// Mock hooks
jest.mock('@hooks/lpLeaderBoard');

// Mock utilities
jest.mock('@utils/translationService', () => ({
  GetTranslation: (key: string) => key,
  GetTranslationsReplaced: (key: string, replacements: any) =>
    `${key}-${JSON.stringify(replacements)}`,
}));

jest.mock('@utils/global', () => ({
  getALMObject: jest.fn(() => ({
    handleLpLeaderBoardSeeAllModal: jest.fn(),
  })),
  getWidgetConfig: jest.fn(() => ({
    disableLeaderBoardWidgetLink: false,
  })),
  getALMConfig: jest.fn(() => ({
    graphqlProxyPath: '',
    commerceURL: 'https://example.com',
  })),
}));

// Mock child component
jest.mock('@components/ALMLpLeaderBoard/ALMLpLeaderBoardItem', () => {
  return function MockALMLeaderBoardItem(props: any) {
    return (
      <div data-testid={`leaderboard-item-${props.learnerName}`}>
        <span>{props.learnerName}</span>
        <span>{props.learnerPoints} points</span>
        <span>Rank: {props.learnerRank}</span>
      </div>
    );
  };
});

// Mock modal
jest.mock('@components/Common/AlmModalDialog', () => ({
  AlmModalDialog: ({ title, body, closeDialog }: any) => (
    <div data-testid="modal">
      <div>{title}</div>
      <div>{body}</div>
      <button onClick={closeDialog}>Close</button>
    </div>
  ),
}));

// Mock image
jest.mock('../../../almLib/assets/images/lo_leaderboard_dots.svg', () => 'dots.svg');

describe('PrimeLoLeaderBoard', () => {
  const renderComponent = (props = {}) => {
    return render(
      <IntlProvider locale="en">
        <PrimeLoLeaderBoard
          training={mockTraining}
          trainingInstanceId={mockTrainingInstance}
          {...props}
        />
      </IntlProvider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    const { useLeaderBoard } = require('@hooks/lpLeaderBoard');
    useLeaderBoard.mockReturnValue({
      leaderBoardList: mockLeaderBoardList,
      currentUser: mockCurrentUser,
      gamificationRules: mockGamificationRules,
      isGamificationEnabled: true,
    });
  });

  describe('Basic Rendering', () => {
    it('should render the component when gamification is enabled', () => {
      const { container } = renderComponent();
      expect(container.querySelector('[data-automationid="leaderboard-container"]')).not.toBeNull();
    });

    it('should not render when gamification is disabled', () => {
      // Reset the mock before this specific test
      jest.clearAllMocks();
      const { useLeaderBoard } = require('@hooks/lpLeaderBoard');
      useLeaderBoard.mockReturnValue({
        leaderBoardList: mockLeaderBoardList,
        currentUser: mockCurrentUser,
        gamificationRules: mockGamificationRules,
        isGamificationEnabled: false,
      });

      const { container } = renderComponent();
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Collapse/Expand Functionality', () => {
    it('should show content by default (not collapsed)', () => {
      renderComponent();
      expect(screen.getByText('alm.leaderboard.rules')).toHaveTextContent('alm.leaderboard.rules');
    });

    it('should toggle collapse state on button click', () => {
      const { container } = renderComponent();
      const toggleButton = container.querySelector(
        '[data-automationid="toggleShowHide"]'
      ) as HTMLElement;

      // Initially not collapsed - content visible
      expect(screen.getByText('alm.leaderboard.rules')).toBeInTheDocument();

      // Click to collapse
      fireEvent.click(toggleButton);

      // Content should be hidden
      expect(screen.queryByText('alm.leaderboard.rules')).not.toBeInTheDocument();

      // Click to expand again
      fireEvent.click(toggleButton);

      // Content should be visible again
      expect(screen.getByText('alm.leaderboard.rules')).toBeInTheDocument();
    });
  });

  describe('Leaderboard Display - ALL_LEARNERS', () => {
    it('should display top 5 learners when current user is in list', () => {
      renderComponent();

      expect(screen.getByTestId('leaderboard-item-Leader 1')).toHaveTextContent('Leader 1');
      expect(screen.getByTestId('leaderboard-item-Leader 2')).toHaveTextContent('Leader 2');
      expect(screen.getByTestId('leaderboard-item-Leader 3')).toHaveTextContent('Leader 3');
      expect(screen.getByTestId('leaderboard-item-Leader 4')).toHaveTextContent('Leader 4');
      // Current user is displayed as "alm.leaderboard.text.you" translation key
      expect(screen.getByTestId('leaderboard-item-alm.leaderboard.text.you')).toHaveTextContent('alm.leaderboard.text.you');
    });

    it('should display "You" translation for current user', () => {
      renderComponent();
      // Current user should be in the list
      expect(screen.getByText('alm.leaderboard.text.you')).toBeInTheDocument();
    });
  });

  describe('Leaderboard Display - TOP_LEARNERS', () => {
    it('should display top 3 learners plus current user when not in top 5', () => {
      jest.clearAllMocks();
      const { useLeaderBoard } = require('@hooks/lpLeaderBoard');
      const currentUserNotInList = {
        id: 'user-99',
        name: 'Low Rank User',
        points: 10,
        rank: 50,
        avatarUrl: 'https://example.com/user99.jpg',
      };

      useLeaderBoard.mockReturnValue({
        leaderBoardList: mockLeaderBoardList.slice(0, 4),
        currentUser: currentUserNotInList,
        gamificationRules: mockGamificationRules,
        isGamificationEnabled: true,
      });

      renderComponent();

      // Should show top 3 learners
      expect(screen.getByTestId('leaderboard-item-Leader 1')).toHaveTextContent('Leader 1');
      expect(screen.getByTestId('leaderboard-item-Leader 2')).toHaveTextContent('Leader 2');
      expect(screen.getByTestId('leaderboard-item-Leader 3')).toHaveTextContent('Leader 3');

      // Should show dots image
      const dotsImage = screen.getByAltText('gamification.points.achieved.img');
      expect(dotsImage).toHaveAttribute('src', 'dots.svg');

      // Should show current user with "You" label
      expect(screen.getByText('alm.leaderboard.text.you')).toBeInTheDocument();
    });
  });

  describe('Leaderboard Display - NONE', () => {
    it('should show no activity message when leaderboard is empty', () => {
      jest.clearAllMocks();
      const { useLeaderBoard } = require('@hooks/lpLeaderBoard');
      useLeaderBoard.mockReturnValue({
        leaderBoardList: [],
        currentUser: mockCurrentUser,
        gamificationRules: mockGamificationRules,
        isGamificationEnabled: true,
      });

      renderComponent();
      expect(screen.getByText('alm.lo.leaderboard.noActivity')).toHaveTextContent('alm.lo.leaderboard.noActivity');
    });

    it('should show no activity message when all points are 0', () => {
      jest.clearAllMocks();
      const { useLeaderBoard } = require('@hooks/lpLeaderBoard');
      useLeaderBoard.mockReturnValue({
        leaderBoardList: [{ ...mockLeaderBoardList[0], points: 0 }],
        currentUser: mockCurrentUser,
        gamificationRules: mockGamificationRules,
        isGamificationEnabled: true,
      });

      renderComponent();
      expect(screen.getByText('alm.lo.leaderboard.noActivity')).toHaveTextContent('alm.lo.leaderboard.noActivity');
    });
  });

  describe('Rules Modal', () => {
    it('should open rules modal on click', async () => {
      renderComponent();
      const rulesLink = screen.getByText('alm.leaderboard.rules');

      fireEvent.click(rulesLink);

      await waitFor(() => {
        expect(screen.getByTestId('modal')).toHaveAttribute('data-testid', 'modal');
      });
    });

    it('should display gamification rules in modal', async () => {
      renderComponent();
      const rulesLink = screen.getByText('alm.leaderboard.rules');

      fireEvent.click(rulesLink);

      await waitFor(() => {
        const modal = screen.getByTestId('modal');
        expect(modal.textContent).toContain('lpi.earlyCompletion.title');
        expect(modal.textContent).toContain('lpi.betterResults.title');
        expect(modal.textContent).toContain('lpi.additionalLearning.title');
      });
    });

    it('should close rules modal', async () => {
      renderComponent();
      const rulesLink = screen.getByText('alm.leaderboard.rules');

      fireEvent.click(rulesLink);

      await waitFor(() => {
        expect(screen.getByTestId('modal')).toHaveAttribute('data-testid', 'modal');
      });

      const closeButton = screen.getByText('Close');
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
      });
    });
  });

  describe('See All Modal', () => {
    it('should render "View All" link when not NONE display', () => {
      renderComponent();
      expect(screen.getByText('text.viewAll')).toBeInTheDocument();
    });

    it('should call handleLpLeaderBoardSeeAllModal on click', () => {
      const { getALMObject } = require('@utils/global');
      const mockHandleSeeAll = jest.fn();
      getALMObject.mockReturnValue({
        handleLpLeaderBoardSeeAllModal: mockHandleSeeAll,
      });

      renderComponent();
      const viewAllLink = screen.getByText('text.viewAll');

      fireEvent.click(viewAllLink);

      expect(mockHandleSeeAll).toHaveBeenCalledWith('training-1', 'instance-1');
    });

    it('should not render "View All" when leaderboard is NONE', () => {
      jest.clearAllMocks();
      const { useLeaderBoard } = require('@hooks/lpLeaderBoard');
      useLeaderBoard.mockReturnValue({
        leaderBoardList: [],
        currentUser: mockCurrentUser,
        gamificationRules: mockGamificationRules,
        isGamificationEnabled: true,
      });

      renderComponent();
      expect(screen.queryByText('text.viewAll')).not.toBeInTheDocument();
    });

    it('should not render "View All" when widget link is disabled', () => {
      const { getWidgetConfig } = require('@utils/global');
      getWidgetConfig.mockReturnValue({
        disableLeaderBoardWidgetLink: true,
      });

      renderComponent();
      expect(screen.queryByText('text.viewAll')).not.toBeInTheDocument();
    });
  });

  describe('Gamification Rules Display', () => {
    it('should display enabled early completion rule', async () => {
      renderComponent();
      const rulesLink = screen.getByText('alm.leaderboard.rules');
      fireEvent.click(rulesLink);

      await waitFor(() => {
        expect(screen.getByText('lpi.earlyCompletion.title')).toHaveTextContent('lpi.earlyCompletion.title');
      });
    });

    it('should display enabled better assessment rule', async () => {
      renderComponent();
      const rulesLink = screen.getByText('alm.leaderboard.rules');
      fireEvent.click(rulesLink);

      await waitFor(() => {
        expect(screen.getByText('lpi.betterResults.title')).toHaveTextContent('lpi.betterResults.title');
      });
    });

    it('should display enabled comprehensive learner rule', async () => {
      renderComponent();
      const rulesLink = screen.getByText('alm.leaderboard.rules');
      fireEvent.click(rulesLink);

      await waitFor(() => {
        expect(screen.getByText('lpi.additionalLearning.title')).toHaveTextContent('lpi.additionalLearning.title');
      });
    });

    it('should not display disabled rules', () => {
      jest.clearAllMocks();
      const { useLeaderBoard } = require('@hooks/lpLeaderBoard');
      useLeaderBoard.mockReturnValue({
        leaderBoardList: mockLeaderBoardList,
        currentUser: mockCurrentUser,
        gamificationRules: [{ name: 'Early Completion', enabled: false, count: 3, points: 50 }],
        isGamificationEnabled: true,
      });

      renderComponent();
      const rulesLink = screen.getByText('alm.leaderboard.rules');
      fireEvent.click(rulesLink);

      expect(screen.queryByText('lpi.earlyCompletion.title')).not.toBeInTheDocument();
    });
  });
});
