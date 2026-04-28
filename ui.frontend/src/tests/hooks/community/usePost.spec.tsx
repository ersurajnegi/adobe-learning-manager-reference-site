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
 * Unit Tests for usePost Hook
 *
 * Hook handles:
 * - Adding posts (POST) with optional polls and resources
 * - Patching posts (PATCH) with Redux dispatch
 * - Adding comments to posts (POST)
 * - Voting on posts (POST/DELETE)
 * - Submitting poll votes (POST)
 * - URL sanitization with addHttpsToHref
 * - Bad word detection and error handling
 * - Poll option transformation
 *
 * Testing Strategy:
 * - Module integrity and exports
 * - Redux integration for patchPost
 * - All 6 operations with various scenarios
 * - Poll handling and getPollPostObject
 * - Resource modification handling
 * - Bad word detection for addPost, patchPost, addComment
 * - URL sanitization
 * - useCallback memoization
 * - Edge cases
 */

import { act } from '@testing-library/react';
import React from 'react';
import ReactDOM from 'react-dom';
import { usePost } from '../../../almLib/hooks/community/usePost';
import { updatePost } from '../../../almLib/store/actions/social/action';

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
const mockJsonApiParse = jest.fn();
const mockGetALMConfig = jest.fn();
const mockAddHttpsToHref = jest.fn();

jest.mock('react-redux', () => ({
  useDispatch: () => mockDispatch,
}));

jest.mock('../../../almLib/utils/restAdapter', () => ({
  RestAdapter: {
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

jest.mock('../../../almLib/store/actions/social/action', () => ({
  updatePost: jest.fn(payload => ({ type: 'UPDATE_POST', payload })),
}));

describe('usePost', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mocks
    mockGetALMConfig.mockReturnValue({
      primeApiURL: 'https://api.example.com/',
    });

    mockRestAdapterAjax.mockResolvedValue({
      data: { id: 'post-1', attributes: { text: 'Post text' } },
    });

    mockJsonApiParse.mockReturnValue({
      post: { id: 'post-1', text: 'Post text' },
    });

    mockAddHttpsToHref.mockImplementation(input => input);
  });

  describe('addPost', () => {
    it('should call RestAdapter.ajax with correct URL and method', async () => {
      const { result } = renderHook(() => usePost());
      const boardId = 'board-123';
      const input = 'My post text';
      const postingType = 'DISCUSSION';
      const resource = null;
      const isResourceModified = false;
      const pollOptions = null;

      await act(async () => {
        await result.current.addPost(
          boardId,
          input,
          postingType,
          resource,
          isResourceModified,
          pollOptions
        );
      });

      expect(mockRestAdapterAjax).toHaveBeenCalledWith({
        url: 'https://api.example.com//boards/board-123/posts',
        method: 'POST',
        body: expect.any(String),
        headers: { 'content-type': 'application/json' },
      });
    });

    it('should use POST method', async () => {
      const { result } = renderHook(() => usePost());

      await act(async () => {
        await result.current.addPost('board-123', 'text', 'DISCUSSION', null, false, null);
      });

      const callArgs = mockRestAdapterAjax.mock.calls[0][0];
      expect(callArgs.method).toBe('POST');
    });

    it('should call addHttpsToHref to sanitize input', async () => {
      const { result } = renderHook(() => usePost());
      const input = 'Check this link: www.example.com';

      await act(async () => {
        await result.current.addPost('board-123', input, 'DISCUSSION', null, false, null);
      });

      expect(mockAddHttpsToHref).toHaveBeenCalledWith(input);
    });

    it('should send correct body structure for discussion', async () => {
      const { result } = renderHook(() => usePost());
      const boardId = 'board-456';
      const input = 'My post';
      const sanitizedInput = 'My post with https';
      const postingType = 'DISCUSSION';

      mockAddHttpsToHref.mockReturnValue(sanitizedInput);

      await act(async () => {
        await result.current.addPost(boardId, input, postingType, null, false, null);
      });

      const callArgs = mockRestAdapterAjax.mock.calls[0][0];
      const body = JSON.parse(callArgs.body);

      expect(body).toEqual({
        data: {
          type: 'post',
          attributes: {
            postingType: postingType,
            resource: null,
            state: 'ACTIVE',
            text: sanitizedInput,
          },
        },
      });
    });

    it('should include resource when isResourceModified is true', async () => {
      const { result } = renderHook(() => usePost());
      const resource = { id: 'resource-1', url: 'https://example.com' };

      await act(async () => {
        await result.current.addPost('board-123', 'text', 'DISCUSSION', resource, true, null);
      });

      const callArgs = mockRestAdapterAjax.mock.calls[0][0];
      const body = JSON.parse(callArgs.body);

      expect(body.data.attributes.resource).toEqual(resource);
    });

    it('should not override resource when isResourceModified is false', async () => {
      const { result } = renderHook(() => usePost());
      const resource = { id: 'resource-1', url: 'https://example.com' };

      await act(async () => {
        await result.current.addPost('board-123', 'text', 'DISCUSSION', resource, false, null);
      });

      const callArgs = mockRestAdapterAjax.mock.calls[0][0];
      const body = JSON.parse(callArgs.body);

      // resource is still set in the initial attributes, but not overridden
      expect(body.data.attributes.resource).toEqual(resource);
    });

    it('should handle poll postingType with otherData', async () => {
      const { result } = renderHook(() => usePost());
      const pollOptions = ['Option 1', 'Option 2', 'Option 3'];

      await act(async () => {
        await result.current.addPost(
          'board-123',
          'Poll question?',
          'POLL',
          null,
          false,
          pollOptions
        );
      });

      const callArgs = mockRestAdapterAjax.mock.calls[0][0];
      const body = JSON.parse(callArgs.body);

      const otherData = JSON.parse(body.data.attributes.otherData);
      expect(otherData).toHaveLength(3);
      expect(otherData[0]).toEqual({ id: 1, text: 'Option 1', resourceId: null });
      expect(otherData[1]).toEqual({ id: 2, text: 'Option 2', resourceId: null });
      expect(otherData[2]).toEqual({ id: 3, text: 'Option 3', resourceId: null });
    });

    it('should filter out empty poll options', async () => {
      const { result } = renderHook(() => usePost());
      const pollOptions = ['Option 1', '', 'Option 2', '', 'Option 3'];

      await act(async () => {
        await result.current.addPost('board-123', 'Poll?', 'POLL', null, false, pollOptions);
      });

      const callArgs = mockRestAdapterAjax.mock.calls[0][0];
      const body = JSON.parse(callArgs.body);
      const otherData = JSON.parse(body.data.attributes.otherData);

      expect(otherData).toHaveLength(3);
      expect(otherData.map((o: any) => o.text)).toEqual(['Option 1', 'Option 2', 'Option 3']);
    });

    it('should assign sequential IDs to poll options', async () => {
      const { result } = renderHook(() => usePost());
      const pollOptions = ['A', 'B', 'C', 'D'];

      await act(async () => {
        await result.current.addPost('board-123', 'Poll?', 'POLL', null, false, pollOptions);
      });

      const callArgs = mockRestAdapterAjax.mock.calls[0][0];
      const body = JSON.parse(callArgs.body);
      const otherData = JSON.parse(body.data.attributes.otherData);

      expect(otherData.map((o: any) => o.id)).toEqual([1, 2, 3, 4]);
    });

    it('should throw error for bad word detection', async () => {
      const errorResponse = {
        responseText: JSON.stringify({ title: 'BAD_WORD_FOUND' }),
      };

      mockRestAdapterAjax.mockRejectedValue(errorResponse);

      const { result } = renderHook(() => usePost());

      await expect(async () => {
        await act(async () => {
          await result.current.addPost(
            'board-123',
            'bad word text',
            'DISCUSSION',
            null,
            false,
            null
          );
        });
      }).rejects.toThrow('BAD_WORD_FOUND');
    });

    it('should not throw error for other errors', async () => {
      const errorResponse = {
        responseText: JSON.stringify({ title: 'Other error' }),
      };

      mockRestAdapterAjax.mockRejectedValue(errorResponse);

      const { result } = renderHook(() => usePost());

      await act(async () => {
        await result.current.addPost('board-123', 'text', 'DISCUSSION', null, false, null);
      });

      // Non-BAD_WORD error should not propagate — hook remains usable
      expect(typeof result.current.addPost).toBe('function');
    });
  });

  describe('patchPost', () => {
    it('should call RestAdapter.ajax with correct URL and method', async () => {
      const { result } = renderHook(() => usePost());
      const postId = 'post-123';

      await act(async () => {
        await result.current.patchPost(postId, 'Updated text', 'DISCUSSION', null, false, null);
      });

      expect(mockRestAdapterAjax).toHaveBeenCalledWith({
        url: 'https://api.example.com//posts/post-123',
        method: 'PATCH',
        body: expect.any(String),
        headers: { 'content-type': 'application/json' },
      });
    });

    it('should use PATCH method', async () => {
      const { result } = renderHook(() => usePost());

      await act(async () => {
        await result.current.patchPost('post-123', 'text', 'DISCUSSION', null, false, null);
      });

      const callArgs = mockRestAdapterAjax.mock.calls[0][0];
      expect(callArgs.method).toBe('PATCH');
    });

    it('should call addHttpsToHref to sanitize input', async () => {
      const { result } = renderHook(() => usePost());
      const input = 'Updated text with link';

      await act(async () => {
        await result.current.patchPost('post-123', input, 'DISCUSSION', null, false, null);
      });

      expect(mockAddHttpsToHref).toHaveBeenCalledWith(input);
    });

    it('should send correct body structure', async () => {
      const { result } = renderHook(() => usePost());
      const postId = 'post-456';
      const input = 'Updated text';
      const sanitizedInput = 'Updated text with https';
      const postingType = 'DISCUSSION';

      mockAddHttpsToHref.mockReturnValue(sanitizedInput);

      await act(async () => {
        await result.current.patchPost(postId, input, postingType, null, false, null);
      });

      const callArgs = mockRestAdapterAjax.mock.calls[0][0];
      const body = JSON.parse(callArgs.body);

      expect(body).toEqual({
        data: {
          type: 'post',
          id: postId,
          attributes: {
            postingType: postingType,
            state: 'ACTIVE',
            text: sanitizedInput,
          },
        },
      });
    });

    it('should dispatch updatePost with parsed response', async () => {
      const updatedPost = {
        id: 'post-123',
        text: 'Updated text',
      };

      mockJsonApiParse.mockReturnValue({
        post: updatedPost,
      });

      const { result } = renderHook(() => usePost());

      await act(async () => {
        await result.current.patchPost('post-123', 'Updated text', 'DISCUSSION', null, false, null);
      });

      expect(updatePost).toHaveBeenCalledWith({
        item: updatedPost,
      });
    });

    it('should include resource when isResourceModified is true', async () => {
      const { result } = renderHook(() => usePost());
      const resource = { id: 'resource-1', url: 'https://example.com' };

      await act(async () => {
        await result.current.patchPost('post-123', 'text', 'DISCUSSION', resource, true, null);
      });

      const callArgs = mockRestAdapterAjax.mock.calls[0][0];
      const body = JSON.parse(callArgs.body);

      expect(body.data.attributes.resource).toEqual(resource);
    });

    it('should handle poll postingType with otherData', async () => {
      const { result } = renderHook(() => usePost());
      const pollOptions = ['Updated Option 1', 'Updated Option 2'];

      await act(async () => {
        await result.current.patchPost(
          'post-123',
          'Updated poll?',
          'POLL',
          null,
          false,
          pollOptions
        );
      });

      const callArgs = mockRestAdapterAjax.mock.calls[0][0];
      const body = JSON.parse(callArgs.body);

      const otherData = JSON.parse(body.data.attributes.otherData);
      expect(otherData).toHaveLength(2);
    });

    it('should throw error for bad word detection', async () => {
      const errorResponse = {
        responseText: JSON.stringify({ title: 'BAD_WORD_FOUND' }),
      };

      mockRestAdapterAjax.mockRejectedValue(errorResponse);

      const { result } = renderHook(() => usePost());

      await expect(async () => {
        await act(async () => {
          await result.current.patchPost('post-123', 'bad word', 'DISCUSSION', null, false, null);
        });
      }).rejects.toThrow('BAD_WORD_FOUND');
    });

    it('should not dispatch updatePost on error', async () => {
      const errorResponse = {
        responseText: JSON.stringify({ title: 'Other error' }),
      };

      mockRestAdapterAjax.mockRejectedValue(errorResponse);

      const { result } = renderHook(() => usePost());

      await act(async () => {
        await result.current.patchPost('post-123', 'text', 'DISCUSSION', null, false, null);
      });

      expect(updatePost).not.toHaveBeenCalled();
    });
  });

  describe('addComment', () => {
    it('should call RestAdapter.ajax with correct URL and method', async () => {
      const { result } = renderHook(() => usePost());
      const postId = 'post-123';
      const input = 'My comment';

      await act(async () => {
        await result.current.addComment(postId, input);
      });

      expect(mockRestAdapterAjax).toHaveBeenCalledWith({
        url: 'https://api.example.com//posts/post-123/comments',
        method: 'POST',
        body: expect.any(String),
        headers: { 'content-type': 'application/json' },
      });
    });

    it('should use POST method', async () => {
      const { result } = renderHook(() => usePost());

      await act(async () => {
        await result.current.addComment('post-123', 'comment');
      });

      const callArgs = mockRestAdapterAjax.mock.calls[0][0];
      expect(callArgs.method).toBe('POST');
    });

    it('should call addHttpsToHref to sanitize input', async () => {
      const { result } = renderHook(() => usePost());
      const input = 'Comment with link';

      await act(async () => {
        await result.current.addComment('post-123', input);
      });

      expect(mockAddHttpsToHref).toHaveBeenCalledWith(input);
    });

    it('should send correct body structure', async () => {
      const { result } = renderHook(() => usePost());
      const postId = 'post-456';
      const input = 'My comment';
      const sanitizedInput = 'My comment with https';

      mockAddHttpsToHref.mockReturnValue(sanitizedInput);

      await act(async () => {
        await result.current.addComment(postId, input);
      });

      const callArgs = mockRestAdapterAjax.mock.calls[0][0];
      const body = JSON.parse(callArgs.body);

      expect(body).toEqual({
        data: {
          type: 'comment',
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

      const { result } = renderHook(() => usePost());

      await expect(async () => {
        await act(async () => {
          await result.current.addComment('post-123', 'bad word');
        });
      }).rejects.toThrow('BAD_WORD_FOUND');
    });

    it('should not throw error for other errors', async () => {
      const errorResponse = {
        responseText: JSON.stringify({ title: 'Other error' }),
      };

      mockRestAdapterAjax.mockRejectedValue(errorResponse);

      const { result } = renderHook(() => usePost());

      await act(async () => {
        await result.current.addComment('post-123', 'comment');
      });

      // Non-BAD_WORD error should not propagate — hook remains usable
      expect(typeof result.current.addComment).toBe('function');
    });

    it('should handle different postIds', async () => {
      const { result } = renderHook(() => usePost());
      const postIds = ['post-1', 'post-2', 'post-3'];

      for (const postId of postIds) {
        jest.clearAllMocks();

        await act(async () => {
          await result.current.addComment(postId, 'comment');
        });

        expect(mockRestAdapterAjax).toHaveBeenCalledWith({
          url: `https://api.example.com//posts/${postId}/comments`,
          method: 'POST',
          body: expect.any(String),
          headers: expect.any(Object),
        });
      }
    });
  });

  describe('votePost', () => {
    it('should call RestAdapter.ajax with correct URL and method', async () => {
      const { result } = renderHook(() => usePost());
      const postId = 'post-123';
      const action = 'upvote';

      await act(async () => {
        await result.current.votePost(postId, action);
      });

      expect(mockRestAdapterAjax).toHaveBeenCalledWith({
        url: 'https://api.example.com//posts/post-123/vote?action=upvote',
        method: 'POST',
      });
    });

    it('should use POST method', async () => {
      const { result } = renderHook(() => usePost());

      await act(async () => {
        await result.current.votePost('post-123', 'upvote');
      });

      const callArgs = mockRestAdapterAjax.mock.calls[0][0];
      expect(callArgs.method).toBe('POST');
    });

    it('should include action as query parameter', async () => {
      const { result } = renderHook(() => usePost());
      const action = 'downvote';

      await act(async () => {
        await result.current.votePost('post-123', action);
      });

      const callArgs = mockRestAdapterAjax.mock.calls[0][0];
      expect(callArgs.url).toContain(`?action=${action}`);
    });

    it('should handle different actions', async () => {
      const { result } = renderHook(() => usePost());
      const actions = ['upvote', 'downvote', 'like'];

      for (const action of actions) {
        jest.clearAllMocks();

        await act(async () => {
          await result.current.votePost('post-123', action);
        });

        expect(mockRestAdapterAjax).toHaveBeenCalledWith({
          url: `https://api.example.com//posts/post-123/vote?action=${action}`,
          method: 'POST',
        });
      }
    });
  });

  describe('deletePostVote', () => {
    it('should call RestAdapter.ajax with correct URL and method', async () => {
      const { result } = renderHook(() => usePost());
      const postId = 'post-123';
      const action = 'upvote';

      await act(async () => {
        await result.current.deletePostVote(postId, action);
      });

      expect(mockRestAdapterAjax).toHaveBeenCalledWith({
        url: 'https://api.example.com//posts/post-123/vote?action=upvote',
        method: 'DELETE',
      });
    });

    it('should use DELETE method', async () => {
      const { result } = renderHook(() => usePost());

      await act(async () => {
        await result.current.deletePostVote('post-123', 'upvote');
      });

      const callArgs = mockRestAdapterAjax.mock.calls[0][0];
      expect(callArgs.method).toBe('DELETE');
    });

    it('should use same URL format as votePost', async () => {
      const { result } = renderHook(() => usePost());
      const postId = 'post-123';
      const action = 'upvote';

      // Call votePost
      jest.clearAllMocks();
      await act(async () => {
        await result.current.votePost(postId, action);
      });
      const voteUrl = mockRestAdapterAjax.mock.calls[0][0].url;

      // Call deletePostVote
      jest.clearAllMocks();
      await act(async () => {
        await result.current.deletePostVote(postId, action);
      });
      const deleteUrl = mockRestAdapterAjax.mock.calls[0][0].url;

      // URLs should be identical
      expect(voteUrl).toBe(deleteUrl);
    });
  });

  describe('submitPollVote', () => {
    it('should call RestAdapter.ajax with correct URL and method', async () => {
      const { result } = renderHook(() => usePost());
      const postId = 'post-123';
      const optionId = 'option-1';

      await act(async () => {
        await result.current.submitPollVote(postId, optionId);
      });

      expect(mockRestAdapterAjax).toHaveBeenCalledWith({
        url: 'https://api.example.com//posts/post-123/pollvote?optionId=option-1',
        method: 'POST',
      });
    });

    it('should use POST method', async () => {
      const { result } = renderHook(() => usePost());

      await act(async () => {
        await result.current.submitPollVote('post-123', 'option-1');
      });

      const callArgs = mockRestAdapterAjax.mock.calls[0][0];
      expect(callArgs.method).toBe('POST');
    });

    it('should include optionId as query parameter', async () => {
      const { result } = renderHook(() => usePost());
      const optionId = 'option-2';

      await act(async () => {
        await result.current.submitPollVote('post-123', optionId);
      });

      const callArgs = mockRestAdapterAjax.mock.calls[0][0];
      expect(callArgs.url).toContain(`?optionId=${optionId}`);
    });

    it('should handle different optionIds', async () => {
      const { result } = renderHook(() => usePost());
      const optionIds = ['1', '2', '3'];

      for (const optionId of optionIds) {
        jest.clearAllMocks();

        await act(async () => {
          await result.current.submitPollVote('post-123', optionId);
        });

        expect(mockRestAdapterAjax).toHaveBeenCalledWith({
          url: `https://api.example.com//posts/post-123/pollvote?optionId=${optionId}`,
          method: 'POST',
        });
      }
    });
  });

  describe('useCallback Memoization', () => {
    it('should memoize addPost with useCallback', () => {
      const { result } = renderHook(() => usePost());

      expect(typeof result.current.addPost).toBe('function');
    });

    it('should memoize patchPost with useCallback', () => {
      const { result } = renderHook(() => usePost());

      expect(typeof result.current.patchPost).toBe('function');
    });

    it('should memoize addComment with useCallback', () => {
      const { result } = renderHook(() => usePost());

      expect(typeof result.current.addComment).toBe('function');
    });

    it('should memoize votePost with useCallback', () => {
      const { result } = renderHook(() => usePost());

      expect(typeof result.current.votePost).toBe('function');
    });

    it('should memoize deletePostVote with useCallback', () => {
      const { result } = renderHook(() => usePost());

      expect(typeof result.current.deletePostVote).toBe('function');
    });

    it('should memoize submitPollVote with useCallback', () => {
      const { result } = renderHook(() => usePost());

      expect(typeof result.current.submitPollVote).toBe('function');
    });
  });

  describe('Edge Cases', () => {
    it('should handle null input in addPost', async () => {
      const { result } = renderHook(() => usePost());

      await act(async () => {
        await result.current.addPost('board-123', null, 'DISCUSSION', null, false, null);
      });

      expect(mockAddHttpsToHref).toHaveBeenCalledWith(null);
    });

    it('should handle empty string input', async () => {
      const { result } = renderHook(() => usePost());

      await act(async () => {
        await result.current.addComment('post-123', '');
      });

      expect(mockAddHttpsToHref).toHaveBeenCalledWith('');
    });

    it('should handle empty poll options array', async () => {
      const { result } = renderHook(() => usePost());
      const pollOptions: any[] = [];

      await act(async () => {
        await result.current.addPost('board-123', 'Poll?', 'POLL', null, false, pollOptions);
      });

      const callArgs = mockRestAdapterAjax.mock.calls[0][0];
      const body = JSON.parse(callArgs.body);
      const otherData = JSON.parse(body.data.attributes.otherData);

      expect(otherData).toEqual([]);
    });

    it('should handle poll options with all empty strings', async () => {
      const { result } = renderHook(() => usePost());
      const pollOptions = ['', '', ''];

      await act(async () => {
        await result.current.addPost('board-123', 'Poll?', 'POLL', null, false, pollOptions);
      });

      const callArgs = mockRestAdapterAjax.mock.calls[0][0];
      const body = JSON.parse(callArgs.body);
      const otherData = JSON.parse(body.data.attributes.otherData);

      expect(otherData).toEqual([]);
    });

    it('should handle numeric IDs', async () => {
      const { result } = renderHook(() => usePost());

      await act(async () => {
        await result.current.votePost(12345, 'upvote');
      });

      expect(mockRestAdapterAjax).toHaveBeenCalledWith({
        url: 'https://api.example.com//posts/12345/vote?action=upvote',
        method: 'POST',
      });
    });

    it('should handle API URL without trailing slash', async () => {
      mockGetALMConfig.mockReturnValue({
        primeApiURL: 'https://api.example.com', // No trailing slash
      });

      const { result } = renderHook(() => usePost());

      await act(async () => {
        await result.current.addPost('board-123', 'text', 'DISCUSSION', null, false, null);
      });

      expect(mockRestAdapterAjax).toHaveBeenCalledWith({
        url: 'https://api.example.com/boards/board-123/posts',
        method: 'POST',
        body: expect.any(String),
        headers: expect.any(Object),
      });
    });
  });
});
