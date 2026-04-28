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
 * Unit Tests for useLeaderBoard Hook
 * 
 * Hook handles:
 * - Checking if gamification is enabled for a training instance
 * - Fetching leaderboard results with limit
 * - Fetching current user's rank
 * - Fetching gamification rules/settings
 * - Managing leaderboard state
 * - Integration with RestAdapter for API calls
 */

// Mock dependencies BEFORE imports
jest.mock('../../../almLib/utils/global', () => ({
  getALMConfig: jest.fn(),
}));

jest.mock('../../../almLib/utils/restAdapter', () => ({
  RestAdapter: {
    get: jest.fn(),
  },
}));

jest.mock('../../../almLib/utils/jsonAPIAdapter', () => ({
  JsonApiParse: jest.fn(),
}));

import { act } from '@testing-library/react';
import React from 'react';
import ReactDOM from 'react-dom';
import { useLeaderBoard } from '../../../almLib/hooks/lpLeaderBoard/useLeaderBoard';
import { getALMConfig } from '../../../almLib/utils/global';
import { RestAdapter } from '../../../almLib/utils/restAdapter';
import { JsonApiParse } from '../../../almLib/utils/jsonAPIAdapter';

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

describe('useLeaderBoard', () => {
  const mockGetALMConfig = getALMConfig as jest.MockedFunction<typeof getALMConfig>;
  const mockRestAdapterGet = RestAdapter.get as jest.MockedFunction<typeof RestAdapter.get>;
  const mockJsonApiParse = JsonApiParse as jest.MockedFunction<typeof JsonApiParse>;

  const mockConfig = {
    primeApiURL: 'https://learningmanager.adobe.com/primeapi/v2/',
  };

  const mockTraining = {
    id: 'course:123',
    type: 'learningObject',
    attributes: {
      name: 'Test Course',
    },
  };

  const mockTrainingInstance = {
    id: 'instance:456',
    type: 'learningObjectInstance',
    attributes: {
      gamificationEnabled: true,
    },
  };

  const mockLeaderBoardUser = {
    id: 'user:789',
    name: 'John Doe',
    points: 100,
    rank: 1,
  };

  const mockLeaderBoardList = [
    mockLeaderBoardUser,
    { id: 'user:790', name: 'Jane Smith', points: 90, rank: 2 },
    { id: 'user:791', name: 'Bob Johnson', points: 80, rank: 3 },
  ];

  const mockGamificationSettings = [
    {
      id: 'setting:1',
      type: 'gamificationSetting',
      attributes: {
        name: 'Complete Course',
        points: 10,
      },
    },
    {
      id: 'setting:2',
      type: 'gamificationSetting',
      attributes: {
        name: 'Pass Quiz',
        points: 5,
      },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetALMConfig.mockReturnValue(mockConfig as any);
    mockJsonApiParse.mockImplementation((data: any) => data);
  });

  describe('Hook Initialization', () => {
    it('should initialize with empty leaderBoardList', async () => {
      mockRestAdapterGet.mockResolvedValue({
        learningObjectInstance: { gamificationEnabled: false },
      });

      let result;
      await act(async () => {
        result = renderHook(() => useLeaderBoard(mockTraining as any, mockTrainingInstance as any));
      });

      expect(result.result.current.leaderBoardList).toEqual([]);
    });

    it('should initialize with empty currentUser', async () => {
      mockRestAdapterGet.mockResolvedValue({
        learningObjectInstance: { gamificationEnabled: false },
      });

      let result;
      await act(async () => {
        result = renderHook(() => useLeaderBoard(mockTraining as any, mockTrainingInstance as any));
      });

      expect(result.result.current.currentUser).toEqual({});
    });

    it('should initialize with isGamificationEnabled false', async () => {
      mockRestAdapterGet.mockResolvedValue({
        learningObjectInstance: { gamificationEnabled: false },
      });

      let result;
      await act(async () => {
        result = renderHook(() => useLeaderBoard(mockTraining as any, mockTrainingInstance as any));
      });

      expect(result.result.current.isGamificationEnabled).toBe(false);
    });

    it('should initialize with empty gamificationRules', async () => {
      mockRestAdapterGet.mockResolvedValue({
        learningObjectInstance: { gamificationEnabled: false },
      });

      let result;
      await act(async () => {
        result = renderHook(() => useLeaderBoard(mockTraining as any, mockTrainingInstance as any));
      });

      expect(result.result.current.gamificationRules).toEqual([]);
    });
  });

  describe('useEffect - Check Gamification Enabled', () => {
    it('should check if gamification is enabled on mount', async () => {
      mockRestAdapterGet.mockResolvedValue({
        learningObjectInstance: { gamificationEnabled: true },
      });

      await act(async () => {
        renderHook(() => useLeaderBoard(mockTraining as any, mockTrainingInstance as any));
      });

      expect(mockRestAdapterGet).toHaveBeenCalledWith({
        url: 'https://learningmanager.adobe.com/primeapi/v2/learningObjects/course:123/instances/instance:456',
        headers: { 'content-type': 'application/json' },
        params: {},
      });
    });

    it('should set isGamificationEnabled to true when enabled', async () => {
      mockRestAdapterGet.mockResolvedValue({
        learningObjectInstance: { gamificationEnabled: true },
      });

      let result;
      await act(async () => {
        result = renderHook(() => useLeaderBoard(mockTraining as any, mockTrainingInstance as any));
      });

      expect(result.result.current.isGamificationEnabled).toBe(true);
    });

    it('should set isGamificationEnabled to false when disabled', async () => {
      mockRestAdapterGet.mockResolvedValue({
        learningObjectInstance: { gamificationEnabled: false },
      });

      let result;
      await act(async () => {
        result = renderHook(() => useLeaderBoard(mockTraining as any, mockTrainingInstance as any));
      });

      expect(result.result.current.isGamificationEnabled).toBe(false);
    });

    it('should use correct instance endpoint', async () => {
      mockRestAdapterGet.mockResolvedValue({
        learningObjectInstance: { gamificationEnabled: false },
      });

      await act(async () => {
        renderHook(() => useLeaderBoard(mockTraining as any, mockTrainingInstance as any));
      });

      const callArgs = mockRestAdapterGet.mock.calls[0][0];
      expect(callArgs.url).toContain('/learningObjects/course:123/instances/instance:456');
    });
  });

  describe('useEffect - Fetch Data When Gamification Enabled', () => {
    it('should fetch leaderboard, rules, and current user when gamification is enabled', async () => {
      mockRestAdapterGet
        .mockResolvedValueOnce({
          learningObjectInstance: { gamificationEnabled: true },
        })
        .mockResolvedValueOnce({
          leaderBoardUserList: mockLeaderBoardList,
        })
        .mockResolvedValueOnce({
          gamificationSettingsList: mockGamificationSettings,
        })
        .mockResolvedValueOnce({
          leaderBoardUser: mockLeaderBoardUser,
        });

      await act(async () => {
        renderHook(() => useLeaderBoard(mockTraining as any, mockTrainingInstance as any));
      });

      // Should call RestAdapter 4 times: 
      // 1. Check gamification enabled
      // 2. Fetch leaderboard
      // 3. Fetch rules
      // 4. Fetch current user rank
      expect(mockRestAdapterGet).toHaveBeenCalledTimes(4);
    });

    it('should not fetch data when gamification is disabled', async () => {
      mockRestAdapterGet.mockResolvedValue({
        learningObjectInstance: { gamificationEnabled: false },
      });

      await act(async () => {
        renderHook(() => useLeaderBoard(mockTraining as any, mockTrainingInstance as any));
      });

      // Should only call RestAdapter once to check gamification enabled
      expect(mockRestAdapterGet).toHaveBeenCalledTimes(1);
    });

    it('should set leaderBoardList when gamification is enabled', async () => {
      mockRestAdapterGet
        .mockResolvedValueOnce({
          learningObjectInstance: { gamificationEnabled: true },
        })
        .mockResolvedValueOnce({
          leaderBoardUserList: mockLeaderBoardList,
        })
        .mockResolvedValueOnce({
          gamificationSettingsList: mockGamificationSettings,
        })
        .mockResolvedValueOnce({
          leaderBoardUser: mockLeaderBoardUser,
        });

      let result;
      await act(async () => {
        result = renderHook(() => useLeaderBoard(mockTraining as any, mockTrainingInstance as any));
      });

      expect(result.result.current.leaderBoardList).toEqual(mockLeaderBoardList);
    });

    it('should set gamificationRules when gamification is enabled', async () => {
      mockRestAdapterGet
        .mockResolvedValueOnce({
          learningObjectInstance: { gamificationEnabled: true },
        })
        .mockResolvedValueOnce({
          leaderBoardUserList: mockLeaderBoardList,
        })
        .mockResolvedValueOnce({
          gamificationSettingsList: mockGamificationSettings,
        })
        .mockResolvedValueOnce({
          leaderBoardUser: mockLeaderBoardUser,
        });

      let result;
      await act(async () => {
        result = renderHook(() => useLeaderBoard(mockTraining as any, mockTrainingInstance as any));
      });

      expect(result.result.current.gamificationRules).toEqual(mockGamificationSettings);
    });

    it('should set currentUser when gamification is enabled', async () => {
      mockRestAdapterGet
        .mockResolvedValueOnce({
          learningObjectInstance: { gamificationEnabled: true },
        })
        .mockResolvedValueOnce({
          leaderBoardUserList: mockLeaderBoardList,
        })
        .mockResolvedValueOnce({
          gamificationSettingsList: mockGamificationSettings,
        })
        .mockResolvedValueOnce({
          leaderBoardUser: mockLeaderBoardUser,
        });

      let result;
      await act(async () => {
        result = renderHook(() => useLeaderBoard(mockTraining as any, mockTrainingInstance as any));
      });

      expect(result.result.current.currentUser).toEqual(mockLeaderBoardUser);
    });
  });

  describe('getResponse', () => {
    it('should use RestAdapter.get for API calls', async () => {
      mockRestAdapterGet.mockResolvedValue({
        learningObjectInstance: { gamificationEnabled: false },
      });

      await act(async () => {
        renderHook(() => useLeaderBoard(mockTraining as any, mockTrainingInstance as any));
      });

      expect(mockRestAdapterGet).toHaveBeenCalled();
    });

    it('should use correct headers', async () => {
      mockRestAdapterGet.mockResolvedValue({
        learningObjectInstance: { gamificationEnabled: false },
      });

      await act(async () => {
        renderHook(() => useLeaderBoard(mockTraining as any, mockTrainingInstance as any));
      });

      const callArgs = mockRestAdapterGet.mock.calls[0][0];
      expect(callArgs.headers).toEqual({ 'content-type': 'application/json' });
    });

    it('should parse response with JsonApiParse', async () => {
      mockRestAdapterGet.mockResolvedValue({
        learningObjectInstance: { gamificationEnabled: false },
      });

      await act(async () => {
        renderHook(() => useLeaderBoard(mockTraining as any, mockTrainingInstance as any));
      });

      expect(mockJsonApiParse).toHaveBeenCalled();
    });

    it('should pass query params when provided', async () => {
      mockRestAdapterGet
        .mockResolvedValueOnce({
          learningObjectInstance: { gamificationEnabled: true },
        })
        .mockResolvedValueOnce({
          leaderBoardUserList: mockLeaderBoardList,
        })
        .mockResolvedValueOnce({
          gamificationSettingsList: mockGamificationSettings,
        })
        .mockResolvedValueOnce({
          leaderBoardUser: mockLeaderBoardUser,
        });

      await act(async () => {
        renderHook(() => useLeaderBoard(mockTraining as any, mockTrainingInstance as any));
      });

      // Check the leaderboard call which includes limit param
      const leaderboardCall = mockRestAdapterGet.mock.calls.find((call) =>
        call[0].url.includes('/leaderboard')
      );
      expect(leaderboardCall![0].params['page[limit]']).toBe(5);
    });
  });

  describe('fetchLeaderBoardResults', () => {
    it('should fetch leaderboard with limit', async () => {
      mockRestAdapterGet
        .mockResolvedValueOnce({
          learningObjectInstance: { gamificationEnabled: true },
        })
        .mockResolvedValueOnce({
          leaderBoardUserList: mockLeaderBoardList,
        })
        .mockResolvedValueOnce({
          gamificationSettingsList: mockGamificationSettings,
        })
        .mockResolvedValueOnce({
          leaderBoardUser: mockLeaderBoardUser,
        });

      await act(async () => {
        renderHook(() => useLeaderBoard(mockTraining as any, mockTrainingInstance as any));
      });

      const leaderboardCall = mockRestAdapterGet.mock.calls.find((call) =>
        call[0].url.endsWith('/leaderboard')
      );
      expect(leaderboardCall![0].params['page[limit]']).toBe(5);
    });

    it('should use correct leaderboard endpoint', async () => {
      mockRestAdapterGet
        .mockResolvedValueOnce({
          learningObjectInstance: { gamificationEnabled: true },
        })
        .mockResolvedValueOnce({
          leaderBoardUserList: mockLeaderBoardList,
        })
        .mockResolvedValueOnce({
          gamificationSettingsList: mockGamificationSettings,
        })
        .mockResolvedValueOnce({
          leaderBoardUser: mockLeaderBoardUser,
        });

      await act(async () => {
        renderHook(() => useLeaderBoard(mockTraining as any, mockTrainingInstance as any));
      });

      const leaderboardCall = mockRestAdapterGet.mock.calls.find((call) =>
        call[0].url.includes('/leaderboard')
      );
      expect(leaderboardCall![0].url).toContain('/learningObjects/course:123/instances/instance:456/leaderboard');
    });
  });

  describe('fetchCurrentUserRank', () => {
    it('should use correct myRank endpoint', async () => {
      mockRestAdapterGet
        .mockResolvedValueOnce({
          learningObjectInstance: { gamificationEnabled: true },
        })
        .mockResolvedValueOnce({
          leaderBoardUserList: mockLeaderBoardList,
        })
        .mockResolvedValueOnce({
          gamificationSettingsList: mockGamificationSettings,
        })
        .mockResolvedValueOnce({
          leaderBoardUser: mockLeaderBoardUser,
        });

      await act(async () => {
        renderHook(() => useLeaderBoard(mockTraining as any, mockTrainingInstance as any));
      });

      const myRankCall = mockRestAdapterGet.mock.calls.find((call) =>
        call[0].url.includes('/myRank')
      );
      expect(myRankCall![0].url).toContain('/learningObjects/course:123/instances/instance:456/leaderboard/myRank');
    });

    it('should set currentUser from response', async () => {
      const customUser = { id: 'user:999', name: 'Custom User', points: 150, rank: 1 };
      mockRestAdapterGet
        .mockResolvedValueOnce({
          learningObjectInstance: { gamificationEnabled: true },
        })
        .mockResolvedValueOnce({
          leaderBoardUserList: mockLeaderBoardList,
        })
        .mockResolvedValueOnce({
          gamificationSettingsList: mockGamificationSettings,
        })
        .mockResolvedValueOnce({
          leaderBoardUser: customUser,
        });

      let result;
      await act(async () => {
        result = renderHook(() => useLeaderBoard(mockTraining as any, mockTrainingInstance as any));
      });

      expect(result.result.current.currentUser).toEqual(customUser);
    });
  });

  describe('fetchLoRules', () => {
    it('should use correct gamificationSettings endpoint', async () => {
      mockRestAdapterGet
        .mockResolvedValueOnce({
          learningObjectInstance: { gamificationEnabled: true },
        })
        .mockResolvedValueOnce({
          leaderBoardUserList: mockLeaderBoardList,
        })
        .mockResolvedValueOnce({
          gamificationSettingsList: mockGamificationSettings,
        })
        .mockResolvedValueOnce({
          leaderBoardUser: mockLeaderBoardUser,
        });

      await act(async () => {
        renderHook(() => useLeaderBoard(mockTraining as any, mockTrainingInstance as any));
      });

      const rulesCall = mockRestAdapterGet.mock.calls.find((call) =>
        call[0].url.includes('/gamificationSettings')
      );
      expect(rulesCall![0].url).toContain('/learningObjects/course:123/instances/instance:456/gamificationSettings');
    });

    it('should set gamificationRules from response', async () => {
      const customRules = [
        { id: 'setting:3', type: 'gamificationSetting', attributes: { name: 'Custom Rule', points: 20 } },
      ];
      mockRestAdapterGet
        .mockResolvedValueOnce({
          learningObjectInstance: { gamificationEnabled: true },
        })
        .mockResolvedValueOnce({
          leaderBoardUserList: mockLeaderBoardList,
        })
        .mockResolvedValueOnce({
          gamificationSettingsList: customRules,
        })
        .mockResolvedValueOnce({
          leaderBoardUser: mockLeaderBoardUser,
        });

      let result;
      await act(async () => {
        result = renderHook(() => useLeaderBoard(mockTraining as any, mockTrainingInstance as any));
      });

      expect(result.result.current.gamificationRules).toEqual(customRules);
    });
  });

  describe('Constants', () => {
    it('should use LEARNER_LIMIT of 5', async () => {
      mockRestAdapterGet
        .mockResolvedValueOnce({
          learningObjectInstance: { gamificationEnabled: true },
        })
        .mockResolvedValueOnce({
          leaderBoardUserList: mockLeaderBoardList,
        })
        .mockResolvedValueOnce({
          gamificationSettingsList: mockGamificationSettings,
        })
        .mockResolvedValueOnce({
          leaderBoardUser: mockLeaderBoardUser,
        });

      await act(async () => {
        renderHook(() => useLeaderBoard(mockTraining as any, mockTrainingInstance as any));
      });

      const leaderboardCall = mockRestAdapterGet.mock.calls.find((call) =>
        call[0].url.endsWith('/leaderboard')
      );
      expect(leaderboardCall![0].params['page[limit]']).toBe(5);
    });

    it('should use baseApiUrl from config', async () => {
      mockRestAdapterGet.mockResolvedValue({
        learningObjectInstance: { gamificationEnabled: false },
      });

      await act(async () => {
        renderHook(() => useLeaderBoard(mockTraining as any, mockTrainingInstance as any));
      });

      expect(mockGetALMConfig).toHaveBeenCalled();
      const callUrl = mockRestAdapterGet.mock.calls[0][0].url;
      expect(callUrl).toContain('https://learningmanager.adobe.com/primeapi/v2/');
    });
  });
});

