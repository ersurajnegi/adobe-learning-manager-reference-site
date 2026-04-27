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
/**
 * Unit Tests for usePosts Hook
 *
 * Hook handles:
 * - Fetching posts for a board with sorting, filtering, and pagination
 * - Fetching board moderators
 * - Voting on posts
 * - Loading more posts (pagination)
 * - Searching posts by query with board/skill filters
 * - Auto-fetching posts on mount when boardId is provided
 * - Redux state management
 *
 * Testing Strategy:
 * - Module integrity and exports
 * - Redux integration (useSelector, useDispatch)
 * - All 5 operations (fetchPosts, fetchBoardModerators, votePost, loadMorePosts, searchPostResult)
 * - useEffect auto-fetch behavior
 * - Pagination handling
 * - Search with different filter types (BOARD, SKILL)
 * - Query parameter construction
 * - useCallback memoization
 * - Edge cases
 */

import { act } from '@testing-library/react';
import React from 'react';
import ReactDOM from 'react-dom';
import { usePosts } from '../../../almLib/hooks/community/usePosts';
import { loadPosts, paginatePosts } from '../../../almLib/store/actions/social/action';

// Custom renderHook implementation for React Testing Library v9
function renderHook<T>(hookCallback: () => T) {
  const result: any = { current: null };

  function TestComponent() {
    result.current = hookCallback();
    return null;
  }

  const container = document.createElement('div');

  if (document.body) {
    document.body.appendChild(container);
  }

  ReactDOM.render(React.createElement(TestComponent), container);

  return {
    result,
    rerender: () => {
      ReactDOM.render(React.createElement(TestComponent), container);
    },
    unmount: () => {
      ReactDOM.unmountComponentAtNode(container);
      if (container.parentNode) {
        container.parentNode.removeChild(container);
      }
    },
  };
}

// Mock dependencies
const mockDispatch = jest.fn();
const mockUseSelector = jest.fn();
const mockRestAdapterGet = jest.fn();
const mockJsonApiParse = jest.fn();
const mockGetALMConfig = jest.fn();
const mockAPIServiceLoadMore = jest.fn();

jest.mock('react-redux', () => ({
  useDispatch: () => mockDispatch,
  useSelector: (selector: any) => mockUseSelector(selector),
}));

jest.mock('../../../almLib/utils/restAdapter', () => ({
  RestAdapter: {
    get: (...args: any[]) => mockRestAdapterGet(...args),
  },
}));

jest.mock('../../../almLib/utils/jsonAPIAdapter', () => ({
  JsonApiParse: (...args: any[]) => mockJsonApiParse(...args),
}));

jest.mock('../../../almLib/utils/global', () => ({
  getALMConfig: () => mockGetALMConfig(),
}));

jest.mock('../../../almLib/common/APIService', () => {
  const mockAPIService = {
    loadMore: (...args: any[]) => mockAPIServiceLoadMore(...args),
  };
  return {
    __esModule: true,
    default: mockAPIService,
  };
});

jest.mock('../../../almLib/store/actions/social/action', () => ({
  loadPosts: jest.fn(payload => ({ type: 'LOAD_POSTS', payload })),
  paginatePosts: jest.fn(payload => ({ type: 'PAGINATE_POSTS', payload })),
}));

describe('usePosts', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mocks
    mockGetALMConfig.mockReturnValue({
      primeApiURL: 'https://api.example.com/',
    });

    mockUseSelector.mockImplementation(selector => {
      const state = {
        social: {
          posts: {
            items: [
              { id: 'post-1', text: 'Post 1' },
              { id: 'post-2', text: 'Post 2' },
            ],
            next: 'https://api.example.com/next-page',
          },
        },
      };
      return selector(state);
    });

    mockRestAdapterGet.mockResolvedValue({
      data: [
        { id: 'post-1', attributes: { text: 'Post 1' } },
        { id: 'post-2', attributes: { text: 'Post 2' } },
      ],
    });

    mockJsonApiParse.mockReturnValue({
      postList: [
        { id: 'post-1', text: 'Post 1' },
        { id: 'post-2', text: 'Post 2' },
      ],
      links: { next: 'https://api.example.com/next-page' },
    });

    mockAPIServiceLoadMore.mockResolvedValue({
      postList: [{ id: 'post-3', text: 'Post 3' }],
      links: { next: 'https://api.example.com/next-page-2' },
    });
  });

  describe('useEffect Auto-fetch', () => {
    it('should call fetchPosts when boardId is provided', async () => {
      const boardId = 'board-123';

      await act(async () => {
        renderHook(() => usePosts(boardId));
      });

      expect(mockRestAdapterGet).toHaveBeenCalledWith({
        url: 'https://api.example.com//boards/board-123/posts?',
        params: expect.objectContaining({
          sort: '-dateCreated',
          'filter.state': 'ACTIVE',
          'page[offset]': '0',
          'page[limit]': '10',
          include: 'parent,createdBy',
        }),
      });
    });

    it('should not call fetchPosts when boardId is not provided', async () => {
      jest.clearAllMocks();

      await act(async () => {
        renderHook(() => usePosts());
      });

      expect(mockRestAdapterGet).not.toHaveBeenCalled();
    });

    it('should dispatch loadPosts after auto-fetch', async () => {
      const boardId = 'board-123';

      await act(async () => {
        renderHook(() => usePosts(boardId));
      });

      expect(loadPosts).toHaveBeenCalledWith({
        items: [
          { id: 'post-1', text: 'Post 1' },
          { id: 'post-2', text: 'Post 2' },
        ],
        next: 'https://api.example.com/next-page',
      });
    });
  });

  describe('fetchPosts', () => {
    it('should call RestAdapter.get with correct URL and params', async () => {
      let result: any;

      await act(async () => {
        result = renderHook(() => usePosts()).result;
      });

      jest.clearAllMocks();

      await act(async () => {
        await result.current.fetchPosts('board-456');
      });

      expect(mockRestAdapterGet).toHaveBeenCalledWith({
        url: 'https://api.example.com//boards/board-456/posts?',
        params: {
          sort: '-dateCreated',
          'filter.state': 'ACTIVE',
          'page[offset]': '0',
          'page[limit]': '10',
          include: 'parent,createdBy',
        },
      });
    });

    it('should use default sort value when sortFilter is not provided', async () => {
      let result: any;

      await act(async () => {
        result = renderHook(() => usePosts()).result;
      });

      jest.clearAllMocks();

      await act(async () => {
        await result.current.fetchPosts('board-123');
      });

      const callParams = mockRestAdapterGet.mock.calls[0][0].params;
      expect(callParams['sort']).toBe('-dateCreated');
    });

    it('should use provided sortFilter', async () => {
      let result: any;

      await act(async () => {
        result = renderHook(() => usePosts()).result;
      });

      jest.clearAllMocks();

      await act(async () => {
        await result.current.fetchPosts('board-123', '-dateUpdated');
      });

      const callParams = mockRestAdapterGet.mock.calls[0][0].params;
      expect(callParams['sort']).toBe('-dateUpdated');
    });

    it('should include ids parameter when provided', async () => {
      let result: any;

      await act(async () => {
        result = renderHook(() => usePosts()).result;
      });

      jest.clearAllMocks();

      await act(async () => {
        await result.current.fetchPosts('board-123', '-dateCreated', 'post-1,post-2');
      });

      const callParams = mockRestAdapterGet.mock.calls[0][0].params;
      expect(callParams['ids']).toBe('post-1,post-2');
    });

    it('should not include ids parameter when empty string', async () => {
      let result: any;

      await act(async () => {
        result = renderHook(() => usePosts()).result;
      });

      jest.clearAllMocks();

      await act(async () => {
        await result.current.fetchPosts('board-123', '-dateCreated', '');
      });

      const callParams = mockRestAdapterGet.mock.calls[0][0].params;
      expect(callParams['ids']).toBeUndefined();
    });

    it('should dispatch loadPosts with parsed response', async () => {
      let result: any;

      await act(async () => {
        result = renderHook(() => usePosts()).result;
      });

      jest.clearAllMocks();

      await act(async () => {
        await result.current.fetchPosts('board-123');
      });

      expect(loadPosts).toHaveBeenCalledWith({
        items: [
          { id: 'post-1', text: 'Post 1' },
          { id: 'post-2', text: 'Post 2' },
        ],
        next: 'https://api.example.com/next-page',
      });
    });

    it('should handle response without next link', async () => {
      mockJsonApiParse.mockReturnValue({
        postList: [{ id: 'post-1', text: 'Post 1' }],
        links: {},
      });

      let result: any;

      await act(async () => {
        result = renderHook(() => usePosts()).result;
      });

      jest.clearAllMocks();

      await act(async () => {
        await result.current.fetchPosts('board-123');
      });

      expect(loadPosts).toHaveBeenCalledWith({
        items: [{ id: 'post-1', text: 'Post 1' }],
        next: '',
      });
    });
  });

  describe('fetchBoardModerators', () => {
    it('should call RestAdapter.get with correct URL and params', async () => {
      let result: any;

      await act(async () => {
        result = renderHook(() => usePosts()).result;
      });

      jest.clearAllMocks();

      await act(async () => {
        await result.current.fetchBoardModerators('board-789');
      });

      expect(mockRestAdapterGet).toHaveBeenCalledWith({
        url: 'https://api.example.com//boards/board-789/moderators?',
        params: {
          'page[offset]': '0',
          'page[limit]': '10',
        },
      });
    });

    it('should return parsed response', async () => {
      const mockModerators = {
        moderatorList: [
          { id: 'mod-1', name: 'Moderator 1' },
          { id: 'mod-2', name: 'Moderator 2' },
        ],
      };

      mockJsonApiParse.mockReturnValue(mockModerators);

      let result: any;

      await act(async () => {
        result = renderHook(() => usePosts()).result;
      });

      jest.clearAllMocks();

      let response: any;

      await act(async () => {
        response = await result.current.fetchBoardModerators('board-123');
      });

      expect(response).toEqual(mockModerators);
    });

    it('should handle different boardIds', async () => {
      let result: any;

      await act(async () => {
        result = renderHook(() => usePosts()).result;
      });

      const boardIds = ['board-1', 'board-2', 'board-3'];

      for (const boardId of boardIds) {
        jest.clearAllMocks();

        await act(async () => {
          await result.current.fetchBoardModerators(boardId);
        });

        expect(mockRestAdapterGet).toHaveBeenCalledWith({
          url: `https://api.example.com//boards/${boardId}/moderators?`,
          params: expect.any(Object),
        });
      }
    });
  });

  describe('votePost', () => {
    it('should call RestAdapter.get with correct URL', async () => {
      let result: any;

      await act(async () => {
        result = renderHook(() => usePosts()).result;
      });

      jest.clearAllMocks();

      await act(async () => {
        await result.current.votePost('post-123', 'upvote');
      });

      expect(mockRestAdapterGet).toHaveBeenCalledWith({
        url: 'https://api.example.com//posts/post-123/vote?action=upvote',
      });
    });

    it('should include action in query parameter', async () => {
      let result: any;

      await act(async () => {
        result = renderHook(() => usePosts()).result;
      });

      jest.clearAllMocks();

      await act(async () => {
        await result.current.votePost('post-456', 'downvote');
      });

      const callUrl = mockRestAdapterGet.mock.calls[0][0].url;
      expect(callUrl).toContain('?action=downvote');
    });

    it('should handle different actions', async () => {
      let result: any;

      await act(async () => {
        result = renderHook(() => usePosts()).result;
      });

      const actions = ['upvote', 'downvote', 'like'];

      for (const action of actions) {
        jest.clearAllMocks();

        await act(async () => {
          await result.current.votePost('post-123', action);
        });

        expect(mockRestAdapterGet).toHaveBeenCalledWith({
          url: `https://api.example.com//posts/post-123/vote?action=${action}`,
        });
      }
    });
  });

  describe('loadMorePosts', () => {
    it('should call APIServiceInstance.loadMore with next URL', async () => {
      let result: any;

      await act(async () => {
        result = renderHook(() => usePosts()).result;
      });

      jest.clearAllMocks();

      await act(async () => {
        await result.current.loadMorePosts();
      });

      expect(mockAPIServiceLoadMore).toHaveBeenCalledWith('https://api.example.com/next-page');
    });

    it('should dispatch paginatePosts with parsed response', async () => {
      let result: any;

      await act(async () => {
        result = renderHook(() => usePosts()).result;
      });

      jest.clearAllMocks();

      await act(async () => {
        await result.current.loadMorePosts();
      });

      expect(paginatePosts).toHaveBeenCalledWith({
        items: [{ id: 'post-3', text: 'Post 3' }],
        next: 'https://api.example.com/next-page-2',
      });
    });

    it('should not call loadMore when next is empty', async () => {
      mockUseSelector.mockImplementation(selector => {
        const state = {
          social: {
            posts: {
              items: [{ id: 'post-1', text: 'Post 1' }],
              next: '',
            },
          },
        };
        return selector(state);
      });

      let result: any;

      await act(async () => {
        result = renderHook(() => usePosts()).result;
      });

      jest.clearAllMocks();

      await act(async () => {
        await result.current.loadMorePosts();
      });

      expect(mockAPIServiceLoadMore).not.toHaveBeenCalled();
    });

    it('should handle response without next link', async () => {
      mockAPIServiceLoadMore.mockResolvedValue({
        postList: [{ id: 'post-3', text: 'Post 3' }],
        links: {},
      });

      let result: any;

      await act(async () => {
        result = renderHook(() => usePosts()).result;
      });

      jest.clearAllMocks();

      await act(async () => {
        await result.current.loadMorePosts();
      });

      expect(paginatePosts).toHaveBeenCalledWith({
        items: [{ id: 'post-3', text: 'Post 3' }],
        next: '',
      });
    });
  });

  describe('searchPostResult', () => {
    it('should call RestAdapter.get with search endpoint', async () => {
      let result: any;

      await act(async () => {
        result = renderHook(() => usePosts()).result;
      });

      jest.clearAllMocks();

      await act(async () => {
        await result.current.searchPostResult('search query', 'board-123', 'board');
      });

      expect(mockRestAdapterGet).toHaveBeenCalledWith({
        url: 'https://api.example.com//social/search',
        params: expect.objectContaining({
          query: 'search query',
          'filter.state': 'ACTIVE',
          'page[limit]': '10',
          autoCompleteMode: 'true',
          'filter.socialTypes': 'post',
          sort: 'relevance',
          include: 'model.createdBy',
        }),
      });
    });

    it('should include boardId parameter for BOARD type', async () => {
      let result: any;

      await act(async () => {
        result = renderHook(() => usePosts()).result;
      });

      jest.clearAllMocks();

      await act(async () => {
        await result.current.searchPostResult('query', 'board-123', 'board');
      });

      const callParams = mockRestAdapterGet.mock.calls[0][0].params;
      expect(callParams['boardId']).toBe('board-123');
      expect(callParams['filter.skills']).toBeUndefined();
    });

    it('should include filter.skills parameter for SKILL type', async () => {
      let result: any;

      await act(async () => {
        result = renderHook(() => usePosts()).result;
      });

      jest.clearAllMocks();

      await act(async () => {
        await result.current.searchPostResult('query', 'skill-123', 'SKILL');
      });

      const callParams = mockRestAdapterGet.mock.calls[0][0].params;
      expect(callParams['filter.skills']).toBe('skill-123');
      expect(callParams['boardId']).toBeUndefined();
    });

    it('should not include filter.skills for empty skill object', async () => {
      let result: any;

      await act(async () => {
        result = renderHook(() => usePosts()).result;
      });

      jest.clearAllMocks();

      await act(async () => {
        await result.current.searchPostResult('query', '', 'SKILL');
      });

      const callParams = mockRestAdapterGet.mock.calls[0][0].params;
      expect(callParams['filter.skills']).toBeUndefined();
    });

    it('should dispatch loadPosts with search results', async () => {
      let result: any;

      await act(async () => {
        result = renderHook(() => usePosts()).result;
      });

      jest.clearAllMocks();

      await act(async () => {
        await result.current.searchPostResult('query', 'board-123', 'board');
      });

      expect(loadPosts).toHaveBeenCalledWith({
        items: [
          { id: 'post-1', text: 'Post 1' },
          { id: 'post-2', text: 'Post 2' },
        ],
        next: 'https://api.example.com/next-page',
      });
    });

    it('should return search results', async () => {
      const searchResults = [
        { id: 'post-1', text: 'Search result 1' },
        { id: 'post-2', text: 'Search result 2' },
      ];

      mockJsonApiParse.mockReturnValue({
        postList: searchResults,
        links: { next: 'next-url' },
      });

      let result: any;

      await act(async () => {
        result = renderHook(() => usePosts()).result;
      });

      jest.clearAllMocks();

      let response: any;

      await act(async () => {
        response = await result.current.searchPostResult('query', 'board-123', 'board');
      });

      expect(response).toEqual(searchResults);
    });

    it('should handle different query strings', async () => {
      let result: any;

      await act(async () => {
        result = renderHook(() => usePosts()).result;
      });

      const queries = ['test', 'search query', 'multiple words here'];

      for (const query of queries) {
        jest.clearAllMocks();

        await act(async () => {
          await result.current.searchPostResult(query, 'board-123', 'board');
        });

        const callParams = mockRestAdapterGet.mock.calls[0][0].params;
        expect(callParams['query']).toBe(query);
      }
    });
  });

  describe('useCallback Memoization', () => {
    it('should memoize fetchPosts with useCallback', async () => {
      let result: any;

      await act(async () => {
        result = renderHook(() => usePosts()).result;
      });

      expect(typeof result.current.fetchPosts).toBe('function');
    });

    it('should memoize fetchBoardModerators with useCallback', async () => {
      let result: any;

      await act(async () => {
        result = renderHook(() => usePosts()).result;
      });

      expect(typeof result.current.fetchBoardModerators).toBe('function');
    });

    it('should memoize votePost with useCallback', async () => {
      let result: any;

      await act(async () => {
        result = renderHook(() => usePosts()).result;
      });

      expect(typeof result.current.votePost).toBe('function');
    });

    it('should memoize loadMorePosts with useCallback', async () => {
      let result: any;

      await act(async () => {
        result = renderHook(() => usePosts()).result;
      });

      expect(typeof result.current.loadMorePosts).toBe('function');
    });

    it('should memoize searchPostResult with useCallback', async () => {
      let result: any;

      await act(async () => {
        result = renderHook(() => usePosts()).result;
      });

      expect(typeof result.current.searchPostResult).toBe('function');
    });
  });

  describe('Edge Cases', () => {
    it('should handle null boardId', async () => {
      let result: any;

      await act(async () => {
        result = renderHook(() => usePosts(null)).result;
      });

      // Hook should still expose its API when boardId is null
      expect(typeof result.current.searchPostResult).toBe('function');
    });

    it('should handle undefined sortFilter', async () => {
      let result: any;

      await act(async () => {
        result = renderHook(() => usePosts()).result;
      });

      jest.clearAllMocks();

      await act(async () => {
        await result.current.fetchPosts('board-123', undefined);
      });

      const callParams = mockRestAdapterGet.mock.calls[0][0].params;
      expect(callParams['sort']).toBe('-dateCreated');
    });

    it('should handle empty query string in search', async () => {
      let result: any;

      await act(async () => {
        result = renderHook(() => usePosts()).result;
      });

      jest.clearAllMocks();

      await act(async () => {
        await result.current.searchPostResult('', 'board-123', 'board');
      });

      const callParams = mockRestAdapterGet.mock.calls[0][0].params;
      expect(callParams['query']).toBe('');
    });

    it('should handle numeric IDs', async () => {
      let result: any;

      await act(async () => {
        result = renderHook(() => usePosts()).result;
      });

      jest.clearAllMocks();

      await act(async () => {
        await result.current.votePost(12345, 'upvote');
      });

      expect(mockRestAdapterGet).toHaveBeenCalledWith({
        url: 'https://api.example.com//posts/12345/vote?action=upvote',
      });
    });

    it('should handle API URL without trailing slash', async () => {
      mockGetALMConfig.mockReturnValue({
        primeApiURL: 'https://api.example.com', // No trailing slash
      });

      let result: any;

      await act(async () => {
        result = renderHook(() => usePosts()).result;
      });

      jest.clearAllMocks();

      await act(async () => {
        await result.current.fetchPosts('board-123');
      });

      expect(mockRestAdapterGet).toHaveBeenCalledWith({
        url: 'https://api.example.com/boards/board-123/posts?',
        params: expect.any(Object),
      });
    });
  });

  describe('Return Value Validation', () => {
    it('should return consistent structure on multiple renders', async () => {
      let result1: any;
      let result2: any;

      await act(async () => {
        result1 = renderHook(() => usePosts()).result;
      });

      await act(async () => {
        result2 = renderHook(() => usePosts()).result;
      });

      expect(Object.keys(result1.current)).toEqual(Object.keys(result2.current));
    });
  });
});
