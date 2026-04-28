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
 * Unit Tests for useBoards Hook
 *
 * Hook handles:
 * - Fetching boards list with filters (sort, skill, myBoards)
 * - Pagination with loadMore
 * - Redux state management
 * - DOM queries for skill values
 * - Helper functions for skill selection
 * - Automatic fetching on mount
 * - Loading state management
 *
 * Testing Strategy:
 * - Module integrity and exports
 * - Helper functions (setSkillValues, getSelectedSkill)
 * - Redux integration (selector, dispatch)
 * - fetchBoards with various filters
 * - loadMoreBoards pagination
 * - useEffect automatic fetching
 * - State management (isBoardsLoading, skills, currentSkill)
 * - Return value validation
 * - Error handling
 */

import { act } from '@testing-library/react';
import React from 'react';
import ReactDOM from 'react-dom';
import { useBoards } from '../../../almLib/hooks/community/useBoards';
import { loadBoards, paginateBoards } from '../../../almLib/store/actions/social/action';

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
const mockLoadMore = jest.fn();
const mockLoadBoards = jest.fn();
const mockPaginateBoards = jest.fn();

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

jest.mock('../../../almLib/common/APIService', () => ({
  __esModule: true,
  default: {
    loadMore: (...args: any[]) => mockLoadMore(...args),
  },
}));

jest.mock('../../../almLib/store/actions/social/action', () => ({
  loadBoards: (...args: any[]) => mockLoadBoards(...args),
  paginateBoards: (...args: any[]) => mockPaginateBoards(...args),
}));

describe('useBoards', () => {
  const mockBoards = [
    {
      id: 'board-1',
      name: 'JavaScript Board',
      skills: [{ id: 'skill-1', name: 'JavaScript' }],
    },
    {
      id: 'board-2',
      name: 'React Board',
      skills: [{ id: 'skill-2', name: 'React' }],
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mocks
    mockGetALMConfig.mockReturnValue({
      primeApiURL: 'https://api.example.com/',
      mountingPoints: {
        boardsContainer: '#boards-container',
      },
    });

    mockSelector.mockReturnValue({
      items: mockBoards,
      next: 'https://api.example.com/boards?page[offset]=10',
    });

    mockRestAdapterGet.mockResolvedValue({
      data: mockBoards,
    });

    mockJsonApiParse.mockReturnValue({
      boardList: mockBoards,
      links: {
        next: 'https://api.example.com/boards?page[offset]=10',
      },
    });

    mockLoadBoards.mockReturnValue({
      type: 'LOAD_BOARDS',
      payload: { items: mockBoards, next: '' },
    });

    mockPaginateBoards.mockReturnValue({
      type: 'PAGINATE_BOARDS',
      payload: { items: mockBoards, next: '' },
    });

    mockLoadMore.mockResolvedValue({
      boardList: mockBoards,
      links: { next: '' },
    });

    // Setup DOM mock
    const mockElement = document.createElement('div');
    mockElement.setAttribute('data-products', 'JavaScript,React,Node.js');
    document.body.appendChild(mockElement);

    jest.spyOn(document, 'querySelector').mockReturnValue(mockElement);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Hook Structure', () => {
    it('should return items from Redux state', async () => {
      let result: any;
      await act(async () => {
        result = renderHook(() => useBoards('name', 'JavaScript')).result;
      });

      expect(result.current.items).toEqual(mockBoards);
    });
  });

  describe('Redux Integration', () => {
    it('should call useSelector with correct selector', async () => {
      await act(async () => {
        renderHook(() => useBoards('name', 'JavaScript'));
      });

      expect(mockSelector).toHaveBeenCalled();
    });

    it('should select boards from social.boards state', async () => {
      const mockState = {
        social: {
          boards: {
            items: mockBoards,
            next: 'https://api.example.com/next',
          },
        },
      };

      await act(async () => {
        renderHook(() => useBoards('name', 'JavaScript'));
      });

      // Get the selector function that was passed to useSelector
      const selectorFn = mockSelector.mock.calls[0][0];
      const result = selectorFn(mockState);

      expect(result).toEqual({
        items: mockBoards,
        next: 'https://api.example.com/next',
      });
    });

    it('should dispatch loadBoards action on successful fetch', async () => {
      await act(async () => {
        renderHook(() => useBoards('name', 'JavaScript'));
      });

      expect(mockDispatch).toHaveBeenCalled();
      expect(mockLoadBoards).toHaveBeenCalledWith({
        items: mockBoards,
        next: 'https://api.example.com/boards?page[offset]=10',
      });
    });
  });

  describe('Helper Function: setSkillValues', () => {
    it('should read skill values from DOM dataset', async () => {
      const mockElement = document.createElement('div');
      mockElement.setAttribute('data-products', 'JavaScript,React,Node.js');
      jest.spyOn(document, 'querySelector').mockReturnValue(mockElement);

      let result: any;
      await act(async () => {
        result = renderHook(() => useBoards('name', 'JavaScript')).result;
      });

      expect(result.current.skills).toBe('JavaScript,React,Node.js');
    });

    it('should use mounting point from config', async () => {
      mockGetALMConfig.mockReturnValue({
        primeApiURL: 'https://api.example.com/',
        mountingPoints: {
          boardsContainer: '#custom-boards-container',
        },
      });

      await act(async () => {
        renderHook(() => useBoards('name', 'JavaScript'));
      });

      expect(document.querySelector).toHaveBeenCalledWith('#custom-boards-container');
    });

    it('should handle missing DOM element gracefully', async () => {
      jest.spyOn(document, 'querySelector').mockReturnValue(null);

      let result: any;
      await act(async () => {
        result = renderHook(() => useBoards('name', 'JavaScript')).result;
      });

      expect(result.current.skills).toBeUndefined();
    });

    it('should handle missing config gracefully', async () => {
      mockGetALMConfig.mockReturnValue(null);

      let result: any;
      await act(async () => {
        result = renderHook(() => useBoards('name', 'JavaScript')).result;
      });

      expect(result.current.skills).toBeUndefined();
    });
  });

  describe('Helper Function: getSelectedSkill', () => {
    it('should return provided skillName if valid', async () => {
      let result: any;
      await act(async () => {
        result = renderHook(() => useBoards('name', 'JavaScript')).result;
      });

      expect(result.current.currentSkill).toBe('JavaScript');
    });

    it('should return first skill if skillName is empty', async () => {
      let result: any;
      await act(async () => {
        result = renderHook(() => useBoards('name', '')).result;
      });

      expect(result.current.currentSkill).toBe('JavaScript');
    });

    it('should return first skill if skillName not in list', async () => {
      let result: any;
      await act(async () => {
        result = renderHook(() => useBoards('name', 'InvalidSkill')).result;
      });

      expect(result.current.currentSkill).toBe('JavaScript');
    });

    it('should handle no skills provided', async () => {
      const mockElement = document.createElement('div');
      mockElement.setAttribute('data-products', '');
      jest.spyOn(document, 'querySelector').mockReturnValue(mockElement);

      let result: any;
      await act(async () => {
        result = renderHook(() => useBoards('name', '')).result;
      });

      expect(result.current.currentSkill).toBe('');
    });
  });

  describe('fetchBoards', () => {
    it('should call RestAdapter.get with correct URL and params', async () => {
      await act(async () => {
        renderHook(() => useBoards('name', 'JavaScript'));
      });

      expect(mockRestAdapterGet).toHaveBeenCalledWith({
        url: 'https://api.example.com//boards?',
        params: {
          sort: 'name',
          'filter.state': 'ACTIVE',
          'page[offset]': '0',
          'page[limit]': '10',
          'filter.board.skills': 'JavaScript',
          include: 'createdBy,skills',
        },
      });
    });

    it('should include sort filter in params', async () => {
      await act(async () => {
        renderHook(() => useBoards('-dateCreated', 'React'));
      });

      const callParams = mockRestAdapterGet.mock.calls[0][0].params;
      expect(callParams['sort']).toBe('-dateCreated');
    });

    it('should include skill filter when provided', async () => {
      await act(async () => {
        renderHook(() => useBoards('name', 'React'));
      });

      const callParams = mockRestAdapterGet.mock.calls[0][0].params;
      expect(callParams['filter.board.skills']).toBe('React');
    });

    it('should not include skill filter when empty', async () => {
      const mockElement = document.createElement('div');
      mockElement.setAttribute('data-products', '');
      jest.spyOn(document, 'querySelector').mockReturnValue(mockElement);

      await act(async () => {
        renderHook(() => useBoards('name', ''));
      });

      const callParams = mockRestAdapterGet.mock.calls[0][0].params;
      expect(callParams['filter.board.skills']).toBeUndefined();
    });

    it('should include myBoards filter when flag is true', async () => {
      let result: any;
      await act(async () => {
        result = renderHook(() => useBoards('name', 'JavaScript')).result;
      });

      jest.clearAllMocks();

      await act(async () => {
        await result.current.fetchBoards('name', 'JavaScript', true);
      });

      const callParams = mockRestAdapterGet.mock.calls[0][0].params;
      expect(callParams['filter.boardType']).toBe('MyBoards');
    });

    it('should not include myBoards filter when flag is false', async () => {
      let result: any;
      await act(async () => {
        result = renderHook(() => useBoards('name', 'JavaScript')).result;
      });

      jest.clearAllMocks();

      await act(async () => {
        await result.current.fetchBoards('name', 'JavaScript', false);
      });

      const callParams = mockRestAdapterGet.mock.calls[0][0].params;
      expect(callParams['filter.boardType']).toBeUndefined();
    });

    it('should parse response with JsonApiParse', async () => {
      const mockResponse = { data: mockBoards };
      mockRestAdapterGet.mockResolvedValue(mockResponse);

      await act(async () => {
        renderHook(() => useBoards('name', 'JavaScript'));
      });

      expect(mockJsonApiParse).toHaveBeenCalledWith(mockResponse);
    });

    it('should dispatch parsed board data', async () => {
      const parsedBoards = [
        { id: 'parsed-1', name: 'Parsed Board 1' },
        { id: 'parsed-2', name: 'Parsed Board 2' },
      ];

      mockJsonApiParse.mockReturnValue({
        boardList: parsedBoards,
        links: { next: 'https://api.example.com/next' },
      });

      await act(async () => {
        renderHook(() => useBoards('name', 'JavaScript'));
      });

      expect(mockLoadBoards).toHaveBeenCalledWith({
        items: parsedBoards,
        next: 'https://api.example.com/next',
      });
    });

    it('should set next to empty string if not provided', async () => {
      mockJsonApiParse.mockReturnValue({
        boardList: mockBoards,
        links: {},
      });

      await act(async () => {
        renderHook(() => useBoards('name', 'JavaScript'));
      });

      expect(mockLoadBoards).toHaveBeenCalledWith({
        items: mockBoards,
        next: '',
      });
    });

    it('should handle API errors gracefully', async () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      mockRestAdapterGet.mockRejectedValue(new Error('Network error'));

      await act(async () => {
        renderHook(() => useBoards('name', 'JavaScript'));
      });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error while loading boards')
      );

      consoleLogSpy.mockRestore();
    });

    it('should dispatch empty array on error', async () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      mockRestAdapterGet.mockRejectedValue(new Error('Network error'));

      await act(async () => {
        renderHook(() => useBoards('name', 'JavaScript'));
      });

      expect(mockLoadBoards).toHaveBeenCalledWith([]);

      consoleLogSpy.mockRestore();
    });
  });

  describe('loadMoreBoards', () => {
    it('should call APIServiceInstance.loadMore with next URL', async () => {
      let result: any;
      await act(async () => {
        result = renderHook(() => useBoards('name', 'JavaScript')).result;
      });

      await act(async () => {
        await result.current.loadMoreBoards();
      });

      expect(mockLoadMore).toHaveBeenCalledWith('https://api.example.com/boards?page[offset]=10');
    });

    it('should dispatch paginateBoards action', async () => {
      let result: any;
      await act(async () => {
        result = renderHook(() => useBoards('name', 'JavaScript')).result;
      });

      await act(async () => {
        await result.current.loadMoreBoards();
      });

      expect(mockDispatch).toHaveBeenCalled();
      expect(mockPaginateBoards).toHaveBeenCalledWith({
        items: mockBoards,
        next: '',
      });
    });

    it('should not call loadMore if no next URL', async () => {
      mockSelector.mockReturnValue({
        items: mockBoards,
        next: '',
      });

      let result: any;
      await act(async () => {
        result = renderHook(() => useBoards('name', 'JavaScript')).result;
      });

      jest.clearAllMocks();

      await act(async () => {
        await result.current.loadMoreBoards();
      });

      expect(mockLoadMore).not.toHaveBeenCalled();
    });

    it('should handle pagination response with new next URL', async () => {
      mockLoadMore.mockResolvedValue({
        boardList: mockBoards,
        links: { next: 'https://api.example.com/boards?page[offset]=20' },
      });

      let result: any;
      await act(async () => {
        result = renderHook(() => useBoards('name', 'JavaScript')).result;
      });

      await act(async () => {
        await result.current.loadMoreBoards();
      });

      expect(mockPaginateBoards).toHaveBeenCalledWith({
        items: mockBoards,
        next: 'https://api.example.com/boards?page[offset]=20',
      });
    });

    it('should set next to empty string if not in pagination response', async () => {
      mockLoadMore.mockResolvedValue({
        boardList: mockBoards,
        links: {},
      });

      let result: any;
      await act(async () => {
        result = renderHook(() => useBoards('name', 'JavaScript')).result;
      });

      await act(async () => {
        await result.current.loadMoreBoards();
      });

      expect(mockPaginateBoards).toHaveBeenCalledWith({
        items: mockBoards,
        next: '',
      });
    });
  });

  describe('useEffect Automatic Fetching', () => {
    it('should fetch boards on mount', async () => {
      await act(async () => {
        renderHook(() => useBoards('name', 'JavaScript'));
      });

      expect(mockRestAdapterGet).toHaveBeenCalledTimes(1);
    });

    it('should use sortFilter from hook params', async () => {
      await act(async () => {
        renderHook(() => useBoards('-dateCreated', 'JavaScript'));
      });

      const callParams = mockRestAdapterGet.mock.calls[0][0].params;
      expect(callParams['sort']).toBe('-dateCreated');
    });

    it('should use currentSkill (validated) instead of raw skillName', async () => {
      // Pass invalid skill
      await act(async () => {
        renderHook(() => useBoards('name', 'InvalidSkill'));
      });

      // Should use first skill from list instead
      const callParams = mockRestAdapterGet.mock.calls[0][0].params;
      expect(callParams['filter.board.skills']).toBe('JavaScript');
    });
  });

  describe('Loading State Management', () => {
    it('should initialize isBoardsLoading as false', async () => {
      mockRestAdapterGet.mockImplementation(() => new Promise(() => {})); // Never resolves

      let result: any;
      await act(async () => {
        result = renderHook(() => useBoards('name', 'JavaScript')).result;
      });

      // Initial state before fetch completes
      expect(result.current.isBoardsLoading).toBe(true);
    });

    it('should set isBoardsLoading to false after successful fetch', async () => {
      let result: any;
      await act(async () => {
        result = renderHook(() => useBoards('name', 'JavaScript')).result;
      });

      expect(result.current.isBoardsLoading).toBe(false);
    });
  });

  describe('hasMoreItems', () => {
    it('should return true when next URL exists', async () => {
      mockSelector.mockReturnValue({
        items: mockBoards,
        next: 'https://api.example.com/boards?page[offset]=10',
      });

      let result: any;
      await act(async () => {
        result = renderHook(() => useBoards('name', 'JavaScript')).result;
      });

      expect(result.current.hasMoreItems).toBe(true);
    });

    it('should return false when next URL is empty', async () => {
      mockSelector.mockReturnValue({
        items: mockBoards,
        next: '',
      });

      let result: any;
      await act(async () => {
        result = renderHook(() => useBoards('name', 'JavaScript')).result;
      });

      expect(result.current.hasMoreItems).toBe(false);
    });

    it('should return false when next URL is null', async () => {
      mockSelector.mockReturnValue({
        items: mockBoards,
        next: null,
      });

      let result: any;
      await act(async () => {
        result = renderHook(() => useBoards('name', 'JavaScript')).result;
      });

      expect(result.current.hasMoreItems).toBe(false);
    });

    it('should return false when next URL is undefined', async () => {
      mockSelector.mockReturnValue({
        items: mockBoards,
        next: undefined,
      });

      let result: any;
      await act(async () => {
        result = renderHook(() => useBoards('name', 'JavaScript')).result;
      });

      expect(result.current.hasMoreItems).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined skillName parameter', async () => {
      let result: any;
      await act(async () => {
        result = renderHook(() => useBoards('name', undefined as any)).result;
      });

      // Should use first skill from list
      expect(result.current.currentSkill).toBe('JavaScript');
    });

    it('should handle null sortFilter', async () => {
      await act(async () => {
        renderHook(() => useBoards(null as any, 'JavaScript'));
      });

      const callParams = mockRestAdapterGet.mock.calls[0][0].params;
      expect(callParams['sort']).toBe(null);
    });

    it('should handle empty string sortFilter', async () => {
      await act(async () => {
        renderHook(() => useBoards('', 'JavaScript'));
      });

      const callParams = mockRestAdapterGet.mock.calls[0][0].params;
      expect(callParams['sort']).toBe('');
    });

    it('should handle skill with special characters', async () => {
      await act(async () => {
        renderHook(() => useBoards('name', 'JavaScript/TypeScript'));
      });

      const callParams = mockRestAdapterGet.mock.calls[0][0].params;
      // Will be treated as invalid and use first skill
      expect(callParams['filter.board.skills']).toBe('JavaScript');
    });

    it('should handle empty response from API', async () => {
      mockJsonApiParse.mockReturnValue({
        boardList: [],
        links: {},
      });

      await act(async () => {
        renderHook(() => useBoards('name', 'JavaScript'));
      });

      expect(mockLoadBoards).toHaveBeenCalledWith({
        items: [],
        next: '',
      });
    });

    it('should handle missing links in response', async () => {
      mockJsonApiParse.mockReturnValue({
        boardList: mockBoards,
        // No links property
      });

      await act(async () => {
        renderHook(() => useBoards('name', 'JavaScript'));
      });

      expect(mockLoadBoards).toHaveBeenCalledWith({
        items: mockBoards,
        next: '',
      });
    });
  });

  describe('Return Value Validation', () => {
    it('should return items property matching Redux state', async () => {
      const customBoards = [
        { id: 'custom-1', name: 'Custom Board 1' },
        { id: 'custom-2', name: 'Custom Board 2' },
      ];

      mockSelector.mockReturnValue({
        items: customBoards,
        next: '',
      });

      let result: any;
      await act(async () => {
        result = renderHook(() => useBoards('name', 'JavaScript')).result;
      });

      expect(result.current.items).toEqual(customBoards);
    });

    it('should return skills from DOM dataset', async () => {
      const mockElement = document.createElement('div');
      mockElement.setAttribute('data-products', 'React,Vue,Angular');
      jest.spyOn(document, 'querySelector').mockReturnValue(mockElement);

      let result: any;
      await act(async () => {
        result = renderHook(() => useBoards('name', 'React')).result;
      });

      expect(result.current.skills).toBe('React,Vue,Angular');
    });
  });

  describe('Integration with getALMConfig', () => {
    it('should use API URL from getALMConfig', async () => {
      mockGetALMConfig.mockReturnValue({
        primeApiURL: 'https://custom-api.example.com/',
        mountingPoints: {
          boardsContainer: '#boards-container',
        },
      });

      await act(async () => {
        renderHook(() => useBoards('name', 'JavaScript'));
      });

      expect(mockRestAdapterGet).toHaveBeenCalledWith({
        url: 'https://custom-api.example.com//boards?',
        params: expect.any(Object),
      });
    });

    it('should call getALMConfig multiple times', async () => {
      await act(async () => {
        renderHook(() => useBoards('name', 'JavaScript'));
      });

      // Called for setSkillValues and fetchBoards
      expect(mockGetALMConfig).toHaveBeenCalled();
    });
  });
});
