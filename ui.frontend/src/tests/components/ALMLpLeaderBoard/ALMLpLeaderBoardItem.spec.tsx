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
import { render, screen } from '@testing-library/react';
import ALMLeaderBoardItem from '@components/ALMLpLeaderBoard/ALMLpLeaderBoardItem';

jest.mock('@utils/translationService', () => ({
  GetTranslation: (key: string) => key,
  GetTranslationReplaced: (key: string, replacement: any) => `${key}-${replacement}`,
}));

jest.mock('@utils/inline_svg', () => ({
  DEFAULT_USER_AVATAR_SVG: () => <svg data-testid="default-avatar" />,
}));

const defaultProps = {
  learnerName: 'John Doe',
  learnerPoints: 150,
  learnerRank: 1,
  learnerImageUrl: 'https://example.com/avatar.jpg',
};

describe('ALMLeaderBoardItem', () => {
  it('render_rankDiffersFromPrevious_showsRankAndLeaderBoardItemClass', () => {
    const { container } = render(
      <ALMLeaderBoardItem {...defaultProps} learnerRank={2} previousLearnerRank={1} />
    );

    expect(container.querySelector(`[data-automationid="Rank of John Doe"]`)?.textContent).toBe('2.');
    expect(container.querySelector('div[class*="leaderBoardItem"]')).not.toBeNull();
    expect(container.querySelector('div[class*="leaderBoardExistingItem"]')).toBeNull();
  });

  it('render_rankSameAsPrevious_hidesRankAndUsesExistingItemClass', () => {
    const { container } = render(
      <ALMLeaderBoardItem {...defaultProps} learnerRank={2} previousLearnerRank={2} />
    );

    expect(container.querySelector(`[data-automationid="Rank of John Doe"]`)).toBeNull();
    expect(container.querySelector('div[class*="leaderBoardExistingItem"]')).not.toBeNull();
  });

  it('render_withImageUrl_showsImg', () => {
    const { container } = render(<ALMLeaderBoardItem {...defaultProps} />);

    const img = container.querySelector('img') as HTMLImageElement;
    expect(img).not.toBeNull();
    expect(img.src).toBe('https://example.com/avatar.jpg');
  });

  it('render_emptyImageUrl_showsDefaultAvatar', () => {
    render(<ALMLeaderBoardItem {...defaultProps} learnerImageUrl="" />);

    expect(screen.getByTestId('default-avatar')).not.toBeNull();
    expect(screen.queryByRole('img')).toBeNull();
  });

  it('render_currentUser_appliesHighlightClass', () => {
    const { container } = render(
      <ALMLeaderBoardItem {...defaultProps} learnerImageUrl="" isCurrentUser={true} />
    );

    expect(container.querySelector('[class*="highlightForCurrentUser"]')).not.toBeNull();
  });

  it('render_notCurrentUser_noHighlightClass', () => {
    const { container } = render(
      <ALMLeaderBoardItem {...defaultProps} isCurrentUser={false} />
    );

    expect(container.querySelector('[class*="highlightForCurrentUser"]')).toBeNull();
  });
});
