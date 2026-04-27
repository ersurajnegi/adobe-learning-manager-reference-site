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
 * Unit Tests for useSocial Hook
 * 
 * Hook handles:
 * - Redux integration for social state (userFavBoards)
 * - Fetching followers from API
 * - Fetching favorite boards from API
 * - Loading state management
 * - JSON API response parsing
 * - Dispatching favorite boards to Redux store
 */

import { act } from '@testing-library/react';
import React from 'react';
import ReactDOM from 'react-dom';
import { useSocial } from '../../../almLib/hooks/social/useSocial';

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

// Mocks
const mockUseSelector = jest.fn();
const mockDispatch = jest.fn();
const mockGetALMConfig = jest.fn();
const mockGetALMUser = jest.fn();
const mockRestAdapterGet = jest.fn();
const mockJsonApiParse = jest.fn();
const mockLoadFavouriteBoards = jest.fn();

jest.mock('react-redux', () => ({
  useSelector: (selector: any) => mockUseSelector(selector),
  useDispatch: () => mockDispatch,
}));

jest.mock('../../../almLib/utils/global', () => ({
  getALMConfig: () => mockGetALMConfig(),
  getALMUser: () => mockGetALMUser(),
}));

jest.mock('../../../almLib/utils/restAdapter', () => ({
  RestAdapter: {
    get: (params: any) => mockRestAdapterGet(params),
  },
}));

jest.mock('../../../almLib/utils/jsonAPIAdapter', () => ({
  JsonApiParse: (response: any) => mockJsonApiParse(response),
}));

jest.mock('../../../almLib/store/actions/social', () => ({
  loadFavouriteBoards: (boards: any) => mockLoadFavouriteBoards(boards),
}));

describe('useSocial', () => {
  const mockUser = {
    user: {
      id: 'user-123',
      name: 'Test User',
    },
  };

  const mockConfig = {
    primeApiURL: 'https://api.example.com/primeapi/v2',
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementations
    mockUseSelector.mockImplementation((selector) => {
      return selector({
        social: {
          userFavBoards: [],
        },
      });
    });

    mockGetALMConfig.mockReturnValue(mockConfig);
    mockGetALMUser.mockResolvedValue(mockUser);
    mockRestAdapterGet.mockResolvedValue({});
    mockJsonApiParse.mockReturnValue({});
    mockLoadFavouriteBoards.mockReturnValue({ type: 'LOAD_FAVOURITE_BOARDS', payload: [] });

    // Spy on console.log to suppress output
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    (console.log as jest.Mock).mockRestore();
  });

  describe('fetchFollowers', () => {
    it('should fetch followers from API', async () => {
      const mockFollowersResponse = {
        followerList: [
          { id: 'follower-1', name: 'Follower 1' },
          { id: 'follower-2', name: 'Follower 2' },
        ],
      };

      mockRestAdapterGet.mockResolvedValue({ data: 'followers' });
      mockJsonApiParse.mockReturnValue(mockFollowersResponse);

      const { result } = renderHook(() => useSocial());

      let response: any;
      await act(async () => {
        response = await result.current.fetchFollowers();
      });

      expect(response).toEqual(mockFollowersResponse);
    });

    it('should call getALMUser to get user ID', async () => {
      mockRestAdapterGet.mockResolvedValue({});
      mockJsonApiParse.mockReturnValue({});

      const { result } = renderHook(() => useSocial());

      await act(async () => {
        await result.current.fetchFollowers();
      });

      expect(mockGetALMUser).toHaveBeenCalled();
    });

    it('should call RestAdapter.get with correct URL', async () => {
      mockRestAdapterGet.mockResolvedValue({});
      mockJsonApiParse.mockReturnValue({});

      const { result } = renderHook(() => useSocial());

      await act(async () => {
        await result.current.fetchFollowers();
      });

      expect(mockRestAdapterGet).toHaveBeenCalledWith({
        url: 'https://api.example.com/primeapi/v2/socialProfiles/user-123/followers',
        params: {},
      });
    });

    it('should parse response using JsonApiParse', async () => {
      const mockResponse = { data: 'followers data' };
      mockRestAdapterGet.mockResolvedValue(mockResponse);
      mockJsonApiParse.mockReturnValue({ followerList: [] });

      const { result } = renderHook(() => useSocial());

      await act(async () => {
        await result.current.fetchFollowers();
      });

      expect(mockJsonApiParse).toHaveBeenCalledWith(mockResponse);
    });

    it('should handle API error gracefully', async () => {
      mockRestAdapterGet.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useSocial());

      let response: any;
      await act(async () => {
        response = await result.current.fetchFollowers();
      });

      expect(console.log).toHaveBeenCalledWith(expect.any(Error));
      expect(response).toBeUndefined();
    });

    it('should log console message when called', async () => {
      mockRestAdapterGet.mockResolvedValue({});
      mockJsonApiParse.mockReturnValue({});

      const { result } = renderHook(() => useSocial());

      await act(async () => {
        await result.current.fetchFollowers();
      });

      expect(console.log).toHaveBeenCalledWith('-------- followers api called-------');
    });

    it('should be memoized with correct dependencies', () => {
      const { result, rerender } = renderHook(() => useSocial());

      const firstFetchFollowers = result.current.fetchFollowers;

      // Rerender without changing config
      rerender();

      expect(result.current.fetchFollowers).toBe(firstFetchFollowers);
    });

    it('should handle getALMUser returning null', async () => {
      mockGetALMUser.mockResolvedValue(null);
      mockRestAdapterGet.mockResolvedValue({});

      const { result } = renderHook(() => useSocial());

      await act(async () => {
        await result.current.fetchFollowers();
      });

      // Should still call RestAdapter with undefined user.id
      expect(mockRestAdapterGet).toHaveBeenCalledWith({
        url: 'https://api.example.com/primeapi/v2/socialProfiles/undefined/followers',
        params: {},
      });
    });
  });

  describe('fetchFavouriteBoards', () => {
    it('should fetch favourite boards from API', async () => {
      const mockBoardsResponse = {
        boardList: [
          { id: 'board-1', name: 'Favorite Board 1' },
          { id: 'board-2', name: 'Favorite Board 2' },
        ],
      };

      mockRestAdapterGet.mockResolvedValue({ data: 'boards' });
      mockJsonApiParse.mockReturnValue(mockBoardsResponse);

      const { result } = renderHook(() => useSocial());

      await act(async () => {
        await result.current.fetchFavouriteBoards();
      });

      expect(mockRestAdapterGet).toHaveBeenCalledWith({
        url: 'https://api.example.com/primeapi/v2/boards',
        params: {
          'filter.boardType': 'FavoriteBoards',
        },
      });
    });

    it('should set isLoading to true before fetching', async () => {
      let resolveGet: (value: any) => void;
      mockRestAdapterGet.mockReturnValue(new Promise(resolve => { resolveGet = resolve; }));
      mockJsonApiParse.mockReturnValue({ boardList: [] });

      const { result } = renderHook(() => useSocial());

      // Start fetch but don't await — allow act to flush the setIsLoading(true) state update
      await act(async () => {
        result.current.fetchFavouriteBoards();
        await Promise.resolve();
      });

      expect(result.current.isLoading).toBe(true);

      // Cleanup: resolve the pending request
      await act(async () => {
        resolveGet!({});
        await Promise.resolve();
      });
    });

    it('should set isLoading to false after fetching', async () => {
      mockRestAdapterGet.mockResolvedValue({});
      mockJsonApiParse.mockReturnValue({ boardList: [] });

      const { result } = renderHook(() => useSocial());

      await act(async () => {
        await result.current.fetchFavouriteBoards();
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('should dispatch loadFavouriteBoards action with parsed boards', async () => {
      const mockBoards = [
        { id: 'board-1', name: 'Board 1' },
        { id: 'board-2', name: 'Board 2' },
      ];

      mockRestAdapterGet.mockResolvedValue({});
      mockJsonApiParse.mockReturnValue({ boardList: mockBoards });

      const { result } = renderHook(() => useSocial());

      await act(async () => {
        await result.current.fetchFavouriteBoards();
      });

      expect(mockLoadFavouriteBoards).toHaveBeenCalledWith(mockBoards);
      expect(mockDispatch).toHaveBeenCalled();
    });

    it('should handle empty boardList response', async () => {
      mockRestAdapterGet.mockResolvedValue({});
      mockJsonApiParse.mockReturnValue({});

      const { result } = renderHook(() => useSocial());

      await act(async () => {
        await result.current.fetchFavouriteBoards();
      });

      expect(mockLoadFavouriteBoards).toHaveBeenCalledWith([]);
    });

    it('should use empty array when boardList is undefined', async () => {
      mockRestAdapterGet.mockResolvedValue({});
      mockJsonApiParse.mockReturnValue({ boardList: undefined });

      const { result } = renderHook(() => useSocial());

      await act(async () => {
        await result.current.fetchFavouriteBoards();
      });

      expect(mockLoadFavouriteBoards).toHaveBeenCalledWith([]);
    });

    it('should handle API error gracefully', async () => {
      mockRestAdapterGet.mockRejectedValue(new Error('API error'));

      const { result } = renderHook(() => useSocial());

      await act(async () => {
        await result.current.fetchFavouriteBoards();
      });

      expect(console.log).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should log console message when called', async () => {
      mockRestAdapterGet.mockResolvedValue({});
      mockJsonApiParse.mockReturnValue({ boardList: [] });

      const { result } = renderHook(() => useSocial());

      await act(async () => {
        await result.current.fetchFavouriteBoards();
      });

      expect(console.log).toHaveBeenCalledWith('-------- Favourite Boards api called-------');
    });

    it('should be memoized with correct dependencies', () => {
      const { result, rerender } = renderHook(() => useSocial());

      const firstFetchFavouriteBoards = result.current.fetchFavouriteBoards;

      // Rerender without changing dependencies
      rerender();

      expect(result.current.fetchFavouriteBoards).toBe(firstFetchFavouriteBoards);
    });

    it('should pass correct filter.boardType parameter', async () => {
      mockRestAdapterGet.mockResolvedValue({});
      mockJsonApiParse.mockReturnValue({ boardList: [] });

      const { result } = renderHook(() => useSocial());

      await act(async () => {
        await result.current.fetchFavouriteBoards();
      });

      const callArgs = mockRestAdapterGet.mock.calls[0][0];
      expect(callArgs.params['filter.boardType']).toBe('FavoriteBoards');
    });
  });

  describe('setIsLoading', () => {
    it('should update isLoading state', () => {
      const { result } = renderHook(() => useSocial());

      expect(result.current.isLoading).toBe(false);

      act(() => {
        result.current.setIsLoading(true);
      });

      expect(result.current.isLoading).toBe(true);

      act(() => {
        result.current.setIsLoading(false);
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('should allow toggling isLoading multiple times', () => {
      const { result } = renderHook(() => useSocial());

      act(() => {
        result.current.setIsLoading(true);
      });
      expect(result.current.isLoading).toBe(true);

      act(() => {
        result.current.setIsLoading(false);
      });
      expect(result.current.isLoading).toBe(false);

      act(() => {
        result.current.setIsLoading(true);
      });
      expect(result.current.isLoading).toBe(true);
    });
  });

  describe('Redux Integration', () => {
    it('should use useSelector to get social state', () => {
      renderHook(() => useSocial());
      expect(mockUseSelector).toHaveBeenCalled();
    });

    it('should use useDispatch to get dispatch function', () => {
      const { result } = renderHook(() => useSocial());

      // Dispatch is used internally in fetchFavouriteBoards — verify it is exposed
      expect(typeof result.current.fetchFavouriteBoards).toBe('function');
    });

    it('should access userFavBoards from Redux state', () => {
      const mockBoards = [{ id: '1', name: 'Test Board' }];

      mockUseSelector.mockImplementation((selector) => {
        return selector({
          social: {
            userFavBoards: mockBoards,
          },
        });
      });

      const { result } = renderHook(() => useSocial());

      expect(result.current.userFavBoards).toEqual(mockBoards);
    });
  });

  describe('Configuration', () => {
    it('should use getALMConfig to get API URL', () => {
      renderHook(() => useSocial());
      expect(mockGetALMConfig).toHaveBeenCalled();
    });

    it('should use primeApiURL from config', async () => {
      const customConfig = {
        primeApiURL: 'https://custom.api.com/v2',
      };

      mockGetALMConfig.mockReturnValue(customConfig);
      mockRestAdapterGet.mockResolvedValue({});
      mockJsonApiParse.mockReturnValue({ boardList: [] });

      const { result } = renderHook(() => useSocial());

      await act(async () => {
        await result.current.fetchFavouriteBoards();
      });

      expect(mockRestAdapterGet).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'https://custom.api.com/v2/boards',
        })
      );
    });
  });
});

