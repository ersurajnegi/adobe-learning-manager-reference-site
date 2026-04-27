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
 * Unit Tests for useReply Hook
 *
 * Simple hook for voting operations on replies (POST/DELETE).
 * Focused test suite with 100% coverage.
 */

import { act } from '@testing-library/react';
import React from 'react';
import ReactDOM from 'react-dom';
import { useReply } from '../../../almLib/hooks/community/useReply';

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

describe('useReply', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetALMConfig.mockReturnValue({
      primeApiURL: 'https://api.example.com/',
    });
    mockRestAdapterAjax.mockResolvedValue({ success: true });
  });

  describe('Hook Structure', () => {
    it('should return voteReply and deleteReplyVote functions', () => {
      const { result } = renderHook(() => useReply());

      expect(result.current).toEqual({
        voteReply: expect.any(Function),
        deleteReplyVote: expect.any(Function),
      });
    });

    it('should maintain stable function references across renders', () => {
      const { result, rerender } = renderHook(() => useReply());

      const initial = result.current;
      rerender();

      expect(result.current.voteReply).toBe(initial.voteReply);
      expect(result.current.deleteReplyVote).toBe(initial.deleteReplyVote);
    });
  });

  describe('voteReply', () => {
    it('should POST to correct URL with action query param', async () => {
      const { result } = renderHook(() => useReply());

      await act(async () => {
        await result.current.voteReply('reply-123', 'upvote');
      });

      expect(mockRestAdapterAjax).toHaveBeenCalledWith({
        url: 'https://api.example.com//replies/reply-123/vote?action=upvote',
        method: 'POST',
      });
    });

    it('should handle different reply IDs and actions', async () => {
      const { result } = renderHook(() => useReply());
      const testCases = [
        { id: 'reply-1', action: 'upvote' },
        { id: 'reply-2', action: 'downvote' },
        { id: 12345, action: 'like' },
      ];

      for (const { id, action } of testCases) {
        jest.clearAllMocks();

        await act(async () => {
          await result.current.voteReply(id, action);
        });

        expect(mockRestAdapterAjax).toHaveBeenCalledWith({
          url: `https://api.example.com//replies/${id}/vote?action=${action}`,
          method: 'POST',
        });
      }
    });

    it('should propagate API errors', async () => {
      mockRestAdapterAjax.mockRejectedValue(new Error('Network error'));
      const { result } = renderHook(() => useReply());

      await expect(
        act(async () => {
          await result.current.voteReply('reply-123', 'upvote');
        })
      ).rejects.toThrow('Network error');
    });
  });

  describe('deleteReplyVote', () => {
    it('should DELETE to correct URL with action query param', async () => {
      const { result } = renderHook(() => useReply());

      await act(async () => {
        await result.current.deleteReplyVote('reply-123', 'upvote');
      });

      expect(mockRestAdapterAjax).toHaveBeenCalledWith({
        url: 'https://api.example.com//replies/reply-123/vote?action=upvote',
        method: 'DELETE',
      });
    });

    it('should use same URL format as voteReply', async () => {
      const { result } = renderHook(() => useReply());

      await act(async () => {
        await result.current.voteReply('reply-123', 'upvote');
      });
      const voteUrl = mockRestAdapterAjax.mock.calls[0][0].url;

      jest.clearAllMocks();

      await act(async () => {
        await result.current.deleteReplyVote('reply-123', 'upvote');
      });
      const deleteUrl = mockRestAdapterAjax.mock.calls[0][0].url;

      expect(voteUrl).toBe(deleteUrl);
    });

    it('should handle different reply IDs and actions', async () => {
      const { result } = renderHook(() => useReply());
      const testCases = [
        { id: 'reply-1', action: 'upvote' },
        { id: 'reply-2', action: 'downvote' },
        { id: 12345, action: 'like' },
      ];

      for (const { id, action } of testCases) {
        jest.clearAllMocks();

        await act(async () => {
          await result.current.deleteReplyVote(id, action);
        });

        expect(mockRestAdapterAjax).toHaveBeenCalledWith({
          url: `https://api.example.com//replies/${id}/vote?action=${action}`,
          method: 'DELETE',
        });
      }
    });

    it('should propagate API errors', async () => {
      mockRestAdapterAjax.mockRejectedValue(new Error('Delete failed'));
      const { result } = renderHook(() => useReply());

      await expect(
        act(async () => {
          await result.current.deleteReplyVote('reply-123', 'upvote');
        })
      ).rejects.toThrow('Delete failed');
    });
  });

  describe('Edge Cases', () => {
    it('should handle URL without trailing slash', async () => {
      mockGetALMConfig.mockReturnValue({
        primeApiURL: 'https://api.example.com',
      });

      const { result } = renderHook(() => useReply());

      await act(async () => {
        await result.current.voteReply('reply-123', 'upvote');
      });

      expect(mockRestAdapterAjax).toHaveBeenCalledWith({
        url: 'https://api.example.com/replies/reply-123/vote?action=upvote',
        method: 'POST',
      });
    });

    it('should call getALMConfig for each operation', async () => {
      const { result } = renderHook(() => useReply());

      await act(async () => {
        await result.current.voteReply('reply-1', 'upvote');
      });
      expect(mockGetALMConfig).toHaveBeenCalledTimes(1);

      jest.clearAllMocks();

      await act(async () => {
        await result.current.deleteReplyVote('reply-2', 'downvote');
      });
      expect(mockGetALMConfig).toHaveBeenCalledTimes(1);
    });
  });
});
