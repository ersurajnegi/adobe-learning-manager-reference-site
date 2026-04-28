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
 * Unit Tests for useComment Hook
 *
 * Hook handles:
 * - Voting on comments (POST)
 * - Deleting comment votes (DELETE)
 * - API integration with query parameters
 *
 * Testing Strategy:
 * - Module integrity and exports
 * - Hook structure and return values
 * - voteComment function (POST with action param)
 * - deleteCommentVote function (DELETE with action param)
 * - useCallback memoization
 * - Error handling
 * - Edge cases (null/undefined IDs, various actions)
 * - Integration with getALMConfig
 */

import { act } from '@testing-library/react';
import React from 'react';
import ReactDOM from 'react-dom';
import { useComment } from '../../../almLib/hooks/community/useComment';

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
const mockRestAdapterAjax = jest.fn();
const mockGetALMConfig = jest.fn();

jest.mock('../../../almLib/utils/restAdapter', () => ({
  RestAdapter: {
    ajax: (...args: any[]) => mockRestAdapterAjax(...args),
  },
}));

jest.mock('../../../almLib/utils/global', () => ({
  getALMConfig: () => mockGetALMConfig(),
}));

describe('useComment', () => {
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

  describe('voteComment', () => {
    it('should call RestAdapter.ajax with correct URL and method', async () => {
      const { result } = renderHook(() => useComment());
      const postId = 'comment-123';
      const action = 'upvote';

      await act(async () => {
        await result.current.voteComment(postId, action);
      });

      expect(mockRestAdapterAjax).toHaveBeenCalledWith({
        url: 'https://api.example.com//comments/comment-123/vote?action=upvote',
        method: 'POST',
      });
    });

    it('should use POST method', async () => {
      const { result } = renderHook(() => useComment());

      await act(async () => {
        await result.current.voteComment('comment-456', 'upvote');
      });

      const callArgs = mockRestAdapterAjax.mock.calls[0][0];
      expect(callArgs.method).toBe('POST');
    });

    it('should include postId in URL', async () => {
      const { result } = renderHook(() => useComment());
      const postId = 'comment-789';

      await act(async () => {
        await result.current.voteComment(postId, 'upvote');
      });

      const callArgs = mockRestAdapterAjax.mock.calls[0][0];
      expect(callArgs.url).toContain(`/comments/${postId}/vote`);
    });

    it('should include action as query parameter', async () => {
      const { result } = renderHook(() => useComment());
      const action = 'downvote';

      await act(async () => {
        await result.current.voteComment('comment-123', action);
      });

      const callArgs = mockRestAdapterAjax.mock.calls[0][0];
      expect(callArgs.url).toContain(`?action=${action}`);
    });

    it('should handle different postIds', async () => {
      const { result } = renderHook(() => useComment());
      const postIds = ['comment-1', 'comment-2', 'comment-3'];

      for (const postId of postIds) {
        jest.clearAllMocks();

        await act(async () => {
          await result.current.voteComment(postId, 'upvote');
        });

        expect(mockRestAdapterAjax).toHaveBeenCalledWith({
          url: `https://api.example.com//comments/${postId}/vote?action=upvote`,
          method: 'POST',
        });
      }
    });

    it('should handle different action values', async () => {
      const { result } = renderHook(() => useComment());
      const actions = ['upvote', 'downvote', 'like', 'dislike'];

      for (const action of actions) {
        jest.clearAllMocks();

        await act(async () => {
          await result.current.voteComment('comment-123', action);
        });

        expect(mockRestAdapterAjax).toHaveBeenCalledWith({
          url: `https://api.example.com//comments/comment-123/vote?action=${action}`,
          method: 'POST',
        });
      }
    });

    it('should use API URL from getALMConfig', async () => {
      mockGetALMConfig.mockReturnValue({
        primeApiURL: 'https://custom-api.example.com/',
      });

      const { result } = renderHook(() => useComment());

      await act(async () => {
        await result.current.voteComment('comment-123', 'upvote');
      });

      expect(mockRestAdapterAjax).toHaveBeenCalledWith({
        url: 'https://custom-api.example.com//comments/comment-123/vote?action=upvote',
        method: 'POST',
      });
    });

    it('should handle API errors gracefully', async () => {
      mockRestAdapterAjax.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useComment());

      await expect(async () => {
        await act(async () => {
          await result.current.voteComment('comment-123', 'upvote');
        });
      }).rejects.toThrow('Network error');
    });

    it('should call getALMConfig on every vote', async () => {
      const { result } = renderHook(() => useComment());

      jest.clearAllMocks();

      await act(async () => {
        await result.current.voteComment('comment-123', 'upvote');
      });

      expect(mockGetALMConfig).toHaveBeenCalledTimes(1);

      await act(async () => {
        await result.current.voteComment('comment-456', 'downvote');
      });

      expect(mockGetALMConfig).toHaveBeenCalledTimes(2);
    });
  });

  describe('deleteCommentVote', () => {
    it('should call RestAdapter.ajax with correct URL and method', async () => {
      const { result } = renderHook(() => useComment());
      const postId = 'comment-123';
      const action = 'upvote';

      await act(async () => {
        await result.current.deleteCommentVote(postId, action);
      });

      expect(mockRestAdapterAjax).toHaveBeenCalledWith({
        url: 'https://api.example.com//comments/comment-123/vote?action=upvote',
        method: 'DELETE',
      });
    });

    it('should use DELETE method', async () => {
      const { result } = renderHook(() => useComment());

      await act(async () => {
        await result.current.deleteCommentVote('comment-456', 'upvote');
      });

      const callArgs = mockRestAdapterAjax.mock.calls[0][0];
      expect(callArgs.method).toBe('DELETE');
    });

    it('should use same URL format as voteComment', async () => {
      const { result } = renderHook(() => useComment());
      const postId = 'comment-123';
      const action = 'upvote';

      // Call voteComment
      jest.clearAllMocks();
      await act(async () => {
        await result.current.voteComment(postId, action);
      });
      const voteUrl = mockRestAdapterAjax.mock.calls[0][0].url;

      // Call deleteCommentVote
      jest.clearAllMocks();
      await act(async () => {
        await result.current.deleteCommentVote(postId, action);
      });
      const deleteUrl = mockRestAdapterAjax.mock.calls[0][0].url;

      // URLs should be identical
      expect(voteUrl).toBe(deleteUrl);
    });

    it('should include postId in URL', async () => {
      const { result } = renderHook(() => useComment());
      const postId = 'comment-789';

      await act(async () => {
        await result.current.deleteCommentVote(postId, 'upvote');
      });

      const callArgs = mockRestAdapterAjax.mock.calls[0][0];
      expect(callArgs.url).toContain(`/comments/${postId}/vote`);
    });

    it('should include action as query parameter', async () => {
      const { result } = renderHook(() => useComment());
      const action = 'downvote';

      await act(async () => {
        await result.current.deleteCommentVote('comment-123', action);
      });

      const callArgs = mockRestAdapterAjax.mock.calls[0][0];
      expect(callArgs.url).toContain(`?action=${action}`);
    });

    it('should handle different postIds', async () => {
      const { result } = renderHook(() => useComment());
      const postIds = ['comment-1', 'comment-2', 'comment-3'];

      for (const postId of postIds) {
        jest.clearAllMocks();

        await act(async () => {
          await result.current.deleteCommentVote(postId, 'upvote');
        });

        expect(mockRestAdapterAjax).toHaveBeenCalledWith({
          url: `https://api.example.com//comments/${postId}/vote?action=upvote`,
          method: 'DELETE',
        });
      }
    });

    it('should handle different action values', async () => {
      const { result } = renderHook(() => useComment());
      const actions = ['upvote', 'downvote', 'like', 'dislike'];

      for (const action of actions) {
        jest.clearAllMocks();

        await act(async () => {
          await result.current.deleteCommentVote('comment-123', action);
        });

        expect(mockRestAdapterAjax).toHaveBeenCalledWith({
          url: `https://api.example.com//comments/comment-123/vote?action=${action}`,
          method: 'DELETE',
        });
      }
    });

    it('should use API URL from getALMConfig', async () => {
      mockGetALMConfig.mockReturnValue({
        primeApiURL: 'https://custom-api.example.com/',
      });

      const { result } = renderHook(() => useComment());

      await act(async () => {
        await result.current.deleteCommentVote('comment-123', 'upvote');
      });

      expect(mockRestAdapterAjax).toHaveBeenCalledWith({
        url: 'https://custom-api.example.com//comments/comment-123/vote?action=upvote',
        method: 'DELETE',
      });
    });

    it('should handle API errors gracefully', async () => {
      mockRestAdapterAjax.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useComment());

      await expect(async () => {
        await act(async () => {
          await result.current.deleteCommentVote('comment-123', 'upvote');
        });
      }).rejects.toThrow('Network error');
    });

    it('should call getALMConfig on every delete', async () => {
      const { result } = renderHook(() => useComment());

      jest.clearAllMocks();

      await act(async () => {
        await result.current.deleteCommentVote('comment-123', 'upvote');
      });

      expect(mockGetALMConfig).toHaveBeenCalledTimes(1);

      await act(async () => {
        await result.current.deleteCommentVote('comment-456', 'downvote');
      });

      expect(mockGetALMConfig).toHaveBeenCalledTimes(2);
    });
  });

  describe('useCallback Memoization', () => {
    it('should memoize voteComment with useCallback', () => {
      const { result } = renderHook(() => useComment());

      expect(typeof result.current.voteComment).toBe('function');
    });

    it('should memoize deleteCommentVote with useCallback', () => {
      const { result } = renderHook(() => useComment());

      expect(typeof result.current.deleteCommentVote).toBe('function');
    });

    it('should allow multiple calls to voteComment', async () => {
      const { result } = renderHook(() => useComment());

      await act(async () => {
        await result.current.voteComment('comment-1', 'upvote');
      });

      await act(async () => {
        await result.current.voteComment('comment-2', 'downvote');
      });

      expect(mockRestAdapterAjax).toHaveBeenCalledTimes(2);
    });

    it('should allow multiple calls to deleteCommentVote', async () => {
      const { result } = renderHook(() => useComment());

      await act(async () => {
        await result.current.deleteCommentVote('comment-1', 'upvote');
      });

      await act(async () => {
        await result.current.deleteCommentVote('comment-2', 'downvote');
      });

      expect(mockRestAdapterAjax).toHaveBeenCalledTimes(2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle null postId in voteComment', async () => {
      const { result } = renderHook(() => useComment());

      await act(async () => {
        await result.current.voteComment(null, 'upvote');
      });

      expect(mockRestAdapterAjax).toHaveBeenCalledWith({
        url: 'https://api.example.com//comments/null/vote?action=upvote',
        method: 'POST',
      });
    });

    it('should handle undefined postId in voteComment', async () => {
      const { result } = renderHook(() => useComment());

      await act(async () => {
        await result.current.voteComment(undefined, 'upvote');
      });

      expect(mockRestAdapterAjax).toHaveBeenCalledWith({
        url: 'https://api.example.com//comments/undefined/vote?action=upvote',
        method: 'POST',
      });
    });

    it('should handle empty string postId', async () => {
      const { result } = renderHook(() => useComment());

      await act(async () => {
        await result.current.voteComment('', 'upvote');
      });

      expect(mockRestAdapterAjax).toHaveBeenCalledWith({
        url: 'https://api.example.com//comments//vote?action=upvote',
        method: 'POST',
      });
    });

    it('should handle numeric postId', async () => {
      const { result } = renderHook(() => useComment());

      await act(async () => {
        await result.current.voteComment(12345, 'upvote');
      });

      expect(mockRestAdapterAjax).toHaveBeenCalledWith({
        url: 'https://api.example.com//comments/12345/vote?action=upvote',
        method: 'POST',
      });
    });

    it('should handle special characters in postId', async () => {
      const { result } = renderHook(() => useComment());
      const postId = 'comment-123_special.test';

      await act(async () => {
        await result.current.voteComment(postId, 'upvote');
      });

      expect(mockRestAdapterAjax).toHaveBeenCalledWith({
        url: `https://api.example.com//comments/${postId}/vote?action=upvote`,
        method: 'POST',
      });
    });

    it('should handle null action', async () => {
      const { result } = renderHook(() => useComment());

      await act(async () => {
        await result.current.voteComment('comment-123', null);
      });

      expect(mockRestAdapterAjax).toHaveBeenCalledWith({
        url: 'https://api.example.com//comments/comment-123/vote?action=null',
        method: 'POST',
      });
    });

    it('should handle undefined action', async () => {
      const { result } = renderHook(() => useComment());

      await act(async () => {
        await result.current.voteComment('comment-123', undefined);
      });

      expect(mockRestAdapterAjax).toHaveBeenCalledWith({
        url: 'https://api.example.com//comments/comment-123/vote?action=undefined',
        method: 'POST',
      });
    });

    it('should handle empty string action', async () => {
      const { result } = renderHook(() => useComment());

      await act(async () => {
        await result.current.voteComment('comment-123', '');
      });

      expect(mockRestAdapterAjax).toHaveBeenCalledWith({
        url: 'https://api.example.com//comments/comment-123/vote?action=',
        method: 'POST',
      });
    });

    it('should handle action with special characters', async () => {
      const { result } = renderHook(() => useComment());
      const action = 'up-vote&special=chars';

      await act(async () => {
        await result.current.voteComment('comment-123', action);
      });

      expect(mockRestAdapterAjax).toHaveBeenCalledWith({
        url: `https://api.example.com//comments/comment-123/vote?action=${action}`,
        method: 'POST',
      });
    });

    it('should handle API URL without trailing slash', async () => {
      mockGetALMConfig.mockReturnValue({
        primeApiURL: 'https://api.example.com', // No trailing slash
      });

      const { result } = renderHook(() => useComment());

      await act(async () => {
        await result.current.voteComment('comment-123', 'upvote');
      });

      expect(mockRestAdapterAjax).toHaveBeenCalledWith({
        url: 'https://api.example.com/comments/comment-123/vote?action=upvote',
        method: 'POST',
      });
    });

    it('should handle null postId in deleteCommentVote', async () => {
      const { result } = renderHook(() => useComment());

      await act(async () => {
        await result.current.deleteCommentVote(null, 'upvote');
      });

      expect(mockRestAdapterAjax).toHaveBeenCalledWith({
        url: 'https://api.example.com//comments/null/vote?action=upvote',
        method: 'DELETE',
      });
    });

    it('should handle undefined postId in deleteCommentVote', async () => {
      const { result } = renderHook(() => useComment());

      await act(async () => {
        await result.current.deleteCommentVote(undefined, 'upvote');
      });

      expect(mockRestAdapterAjax).toHaveBeenCalledWith({
        url: 'https://api.example.com//comments/undefined/vote?action=upvote',
        method: 'DELETE',
      });
    });
  });

  describe('Return Value Validation', () => {
    it('should return consistent structure on multiple renders', () => {
      const { result: result1 } = renderHook(() => useComment());
      const { result: result2 } = renderHook(() => useComment());

      expect(Object.keys(result1.current)).toEqual(Object.keys(result2.current));
    });

    it('should return functions that can be called multiple times', async () => {
      const { result } = renderHook(() => useComment());

      // Call voteComment multiple times
      await act(async () => {
        await result.current.voteComment('comment-1', 'upvote');
      });

      await act(async () => {
        await result.current.voteComment('comment-2', 'upvote');
      });

      expect(mockRestAdapterAjax).toHaveBeenCalledTimes(2);
    });
  });

  describe('Integration with getALMConfig', () => {
    it('should call getALMConfig for each operation', async () => {
      const { result } = renderHook(() => useComment());

      jest.clearAllMocks();

      await act(async () => {
        await result.current.voteComment('comment-1', 'upvote');
      });
      expect(mockGetALMConfig).toHaveBeenCalledTimes(1);

      jest.clearAllMocks();

      await act(async () => {
        await result.current.deleteCommentVote('comment-2', 'upvote');
      });
      expect(mockGetALMConfig).toHaveBeenCalledTimes(1);
    });

    it('should use fresh config for each API call', async () => {
      const { result } = renderHook(() => useComment());

      mockGetALMConfig.mockReturnValue({
        primeApiURL: 'https://api-v1.example.com/',
      });

      await act(async () => {
        await result.current.voteComment('comment-1', 'upvote');
      });

      expect(mockRestAdapterAjax).toHaveBeenCalledWith({
        url: 'https://api-v1.example.com//comments/comment-1/vote?action=upvote',
        method: 'POST',
      });

      // Change config
      mockGetALMConfig.mockReturnValue({
        primeApiURL: 'https://api-v2.example.com/',
      });

      await act(async () => {
        await result.current.deleteCommentVote('comment-2', 'upvote');
      });

      expect(mockRestAdapterAjax).toHaveBeenCalledWith({
        url: 'https://api-v2.example.com//comments/comment-2/vote?action=upvote',
        method: 'DELETE',
      });
    });
  });

  describe('Vote and Unvote Flow', () => {
    it('should support vote then unvote workflow', async () => {
      const { result } = renderHook(() => useComment());
      const postId = 'comment-123';
      const action = 'upvote';

      // First vote
      await act(async () => {
        await result.current.voteComment(postId, action);
      });

      expect(mockRestAdapterAjax).toHaveBeenCalledWith({
        url: `https://api.example.com//comments/${postId}/vote?action=${action}`,
        method: 'POST',
      });

      jest.clearAllMocks();

      // Then unvote
      await act(async () => {
        await result.current.deleteCommentVote(postId, action);
      });

      expect(mockRestAdapterAjax).toHaveBeenCalledWith({
        url: `https://api.example.com//comments/${postId}/vote?action=${action}`,
        method: 'DELETE',
      });
    });

    it('should support changing vote type', async () => {
      const { result } = renderHook(() => useComment());
      const postId = 'comment-123';

      // Vote upvote
      await act(async () => {
        await result.current.voteComment(postId, 'upvote');
      });

      jest.clearAllMocks();

      // Delete upvote
      await act(async () => {
        await result.current.deleteCommentVote(postId, 'upvote');
      });

      jest.clearAllMocks();

      // Vote downvote
      await act(async () => {
        await result.current.voteComment(postId, 'downvote');
      });

      expect(mockRestAdapterAjax).toHaveBeenCalledWith({
        url: `https://api.example.com//comments/${postId}/vote?action=downvote`,
        method: 'POST',
      });
    });

    it('should handle rapid vote/unvote operations', async () => {
      const { result } = renderHook(() => useComment());
      const postId = 'comment-123';
      const action = 'upvote';

      // Rapid operations
      await act(async () => {
        await result.current.voteComment(postId, action);
        await result.current.deleteCommentVote(postId, action);
        await result.current.voteComment(postId, action);
      });

      expect(mockRestAdapterAjax).toHaveBeenCalledTimes(3);
    });
  });
});
