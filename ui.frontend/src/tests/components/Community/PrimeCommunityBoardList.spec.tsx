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
import { waitFor } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';

const mockFetchBoards = jest.fn();
const mockLoadMoreBoards = jest.fn();
const mockGetQueryParamsFromUrl = jest.fn();
const mockUseBoards = jest.fn();
const mockUsePosts = jest.fn();

jest.mock('../../../almLib/hooks/community', () => ({
  useBoards: (...args: any[]) => mockUseBoards(...args),
  usePosts: (...args: any[]) => mockUsePosts(...args),
}));

jest.mock('../../../almLib/utils/global', () => ({
  getQueryParamsFromUrl: () => mockGetQueryParamsFromUrl(),
}));

jest.mock('../../../almLib/components/Common/ALMErrorBoundary', () => ({
  ALMErrorBoundary: ({ children }: any) => <div data-testid="error-boundary">{children}</div>,
}));

jest.mock('../../../almLib/components/Common/ALMLoader', () => ({
  ALMLoader: () => <div data-testid="loader">Loading...</div>,
}));

jest.mock('../../../almLib/components/Community/PrimeCommunityBoardFilters', () => ({
  PrimeCommunityBoardFilters: ({ sortFilterChangeHandler, skillFilterChangeHandler, skills, selectedSkill }: any) => (
    <div data-testid="board-filters">
      <button onClick={() => sortFilterChangeHandler('-dateCreated')} data-testid="sort-filter-btn">Sort</button>
      <button onClick={() => skillFilterChangeHandler('skill123')} data-testid="skill-filter-btn">Filter Skill</button>
      <span data-testid="skills-count">{skills?.length || 0}</span>
      <span data-testid="selected-skill">{selectedSkill}</span>
    </div>
  ),
}));

jest.mock('../../../almLib/components/Community/PrimeCommunityBoardsContainer', () => ({
  PrimeCommunityBoardsContainer: ({ boards, loadMoreBoards, hasMoreItems }: any) => (
    <div data-testid="boards-container">
      <div data-testid="boards-count">{boards?.length || 0}</div>
      <button onClick={loadMoreBoards} data-testid="load-more-btn">Load More</button>
      <span data-testid="has-more">{hasMoreItems ? 'yes' : 'no'}</span>
    </div>
  ),
}));

jest.mock('../../../almLib/components/Community/PrimeCommunityMobileBackBanner', () => ({
  PrimeCommunityMobileBackBanner: () => <div data-testid="mobile-back-banner">Back</div>,
}));

jest.mock('../../../almLib/components/Community/PrimeCommunityMobileScrollToTop', () => ({
  PrimeCommunityMobileScrollToTop: () => <div data-testid="mobile-scroll-top">Scroll Top</div>,
}));

jest.mock('../../../almLib/components/Community/PrimeCommunityPost', () => ({
  PrimeCommunityPost: ({ post }: any) => <div data-testid={`post-${post.id}`}>{post.title}</div>,
}));

jest.mock('../../../almLib/components/Community/PrimeCommunitySearch', () => ({
  PrimeCommunitySearch: ({ searchCountHandler, showLoaderHandler, searchModeHandler, resetSearchHandler, placeHolderText }: any) => (
    <div data-testid="search-component">
      <input placeholder={placeHolderText} data-testid="search-input" />
      <button
        onClick={() => {
          searchModeHandler(true);
          showLoaderHandler(false);
          searchCountHandler([{ id: '1' }, { id: '2' }], 'test query');
        }}
        data-testid="search-btn"
      >
        Search
      </button>
      <button onClick={resetSearchHandler} data-testid="reset-search-btn">Reset</button>
    </div>
  ),
}));

import PrimeCommunityBoardList from '../../../almLib/components/Community/PrimeCommunityBoardList/PrimeCommunityBoardList';

describe('PrimeCommunityBoardList', () => {
  const renderWithIntl = (component: React.ReactElement) =>
    render(<IntlProvider locale="en">{component}</IntlProvider>);

  const defaultBoardsMock = {
    items: [{ id: 'board1' }, { id: 'board2' }],
    fetchBoards: mockFetchBoards,
    loadMoreBoards: mockLoadMoreBoards,
    hasMoreItems: true,
    skills: [{ id: 'skill1' }, { id: 'skill2' }],
    currentSkill: '',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetQueryParamsFromUrl.mockReturnValue({ skill: '' });
    mockFetchBoards.mockResolvedValue(undefined);
    mockUseBoards.mockReturnValue(defaultBoardsMock);
    mockUsePosts.mockReturnValue({ posts: [] });
  });

  describe('Initial rendering', () => {
    it('renders filters, search, and mobile child components', () => {
      renderWithIntl(<PrimeCommunityBoardList />);
      expect(screen.queryByTestId('board-filters')).not.toBeNull();
      expect(screen.queryByTestId('search-component')).not.toBeNull();
      expect(screen.queryByTestId('mobile-back-banner')).not.toBeNull();
      expect(screen.queryByTestId('mobile-scroll-top')).not.toBeNull();
    });

    it('passes boards from useBoards to the boards container', () => {
      renderWithIntl(<PrimeCommunityBoardList />);
      expect(screen.getByTestId('boards-count').textContent).toBe('2');
    });

    it('shows "No boards found" when items array is empty', async () => {
      mockUseBoards.mockReturnValue({ ...defaultBoardsMock, items: [] });
      renderWithIntl(<PrimeCommunityBoardList />);
      await waitFor(() => expect(screen.queryByText('No boards found')).not.toBeNull());
    });
  });

  describe('Sort filter', () => {
    it('calls fetchBoards with the new sort value and current skill on sort change', async () => {
      renderWithIntl(<PrimeCommunityBoardList />);
      userEvent.click(screen.getByTestId('sort-filter-btn'));
      await waitFor(() => expect(mockFetchBoards).toHaveBeenCalledWith('-dateCreated', ''));
    });

    it('shows loader while fetching after a sort change', () => {
      renderWithIntl(<PrimeCommunityBoardList />);
      userEvent.click(screen.getByTestId('sort-filter-btn'));
      expect(screen.queryByTestId('loader')).not.toBeNull();
    });

    it('retains the previously selected skill when sort changes', async () => {
      renderWithIntl(<PrimeCommunityBoardList />);
      userEvent.click(screen.getByTestId('skill-filter-btn'));
      await waitFor(() => expect(mockFetchBoards).toHaveBeenCalledWith('-dateUpdated', 'skill123'));

      userEvent.click(screen.getByTestId('sort-filter-btn'));
      await waitFor(() => expect(mockFetchBoards).toHaveBeenCalledWith('-dateCreated', 'skill123'));
    });
  });

  describe('Skill filter', () => {
    it('calls fetchBoards with default sort and selected skill on skill change', async () => {
      renderWithIntl(<PrimeCommunityBoardList />);
      userEvent.click(screen.getByTestId('skill-filter-btn'));
      await waitFor(() => expect(mockFetchBoards).toHaveBeenCalledWith('-dateUpdated', 'skill123'));
    });

    it('shows loader while fetching after a skill change', () => {
      renderWithIntl(<PrimeCommunityBoardList />);
      userEvent.click(screen.getByTestId('skill-filter-btn'));
      expect(screen.queryByTestId('loader')).not.toBeNull();
    });

    it('passes currentSkill from useBoards as selectedSkill to the filter component', () => {
      mockUseBoards.mockReturnValue({ ...defaultBoardsMock, currentSkill: 'javascript' });
      renderWithIntl(<PrimeCommunityBoardList />);
      expect(screen.getByTestId('selected-skill').textContent).toBe('javascript');
    });

    it('passes the skills array from useBoards to the filter component', () => {
      mockUseBoards.mockReturnValue({
        ...defaultBoardsMock,
        skills: [{ id: 's1' }, { id: 's2' }, { id: 's3' }],
      });
      renderWithIntl(<PrimeCommunityBoardList />);
      expect(screen.getByTestId('skills-count').textContent).toBe('3');
    });
  });

  describe('Load more', () => {
    it('calls loadMoreBoards when load more is clicked', () => {
      renderWithIntl(<PrimeCommunityBoardList />);
      userEvent.click(screen.getByTestId('load-more-btn'));
      expect(mockLoadMoreBoards).toHaveBeenCalledTimes(1);
    });

    it('passes hasMoreItems=true to the boards container', () => {
      renderWithIntl(<PrimeCommunityBoardList />);
      expect(screen.getByTestId('has-more').textContent).toBe('yes');
    });

    it('passes hasMoreItems=false to the boards container', () => {
      mockUseBoards.mockReturnValue({ ...defaultBoardsMock, hasMoreItems: false });
      renderWithIntl(<PrimeCommunityBoardList />);
      expect(screen.getByTestId('has-more').textContent).toBe('no');
    });
  });

  describe('Search mode', () => {
    it('shows result count, query, and Clear; hides boards container on search', async () => {
      renderWithIntl(<PrimeCommunityBoardList />);
      userEvent.click(screen.getByTestId('search-btn'));
      await waitFor(() => {
        expect(screen.queryByText(/2 result\(s\) found for/)).not.toBeNull();
        expect(screen.queryByText(/'test query'/)).not.toBeNull();
        expect(screen.queryByText(/Clear/)).not.toBeNull();
        expect(screen.queryByTestId('boards-container')).toBeNull();
      });
    });

    it('renders posts in search mode when posts are available', async () => {
      mockUsePosts.mockReturnValue({
        posts: [{ id: 'post1', title: 'Post 1' }, { id: 'post2', title: 'Post 2' }],
      });
      renderWithIntl(<PrimeCommunityBoardList />);
      userEvent.click(screen.getByTestId('search-btn'));
      await waitFor(() => {
        expect(screen.getByTestId('post-post1').textContent).toBe('Post 1');
        expect(screen.getByTestId('post-post2').textContent).toBe('Post 2');
      });
    });

    it('clicking the Clear button resets search mode and re-fetches boards', async () => {
      renderWithIntl(<PrimeCommunityBoardList />);
      userEvent.click(screen.getByTestId('search-btn'));
      await waitFor(() => expect(screen.queryByText(/Clear/)).not.toBeNull());

      userEvent.click(screen.getByText(/Clear/).closest('button')!);

      await waitFor(() => expect(mockFetchBoards).toHaveBeenCalled());
      expect(screen.queryByTestId('boards-container')).not.toBeNull();
    });

    it('resetSearchHandler from search component prop re-fetches boards', async () => {
      renderWithIntl(<PrimeCommunityBoardList />);
      userEvent.click(screen.getByTestId('reset-search-btn'));
      await waitFor(() => expect(mockFetchBoards).toHaveBeenCalled());
    });
  });

  describe('Query parameters', () => {
    it('passes skill from URL query params to useBoards', () => {
      mockGetQueryParamsFromUrl.mockReturnValue({ skill: 'react' });
      renderWithIntl(<PrimeCommunityBoardList />);
      expect(mockUseBoards).toHaveBeenCalledWith('-dateUpdated', 'react');
    });

    it('defaults skill to empty string when query params are null', () => {
      mockGetQueryParamsFromUrl.mockReturnValue(null);
      renderWithIntl(<PrimeCommunityBoardList />);
      expect(mockUseBoards).toHaveBeenCalledWith('-dateUpdated', '');
    });
  });

  describe('Filter state persistence', () => {
    it('resetSearch re-fetches with the saved skill after skill filter was applied', async () => {
      renderWithIntl(<PrimeCommunityBoardList />);

      userEvent.click(screen.getByTestId('skill-filter-btn'));
      await waitFor(() => expect(mockFetchBoards).toHaveBeenCalledWith('-dateUpdated', 'skill123'));

      userEvent.click(screen.getByTestId('search-btn'));
      await waitFor(() => expect(screen.queryByText(/result\(s\) found for/)).not.toBeNull());

      userEvent.click(screen.getByTestId('reset-search-btn'));
      await waitFor(() => expect(mockFetchBoards).toHaveBeenCalledWith('-dateUpdated', 'skill123'));
    });
  });
});
