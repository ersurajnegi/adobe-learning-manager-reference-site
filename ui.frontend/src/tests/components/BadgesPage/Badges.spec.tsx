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
import '@testing-library/jest-dom/extend-expect';
import { render } from '@testing-library/react';

// ─── Module mocks (factories only — implementations set in beforeEach) ────────

jest.mock('@hooks/badges', () => ({ useBadges: jest.fn() }));
jest.mock('@hooks/loadMore', () => ({ useLoadMore: jest.fn() }));

jest.mock('@components/Common/ALMLoader', () => ({
  ALMLoader: () => <div data-testid="alm-loader" />,
}));

jest.mock('@components/Badges/BadgeList', () => ({
  BadgeList: ({ badges }: any) => (
    <div data-testid="badge-list" data-count={badges?.length} />
  ),
}));

jest.mock('@utils/translationService', () => ({
  GetTranslation: (key: string) => key,
}));

jest.mock('@utils/inline_svg', () => ({
  EMPTY_STATE_CARD: () => <svg data-testid="empty-state-icon" />,
}));

jest.mock('@utils/constants', () => ({
  BADGES_EXL_URL: 'https://example.com/badges-info',
}));

// ─── Imports (after mocks) ────────────────────────────────────────────────────

import Badges from '@components/Badges/BadgesPage/Badges';
import { useBadges } from '@hooks/badges';
import { useLoadMore } from '@hooks/loadMore';

// ─── Test data ────────────────────────────────────────────────────────────────

const BADGES = [
  { id: 'badge-1', badge: { name: 'Badge 1' }, dateAchieved: '2024-12-31', model: { id: 'lo-1', loType: 'course' } },
  { id: 'badge-2', badge: { name: 'Badge 2' }, dateAchieved: '2024-11-15', model: { id: 'lo-2', loType: 'course' } },
];

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Badges', () => {
  let mockLoadMoreBadge: jest.Mock;

  beforeEach(() => {
    mockLoadMoreBadge = jest.fn();
    (useBadges as jest.Mock).mockReturnValue({
      badges: [],
      loadMoreBadge: mockLoadMoreBadge,
      isLoading: false,
      handleDownloadPdfClick: jest.fn(),
      handleDownloadImgClick: jest.fn(),
    });
  });

  // ─── Three-way content branch ──────────────────────────────────────────────

  describe('content state branches', () => {
    it('loaderShown_andOtherContentHidden_whenIsLoading', () => {
      (useBadges as jest.Mock).mockReturnValue({
        badges: [],
        loadMoreBadge: mockLoadMoreBadge,
        isLoading: true,
        handleDownloadPdfClick: jest.fn(),
        handleDownloadImgClick: jest.fn(),
      });
      const { getByTestId, queryByTestId } = render(<Badges />);
      expect(getByTestId('alm-loader')).toBeInTheDocument();
      expect(queryByTestId('badge-list')).not.toBeInTheDocument();
      expect(queryByTestId('empty-state-icon')).not.toBeInTheDocument();
    });

    it('badgeListShown_withCorrectCount_andOtherContentHidden_whenBadgesExist', () => {
      (useBadges as jest.Mock).mockReturnValue({
        badges: BADGES,
        loadMoreBadge: mockLoadMoreBadge,
        isLoading: false,
        handleDownloadPdfClick: jest.fn(),
        handleDownloadImgClick: jest.fn(),
      });
      const { getByTestId, queryByTestId } = render(<Badges />);
      expect(getByTestId('badge-list')).toHaveAttribute('data-count', '2');
      expect(queryByTestId('alm-loader')).not.toBeInTheDocument();
      expect(queryByTestId('empty-state-icon')).not.toBeInTheDocument();
    });

    it('emptyStateShown_andOtherContentHidden_whenBadgesEmpty', () => {
      const { getByTestId, queryByTestId } = render(<Badges />);
      expect(getByTestId('empty-state-icon')).toBeInTheDocument();
      expect(queryByTestId('badge-list')).not.toBeInTheDocument();
      expect(queryByTestId('alm-loader')).not.toBeInTheDocument();
    });
  });

  // ─── Empty state link ──────────────────────────────────────────────────────

  describe('empty state link', () => {
    it('emptyStateLink_hasCorrectHref_opensInNewTab_withSafeRel', () => {
      const { container } = render(<Badges />);
      const link = container.querySelector('a') as HTMLAnchorElement;
      expect(link.href).toBe('https://example.com/badges-info');
      expect(link.target).toBe('_blank');
      expect(link.rel).toBe('noopener noreferrer');
    });
  });

  // ─── useLoadMore integration ───────────────────────────────────────────────

  describe('useLoadMore integration', () => {
    it('useLoadMore_calledWith_badges_callback_containerId_andRef', () => {
      (useBadges as jest.Mock).mockReturnValue({
        badges: BADGES,
        loadMoreBadge: mockLoadMoreBadge,
        isLoading: false,
        handleDownloadPdfClick: jest.fn(),
        handleDownloadImgClick: jest.fn(),
      });
      render(<Badges />);
      expect(useLoadMore).toHaveBeenCalledWith({
        items: BADGES,
        callback: mockLoadMoreBadge,
        containerId: 'badges',
        elementRef: expect.any(Object),
      });
    });
  });

  // ─── Loading to content transitions ───────────────────────────────────────

  describe('loading to content transitions', () => {
    it('transition_fromLoading_toBadges_whenDataArrives', () => {
      (useBadges as jest.Mock).mockReturnValue({
        badges: [],
        loadMoreBadge: mockLoadMoreBadge,
        isLoading: true,
        handleDownloadPdfClick: jest.fn(),
        handleDownloadImgClick: jest.fn(),
      });
      const { rerender, getByTestId, queryByTestId } = render(<Badges />);
      expect(getByTestId('alm-loader')).toBeInTheDocument();

      (useBadges as jest.Mock).mockReturnValue({
        badges: BADGES,
        loadMoreBadge: mockLoadMoreBadge,
        isLoading: false,
        handleDownloadPdfClick: jest.fn(),
        handleDownloadImgClick: jest.fn(),
      });
      rerender(<Badges />);
      expect(queryByTestId('alm-loader')).not.toBeInTheDocument();
      expect(getByTestId('badge-list')).toHaveAttribute('data-count', '2');
    });

    it('transition_fromLoading_toEmptyState_whenNoBadgesReturned', () => {
      (useBadges as jest.Mock).mockReturnValue({
        badges: [],
        loadMoreBadge: mockLoadMoreBadge,
        isLoading: true,
        handleDownloadPdfClick: jest.fn(),
        handleDownloadImgClick: jest.fn(),
      });
      const { rerender, getByTestId, queryByTestId } = render(<Badges />);
      expect(getByTestId('alm-loader')).toBeInTheDocument();

      (useBadges as jest.Mock).mockReturnValue({
        badges: [],
        loadMoreBadge: mockLoadMoreBadge,
        isLoading: false,
        handleDownloadPdfClick: jest.fn(),
        handleDownloadImgClick: jest.fn(),
      });
      rerender(<Badges />);
      expect(queryByTestId('alm-loader')).not.toBeInTheDocument();
      expect(getByTestId('empty-state-icon')).toBeInTheDocument();
    });
  });
});
