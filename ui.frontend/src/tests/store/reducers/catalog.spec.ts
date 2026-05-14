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
 * Unit tests for catalog.ts reducer
 * Tests Redux reducer for catalog state management, filters, and trainings
 */

import catalog, {
  CatalogState,
  CatalogFilterState,
  DEFUALT_FILTERS_VALUE,
  defaultSearchInDropdownList,
} from '@almLib/store/reducers/catalog';
import {
  LOAD_TRAININGS,
  PAGINATE_TRAININGS,
  UPDATE_TRAININGS,
  RESET_SEARCH_TEXT,
  UPDATE_CATALOGS_FILTERS,
  UPDATE_DURATION_FILTERS,
  UPDATE_FILTERS_ON_LOAD,
  UPDATE_LEARNERSTATE_FILTERS,
  UPDATE_LOFORMAT_FILTERS,
  UPDATE_LOTYPES_FILTERS,
  UPDATE_PRICE_FILTERS,
  UPDATE_PRICE_RANGE_FILTERS,
  UPDATE_SEARCH_TEXT,
  UPDATE_SKILLLEVEL_FILTERS,
  UPDATE_SKILLNAME_FILTERS,
  UPDATE_TAGS_FILTERS,
  UPDATE_CITIES_FILTERS,
  UPDATE_SNIPPET_TYPE,
  UPDATE_SNIPPET_ON_LOAD,
  OPEN_SNIPPET_TYPE_DIALOG,
  CLOSE_SNIPPET_TYPE_DIALOG,
  UPDATE_PRODUCTS_FILTERS,
  UPDATE_ROLES_FILTERS,
  UPDATE_LEVELS_FILTERS,
  UPDATE_SORT,
  UPDATE_ANNOUNCED_GROUPS_FILTERS,
  CLEAR_LEVELS,
  CLEAR_ALL,
  LOAD_USER_SKILLS,
  UPDATE_SHOW_FILTER_LISTS,
  UPDATE_ALL_FILTERS,
  UPDATE_SELECTED_CATALOGS,
} from '@almLib/store/actions/catalog/actionTypes';
import { AppEvents } from '@almLib/store/actions/appState';
import { PrimeLearningObject } from '@models/PrimeModels';
import { ALL } from '@utils/constants';

// Mock JsonApiParse before imports
jest.mock('@utils/jsonAPIAdapter', () => ({
  JsonApiParse: jest.fn(data => ({
    learningObject: data,
  })),
}));

import { JsonApiParse } from '@utils/jsonAPIAdapter';

describe('catalog reducer', () => {
  // ==========================================
  // Initial State
  // ==========================================

  it('should return initial state', () => {
    const state = catalog(undefined, { type: '@@INIT' });

    expect(state.trainings).toEqual([]);
    expect(state.offlineTrainings).toBeNull();
    expect(state.sort).toBe('-date');
    expect(state.next).toBe('');
    expect(state.query).toBe('');
    expect(state.snippetType).toBe('');
    expect(state.openSearchInDialog).toBe(false);
    expect(state.userSkills).toEqual({});
    expect(state.autoCorrectMode).toBe(true);
    expect(state.selectedCatalogs).toEqual({});
  });

  // ==========================================
  // Trainings Reducer
  // ==========================================

  describe('trainings reducer', () => {
    it('should load trainings on LOAD_TRAININGS', () => {
      const trainings: PrimeLearningObject[] = [
        { id: 'course:1', loType: 'course' } as PrimeLearningObject,
        { id: 'course:2', loType: 'course' } as PrimeLearningObject,
      ];

      const action = {
        type: LOAD_TRAININGS,
        payload: { trainings, next: 'page2' },
      };
      const state = catalog(undefined, action);

      expect(state.trainings).toEqual(trainings);
      expect(state.trainings).toHaveLength(2);
    });

    it('should return empty array if no trainings in LOAD_TRAININGS', () => {
      const action = {
        type: LOAD_TRAININGS,
        payload: { trainings: null },
      };
      const state = catalog(undefined, action);

      expect(state.trainings).toEqual([]);
    });

    it('should paginate trainings on PAGINATE_TRAININGS', () => {
      const initialTrainings: PrimeLearningObject[] = [
        { id: 'course:1', loType: 'course' } as PrimeLearningObject,
      ];
      const newTrainings: PrimeLearningObject[] = [
        { id: 'course:2', loType: 'course' } as PrimeLearningObject,
      ];

      const loadAction = {
        type: LOAD_TRAININGS,
        payload: { trainings: initialTrainings, next: 'page2' },
      };
      let state = catalog(undefined, loadAction);

      const paginateAction = {
        type: PAGINATE_TRAININGS,
        payload: { trainings: newTrainings, next: null },
      };
      state = catalog(state, paginateAction);

      expect(state.trainings).toHaveLength(2);
      expect(state.trainings![0].id).toBe('course:1');
      expect(state.trainings![1].id).toBe('course:2');
    });

    it('should update trainings on UPDATE_TRAININGS', () => {
      const initialTrainings: PrimeLearningObject[] = [
        { id: 'course:1', loType: 'course' } as PrimeLearningObject,
      ];
      const updatedTrainings: PrimeLearningObject[] = [
        { id: 'course:2', loType: 'course' } as PrimeLearningObject,
        { id: 'course:3', loType: 'course' } as PrimeLearningObject,
      ];

      const loadAction = {
        type: LOAD_TRAININGS,
        payload: { trainings: initialTrainings },
      };
      let state = catalog(undefined, loadAction);

      const updateAction = {
        type: UPDATE_TRAININGS,
        payload: { trainings: updatedTrainings },
      };
      state = catalog(state, updateAction);

      expect(state.trainings).toHaveLength(2);
      expect(state.trainings![0].id).toBe('course:2');
    });
  });

  // ==========================================
  // Offline Trainings Reducer
  // ==========================================

  describe('offlineTrainings reducer', () => {
    beforeEach(() => {
      // Clear and setup mock
      (JsonApiParse as jest.Mock).mockClear();
      (JsonApiParse as jest.Mock).mockImplementation(data => ({
        learningObject: data,
      }));
    });

    it('should load offline catalogs on LOAD_OFFLINE_CATALOGS', () => {
      const mockData = [
        { loOverviewAPIResponse: { id: 'course:1', loType: 'course' } },
        { loOverviewAPIResponse: { id: 'course:2', loType: 'course' } },
      ];

      const action = {
        type: AppEvents.LOAD_OFFLINE_CATALOGS,
        data: mockData,
      };
      const state = catalog(undefined, action);

      expect(state.offlineTrainings).toHaveLength(2);
    });

    it('should update offline catalogs on UPDATE_OFFLINE_CATALOGS', () => {
      const existingLO = { id: 'course:1', loType: 'course' };
      const newLO = { id: 'course:2', loType: 'course' };

      const loadAction = {
        type: AppEvents.LOAD_OFFLINE_CATALOGS,
        data: [{ loOverviewAPIResponse: existingLO }],
      };
      let state = catalog(undefined, loadAction);

      const updateAction = {
        type: AppEvents.UPDATE_OFFLINE_CATALOGS,
        data: {
          loOverviewAPIResponse: { data: newLO },
        },
      };
      state = catalog(state, updateAction);

      expect(state.offlineTrainings).toHaveLength(2);
    });

    it('should delete download on DELETE_DOWNLOAD', () => {
      const mockData = [
        { loOverviewAPIResponse: { id: 'course:1', loType: 'course' } },
        { loOverviewAPIResponse: { id: 'course:2', loType: 'course' } },
      ];

      const loadAction = {
        type: AppEvents.LOAD_OFFLINE_CATALOGS,
        data: mockData,
      };
      let state = catalog(undefined, loadAction);

      const deleteAction = {
        type: AppEvents.DELETE_DOWNLOAD,
        value: { loId: 'course:1' },
      };
      state = catalog(state, deleteAction);

      expect(state.offlineTrainings).toHaveLength(1);
      expect(state.offlineTrainings![0].id).toBe('course:2');
    });
  });

  // ==========================================
  // Sort Reducer
  // ==========================================

  describe('sort reducer', () => {
    it('should update sort order on UPDATE_SORT', () => {
      const action = {
        type: UPDATE_SORT,
        payload: 'name',
      };
      const state = catalog(undefined, action);

      expect(state.sort).toBe('name');
    });

    it('should handle all sort options', () => {
      const sortOptions = [
        'name',
        'date',
        '-name',
        '-date',
        'effectiveness',
        'rating',
        '-rating',
        'dueDate',
      ];

      sortOptions.forEach(sortValue => {
        const action = {
          type: UPDATE_SORT,
          payload: sortValue,
        };
        const state = catalog(undefined, action);
        expect(state.sort).toBe(sortValue);
      });
    });

    it('should default to -date', () => {
      const state = catalog(undefined, { type: '@@INIT' });
      expect(state.sort).toBe('-date');
    });
  });

  // ==========================================
  // Filter State - SkillName Reducer
  // ==========================================

  describe('filterState.skillName reducer', () => {
    it('should update skill name filters on UPDATE_SKILLNAME_FILTERS', () => {
      const skills = { JavaScript: true, React: true };
      const action = {
        type: UPDATE_SKILLNAME_FILTERS,
        payload: skills,
      };
      const state = catalog(undefined, action);

      expect(state.filterState.skillName).toEqual(skills);
    });

    it('should load skill name from UPDATE_FILTERS_ON_LOAD', () => {
      const skills = { Python: true };
      const action = {
        type: UPDATE_FILTERS_ON_LOAD,
        payload: {
          skillName: skills,
          tagName: {},
          loTypes: '',
          learnerState: '',
          loFormat: '',
          duration: '',
          skillLevel: '',
          catalogs: '',
          price: '',
          priceRange: '',
          cities: '',
          products: '',
          roles: '',
          levels: '',
          announcedGroups: '',
        },
      };
      const state = catalog(undefined, action);

      expect(state.filterState.skillName).toEqual(skills);
    });

    it('should clear skill name on CLEAR_ALL', () => {
      const skills = { JavaScript: true };
      const setAction = {
        type: UPDATE_SKILLNAME_FILTERS,
        payload: skills,
      };
      let state = catalog(undefined, setAction);

      const clearAction = {
        type: CLEAR_ALL,
      };
      state = catalog(state, clearAction);

      expect(state.filterState.skillName).toEqual({});
    });
  });

  // ==========================================
  // Filter State - TagName Reducer
  // ==========================================

  describe('filterState.tagName reducer', () => {
    it('should update tag name filters on UPDATE_TAGS_FILTERS', () => {
      const tags = { beginner: true, advanced: true };
      const action = {
        type: UPDATE_TAGS_FILTERS,
        payload: tags,
      };
      const state = catalog(undefined, action);

      expect(state.filterState.tagName).toEqual(tags);
    });

    it('should clear tag name on CLEAR_ALL', () => {
      const tags = { beginner: true };
      const setAction = {
        type: UPDATE_TAGS_FILTERS,
        payload: tags,
      };
      let state = catalog(undefined, setAction);

      const clearAction = {
        type: CLEAR_ALL,
      };
      state = catalog(state, clearAction);

      expect(state.filterState.tagName).toEqual({});
    });
  });

  // ==========================================
  // Filter State - LoTypes Reducer
  // ==========================================

  describe('filterState.loTypes reducer', () => {
    it('should update loTypes on UPDATE_LOTYPES_FILTERS', () => {
      const action = {
        type: UPDATE_LOTYPES_FILTERS,
        payload: 'course,learningProgram',
      };
      const state = catalog(undefined, action);

      expect(state.filterState.loTypes).toBe('course,learningProgram');
    });

    it('should use default value if payload is empty', () => {
      const action = {
        type: UPDATE_LOTYPES_FILTERS,
        payload: '',
      };
      const state = catalog(undefined, action);

      expect(state.filterState.loTypes).toBe(DEFUALT_FILTERS_VALUE.loTypes);
    });

    it('should reset to default on CLEAR_ALL', () => {
      const setAction = {
        type: UPDATE_LOTYPES_FILTERS,
        payload: 'course',
      };
      let state = catalog(undefined, setAction);

      const clearAction = {
        type: CLEAR_ALL,
      };
      state = catalog(state, clearAction);

      expect(state.filterState.loTypes).toBe(DEFUALT_FILTERS_VALUE.loTypes);
    });
  });

  // ==========================================
  // Filter State - String Filters
  // ==========================================

  describe('filterState string filters', () => {
    const stringFilters = [
      { action: UPDATE_LEARNERSTATE_FILTERS, key: 'learnerState', value: 'enrolled' },
      { action: UPDATE_LOFORMAT_FILTERS, key: 'loFormat', value: 'self' },
      { action: UPDATE_DURATION_FILTERS, key: 'duration', value: '0-1800' },
      { action: UPDATE_SKILLLEVEL_FILTERS, key: 'skillLevel', value: '1,2' },
      { action: UPDATE_CATALOGS_FILTERS, key: 'catalogs', value: 'catalog:123' },
      { action: UPDATE_PRICE_FILTERS, key: 'price', value: 'free' },
      { action: UPDATE_PRICE_RANGE_FILTERS, key: 'priceRange', value: '0-100' },
      { action: UPDATE_CITIES_FILTERS, key: 'cities', value: 'New York' },
      { action: UPDATE_PRODUCTS_FILTERS, key: 'products', value: 'product1' },
      { action: UPDATE_ROLES_FILTERS, key: 'roles', value: 'developer' },
      { action: UPDATE_LEVELS_FILTERS, key: 'levels', value: 'intermediate' },
      { action: UPDATE_ANNOUNCED_GROUPS_FILTERS, key: 'announcedGroups', value: 'group1' },
    ];

    stringFilters.forEach(({ action, key, value }) => {
      it(`should update ${key} on ${action}`, () => {
        const updateAction = {
          type: action,
          payload: value,
        };
        const state = catalog(undefined, updateAction);

        expect((state.filterState as any)[key]).toBe(value);
      });

      it(`should clear ${key} on CLEAR_ALL`, () => {
        const setAction = {
          type: action,
          payload: value,
        };
        let state = catalog(undefined, setAction);

        const clearAction = {
          type: CLEAR_ALL,
        };
        state = catalog(state, clearAction);

        expect((state.filterState as any)[key]).toBe('');
      });
    });

    it('should clear levels on CLEAR_LEVELS', () => {
      const setAction = {
        type: UPDATE_LEVELS_FILTERS,
        payload: 'intermediate',
      };
      let state = catalog(undefined, setAction);

      const clearAction = {
        type: CLEAR_LEVELS,
      };
      state = catalog(state, clearAction);

      expect(state.filterState.levels).toBe('');
    });
  });

  // ==========================================
  // Query Reducer
  // ==========================================

  describe('query reducer', () => {
    it('should update query on UPDATE_SEARCH_TEXT', () => {
      const action = {
        type: UPDATE_SEARCH_TEXT,
        payload: { query: 'React course' },
      };
      const state = catalog(undefined, action);

      expect(state.query).toBe('React course');
    });

    it('should handle empty query in UPDATE_SEARCH_TEXT', () => {
      const action = {
        type: UPDATE_SEARCH_TEXT,
        payload: { query: '' },
      };
      const state = catalog(undefined, action);

      expect(state.query).toBe('');
    });

    it('should reset query on RESET_SEARCH_TEXT', () => {
      const setAction = {
        type: UPDATE_SEARCH_TEXT,
        payload: { query: 'test' },
      };
      let state = catalog(undefined, setAction);

      const resetAction = {
        type: RESET_SEARCH_TEXT,
        payload: '',
      };
      state = catalog(state, resetAction);

      expect(state.query).toBe('');
    });
  });

  // ==========================================
  // AutoCorrectMode Reducer
  // ==========================================

  describe('autoCorrectMode reducer', () => {
    it('should set autoCorrectMode from UPDATE_SEARCH_TEXT', () => {
      const action = {
        type: UPDATE_SEARCH_TEXT,
        payload: { query: 'test', autoCorrectMode: false },
      };
      const state = catalog(undefined, action);

      expect(state.autoCorrectMode).toBe(false);
    });

    it('should default to true if not provided', () => {
      const action = {
        type: UPDATE_SEARCH_TEXT,
        payload: { query: 'test' },
      };
      const state = catalog(undefined, action);

      expect(state.autoCorrectMode).toBe(true);
    });

    it('should reset to true on RESET_SEARCH_TEXT', () => {
      const setAction = {
        type: UPDATE_SEARCH_TEXT,
        payload: { query: 'test', autoCorrectMode: false },
      };
      let state = catalog(undefined, setAction);

      const resetAction = {
        type: RESET_SEARCH_TEXT,
        payload: '',
      };
      state = catalog(state, resetAction);

      expect(state.autoCorrectMode).toBe(true);
    });

    it('should parse string false to boolean', () => {
      const action = {
        type: UPDATE_FILTERS_ON_LOAD,
        payload: {
          autoCorrectMode: 'false',
          skillName: {},
          tagName: {},
          loTypes: '',
          learnerState: '',
          loFormat: '',
          duration: '',
          skillLevel: '',
          catalogs: '',
          price: '',
          priceRange: '',
          cities: '',
          products: '',
          roles: '',
          levels: '',
          announcedGroups: '',
        },
      };
      const state = catalog(undefined, action);

      expect(state.autoCorrectMode).toBe(false);
    });
  });

  // ==========================================
  // SnippetType Reducer
  // ==========================================

  describe('snippetType reducer', () => {
    it('should update snippet type with discussion on UPDATE_SNIPPET_TYPE', () => {
      const action = {
        type: UPDATE_SNIPPET_TYPE,
        payload: 'courseName,courseOverview',
      };
      const state = catalog(undefined, action);

      expect(state.snippetType).toContain('courseName');
      expect(state.snippetType).toContain('discussion');
    });

    it('should set only discussion if payload is empty', () => {
      const action = {
        type: UPDATE_SNIPPET_TYPE,
        payload: '',
      };
      const state = catalog(undefined, action);

      expect(state.snippetType).toBe('discussion');
    });

    it('should update snippet type on UPDATE_SNIPPET_ON_LOAD', () => {
      const action = {
        type: UPDATE_SNIPPET_ON_LOAD,
        payload: 'note,skillName',
      };
      const state = catalog(undefined, action);

      expect(state.snippetType).toBe('note,skillName');
    });
  });

  // ==========================================
  // OpenSearchInDialog Reducer
  // ==========================================

  describe('openSearchInDialog reducer', () => {
    it('should open dialog on OPEN_SNIPPET_TYPE_DIALOG', () => {
      const action = {
        type: OPEN_SNIPPET_TYPE_DIALOG,
      };
      const state = catalog(undefined, action);

      expect(state.openSearchInDialog).toBe(true);
    });

    it('should close dialog on CLOSE_SNIPPET_TYPE_DIALOG', () => {
      const openAction = {
        type: OPEN_SNIPPET_TYPE_DIALOG,
      };
      let state = catalog(undefined, openAction);

      const closeAction = {
        type: CLOSE_SNIPPET_TYPE_DIALOG,
      };
      state = catalog(state, closeAction);

      expect(state.openSearchInDialog).toBe(false);
    });
  });

  // ==========================================
  // Next Reducer
  // ==========================================

  describe('next reducer', () => {
    it('should update next on LOAD_TRAININGS', () => {
      const action = {
        type: LOAD_TRAININGS,
        payload: { trainings: [], next: 'page2' },
      };
      const state = catalog(undefined, action);

      expect(state.next).toBe('page2');
    });

    it('should update next on PAGINATE_TRAININGS', () => {
      // First load some trainings
      const loadAction = {
        type: LOAD_TRAININGS,
        payload: { trainings: [{ id: 'course:1' }], next: 'page2' },
      };
      let state = catalog(undefined, loadAction);

      // Then paginate
      const paginateAction = {
        type: PAGINATE_TRAININGS,
        payload: { trainings: [], next: 'page3' },
      };
      state = catalog(state, paginateAction);

      expect(state.next).toBe('page3');
    });

    it('should reset next on filter update', () => {
      const loadAction = {
        type: LOAD_TRAININGS,
        payload: { trainings: [], next: 'page2' },
      };
      let state = catalog(undefined, loadAction);

      const filterAction = {
        type: UPDATE_LEARNERSTATE_FILTERS,
        payload: 'enrolled',
      };
      state = catalog(state, filterAction);

      expect(state.next).toBe('');
    });

    it('should reset next on search text update', () => {
      const loadAction = {
        type: LOAD_TRAININGS,
        payload: { trainings: [], next: 'page2' },
      };
      let state = catalog(undefined, loadAction);

      const searchAction = {
        type: UPDATE_SEARCH_TEXT,
        payload: { query: 'test' },
      };
      state = catalog(state, searchAction);

      expect(state.next).toBe('');
    });
  });

  // ==========================================
  // UserSkills Reducer
  // ==========================================

  describe('userSkills reducer', () => {
    it('should load user skills on LOAD_USER_SKILLS', () => {
      const skills = { 'skill:1': true, 'skill:2': true };
      const action = {
        type: LOAD_USER_SKILLS,
        payload: skills,
      };
      const state = catalog(undefined, action);

      expect(state.userSkills).toEqual(skills);
    });

    it('should default to empty object', () => {
      const state = catalog(undefined, { type: '@@INIT' });
      expect(state.userSkills).toEqual({});
    });
  });

  // ==========================================
  // SelectedCatalogs Reducer
  // ==========================================

  describe('selectedCatalogs reducer', () => {
    it('should merge new catalogs with existing', () => {
      const initialCatalogs = {
        'catalog:1': { id: 'catalog:1', name: 'Catalog 1' },
      };
      const newCatalogs = {
        'catalog:2': { id: 'catalog:2', name: 'Catalog 2' },
      };

      const setAction = {
        type: UPDATE_SELECTED_CATALOGS,
        payload: initialCatalogs,
      };
      let state = catalog(undefined, setAction);

      const updateAction = {
        type: UPDATE_SELECTED_CATALOGS,
        payload: newCatalogs,
      };
      state = catalog(state, updateAction);

      expect(state.selectedCatalogs).toHaveProperty('catalog:1');
      expect(state.selectedCatalogs).toHaveProperty('catalog:2');
    });

    it('should clear selected catalogs on CLEAR_ALL', () => {
      const catalogs = {
        'catalog:1': { id: 'catalog:1', name: 'Catalog 1' },
      };
      const setAction = {
        type: UPDATE_SELECTED_CATALOGS,
        payload: catalogs,
      };
      let state = catalog(undefined, setAction);

      const clearAction = {
        type: CLEAR_ALL,
      };
      state = catalog(state, clearAction);

      expect(state.selectedCatalogs).toEqual({});
    });
  });

  // ==========================================
  // ShowFilterLists Reducer
  // ==========================================

  describe('showFilterLists reducer', () => {
    it('should update show filter lists on UPDATE_SHOW_FILTER_LISTS', () => {
      const action = {
        type: UPDATE_SHOW_FILTER_LISTS,
        payload: 'expanded',
      };
      const state = catalog(undefined, action);

      expect(state.filterState.showFilterLists).toBe('expanded');
    });

    it('should default to ALL', () => {
      const state = catalog(undefined, { type: '@@INIT' });
      expect(state.filterState.showFilterLists).toBe(ALL);
    });

    it('should use ALL if payload is empty', () => {
      const action = {
        type: UPDATE_SHOW_FILTER_LISTS,
        payload: '',
      };
      const state = catalog(undefined, action);

      expect(state.filterState.showFilterLists).toBe(ALL);
    });
  });

  // ==========================================
  // UPDATE_ALL_FILTERS
  // ==========================================

  describe('UPDATE_ALL_FILTERS action', () => {
    it('should update all filters at once', () => {
      const allFilters = {
        skillName: { JavaScript: true },
        tagName: { beginner: true },
        loTypes: 'course',
        learnerState: 'enrolled',
        loFormat: 'self',
        duration: '0-1800',
        skillLevel: '1',
        catalogs: 'catalog:1',
        price: 'free',
        priceRange: '0-100',
        cities: 'New York',
        products: 'product1',
        roles: 'developer',
        levels: 'intermediate',
        announcedGroups: 'group1',
        autoCorrectMode: 'false',
      };

      const action = {
        type: UPDATE_ALL_FILTERS,
        payload: allFilters,
      };
      const state = catalog(undefined, action);

      expect(state.filterState.skillName).toEqual(allFilters.skillName);
      expect(state.filterState.tagName).toEqual(allFilters.tagName);
      expect(state.filterState.loTypes).toBe(allFilters.loTypes);
      expect(state.filterState.learnerState).toBe(allFilters.learnerState);
      expect(state.autoCorrectMode).toBe(false);
    });
  });
});
