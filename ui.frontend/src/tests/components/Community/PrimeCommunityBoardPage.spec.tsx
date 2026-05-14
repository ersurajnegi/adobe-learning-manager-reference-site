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
import React from 'react';
import { render, screen } from '@testing-library/react';
import PrimeCommunityBoardPage from '../../../almLib/components/Community/PrimeCommunityBoardPage/PrimeCommunityBoardPage';

const mockUseBoard = jest.fn();

jest.mock('../../../almLib/hooks/community', () => ({
  useBoard: (boardId: string) => mockUseBoard(boardId),
}));

jest.mock('../../../almLib/utils/global', () => ({
  getALMConfig: () => ({ communityBoardDetailsPath: '/community/board/:boardId' }),
  getPathParams: (_path: string, _params: string[]) => ({ boardId: 'board-123' }),
  customEncode: (value: string) => value + '-encoded',
}));

jest.mock('../../../almLib/components/Common/ALMErrorBoundary', () => ({
  ALMErrorBoundary: ({ children }: any) => <div data-testid="error-boundary">{children}</div>,
}));

jest.mock('../../../almLib/components/Community/PrimeCommunityBoard', () => ({
  PrimeCommunityBoard: ({ board, showBorder }: any) => (
    <div data-testid="community-board">
      <span data-testid="board-id">{board.id}</span>
      <span data-testid="show-border">{String(showBorder)}</span>
    </div>
  ),
}));

jest.mock('../../../almLib/components/Community/PrimeCommunityPosts', () => ({
  PrimeCommunityPosts: ({ board }: any) => (
    <div data-testid="community-posts">
      <span data-testid="posts-board-id">{board.id}</span>
    </div>
  ),
}));

jest.mock('../../../almLib/components/Community/PrimeCommunityMobileBackBanner', () => ({
  PrimeCommunityMobileBackBanner: () => <div data-testid="mobile-back-banner" />,
}));

jest.mock('../../../almLib/components/Community/PrimeCommunityMobileScrollToTop', () => ({
  PrimeCommunityMobileScrollToTop: () => <div data-testid="mobile-scroll-top" />,
}));

describe('PrimeCommunityBoardPage', () => {
  const mockBoard = { id: 'board-123', name: 'Test Board' };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseBoard.mockReturnValue({ item: mockBoard });
  });

  it('derives boardId from config path and passes the encoded value to useBoard', () => {
    render(<PrimeCommunityBoardPage />);
    expect(mockUseBoard).toHaveBeenCalledWith('board-123-encoded');
  });

  it('renders board with correct data and showBorder=false when item exists', () => {
    render(<PrimeCommunityBoardPage />);
    expect(screen.getByTestId('board-id').textContent).toBe('board-123');
    expect(screen.getByTestId('show-border').textContent).toBe('false');
    expect(screen.getByTestId('posts-board-id').textContent).toBe('board-123');
  });

  it('hides board and posts when item is null', () => {
    mockUseBoard.mockReturnValue({ item: null });
    render(<PrimeCommunityBoardPage />);
    expect(screen.queryByTestId('community-board')).toBeNull();
    expect(screen.queryByTestId('community-posts')).toBeNull();
  });

  it('always renders mobile components regardless of item state', () => {
    mockUseBoard.mockReturnValue({ item: null });
    render(<PrimeCommunityBoardPage />);
    expect(screen.queryByTestId('mobile-back-banner')).not.toBeNull();
    expect(screen.queryByTestId('mobile-scroll-top')).not.toBeNull();
  });
});
