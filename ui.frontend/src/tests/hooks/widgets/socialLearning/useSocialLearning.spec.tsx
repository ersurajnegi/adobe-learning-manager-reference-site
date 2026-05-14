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
 * Unit Tests for useSocialLearning Hook
 *
 * Hook handles:
 * - Fetching social learning posts on mount
 * - Managing multiple UI states (posts, showExploreBox, emptyView, fetchingData)
 * - Excluding current user's posts
 * - Handling empty states and explore box visibility
 * - API integration via RestAdapter and JsonApiParse
 */

// Mock dependencies BEFORE imports
jest.mock('../../../../almLib/utils/widgets/utils', () => ({
  getUserId: jest.fn(),
}));

jest.mock('../../../../almLib/utils/restAdapter', () => ({
  RestAdapter: {
    get: jest.fn(),
  },
}));

jest.mock('../../../../almLib/utils/global', () => ({
  getALMConfig: jest.fn(),
}));

jest.mock('../../../../almLib/utils/jsonAPIAdapter', () => ({
  JsonApiParse: jest.fn(),
}));

import { act } from '@testing-library/react';
import React from 'react';
import ReactDOM from 'react-dom';
import { useSocialLearning } from '../../../../almLib/hooks/widgets/socialLearning/useSocialLearning';
import { getUserId } from '../../../../almLib/utils/widgets/utils';
import { RestAdapter } from '../../../../almLib/utils/restAdapter';
import { getALMConfig } from '../../../../almLib/utils/global';
import { JsonApiParse } from '../../../../almLib/utils/jsonAPIAdapter';

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

describe('useSocialLearning', () => {
  const mockGetUserId = getUserId as jest.MockedFunction<typeof getUserId>;
  const mockRestAdapterGet = RestAdapter.get as jest.MockedFunction<typeof RestAdapter.get>;
  const mockGetALMConfig = getALMConfig as jest.MockedFunction<typeof getALMConfig>;
  const mockJsonApiParse = JsonApiParse as jest.MockedFunction<typeof JsonApiParse>;

  const mockConfig = {
    primeApiURL: 'https://learningmanager.adobe.com/primeapi/v2',
  };

  const mockApiResponse = {
    data: [
      {
        id: 'post-1',
        type: 'socialPost',
        attributes: {
          text: 'Great learning resource!',
          createdBy: 'user-2',
        },
      },
      {
        id: 'post-2',
        type: 'socialPost',
        attributes: {
          text: 'Check out this course',
          createdBy: 'user-3',
        },
      },
      {
        id: 'post-3',
        type: 'socialPost',
        attributes: {
          text: 'Amazing content',
          createdBy: 'user-4',
        },
      },
    ],
  };

  const mockParsedResponse = {
    postList: [
      { id: 'post-1', text: 'Great learning resource!', createdBy: 'user-2' },
      { id: 'post-2', text: 'Check out this course', createdBy: 'user-3' },
      { id: 'post-3', text: 'Amazing content', createdBy: 'user-4' },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetALMConfig.mockReturnValue(mockConfig as any);
    mockGetUserId.mockResolvedValue('user-1');

    // Suppress console.log in tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    (console.log as jest.Mock).mockRestore();
  });

  describe('Hook Initialization', () => {
    it('should start with fetchingData as true', () => {
      const { result } = renderHook(() => useSocialLearning());

      // Before useEffect completes
      expect(result.current.fetchingData).toBe(true);
    });

    it('should start with empty posts array', () => {
      const { result } = renderHook(() => useSocialLearning());

      expect(result.current.posts).toEqual([]);
    });

    it('should start with showExploreBox as false', () => {
      const { result } = renderHook(() => useSocialLearning());

      expect(result.current.showExploreBox).toBe(false);
    });

    it('should start with emptyView as false', () => {
      const { result } = renderHook(() => useSocialLearning());

      expect(result.current.emptyView).toBe(false);
    });
  });

  describe('useEffect - Auto Fetch on Mount', () => {
    it('should fetch posts on mount', async () => {
      mockRestAdapterGet.mockResolvedValue(mockApiResponse);
      mockJsonApiParse.mockReturnValue(mockParsedResponse);

      await act(async () => {
        renderHook(() => useSocialLearning());
      });

      expect(mockGetUserId).toHaveBeenCalled();
      expect(mockRestAdapterGet).toHaveBeenCalled();
    });

    it('should set fetchingData to false after mount fetch completes', async () => {
      mockRestAdapterGet.mockResolvedValue(mockApiResponse);
      mockJsonApiParse.mockReturnValue(mockParsedResponse);

      const { result } = renderHook(() => useSocialLearning());

      await act(async () => {
      });

      expect(result.current.fetchingData).toBe(false);
    });

    it('should set fetchingData to false even if fetch fails', async () => {
      mockGetUserId.mockResolvedValue('user-1');
      mockRestAdapterGet.mockRejectedValue(new Error('Network Error'));

      const { result } = renderHook(() => useSocialLearning());

      await act(async () => {
      });

      expect(result.current.fetchingData).toBe(false);
    });

    it('should update posts after successful fetch', async () => {
      mockRestAdapterGet.mockResolvedValue(mockApiResponse);
      mockJsonApiParse.mockReturnValue(mockParsedResponse);

      const { result } = renderHook(() => useSocialLearning());

      await act(async () => {
      });

      expect(result.current.posts).toEqual(mockParsedResponse.postList);
    });
  });

  describe('getPosts - User ID Handling', () => {
    it('should call getUserId', async () => {
      mockRestAdapterGet.mockResolvedValue(mockApiResponse);
      mockJsonApiParse.mockReturnValue(mockParsedResponse);

      await act(async () => {
        renderHook(() => useSocialLearning());
      });

      expect(mockGetUserId).toHaveBeenCalled();
    });

    it('should not fetch posts if userId is null', async () => {
      mockGetUserId.mockResolvedValue(null);

      const { result } = renderHook(() => useSocialLearning());

      await act(async () => {
      });

      expect(mockRestAdapterGet).not.toHaveBeenCalled();
      expect(result.current.posts).toEqual([]);
    });

    it('should not fetch posts if userId is undefined', async () => {
      mockGetUserId.mockResolvedValue(undefined as any);

      const { result } = renderHook(() => useSocialLearning());

      await act(async () => {
      });

      expect(mockRestAdapterGet).not.toHaveBeenCalled();
    });

    it('should not fetch posts if userId is empty string', async () => {
      mockGetUserId.mockResolvedValue('');

      const { result } = renderHook(() => useSocialLearning());

      await act(async () => {
      });

      expect(mockRestAdapterGet).not.toHaveBeenCalled();
    });

    it('should exclude current user posts in params', async () => {
      mockGetUserId.mockResolvedValue('user-123');
      mockRestAdapterGet.mockResolvedValue(mockApiResponse);
      mockJsonApiParse.mockReturnValue(mockParsedResponse);

      await act(async () => {
        renderHook(() => useSocialLearning());
      });

      expect(mockRestAdapterGet).toHaveBeenCalledWith(
        expect.objectContaining({
          params: expect.objectContaining({
            excludePostBy: 'user-123',
          }),
        })
      );
    });
  });

  describe('getPosts - API Call Parameters', () => {
    it('should use correct API endpoint', async () => {
      mockRestAdapterGet.mockResolvedValue(mockApiResponse);
      mockJsonApiParse.mockReturnValue(mockParsedResponse);

      await act(async () => {
        renderHook(() => useSocialLearning());
      });

      expect(mockRestAdapterGet).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'https://learningmanager.adobe.com/primeapi/v2/posts',
        })
      );
    });

    it('should include createdBy in params', async () => {
      mockRestAdapterGet.mockResolvedValue(mockApiResponse);
      mockJsonApiParse.mockReturnValue(mockParsedResponse);

      await act(async () => {
        renderHook(() => useSocialLearning());
      });

      const callParams = mockRestAdapterGet.mock.calls[0][0].params;
      expect(callParams['include']).toBe('createdBy');
    });

    it('should limit results to 3 posts', async () => {
      mockRestAdapterGet.mockResolvedValue(mockApiResponse);
      mockJsonApiParse.mockReturnValue(mockParsedResponse);

      await act(async () => {
        renderHook(() => useSocialLearning());
      });

      const callParams = mockRestAdapterGet.mock.calls[0][0].params;
      expect(callParams['page[limit]']).toBe(3);
    });

    it('should filter by allBoards category', async () => {
      mockRestAdapterGet.mockResolvedValue(mockApiResponse);
      mockJsonApiParse.mockReturnValue(mockParsedResponse);

      await act(async () => {
        renderHook(() => useSocialLearning());
      });

      const callParams = mockRestAdapterGet.mock.calls[0][0].params;
      expect(callParams['filter.board.category']).toBe('allBoards');
    });

    it('should filter by ACTIVE state', async () => {
      mockRestAdapterGet.mockResolvedValue(mockApiResponse);
      mockJsonApiParse.mockReturnValue(mockParsedResponse);

      await act(async () => {
        renderHook(() => useSocialLearning());
      });

      const callParams = mockRestAdapterGet.mock.calls[0][0].params;
      expect(callParams['filter.state']).toBe('ACTIVE');
    });

    it('should pass all required params', async () => {
      mockRestAdapterGet.mockResolvedValue(mockApiResponse);
      mockJsonApiParse.mockReturnValue(mockParsedResponse);

      await act(async () => {
        renderHook(() => useSocialLearning());
      });

      expect(mockRestAdapterGet).toHaveBeenCalledWith({
        url: expect.any(String),
        params: {
          include: 'createdBy',
          'page[limit]': 3,
          excludePostBy: 'user-1',
          'filter.board.category': 'allBoards',
          'filter.state': 'ACTIVE',
        },
      });
    });
  });

  describe('State Updates Based on Post Count', () => {
    it('should set emptyView to true when postList is null', async () => {
      mockRestAdapterGet.mockResolvedValue(mockApiResponse);
      mockJsonApiParse.mockReturnValue({ postList: null });

      const { result } = renderHook(() => useSocialLearning());

      await act(async () => {
      });

      expect(result.current.emptyView).toBe(true);
      expect(result.current.posts).toEqual([]);
    });

    it('should set emptyView to true when postList is empty array', async () => {
      mockRestAdapterGet.mockResolvedValue(mockApiResponse);
      mockJsonApiParse.mockReturnValue({ postList: [] });

      const { result } = renderHook(() => useSocialLearning());

      await act(async () => {
      });

      expect(result.current.emptyView).toBe(true);
      expect(result.current.posts).toEqual([]);
    });

    it('should set showExploreBox to true when postList has 1 post', async () => {
      const onePostResponse = {
        postList: [{ id: 'post-1', text: 'Single post' }],
      };
      mockRestAdapterGet.mockResolvedValue(mockApiResponse);
      mockJsonApiParse.mockReturnValue(onePostResponse);

      const { result } = renderHook(() => useSocialLearning());

      await act(async () => {
      });

      expect(result.current.showExploreBox).toBe(true);
      expect(result.current.emptyView).toBe(false);
      expect(result.current.posts).toHaveLength(1);
    });

    it('should set showExploreBox to true when postList has 2 posts', async () => {
      const twoPostsResponse = {
        postList: [
          { id: 'post-1', text: 'First post' },
          { id: 'post-2', text: 'Second post' },
        ],
      };
      mockRestAdapterGet.mockResolvedValue(mockApiResponse);
      mockJsonApiParse.mockReturnValue(twoPostsResponse);

      const { result } = renderHook(() => useSocialLearning());

      await act(async () => {
      });

      expect(result.current.showExploreBox).toBe(true);
      expect(result.current.emptyView).toBe(false);
      expect(result.current.posts).toHaveLength(2);
    });

    it('should not set showExploreBox when postList has 3 posts', async () => {
      mockRestAdapterGet.mockResolvedValue(mockApiResponse);
      mockJsonApiParse.mockReturnValue(mockParsedResponse);

      const { result } = renderHook(() => useSocialLearning());

      await act(async () => {
      });

      expect(result.current.showExploreBox).toBe(false);
      expect(result.current.emptyView).toBe(false);
      expect(result.current.posts).toHaveLength(3);
    });

    it('should handle exactly 2 posts (boundary condition)', async () => {
      const twoPostsResponse = {
        postList: [
          { id: 'post-1', text: 'Post 1' },
          { id: 'post-2', text: 'Post 2' },
        ],
      };
      mockRestAdapterGet.mockResolvedValue(mockApiResponse);
      mockJsonApiParse.mockReturnValue(twoPostsResponse);

      const { result } = renderHook(() => useSocialLearning());

      await act(async () => {
      });

      expect(result.current.showExploreBox).toBe(true);
      expect(result.current.posts).toHaveLength(2);
    });
  });

  describe('Error Handling', () => {
    it('should handle getUserId error', async () => {
      mockGetUserId.mockRejectedValue(new Error('User ID Error'));

      const { result } = renderHook(() => useSocialLearning());

      await act(async () => {
      });

      expect(result.current.fetchingData).toBe(false);
      expect(console.log).toHaveBeenCalled();
    });

    it('should handle API error', async () => {
      mockRestAdapterGet.mockRejectedValue(new Error('API Error'));

      const { result } = renderHook(() => useSocialLearning());

      await act(async () => {
      });

      expect(console.log).toHaveBeenCalled();
      expect(result.current.posts).toEqual([]);
    });

    it('should log error to console on API failure', async () => {
      const mockError = new Error('Network Error');
      mockRestAdapterGet.mockRejectedValue(mockError);

      await act(async () => {
        renderHook(() => useSocialLearning());
      });

      expect(console.log).toHaveBeenCalledWith(mockError);
    });

    it('should not throw error on API failure', async () => {
      mockRestAdapterGet.mockRejectedValue(new Error('API Error'));

      let result: any;
      await act(async () => {
        result = renderHook(() => useSocialLearning()).result;
      });

      // Hook should still expose its return value after API failure
      expect(result.current.posts).toEqual([]);
      expect(result.current.fetchingData).toBe(false);
    });

    it('should handle JsonApiParse error', async () => {
      mockRestAdapterGet.mockResolvedValue(mockApiResponse);
      mockJsonApiParse.mockImplementation(() => {
        throw new Error('Parse Error');
      });

      const { result } = renderHook(() => useSocialLearning());

      await act(async () => {
      });

      expect(console.log).toHaveBeenCalled();
      expect(result.current.posts).toEqual([]);
    });

    it('should set fetchingData to false after error in outer try/catch', async () => {
      mockGetUserId.mockRejectedValue(new Error('User Error'));

      const { result } = renderHook(() => useSocialLearning());

      await act(async () => {
      });

      expect(result.current.fetchingData).toBe(false);
    });
  });

  describe('JsonApiParse Integration', () => {
    it('should parse API response', async () => {
      mockRestAdapterGet.mockResolvedValue(mockApiResponse);
      mockJsonApiParse.mockReturnValue(mockParsedResponse);

      await act(async () => {
        renderHook(() => useSocialLearning());
      });

      expect(mockJsonApiParse).toHaveBeenCalledWith(mockApiResponse);
    });

    it('should extract postList from parsed response', async () => {
      const customResponse = {
        postList: [{ id: 'custom', text: 'Custom post' }],
        otherData: 'ignored',
      };
      mockRestAdapterGet.mockResolvedValue(mockApiResponse);
      mockJsonApiParse.mockReturnValue(customResponse);

      const { result } = renderHook(() => useSocialLearning());

      await act(async () => {
      });

      expect(result.current.posts).toEqual(customResponse.postList);
    });

    it('should handle response without postList property', async () => {
      mockRestAdapterGet.mockResolvedValue(mockApiResponse);
      mockJsonApiParse.mockReturnValue({});

      const { result } = renderHook(() => useSocialLearning());

      await act(async () => {
      });

      expect(result.current.posts).toEqual([]);
      expect(result.current.emptyView).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined postList', async () => {
      mockRestAdapterGet.mockResolvedValue(mockApiResponse);
      mockJsonApiParse.mockReturnValue({ postList: undefined });

      const { result } = renderHook(() => useSocialLearning());

      await act(async () => {
      });

      expect(result.current.posts).toEqual([]);
      expect(result.current.emptyView).toBe(true);
    });

    it('should handle postList with 0 length (edge of boundary)', async () => {
      mockRestAdapterGet.mockResolvedValue(mockApiResponse);
      mockJsonApiParse.mockReturnValue({ postList: [] });

      const { result } = renderHook(() => useSocialLearning());

      await act(async () => {
      });

      expect(result.current.posts).toEqual([]);
      expect(result.current.emptyView).toBe(true);
      expect(result.current.showExploreBox).toBe(false);
    });

    it('should handle large postList (should be limited by API)', async () => {
      const largePostList = Array.from({ length: 100 }, (_, i) => ({
        id: `post-${i}`,
        text: `Post ${i}`,
      }));
      mockRestAdapterGet.mockResolvedValue(mockApiResponse);
      mockJsonApiParse.mockReturnValue({ postList: largePostList });

      const { result } = renderHook(() => useSocialLearning());

      await act(async () => {
      });

      expect(result.current.posts).toHaveLength(100);
      expect(result.current.showExploreBox).toBe(false);
    });

    it('should use custom primeApiURL from config', async () => {
      const customConfig = {
        primeApiURL: 'https://custom.api.com/v3',
      };
      mockGetALMConfig.mockReturnValue(customConfig as any);
      mockRestAdapterGet.mockResolvedValue(mockApiResponse);
      mockJsonApiParse.mockReturnValue(mockParsedResponse);

      await act(async () => {
        renderHook(() => useSocialLearning());
      });

      expect(mockRestAdapterGet).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'https://custom.api.com/v3/posts',
        })
      );
    });
  });

  describe('Return Value Structure', () => {
    it('should have posts as array', () => {
      const { result } = renderHook(() => useSocialLearning());

      expect(Array.isArray(result.current.posts)).toBe(true);
    });

    it('should have showExploreBox as boolean', () => {
      const { result } = renderHook(() => useSocialLearning());

      expect(typeof result.current.showExploreBox).toBe('boolean');
    });

    it('should have emptyView as boolean', () => {
      const { result } = renderHook(() => useSocialLearning());

      expect(typeof result.current.emptyView).toBe('boolean');
    });

    it('should have fetchingData as boolean', () => {
      const { result } = renderHook(() => useSocialLearning());

      expect(typeof result.current.fetchingData).toBe('boolean');
    });
  });
});
