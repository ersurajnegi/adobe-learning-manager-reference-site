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
 * Unit tests for post.ts reducer
 * Tests Redux reducer for create post state management
 */

import post from '@almLib/store/reducers/post';
import {
  DISMISS_PANEL,
  SELECT_BOARD,
  SET_BOARD_FROM_DETAILS,
  CLEAR_SELECT_BOARD,
  CLOSE_CREATE_POST,
  NAVIGATE_TO,
  OPEN_BOARDS_SELECTION,
  CLOSE_BOARDS_SELECTION,
  SET_CREATEPOST_SOCIAL_SEARCH_RESULTS,
  PAGINATE_SOCIAL_SEARCH_BOARDS,
  CLEAR_SOCIAL_SEARCH_RESULTS,
  PAGINATION_START_SOCIAL_SEARCH_BOARDS,
  SET_POST_TYPE,
  SET_CONTENT_TYPE,
  REMOVE_CONTENT,
  SET_POST_TEXT,
  UPDATE_CREATEPOST_PREVIEW_DATA,
} from '@almLib/store/actions/social/actionTypes';
import { PrimeSearchResult, PrimePostMetaData } from '@models/PrimeModels';

describe('post reducer', () => {
  const initialState = post(undefined, { type: '@@INIT' });

  // ==========================================
  // Initial State
  // ==========================================

  it('should return initial state', () => {
    expect(initialState.boardId).toBe('');
    expect(initialState.boardName).toBe('');
    expect(initialState.boardSkill).toBe('');
    expect(initialState.isBoardFixed).toBe(false);
    expect(initialState.boardSelectionOpen).toBe(false);
    expect(initialState.attributes.postingType).toBe('DEFAULT');
    expect(initialState.attributes.state).toBe('ACTIVE');
    expect(initialState.attributes.text).toBe('');
    expect(initialState.attributes.resource.contentType).toBeNull();
    expect(initialState.attributes.resource.data).toBe('');
  });

  // ==========================================
  // Board Selection Reducers
  // ==========================================

  describe('board selection reducers', () => {
    it('should select board on SELECT_BOARD', () => {
      const action = {
        type: SELECT_BOARD,
        id: 'board:1',
        name: 'JavaScript Board',
        skill: 'skill:js',
      };
      const state = post(undefined, action);

      expect(state.boardId).toBe('board:1');
      expect(state.boardName).toBe('JavaScript Board');
      expect(state.boardSkill).toBe('skill:js');
      expect(state.isBoardFixed).toBe(false);
    });

    it('should set board from details on SET_BOARD_FROM_DETAILS', () => {
      const action = {
        type: SET_BOARD_FROM_DETAILS,
        id: 'board:2',
        name: 'React Board',
        skill: 'skill:react',
      };
      const state = post(undefined, action);

      expect(state.boardId).toBe('board:2');
      expect(state.boardName).toBe('React Board');
      expect(state.boardSkill).toBe('skill:react');
      expect(state.isBoardFixed).toBe(true);
    });

    it('should clear board selection on CLEAR_SELECT_BOARD', () => {
      let state = post(undefined, {
        type: SELECT_BOARD,
        id: 'board:1',
        name: 'Test Board',
        skill: 'skill:test',
      });

      state = post(state, { type: CLEAR_SELECT_BOARD });

      expect(state.boardId).toBeNull();
      expect(state.boardName).toBeNull();
      expect(state.boardSkill).toBeNull();
      expect(state.isBoardFixed).toBe(false);
    });

    it('should clear board on CLOSE_CREATE_POST', () => {
      let state = post(undefined, {
        type: SELECT_BOARD,
        id: 'board:1',
        name: 'Test Board',
        skill: 'skill:test',
      });

      state = post(state, { type: CLOSE_CREATE_POST });

      expect(state.boardId).toBeNull();
      expect(state.boardName).toBeNull();
      expect(state.boardSkill).toBeNull();
    });

    it('should clear board on NAVIGATE_TO', () => {
      let state = post(undefined, {
        type: SELECT_BOARD,
        id: 'board:1',
        name: 'Test Board',
        skill: 'skill:test',
      });

      state = post(state, { type: NAVIGATE_TO });

      expect(state.boardId).toBeNull();
      expect(state.boardName).toBeNull();
      expect(state.boardSkill).toBeNull();
    });
  });

  // ==========================================
  // Board Selection Open Reducer
  // ==========================================

  describe('boardSelectionOpen reducer', () => {
    it('should open board selection on OPEN_BOARDS_SELECTION', () => {
      const state = post(undefined, { type: OPEN_BOARDS_SELECTION });
      expect(state.boardSelectionOpen).toBe(true);
    });

    it('should close board selection on CLOSE_BOARDS_SELECTION', () => {
      let state = post(undefined, { type: OPEN_BOARDS_SELECTION });
      state = post(state, { type: CLOSE_BOARDS_SELECTION });
      expect(state.boardSelectionOpen).toBe(false);
    });

    it('should close board selection on DISMISS_PANEL', () => {
      let state = post(undefined, { type: OPEN_BOARDS_SELECTION });
      state = post(state, { type: DISMISS_PANEL });
      expect(state.boardSelectionOpen).toBe(false);
    });

    it('should close board selection on CLOSE_CREATE_POST', () => {
      let state = post(undefined, { type: OPEN_BOARDS_SELECTION });
      state = post(state, { type: CLOSE_CREATE_POST });
      expect(state.boardSelectionOpen).toBe(false);
    });
  });

  // ==========================================
  // Social Search Results Reducers
  // ==========================================

  describe('socialSearchResults reducers', () => {
    it('should set search results', () => {
      const searchBoards: PrimeSearchResult[] = [
        { id: 'board:1', title: 'Board 1' } as PrimeSearchResult,
        { id: 'board:2', title: 'Board 2' } as PrimeSearchResult,
      ];

      const action = {
        type: SET_CREATEPOST_SOCIAL_SEARCH_RESULTS,
        data: searchBoards,
        term: 'javascript',
        next: 'page2',
      };
      const state = post(undefined, action);

      expect(state.socialSearchResults.searchBoards).toEqual(searchBoards);
      expect(state.socialSearchResults.searchTerm).toBe('javascript');
      expect(state.socialSearchResults.searchNext).toBe('page2');
    });

    it('should handle null search term', () => {
      const action = {
        type: SET_CREATEPOST_SOCIAL_SEARCH_RESULTS,
        data: [],
        term: null,
        next: null,
      };
      const state = post(undefined, action);

      expect(state.socialSearchResults.searchTerm).toBeNull();
      expect(state.socialSearchResults.searchNext).toBeNull();
    });

    it('should paginate search boards', () => {
      const initialBoards: PrimeSearchResult[] = [{ id: 'board:1' } as PrimeSearchResult];
      const newBoards: PrimeSearchResult[] = [
        { id: 'board:2' } as PrimeSearchResult,
        { id: 'board:3' } as PrimeSearchResult,
      ];

      let state = post(undefined, {
        type: SET_CREATEPOST_SOCIAL_SEARCH_RESULTS,
        data: initialBoards,
        term: 'test',
        next: 'page2',
      });

      state = post(state, {
        type: PAGINATE_SOCIAL_SEARCH_BOARDS,
        data: newBoards,
        next: 'page3',
      });

      expect(state.socialSearchResults.searchBoards).toHaveLength(3);
      expect(state.socialSearchResults.searchNext).toBe('page3');
    });

    it('should set paginating state', () => {
      // First set some search results
      let state = post(undefined, {
        type: SET_CREATEPOST_SOCIAL_SEARCH_RESULTS,
        data: [],
        term: 'test',
      });

      state = post(state, {
        type: PAGINATION_START_SOCIAL_SEARCH_BOARDS,
      });
      expect(state.socialSearchResults.searchPaginating).toBe(true);

      state = post(state, {
        type: PAGINATE_SOCIAL_SEARCH_BOARDS,
        data: [],
        next: null,
      });
      expect(state.socialSearchResults.searchPaginating).toBe(false);
    });

    it('should clear search results on CLEAR_SOCIAL_SEARCH_RESULTS', () => {
      let state = post(undefined, {
        type: SET_CREATEPOST_SOCIAL_SEARCH_RESULTS,
        data: [{ id: 'board:1' }],
        term: 'test',
        next: 'page2',
      });

      state = post(state, { type: CLEAR_SOCIAL_SEARCH_RESULTS });

      expect(state.socialSearchResults.searchBoards).toBeNull();
      expect(state.socialSearchResults.searchTerm).toBe('');
      expect(state.socialSearchResults.searchNext).toBe('');
    });

    it('should clear search results on DISMISS_PANEL', () => {
      let state = post(undefined, {
        type: SET_CREATEPOST_SOCIAL_SEARCH_RESULTS,
        data: [{ id: 'board:1' }],
        term: 'test',
      });

      state = post(state, { type: DISMISS_PANEL });

      expect(state.socialSearchResults.searchBoards).toBeNull();
      expect(state.socialSearchResults.searchTerm).toBe('');
    });

    it('should clear search results on CLOSE_CREATE_POST', () => {
      let state = post(undefined, {
        type: SET_CREATEPOST_SOCIAL_SEARCH_RESULTS,
        data: [{ id: 'board:1' }],
        term: 'test',
      });

      state = post(state, { type: CLOSE_CREATE_POST });

      expect(state.socialSearchResults.searchBoards).toBeNull();
      expect(state.socialSearchResults.searchTerm).toBe('');
      expect(state.socialSearchResults.searchPaginating).toBe(false);
    });
  });

  // ==========================================
  // Posting Type Reducer
  // ==========================================

  describe('postingType reducer', () => {
    it('should set posting type on SET_POST_TYPE', () => {
      const state = post(undefined, {
        type: SET_POST_TYPE,
        value: 'QUESTION',
      });
      expect(state.attributes.postingType).toBe('QUESTION');
    });

    it('should set POLL posting type', () => {
      const state = post(undefined, {
        type: SET_POST_TYPE,
        value: 'POLL',
      });
      expect(state.attributes.postingType).toBe('POLL');
    });

    it('should reset to DEFAULT on SET_CONTENT_TYPE', () => {
      let state = post(undefined, {
        type: SET_POST_TYPE,
        value: 'QUESTION',
      });

      state = post(state, {
        type: SET_CONTENT_TYPE,
        contentType: 'VIDEO',
        data: 'video-url',
      });

      expect(state.attributes.postingType).toBe('DEFAULT');
    });

    it('should reset to DEFAULT on CLOSE_CREATE_POST', () => {
      let state = post(undefined, {
        type: SET_POST_TYPE,
        value: 'QUESTION',
      });

      state = post(state, { type: CLOSE_CREATE_POST });

      expect(state.attributes.postingType).toBe('DEFAULT');
    });
  });

  // ==========================================
  // Resource (Content) Reducer
  // ==========================================

  describe('resource reducer', () => {
    it('should set content type and data on SET_CONTENT_TYPE', () => {
      const state = post(undefined, {
        type: SET_CONTENT_TYPE,
        contentType: 'VIDEO',
        data: 'https://youtube.com/video',
      });

      expect(state.attributes.resource.contentType).toBe('VIDEO');
      expect(state.attributes.resource.data).toBe('https://youtube.com/video');
    });

    it('should set IMAGE content', () => {
      const state = post(undefined, {
        type: SET_CONTENT_TYPE,
        contentType: 'IMAGE',
        data: 'https://example.com/image.jpg',
      });

      expect(state.attributes.resource.contentType).toBe('IMAGE');
      expect(state.attributes.resource.data).toBe('https://example.com/image.jpg');
    });

    it('should set URL content', () => {
      const state = post(undefined, {
        type: SET_CONTENT_TYPE,
        contentType: 'URL',
        data: 'https://example.com',
      });

      expect(state.attributes.resource.contentType).toBe('URL');
      expect(state.attributes.resource.data).toBe('https://example.com');
    });

    it('should remove content on REMOVE_CONTENT', () => {
      let state = post(undefined, {
        type: SET_CONTENT_TYPE,
        contentType: 'VIDEO',
        data: 'video-url',
      });

      state = post(state, { type: REMOVE_CONTENT });

      expect(state.attributes.resource.contentType).toBeNull();
      expect(state.attributes.resource.data).toBeNull();
    });

    it('should clear content on CLOSE_CREATE_POST', () => {
      let state = post(undefined, {
        type: SET_CONTENT_TYPE,
        contentType: 'IMAGE',
        data: 'image-url',
      });

      state = post(state, { type: CLOSE_CREATE_POST });

      expect(state.attributes.resource.contentType).toBeNull();
      expect(state.attributes.resource.data).toBeNull();
    });

    it('should clear content on NAVIGATE_TO', () => {
      let state = post(undefined, {
        type: SET_CONTENT_TYPE,
        contentType: 'FILE',
        data: 'file-url',
      });

      state = post(state, { type: NAVIGATE_TO });

      expect(state.attributes.resource.contentType).toBeNull();
      expect(state.attributes.resource.data).toBeNull();
    });
  });

  // ==========================================
  // State Reducer (always ACTIVE)
  // ==========================================

  describe('state reducer', () => {
    it('should always return ACTIVE', () => {
      const state = post(undefined, { type: '@@INIT' });
      expect(state.attributes.state).toBe('ACTIVE');
    });

    it('should maintain ACTIVE state across actions', () => {
      let state = post(undefined, { type: SET_POST_TEXT, text: 'test' });
      expect(state.attributes.state).toBe('ACTIVE');

      state = post(state, {
        type: SELECT_BOARD,
        id: 'board:1',
        name: 'Test Board',
        skill: 'skill:1',
      });
      expect(state.attributes.state).toBe('ACTIVE');

      state = post(state, { type: CLOSE_CREATE_POST });
      expect(state.attributes.state).toBe('ACTIVE');
    });
  });

  // ==========================================
  // Text Reducer
  // ==========================================

  describe('text reducer', () => {
    it('should set post text on SET_POST_TEXT', () => {
      const state = post(undefined, {
        type: SET_POST_TEXT,
        text: 'This is my post content',
      });

      expect(state.attributes.text).toBe('This is my post content');
    });

    it('should handle empty text', () => {
      const state = post(undefined, {
        type: SET_POST_TEXT,
        text: '',
      });

      expect(state.attributes.text).toBe('');
    });

    it('should handle null text', () => {
      const state = post(undefined, {
        type: SET_POST_TEXT,
        text: null,
      });

      expect(state.attributes.text).toBe('');
    });

    it('should clear text on CLOSE_CREATE_POST', () => {
      let state = post(undefined, {
        type: SET_POST_TEXT,
        text: 'Some text',
      });

      state = post(state, { type: CLOSE_CREATE_POST });

      expect(state.attributes.text).toBeNull();
    });

    it('should clear text on NAVIGATE_TO', () => {
      let state = post(undefined, {
        type: SET_POST_TEXT,
        text: 'Some text',
      });

      state = post(state, { type: NAVIGATE_TO });

      expect(state.attributes.text).toBeNull();
    });
  });

  // ==========================================
  // Preview Data Reducer
  // ==========================================

  describe('previewData reducer', () => {
    it('should update preview data on UPDATE_CREATEPOST_PREVIEW_DATA', () => {
      const previewData: PrimePostMetaData = {
        title: 'Preview Title',
        description: 'Preview Description',
        thumbnailUrl: 'https://example.com/thumb.jpg',
      } as PrimePostMetaData;

      const state = post(undefined, {
        type: UPDATE_CREATEPOST_PREVIEW_DATA,
        data: previewData,
      });

      expect(state.previewData).toEqual(previewData);
    });

    it('should clear preview data on CLOSE_CREATE_POST', () => {
      const previewData: PrimePostMetaData = {
        title: 'Preview Title',
      } as PrimePostMetaData;

      let state = post(undefined, {
        type: UPDATE_CREATEPOST_PREVIEW_DATA,
        data: previewData,
      });

      state = post(state, { type: CLOSE_CREATE_POST });

      expect(state.previewData).toBeNull();
    });

    it('should return null for initial state', () => {
      const state = post(undefined, { type: '@@INIT' });
      expect(state.previewData).toBeNull();
    });
  });

  // ==========================================
  // Integration Tests
  // ==========================================

  describe('integration tests', () => {
    it('should handle complete post creation flow', () => {
      // Select board
      let state = post(undefined, {
        type: SELECT_BOARD,
        id: 'board:1',
        name: 'JavaScript Board',
        skill: 'skill:js',
      });

      expect(state.boardId).toBe('board:1');
      expect(state.isBoardFixed).toBe(false);

      // Set post type
      state = post(state, {
        type: SET_POST_TYPE,
        value: 'QUESTION',
      });

      expect(state.attributes.postingType).toBe('QUESTION');

      // Add text
      state = post(state, {
        type: SET_POST_TEXT,
        text: 'How do I use async/await?',
      });

      expect(state.attributes.text).toBe('How do I use async/await?');

      // Add content
      state = post(state, {
        type: SET_CONTENT_TYPE,
        contentType: 'URL',
        data: 'https://stackoverflow.com/question',
      });

      expect(state.attributes.resource.contentType).toBe('URL');
      expect(state.attributes.resource.data).toBe('https://stackoverflow.com/question');
      expect(state.attributes.postingType).toBe('DEFAULT'); // Reset when content added

      // Add preview data
      state = post(state, {
        type: UPDATE_CREATEPOST_PREVIEW_DATA,
        data: { title: 'Stack Overflow Question' } as PrimePostMetaData,
      });

      expect(state.previewData?.title).toBe('Stack Overflow Question');

      // Close post
      state = post(state, { type: CLOSE_CREATE_POST });

      expect(state.boardId).toBeNull();
      expect(state.attributes.text).toBeNull();
      expect(state.attributes.resource.contentType).toBeNull();
      expect(state.previewData).toBeNull();
    });

    it('should handle board search flow', () => {
      // Open board selection
      let state = post(undefined, { type: OPEN_BOARDS_SELECTION });
      expect(state.boardSelectionOpen).toBe(true);

      // Search for boards
      state = post(state, {
        type: SET_CREATEPOST_SOCIAL_SEARCH_RESULTS,
        data: [{ id: 'board:1', title: 'Board 1' } as PrimeSearchResult],
        term: 'javascript',
        next: 'page2',
      });

      expect(state.socialSearchResults.searchBoards).toHaveLength(1);
      expect(state.socialSearchResults.searchTerm).toBe('javascript');

      // Paginate
      state = post(state, {
        type: PAGINATION_START_SOCIAL_SEARCH_BOARDS,
      });
      expect(state.socialSearchResults.searchPaginating).toBe(true);

      state = post(state, {
        type: PAGINATE_SOCIAL_SEARCH_BOARDS,
        data: [{ id: 'board:2', title: 'Board 2' } as PrimeSearchResult],
        next: null,
      });

      expect(state.socialSearchResults.searchBoards).toHaveLength(2);
      expect(state.socialSearchResults.searchPaginating).toBe(false);

      // Select a board
      state = post(state, {
        type: SELECT_BOARD,
        id: 'board:1',
        name: 'Board 1',
        skill: 'skill:1',
      });

      expect(state.boardId).toBe('board:1');

      // Close board selection
      state = post(state, { type: CLOSE_BOARDS_SELECTION });
      expect(state.boardSelectionOpen).toBe(false);
    });
  });
});
