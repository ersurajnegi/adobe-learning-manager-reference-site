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
 * Unit tests for social.ts reducer
 * Tests Redux reducers for social features (boards, posts, comments, replies)
 */

import social, {
  SocialState,
  SelectedBoardState,
  BoardState,
  BoardOptions,
  PostOptions,
  CommentOptions,
  ReplyOptions,
} from '@almLib/store/reducers/social';
import {
  LOAD_SOCIAL_BOARD,
  LOAD_SOCIAL_BOARDS,
  CHANGE_SOCIAL_TAB,
  PAGINATE_SOCIAL_BOARDS,
  OPEN_BOARD_OPTIONS,
  CLOSE_BOARD_OPTIONS,
  DISMISS_PANEL,
  SET_SELECTED_BOARD,
  SOCIAL_ADD_BOARD_FAVORITE_SUCCESS,
  SOCIAL_REMOVE_BOARD_FAVORITE_SUCCESS,
  SOCIAL_REMOVE_BOARD_FROM_LIST,
  SOCIAL_BOARD_DELETE_SUCCESS,
  LOAD_BOARD_DETAILS,
  PAGINATE_SOCIAL_BOARD_POSTS,
  PAGINATION_START_SOCIAL_BOARD_POSTS,
  OPEN_POST_OPTIONS,
  SHOW_CONFIRMATION_DIALOG,
  HIDE_CONFIRMATION_DIALOG,
  SET_SELECTED_POST,
  ADD_USER_POLL_FOR_POST,
  UPDATE_POST,
  SOCIAL_POST_DELETE_SUCCESS,
  UPDATE_POST_PREVIEW_DATA,
  LOAD_COMMENTS,
  PAGINATE_COMMENTS,
  PAGINATION_START_COMMENTS,
  SET_SELECTED_COMMENT,
  UPDATE_COMMENT,
  SOCIAL_CMT_DELETE_SUCCESS,
  UPDATE_CMT_PREVIEW_DATA,
  OPEN_CMT_OPTIONS,
  LOAD_REPLIES,
  PAGINATE_REPLIES,
  PAGINATION_START_REPLIES,
  UPDATE_REPLY,
  SOCIAL_REPLY_DELETE_SUCCESS,
  UPDATE_REPLY_PREVIEW_DATA,
  OPEN_REPLY_OPTIONS,
  LOAD_FAV_BOARDS,
} from '@almLib/store/actions/social/actionTypes';
import { PrimeBoard, PrimePost, PrimeComment, PrimeReply } from '@models/PrimeModels';

describe('social reducer', () => {
  // ==========================================
  // Initial State
  // ==========================================

  it('should return initial state', () => {
    const state = social(undefined, { type: '@@INIT' });

    expect(state.selectedTab).toBe('MyBoards');
    expect(state.boards.items).toBeNull();
    expect(state.boards.next).toBeNull();
    expect(state.posts.items).toEqual([]);
    expect(state.posts.paginating).toBe(false);
    expect(state.posts.next).toBeNull();
    expect(state.boardOptions.open).toBe(false);
    expect(state.boardOptions.id).toBe('');
    expect(state.postOptions.open).toBe(false);
    expect(state.postOptions.id).toBe('');
    expect(state.commentOptions.open).toBe(false);
    expect(state.commentOptions.id).toBe('');
    expect(state.replyOptions.open).toBe(false);
    expect(state.replyOptions.id).toBe('');
    expect(state.userFavBoards).toEqual([]);
  });

  // ==========================================
  // Selected Tab Reducer
  // ==========================================

  describe('selectedTab reducer', () => {
    it('should set tab from LOAD_SOCIAL_BOARDS action', () => {
      const action = {
        type: LOAD_SOCIAL_BOARDS,
        socialTab: 'AllBoards',
        payload: { items: [], next: null },
      };
      const state = social(undefined, action);

      expect(state.selectedTab).toBe('AllBoards');
    });

    it('should default to MyBoards if socialTab not provided in LOAD_SOCIAL_BOARDS', () => {
      const action = {
        type: LOAD_SOCIAL_BOARDS,
        payload: { items: [], next: null },
      };
      const state = social(undefined, action);

      expect(state.selectedTab).toBe('MyBoards');
    });

    it('should change tab on CHANGE_SOCIAL_TAB', () => {
      const action = {
        type: CHANGE_SOCIAL_TAB,
        socialTab: 'FavoriteBoards',
      };
      const state = social(undefined, action);

      expect(state.selectedTab).toBe('FavoriteBoards');
    });
  });

  // ==========================================
  // Board Item Reducer (single board)
  // ==========================================

  describe('board.item reducer', () => {
    it('should load board on LOAD_SOCIAL_BOARD', () => {
      const board: PrimeBoard = {
        id: 'board:123',
        name: 'Test Board',
        isFavorite: false,
      } as PrimeBoard;

      const action = {
        type: LOAD_SOCIAL_BOARD,
        payload: { item: board },
      };
      const state = social(undefined, action);

      expect(state.board.item).toEqual(board);
    });

    it('should mark board as favorite on SOCIAL_ADD_BOARD_FAVORITE_SUCCESS', () => {
      const board: PrimeBoard = {
        id: 'board:123',
        name: 'Test Board',
        isFavorite: false,
      } as PrimeBoard;

      const loadAction = {
        type: LOAD_SOCIAL_BOARD,
        payload: { item: board },
      };
      let state = social(undefined, loadAction);

      const favoriteAction = {
        type: SOCIAL_ADD_BOARD_FAVORITE_SUCCESS,
        payload: { id: 'board:123' },
      };
      state = social(state, favoriteAction);

      expect(state.board.item.isFavorite).toBe(true);
    });

    it('should remove board favorite on SOCIAL_REMOVE_BOARD_FAVORITE_SUCCESS', () => {
      const board: PrimeBoard = {
        id: 'board:123',
        name: 'Test Board',
        isFavorite: true,
      } as PrimeBoard;

      const loadAction = {
        type: LOAD_SOCIAL_BOARD,
        payload: { item: board },
      };
      let state = social(undefined, loadAction);

      const removeFavoriteAction = {
        type: SOCIAL_REMOVE_BOARD_FAVORITE_SUCCESS,
        payload: { id: 'board:123' },
      };
      state = social(state, removeFavoriteAction);

      expect(state.board.item.isFavorite).toBe(false);
    });

    it('should return null if no board loaded', () => {
      const state = social(undefined, { type: '@@INIT' });

      expect(state.board.item).toBeNull();
    });
  });

  // ==========================================
  // Boards Items Reducer (list)
  // ==========================================

  describe('boards.items reducer', () => {
    it('should load boards on LOAD_SOCIAL_BOARDS', () => {
      const boards: PrimeBoard[] = [
        { id: 'board:1', name: 'Board 1' } as PrimeBoard,
        { id: 'board:2', name: 'Board 2' } as PrimeBoard,
      ];

      const action = {
        type: LOAD_SOCIAL_BOARDS,
        payload: { items: boards, next: null },
      };
      const state = social(undefined, action);

      expect(state.boards.items).toEqual(boards);
    });

    it('should return empty array if no boards in LOAD_SOCIAL_BOARDS', () => {
      const action = {
        type: LOAD_SOCIAL_BOARDS,
        payload: { items: null, next: null },
      };
      const state = social(undefined, action);

      expect(state.boards.items).toEqual([]);
    });

    it('should reset boards on CHANGE_SOCIAL_TAB', () => {
      const boards: PrimeBoard[] = [{ id: 'board:1', name: 'Board 1' } as PrimeBoard];

      const loadAction = {
        type: LOAD_SOCIAL_BOARDS,
        payload: { items: boards, next: null },
      };
      let state = social(undefined, loadAction);

      const changeTabAction = {
        type: CHANGE_SOCIAL_TAB,
        socialTab: 'AllBoards',
      };
      state = social(state, changeTabAction);

      expect(state.boards.items).toBeNull();
    });

    it('should paginate boards on PAGINATE_SOCIAL_BOARDS', () => {
      const initialBoards: PrimeBoard[] = [{ id: 'board:1', name: 'Board 1' } as PrimeBoard];
      const newBoards: PrimeBoard[] = [{ id: 'board:2', name: 'Board 2' } as PrimeBoard];

      const loadAction = {
        type: LOAD_SOCIAL_BOARDS,
        payload: { items: initialBoards, next: 'page2' },
      };
      let state = social(undefined, loadAction);

      const paginateAction = {
        type: PAGINATE_SOCIAL_BOARDS,
        payload: { items: newBoards, next: null },
      };
      state = social(state, paginateAction);

      expect(state.boards.items).toHaveLength(2);
      expect(state.boards.items[0].id).toBe('board:1');
      expect(state.boards.items[1].id).toBe('board:2');
    });

    it('should mark board as favorite in list', () => {
      const boards: PrimeBoard[] = [
        { id: 'board:1', name: 'Board 1', isFavorite: false } as PrimeBoard,
        { id: 'board:2', name: 'Board 2', isFavorite: false } as PrimeBoard,
      ];

      const loadAction = {
        type: LOAD_SOCIAL_BOARDS,
        payload: { items: boards, next: null },
      };
      let state = social(undefined, loadAction);

      const favoriteAction = {
        type: SOCIAL_ADD_BOARD_FAVORITE_SUCCESS,
        payload: { id: 'board:1' },
      };
      state = social(state, favoriteAction);

      expect(state.boards.items[0].isFavorite).toBe(true);
      expect(state.boards.items[1].isFavorite).toBe(false);
    });

    it('should remove board favorite from list', () => {
      const boards: PrimeBoard[] = [
        { id: 'board:1', name: 'Board 1', isFavorite: true } as PrimeBoard,
      ];

      const loadAction = {
        type: LOAD_SOCIAL_BOARDS,
        payload: { items: boards, next: null },
      };
      let state = social(undefined, loadAction);

      const removeFavoriteAction = {
        type: SOCIAL_REMOVE_BOARD_FAVORITE_SUCCESS,
        payload: { id: 'board:1' },
      };
      state = social(state, removeFavoriteAction);

      expect(state.boards.items[0].isFavorite).toBe(false);
    });

    it('should handle favorite actions when boards list is empty', () => {
      const loadAction = {
        type: LOAD_SOCIAL_BOARDS,
        payload: { items: [], next: null },
      };
      let state = social(undefined, loadAction);

      const favoriteAction = {
        type: SOCIAL_ADD_BOARD_FAVORITE_SUCCESS,
        payload: { id: 'board:1' },
      };
      state = social(state, favoriteAction);

      expect(state.boards.items).toEqual([]);
    });

    it('should remove board from list on SOCIAL_REMOVE_BOARD_FROM_LIST', () => {
      const boards: PrimeBoard[] = [
        { id: 'board:1', name: 'Board 1' } as PrimeBoard,
        { id: 'board:2', name: 'Board 2' } as PrimeBoard,
      ];

      const loadAction = {
        type: LOAD_SOCIAL_BOARDS,
        payload: { items: boards, next: null },
      };
      let state = social(undefined, loadAction);

      const removeAction = {
        type: SOCIAL_REMOVE_BOARD_FROM_LIST,
        payload: { id: 'board:1' },
      };
      state = social(state, removeAction);

      expect(state.boards.items).toHaveLength(1);
      expect(state.boards.items[0].id).toBe('board:2');
    });

    it('should delete board on SOCIAL_BOARD_DELETE_SUCCESS', () => {
      const boards: PrimeBoard[] = [
        { id: 'board:1', name: 'Board 1' } as PrimeBoard,
        { id: 'board:2', name: 'Board 2' } as PrimeBoard,
      ];

      const loadAction = {
        type: LOAD_SOCIAL_BOARDS,
        payload: { items: boards, next: null },
      };
      let state = social(undefined, loadAction);

      const deleteAction = {
        type: SOCIAL_BOARD_DELETE_SUCCESS,
        payload: { id: 'board:1' },
      };
      state = social(state, deleteAction);

      expect(state.boards.items).toHaveLength(1);
      expect(state.boards.items[0].id).toBe('board:2');
    });
  });

  // ==========================================
  // Boards Next Reducer
  // ==========================================

  describe('boards.next reducer', () => {
    it('should set next on LOAD_SOCIAL_BOARDS', () => {
      const action = {
        type: LOAD_SOCIAL_BOARDS,
        payload: { items: [], next: 'page2' },
      };
      const state = social(undefined, action);

      expect(state.boards.next).toBe('page2');
    });

    it('should update next on PAGINATE_SOCIAL_BOARDS', () => {
      const loadAction = {
        type: LOAD_SOCIAL_BOARDS,
        payload: { items: [], next: 'page2' },
      };
      let state = social(undefined, loadAction);

      const paginateAction = {
        type: PAGINATE_SOCIAL_BOARDS,
        payload: { items: [], next: 'page3' },
      };
      state = social(state, paginateAction);

      expect(state.boards.next).toBe('page3');
    });

    it('should reset next on CHANGE_SOCIAL_TAB', () => {
      const loadAction = {
        type: LOAD_SOCIAL_BOARDS,
        payload: { items: [], next: 'page2' },
      };
      let state = social(undefined, loadAction);

      const changeTabAction = {
        type: CHANGE_SOCIAL_TAB,
        socialTab: 'AllBoards',
      };
      state = social(state, changeTabAction);

      expect(state.boards.next).toBeNull();
    });
  });

  // ==========================================
  // Board Options Reducer
  // ==========================================

  describe('boardOptions reducer', () => {
    it('should open board options on OPEN_BOARD_OPTIONS', () => {
      const action = {
        type: OPEN_BOARD_OPTIONS,
        boardId: 'board:123',
      };
      const state = social(undefined, action);

      expect(state.boardOptions.open).toBe(true);
      expect(state.boardOptions.id).toBe('board:123');
    });

    it('should close board options on CLOSE_BOARD_OPTIONS', () => {
      const openAction = {
        type: OPEN_BOARD_OPTIONS,
        boardId: 'board:123',
      };
      let state = social(undefined, openAction);

      const closeAction = {
        type: CLOSE_BOARD_OPTIONS,
      };
      state = social(state, closeAction);

      expect(state.boardOptions.open).toBe(false);
      expect(state.boardOptions.id).toBe('');
    });

    it('should close board options on DISMISS_PANEL', () => {
      const openAction = {
        type: OPEN_BOARD_OPTIONS,
        boardId: 'board:123',
      };
      let state = social(undefined, openAction);

      const dismissAction = {
        type: DISMISS_PANEL,
      };
      state = social(state, dismissAction);

      expect(state.boardOptions.open).toBe(false);
      expect(state.boardOptions.id).toBe('');
    });

    it('should close board options on favorite actions', () => {
      const openAction = {
        type: OPEN_BOARD_OPTIONS,
        boardId: 'board:123',
      };
      let state = social(undefined, openAction);

      const favoriteAction = {
        type: SOCIAL_ADD_BOARD_FAVORITE_SUCCESS,
        payload: { id: 'board:123' },
      };
      state = social(state, favoriteAction);

      expect(state.boardOptions.open).toBe(false);
    });

    it('should close board options on SOCIAL_REMOVE_BOARD_FROM_LIST', () => {
      const openAction = {
        type: OPEN_BOARD_OPTIONS,
        boardId: 'board:123',
      };
      let state = social(undefined, openAction);

      const removeAction = {
        type: SOCIAL_REMOVE_BOARD_FROM_LIST,
        payload: { id: 'board:123' },
      };
      state = social(state, removeAction);

      expect(state.boardOptions.open).toBe(false);
    });
  });

  // ==========================================
  // Selected Board Reducer
  // ==========================================

  describe('selectedBoard reducer', () => {
    it('should set selected board on SET_SELECTED_BOARD', () => {
      const board: PrimeBoard = {
        id: 'board:123',
        name: 'Selected Board',
        isFavorite: false,
      } as PrimeBoard;

      const action = {
        type: SET_SELECTED_BOARD,
        board,
      };
      const state = social(undefined, action);

      expect(state.selectedBoard).toEqual(board);
    });

    it('should mark selected board as favorite', () => {
      const board: PrimeBoard = {
        id: 'board:123',
        name: 'Selected Board',
        isFavorite: false,
      } as PrimeBoard;

      const setAction = {
        type: SET_SELECTED_BOARD,
        board,
      };
      let state = social(undefined, setAction);

      const favoriteAction = {
        type: SOCIAL_ADD_BOARD_FAVORITE_SUCCESS,
        payload: { id: 'board:123' },
      };
      state = social(state, favoriteAction);

      expect(state.selectedBoard.isFavorite).toBe(true);
    });

    it('should remove favorite from selected board', () => {
      const board: PrimeBoard = {
        id: 'board:123',
        name: 'Selected Board',
        isFavorite: true,
      } as PrimeBoard;

      const setAction = {
        type: SET_SELECTED_BOARD,
        board,
      };
      let state = social(undefined, setAction);

      const removeFavoriteAction = {
        type: SOCIAL_REMOVE_BOARD_FAVORITE_SUCCESS,
        payload: { id: 'board:123' },
      };
      state = social(state, removeFavoriteAction);

      expect(state.selectedBoard.isFavorite).toBe(false);
    });
  });

  // ==========================================
  // Posts Reducer
  // ==========================================

  describe('posts reducer', () => {
    it('should load posts on LOAD_BOARD_DETAILS', () => {
      const posts: PrimePost[] = [
        { id: 'post:1', text: 'Post 1' } as PrimePost,
        { id: 'post:2', text: 'Post 2' } as PrimePost,
      ];

      const action = {
        type: LOAD_BOARD_DETAILS,
        payload: { items: posts, next: null },
      };
      const state = social(undefined, action);

      expect(state.posts.items).toEqual(posts);
    });

    it('should return empty array if no posts', () => {
      const action = {
        type: LOAD_BOARD_DETAILS,
        payload: { items: null, next: null },
      };
      const state = social(undefined, action);

      expect(state.posts.items).toEqual([]);
    });

    it('should paginate posts on PAGINATE_SOCIAL_BOARD_POSTS', () => {
      const initialPosts: PrimePost[] = [{ id: 'post:1', text: 'Post 1' } as PrimePost];
      const newPosts: PrimePost[] = [{ id: 'post:2', text: 'Post 2' } as PrimePost];

      const loadAction = {
        type: LOAD_BOARD_DETAILS,
        payload: { items: initialPosts, next: 'page2' },
      };
      let state = social(undefined, loadAction);

      const paginateAction = {
        type: PAGINATE_SOCIAL_BOARD_POSTS,
        payload: { items: newPosts, next: null },
      };
      state = social(state, paginateAction);

      expect(state.posts.items).toHaveLength(2);
      expect(state.posts.items[0].id).toBe('post:1');
      expect(state.posts.items[1].id).toBe('post:2');
    });

    it('should update comment count on LOAD_COMMENTS', () => {
      const posts: PrimePost[] = [{ id: 'post:1', text: 'Post 1', commentCount: 0 } as PrimePost];

      const loadAction = {
        type: LOAD_BOARD_DETAILS,
        payload: { items: posts, next: null },
      };
      let state = social(undefined, loadAction);

      const loadCommentsAction = {
        type: LOAD_COMMENTS,
        payload: {
          selectedPostId: 'post:1',
          items: [{}, {}, {}], // 3 comments
          next: null,
        },
      };
      state = social(state, loadCommentsAction);

      expect(state.posts.items[0].commentCount).toBe(3);
    });

    it('should not update comment count if no selectedPostId', () => {
      const posts: PrimePost[] = [{ id: 'post:1', text: 'Post 1', commentCount: 0 } as PrimePost];

      const loadAction = {
        type: LOAD_BOARD_DETAILS,
        payload: { items: posts, next: null },
      };
      let state = social(undefined, loadAction);

      const loadCommentsAction = {
        type: LOAD_COMMENTS,
        payload: {
          selectedPostId: null,
          items: [{}, {}],
          next: null,
        },
      };
      state = social(state, loadCommentsAction);

      expect(state.posts.items[0].commentCount).toBe(0);
    });

    it('should add user poll for post', () => {
      const posts: PrimePost[] = [{ id: 'post:1', text: 'Post 1', userPoll: null } as PrimePost];

      const loadAction = {
        type: LOAD_BOARD_DETAILS,
        payload: { items: posts, next: null },
      };
      let state = social(undefined, loadAction);

      const pollAction = {
        type: ADD_USER_POLL_FOR_POST,
        post: { id: 'post:1' },
        optionId: 'option:123',
      };
      state = social(state, pollAction);

      expect(state.posts.items[0].userPoll).toEqual({ optionId: 'option:123' });
    });

    it('should update post', () => {
      const posts: PrimePost[] = [{ id: 'post:1', text: 'Old Text' } as PrimePost];

      const loadAction = {
        type: LOAD_BOARD_DETAILS,
        payload: { items: posts, next: null },
      };
      let state = social(undefined, loadAction);

      const updateAction = {
        type: UPDATE_POST,
        payload: {
          item: { id: 'post:1', text: 'New Text' } as PrimePost,
        },
      };
      state = social(state, updateAction);

      expect(state.posts.items[0].text).toBe('New Text');
    });

    it('should return empty array when state is null for ADD_USER_POLL_FOR_POST', () => {
      const action = {
        type: ADD_USER_POLL_FOR_POST,
        post: { id: 'post:1' },
        optionId: 'option:1',
      };

      // Starting with state that has null posts items
      const baseState = social(undefined, { type: '@@INIT' });
      const stateWithNullPosts = {
        ...baseState,
        posts: { items: null, next: null, paginating: false },
      };
      const state = social(stateWithNullPosts as any, action);

      expect(state.posts.items).toEqual([]);
    });

    it('should return empty array when state is null for UPDATE_POST', () => {
      const action = {
        type: UPDATE_POST,
        payload: { item: { id: 'post:1', text: 'text' } as PrimePost },
      };

      // Starting with state that has null posts items
      const baseState = social(undefined, { type: '@@INIT' });
      const stateWithNullPosts = {
        ...baseState,
        posts: { items: null, next: null, paginating: false },
      };
      const state = social(stateWithNullPosts as any, action);

      expect(state.posts.items).toEqual([]);
    });

    it('should return empty array when state is null for UPDATE_POST_PREVIEW_DATA', () => {
      const action = {
        type: UPDATE_POST_PREVIEW_DATA,
        payload: { id: 'post:1' },
        data: { title: 'Preview' } as PrimePost,
      };

      // Starting with state that has null posts items
      const baseState = social(undefined, { type: '@@INIT' });
      const stateWithNullPosts = {
        ...baseState,
        posts: { items: null, next: null, paginating: false },
      };
      const state = social(stateWithNullPosts as any, action);

      expect(state.posts.items).toEqual([]);
    });

    it('should delete post on SOCIAL_POST_DELETE_SUCCESS', () => {
      const posts: PrimePost[] = [
        { id: 'post:1', text: 'Post 1' } as PrimePost,
        { id: 'post:2', text: 'Post 2' } as PrimePost,
      ];

      const loadAction = {
        type: LOAD_BOARD_DETAILS,
        payload: { items: posts, next: null },
      };
      let state = social(undefined, loadAction);

      const deleteAction = {
        type: SOCIAL_POST_DELETE_SUCCESS,
        payload: { id: 'post:1' },
      };
      state = social(state, deleteAction);

      expect(state.posts.items).toHaveLength(1);
      expect(state.posts.items[0].id).toBe('post:2');
    });

    it('should update post preview data', () => {
      const posts: PrimePost[] = [{ id: 'post:1', text: 'Post 1', previewData: null } as PrimePost];

      const loadAction = {
        type: LOAD_BOARD_DETAILS,
        payload: { items: posts, next: null },
      };
      let state = social(undefined, loadAction);

      const updatePreviewAction = {
        type: UPDATE_POST_PREVIEW_DATA,
        payload: { id: 'post:1' },
        data: { title: 'Preview Title' },
      };
      state = social(state, updatePreviewAction);

      expect(state.posts.items[0].previewData).toEqual({ title: 'Preview Title' });
    });

    it('should set paginating state', () => {
      const startAction = {
        type: PAGINATION_START_SOCIAL_BOARD_POSTS,
      };
      let state = social(undefined, startAction);

      expect(state.posts.paginating).toBe(true);

      const paginateAction = {
        type: PAGINATE_SOCIAL_BOARD_POSTS,
        payload: { items: [], next: null },
      };
      state = social(state, paginateAction);

      expect(state.posts.paginating).toBe(false);
    });
  });

  // ==========================================
  // Post Options Reducer
  // ==========================================

  describe('postOptions reducer', () => {
    it('should open post options on OPEN_POST_OPTIONS', () => {
      const action = {
        type: OPEN_POST_OPTIONS,
        payload: { id: 'post:123' },
      };
      const state = social(undefined, action);

      expect(state.postOptions.open).toBe(true);
      expect(state.postOptions.id).toBe('post:123');
    });

    it('should close post options on DISMISS_PANEL', () => {
      const openAction = {
        type: OPEN_POST_OPTIONS,
        payload: { id: 'post:123' },
      };
      let state = social(undefined, openAction);

      const dismissAction = {
        type: DISMISS_PANEL,
      };
      state = social(state, dismissAction);

      expect(state.postOptions.open).toBe(false);
      expect(state.postOptions.id).toBe('');
    });

    it('should close post options on SHOW_CONFIRMATION_DIALOG', () => {
      const openAction = {
        type: OPEN_POST_OPTIONS,
        payload: { id: 'post:123' },
      };
      let state = social(undefined, openAction);

      const showDialogAction = {
        type: SHOW_CONFIRMATION_DIALOG,
      };
      state = social(state, showDialogAction);

      expect(state.postOptions.open).toBe(false);
    });

    it('should clear id on HIDE_CONFIRMATION_DIALOG', () => {
      const openAction = {
        type: OPEN_POST_OPTIONS,
        payload: { id: 'post:123' },
      };
      let state = social(undefined, openAction);

      const hideDialogAction = {
        type: HIDE_CONFIRMATION_DIALOG,
      };
      state = social(state, hideDialogAction);

      expect(state.postOptions.id).toBe('');
    });
  });

  // ==========================================
  // Selected Post Reducer
  // ==========================================

  describe('selectedPost reducer', () => {
    it('should set selected post on SET_SELECTED_POST', () => {
      const post: PrimePost = {
        id: 'post:123',
        text: 'Selected Post',
      } as PrimePost;

      const action = {
        type: SET_SELECTED_POST,
        post,
      };
      const state = social(undefined, action);

      expect(state.selectedPost).toEqual(post);
    });

    it('should add user poll to selected post', () => {
      const post: PrimePost = {
        id: 'post:123',
        text: 'Post',
        userPoll: null,
      } as PrimePost;

      const setAction = {
        type: SET_SELECTED_POST,
        post,
      };
      let state = social(undefined, setAction);

      const pollAction = {
        type: ADD_USER_POLL_FOR_POST,
        post: { id: 'post:123' },
        optionId: 'option:456',
      };
      state = social(state, pollAction);

      expect(state.selectedPost.userPoll).toEqual({ optionId: 'option:456' });
    });

    it('should update selected post with preview data', () => {
      const post: PrimePost = {
        id: 'post:123',
        text: 'Post',
        previewData: { title: 'Old Title' },
        attributes: {},
      } as any;

      const setAction = {
        type: SET_SELECTED_POST,
        post,
      };
      let state = social(undefined, setAction);

      const updateAction = {
        type: UPDATE_POST,
        post: {
          id: 'post:123',
          text: 'Updated',
          attributes: {
            previewData: { title: 'New Title' },
          },
        },
      };
      state = social(state, updateAction);

      expect(state.selectedPost.attributes.previewData.title).toBe('New Title');
    });

    it('should update selected post without preview data', () => {
      const post: PrimePost = {
        id: 'post:123',
        text: 'Post',
        previewData: null,
      } as PrimePost;

      const setAction = {
        type: SET_SELECTED_POST,
        post,
      };
      let state = social(undefined, setAction);

      const newPost: PrimePost = {
        id: 'post:123',
        text: 'Updated Post',
      } as PrimePost;

      const updateAction = {
        type: UPDATE_POST,
        post: newPost,
      };
      state = social(state, updateAction);

      expect(state.selectedPost).toEqual(newPost);
    });

    it('should update selected post preview data directly', () => {
      const post: PrimePost = {
        id: 'post:123',
        text: 'Post',
        previewData: null,
      } as PrimePost;

      const setAction = {
        type: SET_SELECTED_POST,
        post,
      };
      let state = social(undefined, setAction);

      const updatePreviewAction = {
        type: UPDATE_POST_PREVIEW_DATA,
        payload: { id: 'post:123' },
        data: { title: 'Direct Update' },
      };
      state = social(state, updatePreviewAction);

      expect(state.selectedPost.previewData).toEqual({ title: 'Direct Update' });
    });

    it('should not update preview data for different post', () => {
      const post: PrimePost = {
        id: 'post:123',
        text: 'Post',
        previewData: null,
      } as PrimePost;

      const setAction = {
        type: SET_SELECTED_POST,
        post,
      };
      let state = social(undefined, setAction);

      const updatePreviewAction = {
        type: UPDATE_POST_PREVIEW_DATA,
        payload: { id: 'post:999' },
        data: { title: 'Other Post' },
      };
      state = social(state, updatePreviewAction);

      expect(state.selectedPost.previewData).toBeNull();
    });
  });

  // ==========================================
  // Comments Reducer
  // ==========================================

  describe('comments reducer', () => {
    it('should load comments for a post', () => {
      const comments: PrimeComment[] = [
        { id: 'comment:1', text: 'Comment 1', parent: { id: 'post:1' } } as PrimeComment,
        { id: 'comment:2', text: 'Comment 2', parent: { id: 'post:1' } } as PrimeComment,
      ];

      const action = {
        type: LOAD_COMMENTS,
        payload: {
          selectedPostId: 'post:1',
          items: comments,
          next: null,
        },
      };
      const state = social(undefined, action);

      expect(state.comments.items).toEqual(comments);
    });

    it('should keep comments from other posts when loading new post comments', () => {
      const initialComments: PrimeComment[] = [
        { id: 'comment:1', text: 'Comment 1', parent: { id: 'post:1' } } as PrimeComment,
        { id: 'comment:2', text: 'Comment 2', parent: { id: 'post:1' } } as PrimeComment,
      ];

      const loadAction1 = {
        type: LOAD_COMMENTS,
        payload: {
          selectedPostId: 'post:1',
          items: initialComments,
          next: null,
        },
      };
      let state = social(undefined, loadAction1);

      expect(state.comments.items).toHaveLength(2);

      const newComments: PrimeComment[] = [
        { id: 'comment:3', text: 'Comment 3', parent: { id: 'post:2' } } as PrimeComment,
        { id: 'comment:4', text: 'Comment 4', parent: { id: 'post:2' } } as PrimeComment,
      ];

      const loadAction2 = {
        type: LOAD_COMMENTS,
        payload: {
          selectedPostId: 'post:2',
          items: newComments,
          next: null,
        },
      };
      state = social(state, loadAction2);

      // Reducer keeps comments from other posts and concatenates new ones
      expect(state.comments.items).toHaveLength(4);
      expect(state.comments.items[0].id).toBe('comment:1');
      expect(state.comments.items[1].id).toBe('comment:2');
      expect(state.comments.items[2].id).toBe('comment:3');
      expect(state.comments.items[3].id).toBe('comment:4');
    });

    it('should paginate comments', () => {
      const initialComments: PrimeComment[] = [
        { id: 'comment:1', text: 'Comment 1', parent: { id: 'post:1' } } as PrimeComment,
      ];
      const newComments: PrimeComment[] = [
        { id: 'comment:2', text: 'Comment 2', parent: { id: 'post:1' } } as PrimeComment,
      ];

      const loadAction = {
        type: LOAD_COMMENTS,
        payload: {
          selectedPostId: 'post:1',
          items: initialComments,
          next: 'page2',
        },
      };
      let state = social(undefined, loadAction);

      const paginateAction = {
        type: PAGINATE_COMMENTS,
        payload: {
          items: newComments,
          next: null,
        },
      };
      state = social(state, paginateAction);

      expect(state.comments.items).toHaveLength(2);
    });

    it('should update reply count on LOAD_REPLIES', () => {
      const comments: PrimeComment[] = [
        {
          id: 'comment:1',
          text: 'Comment 1',
          replyCount: 0,
          parent: { id: 'post:1' },
        } as PrimeComment,
      ];

      const loadCommentsAction = {
        type: LOAD_COMMENTS,
        payload: {
          selectedPostId: 'post:1',
          items: comments,
          next: null,
        },
      };
      let state = social(undefined, loadCommentsAction);

      const loadRepliesAction = {
        type: LOAD_REPLIES,
        payload: {
          selectedCommentId: 'comment:1',
          items: [{}, {}], // 2 replies
          next: null,
        },
      };
      state = social(state, loadRepliesAction);

      expect(state.comments.items[0].replyCount).toBe(2);
    });

    it('should update comment', () => {
      const comments: PrimeComment[] = [
        { id: 'comment:1', text: 'Old Text', parent: { id: 'post:1' } } as PrimeComment,
      ];

      const loadAction = {
        type: LOAD_COMMENTS,
        payload: {
          selectedPostId: 'post:1',
          items: comments,
          next: null,
        },
      };
      let state = social(undefined, loadAction);

      const updateAction = {
        type: UPDATE_COMMENT,
        payload: {
          item: { id: 'comment:1', text: 'New Text', parent: { id: 'post:1' } } as PrimeComment,
        },
      };
      state = social(state, updateAction);

      expect(state.comments.items[0].text).toBe('New Text');
    });

    it('should return empty array when no items in LOAD_COMMENTS', () => {
      const action = {
        type: LOAD_COMMENTS,
        payload: {
          selectedPostId: 'post:1',
          items: null, // No items provided
          next: null,
        },
      };

      const state = social(undefined, action);

      expect(state.comments.items).toEqual([]);
    });

    it('should delete comment on SOCIAL_CMT_DELETE_SUCCESS', () => {
      const comments: PrimeComment[] = [
        { id: 'comment:1', text: 'Comment 1', parent: { id: 'post:1' } } as PrimeComment,
        { id: 'comment:2', text: 'Comment 2', parent: { id: 'post:1' } } as PrimeComment,
      ];

      const loadAction = {
        type: LOAD_COMMENTS,
        payload: {
          selectedPostId: 'post:1',
          items: comments,
          next: null,
        },
      };
      let state = social(undefined, loadAction);

      const deleteAction = {
        type: SOCIAL_CMT_DELETE_SUCCESS,
        payload: { id: 'comment:1' },
      };
      state = social(state, deleteAction);

      expect(state.comments.items).toHaveLength(1);
      expect(state.comments.items[0].id).toBe('comment:2');
    });

    it('should update comment preview data', () => {
      const comments: PrimeComment[] = [
        {
          id: 'comment:1',
          text: 'Comment',
          previewData: null,
          parent: { id: 'post:1' },
        } as PrimeComment,
      ];

      const loadAction = {
        type: LOAD_COMMENTS,
        payload: {
          selectedPostId: 'post:1',
          items: comments,
          next: null,
        },
      };
      let state = social(undefined, loadAction);

      const updatePreviewAction = {
        type: UPDATE_CMT_PREVIEW_DATA,
        payload: { id: 'comment:1' },
        data: { title: 'Comment Preview' },
      };
      state = social(state, updatePreviewAction);

      expect(state.comments.items[0].previewData).toEqual({ title: 'Comment Preview' });
    });

    it('should set paginating state for comments', () => {
      // First load some comments
      const loadAction = {
        type: LOAD_COMMENTS,
        payload: {
          selectedPostId: 'post:1',
          items: [{ id: 'comment:1', parent: { id: 'post:1' } }],
          next: 'page2',
        },
      };
      let state = social(undefined, loadAction);

      const startAction = {
        type: PAGINATION_START_COMMENTS,
      };
      state = social(state, startAction);

      expect(state.comments.paginating).toBe(true);

      const paginateAction = {
        type: PAGINATE_COMMENTS,
        payload: { items: [], next: null },
      };
      state = social(state, paginateAction);

      expect(state.comments.paginating).toBe(false);
    });
  });

  // ==========================================
  // Comment Options Reducer
  // ==========================================

  describe('commentOptions reducer', () => {
    it('should open comment options on OPEN_CMT_OPTIONS', () => {
      const action = {
        type: OPEN_CMT_OPTIONS,
        payload: { id: 'comment:123' },
      };
      const state = social(undefined, action);

      expect(state.commentOptions.open).toBe(true);
      expect(state.commentOptions.id).toBe('comment:123');
    });

    it('should close comment options on DISMISS_PANEL', () => {
      const openAction = {
        type: OPEN_CMT_OPTIONS,
        payload: { id: 'comment:123' },
      };
      let state = social(undefined, openAction);

      const dismissAction = {
        type: DISMISS_PANEL,
      };
      state = social(state, dismissAction);

      expect(state.commentOptions.open).toBe(false);
      expect(state.commentOptions.id).toBe('');
    });

    it('should close comment options on SHOW_CONFIRMATION_DIALOG', () => {
      const openAction = {
        type: OPEN_CMT_OPTIONS,
        payload: { id: 'comment:123' },
      };
      let state = social(undefined, openAction);

      const showDialogAction = {
        type: SHOW_CONFIRMATION_DIALOG,
      };
      state = social(state, showDialogAction);

      expect(state.commentOptions.open).toBe(false);
    });
  });

  // ==========================================
  // Selected Comment Reducer
  // ==========================================

  describe('selectedComment reducer', () => {
    it('should set selected comment on SET_SELECTED_COMMENT', () => {
      const comment: PrimeComment = {
        id: 'comment:123',
        text: 'Selected Comment',
      } as PrimeComment;

      const action = {
        type: SET_SELECTED_COMMENT,
        comment,
      };
      const state = social(undefined, action);

      expect(state.selectedComment).toEqual(comment);
    });

    it('should update selected comment preview data', () => {
      const comment: PrimeComment = {
        id: 'comment:123',
        text: 'Comment',
        previewData: null,
      } as PrimeComment;

      const setAction = {
        type: SET_SELECTED_COMMENT,
        comment,
      };
      let state = social(undefined, setAction);

      const updatePreviewAction = {
        type: UPDATE_CMT_PREVIEW_DATA,
        payload: { id: 'comment:123' },
        data: { title: 'Preview' },
      };
      state = social(state, updatePreviewAction);

      expect(state.selectedComment.previewData).toEqual({ title: 'Preview' });
    });

    it('should update selected comment with preview data', () => {
      const comment: PrimeComment = {
        id: 'comment:123',
        text: 'Comment',
        previewData: { title: 'Old' },
        attributes: {},
      } as any;

      const setAction = {
        type: SET_SELECTED_COMMENT,
        comment,
      };
      let state = social(undefined, setAction);

      const updateAction = {
        type: UPDATE_COMMENT,
        cmt: {
          id: 'comment:123',
          text: 'Updated',
          attributes: {
            previewData: { title: 'New' },
          },
        },
      };
      state = social(state, updateAction);

      expect(state.selectedComment.attributes.previewData.title).toBe('New');
    });

    it('should update selected comment without preview data', () => {
      const comment: PrimeComment = {
        id: 'comment:123',
        text: 'Comment',
        previewData: null,
      } as PrimeComment;

      const setAction = {
        type: SET_SELECTED_COMMENT,
        comment,
      };
      let state = social(undefined, setAction);

      const newComment: PrimeComment = {
        id: 'comment:123',
        text: 'Updated Comment',
      } as PrimeComment;

      const updateAction = {
        type: UPDATE_COMMENT,
        cmt: newComment,
      };
      state = social(state, updateAction);

      expect(state.selectedComment).toEqual(newComment);
    });
  });

  // ==========================================
  // Replies Reducer
  // ==========================================

  describe('replies reducer', () => {
    it('should load replies for a comment', () => {
      const replies: PrimeReply[] = [
        { id: 'reply:1', text: 'Reply 1', parent: { id: 'comment:1' } } as PrimeReply,
        { id: 'reply:2', text: 'Reply 2', parent: { id: 'comment:1' } } as PrimeReply,
      ];

      const action = {
        type: LOAD_REPLIES,
        payload: {
          selectedCommentId: 'comment:1',
          items: replies,
          next: null,
        },
      };
      const state = social(undefined, action);

      expect(state.replies.items).toEqual(replies);
    });

    it('should keep replies from other comments when loading new comment replies', () => {
      const initialReplies: PrimeReply[] = [
        { id: 'reply:1', text: 'Reply 1', parent: { id: 'comment:1' } } as PrimeReply,
        { id: 'reply:2', text: 'Reply 2', parent: { id: 'comment:1' } } as PrimeReply,
      ];

      const loadAction1 = {
        type: LOAD_REPLIES,
        payload: {
          selectedCommentId: 'comment:1',
          items: initialReplies,
          next: null,
        },
      };
      let state = social(undefined, loadAction1);

      expect(state.replies.items).toHaveLength(2);

      const newReplies: PrimeReply[] = [
        { id: 'reply:3', text: 'Reply 3', parent: { id: 'comment:2' } } as PrimeReply,
        { id: 'reply:4', text: 'Reply 4', parent: { id: 'comment:2' } } as PrimeReply,
      ];

      const loadAction2 = {
        type: LOAD_REPLIES,
        payload: {
          selectedCommentId: 'comment:2',
          items: newReplies,
          next: null,
        },
      };
      state = social(state, loadAction2);

      // Reducer keeps replies from other comments and concatenates new ones
      expect(state.replies.items).toHaveLength(4);
      expect(state.replies.items[0].id).toBe('reply:1');
      expect(state.replies.items[1].id).toBe('reply:2');
      expect(state.replies.items[2].id).toBe('reply:3');
      expect(state.replies.items[3].id).toBe('reply:4');
    });

    it('should paginate replies', () => {
      const initialReplies: PrimeReply[] = [
        { id: 'reply:1', text: 'Reply 1', parent: { id: 'comment:1' } } as PrimeReply,
      ];
      const newReplies: PrimeReply[] = [
        { id: 'reply:2', text: 'Reply 2', parent: { id: 'comment:1' } } as PrimeReply,
      ];

      const loadAction = {
        type: LOAD_REPLIES,
        payload: {
          selectedCommentId: 'comment:1',
          items: initialReplies,
          next: 'page2',
        },
      };
      let state = social(undefined, loadAction);

      const paginateAction = {
        type: PAGINATE_REPLIES,
        payload: {
          items: newReplies,
          next: null,
        },
      };
      state = social(state, paginateAction);

      expect(state.replies.items).toHaveLength(2);
    });

    it('should update reply', () => {
      const replies: PrimeReply[] = [
        { id: 'reply:1', text: 'Old Text', parent: { id: 'comment:1' } } as PrimeReply,
      ];

      const loadAction = {
        type: LOAD_REPLIES,
        payload: {
          selectedCommentId: 'comment:1',
          items: replies,
          next: null,
        },
      };
      let state = social(undefined, loadAction);

      const updateAction = {
        type: UPDATE_REPLY,
        payload: {
          item: { id: 'reply:1', text: 'New Text', parent: { id: 'comment:1' } } as PrimeReply,
        },
      };
      state = social(state, updateAction);

      expect(state.replies.items[0].text).toBe('New Text');
    });

    it('should return empty array when no items in LOAD_REPLIES', () => {
      const action = {
        type: LOAD_REPLIES,
        payload: {
          selectedCommentId: 'comment:1',
          items: null, // No items provided
          next: null,
        },
      };

      const state = social(undefined, action);

      expect(state.replies.items).toEqual([]);
    });

    it('should return state when selectedCommentId is missing in LOAD_REPLIES', () => {
      const initialReplies: PrimeReply[] = [
        { id: 'reply:1', text: 'Existing Reply', parent: { id: 'comment:1' } } as PrimeReply,
      ];

      const loadInitialAction = {
        type: LOAD_REPLIES,
        payload: {
          selectedCommentId: 'comment:1',
          items: initialReplies,
          next: null,
        },
      };
      let state = social(undefined, loadInitialAction);

      // Now try to load replies without selectedCommentId
      const actionWithoutCommentId = {
        type: LOAD_REPLIES,
        payload: {
          selectedCommentId: null, // Missing selectedCommentId
          items: [{ id: 'reply:2', parent: { id: 'comment:2' } } as PrimeReply],
          next: null,
        },
      };
      state = social(state, actionWithoutCommentId);

      // When selectedCommentId is null, filter won't match anything, so both replies are kept
      expect(state.replies.items).toHaveLength(2);
      expect(state.replies.items[0].id).toBe('reply:1');
      expect(state.replies.items[1].id).toBe('reply:2');
    });

    it('should return empty array when state is null for UPDATE_REPLY', () => {
      const action = {
        type: UPDATE_REPLY,
        payload: { item: { id: 'reply:1', text: 'text' } as PrimeReply },
      };

      // Starting with state that has null replies items
      const baseState = social(undefined, { type: '@@INIT' });
      const stateWithNullReplies = {
        ...baseState,
        replies: { items: null, next: null, paginating: false },
      };
      const state = social(stateWithNullReplies as any, action);

      expect(state.replies.items).toEqual([]);
    });

    it('should return empty array when state is null for UPDATE_REPLY_PREVIEW_DATA', () => {
      const action = {
        type: UPDATE_REPLY_PREVIEW_DATA,
        payload: { id: 'reply:1' },
        data: { title: 'Preview' } as PrimeReply,
      };

      // Starting with state that has null replies items
      const baseState = social(undefined, { type: '@@INIT' });
      const stateWithNullReplies = {
        ...baseState,
        replies: { items: null, next: null, paginating: false },
      };
      const state = social(stateWithNullReplies as any, action);

      expect(state.replies.items).toEqual([]);
    });

    it('should delete reply on SOCIAL_REPLY_DELETE_SUCCESS', () => {
      const replies: PrimeReply[] = [
        { id: 'reply:1', text: 'Reply 1', parent: { id: 'comment:1' } } as PrimeReply,
        { id: 'reply:2', text: 'Reply 2', parent: { id: 'comment:1' } } as PrimeReply,
      ];

      const loadAction = {
        type: LOAD_REPLIES,
        payload: {
          selectedCommentId: 'comment:1',
          items: replies,
          next: null,
        },
      };
      let state = social(undefined, loadAction);

      const deleteAction = {
        type: SOCIAL_REPLY_DELETE_SUCCESS,
        payload: { id: 'reply:1' },
      };
      state = social(state, deleteAction);

      expect(state.replies.items).toHaveLength(1);
      expect(state.replies.items[0].id).toBe('reply:2');
    });

    it('should update reply preview data', () => {
      const replies: PrimeReply[] = [
        {
          id: 'reply:1',
          text: 'Reply',
          previewData: null,
          parent: { id: 'comment:1' },
        } as PrimeReply,
      ];

      const loadAction = {
        type: LOAD_REPLIES,
        payload: {
          selectedCommentId: 'comment:1',
          items: replies,
          next: null,
        },
      };
      let state = social(undefined, loadAction);

      const updatePreviewAction = {
        type: UPDATE_REPLY_PREVIEW_DATA,
        payload: { id: 'reply:1' },
        data: { title: 'Reply Preview' },
      };
      state = social(state, updatePreviewAction);

      expect(state.replies.items[0].previewData).toEqual({ title: 'Reply Preview' });
    });

    it('should set paginating state for replies', () => {
      // First load some replies
      const loadAction = {
        type: LOAD_REPLIES,
        payload: {
          selectedCommentId: 'comment:1',
          items: [{ id: 'reply:1', parent: { id: 'comment:1' } }],
          next: 'page2',
        },
      };
      let state = social(undefined, loadAction);

      const startAction = {
        type: PAGINATION_START_REPLIES,
      };
      state = social(state, startAction);

      expect(state.replies.paginating).toBe(true);

      const paginateAction = {
        type: PAGINATE_REPLIES,
        payload: { items: [], next: null },
      };
      state = social(state, paginateAction);

      expect(state.replies.paginating).toBe(false);
    });
  });

  // ==========================================
  // Reply Options Reducer
  // ==========================================

  describe('replyOptions reducer', () => {
    it('should open reply options on OPEN_REPLY_OPTIONS', () => {
      const action = {
        type: OPEN_REPLY_OPTIONS,
        payload: { id: 'reply:123' },
      };
      const state = social(undefined, action);

      expect(state.replyOptions.open).toBe(true);
      expect(state.replyOptions.id).toBe('reply:123');
    });

    it('should close reply options on DISMISS_PANEL', () => {
      const openAction = {
        type: OPEN_REPLY_OPTIONS,
        payload: { id: 'reply:123' },
      };
      let state = social(undefined, openAction);

      const dismissAction = {
        type: DISMISS_PANEL,
      };
      state = social(state, dismissAction);

      expect(state.replyOptions.open).toBe(false);
      expect(state.replyOptions.id).toBe('');
    });

    it('should close reply options on SHOW_CONFIRMATION_DIALOG', () => {
      const openAction = {
        type: OPEN_REPLY_OPTIONS,
        payload: { id: 'reply:123' },
      };
      let state = social(undefined, openAction);

      const showDialogAction = {
        type: SHOW_CONFIRMATION_DIALOG,
      };
      state = social(state, showDialogAction);

      expect(state.replyOptions.open).toBe(false);
    });
  });

  // ==========================================
  // User Favorite Boards Reducer
  // ==========================================

  describe('userFavBoards reducer', () => {
    it('should load favorite boards on LOAD_FAV_BOARDS', () => {
      const favBoards: PrimeBoard[] = [
        { id: 'board:1', name: 'Fav Board 1', isFavorite: true } as PrimeBoard,
        { id: 'board:2', name: 'Fav Board 2', isFavorite: true } as PrimeBoard,
      ];

      const action = {
        type: LOAD_FAV_BOARDS,
        payload: favBoards,
      };
      const state = social(undefined, action);

      expect(state.userFavBoards).toEqual(favBoards);
    });

    it('should return empty array if no payload', () => {
      const action = {
        type: LOAD_FAV_BOARDS,
        payload: null,
      };
      const state = social(undefined, action);

      expect(state.userFavBoards).toEqual([]);
    });
  });
});
