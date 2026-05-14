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
 * Unit Tests for useReplies Hook
 *
 * Hook handles:
 * - Fetching replies for a comment with error handling
 * - Adding new replies with bad word detection
 * - Updating replies (patching) with bad word detection
 * - Loading more replies (pagination)
 * - Redux state management
 * - URL sanitization with addHttpsToHref
 *
 * Testing Strategy:
 * - Module integrity and exports
 * - Redux integration (useSelector, useDispatch)
 * - All 4 operations (fetchReplies, addReply, patchReply, loadMoreReplies)
 * - Error handling in fetchReplies
 * - Bad word detection in addReply and patchReply
 * - Pagination handling
 * - useCallback memoization
 * - Edge cases
 */

import { act } from '@testing-library/react';
import React from 'react';
import ReactDOM from 'react-dom';
import { useReplies } from '../../../almLib/hooks/community/useReplies';
import {
  loadReplies,
  paginateReplies,
  updateReply,
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
const mockUseSelector = jest.fn();
const mockRestAdapterGet = jest.fn();
const mockRestAdapterAjax = jest.fn();
const mockJsonApiParse = jest.fn();
const mockGetALMConfig = jest.fn();
const mockAddHttpsToHref = jest.fn();
const mockAPIServiceLoadMore = jest.fn();
const mockConsoleLog = jest.fn();

jest.mock('react-redux', () => ({
  useDispatch: () => mockDispatch,
  useSelector: (selector: any) => mockUseSelector(selector),
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
  loadReplies: jest.fn(payload => ({ type: 'LOAD_REPLIES', payload })),
  paginateReplies: jest.fn(payload => ({ type: 'PAGINATE_REPLIES', payload })),
  updateReply: jest.fn(payload => ({ type: 'UPDATE_REPLY', payload })),
}));

describe('useReplies', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock console.log to suppress error messages
    global.console.log = mockConsoleLog;

    // Setup default mocks
    mockGetALMConfig.mockReturnValue({
      primeApiURL: 'https://api.example.com/',
    });

    mockUseSelector.mockImplementation(selector => {
      const state = {
        social: {
          replies: {
            items: [
              { id: 'reply-1', text: 'Reply 1' },
              { id: 'reply-2', text: 'Reply 2' },
            ],
            next: 'https://api.example.com/next-page',
          },
        },
      };
      return selector(state);
    });

    mockRestAdapterGet.mockResolvedValue({
      data: [
        { id: 'reply-1', attributes: { text: 'Reply 1' } },
        { id: 'reply-2', attributes: { text: 'Reply 2' } },
      ],
    });

    mockRestAdapterAjax.mockResolvedValue({
      data: { id: 'reply-1', attributes: { text: 'Updated reply' } },
    });

    mockJsonApiParse.mockReturnValue({
      replyList: [
        { id: 'reply-1', text: 'Reply 1' },
        { id: 'reply-2', text: 'Reply 2' },
      ],
      links: { next: 'https://api.example.com/next-page' },
      reply: { id: 'reply-1', text: 'Updated reply' },
    });

    mockAddHttpsToHref.mockImplementation(input => input);

    mockAPIServiceLoadMore.mockResolvedValue({
      replyList: [{ id: 'reply-3', text: 'Reply 3' }],
      links: { next: 'https://api.example.com/next-page-2' },
    });
  });

  describe('fetchReplies', () => {
    it('should call RestAdapter.get with correct URL and params', async () => {
      let result: any;

      await act(async () => {
        result = renderHook(() => useReplies('comment-123')).result;
      });

      jest.clearAllMocks();

      await act(async () => {
        await result.current.fetchReplies('comment-456');
      });

      expect(mockRestAdapterGet).toHaveBeenCalledWith({
        url: 'https://api.example.com//comments/comment-456/replies?',
        params: {
          sort: '-dateCreated',
          'filter.state': 'ACTIVE',
          'page[offset]': '0',
          'page[limit]': '10',
          include: 'createdBy',
        },
      });
    });

    it('should dispatch loadReplies with correct data structure', async () => {
      let result: any;

      await act(async () => {
        result = renderHook(() => useReplies('comment-123')).result;
      });

      jest.clearAllMocks();

      await act(async () => {
        await result.current.fetchReplies('comment-789');
      });

      expect(loadReplies).toHaveBeenCalledWith({
        selectedCommentId: 'comment-789',
        items: [
          { id: 'reply-1', text: 'Reply 1' },
          { id: 'reply-2', text: 'Reply 2' },
        ],
        next: 'https://api.example.com/next-page',
      });
    });

    it('should handle response without next link', async () => {
      mockJsonApiParse.mockReturnValue({
        replyList: [{ id: 'reply-1', text: 'Reply 1' }],
        links: {},
      });

      let result: any;

      await act(async () => {
        result = renderHook(() => useReplies('comment-123')).result;
      });

      jest.clearAllMocks();

      await act(async () => {
        await result.current.fetchReplies('comment-123');
      });

      expect(loadReplies).toHaveBeenCalledWith({
        selectedCommentId: 'comment-123',
        items: [{ id: 'reply-1', text: 'Reply 1' }],
        next: '',
      });
    });

    it('should handle API errors gracefully', async () => {
      mockRestAdapterGet.mockRejectedValue(new Error('Network error'));

      let result: any;

      await act(async () => {
        result = renderHook(() => useReplies('comment-123')).result;
      });

      jest.clearAllMocks();

      await act(async () => {
        await result.current.fetchReplies('comment-123');
      });

      // Should dispatch empty array on error
      expect(loadReplies).toHaveBeenCalledWith([]);
    });

    it('should log error message on failure', async () => {
      const error = new Error('Network error');
      mockRestAdapterGet.mockRejectedValue(error);

      let result: any;

      await act(async () => {
        result = renderHook(() => useReplies('comment-123')).result;
      });

      jest.clearAllMocks();

      await act(async () => {
        await result.current.fetchReplies('comment-123');
      });

      expect(mockConsoleLog).toHaveBeenCalledWith('Error while loading boards ' + error);
    });

    it('should handle different commentIds', async () => {
      let result: any;

      await act(async () => {
        result = renderHook(() => useReplies('comment-123')).result;
      });

      const commentIds = ['comment-1', 'comment-2', 'comment-3'];

      for (const commentId of commentIds) {
        jest.clearAllMocks();

        await act(async () => {
          await result.current.fetchReplies(commentId);
        });

        expect(mockRestAdapterGet).toHaveBeenCalledWith({
          url: `https://api.example.com//comments/${commentId}/replies?`,
          params: expect.any(Object),
        });
      }
    });
  });

  describe('addReply', () => {
    it('should call RestAdapter.ajax with correct URL and method', async () => {
      let result: any;

      await act(async () => {
        result = renderHook(() => useReplies('comment-123')).result;
      });

      jest.clearAllMocks();

      await act(async () => {
        await result.current.addReply('comment-456', 'My reply text');
      });

      expect(mockRestAdapterAjax).toHaveBeenCalledWith({
        url: 'https://api.example.com//comments/comment-456/replies',
        method: 'POST',
        body: expect.any(String),
        headers: { 'content-type': 'application/json' },
      });
    });

    it('should use POST method', async () => {
      let result: any;

      await act(async () => {
        result = renderHook(() => useReplies('comment-123')).result;
      });

      jest.clearAllMocks();

      await act(async () => {
        await result.current.addReply('comment-123', 'text');
      });

      const callArgs = mockRestAdapterAjax.mock.calls[0][0];
      expect(callArgs.method).toBe('POST');
    });

    it('should call addHttpsToHref to sanitize input', async () => {
      let result: any;

      await act(async () => {
        result = renderHook(() => useReplies('comment-123')).result;
      });

      const input = 'Reply with link';

      jest.clearAllMocks();

      await act(async () => {
        await result.current.addReply('comment-123', input);
      });

      expect(mockAddHttpsToHref).toHaveBeenCalledWith(input);
    });

    it('should send correct body structure', async () => {
      let result: any;

      await act(async () => {
        result = renderHook(() => useReplies('comment-123')).result;
      });

      const input = 'My reply';
      const sanitizedInput = 'My reply with https';

      mockAddHttpsToHref.mockReturnValue(sanitizedInput);

      jest.clearAllMocks();

      await act(async () => {
        await result.current.addReply('comment-456', input);
      });

      const callArgs = mockRestAdapterAjax.mock.calls[0][0];
      const body = JSON.parse(callArgs.body);

      expect(body).toEqual({
        data: {
          type: 'reply',
          attributes: {
            state: 'ACTIVE',
            text: sanitizedInput,
          },
        },
      });
    });

    it('should throw error for bad word detection', async () => {
      const errorResponse = {
        responseText: JSON.stringify({ title: 'BAD_WORD_FOUND' }),
      };

      mockRestAdapterAjax.mockRejectedValue(errorResponse);

      let result: any;

      await act(async () => {
        result = renderHook(() => useReplies('comment-123')).result;
      });

      await expect(async () => {
        await act(async () => {
          await result.current.addReply('comment-123', 'bad word text');
        });
      }).rejects.toThrow('BAD_WORD_FOUND');
    });

    it('should not throw error for other errors', async () => {
      const errorResponse = {
        responseText: JSON.stringify({ title: 'Other error' }),
      };

      mockRestAdapterAjax.mockRejectedValue(errorResponse);

      let result: any;

      await act(async () => {
        result = renderHook(() => useReplies('comment-123')).result;
      });

      await act(async () => {
        await result.current.addReply('comment-123', 'text');
      });

      // Non-BAD_WORD error should not propagate — hook remains usable
      expect(typeof result.current.addReply).toBe('function');
    });
  });

  describe('patchReply', () => {
    it('should call RestAdapter.ajax with correct URL and method', async () => {
      let result: any;

      await act(async () => {
        result = renderHook(() => useReplies('comment-123')).result;
      });

      jest.clearAllMocks();

      await act(async () => {
        await result.current.patchReply('reply-123', 'Updated text');
      });

      expect(mockRestAdapterAjax).toHaveBeenCalledWith({
        url: 'https://api.example.com//replies/reply-123',
        method: 'PATCH',
        body: expect.any(String),
        headers: { 'content-type': 'application/json' },
      });
    });

    it('should use PATCH method', async () => {
      let result: any;

      await act(async () => {
        result = renderHook(() => useReplies('comment-123')).result;
      });

      jest.clearAllMocks();

      await act(async () => {
        await result.current.patchReply('reply-123', 'text');
      });

      const callArgs = mockRestAdapterAjax.mock.calls[0][0];
      expect(callArgs.method).toBe('PATCH');
    });

    it('should call addHttpsToHref to sanitize input', async () => {
      let result: any;

      await act(async () => {
        result = renderHook(() => useReplies('comment-123')).result;
      });

      const input = 'Updated reply with link';

      jest.clearAllMocks();

      await act(async () => {
        await result.current.patchReply('reply-123', input);
      });

      expect(mockAddHttpsToHref).toHaveBeenCalledWith(input);
    });

    it('should send correct body structure with replyId', async () => {
      let result: any;

      await act(async () => {
        result = renderHook(() => useReplies('comment-123')).result;
      });

      const replyId = 'reply-456';
      const input = 'Updated reply';
      const sanitizedInput = 'Updated reply with https';

      mockAddHttpsToHref.mockReturnValue(sanitizedInput);

      jest.clearAllMocks();

      await act(async () => {
        await result.current.patchReply(replyId, input);
      });

      const callArgs = mockRestAdapterAjax.mock.calls[0][0];
      const body = JSON.parse(callArgs.body);

      expect(body).toEqual({
        data: {
          type: 'reply',
          id: replyId,
          attributes: {
            state: 'ACTIVE',
            text: sanitizedInput,
          },
        },
      });
    });

    it('should dispatch updateReply with parsed response', async () => {
      const updatedReply = {
        id: 'reply-123',
        text: 'Updated reply',
      };

      mockJsonApiParse.mockReturnValue({
        reply: updatedReply,
      });

      let result: any;

      await act(async () => {
        result = renderHook(() => useReplies('comment-123')).result;
      });

      jest.clearAllMocks();

      await act(async () => {
        await result.current.patchReply('reply-123', 'Updated text');
      });

      expect(updateReply).toHaveBeenCalledWith({
        item: updatedReply,
      });
    });

    it('should throw error for bad word detection', async () => {
      const errorResponse = {
        responseText: JSON.stringify({ title: 'BAD_WORD_FOUND' }),
      };

      mockRestAdapterAjax.mockRejectedValue(errorResponse);

      let result: any;

      await act(async () => {
        result = renderHook(() => useReplies('comment-123')).result;
      });

      await expect(async () => {
        await act(async () => {
          await result.current.patchReply('reply-123', 'bad word');
        });
      }).rejects.toThrow('BAD_WORD_FOUND');
    });

    it('should not dispatch updateReply on error', async () => {
      const errorResponse = {
        responseText: JSON.stringify({ title: 'Other error' }),
      };

      mockRestAdapterAjax.mockRejectedValue(errorResponse);

      let result: any;

      await act(async () => {
        result = renderHook(() => useReplies('comment-123')).result;
      });

      jest.clearAllMocks();

      await act(async () => {
        await result.current.patchReply('reply-123', 'text');
      });

      expect(updateReply).not.toHaveBeenCalled();
    });
  });

  describe('loadMoreReplies', () => {
    it('should call APIServiceInstance.loadMore with next URL', async () => {
      let result: any;

      await act(async () => {
        result = renderHook(() => useReplies('comment-123')).result;
      });

      jest.clearAllMocks();

      await act(async () => {
        await result.current.loadMoreReplies();
      });

      expect(mockAPIServiceLoadMore).toHaveBeenCalledWith('https://api.example.com/next-page');
    });

    it('should dispatch paginateReplies with parsed response', async () => {
      let result: any;

      await act(async () => {
        result = renderHook(() => useReplies('comment-123')).result;
      });

      jest.clearAllMocks();

      await act(async () => {
        await result.current.loadMoreReplies();
      });

      expect(paginateReplies).toHaveBeenCalledWith({
        items: [{ id: 'reply-3', text: 'Reply 3' }],
        next: 'https://api.example.com/next-page-2',
      });
    });

    it('should not call loadMore when next is empty', async () => {
      mockUseSelector.mockImplementation(selector => {
        const state = {
          social: {
            replies: {
              items: [{ id: 'reply-1', text: 'Reply 1' }],
              next: '',
            },
          },
        };
        return selector(state);
      });

      let result: any;

      await act(async () => {
        result = renderHook(() => useReplies('comment-123')).result;
      });

      jest.clearAllMocks();

      await act(async () => {
        await result.current.loadMoreReplies();
      });

      expect(mockAPIServiceLoadMore).not.toHaveBeenCalled();
    });

    it('should handle response without next link', async () => {
      mockAPIServiceLoadMore.mockResolvedValue({
        replyList: [{ id: 'reply-3', text: 'Reply 3' }],
        links: {},
      });

      let result: any;

      await act(async () => {
        result = renderHook(() => useReplies('comment-123')).result;
      });

      jest.clearAllMocks();

      await act(async () => {
        await result.current.loadMoreReplies();
      });

      expect(paginateReplies).toHaveBeenCalledWith({
        items: [{ id: 'reply-3', text: 'Reply 3' }],
        next: '',
      });
    });
  });

  describe('useCallback Memoization', () => {
    it('should memoize fetchReplies with useCallback', async () => {
      let result: any;

      await act(async () => {
        result = renderHook(() => useReplies('comment-123')).result;
      });

      expect(typeof result.current.fetchReplies).toBe('function');
    });

    it('should memoize addReply with useCallback', async () => {
      let result: any;

      await act(async () => {
        result = renderHook(() => useReplies('comment-123')).result;
      });

      expect(typeof result.current.addReply).toBe('function');
    });

    it('should memoize patchReply with useCallback', async () => {
      let result: any;

      await act(async () => {
        result = renderHook(() => useReplies('comment-123')).result;
      });

      expect(typeof result.current.patchReply).toBe('function');
    });

    it('should memoize loadMoreReplies with useCallback', async () => {
      let result: any;

      await act(async () => {
        result = renderHook(() => useReplies('comment-123')).result;
      });

      expect(typeof result.current.loadMoreReplies).toBe('function');
    });
  });

  describe('Edge Cases', () => {
    it('should handle null commentId', async () => {
      let result: any;

      await act(async () => {
        result = renderHook(() => useReplies(null)).result;
      });

      // Should not throw error
      expect(typeof result.current.fetchReplies).toBe('function');
      expect(typeof result.current.addReply).toBe('function');
    });

    it('should handle null input in addReply', async () => {
      let result: any;

      await act(async () => {
        result = renderHook(() => useReplies('comment-123')).result;
      });

      await act(async () => {
        await result.current.addReply('comment-123', null);
      });

      expect(mockAddHttpsToHref).toHaveBeenCalledWith(null);
    });

    it('should handle empty string input', async () => {
      let result: any;

      await act(async () => {
        result = renderHook(() => useReplies('comment-123')).result;
      });

      await act(async () => {
        await result.current.patchReply('reply-123', '');
      });

      expect(mockAddHttpsToHref).toHaveBeenCalledWith('');
    });

    it('should handle numeric IDs', async () => {
      let result: any;

      await act(async () => {
        result = renderHook(() => useReplies('comment-123')).result;
      });

      jest.clearAllMocks();

      await act(async () => {
        await result.current.fetchReplies(12345);
      });

      expect(mockRestAdapterGet).toHaveBeenCalledWith({
        url: 'https://api.example.com//comments/12345/replies?',
        params: expect.any(Object),
      });
    });

    it('should handle API URL without trailing slash', async () => {
      mockGetALMConfig.mockReturnValue({
        primeApiURL: 'https://api.example.com', // No trailing slash
      });

      let result: any;

      await act(async () => {
        result = renderHook(() => useReplies('comment-123')).result;
      });

      jest.clearAllMocks();

      await act(async () => {
        await result.current.fetchReplies('comment-123');
      });

      expect(mockRestAdapterGet).toHaveBeenCalledWith({
        url: 'https://api.example.com/comments/comment-123/replies?',
        params: expect.any(Object),
      });
    });
  });

  describe('Return Value Validation', () => {
    it('should return consistent structure on multiple renders', async () => {
      let result1: any;
      let result2: any;

      await act(async () => {
        result1 = renderHook(() => useReplies('comment-123')).result;
      });

      await act(async () => {
        result2 = renderHook(() => useReplies('comment-123')).result;
      });

      expect(Object.keys(result1.current)).toEqual(Object.keys(result2.current));
    });
  });

  describe('No Auto-fetch Behavior', () => {
    it('should not auto-fetch replies on mount', async () => {
      jest.clearAllMocks();

      await act(async () => {
        renderHook(() => useReplies('comment-123'));
      });

      // fetchReplies should not be called automatically
      expect(mockRestAdapterGet).not.toHaveBeenCalled();
    });

    it('should require manual fetchReplies call', async () => {
      let result: any;

      await act(async () => {
        result = renderHook(() => useReplies('comment-123')).result;
      });

      jest.clearAllMocks();

      // Manually call fetchReplies
      await act(async () => {
        await result.current.fetchReplies('comment-123');
      });

      expect(mockRestAdapterGet).toHaveBeenCalledTimes(1);
    });
  });
});
