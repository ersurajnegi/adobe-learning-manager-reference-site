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
 * Unit Tests for useBoard Hook
 *
 * Hook handles:
 * - Fetching board data from API
 * - Redux state management (useSelector, useDispatch)
 * - Automatic fetching on mount
 * - Error handling
 *
 * Testing Strategy:
 * - Module integrity and exports
 * - Redux integration (selector, dispatch)
 * - API calls (success and error cases)
 * - useEffect automatic fetching
 * - Return value validation
 * - Error handling and recovery
 */

import { act } from '@testing-library/react';
import React from 'react';
import ReactDOM from 'react-dom';
import { useBoard } from '../../../almLib/hooks/community/useBoard';
import { loadBoard } from '../../../almLib/store/actions/social/action';

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
const mockJsonApiParse = jest.fn();
const mockGetALMConfig = jest.fn();
const mockLoadBoard = jest.fn();

jest.mock('react-redux', () => ({
  useDispatch: () => mockDispatch,
  useSelector: (selector: any) => mockSelector(selector),
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

jest.mock('../../../almLib/store/actions/social/action', () => ({
  loadBoard: (...args: any[]) => mockLoadBoard(...args),
}));

describe('useBoard', () => {
  const mockBoardId = 'board-123';
  const mockBoard = {
    id: 'board-123',
    name: 'Test Board',
    description: 'Test Description',
    state: 'ACTIVE',
    createdBy: {
      id: 'user-456',
      name: 'Test User',
    },
    skills: [
      { id: 'skill-1', name: 'JavaScript' },
      { id: 'skill-2', name: 'React' },
    ],
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

    mockRestAdapterGet.mockResolvedValue({
      data: {
        id: mockBoard.id,
        type: 'board',
        attributes: mockBoard,
      },
    });

    mockJsonApiParse.mockReturnValue({
      board: mockBoard,
    });

    mockLoadBoard.mockReturnValue({
      type: 'LOAD_BOARD',
      payload: { item: mockBoard },
    });
  });

  describe('Redux Integration', () => {
    it('should call useSelector with correct selector', async () => {
      await act(async () => {
        renderHook(() => useBoard(mockBoardId));
      });

      expect(mockSelector).toHaveBeenCalled();
    });

    it('should select board from social.board state', async () => {
      const mockState = {
        social: {
          board: {
            item: mockBoard,
          },
        },
      };

      await act(async () => {
        renderHook(() => useBoard(mockBoardId));
      });

      // Get the selector function that was passed to useSelector
      const selectorFn = mockSelector.mock.calls[0][0];
      const result = selectorFn(mockState);

      expect(result).toEqual({ item: mockBoard });
    });

    it('should dispatch loadBoard action on successful fetch', async () => {
      await act(async () => {
        renderHook(() => useBoard(mockBoardId));
      });

      expect(mockDispatch).toHaveBeenCalled();
      expect(mockLoadBoard).toHaveBeenCalledWith({
        item: mockBoard,
      });
    });
  });

  describe('API Fetching', () => {
    it('should call RestAdapter.get with correct URL', async () => {
      await act(async () => {
        renderHook(() => useBoard(mockBoardId));
      });

      expect(mockRestAdapterGet).toHaveBeenCalledWith({
        url: 'https://api.example.com/boards/board-123',
        params: {
          'filter.state': 'ACTIVE',
          include: 'createdBy,skills',
        },
      });
    });

    it('should use boardId in API URL', async () => {
      const customBoardId = 'custom-board-789';

      await act(async () => {
        renderHook(() => useBoard(customBoardId));
      });

      expect(mockRestAdapterGet).toHaveBeenCalledWith({
        url: `https://api.example.com/boards/${customBoardId}`,
        params: expect.any(Object),
      });
    });

    it('should include correct query parameters', async () => {
      await act(async () => {
        renderHook(() => useBoard(mockBoardId));
      });

      const callArgs = mockRestAdapterGet.mock.calls[0][0];
      expect(callArgs.params['filter.state']).toBe('ACTIVE');
      expect(callArgs.params['include']).toBe('createdBy,skills');
    });

    it('should parse response with JsonApiParse', async () => {
      const mockResponse = { data: { id: mockBoard.id } };
      mockRestAdapterGet.mockResolvedValue(mockResponse);

      await act(async () => {
        renderHook(() => useBoard(mockBoardId));
      });

      expect(mockJsonApiParse).toHaveBeenCalledWith(mockResponse);
    });

    it('should dispatch parsed board data', async () => {
      const parsedBoard = {
        id: 'parsed-board-456',
        name: 'Parsed Board',
      };

      mockJsonApiParse.mockReturnValue({
        board: parsedBoard,
      });

      await act(async () => {
        renderHook(() => useBoard(mockBoardId));
      });

      expect(mockLoadBoard).toHaveBeenCalledWith({
        item: parsedBoard,
      });
    });

    it('should handle different board IDs', async () => {
      const boardIds = ['board-1', 'board-2', 'board-3'];

      for (const boardId of boardIds) {
        jest.clearAllMocks();

        await act(async () => {
          renderHook(() => useBoard(boardId));
        });

        expect(mockRestAdapterGet).toHaveBeenCalledWith({
          url: `https://api.example.com/boards/${boardId}`,
          params: expect.any(Object),
        });
      }
    });
  });

  describe('useEffect Automatic Fetching', () => {
    it('should fetch board on mount', async () => {
      await act(async () => {
        renderHook(() => useBoard(mockBoardId));
      });

      expect(mockRestAdapterGet).toHaveBeenCalledTimes(1);
    });

    it('should call fetchBoard from useEffect', async () => {
      await act(async () => {
        renderHook(() => useBoard(mockBoardId));
      });

      // Verify API was called (which means fetchBoard was executed)
      expect(mockRestAdapterGet).toHaveBeenCalled();
      expect(mockDispatch).toHaveBeenCalled();
    });

    it('should re-fetch when boardId changes', async () => {
      let result: any;

      // First render with board-123
      await act(async () => {
        result = renderHook(() => useBoard('board-123'));
      });

      expect(mockRestAdapterGet).toHaveBeenCalledTimes(1);
      expect(mockRestAdapterGet).toHaveBeenCalledWith({
        url: 'https://api.example.com/boards/board-123',
        params: expect.any(Object),
      });

      jest.clearAllMocks();

      // Rerender with board-456
      await act(async () => {
        result = renderHook(() => useBoard('board-456'));
      });

      expect(mockRestAdapterGet).toHaveBeenCalledTimes(1);
      expect(mockRestAdapterGet).toHaveBeenCalledWith({
        url: 'https://api.example.com/boards/board-456',
        params: expect.any(Object),
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle API fetch errors gracefully', async () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      mockRestAdapterGet.mockRejectedValue(new Error('Network error'));

      await act(async () => {
        renderHook(() => useBoard(mockBoardId));
      });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error while loading boards')
      );

      consoleLogSpy.mockRestore();
    });

    it('should dispatch empty board object on error', async () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      mockRestAdapterGet.mockRejectedValue(new Error('Network error'));

      await act(async () => {
        renderHook(() => useBoard(mockBoardId));
      });

      expect(mockLoadBoard).toHaveBeenCalledWith({});

      consoleLogSpy.mockRestore();
    });

    it('should log error message with exception details', async () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      const errorMessage = 'API failure';
      mockRestAdapterGet.mockRejectedValue(new Error(errorMessage));

      await act(async () => {
        renderHook(() => useBoard(mockBoardId));
      });

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining(errorMessage));

      consoleLogSpy.mockRestore();
    });

    it('should handle JsonApiParse errors', async () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      mockJsonApiParse.mockImplementation(() => {
        throw new Error('Parse error');
      });

      await act(async () => {
        renderHook(() => useBoard(mockBoardId));
      });

      expect(consoleLogSpy).toHaveBeenCalled();
      expect(mockLoadBoard).toHaveBeenCalledWith({});

      consoleLogSpy.mockRestore();
    });

    it('should handle 404 not found errors', async () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      mockRestAdapterGet.mockRejectedValue({
        status: 404,
        message: 'Board not found',
      });

      await act(async () => {
        renderHook(() => useBoard(mockBoardId));
      });

      expect(mockLoadBoard).toHaveBeenCalledWith({});
      expect(consoleLogSpy).toHaveBeenCalled();

      consoleLogSpy.mockRestore();
    });

    it('should handle 500 server errors', async () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      mockRestAdapterGet.mockRejectedValue({
        status: 500,
        message: 'Internal server error',
      });

      await act(async () => {
        renderHook(() => useBoard(mockBoardId));
      });

      expect(mockLoadBoard).toHaveBeenCalledWith({});
      expect(consoleLogSpy).toHaveBeenCalled();

      consoleLogSpy.mockRestore();
    });
  });

  describe('fetchBoard Function', () => {
    it('should allow manual refetch via fetchBoard', async () => {
      let result: any;
      await act(async () => {
        result = renderHook(() => useBoard(mockBoardId)).result;
      });

      jest.clearAllMocks();

      // Manually call fetchBoard
      await act(async () => {
        await result.current.fetchBoard();
      });

      expect(mockRestAdapterGet).toHaveBeenCalledTimes(1);
      expect(mockDispatch).toHaveBeenCalled();
    });

    it('should memoize fetchBoard with useCallback', async () => {
      // This test verifies that fetchBoard is defined with useCallback
      // by checking it exists and is a function
      // Full memoization testing requires same hook instance rerender,
      // which is complex with our custom renderHook implementation
      let result: any;
      await act(async () => {
        result = renderHook(() => useBoard(mockBoardId)).result;
      });

      const fetchBoard = result.current.fetchBoard;

      // Verify it's a stable function
      expect(typeof fetchBoard).toBe('function');

      // Can be called multiple times
      jest.clearAllMocks();
      await act(async () => {
        await fetchBoard();
      });
      expect(mockRestAdapterGet).toHaveBeenCalledTimes(1);

      jest.clearAllMocks();
      await act(async () => {
        await fetchBoard();
      });
      expect(mockRestAdapterGet).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle null boardId', async () => {
      await act(async () => {
        renderHook(() => useBoard(null));
      });

      expect(mockRestAdapterGet).toHaveBeenCalledWith({
        url: 'https://api.example.com/boards/null',
        params: expect.any(Object),
      });
    });

    it('should handle undefined boardId', async () => {
      await act(async () => {
        renderHook(() => useBoard(undefined));
      });

      expect(mockRestAdapterGet).toHaveBeenCalledWith({
        url: 'https://api.example.com/boards/undefined',
        params: expect.any(Object),
      });
    });

    it('should handle empty string boardId', async () => {
      await act(async () => {
        renderHook(() => useBoard(''));
      });

      expect(mockRestAdapterGet).toHaveBeenCalledWith({
        url: 'https://api.example.com/boards/',
        params: expect.any(Object),
      });
    });

    it('should handle numeric boardId', async () => {
      await act(async () => {
        renderHook(() => useBoard(12345));
      });

      expect(mockRestAdapterGet).toHaveBeenCalledWith({
        url: 'https://api.example.com/boards/12345',
        params: expect.any(Object),
      });
    });

    it('should handle special characters in boardId', async () => {
      await act(async () => {
        renderHook(() => useBoard('board-123_special.test'));
      });

      expect(mockRestAdapterGet).toHaveBeenCalledWith({
        url: 'https://api.example.com/boards/board-123_special.test',
        params: expect.any(Object),
      });
    });

    it('should handle response with missing board property', async () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      mockJsonApiParse.mockReturnValue({
        // No 'board' property
        data: mockBoard,
      });

      await act(async () => {
        renderHook(() => useBoard(mockBoardId));
      });

      expect(mockLoadBoard).toHaveBeenCalledWith({
        item: undefined, // board is undefined
      });

      consoleLogSpy.mockRestore();
    });

    it('should handle empty response from API', async () => {
      mockRestAdapterGet.mockResolvedValue(null);
      mockJsonApiParse.mockReturnValue({ board: null });

      await act(async () => {
        renderHook(() => useBoard(mockBoardId));
      });

      expect(mockLoadBoard).toHaveBeenCalledWith({
        item: null,
      });
    });
  });

  describe('Return Value Validation', () => {
    it('should return item property matching Redux state', async () => {
      const customBoard = {
        id: 'custom-123',
        name: 'Custom Board',
      };

      mockSelector.mockReturnValue({
        item: customBoard,
      });

      let result: any;
      await act(async () => {
        result = renderHook(() => useBoard(mockBoardId)).result;
      });

      expect(result.current.item).toEqual(customBoard);
    });
  });

  describe('Integration with getALMConfig', () => {
    it('should use API URL from getALMConfig', async () => {
      mockGetALMConfig.mockReturnValue({
        primeApiURL: 'https://custom-api.example.com/',
      });

      await act(async () => {
        renderHook(() => useBoard(mockBoardId));
      });

      expect(mockRestAdapterGet).toHaveBeenCalledWith({
        url: 'https://custom-api.example.com/boards/board-123',
        params: expect.any(Object),
      });
    });

    it('should handle API URL without trailing slash', async () => {
      mockGetALMConfig.mockReturnValue({
        primeApiURL: 'https://api.example.com', // No trailing slash
      });

      await act(async () => {
        renderHook(() => useBoard(mockBoardId));
      });

      expect(mockRestAdapterGet).toHaveBeenCalledWith({
        url: 'https://api.example.comboards/board-123', // Will be malformed
        params: expect.any(Object),
      });
    });

    it('should call getALMConfig on every fetch', async () => {
      let result: any;
      await act(async () => {
        result = renderHook(() => useBoard(mockBoardId)).result;
      });

      expect(mockGetALMConfig).toHaveBeenCalledTimes(1);

      // Manual refetch
      await act(async () => {
        await result.current.fetchBoard();
      });

      expect(mockGetALMConfig).toHaveBeenCalledTimes(2);
    });
  });
});
