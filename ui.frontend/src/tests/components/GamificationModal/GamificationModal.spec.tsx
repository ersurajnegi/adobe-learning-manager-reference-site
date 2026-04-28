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
const mockNavigateToLeaderboardPage = jest.fn();

jest.mock('@utils/translationService', () => ({
  GetTranslation: (key: string) => {
    const map: Record<string, string> = {
      'gamification.points.achieved.img': 'Points achieved',
      'learning.improvement.msg': 'Keep learning',
      'alm.instance.view': 'View',
      'gamification.leaderBoard.link': 'Go to leaderboard',
      'gamification.text.leaderboard': 'Leaderboard',
      'text.gamification.awesome': 'Awesome!',
    };
    return map[key] ?? key;
  },
  GetTranslationReplaced: (_key: string, value: string) =>
    `Congratulations! You earned ${value} points`,
}));

jest.mock('@utils/global', () => {
  const { lightTheme } = jest.requireActual('@adobe/react-spectrum');
  return {
    getALMObject: jest.fn(),
    getALMConfig: jest.fn(),
    getModalTheme: () => lightTheme,
  };
});

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import GamificationModal from '@components/GamificationModal/GamificationModal';
import { getALMObject, getALMConfig } from '@utils/global';

const mockGetALMObject = getALMObject as jest.MockedFunction<typeof getALMObject>;
const mockGetALMConfig = getALMConfig as jest.MockedFunction<typeof getALMConfig>;

const mockCloseGamificationModal = jest.fn();

const renderModal = (awardedPoints = 100) =>
  render(
    <GamificationModal
      awardedPoints={awardedPoints}
      closeGamificationModal={mockCloseGamificationModal}
    />
  );

describe('GamificationModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetALMObject.mockReturnValue({
      navigateToLeaderboardPage: mockNavigateToLeaderboardPage,
    } as any);
    mockGetALMConfig.mockReturnValue({
      themeData: { name: 'light' },
      widgetConfig: { disableLeaderBoardWidgetLink: false },
    } as any);
  });

  it('displays awardedPoints and congratulations message', () => {
    renderModal(250);
    expect(screen.getByText('250').tagName.toLowerCase()).toBe('span');
    expect(screen.getByText('Congratulations! You earned 250 points').getAttribute('data-automationId')).toBe('gamificationCongratsMsg');
  });

  it('displays improvement message', () => {
    renderModal();
    expect(screen.getByText('Keep learning').getAttribute('data-automationId')).toBe('learningImprovementMsg');
  });

  it('renders image with correct src and alt text', () => {
    renderModal();
    const img = screen.getByAltText('Points achieved');
    expect(img.tagName.toLowerCase()).toBe('img');
  });

  it('calls closeGamificationModal when Awesome button is clicked', () => {
    renderModal();
    userEvent.click(screen.getByText('Awesome!'));
    expect(mockCloseGamificationModal).toHaveBeenCalledTimes(1);
  });

  describe('Leaderboard link', () => {
    it('shows leaderboard link and calls navigateToLeaderboardPage on click', () => {
      renderModal();
      const link = screen.getByText('Leaderboard').closest('a')!;
      expect(link.getAttribute('aria-label')).toBe('Go to leaderboard');
      userEvent.click(link);
      expect(mockNavigateToLeaderboardPage).toHaveBeenCalledTimes(1);
    });

    it('hides leaderboard link when disableLeaderBoardWidgetLink is true', () => {
      mockGetALMConfig.mockReturnValue({
        themeData: { name: 'light' },
        widgetConfig: { disableLeaderBoardWidgetLink: true },
      } as any);
      renderModal();
      expect(screen.queryByText('Leaderboard')).not.toBeInTheDocument();
      expect(screen.queryByText('View')).not.toBeInTheDocument();
    });
  });
});
