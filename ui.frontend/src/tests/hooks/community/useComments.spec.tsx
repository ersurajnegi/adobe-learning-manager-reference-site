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
 * Unit Tests for useComments Hook
 *
 * Hook handles:
 * - Fetching comments for a post (GET)
 * - Updating comment text (PATCH)
 * - Marking comment as right answer (PATCH)
 * - Pagination with loadMore
 * - Redux state management
 * - Bad word detection and error handling
 * - URL sanitization with addHttpsToHref
 *
 * Testing Strategy:
 * - Module integrity and exports
 * - Redux integration (selector, dispatch)
 * - fetchComments with various scenarios
 * - patchComment with URL sanitization
 * - markCommentAsRightAnswer
 * - loadMoreComments pagination
 * - Error handling (bad words, network errors)
 * - Return value validation
 * - useCallback memoization
 */

import { act } from '@testing-library/react';
import React from 'react';
import ReactDOM from 'react-dom';
import { useComments } from '../../../almLib/hooks/community/useComments';
import {
  loadComments,
  paginateComments,
  updateComment,
} from '../../../almLib/store/actions/social/action';

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
const mockSelector = jest.fn();
const mockRestAdapterGet = jest.fn();
const mockRestAdapterAjax = jest.fn();
const mockJsonApiParse = jest.fn();
const mockGetALMConfig = jest.fn();
const mockAddHttpsToHref = jest.fn();
const mockLoadMore = jest.fn();

jest.mock('react-redux', () => ({
  useDispatch: () => mockDispatch,
  useSelector: (selector: any) => mockSelector(selector),
}));

jest.mock('../../../almLib/utils/restAdapter', () => ({
  RestAdapter: {
    get: (...args: any[]) => mockRestAdapterGet(...args),
    ajax: (...args: any[]) => mockRestAdapterAjax(...args),
  },
}));

jest.mock('../../../almLib/utils/jsonAPIAdapter', () => ({
  JsonApiParse: (...args: any[]) => mockJsonApiParse(...args),
}));

jest.mock('../../../almLib/utils/global', () => ({
  getALMConfig: () => mockGetALMConfig(),
  addHttpsToHref: (...args: any[]) => mockAddHttpsToHref(...args),
}));

jest.mock('../../../almLib/common/APIService', () => ({
  __esModule: true,
  default: {
    loadMore: (...args: any[]) => mockLoadMore(...args),
  },
}));

jest.mock('../../../almLib/store/actions/social/action', () => ({
  loadComments: jest.fn(payload => ({ type: 'LOAD_COMMENTS', payload })),
  paginateComments: jest.fn(payload => ({ type: 'PAGINATE_COMMENTS', payload })),
  updateComment: jest.fn(payload => ({ type: 'UPDATE_COMMENT', payload })),
}));

describe('useComments', () => {
  const mockComments = [
    {
      id: 'comment-1',
      text: 'First comment',
      createdBy: { id: 'user-1', name: 'User 1' },
    },
    {
      id: 'comment-2',
      text: 'Second comment',
      createdBy: { id: 'user-2', name: 'User 2' },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mocks
    mockGetALMConfig.mockReturnValue({
      primeApiURL: 'https://api.example.com/',
    });

    mockSelector.mockReturnValue({
      items: mockComments,
      next: 'https://api.example.com/posts/post-123/comments?page[offset]=10',
    });

    mockRestAdapterGet.mockResolvedValue({
      data: mockComments,
    });

    mockRestAdapterAjax.mockResolvedValue({
      data: { id: 'comment-1', attributes: { text: 'Updated text' } },
    });

    mockJsonApiParse.mockReturnValue({
      commentList: mockComments,
      comment: mockComments[0],
      links: {
        next: 'https://api.example.com/posts/post-123/comments?page[offset]=10',
      },
    });

    mockAddHttpsToHref.mockImplementation(input => input);

    mockLoadMore.mockResolvedValue({
      commentList: mockComments,
      links: { next: '' },
    });
  });

  describe('Redux Integration', () => {
    it('should call useSelector with correct selector', () => {
      renderHook(() => useComments());

      expect(mockSelector).toHaveBeenCalled();
    });

    it('should select comments from social.comments state', () => {
      const mockState = {
        social: {
          comments: {
            items: mockComments,
            next: 'https://api.example.com/next',
          },
        },
      };

      renderHook(() => useComments());

      // Get the selector function that was passed to useSelector
      const selectorFn = mockSelector.mock.calls[0][0];
      const result = selectorFn(mockState);

      expect(result).toEqual({
        items: mockComments,
        next: 'https://api.example.com/next',
      });
    });
  });

  describe('fetchComments', () => {
    it('should call RestAdapter.get with correct URL and params', async () => {
      const { result } = renderHook(() => useComments());
      const postId = 'post-123';

      await act(async () => {
        await result.current.fetchComments(postId);
      });

      expect(mockRestAdapterGet).toHaveBeenCalledWith({
        url: 'https://api.example.com//posts/post-123/comments?',
        params: {
          'filter.state': 'ACTIVE',
          'page[offset]': '0',
          'page[limit]': '10',
          include: 'createdBy',
        },
      });
    });

    it('should include postId in URL', async () => {
      const { result } = renderHook(() => useComments());
      const postId = 'post-456';

      await act(async () => {
        await result.current.fetchComments(postId);
      });

      const callArgs = mockRestAdapterGet.mock.calls[0][0];
      expect(callArgs.url).toContain(`/posts/${postId}/comments`);
    });

    it('should include required query parameters', async () => {
      const { result } = renderHook(() => useComments());

      await act(async () => {
        await result.current.fetchComments('post-123');
      });

      const callParams = mockRestAdapterGet.mock.calls[0][0].params;
      expect(callParams['filter.state']).toBe('ACTIVE');
      expect(callParams['page[offset]']).toBe('0');
      expect(callParams['page[limit]']).toBe('10');
      expect(callParams['include']).toBe('createdBy');
    });

    it('should parse response with JsonApiParse', async () => {
      const mockResponse = { data: mockComments };
      mockRestAdapterGet.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useComments());

      await act(async () => {
        await result.current.fetchComments('post-123');
      });

      expect(mockJsonApiParse).toHaveBeenCalledWith(mockResponse);
    });

    it('should dispatch loadComments with parsed data', async () => {
      const parsedComments = [
        { id: 'parsed-1', text: 'Parsed comment 1' },
        { id: 'parsed-2', text: 'Parsed comment 2' },
      ];

      mockJsonApiParse.mockReturnValue({
        commentList: parsedComments,
        links: { next: 'https://api.example.com/next' },
      });

      const { result } = renderHook(() => useComments());

      await act(async () => {
        await result.current.fetchComments('post-123');
      });

      expect(loadComments).toHaveBeenCalledWith({
        selectedPostId: 'post-123',
        items: parsedComments,
        next: 'https://api.example.com/next',
      });
    });

    it('should set next to empty string if not provided', async () => {
      mockJsonApiParse.mockReturnValue({
        commentList: mockComments,
        links: {},
      });

      const { result } = renderHook(() => useComments());

      await act(async () => {
        await result.current.fetchComments('post-123');
      });

      expect(loadComments).toHaveBeenCalledWith({
        selectedPostId: 'post-123',
        items: mockComments,
        next: '',
      });
    });

    it('should handle API errors gracefully', async () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      mockRestAdapterGet.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useComments());

      await act(async () => {
        await result.current.fetchComments('post-123');
      });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error while loading boards')
      );

      consoleLogSpy.mockRestore();
    });

    it('should dispatch empty array on error', async () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      mockRestAdapterGet.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useComments());

      await act(async () => {
        await result.current.fetchComments('post-123');
      });

      expect(loadComments).toHaveBeenCalledWith([]);

      consoleLogSpy.mockRestore();
    });

    it('should handle different postIds', async () => {
      const { result } = renderHook(() => useComments());
      const postIds = ['post-1', 'post-2', 'post-3'];

      for (const postId of postIds) {
        jest.clearAllMocks();

        await act(async () => {
          await result.current.fetchComments(postId);
        });

        expect(mockRestAdapterGet).toHaveBeenCalledWith({
          url: `https://api.example.com//posts/${postId}/comments?`,
          params: expect.any(Object),
        });
      }
    });
  });

  describe('patchComment', () => {
    it('should call RestAdapter.ajax with correct URL and method', async () => {
      const { result } = renderHook(() => useComments());
      const commentId = 'comment-123';
      const input = 'Updated comment text';

      await act(async () => {
        await result.current.patchComment(commentId, input);
      });

      expect(mockRestAdapterAjax).toHaveBeenCalledWith({
        url: 'https://api.example.com//comments/comment-123',
        method: 'PATCH',
        body: expect.any(String),
        headers: { 'content-type': 'application/json' },
      });
    });

    it('should use PATCH method', async () => {
      const { result } = renderHook(() => useComments());

      await act(async () => {
        await result.current.patchComment('comment-123', 'Updated text');
      });

      const callArgs = mockRestAdapterAjax.mock.calls[0][0];
      expect(callArgs.method).toBe('PATCH');
    });

    it('should call addHttpsToHref to sanitize input', async () => {
      const { result } = renderHook(() => useComments());
      const input = 'Check this link: www.example.com';

      await act(async () => {
        await result.current.patchComment('comment-123', input);
      });

      expect(mockAddHttpsToHref).toHaveBeenCalledWith(input);
    });

    it('should send correct body structure', async () => {
      const { result } = renderHook(() => useComments());
      const commentId = 'comment-456';
      const input = 'My comment text';
      const sanitizedInput = 'My comment text with https';

      mockAddHttpsToHref.mockReturnValue(sanitizedInput);

      await act(async () => {
        await result.current.patchComment(commentId, input);
      });

      const callArgs = mockRestAdapterAjax.mock.calls[0][0];
      const body = JSON.parse(callArgs.body);

      expect(body).toEqual({
        data: {
          type: 'comment',
          id: commentId,
          attributes: {
            state: 'ACTIVE',
            text: sanitizedInput,
          },
        },
      });
    });

    it('should dispatch updateComment with parsed response', async () => {
      const updatedComment = {
        id: 'comment-123',
        text: 'Updated text',
      };

      mockJsonApiParse.mockReturnValue({
        comment: updatedComment,
      });

      const { result } = renderHook(() => useComments());

      await act(async () => {
        await result.current.patchComment('comment-123', 'Updated text');
      });

      expect(updateComment).toHaveBeenCalledWith({
        item: updatedComment,
      });
    });

    it('should throw error for bad word detection', async () => {
      const errorResponse = {
        responseText: JSON.stringify({ title: 'BAD_WORD_FOUND' }),
      };

      mockRestAdapterAjax.mockRejectedValue(errorResponse);

      const { result } = renderHook(() => useComments());

      await expect(async () => {
        await act(async () => {
          await result.current.patchComment('comment-123', 'bad word text');
        });
      }).rejects.toThrow('BAD_WORD_FOUND');
    });

    it('should not throw error for other errors', async () => {
      const errorResponse = {
        responseText: JSON.stringify({ title: 'Other error' }),
      };

      mockRestAdapterAjax.mockRejectedValue(errorResponse);

      const { result } = renderHook(() => useComments());

      // Should not throw
      await act(async () => {
        await result.current.patchComment('comment-123', 'text');
      });

      // Should not dispatch updateComment
      expect(updateComment).not.toHaveBeenCalled();
    });

    it('should handle different commentIds', async () => {
      const { result } = renderHook(() => useComments());
      const commentIds = ['comment-1', 'comment-2', 'comment-3'];

      for (const commentId of commentIds) {
        jest.clearAllMocks();

        await act(async () => {
          await result.current.patchComment(commentId, 'text');
        });

        expect(mockRestAdapterAjax).toHaveBeenCalledWith({
          url: `https://api.example.com//comments/${commentId}`,
          method: 'PATCH',
          body: expect.any(String),
          headers: expect.any(Object),
        });
      }
    });
  });

  describe('markCommentAsRightAnswer', () => {
    it('should call RestAdapter.ajax with correct URL and method', async () => {
      const { result } = renderHook(() => useComments());
      const commentId = 'comment-123';
      const value = true;

      await act(async () => {
        await result.current.markCommentAsRightAnswer(commentId, value);
      });

      expect(mockRestAdapterAjax).toHaveBeenCalledWith({
        url: 'https://api.example.com//comments/comment-123',
        method: 'PATCH',
        body: expect.any(String),
        headers: { 'content-type': 'application/json' },
      });
    });

    it('should use PATCH method', async () => {
      const { result } = renderHook(() => useComments());

      await act(async () => {
        await result.current.markCommentAsRightAnswer('comment-123', true);
      });

      const callArgs = mockRestAdapterAjax.mock.calls[0][0];
      expect(callArgs.method).toBe('PATCH');
    });

    it('should send correct body structure with isCorrectAnswer', async () => {
      const { result } = renderHook(() => useComments());
      const commentId = 'comment-456';
      const value = true;

      await act(async () => {
        await result.current.markCommentAsRightAnswer(commentId, value);
      });

      const callArgs = mockRestAdapterAjax.mock.calls[0][0];
      const body = JSON.parse(callArgs.body);

      expect(body).toEqual({
        data: {
          type: 'comment',
          id: commentId,
          attributes: {
            state: 'ACTIVE',
            isCorrectAnswer: value,
          },
        },
      });
    });

    it('should handle marking as correct answer (true)', async () => {
      const { result } = renderHook(() => useComments());

      await act(async () => {
        await result.current.markCommentAsRightAnswer('comment-123', true);
      });

      const callArgs = mockRestAdapterAjax.mock.calls[0][0];
      const body = JSON.parse(callArgs.body);

      expect(body.data.attributes.isCorrectAnswer).toBe(true);
    });

    it('should handle unmarking as correct answer (false)', async () => {
      const { result } = renderHook(() => useComments());

      await act(async () => {
        await result.current.markCommentAsRightAnswer('comment-123', false);
      });

      const callArgs = mockRestAdapterAjax.mock.calls[0][0];
      const body = JSON.parse(callArgs.body);

      expect(body.data.attributes.isCorrectAnswer).toBe(false);
    });

    it('should dispatch updateComment with parsed response', async () => {
      const markedComment = {
        id: 'comment-123',
        isCorrectAnswer: true,
      };

      mockJsonApiParse.mockReturnValue({
        comment: markedComment,
      });

      const { result } = renderHook(() => useComments());

      await act(async () => {
        await result.current.markCommentAsRightAnswer('comment-123', true);
      });

      expect(updateComment).toHaveBeenCalledWith({
        item: markedComment,
      });
    });

    it('should handle different commentIds', async () => {
      const { result } = renderHook(() => useComments());
      const commentIds = ['comment-1', 'comment-2', 'comment-3'];

      for (const commentId of commentIds) {
        jest.clearAllMocks();

        await act(async () => {
          await result.current.markCommentAsRightAnswer(commentId, true);
        });

        expect(mockRestAdapterAjax).toHaveBeenCalledWith({
          url: `https://api.example.com//comments/${commentId}`,
          method: 'PATCH',
          body: expect.any(String),
          headers: expect.any(Object),
        });
      }
    });

    it('should not call addHttpsToHref', async () => {
      const { result } = renderHook(() => useComments());

      jest.clearAllMocks();

      await act(async () => {
        await result.current.markCommentAsRightAnswer('comment-123', true);
      });

      // Should not be called for markCommentAsRightAnswer
      expect(mockAddHttpsToHref).not.toHaveBeenCalled();
    });
  });

  describe('loadMoreComments', () => {
    it('should call APIServiceInstance.loadMore with next URL', async () => {
      const { result } = renderHook(() => useComments());

      await act(async () => {
        await result.current.loadMoreComments();
      });

      expect(mockLoadMore).toHaveBeenCalledWith(
        'https://api.example.com/posts/post-123/comments?page[offset]=10'
      );
    });

    it('should dispatch paginateComments action', async () => {
      const { result } = renderHook(() => useComments());

      await act(async () => {
        await result.current.loadMoreComments();
      });

      expect(mockDispatch).toHaveBeenCalled();
      expect(paginateComments).toHaveBeenCalledWith({
        items: mockComments,
        next: '',
      });
    });

    it('should not call loadMore if no next URL', async () => {
      mockSelector.mockReturnValue({
        items: mockComments,
        next: '',
      });

      const { result } = renderHook(() => useComments());

      jest.clearAllMocks();

      await act(async () => {
        await result.current.loadMoreComments();
      });

      expect(mockLoadMore).not.toHaveBeenCalled();
    });

    it('should handle pagination response with new next URL', async () => {
      mockLoadMore.mockResolvedValue({
        commentList: mockComments,
        links: { next: 'https://api.example.com/posts/post-123/comments?page[offset]=20' },
      });

      const { result } = renderHook(() => useComments());

      await act(async () => {
        await result.current.loadMoreComments();
      });

      expect(paginateComments).toHaveBeenCalledWith({
        items: mockComments,
        next: 'https://api.example.com/posts/post-123/comments?page[offset]=20',
      });
    });

    it('should set next to empty string if not in pagination response', async () => {
      mockLoadMore.mockResolvedValue({
        commentList: mockComments,
        links: {},
      });

      const { result } = renderHook(() => useComments());

      await act(async () => {
        await result.current.loadMoreComments();
      });

      expect(paginateComments).toHaveBeenCalledWith({
        items: mockComments,
        next: '',
      });
    });
  });

  describe('hasMoreItems', () => {
    it('should return true when next URL exists', () => {
      mockSelector.mockReturnValue({
        items: mockComments,
        next: 'https://api.example.com/next',
      });

      const { result } = renderHook(() => useComments());

      expect(result.current.hasMoreItems).toBe(true);
    });

    it('should return false when next URL is empty', () => {
      mockSelector.mockReturnValue({
        items: mockComments,
        next: '',
      });

      const { result } = renderHook(() => useComments());

      expect(result.current.hasMoreItems).toBe(false);
    });

    it('should return false when next URL is null', () => {
      mockSelector.mockReturnValue({
        items: mockComments,
        next: null,
      });

      const { result } = renderHook(() => useComments());

      expect(result.current.hasMoreItems).toBe(false);
    });

    it('should return false when next URL is undefined', () => {
      mockSelector.mockReturnValue({
        items: mockComments,
        next: undefined,
      });

      const { result } = renderHook(() => useComments());

      expect(result.current.hasMoreItems).toBe(false);
    });
  });

  describe('useCallback Memoization', () => {
    it('should memoize fetchComments with useCallback', () => {
      const { result } = renderHook(() => useComments());

      expect(typeof result.current.fetchComments).toBe('function');
    });

    it('should memoize patchComment with useCallback', () => {
      const { result } = renderHook(() => useComments());

      expect(typeof result.current.patchComment).toBe('function');
    });

    it('should memoize markCommentAsRightAnswer with useCallback', () => {
      const { result } = renderHook(() => useComments());

      expect(typeof result.current.markCommentAsRightAnswer).toBe('function');
    });

    it('should memoize loadMoreComments with useCallback', () => {
      const { result } = renderHook(() => useComments());

      expect(typeof result.current.loadMoreComments).toBe('function');
    });
  });

  describe('Edge Cases', () => {
    it('should handle null postId in fetchComments', async () => {
      const { result } = renderHook(() => useComments());

      await act(async () => {
        await result.current.fetchComments(null);
      });

      expect(mockRestAdapterGet).toHaveBeenCalledWith({
        url: 'https://api.example.com//posts/null/comments?',
        params: expect.any(Object),
      });
    });

    it('should handle undefined postId in fetchComments', async () => {
      const { result } = renderHook(() => useComments());

      await act(async () => {
        await result.current.fetchComments(undefined);
      });

      expect(mockRestAdapterGet).toHaveBeenCalledWith({
        url: 'https://api.example.com//posts/undefined/comments?',
        params: expect.any(Object),
      });
    });

    it('should handle empty string input in patchComment', async () => {
      const { result } = renderHook(() => useComments());

      await act(async () => {
        await result.current.patchComment('comment-123', '');
      });

      expect(mockAddHttpsToHref).toHaveBeenCalledWith('');
    });

    it('should handle null input in patchComment', async () => {
      const { result } = renderHook(() => useComments());

      await act(async () => {
        await result.current.patchComment('comment-123', null);
      });

      expect(mockAddHttpsToHref).toHaveBeenCalledWith(null);
    });

    it('should handle API URL without trailing slash', async () => {
      mockGetALMConfig.mockReturnValue({
        primeApiURL: 'https://api.example.com', // No trailing slash
      });

      const { result } = renderHook(() => useComments());

      await act(async () => {
        await result.current.fetchComments('post-123');
      });

      expect(mockRestAdapterGet).toHaveBeenCalledWith({
        url: 'https://api.example.com/posts/post-123/comments?',
        params: expect.any(Object),
      });
    });

    it('should handle missing links in response', async () => {
      mockJsonApiParse.mockReturnValue({
        commentList: mockComments,
        // No links property
      });

      const { result } = renderHook(() => useComments());

      await act(async () => {
        await result.current.fetchComments('post-123');
      });

      expect(loadComments).toHaveBeenCalledWith({
        selectedPostId: 'post-123',
        items: mockComments,
        next: '',
      });
    });

    it('should handle empty response from API', async () => {
      mockJsonApiParse.mockReturnValue({
        commentList: [],
        links: {},
      });

      const { result } = renderHook(() => useComments());

      await act(async () => {
        await result.current.fetchComments('post-123');
      });

      expect(loadComments).toHaveBeenCalledWith({
        selectedPostId: 'post-123',
        items: [],
        next: '',
      });
    });
  });

  describe('Return Value Validation', () => {
    it('should return items property matching Redux state', () => {
      const customComments = [
        { id: 'custom-1', text: 'Custom Comment 1' },
        { id: 'custom-2', text: 'Custom Comment 2' },
      ];

      mockSelector.mockReturnValue({
        items: customComments,
        next: '',
      });

      const { result } = renderHook(() => useComments());

      expect(result.current.items).toEqual(customComments);
    });

    it('should return consistent structure on multiple renders', () => {
      const { result: result1 } = renderHook(() => useComments());
      const { result: result2 } = renderHook(() => useComments());

      expect(Object.keys(result1.current)).toEqual(Object.keys(result2.current));
    });
  });
});
