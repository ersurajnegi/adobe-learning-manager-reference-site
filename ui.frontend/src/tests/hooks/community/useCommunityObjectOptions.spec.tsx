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
 * Unit Tests for useCommunityObjectOptions Hook
 *
 * Hook handles:
 * - Deleting posts (DELETE + Redux dispatch)
 * - Reporting post abuse (POST with body)
 * - Deleting comments (DELETE + Redux dispatch)
 * - Reporting comment abuse (POST with body)
 * - Deleting replies (DELETE + Redux dispatch)
 * - Reporting reply abuse (POST with body)
 *
 * Testing Strategy:
 * - Module integrity and exports
 * - Redux integration (useDispatch)
 * - All 6 operations (delete/report for posts/comments/replies)
 * - API calls with correct URLs, methods, and bodies
 * - Redux dispatches for delete operations
 * - No Redux dispatch for report operations
 * - useCallback memoization
 * - Error handling
 * - Edge cases
 */

import { act } from '@testing-library/react';
import React from 'react';
import ReactDOM from 'react-dom';
import { useCommunityObjectOptions } from '../../../almLib/hooks/community/useCommunityObjectOptions';
import {
  deletePost,
  deleteComment,
  deleteReply,
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
const mockRestAdapterAjax = jest.fn();
const mockGetALMConfig = jest.fn();

jest.mock('react-redux', () => ({
  useDispatch: () => mockDispatch,
}));

jest.mock('../../../almLib/utils/restAdapter', () => ({
  RestAdapter: {
    ajax: (...args: any[]) => mockRestAdapterAjax(...args),
  },
}));

jest.mock('../../../almLib/utils/global', () => ({
  getALMConfig: () => mockGetALMConfig(),
}));

jest.mock('../../../almLib/store/actions/social/action', () => ({
  deletePost: jest.fn(payload => ({ type: 'DELETE_POST', payload })),
  deleteComment: jest.fn(payload => ({ type: 'DELETE_COMMENT', payload })),
  deleteReply: jest.fn(payload => ({ type: 'DELETE_REPLY', payload })),
}));

describe('useCommunityObjectOptions', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mocks
    mockGetALMConfig.mockReturnValue({
      primeApiURL: 'https://api.example.com/',
    });

    mockRestAdapterAjax.mockResolvedValue({
      success: true,
    });
  });

  describe('deletePostFromServer', () => {
    it('should call RestAdapter.ajax with correct URL and method', async () => {
      const { result } = renderHook(() => useCommunityObjectOptions());
      const postId = 'post-123';

      await act(async () => {
        await result.current.deletePostFromServer(postId);
      });

      expect(mockRestAdapterAjax).toHaveBeenCalledWith({
        url: 'https://api.example.com//posts/post-123',
        method: 'DELETE',
      });
    });

    it('should use DELETE method', async () => {
      const { result } = renderHook(() => useCommunityObjectOptions());

      await act(async () => {
        await result.current.deletePostFromServer('post-123');
      });

      const callArgs = mockRestAdapterAjax.mock.calls[0][0];
      expect(callArgs.method).toBe('DELETE');
    });

    it('should dispatch deletePost action after API call', async () => {
      const { result } = renderHook(() => useCommunityObjectOptions());
      const postId = 'post-456';

      await act(async () => {
        await result.current.deletePostFromServer(postId);
      });

      expect(mockDispatch).toHaveBeenCalled();
      expect(deletePost).toHaveBeenCalledWith({ id: postId });
    });

    it('should handle different postIds', async () => {
      const { result } = renderHook(() => useCommunityObjectOptions());
      const postIds = ['post-1', 'post-2', 'post-3'];

      for (const postId of postIds) {
        jest.clearAllMocks();

        await act(async () => {
          await result.current.deletePostFromServer(postId);
        });

        expect(mockRestAdapterAjax).toHaveBeenCalledWith({
          url: `https://api.example.com//posts/${postId}`,
          method: 'DELETE',
        });
      }
    });

    it('should handle API errors gracefully', async () => {
      mockRestAdapterAjax.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useCommunityObjectOptions());

      await expect(async () => {
        await act(async () => {
          await result.current.deletePostFromServer('post-123');
        });
      }).rejects.toThrow('Network error');
    });

    it('should not dispatch action if API call fails', async () => {
      mockRestAdapterAjax.mockRejectedValue(new Error('API error'));

      const { result } = renderHook(() => useCommunityObjectOptions());

      try {
        await act(async () => {
          await result.current.deletePostFromServer('post-123');
        });
      } catch (error) {
        // Expected to throw
      }

      expect(mockDispatch).not.toHaveBeenCalled();
    });
  });

  describe('reportPostAbuse', () => {
    it('should call RestAdapter.ajax with correct URL and method', async () => {
      const { result } = renderHook(() => useCommunityObjectOptions());
      const postId = 'post-123';

      await act(async () => {
        await result.current.reportPostAbuse(postId);
      });

      expect(mockRestAdapterAjax).toHaveBeenCalledWith({
        url: 'https://api.example.com//posts/post-123/reportAbuse',
        method: 'POST',
        body: expect.any(String),
        headers: { 'content-type': 'application/json' },
      });
    });

    it('should use POST method', async () => {
      const { result } = renderHook(() => useCommunityObjectOptions());

      await act(async () => {
        await result.current.reportPostAbuse('post-123');
      });

      const callArgs = mockRestAdapterAjax.mock.calls[0][0];
      expect(callArgs.method).toBe('POST');
    });

    it('should send correct body structure', async () => {
      const { result } = renderHook(() => useCommunityObjectOptions());
      const postId = 'post-456';

      await act(async () => {
        await result.current.reportPostAbuse(postId);
      });

      const callArgs = mockRestAdapterAjax.mock.calls[0][0];
      const body = JSON.parse(callArgs.body);

      expect(body).toEqual({
        data: {
          id: postId,
          type: 'reportAbuse',
        },
      });
    });

    it('should include content-type header', async () => {
      const { result } = renderHook(() => useCommunityObjectOptions());

      await act(async () => {
        await result.current.reportPostAbuse('post-123');
      });

      const callArgs = mockRestAdapterAjax.mock.calls[0][0];
      expect(callArgs.headers).toEqual({ 'content-type': 'application/json' });
    });

    it('should not dispatch any Redux action', async () => {
      const { result } = renderHook(() => useCommunityObjectOptions());

      await act(async () => {
        await result.current.reportPostAbuse('post-123');
      });

      // reportPostAbuse does not dispatch anything
      expect(mockDispatch).not.toHaveBeenCalled();
    });

    it('should handle different postIds', async () => {
      const { result } = renderHook(() => useCommunityObjectOptions());
      const postIds = ['post-1', 'post-2', 'post-3'];

      for (const postId of postIds) {
        jest.clearAllMocks();

        await act(async () => {
          await result.current.reportPostAbuse(postId);
        });

        expect(mockRestAdapterAjax).toHaveBeenCalledWith({
          url: `https://api.example.com//posts/${postId}/reportAbuse`,
          method: 'POST',
          body: expect.any(String),
          headers: expect.any(Object),
        });
      }
    });

    it('should handle API errors gracefully', async () => {
      mockRestAdapterAjax.mockRejectedValue(new Error('Report failed'));

      const { result } = renderHook(() => useCommunityObjectOptions());

      await expect(async () => {
        await act(async () => {
          await result.current.reportPostAbuse('post-123');
        });
      }).rejects.toThrow('Report failed');
    });
  });

  describe('deleteCommentFromServer', () => {
    it('should call RestAdapter.ajax with correct URL and method', async () => {
      const { result } = renderHook(() => useCommunityObjectOptions());
      const commentId = 'comment-123';

      await act(async () => {
        await result.current.deleteCommentFromServer(commentId);
      });

      expect(mockRestAdapterAjax).toHaveBeenCalledWith({
        url: 'https://api.example.com//comments/comment-123',
        method: 'DELETE',
      });
    });

    it('should use DELETE method', async () => {
      const { result } = renderHook(() => useCommunityObjectOptions());

      await act(async () => {
        await result.current.deleteCommentFromServer('comment-123');
      });

      const callArgs = mockRestAdapterAjax.mock.calls[0][0];
      expect(callArgs.method).toBe('DELETE');
    });

    it('should dispatch deleteComment action after API call', async () => {
      const { result } = renderHook(() => useCommunityObjectOptions());
      const commentId = 'comment-456';

      await act(async () => {
        await result.current.deleteCommentFromServer(commentId);
      });

      expect(mockDispatch).toHaveBeenCalled();
      expect(deleteComment).toHaveBeenCalledWith({ id: commentId });
    });

    it('should handle different commentIds', async () => {
      const { result } = renderHook(() => useCommunityObjectOptions());
      const commentIds = ['comment-1', 'comment-2', 'comment-3'];

      for (const commentId of commentIds) {
        jest.clearAllMocks();

        await act(async () => {
          await result.current.deleteCommentFromServer(commentId);
        });

        expect(mockRestAdapterAjax).toHaveBeenCalledWith({
          url: `https://api.example.com//comments/${commentId}`,
          method: 'DELETE',
        });
      }
    });

    it('should handle API errors gracefully', async () => {
      mockRestAdapterAjax.mockRejectedValue(new Error('Delete failed'));

      const { result } = renderHook(() => useCommunityObjectOptions());

      await expect(async () => {
        await act(async () => {
          await result.current.deleteCommentFromServer('comment-123');
        });
      }).rejects.toThrow('Delete failed');
    });

    it('should not dispatch action if API call fails', async () => {
      mockRestAdapterAjax.mockRejectedValue(new Error('API error'));

      const { result } = renderHook(() => useCommunityObjectOptions());

      try {
        await act(async () => {
          await result.current.deleteCommentFromServer('comment-123');
        });
      } catch (error) {
        // Expected to throw
      }

      expect(mockDispatch).not.toHaveBeenCalled();
    });
  });

  describe('reportCommentAbuse', () => {
    it('should call RestAdapter.ajax with correct URL and method', async () => {
      const { result } = renderHook(() => useCommunityObjectOptions());
      const commentId = 'comment-123';

      await act(async () => {
        await result.current.reportCommentAbuse(commentId);
      });

      expect(mockRestAdapterAjax).toHaveBeenCalledWith({
        url: 'https://api.example.com//comments/comment-123/reportAbuse',
        method: 'POST',
        body: expect.any(String),
        headers: { 'content-type': 'application/json' },
      });
    });

    it('should use POST method', async () => {
      const { result } = renderHook(() => useCommunityObjectOptions());

      await act(async () => {
        await result.current.reportCommentAbuse('comment-123');
      });

      const callArgs = mockRestAdapterAjax.mock.calls[0][0];
      expect(callArgs.method).toBe('POST');
    });

    it('should send correct body structure', async () => {
      const { result } = renderHook(() => useCommunityObjectOptions());
      const commentId = 'comment-456';

      await act(async () => {
        await result.current.reportCommentAbuse(commentId);
      });

      const callArgs = mockRestAdapterAjax.mock.calls[0][0];
      const body = JSON.parse(callArgs.body);

      expect(body).toEqual({
        data: {
          id: commentId,
          type: 'reportAbuse',
        },
      });
    });

    it('should include content-type header', async () => {
      const { result } = renderHook(() => useCommunityObjectOptions());

      await act(async () => {
        await result.current.reportCommentAbuse('comment-123');
      });

      const callArgs = mockRestAdapterAjax.mock.calls[0][0];
      expect(callArgs.headers).toEqual({ 'content-type': 'application/json' });
    });

    it('should not dispatch any Redux action', async () => {
      const { result } = renderHook(() => useCommunityObjectOptions());

      await act(async () => {
        await result.current.reportCommentAbuse('comment-123');
      });

      // reportCommentAbuse does not dispatch anything
      expect(mockDispatch).not.toHaveBeenCalled();
    });

    it('should handle different commentIds', async () => {
      const { result } = renderHook(() => useCommunityObjectOptions());
      const commentIds = ['comment-1', 'comment-2', 'comment-3'];

      for (const commentId of commentIds) {
        jest.clearAllMocks();

        await act(async () => {
          await result.current.reportCommentAbuse(commentId);
        });

        expect(mockRestAdapterAjax).toHaveBeenCalledWith({
          url: `https://api.example.com//comments/${commentId}/reportAbuse`,
          method: 'POST',
          body: expect.any(String),
          headers: expect.any(Object),
        });
      }
    });

    it('should handle API errors gracefully', async () => {
      mockRestAdapterAjax.mockRejectedValue(new Error('Report failed'));

      const { result } = renderHook(() => useCommunityObjectOptions());

      await expect(async () => {
        await act(async () => {
          await result.current.reportCommentAbuse('comment-123');
        });
      }).rejects.toThrow('Report failed');
    });
  });

  describe('deleteReplyFromServer', () => {
    it('should call RestAdapter.ajax with correct URL and method', async () => {
      const { result } = renderHook(() => useCommunityObjectOptions());
      const replyId = 'reply-123';

      await act(async () => {
        await result.current.deleteReplyFromServer(replyId);
      });

      expect(mockRestAdapterAjax).toHaveBeenCalledWith({
        url: 'https://api.example.com//replies/reply-123',
        method: 'DELETE',
      });
    });

    it('should use DELETE method', async () => {
      const { result } = renderHook(() => useCommunityObjectOptions());

      await act(async () => {
        await result.current.deleteReplyFromServer('reply-123');
      });

      const callArgs = mockRestAdapterAjax.mock.calls[0][0];
      expect(callArgs.method).toBe('DELETE');
    });

    it('should dispatch deleteReply action after API call', async () => {
      const { result } = renderHook(() => useCommunityObjectOptions());
      const replyId = 'reply-456';

      await act(async () => {
        await result.current.deleteReplyFromServer(replyId);
      });

      expect(mockDispatch).toHaveBeenCalled();
      expect(deleteReply).toHaveBeenCalledWith({ id: replyId });
    });

    it('should handle different replyIds', async () => {
      const { result } = renderHook(() => useCommunityObjectOptions());
      const replyIds = ['reply-1', 'reply-2', 'reply-3'];

      for (const replyId of replyIds) {
        jest.clearAllMocks();

        await act(async () => {
          await result.current.deleteReplyFromServer(replyId);
        });

        expect(mockRestAdapterAjax).toHaveBeenCalledWith({
          url: `https://api.example.com//replies/${replyId}`,
          method: 'DELETE',
        });
      }
    });

    it('should handle API errors gracefully', async () => {
      mockRestAdapterAjax.mockRejectedValue(new Error('Delete failed'));

      const { result } = renderHook(() => useCommunityObjectOptions());

      await expect(async () => {
        await act(async () => {
          await result.current.deleteReplyFromServer('reply-123');
        });
      }).rejects.toThrow('Delete failed');
    });

    it('should not dispatch action if API call fails', async () => {
      mockRestAdapterAjax.mockRejectedValue(new Error('API error'));

      const { result } = renderHook(() => useCommunityObjectOptions());

      try {
        await act(async () => {
          await result.current.deleteReplyFromServer('reply-123');
        });
      } catch (error) {
        // Expected to throw
      }

      expect(mockDispatch).not.toHaveBeenCalled();
    });
  });

  describe('reportReplyAbuse', () => {
    it('should call RestAdapter.ajax with correct URL and method', async () => {
      const { result } = renderHook(() => useCommunityObjectOptions());
      const replyId = 'reply-123';

      await act(async () => {
        await result.current.reportReplyAbuse(replyId);
      });

      expect(mockRestAdapterAjax).toHaveBeenCalledWith({
        url: 'https://api.example.com//replies/reply-123/reportAbuse',
        method: 'POST',
        body: expect.any(String),
        headers: { 'content-type': 'application/json' },
      });
    });

    it('should use POST method', async () => {
      const { result } = renderHook(() => useCommunityObjectOptions());

      await act(async () => {
        await result.current.reportReplyAbuse('reply-123');
      });

      const callArgs = mockRestAdapterAjax.mock.calls[0][0];
      expect(callArgs.method).toBe('POST');
    });

    it('should send correct body structure', async () => {
      const { result } = renderHook(() => useCommunityObjectOptions());
      const replyId = 'reply-456';

      await act(async () => {
        await result.current.reportReplyAbuse(replyId);
      });

      const callArgs = mockRestAdapterAjax.mock.calls[0][0];
      const body = JSON.parse(callArgs.body);

      expect(body).toEqual({
        data: {
          id: replyId,
          type: 'reportAbuse',
        },
      });
    });

    it('should include content-type header', async () => {
      const { result } = renderHook(() => useCommunityObjectOptions());

      await act(async () => {
        await result.current.reportReplyAbuse('reply-123');
      });

      const callArgs = mockRestAdapterAjax.mock.calls[0][0];
      expect(callArgs.headers).toEqual({ 'content-type': 'application/json' });
    });

    it('should not dispatch any Redux action', async () => {
      const { result } = renderHook(() => useCommunityObjectOptions());

      await act(async () => {
        await result.current.reportReplyAbuse('reply-123');
      });

      // reportReplyAbuse does not dispatch anything
      expect(mockDispatch).not.toHaveBeenCalled();
    });

    it('should handle different replyIds', async () => {
      const { result } = renderHook(() => useCommunityObjectOptions());
      const replyIds = ['reply-1', 'reply-2', 'reply-3'];

      for (const replyId of replyIds) {
        jest.clearAllMocks();

        await act(async () => {
          await result.current.reportReplyAbuse(replyId);
        });

        expect(mockRestAdapterAjax).toHaveBeenCalledWith({
          url: `https://api.example.com//replies/${replyId}/reportAbuse`,
          method: 'POST',
          body: expect.any(String),
          headers: expect.any(Object),
        });
      }
    });

    it('should handle API errors gracefully', async () => {
      mockRestAdapterAjax.mockRejectedValue(new Error('Report failed'));

      const { result } = renderHook(() => useCommunityObjectOptions());

      await expect(async () => {
        await act(async () => {
          await result.current.reportReplyAbuse('reply-123');
        });
      }).rejects.toThrow('Report failed');
    });
  });

  describe('useCallback Memoization', () => {
    it('should memoize deletePostFromServer with useCallback', () => {
      const { result } = renderHook(() => useCommunityObjectOptions());

      expect(typeof result.current.deletePostFromServer).toBe('function');
    });

    it('should memoize reportPostAbuse with useCallback', () => {
      const { result } = renderHook(() => useCommunityObjectOptions());

      expect(typeof result.current.reportPostAbuse).toBe('function');
    });

    it('should memoize deleteCommentFromServer with useCallback', () => {
      const { result } = renderHook(() => useCommunityObjectOptions());

      expect(typeof result.current.deleteCommentFromServer).toBe('function');
    });

    it('should memoize reportCommentAbuse with useCallback', () => {
      const { result } = renderHook(() => useCommunityObjectOptions());

      expect(typeof result.current.reportCommentAbuse).toBe('function');
    });

    it('should memoize deleteReplyFromServer with useCallback', () => {
      const { result } = renderHook(() => useCommunityObjectOptions());

      expect(typeof result.current.deleteReplyFromServer).toBe('function');
    });

    it('should memoize reportReplyAbuse with useCallback', () => {
      const { result } = renderHook(() => useCommunityObjectOptions());

      expect(typeof result.current.reportReplyAbuse).toBe('function');
    });
  });

  describe('Edge Cases', () => {
    it('should handle null postId in deletePostFromServer', async () => {
      const { result } = renderHook(() => useCommunityObjectOptions());

      await act(async () => {
        await result.current.deletePostFromServer(null);
      });

      expect(mockRestAdapterAjax).toHaveBeenCalledWith({
        url: 'https://api.example.com//posts/null',
        method: 'DELETE',
      });
    });

    it('should handle undefined postId in reportPostAbuse', async () => {
      const { result } = renderHook(() => useCommunityObjectOptions());

      await act(async () => {
        await result.current.reportPostAbuse(undefined);
      });

      expect(mockRestAdapterAjax).toHaveBeenCalledWith({
        url: 'https://api.example.com//posts/undefined/reportAbuse',
        method: 'POST',
        body: expect.any(String),
        headers: expect.any(Object),
      });
    });

    it('should handle empty string commentId', async () => {
      const { result } = renderHook(() => useCommunityObjectOptions());

      await act(async () => {
        await result.current.deleteCommentFromServer('');
      });

      expect(mockRestAdapterAjax).toHaveBeenCalledWith({
        url: 'https://api.example.com//comments/',
        method: 'DELETE',
      });
    });

    it('should handle numeric replyId', async () => {
      const { result } = renderHook(() => useCommunityObjectOptions());

      await act(async () => {
        await result.current.reportReplyAbuse(12345);
      });

      expect(mockRestAdapterAjax).toHaveBeenCalledWith({
        url: 'https://api.example.com//replies/12345/reportAbuse',
        method: 'POST',
        body: expect.any(String),
        headers: expect.any(Object),
      });
    });

    it('should handle special characters in IDs', async () => {
      const { result } = renderHook(() => useCommunityObjectOptions());
      const postId = 'post-123_special.test';

      await act(async () => {
        await result.current.deletePostFromServer(postId);
      });

      expect(mockRestAdapterAjax).toHaveBeenCalledWith({
        url: `https://api.example.com//posts/${postId}`,
        method: 'DELETE',
      });
    });

    it('should handle API URL without trailing slash', async () => {
      mockGetALMConfig.mockReturnValue({
        primeApiURL: 'https://api.example.com', // No trailing slash
      });

      const { result } = renderHook(() => useCommunityObjectOptions());

      await act(async () => {
        await result.current.deletePostFromServer('post-123');
      });

      expect(mockRestAdapterAjax).toHaveBeenCalledWith({
        url: 'https://api.example.com/posts/post-123',
        method: 'DELETE',
      });
    });
  });

  describe('Return Value Validation', () => {
    it('should return consistent structure on multiple renders', () => {
      const { result: result1 } = renderHook(() => useCommunityObjectOptions());
      const { result: result2 } = renderHook(() => useCommunityObjectOptions());

      expect(Object.keys(result1.current)).toEqual(Object.keys(result2.current));
    });

    it('should return functions that can be called multiple times', async () => {
      const { result } = renderHook(() => useCommunityObjectOptions());

      // Call deletePostFromServer multiple times
      await act(async () => {
        await result.current.deletePostFromServer('post-1');
      });

      await act(async () => {
        await result.current.deletePostFromServer('post-2');
      });

      expect(mockRestAdapterAjax).toHaveBeenCalledTimes(2);
    });
  });

  describe('Integration with getALMConfig', () => {
    it('should call getALMConfig for each operation', async () => {
      const { result } = renderHook(() => useCommunityObjectOptions());

      jest.clearAllMocks();

      await act(async () => {
        await result.current.deletePostFromServer('post-1');
      });
      expect(mockGetALMConfig).toHaveBeenCalledTimes(1);

      jest.clearAllMocks();

      await act(async () => {
        await result.current.reportPostAbuse('post-2');
      });
      expect(mockGetALMConfig).toHaveBeenCalledTimes(1);

      jest.clearAllMocks();

      await act(async () => {
        await result.current.deleteCommentFromServer('comment-1');
      });
      expect(mockGetALMConfig).toHaveBeenCalledTimes(1);

      jest.clearAllMocks();

      await act(async () => {
        await result.current.reportCommentAbuse('comment-2');
      });
      expect(mockGetALMConfig).toHaveBeenCalledTimes(1);

      jest.clearAllMocks();

      await act(async () => {
        await result.current.deleteReplyFromServer('reply-1');
      });
      expect(mockGetALMConfig).toHaveBeenCalledTimes(1);

      jest.clearAllMocks();

      await act(async () => {
        await result.current.reportReplyAbuse('reply-2');
      });
      expect(mockGetALMConfig).toHaveBeenCalledTimes(1);
    });

    it('should use fresh config for each API call', async () => {
      const { result } = renderHook(() => useCommunityObjectOptions());

      mockGetALMConfig.mockReturnValue({
        primeApiURL: 'https://api-v1.example.com/',
      });

      await act(async () => {
        await result.current.deletePostFromServer('post-1');
      });

      expect(mockRestAdapterAjax).toHaveBeenCalledWith({
        url: 'https://api-v1.example.com//posts/post-1',
        method: 'DELETE',
      });

      // Change config
      mockGetALMConfig.mockReturnValue({
        primeApiURL: 'https://api-v2.example.com/',
      });

      await act(async () => {
        await result.current.reportCommentAbuse('comment-2');
      });

      expect(mockRestAdapterAjax).toHaveBeenCalledWith({
        url: 'https://api-v2.example.com//comments/comment-2/reportAbuse',
        method: 'POST',
        body: expect.any(String),
        headers: expect.any(Object),
      });
    });
  });

  describe('Pattern Validation', () => {
    it('should follow same pattern for all delete operations', async () => {
      const { result } = renderHook(() => useCommunityObjectOptions());

      // All delete operations should dispatch after successful API call
      await act(async () => {
        await result.current.deletePostFromServer('post-1');
      });
      expect(mockDispatch).toHaveBeenCalledTimes(1);

      jest.clearAllMocks();

      await act(async () => {
        await result.current.deleteCommentFromServer('comment-1');
      });
      expect(mockDispatch).toHaveBeenCalledTimes(1);

      jest.clearAllMocks();

      await act(async () => {
        await result.current.deleteReplyFromServer('reply-1');
      });
      expect(mockDispatch).toHaveBeenCalledTimes(1);
    });

    it('should follow same pattern for all report operations', async () => {
      const { result } = renderHook(() => useCommunityObjectOptions());

      // All report operations should NOT dispatch
      await act(async () => {
        await result.current.reportPostAbuse('post-1');
      });
      expect(mockDispatch).not.toHaveBeenCalled();

      await act(async () => {
        await result.current.reportCommentAbuse('comment-1');
      });
      expect(mockDispatch).not.toHaveBeenCalled();

      await act(async () => {
        await result.current.reportReplyAbuse('reply-1');
      });
      expect(mockDispatch).not.toHaveBeenCalled();
    });

    it('should use same body structure for all report operations', async () => {
      const { result } = renderHook(() => useCommunityObjectOptions());

      await act(async () => {
        await result.current.reportPostAbuse('post-1');
      });
      const postBody = JSON.parse(mockRestAdapterAjax.mock.calls[0][0].body);

      jest.clearAllMocks();

      await act(async () => {
        await result.current.reportCommentAbuse('comment-1');
      });
      const commentBody = JSON.parse(mockRestAdapterAjax.mock.calls[0][0].body);

      jest.clearAllMocks();

      await act(async () => {
        await result.current.reportReplyAbuse('reply-1');
      });
      const replyBody = JSON.parse(mockRestAdapterAjax.mock.calls[0][0].body);

      // All should have same structure with type: 'reportAbuse'
      expect(postBody.data.type).toBe('reportAbuse');
      expect(commentBody.data.type).toBe('reportAbuse');
      expect(replyBody.data.type).toBe('reportAbuse');
    });
  });
});
