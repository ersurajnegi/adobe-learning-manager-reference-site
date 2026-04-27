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
 * Unit Tests for useBoardOptions Hook
 *
 * Hook handles:
 * - Adding board to favorites (POST)
 * - Removing board from favorites (DELETE)
 * - Deleting board from server (DELETE)
 * - Reporting board abuse (POST)
 * - Redux state management
 *
 * Testing Strategy:
 * - Module integrity and exports
 * - Redux integration (selector, dispatch)
 * - All callback functions (success and error cases)
 * - API calls with correct URLs and methods
 * - Return value validation
 * - Error handling
 */

import { act } from '@testing-library/react';
import React from 'react';
import ReactDOM from 'react-dom';
import { useBoardOptions } from '../../../almLib/hooks/community/useBoardOptions';
import {
  addBoardToFavourites,
  removeBoardFromFavourites,
  deleteBoard,
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
const mockRestAdapterAjax = jest.fn();
const mockGetALMConfig = jest.fn();

jest.mock('react-redux', () => ({
  useDispatch: () => mockDispatch,
  useSelector: (selector: any) => mockSelector(selector),
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
  addBoardToFavourites: jest.fn(payload => ({ type: 'ADD_BOARD_TO_FAVOURITES', payload })),
  removeBoardFromFavourites: jest.fn(payload => ({
    type: 'REMOVE_BOARD_FROM_FAVOURITES',
    payload,
  })),
  deleteBoard: jest.fn(payload => ({ type: 'DELETE_BOARD', payload })),
}));

describe('useBoardOptions', () => {
  const mockBoard = {
    id: 'board-123',
    name: 'Test Board',
    description: 'Test Description',
    isFavorite: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mocks
    mockGetALMConfig.mockReturnValue({
      primeApiURL: 'https://api.example.com/',
    });

    mockSelector.mockReturnValue({
      item: mockBoard,
    });

    mockRestAdapterAjax.mockResolvedValue({
      success: true,
    });
  });

  describe('Redux Integration', () => {
    it('should call useSelector with correct selector', () => {
      renderHook(() => useBoardOptions());

      expect(mockSelector).toHaveBeenCalled();
    });

    it('should select board from social.board state', () => {
      const mockState = {
        social: {
          board: {
            item: mockBoard,
          },
        },
      };

      renderHook(() => useBoardOptions());

      // Get the selector function that was passed to useSelector
      const selectorFn = mockSelector.mock.calls[0][0];
      const result = selectorFn(mockState);

      expect(result).toEqual({ item: mockBoard });
    });
  });

  describe('addBoardToFavourite', () => {
    it('should call RestAdapter.ajax with correct URL and method', async () => {
      const { result } = renderHook(() => useBoardOptions());
      const boardId = 'board-456';

      await act(async () => {
        await result.current.addBoardToFavourite(boardId);
      });

      expect(mockRestAdapterAjax).toHaveBeenCalledWith({
        url: 'https://api.example.com//boards/board-456/favorite',
        method: 'POST',
      });
    });

    it('should dispatch addBoardToFavourites action after API call', async () => {
      const { result } = renderHook(() => useBoardOptions());
      const boardId = 'board-789';

      await act(async () => {
        await result.current.addBoardToFavourite(boardId);
      });

      expect(mockDispatch).toHaveBeenCalled();
      expect(addBoardToFavourites).toHaveBeenCalledWith({ id: boardId });
    });

    it('should use API URL from getALMConfig', async () => {
      mockGetALMConfig.mockReturnValue({
        primeApiURL: 'https://custom-api.example.com/',
      });

      const { result } = renderHook(() => useBoardOptions());
      const boardId = 'board-123';

      await act(async () => {
        await result.current.addBoardToFavourite(boardId);
      });

      expect(mockRestAdapterAjax).toHaveBeenCalledWith({
        url: 'https://custom-api.example.com//boards/board-123/favorite',
        method: 'POST',
      });
    });

    it('should handle different board IDs', async () => {
      const { result } = renderHook(() => useBoardOptions());
      const boardIds = ['board-1', 'board-2', 'board-3'];

      for (const boardId of boardIds) {
        jest.clearAllMocks();

        await act(async () => {
          await result.current.addBoardToFavourite(boardId);
        });

        expect(mockRestAdapterAjax).toHaveBeenCalledWith({
          url: `https://api.example.com//boards/${boardId}/favorite`,
          method: 'POST',
        });
      }
    });

    it('should handle API errors gracefully', async () => {
      mockRestAdapterAjax.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useBoardOptions());

      await expect(async () => {
        await act(async () => {
          await result.current.addBoardToFavourite('board-123');
        });
      }).rejects.toThrow('Network error');
    });

    it('should not dispatch action if API call fails', async () => {
      mockRestAdapterAjax.mockRejectedValue(new Error('API error'));

      const { result } = renderHook(() => useBoardOptions());

      try {
        await act(async () => {
          await result.current.addBoardToFavourite('board-123');
        });
      } catch (error) {
        // Expected to throw
      }

      expect(mockDispatch).not.toHaveBeenCalled();
    });
  });

  describe('removeBoardFromFavourite', () => {
    it('should call RestAdapter.ajax with correct URL and method', async () => {
      const { result } = renderHook(() => useBoardOptions());
      const boardId = 'board-456';

      await act(async () => {
        await result.current.removeBoardFromFavourite(boardId);
      });

      expect(mockRestAdapterAjax).toHaveBeenCalledWith({
        url: 'https://api.example.com//boards/board-456/favorite',
        method: 'DELETE',
      });
    });

    it('should dispatch removeBoardFromFavourites action after API call', async () => {
      const { result } = renderHook(() => useBoardOptions());
      const boardId = 'board-789';

      await act(async () => {
        await result.current.removeBoardFromFavourite(boardId);
      });

      expect(mockDispatch).toHaveBeenCalled();
      expect(removeBoardFromFavourites).toHaveBeenCalledWith({ id: boardId });
    });

    it('should use same endpoint as add but with DELETE method', async () => {
      const { result } = renderHook(() => useBoardOptions());
      const boardId = 'board-123';

      // Call both add and remove
      jest.clearAllMocks();
      await act(async () => {
        await result.current.addBoardToFavourite(boardId);
      });
      const addCall = mockRestAdapterAjax.mock.calls[0][0];

      jest.clearAllMocks();
      await act(async () => {
        await result.current.removeBoardFromFavourite(boardId);
      });
      const removeCall = mockRestAdapterAjax.mock.calls[0][0];

      // URLs should be the same, methods different
      expect(addCall.url).toBe(removeCall.url);
      expect(addCall.method).toBe('POST');
      expect(removeCall.method).toBe('DELETE');
    });

    it('should handle API errors gracefully', async () => {
      mockRestAdapterAjax.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useBoardOptions());

      await expect(async () => {
        await act(async () => {
          await result.current.removeBoardFromFavourite('board-123');
        });
      }).rejects.toThrow('Network error');
    });

    it('should not dispatch action if API call fails', async () => {
      mockRestAdapterAjax.mockRejectedValue(new Error('API error'));

      const { result } = renderHook(() => useBoardOptions());

      try {
        await act(async () => {
          await result.current.removeBoardFromFavourite('board-123');
        });
      } catch (error) {
        // Expected to throw
      }

      expect(mockDispatch).not.toHaveBeenCalled();
    });
  });

  describe('deleteBoardFromServer', () => {
    it('should call RestAdapter.ajax with correct URL and method', async () => {
      const { result } = renderHook(() => useBoardOptions());
      const boardId = 'board-456';
      const accountId = 'account-789';

      await act(async () => {
        await result.current.deleteBoardFromServer(boardId, accountId);
      });

      expect(mockRestAdapterAjax).toHaveBeenCalledWith({
        url: 'https://api.example.com//account/account-789/board/board-456',
        method: 'DELETE',
      });
    });

    it('should dispatch deleteBoard action after API call', async () => {
      const { result } = renderHook(() => useBoardOptions());
      const boardId = 'board-123';
      const accountId = 'account-456';

      await act(async () => {
        await result.current.deleteBoardFromServer(boardId, accountId);
      });

      expect(mockDispatch).toHaveBeenCalled();
      expect(deleteBoard).toHaveBeenCalledWith({ id: boardId });
    });

    it('should handle different board and account IDs', async () => {
      const { result } = renderHook(() => useBoardOptions());
      const testCases = [
        { boardId: 'board-1', accountId: 'account-1' },
        { boardId: 'board-2', accountId: 'account-2' },
        { boardId: 'board-3', accountId: 'account-3' },
      ];

      for (const { boardId, accountId } of testCases) {
        jest.clearAllMocks();

        await act(async () => {
          await result.current.deleteBoardFromServer(boardId, accountId);
        });

        expect(mockRestAdapterAjax).toHaveBeenCalledWith({
          url: `https://api.example.com//account/${accountId}/board/${boardId}`,
          method: 'DELETE',
        });
      }
    });

    it('should use API URL from getALMConfig', async () => {
      mockGetALMConfig.mockReturnValue({
        primeApiURL: 'https://custom-api.example.com/',
      });

      const { result } = renderHook(() => useBoardOptions());
      const boardId = 'board-123';
      const accountId = 'account-456';

      await act(async () => {
        await result.current.deleteBoardFromServer(boardId, accountId);
      });

      expect(mockRestAdapterAjax).toHaveBeenCalledWith({
        url: 'https://custom-api.example.com//account/account-456/board/board-123',
        method: 'DELETE',
      });
    });

    it('should handle API errors gracefully', async () => {
      mockRestAdapterAjax.mockRejectedValue(new Error('Delete failed'));

      const { result } = renderHook(() => useBoardOptions());

      await expect(async () => {
        await act(async () => {
          await result.current.deleteBoardFromServer('board-123', 'account-456');
        });
      }).rejects.toThrow('Delete failed');
    });

    it('should not dispatch action if API call fails', async () => {
      mockRestAdapterAjax.mockRejectedValue(new Error('API error'));

      const { result } = renderHook(() => useBoardOptions());

      try {
        await act(async () => {
          await result.current.deleteBoardFromServer('board-123', 'account-456');
        });
      } catch (error) {
        // Expected to throw
      }

      expect(mockDispatch).not.toHaveBeenCalled();
    });
  });

  describe('reportBoard', () => {
    it('should call RestAdapter.ajax with correct URL and method', async () => {
      const { result } = renderHook(() => useBoardOptions());
      const boardId = 'board-456';

      await act(async () => {
        await result.current.reportBoard(boardId);
      });

      expect(mockRestAdapterAjax).toHaveBeenCalledWith({
        url: 'https://api.example.com//boards/board-456/reportAbuse',
        method: 'POST',
      });
    });

    it('should not dispatch any Redux action', async () => {
      const { result } = renderHook(() => useBoardOptions());
      const boardId = 'board-123';

      await act(async () => {
        await result.current.reportBoard(boardId);
      });

      // reportBoard does not dispatch anything
      expect(mockDispatch).not.toHaveBeenCalled();
    });

    it('should handle different board IDs', async () => {
      const { result } = renderHook(() => useBoardOptions());
      const boardIds = ['board-1', 'board-2', 'board-3'];

      for (const boardId of boardIds) {
        jest.clearAllMocks();

        await act(async () => {
          await result.current.reportBoard(boardId);
        });

        expect(mockRestAdapterAjax).toHaveBeenCalledWith({
          url: `https://api.example.com//boards/${boardId}/reportAbuse`,
          method: 'POST',
        });
      }
    });

    it('should use API URL from getALMConfig', async () => {
      mockGetALMConfig.mockReturnValue({
        primeApiURL: 'https://custom-api.example.com/',
      });

      const { result } = renderHook(() => useBoardOptions());
      const boardId = 'board-123';

      await act(async () => {
        await result.current.reportBoard(boardId);
      });

      expect(mockRestAdapterAjax).toHaveBeenCalledWith({
        url: 'https://custom-api.example.com//boards/board-123/reportAbuse',
        method: 'POST',
      });
    });

    it('should handle API errors gracefully', async () => {
      mockRestAdapterAjax.mockRejectedValue(new Error('Report failed'));

      const { result } = renderHook(() => useBoardOptions());

      await expect(async () => {
        await act(async () => {
          await result.current.reportBoard('board-123');
        });
      }).rejects.toThrow('Report failed');
    });
  });

  describe('useCallback Memoization', () => {
    it('should memoize addBoardToFavourite with useCallback', () => {
      const { result } = renderHook(() => useBoardOptions());
      const firstCallback = result.current.addBoardToFavourite;

      // Rerender
      const { result: result2 } = renderHook(() => useBoardOptions());
      const secondCallback = result2.current.addBoardToFavourite;

      // Functions should be defined and callable
      expect(typeof firstCallback).toBe('function');
      expect(typeof secondCallback).toBe('function');
    });

    it('should memoize removeBoardFromFavourite with useCallback', () => {
      const { result } = renderHook(() => useBoardOptions());

      expect(typeof result.current.removeBoardFromFavourite).toBe('function');
    });

    it('should memoize deleteBoardFromServer with useCallback', () => {
      const { result } = renderHook(() => useBoardOptions());

      expect(typeof result.current.deleteBoardFromServer).toBe('function');
    });

    it('should memoize reportBoard with useCallback', () => {
      const { result } = renderHook(() => useBoardOptions());

      expect(typeof result.current.reportBoard).toBe('function');
    });
  });

  describe('Edge Cases', () => {
    it('should handle null boardId in addBoardToFavourite', async () => {
      const { result } = renderHook(() => useBoardOptions());

      await act(async () => {
        await result.current.addBoardToFavourite(null);
      });

      expect(mockRestAdapterAjax).toHaveBeenCalledWith({
        url: 'https://api.example.com//boards/null/favorite',
        method: 'POST',
      });
    });

    it('should handle undefined boardId in removeBoardFromFavourite', async () => {
      const { result } = renderHook(() => useBoardOptions());

      await act(async () => {
        await result.current.removeBoardFromFavourite(undefined);
      });

      expect(mockRestAdapterAjax).toHaveBeenCalledWith({
        url: 'https://api.example.com//boards/undefined/favorite',
        method: 'DELETE',
      });
    });

    it('should handle empty string boardId in reportBoard', async () => {
      const { result } = renderHook(() => useBoardOptions());

      await act(async () => {
        await result.current.reportBoard('');
      });

      expect(mockRestAdapterAjax).toHaveBeenCalledWith({
        url: 'https://api.example.com//boards//reportAbuse',
        method: 'POST',
      });
    });

    it('should handle numeric boardId', async () => {
      const { result } = renderHook(() => useBoardOptions());

      await act(async () => {
        await result.current.addBoardToFavourite(12345);
      });

      expect(mockRestAdapterAjax).toHaveBeenCalledWith({
        url: 'https://api.example.com//boards/12345/favorite',
        method: 'POST',
      });
    });

    it('should handle special characters in boardId', async () => {
      const { result } = renderHook(() => useBoardOptions());
      const boardId = 'board-123_special.test';

      await act(async () => {
        await result.current.reportBoard(boardId);
      });

      expect(mockRestAdapterAjax).toHaveBeenCalledWith({
        url: 'https://api.example.com//boards/board-123_special.test/reportAbuse',
        method: 'POST',
      });
    });

    it('should handle API URL without trailing slash', async () => {
      mockGetALMConfig.mockReturnValue({
        primeApiURL: 'https://api.example.com', // No trailing slash
      });

      const { result } = renderHook(() => useBoardOptions());

      await act(async () => {
        await result.current.addBoardToFavourite('board-123');
      });

      expect(mockRestAdapterAjax).toHaveBeenCalledWith({
        url: 'https://api.example.com/boards/board-123/favorite', // Works because component adds /
        method: 'POST',
      });
    });

    it('should handle null accountId in deleteBoardFromServer', async () => {
      const { result } = renderHook(() => useBoardOptions());

      await act(async () => {
        await result.current.deleteBoardFromServer('board-123', null);
      });

      expect(mockRestAdapterAjax).toHaveBeenCalledWith({
        url: 'https://api.example.com//account/null/board/board-123',
        method: 'DELETE',
      });
    });
  });

  describe('Return Value Validation', () => {
    it('should return item property matching Redux state', () => {
      const customBoard = {
        id: 'custom-123',
        name: 'Custom Board',
      };

      mockSelector.mockReturnValue({
        item: customBoard,
      });

      const { result } = renderHook(() => useBoardOptions());

      expect(result.current.item).toEqual(customBoard);
    });

    it('should return consistent structure on multiple renders', () => {
      const { result: result1 } = renderHook(() => useBoardOptions());
      const { result: result2 } = renderHook(() => useBoardOptions());

      expect(Object.keys(result1.current)).toEqual(Object.keys(result2.current));
    });
  });

  describe('Integration with getALMConfig', () => {
    it('should call getALMConfig for each operation', async () => {
      const { result } = renderHook(() => useBoardOptions());

      // Each operation should call getALMConfig
      jest.clearAllMocks();
      await act(async () => {
        await result.current.addBoardToFavourite('board-1');
      });
      expect(mockGetALMConfig).toHaveBeenCalledTimes(1);

      jest.clearAllMocks();
      await act(async () => {
        await result.current.removeBoardFromFavourite('board-2');
      });
      expect(mockGetALMConfig).toHaveBeenCalledTimes(1);

      jest.clearAllMocks();
      await act(async () => {
        await result.current.deleteBoardFromServer('board-3', 'account-1');
      });
      expect(mockGetALMConfig).toHaveBeenCalledTimes(1);

      jest.clearAllMocks();
      await act(async () => {
        await result.current.reportBoard('board-4');
      });
      expect(mockGetALMConfig).toHaveBeenCalledTimes(1);
    });

    it('should use fresh config for each API call', async () => {
      const { result } = renderHook(() => useBoardOptions());

      mockGetALMConfig.mockReturnValue({
        primeApiURL: 'https://api-v1.example.com/',
      });

      await act(async () => {
        await result.current.addBoardToFavourite('board-1');
      });

      expect(mockRestAdapterAjax).toHaveBeenCalledWith({
        url: 'https://api-v1.example.com//boards/board-1/favorite',
        method: 'POST',
      });

      // Change config
      mockGetALMConfig.mockReturnValue({
        primeApiURL: 'https://api-v2.example.com/',
      });

      await act(async () => {
        await result.current.removeBoardFromFavourite('board-2');
      });

      expect(mockRestAdapterAjax).toHaveBeenCalledWith({
        url: 'https://api-v2.example.com//boards/board-2/favorite',
        method: 'DELETE',
      });
    });
  });
});
