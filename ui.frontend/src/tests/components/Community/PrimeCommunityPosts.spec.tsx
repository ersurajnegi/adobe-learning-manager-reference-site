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
let mockPosts: any[] = [];
const mockFetchPosts = jest.fn().mockResolvedValue(undefined);
const mockLoadMorePosts = jest.fn();
const mockFetchBoardModerators = jest.fn().mockResolvedValue({
  userList: [{ id: 'mod1' }, { id: 'mod2' }],
});

jest.mock('@hooks/community', () => ({
  usePosts: () => ({
    posts: mockPosts,
    fetchPosts: mockFetchPosts,
    loadMorePosts: mockLoadMorePosts,
    hasMoreItems: true,
    fetchBoardModerators: mockFetchBoardModerators,
  }),
}));

jest.mock('@utils/global', () => ({
  getALMUser: jest.fn().mockResolvedValue({ user: { id: 'user-non-mod' } }),
}));

jest.mock('react-intl', () => {
  const actual = jest.requireActual('react-intl');
  return {
    ...actual,
    useIntl: () => ({
      formatMessage: ({ defaultMessage }: any) => defaultMessage,
    }),
  };
});

jest.mock('@components/Community/PrimeCommunityPostsContainer', () => ({
  PrimeCommunityPostsContainer: ({ loadMorePosts }: any) => (
    <div data-testid="posts-container">
      <button data-testid="load-more-btn" onClick={loadMorePosts}>Load More</button>
    </div>
  ),
}));

jest.mock('@components/Community/PrimeCommunityPostFilters', () => ({
  PrimeCommunityPostFilters: ({ sortFilterChangeHandler, clearSortFilter }: any) => (
    <div data-testid="post-filters">
      <button data-testid="filter-btn" onClick={() => sortFilterChangeHandler('-dateUpdated')}>
        Filter
      </button>
      {clearSortFilter && <span data-testid="filter-cleared" />}
    </div>
  ),
}));

jest.mock('@components/Community/PrimeCommunityAddPost', () => ({
  PrimeCommunityAddPost: ({ reloadPosts }: any) => (
    <button data-testid="add-post-btn" onClick={reloadPosts}>Add Post</button>
  ),
}));

jest.mock('@components/Community/PrimeCommunitySearch', () => ({
  PrimeCommunitySearch: ({
    searchCountHandler,
    showLoaderHandler,
    searchModeHandler,
    resetSearchHandler,
    placeHolderText,
  }: any) => (
    <div data-testid="community-search">
      <input data-testid="search-input" placeholder={placeHolderText} />
      <button
        data-testid="search-start-btn"
        onClick={() => {
          searchModeHandler(true);
          showLoaderHandler(true);
        }}
      >
        Start
      </button>
      <button
        data-testid="search-finish-btn"
        onClick={() => {
          searchCountHandler([{ id: '1' }, { id: '2' }], 'test query');
          showLoaderHandler(false);
        }}
      >
        Finish
      </button>
      <button data-testid="reset-search-btn" onClick={resetSearchHandler}>
        Reset
      </button>
    </div>
  ),
}));

jest.mock('@components/Common/ALMLoader', () => ({
  ALMLoader: () => <div data-testid="loader">Loading</div>,
}));

import { render, screen, fireEvent, wait } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import '@testing-library/jest-dom';
import { IntlProvider } from 'react-intl';
import PrimeCommunityPosts from '@components/Community/PrimeCommunityPosts/PrimeCommunityPosts';
import { PUBLIC } from '@utils/constants';
import { getALMUser } from '@utils/global';

const mockGetALMUser = getALMUser as jest.MockedFunction<typeof getALMUser>;

const messages = {
  'alm.community.search.no.label': 'No',
  'alm.community.search.resultFound': 'result(s) found for',
  'alm.community.search.clear.label': 'Clear',
  'alm.community.noPostMessage': 'No post found',
  'alm.community.searchInBoard.placeholder': 'Search within board',
};

const makeBoard = (overrides: any = {}) => ({
  id: 'board-1',
  visibility: 'PRIVATE',
  postingAllowed: false,
  ...overrides,
});

const renderPosts = (props: any = {}) =>
  render(
    <IntlProvider locale="en" messages={messages}>
      <PrimeCommunityPosts board={makeBoard()} {...props} />
    </IntlProvider>
  );

// Flush the two sequential awaited promises in the mount useEffect
const flushMountEffect = () =>
  act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });

describe('PrimeCommunityPosts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPosts.length = 0;
    mockFetchBoardModerators.mockResolvedValue({ userList: [{ id: 'mod1' }, { id: 'mod2' }] });
    mockGetALMUser.mockResolvedValue({ user: { id: 'user-non-mod' } } as any);
  });

  describe('Initial rendering', () => {
    it('shows "No post found" and hides posts container and filters when posts is empty', () => {
      renderPosts();
      expect(screen.getByText('No post found')).toBeInTheDocument();
      expect(screen.queryByTestId('posts-container')).not.toBeInTheDocument();
      expect(screen.queryByTestId('post-filters')).not.toBeInTheDocument();
    });

    it('shows posts container and filters, hides "No post found" when posts exist', () => {
      mockPosts.push({ id: 'p1' }, { id: 'p2' });
      renderPosts();
      expect(screen.getByTestId('posts-container')).toBeInTheDocument();
      expect(screen.getByTestId('post-filters')).toBeInTheDocument();
      expect(screen.queryByText('No post found')).not.toBeInTheDocument();
    });

    it('always renders the search input with the correct placeholder', () => {
      renderPosts();
      expect(screen.getByTestId('search-input')).toHaveAttribute('placeholder', 'Search within board');
    });

    it('shows no loader and no search result status initially', () => {
      renderPosts();
      expect(screen.queryByTestId('loader')).not.toBeInTheDocument();
      expect(screen.queryByText(/result\(s\) found for/)).not.toBeInTheDocument();
    });
  });

  describe('Add post permission', () => {
    it('shows AddPost immediately when board.visibility is PUBLIC', () => {
      renderPosts({ board: makeBoard({ visibility: PUBLIC }) });
      expect(screen.getByTestId('add-post-btn')).toBeInTheDocument();
    });

    it('shows AddPost immediately when board.postingAllowed is true', () => {
      renderPosts({ board: makeBoard({ postingAllowed: true }) });
      expect(screen.getByTestId('add-post-btn')).toBeInTheDocument();
    });

    it('shows AddPost after mount when user is a board moderator', async () => {
      mockGetALMUser.mockResolvedValue({ user: { id: 'mod1' } } as any);
      renderPosts();
      await wait(() => expect(screen.getByTestId('add-post-btn')).toBeInTheDocument());
    });

    it('hides AddPost after mount when none of the posting conditions are met', async () => {
      // user-non-mod is NOT in [mod1, mod2]; board is PRIVATE with postingAllowed=false
      renderPosts();
      await flushMountEffect();
      expect(screen.queryByTestId('add-post-btn')).not.toBeInTheDocument();
    });
  });

  describe('Loader', () => {
    it('shows loader while getPosts is in flight and hides it after resolution', async () => {
      renderPosts({ board: makeBoard({ postingAllowed: true }) });
      await flushMountEffect();

      fireEvent.click(screen.getByTestId('add-post-btn'));
      expect(screen.getByTestId('loader')).toBeInTheDocument();

      await act(async () => { await Promise.resolve(); });
      expect(screen.queryByTestId('loader')).not.toBeInTheDocument();
    });

    it('shows loader immediately when sort filter is applied', () => {
      mockPosts.push({ id: 'p1' });
      renderPosts();
      fireEvent.click(screen.getByTestId('filter-btn'));
      expect(screen.getByTestId('loader')).toBeInTheDocument();
    });

    it('shows loader when search starts and hides it when search finishes', () => {
      renderPosts();
      fireEvent.click(screen.getByTestId('search-start-btn'));
      expect(screen.getByTestId('loader')).toBeInTheDocument();
      fireEvent.click(screen.getByTestId('search-finish-btn'));
      expect(screen.queryByTestId('loader')).not.toBeInTheDocument();
    });
  });

  describe('Search mode', () => {
    it('shows result count and query string once search completes', () => {
      renderPosts();
      fireEvent.click(screen.getByTestId('search-start-btn'));
      fireEvent.click(screen.getByTestId('search-finish-btn'));
      expect(screen.getByText(/2.*result\(s\) found for/)).toBeInTheDocument();
      expect(screen.getByText(/'test query'/)).toBeInTheDocument();
    });

    it('shows Clear button while in search mode; clicking it hides the search status', () => {
      renderPosts();
      fireEvent.click(screen.getByTestId('search-start-btn'));
      fireEvent.click(screen.getByTestId('search-finish-btn'));
      const clearBtn = screen.getByText(/Clear/);
      expect(clearBtn).toBeInTheDocument();
      fireEvent.click(clearBtn);
      expect(screen.queryByText(/result\(s\) found for/)).not.toBeInTheDocument();
    });
  });

  describe('Sort filter', () => {
    it('calls fetchPosts with boardId, sort value, and comma-joined post IDs', async () => {
      mockPosts.push({ id: 'p1' }, { id: 'p2' }, { id: 'p3' });
      renderPosts();
      fireEvent.click(screen.getByTestId('filter-btn'));
      await act(async () => { await Promise.resolve(); });
      expect(mockFetchPosts).toHaveBeenCalledWith('board-1', '-dateUpdated', 'p1,p2,p3');
    });

    it('resets clearSortFilter to false when a new filter is applied', () => {
      mockPosts.push({ id: 'p1' });
      renderPosts();
      // Reset search sets clearSortFilter=true
      fireEvent.click(screen.getByTestId('reset-search-btn'));
      expect(screen.getByTestId('filter-cleared')).toBeInTheDocument();
      // Applying a new filter sets clearSortFilter=false
      fireEvent.click(screen.getByTestId('filter-btn'));
      expect(screen.queryByTestId('filter-cleared')).not.toBeInTheDocument();
    });
  });

  describe('Reset search', () => {
    it('hides search status, sets clearSortFilter=true, and calls fetchPosts(boardId) on reset', async () => {
      mockPosts.push({ id: 'p1' });
      renderPosts();
      fireEvent.click(screen.getByTestId('search-start-btn'));
      fireEvent.click(screen.getByTestId('search-finish-btn'));
      expect(screen.getByText(/result\(s\) found for/)).toBeInTheDocument();

      fireEvent.click(screen.getByTestId('reset-search-btn'));
      expect(screen.queryByText(/result\(s\) found for/)).not.toBeInTheDocument();
      expect(screen.getByTestId('filter-cleared')).toBeInTheDocument();

      await act(async () => { await Promise.resolve(); });
      expect(mockFetchPosts).toHaveBeenCalledWith('board-1', undefined, '');
    });
  });

  describe('Mount effects', () => {
    it('calls getALMUser and fetchBoardModerators(boardId) on mount', async () => {
      renderPosts();
      await flushMountEffect();
      expect(mockGetALMUser).toHaveBeenCalledTimes(1);
      expect(mockFetchBoardModerators).toHaveBeenCalledWith('board-1');
    });
  });
});
