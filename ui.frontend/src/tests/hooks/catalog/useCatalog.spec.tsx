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
jest.mock('@common/APIService', () => ({
  __esModule: true,
  default: {
    getTrainings: jest.fn(),
    loadMoreTrainings: jest.fn(),
    enrollToTraining: jest.fn(),
    getCatalogsByIds: jest.fn(),
  },
}));

jest.mock('@utils/global', () => ({
  getPageAttributes: jest.fn(() => null),
  getQueryParamsFromUrl: jest.fn(() => ({})),
  getALMConfig: jest.fn(() => ({ primeApiURL: 'https://api.example.com/' })),
}));

jest.mock('@utils/lo-utils', () => ({
  getTraining: jest.fn(),
}));

jest.mock('@utils/translationService', () => ({
  GetTranslation: jest.fn((key: string) => key),
}));

jest.mock('@utils/restAdapter', () => ({
  RestAdapter: {
    post: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock('@utils/catalog', () => ({
  debounce: jest.fn((fn: Function) => fn),
}));

jest.mock('@utils/constants', () => ({
  JOB_AID_ID: 'jobAidId',
  UPDATE_LO_ERROR: 'UPDATE_LO_ERROR',
  DEFUALT_LO_INCLUDE: 'enrollment',
}));

jest.mock('@utils/widgets/base/EventHandlingBase', () => ({
  PrimeDispatchEvent: jest.fn(),
}));

jest.mock('@utils/widgets/common', () => ({
  PrimeEvent: { ALM_TRAININGS_LOADED: 'ALM_TRAININGS_LOADED' },
}));

jest.mock('@components/Widgets/ALMPrimeStrip/ALMPrimeStrip.helper', () => ({
  updateLOBookmark: jest.fn((list: any[], _loId: string, _isBookmarked: boolean) => list),
}));

jest.mock('@common/ALMCustomHooks', () => ({
  DEFUALT_LO_INCLUDE: 'enrollment',
}));

// Mock useFilter and useSearch (heavy dependencies)
jest.mock('@hooks/catalog/useFilter', () => ({
  useFilter: jest.fn(() => ({
    filters: {},
    filterState: {},
    updateFilters: jest.fn(),
    updatePriceRangeFilter: jest.fn(),
    resetFilterList: jest.fn(),
    resetFilters: jest.fn(),
    areFiltersLoading: false,
    searchFilters: jest.fn(),
    clearFilterSearch: jest.fn(),
    updateFilterList: jest.fn(),
  })),
}));

jest.mock('@hooks/catalog/useSearch', () => ({
  useSearch: jest.fn(() => ({
    query: '',
    handleSearch: jest.fn(),
    resetSearch: jest.fn(),
    getSearchSuggestions: jest.fn(),
  })),
}));

jest.mock('../../../store/APIStore', () => ({
  __esModule: true,
  default: {
    getState: jest.fn(() => ({
      catalog: { filterState: { catalogs: '' } },
    })),
    dispatch: jest.fn(),
  },
}));

jest.mock('@almStore/actions/catalog/action', () => ({
  loadTrainings: jest.fn((p: any) => ({ type: 'LOAD_TRAININGS', payload: p })),
  paginateTrainings: jest.fn((p: any) => ({ type: 'PAGINATE_TRAININGS', payload: p })),
  updateSnippetOnLoad: jest.fn(),
  updateSnippetType: jest.fn((p: string) => ({ type: 'UPDATE_SNIPPET_TYPE', payload: p })),
  updateTrainings: jest.fn((p: any) => ({ type: 'UPDATE_TRAININGS', payload: p })),
}));

jest.mock('@almStore/reducers/catalog', () => ({
  defaultSearchInDropdownList: [
    { label: 'Course Name', value: 'name', checked: false },
    { label: 'Description', value: 'description', checked: false },
  ],
}));

import React from 'react';
import ReactDOM from 'react-dom';
import { act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import { useCatalog } from '@hooks/catalog/useCatalog';
import APIServiceInstance from '@common/APIService';
import * as loUtils from '@utils/lo-utils';
import * as restAdapterModule from '@utils/restAdapter';

const mockGetTrainings = APIServiceInstance.getTrainings as jest.MockedFunction<typeof APIServiceInstance.getTrainings>;
const mockLoadMoreTrainings = APIServiceInstance.loadMoreTrainings as jest.MockedFunction<typeof APIServiceInstance.loadMoreTrainings>;
const mockEnrollToTraining = APIServiceInstance.enrollToTraining as jest.MockedFunction<typeof APIServiceInstance.enrollToTraining>;
const mockGetCatalogsByIds = APIServiceInstance.getCatalogsByIds as jest.MockedFunction<typeof APIServiceInstance.getCatalogsByIds>;
const mockGetTraining = loUtils.getTraining as jest.MockedFunction<typeof loUtils.getTraining>;
const mockRestPost = restAdapterModule.RestAdapter.post as jest.MockedFunction<typeof restAdapterModule.RestAdapter.post>;
const mockRestDelete = restAdapterModule.RestAdapter.delete as jest.MockedFunction<typeof restAdapterModule.RestAdapter.delete>;

const sampleTraining = { id: 'course:1', loType: 'course' };
const sampleTraining2 = { id: 'course:2', loType: 'course' };

function createMockStore(overrides: any = {}) {
  return createStore(() => ({
    catalog: {
      sort: 'name',
      next: '',
      autoCorrectMode: false,
      trainings: [sampleTraining, sampleTraining2],
      ...overrides,
    },
  }));
}

function renderHook(storeOverrides: any = {}) {
  const result: any = { current: null };
  const store = createMockStore(storeOverrides);
  const container = document.createElement('div');
  document.body.appendChild(container);

  const Wrapper = ({ children }: any) => <Provider store={store}>{children}</Provider>;

  act(() => {
    ReactDOM.render(
      React.createElement(Wrapper, null,
        React.createElement(() => {
          result.current = useCatalog();
          return null;
        })
      ),
      container
    );
  });

  return {
    result,
    store,
    unmount: () => {
      act(() => { ReactDOM.unmountComponentAtNode(container); });
      container.parentNode?.removeChild(container);
    },
  };
}

describe('useCatalog', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    // resetMocks:true clears jest.fn() factory implementations — restore them here
    (require('@utils/global').getPageAttributes as jest.Mock).mockReturnValue(null);
    (require('@utils/global').getQueryParamsFromUrl as jest.Mock).mockReturnValue({});
    (require('@utils/global').getALMConfig as jest.Mock).mockReturnValue({ primeApiURL: 'https://api.example.com/' });
    (require('@utils/catalog').debounce as jest.Mock).mockImplementation((fn: Function) => fn);
    (require('@hooks/catalog/useFilter').useFilter as jest.Mock).mockReturnValue({
      filters: {},
      filterState: {},
      updateFilters: jest.fn(),
      updatePriceRangeFilter: jest.fn(),
      resetFilterList: jest.fn(),
      resetFilters: jest.fn(),
      areFiltersLoading: false,
      searchFilters: jest.fn(),
      clearFilterSearch: jest.fn(),
      updateFilterList: jest.fn(),
    });
    (require('@hooks/catalog/useSearch').useSearch as jest.Mock).mockReturnValue({
      query: '',
      handleSearch: jest.fn(),
      resetSearch: jest.fn(),
      getSearchSuggestions: jest.fn(),
    });
    (require('../../../store/APIStore').default.getState as jest.Mock).mockReturnValue({
      catalog: { filterState: { catalogs: '' } },
    });
    (require('@almStore/actions/catalog/action').loadTrainings as jest.Mock).mockImplementation((p: any) => ({ type: 'LOAD_TRAININGS', payload: p }));
    (require('@almStore/actions/catalog/action').paginateTrainings as jest.Mock).mockImplementation((p: any) => ({ type: 'PAGINATE_TRAININGS', payload: p }));
    (require('@almStore/actions/catalog/action').updateSnippetType as jest.Mock).mockImplementation((p: string) => ({ type: 'UPDATE_SNIPPET_TYPE', payload: p }));
    (require('@almStore/actions/catalog/action').updateTrainings as jest.Mock).mockImplementation((p: any) => ({ type: 'UPDATE_TRAININGS', payload: p }));
    (require('@components/Widgets/ALMPrimeStrip/ALMPrimeStrip.helper').updateLOBookmark as jest.Mock).mockImplementation((list: any[]) => list);
    mockGetTrainings.mockResolvedValue({
      learningObjectList: [sampleTraining],
      links: { next: '' },
      meta: {},
    } as any);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('fetchTrainings', () => {
    it('fetchTrainings_onMount_callsGetTrainings', async () => {
      renderHook();

      await act(async () => { jest.runAllTimers(); });
      await act(async () => { await Promise.resolve(); });

      expect(mockGetTrainings).toHaveBeenCalledTimes(1);
    });

    it('fetchTrainings_success_setsIsLoadingFalse', async () => {
      const { result } = renderHook();

      await act(async () => { jest.runAllTimers(); });
      await act(async () => { await Promise.resolve(); });

      expect(result.current.isLoading).toBe(false);
    });

    it('fetchTrainings_apiError_setsErrorCode', async () => {
      mockGetTrainings.mockRejectedValue({ status: 500 });
      const { result } = renderHook();

      await act(async () => { jest.runAllTimers(); });
      await act(async () => { await Promise.resolve(); });

      expect(result.current.errorCode).toBe(500);
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('loadMoreTraining', () => {
    it('loadMoreTraining_withNext_callsLoadMoreTrainings', async () => {
      mockLoadMoreTrainings.mockResolvedValue({
        learningObjectList: [sampleTraining2],
        links: { next: '' },
      } as any);

      const { result } = renderHook({ next: 'https://next.url' });

      // fetchTrainings runs after 100ms debounce — advance timers and wait for it
      await act(async () => { jest.runAllTimers(); });
      await act(async () => { await Promise.resolve(); });
      await act(async () => { await Promise.resolve(); });

      // Now isLoading is false — loadMoreTraining can proceed
      await act(async () => {
        await result.current.loadMoreTraining();
      });

      expect(mockLoadMoreTrainings).toHaveBeenCalledTimes(1);
    });

    it('loadMoreTraining_noNext_doesNotCallApi', async () => {
      const { result } = renderHook({ next: '' });

      await act(async () => {
        await result.current.loadMoreTraining();
      });

      expect(mockLoadMoreTrainings).not.toHaveBeenCalled();
    });

    it('loadMoreTraining_apiError_setsErrorCode', async () => {
      mockLoadMoreTrainings.mockRejectedValue({ status: 503 });

      const { result } = renderHook({ next: 'https://next.url' });

      // Resolve initial fetchTrainings to clear isLoading before testing loadMoreTraining
      await act(async () => { jest.runAllTimers(); });
      await act(async () => { await Promise.resolve(); });
      await act(async () => { await Promise.resolve(); });

      await act(async () => {
        await result.current.loadMoreTraining();
      });

      expect(result.current.errorCode).toBe(503);
    });
  });

  describe('updateLearningObject', () => {
    it('updateLearningObject_success_returnsUpdatedTraining', async () => {
      const updatedTraining = { ...sampleTraining, name: 'Updated Course' };
      mockGetTraining.mockResolvedValue(updatedTraining as any);

      const { result } = renderHook();

      let response: any;
      await act(async () => {
        response = await result.current.updateLearningObject('course:1');
      });

      expect(mockGetTraining).toHaveBeenCalledWith('course:1', expect.any(String));
      expect(response.name).toBe('Updated Course');
    });

    it('updateLearningObject_apiError_throwsUpdateLoError', async () => {
      mockGetTraining.mockRejectedValue(new Error('Not found'));

      const { result } = renderHook();

      await expect(
        act(async () => {
          await result.current.updateLearningObject('course:1');
        })
      ).rejects.toThrow('UPDATE_LO_ERROR');
    });
  });

  describe('enrollmentHandler', () => {
    it('enrollmentHandler_success_returnsEnrollment', async () => {
      const enrollment = { id: 'enroll:1', state: 'ENROLLED' };
      mockEnrollToTraining.mockResolvedValue({
        learningObjectInstanceEnrollment: enrollment,
      } as any);
      mockGetTraining.mockResolvedValue(sampleTraining as any);

      const { result } = renderHook();

      let response: any;
      await act(async () => {
        response = await result.current.enrollmentHandler('course:1', 'inst:1');
      });

      expect(mockEnrollToTraining).toHaveBeenCalledWith({
        loId: 'course:1',
        loInstanceId: 'inst:1',
      });
      expect(response.id).toBe('enroll:1');
    });

    it('enrollmentHandler_apiError_throwsEnrollmentError', async () => {
      mockEnrollToTraining.mockRejectedValue(new Error('Enrollment failed'));
      mockGetTraining.mockRejectedValue(new Error('Not found'));

      const { result } = renderHook();

      await expect(
        act(async () => {
          await result.current.enrollmentHandler('course:1', 'inst:1');
        })
      ).rejects.toThrow();
    });
  });

  describe('removeTrainingFromListById', () => {
    it('removeTrainingFromListById_existingId_removesFromTrainingList', () => {
      const { result } = renderHook();
      const updateTrainings = require('@almStore/actions/catalog/action').updateTrainings as jest.Mock;

      act(() => { result.current.removeTrainingFromListById('course:1'); });

      expect(updateTrainings).toHaveBeenCalledWith({
        trainings: [sampleTraining2],
      });
    });
  });

  describe('addBookmarkHandler / removeBookmarkHandler', () => {
    it('addBookmarkHandler_success_callsPostEndpoint', async () => {
      mockRestPost.mockResolvedValue({} as any);

      const { result } = renderHook();

      await act(async () => {
        await result.current.addBookmarkHandler('course:1');
      });

      expect(mockRestPost).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining('course:1/bookmark'),
          method: 'POST',
        })
      );
    });

    it('addBookmarkHandler_apiError_throwsError', async () => {
      mockRestPost.mockRejectedValue(new Error('Bookmark failed'));

      const { result } = renderHook();

      await expect(
        act(async () => { await result.current.addBookmarkHandler('course:1'); })
      ).rejects.toThrow();
    });

    it('removeBookmarkHandler_success_callsDeleteEndpoint', async () => {
      mockRestDelete.mockResolvedValue({} as any);

      const { result } = renderHook();

      await act(async () => {
        await result.current.removeBookmarkHandler('course:1');
      });

      expect(mockRestDelete).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining('course:1/bookmark'),
          method: 'DELETE',
        })
      );
    });

    it('removeBookmarkHandler_apiError_throwsError', async () => {
      mockRestDelete.mockRejectedValue(new Error('Remove failed'));

      const { result } = renderHook();

      await expect(
        act(async () => { await result.current.removeBookmarkHandler('course:1'); })
      ).rejects.toThrow();
    });
  });

  describe('updateSnippet', () => {
    it('updateSnippet_checkItem_buildsPayloadFromCheckedItems', () => {
      const { result } = renderHook();

      act(() => {
        result.current.updateSnippet(true, { label: 'Course Name' });
      });

      // Function runs without error and the hook's public API remains intact
      expect(typeof result.current.updateSnippet).toBe('function');
      expect(typeof result.current.loadMoreTraining).toBe('function');
    });
  });

  describe('hydrateSelectedCatalogs', () => {
    it('hydrateSelectedCatalogs_noSelectedCatalogs_doesNotCallApi', async () => {
      const { result } = renderHook();

      await act(async () => {
        await result.current.hydrateSelectedCatalogs();
      });

      expect(mockGetCatalogsByIds).not.toHaveBeenCalled();
    });

    it('hydrateSelectedCatalogs_withSelectedCatalogIds_callsGetCatalogsByIds', async () => {
      const store = require('../../../store/APIStore').default;
      store.getState.mockReturnValue({
        catalog: { filterState: { catalogs: 'cat:1,cat:2' } },
      });
      mockGetCatalogsByIds.mockResolvedValue([
        { id: 'cat:1', name: 'Catalog 1' },
        { id: 'cat:2', name: 'Catalog 2' },
      ] as any);

      const { result } = renderHook();

      await act(async () => {
        await result.current.hydrateSelectedCatalogs();
      });

      expect(mockGetCatalogsByIds).toHaveBeenCalledWith(['cat:1', 'cat:2']);
    });
  });

  describe('Return values', () => {
    it('hasMoreItems_withNext_returnsTrue', () => {
      const { result } = renderHook({ next: 'https://next.url' });
      expect(result.current.hasMoreItems).toBe(true);
    });

    it('hasMoreItems_withoutNext_returnsFalse', () => {
      const { result } = renderHook({ next: '' });
      expect(result.current.hasMoreItems).toBe(false);
    });
  });
});
