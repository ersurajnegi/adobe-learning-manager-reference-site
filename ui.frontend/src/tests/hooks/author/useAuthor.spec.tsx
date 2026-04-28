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
 * Unit Tests for useAuthor Hook
 * 
 * Hook handles:
 * - Fetching trainings for an author
 * - Loading more trainings (pagination)
 * - Updating learning objects after enrollment
 * - Enrollment handling
 * - Bookmark add/remove
 * - Author details fetching (for internal authors)
 * - Redux state management
 * - Error handling
 */

// Mock dependencies BEFORE imports
jest.mock('../../../almLib/common/APIService', () => ({
  __esModule: true,
  default: {
    getTrainingsForAuthor: jest.fn(),
  },
}));

jest.mock('react-redux', () => ({
  useDispatch: jest.fn(),
  useSelector: jest.fn(),
}));

jest.mock('../../../almLib/utils/restAdapter', () => ({
  RestAdapter: {
    ajax: jest.fn(),
    post: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock('../../../almLib/utils/jsonAPIAdapter', () => ({
  JsonApiParse: jest.fn(),
}));

jest.mock('../../../almLib/utils/global', () => ({
  getALMConfig: jest.fn(),
}));

jest.mock('../../../almLib/utils/lo-utils', () => ({
  enrollTraining: jest.fn(),
  getTraining: jest.fn(),
}));

jest.mock('../../../almLib/utils/translationService', () => ({
  GetTranslation: jest.fn((key) => key),
}));

jest.mock('../../../almLib/components/Widgets/ALMPrimeStrip/ALMPrimeStrip.helper', () => ({
  getItemIndexFromList: jest.fn(),
}));

jest.mock('../../../almLib/store/actions/author/action', () => ({
  loadTrainings: jest.fn((payload) => ({ type: 'LOAD_TRAININGS', payload })),
  paginateTrainings: jest.fn((payload) => ({ type: 'PAGINATE_TRAININGS', payload })),
  updateTrainingsAuthor: jest.fn((payload) => ({ type: 'UPDATE_TRAININGS_AUTHOR', payload })),
}));

import { act } from '@testing-library/react';
import React from 'react';
import ReactDOM from 'react-dom';
import { useAuthor } from '../../../almLib/hooks/author/useAuthor';
import { useDispatch, useSelector } from 'react-redux';
import APIServiceInstance from '../../../almLib/common/APIService';
import { RestAdapter } from '../../../almLib/utils/restAdapter';
import { JsonApiParse } from '../../../almLib/utils/jsonAPIAdapter';
import { getALMConfig } from '../../../almLib/utils/global';
import { enrollTraining, getTraining } from '../../../almLib/utils/lo-utils';
import { GetTranslation } from '../../../almLib/utils/translationService';
import { getItemIndexFromList } from '../../../almLib/components/Widgets/ALMPrimeStrip/ALMPrimeStrip.helper';
import {
  loadTrainings,
  paginateTrainings,
  updateTrainingsAuthor,
} from '../../../almLib/store/actions/author/action';

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

describe('useAuthor', () => {
  const mockUseDispatch = useDispatch as jest.MockedFunction<typeof useDispatch>;
  const mockUseSelector = useSelector as jest.MockedFunction<typeof useSelector>;
  const mockGetALMConfig = getALMConfig as jest.MockedFunction<typeof getALMConfig>;
  const mockRestAdapterAjax = RestAdapter.ajax as jest.MockedFunction<typeof RestAdapter.ajax>;
  const mockRestAdapterPost = RestAdapter.post as jest.MockedFunction<typeof RestAdapter.post>;
  const mockRestAdapterDelete = RestAdapter.delete as jest.MockedFunction<typeof RestAdapter.delete>;
  const mockJsonApiParse = JsonApiParse as jest.MockedFunction<typeof JsonApiParse>;
  const mockEnrollTraining = enrollTraining as jest.MockedFunction<typeof enrollTraining>;
  const mockGetTraining = getTraining as jest.MockedFunction<typeof getTraining>;
  const mockGetTranslation = GetTranslation as jest.MockedFunction<typeof GetTranslation>;
  const mockGetItemIndexFromList = getItemIndexFromList as jest.MockedFunction<
    typeof getItemIndexFromList
  >;
  const mockLoadTrainings = loadTrainings as jest.MockedFunction<typeof loadTrainings>;
  const mockPaginateTrainings = paginateTrainings as jest.MockedFunction<typeof paginateTrainings>;
  const mockUpdateTrainingsAuthor = updateTrainingsAuthor as jest.MockedFunction<
    typeof updateTrainingsAuthor
  >;

  const mockDispatch = jest.fn();
  const mockConfig = {
    primeApiURL: 'https://learningmanager.adobe.com/primeapi/v2/',
  };

  const mockTraining = {
    id: 'course:123',
    type: 'learningObject',
    attributes: {
      name: 'Test Course',
      loType: 'course',
    },
    isBookmarked: false,
  };

  const mockAuthorDetails = {
    id: 'user:456',
    name: 'John Doe',
    email: 'john@example.com',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseDispatch.mockReturnValue(mockDispatch);
    mockUseSelector.mockReturnValue({ trainings: [], next: '' });
    mockGetALMConfig.mockReturnValue(mockConfig as any);
    mockGetTranslation.mockImplementation((key) => key);
    APIServiceInstance.getTrainingsForAuthor = jest.fn();
  });

  describe('Hook Initialization', () => {
    it('should initialize with isLoading false', async () => {
      (APIServiceInstance.getTrainingsForAuthor as jest.Mock).mockResolvedValue({
        trainings: [],
        next: '',
        meta: { count: 0 },
      });

      let result;
      await act(async () => {
        result = renderHook(() => useAuthor('author-1', 'external'));
      });

      expect(result.result.current.isLoading).toBe(false);
    });

    it('should initialize with empty errorCode', async () => {
      (APIServiceInstance.getTrainingsForAuthor as jest.Mock).mockResolvedValue({
        trainings: [],
        next: '',
        meta: { count: 0 },
      });

      let result;
      await act(async () => {
        result = renderHook(() => useAuthor('author-1', 'external'));
      });

      expect(result.result.current.errorCode).toBe('');
    });

    it('should initialize with totalTrainings 0', async () => {
      (APIServiceInstance.getTrainingsForAuthor as jest.Mock).mockResolvedValue({
        trainings: [],
        next: '',
        meta: { count: 0 },
      });

      let result;
      await act(async () => {
        result = renderHook(() => useAuthor('author-1', 'external'));
      });

      expect(result.result.current.totalTrainings).toBe(0);
    });
  });

  describe('useEffect - Initial Data Fetch', () => {
    it('should fetch trainings on mount for external author', async () => {
      (APIServiceInstance.getTrainingsForAuthor as jest.Mock).mockResolvedValue({
        trainings: [mockTraining],
        next: '',
        meta: { count: 1 },
      });

      await act(async () => {
        renderHook(() => useAuthor('author-1', 'external'));
      });

      expect(APIServiceInstance.getTrainingsForAuthor).toHaveBeenCalledWith(
        'author-1',
        'external',
        '-date'
      );
    });

    it('should fetch author details for internal author', async () => {
      (APIServiceInstance.getTrainingsForAuthor as jest.Mock).mockResolvedValue({
        trainings: [],
        next: '',
        meta: { count: 0 },
      });

      mockRestAdapterAjax.mockResolvedValue({ data: mockAuthorDetails });
      mockJsonApiParse.mockReturnValue({ user: mockAuthorDetails } as any);

      await act(async () => {
        renderHook(() => useAuthor('user:456', 'Internal'));
      });

      expect(mockRestAdapterAjax).toHaveBeenCalledWith({
        url: 'https://learningmanager.adobe.com/primeapi/v2/users/user:456',
        method: 'GET',
      });
    });

    it('should not fetch author details for external author', async () => {
      (APIServiceInstance.getTrainingsForAuthor as jest.Mock).mockResolvedValue({
        trainings: [],
        next: '',
        meta: { count: 0 },
      });

      await act(async () => {
        renderHook(() => useAuthor('author-1', 'external'));
      });

      expect(mockRestAdapterAjax).not.toHaveBeenCalled();
    });
  });

  describe('fetchTrainings', () => {
    it('should fetch trainings successfully', async () => {
      (APIServiceInstance.getTrainingsForAuthor as jest.Mock).mockResolvedValue({
        trainings: [mockTraining],
        next: 'next-url',
        meta: { count: 1 },
      });

      let result;
      await act(async () => {
        result = renderHook(() => useAuthor('author-1', 'external'));
      });

      await act(async () => {
        await result.result.current.fetchTrainings('name');
      });

      expect(APIServiceInstance.getTrainingsForAuthor).toHaveBeenCalledWith(
        'author-1',
        'external',
        'name'
      );
      expect(mockDispatch).toHaveBeenCalled();
    });

    it('should update totalTrainings from meta', async () => {
      (APIServiceInstance.getTrainingsForAuthor as jest.Mock).mockResolvedValue({
        trainings: [mockTraining],
        next: '',
        meta: { count: 5 },
      });

      let result;
      await act(async () => {
        result = renderHook(() => useAuthor('author-1', 'external'));
      });

      expect(result.result.current.totalTrainings).toBe(5);
    });

    it('should handle API errors gracefully', async () => {
      (APIServiceInstance.getTrainingsForAuthor as jest.Mock)
        .mockResolvedValueOnce({
          trainings: [],
          next: '',
          meta: { count: 0 },
        })
        .mockRejectedValueOnce({ status: '404' });

      let result;
      await act(async () => {
        result = renderHook(() => useAuthor('author-1', 'external'));
      });

      await act(async () => {
        await result.result.current.fetchTrainings('name');
      });

      expect(result.result.current.errorCode).toBe('404');
      expect(result.result.current.isLoading).toBe(false);
    });

    it('should dispatch loadTrainings with empty array on error', async () => {
      (APIServiceInstance.getTrainingsForAuthor as jest.Mock)
        .mockResolvedValueOnce({
          trainings: [],
          next: '',
          meta: { count: 0 },
        })
        .mockRejectedValueOnce({ status: '500' });

      let result;
      await act(async () => {
        result = renderHook(() => useAuthor('author-1', 'external'));
      });

      await act(async () => {
        await result.result.current.fetchTrainings('name');
      });

      expect(mockLoadTrainings).toHaveBeenCalledWith({
        trainings: [],
        next: '',
      });
    });
  });

  describe('loadMoreTraining', () => {
    it('should load more trainings when next is available', async () => {
      mockUseSelector.mockReturnValue({ trainings: [mockTraining], next: 'next-url' });
      (APIServiceInstance.getTrainingsForAuthor as jest.Mock).mockResolvedValue({
        trainings: [{ ...mockTraining, id: 'course:456' }],
        next: '',
        meta: {},
      });

      let result;
      await act(async () => {
        result = renderHook(() => useAuthor('author-1', 'external'));
      });

      await act(async () => {
        await result.result.current.loadMoreTraining();
      });

      expect(APIServiceInstance.getTrainingsForAuthor).toHaveBeenCalledWith(
        'author-1',
        'external',
        '-date',
        'next-url'
      );
    });

    it('should not load more when next is empty', async () => {
      mockUseSelector.mockReturnValue({ trainings: [mockTraining], next: '' });
      (APIServiceInstance.getTrainingsForAuthor as jest.Mock).mockResolvedValue({
        trainings: [],
        next: '',
        meta: { count: 1 },
      });

      let result;
      await act(async () => {
        result = renderHook(() => useAuthor('author-1', 'external'));
      });

      mockDispatch.mockClear();

      await act(async () => {
        await result.result.current.loadMoreTraining();
      });

      // Should not call paginateTrainings
      expect(mockPaginateTrainings).not.toHaveBeenCalled();
    });

    it('should handle pagination errors', async () => {
      mockUseSelector.mockReturnValue({ trainings: [mockTraining], next: 'next-url' });
      (APIServiceInstance.getTrainingsForAuthor as jest.Mock)
        .mockResolvedValueOnce({
          trainings: [],
          next: '',
          meta: { count: 0 },
        })
        .mockRejectedValueOnce({ status: '500' });

      let result;
      await act(async () => {
        result = renderHook(() => useAuthor('author-1', 'external'));
      });

      await act(async () => {
        await result.result.current.loadMoreTraining();
      });

      expect(result.result.current.errorCode).toBe('500');
    });
  });

  describe('updateLearningObject', () => {
    it('should throw error on update failure', async () => {
      mockUseSelector.mockReturnValue({ trainings: [mockTraining], next: '' });
      mockGetTraining.mockRejectedValue(new Error('Update failed'));
      (APIServiceInstance.getTrainingsForAuthor as jest.Mock).mockResolvedValue({
        trainings: [mockTraining],
        next: '',
        meta: { count: 1 },
      });

      let result;
      await act(async () => {
        result = renderHook(() => useAuthor('author-1', 'external'));
      });

      await act(async () => {
        await expect(result.result.current.updateLearningObject('course:123')).rejects.toThrow();
      });
    });
  });

  describe('enrollmentHandler', () => {
    it('should throw translated error on enrollment failure', async () => {
      mockUseSelector.mockReturnValue({ trainings: [mockTraining], next: '' });
      mockEnrollTraining.mockRejectedValue(new Error('Enrollment failed'));
      mockGetTranslation.mockReturnValue('Enrollment error message');
      (APIServiceInstance.getTrainingsForAuthor as jest.Mock).mockResolvedValue({
        trainings: [mockTraining],
        next: '',
        meta: { count: 1 },
      });

      let result;
      await act(async () => {
        result = renderHook(() => useAuthor('author-1', 'external'));
      });

      await act(async () => {
        await expect(
          result.result.current.enrollmentHandler('course:123', 'instance-1', {})
        ).rejects.toThrow('Enrollment error message');
      });

      expect(mockGetTranslation).toHaveBeenCalledWith('alm.enrollment.error');
    });
  });

  describe('addBookmarkHandler', () => {
    it('should add bookmark successfully', async () => {
      mockUseSelector.mockReturnValue({ trainings: [mockTraining], next: '' });
      mockRestAdapterPost.mockResolvedValue({} as any);
      mockGetItemIndexFromList.mockReturnValue(0);
      (APIServiceInstance.getTrainingsForAuthor as jest.Mock).mockResolvedValue({
        trainings: [mockTraining],
        next: '',
        meta: { count: 1 },
      });

      let result;
      await act(async () => {
        result = renderHook(() => useAuthor('author-1', 'external'));
      });

      await act(async () => {
        await result.result.current.addBookmarkHandler('course:123');
      });

      expect(mockRestAdapterPost).toHaveBeenCalledWith({
        url: 'https://learningmanager.adobe.com/primeapi/v2//learningObjects/course:123/bookmark',
        method: 'POST',
      });
      expect(mockUpdateTrainingsAuthor).toHaveBeenCalled();
    });

    it('should throw error on bookmark failure', async () => {
      mockUseSelector.mockReturnValue({ trainings: [mockTraining], next: '' });
      mockRestAdapterPost.mockRejectedValue(new Error('Bookmark failed'));
      (APIServiceInstance.getTrainingsForAuthor as jest.Mock).mockResolvedValue({
        trainings: [mockTraining],
        next: '',
        meta: { count: 1 },
      });

      let result;
      await act(async () => {
        result = renderHook(() => useAuthor('author-1', 'external'));
      });

      await act(async () => {
        await expect(result.result.current.addBookmarkHandler('course:123')).rejects.toThrow();
      });
    });
  });

  describe('removeBookmarkHandler', () => {
    it('should remove bookmark successfully', async () => {
      const bookmarkedTraining = { ...mockTraining, isBookmarked: true };
      mockUseSelector.mockReturnValue({ trainings: [bookmarkedTraining], next: '' });
      mockRestAdapterDelete.mockResolvedValue({} as any);
      mockGetItemIndexFromList.mockReturnValue(0);
      (APIServiceInstance.getTrainingsForAuthor as jest.Mock).mockResolvedValue({
        trainings: [bookmarkedTraining],
        next: '',
        meta: { count: 1 },
      });

      let result;
      await act(async () => {
        result = renderHook(() => useAuthor('author-1', 'external'));
      });

      await act(async () => {
        await result.result.current.removeBookmarkHandler('course:123');
      });

      expect(mockRestAdapterDelete).toHaveBeenCalledWith({
        url: 'https://learningmanager.adobe.com/primeapi/v2//learningObjects/course:123/bookmark',
        method: 'DELETE',
      });
      expect(mockUpdateTrainingsAuthor).toHaveBeenCalled();
    });

    it('should throw error on remove bookmark failure', async () => {
      mockUseSelector.mockReturnValue({ trainings: [mockTraining], next: '' });
      mockRestAdapterDelete.mockRejectedValue(new Error('Remove bookmark failed'));
      (APIServiceInstance.getTrainingsForAuthor as jest.Mock).mockResolvedValue({
        trainings: [mockTraining],
        next: '',
        meta: { count: 1 },
      });

      let result;
      await act(async () => {
        result = renderHook(() => useAuthor('author-1', 'external'));
      });

      await act(async () => {
        await expect(result.result.current.removeBookmarkHandler('course:123')).rejects.toThrow();
      });
    });
  });

  describe('hasMoreItems', () => {
    it('should return true when next is available', async () => {
      mockUseSelector.mockReturnValue({ trainings: [mockTraining], next: 'next-url' });
      (APIServiceInstance.getTrainingsForAuthor as jest.Mock).mockResolvedValue({
        trainings: [mockTraining],
        next: 'next-url',
        meta: { count: 10 },
      });

      let result;
      await act(async () => {
        result = renderHook(() => useAuthor('author-1', 'external'));
      });

      expect(result.result.current.hasMoreItems).toBe(true);
    });

    it('should return false when next is empty', async () => {
      mockUseSelector.mockReturnValue({ trainings: [mockTraining], next: '' });
      (APIServiceInstance.getTrainingsForAuthor as jest.Mock).mockResolvedValue({
        trainings: [mockTraining],
        next: '',
        meta: { count: 1 },
      });

      let result;
      await act(async () => {
        result = renderHook(() => useAuthor('author-1', 'external'));
      });

      expect(result.result.current.hasMoreItems).toBe(false);
    });
  });
});

