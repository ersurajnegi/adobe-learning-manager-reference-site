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
 * Unit tests for small Redux reducers
 * Tests auth, user, comment, reply, account, appState, badge, fileUpload,
 * recommendation, search, skill, userRecommendationPreference, and userSkillInterest reducers
 */

import { accessToken } from '@almLib/store/reducers/auth';
import { user } from '@almLib/store/reducers/user';
import comment from '@almLib/store/reducers/comment';
import reply from '@almLib/store/reducers/reply';
import { account } from '@almLib/store/reducers/account';
import { appState } from '@almLib/store/reducers/appState';
import { badge } from '@almLib/store/reducers/badge';
import fileUpload from '@almLib/store/reducers/fileUpload';
import recommendation from '@almLib/store/reducers/recommendation';
import search from '@almLib/store/reducers/search';
import skill from '@almLib/store/reducers/skill';
import userRecommendationPreference from '@almLib/store/reducers/userRecommendationPreference';
import userSkillInterest from '@almLib/store/reducers/userSkillInterest';
import { AUTHENTICATE_USER } from '@almLib/store/actions/auth/actionTypes';
import { LOAD_USER, LOAD_ACCOUNT_AND_USER } from '@almLib/store/actions';
import {
  UPDATE_COMMENT_TEXT,
  LOAD_COMMENTS,
  UPDATE_REPLY_TEXT,
  LOAD_REPLIES,
} from '@almLib/store/actions/social/actionTypes';
import { LOAD_BADGES, PAGINATE_BADGES } from '@almLib/store/actions/badge/actionTypes';
import {
  SET_UPLOAD_NAME,
  SET_UPLOAD_PROGRESS,
  RESET_UPLOAD,
} from '@almLib/store/actions/fileUpload/actionTypes';
import {
  GET_RECOMMENDATION_LEVELS,
  GET_RECOMMENDATION_PRODUCTS,
  GET_RECOMMENDATION_ROLES,
  GET_USER_RECOMMENDATION_PREFERENCE,
  GET_SKILLS,
  PAGINATE_SKILLS,
  GET_USER_SKILL_INTEREST,
  PAGINATE_USER_SKILL_INTEREST,
  DELETE_USER_SKILL_INTEREST,
} from '@almLib/store/actions/user/actionTypes';
import {
  OPEN_SEARCH,
  CLOSE_SEARCH,
  CLOSE_AUTOCOMPLETE,
  SET_SEARCH_SUGGESTIONS,
} from '@almLib/store/actions/search/actionTypes';
import { AppEvents } from '@almLib/store/actions/appState';
import { PrimeUser, PrimeAccount, PrimeUserBadge, PrimeSkill } from '@models/PrimeModels';

describe('auth reducer', () => {
  describe('accessToken', () => {
    it('should return initial state', () => {
      const state = accessToken(undefined, { type: '@@INIT' });
      expect(state).toBe('');
    });

    it('should authenticate user and set token', () => {
      const token = 'test-access-token-12345';
      const action = {
        type: AUTHENTICATE_USER,
        payload: token,
      };
      const state = accessToken(undefined, action);
      expect(state).toBe(token);
    });

    it('should update existing token', () => {
      const oldToken = 'old-token';
      const newToken = 'new-token';

      let state = accessToken(undefined, {
        type: AUTHENTICATE_USER,
        payload: oldToken,
      });

      state = accessToken(state, {
        type: AUTHENTICATE_USER,
        payload: newToken,
      });

      expect(state).toBe(newToken);
    });

    it('should handle null payload', () => {
      const action = {
        type: AUTHENTICATE_USER,
        payload: null,
      };
      const state = accessToken(undefined, action);
      expect(state).toBeNull();
    });

    it('should return current state for unknown action', () => {
      const currentToken = 'current-token';
      const state = accessToken(currentToken as any, { type: 'UNKNOWN_ACTION' });
      expect(state).toBe(currentToken);
    });
  });
});

describe('user reducer', () => {
  describe('user', () => {
    it('should return initial empty object', () => {
      const state = user(undefined, { type: '@@INIT' });
      expect(state).toEqual({});
    });

    it('should load user on LOAD_USER', () => {
      const userData: PrimeUser = {
        id: 'user:123',
        name: 'Test User',
        email: 'test@example.com',
      } as PrimeUser;

      const action = {
        type: LOAD_USER,
        payload: userData,
      };
      const state = user(undefined, action);

      expect(state).toEqual(userData);
      expect(state.id).toBe('user:123');
      expect(state.name).toBe('Test User');
    });

    it('should load user from LOAD_ACCOUNT_AND_USER', () => {
      const userData: PrimeUser = {
        id: 'user:456',
        name: 'Another User',
        email: 'another@example.com',
      } as PrimeUser;

      const action = {
        type: LOAD_ACCOUNT_AND_USER,
        payload: {
          userData,
          accountData: {},
        },
      };
      const state = user(undefined, action);

      expect(state).toEqual(userData);
      expect(state.id).toBe('user:456');
    });

    it('should update existing user', () => {
      const oldUser: PrimeUser = {
        id: 'user:123',
        name: 'Old Name',
      } as PrimeUser;

      const newUser: PrimeUser = {
        id: 'user:123',
        name: 'New Name',
      } as PrimeUser;

      let state = user(undefined, {
        type: LOAD_USER,
        payload: oldUser,
      });

      state = user(state, {
        type: LOAD_USER,
        payload: newUser,
      });

      expect(state.name).toBe('New Name');
    });

    it('should handle null payload in LOAD_USER', () => {
      const action = {
        type: LOAD_USER,
        payload: null,
      };
      const state = user(undefined, action);
      expect(state).toBeNull();
    });

    it('should handle empty userData in LOAD_ACCOUNT_AND_USER', () => {
      const action = {
        type: LOAD_ACCOUNT_AND_USER,
        payload: {
          userData: null,
        },
      };
      const state = user(undefined, action);
      expect(state).toBeNull();
    });

    it('should return current state for unknown action', () => {
      const currentUser: PrimeUser = {
        id: 'user:789',
        name: 'Current User',
      } as PrimeUser;

      const state = user(currentUser, { type: 'UNKNOWN_ACTION' });
      expect(state).toEqual(currentUser);
    });
  });
});

describe('comment reducer', () => {
  it('should return initial state', () => {
    const state = comment(undefined, { type: '@@INIT' });
    expect(state).toEqual({ state: 'ACTIVE', text: '' });
  });

  it('should update comment text on UPDATE_COMMENT_TEXT', () => {
    const action = {
      type: UPDATE_COMMENT_TEXT,
      text: 'This is a test comment',
    };
    const state = comment(undefined, action);

    expect(state.text).toBe('This is a test comment');
    expect(state.state).toBe('ACTIVE');
  });

  it('should handle empty text in UPDATE_COMMENT_TEXT', () => {
    const action = {
      type: UPDATE_COMMENT_TEXT,
      text: '',
    };
    const state = comment(undefined, action);

    expect(state.text).toBe('');
  });

  it('should reset text on LOAD_COMMENTS', () => {
    // First set some text
    let state = comment(undefined, {
      type: UPDATE_COMMENT_TEXT,
      text: 'Some comment text',
    });

    expect(state.text).toBe('Some comment text');

    // Then load comments should reset
    state = comment(state, {
      type: LOAD_COMMENTS,
      payload: { items: [], next: null },
    });

    expect(state.text).toBe('');
  });

  it('should maintain ACTIVE state across actions', () => {
    let state = comment(undefined, { type: '@@INIT' });
    expect(state.state).toBe('ACTIVE');

    state = comment(state, {
      type: UPDATE_COMMENT_TEXT,
      text: 'test',
    });
    expect(state.state).toBe('ACTIVE');

    state = comment(state, {
      type: LOAD_COMMENTS,
      payload: {},
    });
    expect(state.state).toBe('ACTIVE');
  });

  it('should return current state for unknown action', () => {
    const initialState = comment(undefined, {
      type: UPDATE_COMMENT_TEXT,
      text: 'Current text',
    });

    const state = comment(initialState, { type: 'UNKNOWN_ACTION' });
    expect(state.text).toBe('Current text');
  });
});

describe('reply reducer', () => {
  it('should return initial state', () => {
    const state = reply(undefined, { type: '@@INIT' });
    expect(state).toEqual({ state: 'ACTIVE', text: '' });
  });

  it('should update reply text on UPDATE_REPLY_TEXT', () => {
    const action = {
      type: UPDATE_REPLY_TEXT,
      text: 'This is a test reply',
    };
    const state = reply(undefined, action);

    expect(state.text).toBe('This is a test reply');
    expect(state.state).toBe('ACTIVE');
  });

  it('should handle empty text in UPDATE_REPLY_TEXT', () => {
    const action = {
      type: UPDATE_REPLY_TEXT,
      text: '',
    };
    const state = reply(undefined, action);

    expect(state.text).toBe('');
  });

  it('should reset text on LOAD_REPLIES', () => {
    // First set some text
    let state = reply(undefined, {
      type: UPDATE_REPLY_TEXT,
      text: 'Some reply text',
    });

    expect(state.text).toBe('Some reply text');

    // Then load replies should reset
    state = reply(state, {
      type: LOAD_REPLIES,
      payload: { items: [], next: null },
    });

    expect(state.text).toBe('');
  });

  it('should maintain ACTIVE state across actions', () => {
    let state = reply(undefined, { type: '@@INIT' });
    expect(state.state).toBe('ACTIVE');

    state = reply(state, {
      type: UPDATE_REPLY_TEXT,
      text: 'test',
    });
    expect(state.state).toBe('ACTIVE');

    state = reply(state, {
      type: LOAD_REPLIES,
      payload: {},
    });
    expect(state.state).toBe('ACTIVE');
  });

  it('should return current state for unknown action', () => {
    const initialState = reply(undefined, {
      type: UPDATE_REPLY_TEXT,
      text: 'Current reply text',
    });

    const state = reply(initialState, { type: 'UNKNOWN_ACTION' });
    expect(state.text).toBe('Current reply text');
  });

  it('should handle multiple text updates', () => {
    let state = reply(undefined, {
      type: UPDATE_REPLY_TEXT,
      text: 'First reply',
    });
    expect(state.text).toBe('First reply');

    state = reply(state, {
      type: UPDATE_REPLY_TEXT,
      text: 'Updated reply',
    });
    expect(state.text).toBe('Updated reply');

    state = reply(state, {
      type: UPDATE_REPLY_TEXT,
      text: 'Final reply',
    });
    expect(state.text).toBe('Final reply');
  });
});

describe('account reducer', () => {
  it('should return initial empty object', () => {
    const state = account(undefined, { type: '@@INIT' });
    expect(state).toEqual({});
  });

  it('should load account on LOAD_ACCOUNT_AND_USER', () => {
    const accountData: PrimeAccount = {
      id: 'account:123',
      name: 'Test Account',
    } as PrimeAccount;

    const action = {
      type: LOAD_ACCOUNT_AND_USER,
      payload: {
        account: accountData,
        userData: {},
      },
    };

    const state = account(undefined, action);
    expect(state).toEqual(accountData);
    expect(state.id).toBe('account:123');
  });

  it('should handle null account payload', () => {
    const action = {
      type: LOAD_ACCOUNT_AND_USER,
      payload: {
        account: null,
      },
    };
    const state = account(undefined, action);
    expect(state).toBeNull();
  });

  it('should return current state for unknown action', () => {
    const currentAccount = { id: 'account:456' } as PrimeAccount;
    const state = account(currentAccount, { type: 'UNKNOWN_ACTION' });
    expect(state).toEqual(currentAccount);
  });
});

describe('appState reducer', () => {
  it('should return initial state', () => {
    const state = appState(undefined, { type: '@@INIT' } as any);
    expect(state).toEqual({
      appMode: 'WEB',
      isOnline: true,
      downloadProgress: [],
      contentToBeUpdated: [],
    });
  });

  it('should set appMode on SETUP_PARAMS_FOR_OFFLINE_ON_LOAD', () => {
    const action = {
      type: AppEvents.SETUP_PARAMS_FOR_OFFLINE_ON_LOAD,
      mode: 'OFFLINE',
    };
    const state = appState(undefined, action as any);
    expect(state.appMode).toBe('OFFLINE');
  });

  it('should update network status on CHANGE_NETWORK_STATUS', () => {
    const action = {
      type: AppEvents.CHANGE_NETWORK_STATUS,
      value: false,
    };
    const state = appState(undefined, action as any);
    expect(state.isOnline).toBe(false);
  });

  it('should update download progress on UPDATE_DOWNLOAD_PROGRESS', () => {
    const downloadData = [{ loId: 'lo:123', progress: 50 }];
    const action = {
      type: AppEvents.UPDATE_DOWNLOAD_PROGRESS,
      value: downloadData,
    };
    const state = appState(undefined, action as any);
    expect(state.downloadProgress).toEqual(downloadData);
  });

  it('should update download status on UPDATE_DOWNLOAD_STATUS', () => {
    const downloadData = [{ loId: 'lo:123', status: 'completed' }];
    const action = {
      type: AppEvents.UPDATE_DOWNLOAD_STATUS,
      value: downloadData,
    };
    const state = appState(undefined, action as any);
    expect(state.downloadProgress).toEqual(downloadData);
  });

  it('should remove download on DELETE_DOWNLOAD', () => {
    const initialState = appState(undefined, {
      type: AppEvents.UPDATE_DOWNLOAD_PROGRESS,
      value: [
        { loId: 'lo:123', progress: 50 },
        { loId: 'lo:456', progress: 75 },
      ],
    } as any);

    const action = {
      type: AppEvents.DELETE_DOWNLOAD,
      value: { loId: 'lo:123' },
    };

    const state = appState(initialState, action as any);
    expect(state.downloadProgress).toHaveLength(1);
    expect(state.downloadProgress[0].loId).toBe('lo:456');
  });

  it('should set content to be updated on SET_CONTENT_TO_BE_UPDATED', () => {
    const contentData = [{ id: 'content:123' }];
    const action = {
      type: AppEvents.SET_CONTENT_TO_BE_UPDATED,
      value: contentData,
    };
    const state = appState(undefined, action as any);
    expect(state.contentToBeUpdated).toEqual(contentData);
  });
});

describe('badge reducer', () => {
  it('should return initial state', () => {
    const state = badge(undefined, { type: '@@INIT' });
    expect(state).toEqual({ badges: [], next: '' });
  });

  it('should load badges on LOAD_BADGES', () => {
    const badges: PrimeUserBadge[] = [
      { id: 'badge:1', name: 'Badge 1' } as PrimeUserBadge,
      { id: 'badge:2', name: 'Badge 2' } as PrimeUserBadge,
    ];

    const action = {
      type: LOAD_BADGES,
      payload: {
        badges,
        next: 'next-url',
      },
    };

    const state = badge(undefined, action);
    expect(state.badges).toEqual(badges);
    expect(state.next).toBe('next-url');
  });

  it('should paginate badges on PAGINATE_BADGES', () => {
    const initialBadges = [{ id: 'badge:1' } as PrimeUserBadge];
    const initialState = badge(undefined, {
      type: LOAD_BADGES,
      payload: { badges: initialBadges, next: 'url1' },
    });

    const newBadges = [{ id: 'badge:2' } as PrimeUserBadge];
    const action = {
      type: PAGINATE_BADGES,
      payload: {
        badges: newBadges,
        next: 'url2',
      },
    };

    const state = badge(initialState, action);
    expect(state.badges).toHaveLength(2);
    expect(state.badges[0].id).toBe('badge:1');
    expect(state.badges[1].id).toBe('badge:2');
    expect(state.next).toBe('url2');
  });

  it('should handle null badges', () => {
    const action = {
      type: LOAD_BADGES,
      payload: {
        badges: null,
        next: '',
      },
    };
    const state = badge(undefined, action);
    expect(state.badges).toBeNull();
  });
});

describe('fileUpload reducer', () => {
  it('should return initial state', () => {
    const state = fileUpload(undefined, { type: '@@INIT' });
    expect(state).toEqual({ fileName: null, uploadProgress: null });
  });

  it('should set file name on SET_UPLOAD_NAME', () => {
    const action = {
      type: SET_UPLOAD_NAME,
      value: 'test-file.pdf',
    };
    const state = fileUpload(undefined, action);
    expect(state.fileName).toBe('test-file.pdf');
  });

  it('should set upload progress on SET_UPLOAD_PROGRESS', () => {
    const action = {
      type: SET_UPLOAD_PROGRESS,
      value: 75,
    };
    const state = fileUpload(undefined, action);
    expect(state.uploadProgress).toBe(75);
  });

  it('should reset upload on RESET_UPLOAD', () => {
    let state = fileUpload(undefined, {
      type: SET_UPLOAD_NAME,
      value: 'file.pdf',
    });
    state = fileUpload(state, {
      type: SET_UPLOAD_PROGRESS,
      value: 50,
    });

    expect(state.fileName).toBe('file.pdf');
    expect(state.uploadProgress).toBe(50);

    state = fileUpload(state, { type: RESET_UPLOAD });
    expect(state.fileName).toBeNull();
    expect(state.uploadProgress).toBeNull();
  });

  it('should handle complete upload flow', () => {
    let state = fileUpload(undefined, { type: '@@INIT' });

    state = fileUpload(state, {
      type: SET_UPLOAD_NAME,
      value: 'document.docx',
    });
    expect(state.fileName).toBe('document.docx');

    state = fileUpload(state, {
      type: SET_UPLOAD_PROGRESS,
      value: 25,
    });
    expect(state.uploadProgress).toBe(25);

    state = fileUpload(state, {
      type: SET_UPLOAD_PROGRESS,
      value: 100,
    });
    expect(state.uploadProgress).toBe(100);
  });
});

describe('recommendation reducer', () => {
  it('should return initial state', () => {
    const state = recommendation(undefined, { type: '@@INIT' });
    expect(state.products).toEqual({});
    expect(state.roles).toEqual({});
    expect(state.levels).toEqual({});
  });

  it('should load products on GET_RECOMMENDATION_PRODUCTS', () => {
    const products = [{ id: 'product:1' }, { id: 'product:2' }];
    const action = {
      type: GET_RECOMMENDATION_PRODUCTS,
      payload: { items: products },
    };
    const state = recommendation(undefined, action);
    expect(state.products).toEqual(products);
  });

  it('should load roles on GET_RECOMMENDATION_ROLES', () => {
    const roles = [{ id: 'role:1' }, { id: 'role:2' }];
    const action = {
      type: GET_RECOMMENDATION_ROLES,
      payload: { items: roles },
    };
    const state = recommendation(undefined, action);
    expect(state.roles).toEqual(roles);
  });

  it('should load levels on GET_RECOMMENDATION_LEVELS', () => {
    const levels = { data: ['beginner', 'intermediate'] };
    const action = {
      type: GET_RECOMMENDATION_LEVELS,
      payload: { items: levels },
    };
    const state = recommendation(undefined, action);
    expect(state.levels).toEqual(levels);
  });

  it('should handle multiple recommendation types', () => {
    let state = recommendation(undefined, {
      type: GET_RECOMMENDATION_PRODUCTS,
      payload: { items: [{ id: 'product:1' }] },
    });

    state = recommendation(state, {
      type: GET_RECOMMENDATION_ROLES,
      payload: { items: [{ id: 'role:1' }] },
    });

    state = recommendation(state, {
      type: GET_RECOMMENDATION_LEVELS,
      payload: { items: { data: ['beginner'] } },
    });

    expect(state.products).toHaveLength(1);
    expect(state.roles).toHaveLength(1);
    expect(state.levels.data).toHaveLength(1);
  });
});

describe('search reducer', () => {
  it('should return initial state', () => {
    const state = search(undefined, { type: '@@INIT' });
    expect(state.searching).toBe(false);
    expect(state.autocomplete).toBe(false);
    expect(state.userSearchHistory).toEqual([]);
    expect(state.popularSearches).toEqual([]);
  });

  it('should open search on OPEN_SEARCH', () => {
    const action = { type: OPEN_SEARCH };
    const state = search(undefined, action);
    expect(state.searching).toBe(true);
    expect(state.autocomplete).toBe(true);
  });

  it('should close search on CLOSE_SEARCH', () => {
    let state = search(undefined, { type: OPEN_SEARCH });
    expect(state.searching).toBe(true);

    state = search(state, { type: CLOSE_SEARCH });
    expect(state.searching).toBe(false);
    expect(state.autocomplete).toBe(false);
    expect(state.userSearchHistory).toEqual([]);
    expect(state.popularSearches).toEqual([]);
  });

  it('should close autocomplete on CLOSE_AUTOCOMPLETE', () => {
    let state = search(undefined, { type: OPEN_SEARCH });
    expect(state.autocomplete).toBe(true);

    state = search(state, { type: CLOSE_AUTOCOMPLETE });
    expect(state.autocomplete).toBe(false);
    expect(state.searching).toBe(true);
  });

  it('should set search suggestions on SET_SEARCH_SUGGESTIONS', () => {
    const action = {
      type: SET_SEARCH_SUGGESTIONS,
      payload: {
        userSearchHistory: ['search1', 'search2'],
        popularSearches: ['popular1', 'popular2'],
      },
    };
    const state = search(undefined, action);
    expect(state.userSearchHistory).toEqual(['search1', 'search2']);
    expect(state.popularSearches).toEqual(['popular1', 'popular2']);
    expect(state.autocomplete).toBe(true);
  });

  it('should handle partial search suggestions', () => {
    const action = {
      type: SET_SEARCH_SUGGESTIONS,
      payload: {
        userSearchHistory: ['search1'],
      },
    };
    const state = search(undefined, action);
    expect(state.userSearchHistory).toEqual(['search1']);
    expect(state.popularSearches).toEqual([]);
  });

  it('should handle search flow', () => {
    let state = search(undefined, { type: OPEN_SEARCH });
    expect(state.searching).toBe(true);

    state = search(state, {
      type: SET_SEARCH_SUGGESTIONS,
      payload: {
        userSearchHistory: ['recent'],
        popularSearches: ['trending'],
      },
    });
    expect(state.userSearchHistory).toEqual(['recent']);

    state = search(state, { type: CLOSE_AUTOCOMPLETE });
    expect(state.autocomplete).toBe(false);

    state = search(state, { type: CLOSE_SEARCH });
    expect(state.searching).toBe(false);
    expect(state.userSearchHistory).toEqual([]);
  });
});

describe('skill reducer', () => {
  it('should return initial state', () => {
    const state = skill(undefined, { type: '@@INIT' });
    expect(state.items).toEqual({});
    expect(state.next).toBeNull();
  });

  it('should load skills on GET_SKILLS', () => {
    const skills: PrimeSkill[] = [
      { id: 'skill:1', name: 'Skill 1' } as PrimeSkill,
      { id: 'skill:2', name: 'Skill 2' } as PrimeSkill,
    ];

    const action = {
      type: GET_SKILLS,
      payload: {
        items: skills,
        next: 'next-url',
      },
    };

    const state = skill(undefined, action);
    expect(state.items).toEqual(skills);
    expect(state.next).toBe('next-url');
  });

  it('should paginate skills on PAGINATE_SKILLS', () => {
    const initialSkills = [{ id: 'skill:1' } as PrimeSkill];
    let state = skill(undefined, {
      type: GET_SKILLS,
      payload: { items: initialSkills, next: 'url1' },
    });

    const newSkills = [{ id: 'skill:2' } as PrimeSkill];
    const action = {
      type: PAGINATE_SKILLS,
      payload: {
        items: newSkills,
        next: 'url2',
      },
    };

    state = skill(state, action);
    expect(state.items).toHaveLength(2);
    expect(state.items[0].id).toBe('skill:1');
    expect(state.items[1].id).toBe('skill:2');
    expect(state.next).toBe('url2');
  });

  it('should handle paginate with no items', () => {
    const initialSkills = [{ id: 'skill:1' } as PrimeSkill];
    let state = skill(undefined, {
      type: GET_SKILLS,
      payload: { items: initialSkills, next: 'url1' },
    });

    const action = {
      type: PAGINATE_SKILLS,
      payload: { items: null, next: 'url1' },
    };

    state = skill(state, action);
    expect(state.items).toEqual(initialSkills);
  });
});

describe('userRecommendationPreference reducer', () => {
  it('should return initial state', () => {
    const state = userRecommendationPreference(undefined, { type: '@@INIT' });
    expect(state.items).toEqual({});
    expect(state.products).toEqual({});
    expect(state.roles).toEqual({});
    expect(state.levels).toEqual({});
    expect(state.next).toBeNull();
  });

  it('should load user preference on GET_USER_RECOMMENDATION_PREFERENCE', () => {
    const preference = { id: 'pref:1', name: 'My Preference' };
    const action = {
      type: GET_USER_RECOMMENDATION_PREFERENCE,
      payload: {
        items: preference,
        next: 'next-url',
      },
    };
    const state = userRecommendationPreference(undefined, action);
    expect(state.items).toEqual(preference);
    expect(state.next).toBe('next-url');
  });

  it('should load products on GET_RECOMMENDATION_PRODUCTS', () => {
    const products = [{ id: 'product:1' }];
    const action = {
      type: GET_RECOMMENDATION_PRODUCTS,
      payload: { items: products },
    };
    const state = userRecommendationPreference(undefined, action);
    expect(state.products).toEqual(products);
  });

  it('should load roles on GET_RECOMMENDATION_ROLES', () => {
    const roles = [{ id: 'role:1' }];
    const action = {
      type: GET_RECOMMENDATION_ROLES,
      payload: { items: roles },
    };
    const state = userRecommendationPreference(undefined, action);
    expect(state.roles).toEqual(roles);
  });

  it('should load levels on GET_RECOMMENDATION_LEVELS', () => {
    const levels = { data: ['beginner'] };
    const action = {
      type: GET_RECOMMENDATION_LEVELS,
      payload: { items: levels },
    };
    const state = userRecommendationPreference(undefined, action);
    expect(state.levels).toEqual(levels);
  });

  it('should handle all recommendation data types', () => {
    let state = userRecommendationPreference(undefined, {
      type: GET_USER_RECOMMENDATION_PREFERENCE,
      payload: { items: { id: 'pref:1' }, next: 'url1' },
    });

    state = userRecommendationPreference(state, {
      type: GET_RECOMMENDATION_PRODUCTS,
      payload: { items: [{ id: 'product:1' }] },
    });

    state = userRecommendationPreference(state, {
      type: GET_RECOMMENDATION_ROLES,
      payload: { items: [{ id: 'role:1' }] },
    });

    state = userRecommendationPreference(state, {
      type: GET_RECOMMENDATION_LEVELS,
      payload: { items: { data: ['beginner'] } },
    });

    expect(state.items.id).toBe('pref:1');
    expect(state.products).toHaveLength(1);
    expect(state.roles).toHaveLength(1);
    expect(state.levels.data).toHaveLength(1);
  });
});

describe('userSkillInterest reducer', () => {
  it('should return initial state', () => {
    const state = userSkillInterest(undefined, { type: '@@INIT' });
    expect(state.items).toEqual({});
    expect(state.next).toBeNull();
  });

  it('should load user skill interests on GET_USER_SKILL_INTEREST', () => {
    const interests = [
      { id: 'interest:1', skill: { id: 'skill:1' } },
      { id: 'interest:2', skill: { id: 'skill:2' } },
    ];

    const action = {
      type: GET_USER_SKILL_INTEREST,
      payload: {
        items: interests,
        next: 'next-url',
      },
    };

    const state = userSkillInterest(undefined, action);
    expect(state.items).toEqual(interests);
    expect(state.next).toBe('next-url');
  });

  it('should delete skill interest on DELETE_USER_SKILL_INTEREST', () => {
    const interests = [
      { id: 'interest:1', skill: { id: 'skill:1' } },
      { id: 'interest:2', skill: { id: 'skill:2' } },
    ];

    let state = userSkillInterest(undefined, {
      type: GET_USER_SKILL_INTEREST,
      payload: { items: interests, next: 'url1' },
    });

    const action = {
      type: DELETE_USER_SKILL_INTEREST,
      payload: { skillId: 'skill:1' },
    };

    state = userSkillInterest(state, action);
    expect(state.items).toHaveLength(1);
    expect(state.items[0].skill.id).toBe('skill:2');
  });

  it('should paginate skill interests on PAGINATE_USER_SKILL_INTEREST', () => {
    const initialInterests = [{ id: 'interest:1', skill: { id: 'skill:1' } }];
    let state = userSkillInterest(undefined, {
      type: GET_USER_SKILL_INTEREST,
      payload: { items: initialInterests, next: 'url1' },
    });

    const newInterests = [{ id: 'interest:2', skill: { id: 'skill:2' } }];
    const action = {
      type: PAGINATE_USER_SKILL_INTEREST,
      payload: {
        items: newInterests,
        next: 'url2',
      },
    };

    state = userSkillInterest(state, action);
    expect(state.items).toHaveLength(2);
    expect(state.items[0].id).toBe('interest:1');
    expect(state.items[1].id).toBe('interest:2');
    expect(state.next).toBe('url2');
  });

  it('should handle paginate with no items', () => {
    const initialInterests = [{ id: 'interest:1', skill: { id: 'skill:1' } }];
    let state = userSkillInterest(undefined, {
      type: GET_USER_SKILL_INTEREST,
      payload: { items: initialInterests, next: 'url1' },
    });

    const action = {
      type: PAGINATE_USER_SKILL_INTEREST,
      payload: { items: null, next: 'url1' },
    };

    state = userSkillInterest(state, action);
    expect(state.items).toEqual(initialInterests);
  });

  it('should handle complete skill interest flow', () => {
    // Load initial interests
    let state = userSkillInterest(undefined, {
      type: GET_USER_SKILL_INTEREST,
      payload: {
        items: [
          { id: 'interest:1', skill: { id: 'skill:1' } },
          { id: 'interest:2', skill: { id: 'skill:2' } },
        ],
        next: 'url1',
      },
    });
    expect(state.items).toHaveLength(2);

    // Paginate more interests
    state = userSkillInterest(state, {
      type: PAGINATE_USER_SKILL_INTEREST,
      payload: {
        items: [{ id: 'interest:3', skill: { id: 'skill:3' } }],
        next: 'url2',
      },
    });
    expect(state.items).toHaveLength(3);

    // Delete one interest
    state = userSkillInterest(state, {
      type: DELETE_USER_SKILL_INTEREST,
      payload: { skillId: 'skill:2' },
    });
    expect(state.items).toHaveLength(2);
    expect(state.items.find(i => i.skill.id === 'skill:2')).toBeUndefined();
  });
});
