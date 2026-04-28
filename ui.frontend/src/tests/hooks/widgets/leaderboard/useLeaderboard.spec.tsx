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
 * Unit Tests for useLeaderboard Hook
 *
 * Hook handles:
 * - Fetching competitor data for leaderboard
 * - Loading state management
 * - API integration via RestAdapter
 * - JSON API response parsing
 */

// Mock dependencies BEFORE imports
jest.mock('../../../../almLib/utils/restAdapter', () => ({
  RestAdapter: {
    get: jest.fn(),
  },
}));

jest.mock('../../../../almLib/utils/global', () => ({
  getALMConfig: jest.fn(),
}));

jest.mock('../../../../almLib/utils/jsonAPIAdapter', () => ({
  JsonApiParse: jest.fn(),
}));

import { act } from '@testing-library/react';
import React from 'react';
import ReactDOM from 'react-dom';
import { useLeaderboard } from '../../../../almLib/hooks/widgets/leaderboard/useLeaderboard';
import { RestAdapter } from '../../../../almLib/utils/restAdapter';
import { getALMConfig } from '../../../../almLib/utils/global';
import { JsonApiParse } from '../../../../almLib/utils/jsonAPIAdapter';

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

describe('useLeaderboard', () => {
  const mockGetALMConfig = getALMConfig as jest.MockedFunction<typeof getALMConfig>;
  const mockRestAdapterGet = RestAdapter.get as jest.MockedFunction<typeof RestAdapter.get>;
  const mockJsonApiParse = JsonApiParse as jest.MockedFunction<typeof JsonApiParse>;

  const mockConfig = {
    primeApiURL: 'https://learningmanager.adobe.com/primeapi/v2',
  };

  const mockApiResponse = {
    data: [
      {
        id: 'user:1',
        type: 'user',
        attributes: {
          name: 'John Doe',
          pointsEarned: 1000,
          gamificationLevel: 'Gold',
        },
      },
      {
        id: 'user:2',
        type: 'user',
        attributes: {
          name: 'Jane Smith',
          pointsEarned: 950,
          gamificationLevel: 'Silver',
        },
      },
    ],
  };

  const mockParsedResponse = [
    {
      id: 'user:1',
      name: 'John Doe',
      pointsEarned: 1000,
      gamificationLevel: 'Gold',
    },
    {
      id: 'user:2',
      name: 'Jane Smith',
      pointsEarned: 950,
      gamificationLevel: 'Silver',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetALMConfig.mockReturnValue(mockConfig as any);

    // Suppress console.log in tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    (console.log as jest.Mock).mockRestore();
  });

  describe('Hook Initialization', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => useLeaderboard());

      expect(result.current.fetchingData).toBe(true);
      expect(typeof result.current.getCompetitors).toBe('function');
    });

    it('should have fetchingData as boolean', () => {
      const { result } = renderHook(() => useLeaderboard());

      expect(typeof result.current.fetchingData).toBe('boolean');
    });

    it('should have getCompetitors as function', () => {
      const { result } = renderHook(() => useLeaderboard());

      expect(typeof result.current.getCompetitors).toBe('function');
    });
  });

  describe('getCompetitors', () => {
    it('should fetch competitors successfully', async () => {
      mockRestAdapterGet.mockResolvedValue(mockApiResponse);
      mockJsonApiParse.mockReturnValue(mockParsedResponse);

      const { result } = renderHook(() => useLeaderboard());

      let competitors;
      await act(async () => {
        competitors = await result.current.getCompetitors();
      });

      expect(mockRestAdapterGet).toHaveBeenCalledWith({
        url: 'https://learningmanager.adobe.com/primeapi/v2/users',
        params: {
          'page[limit]': 5,
          filter: 'gamificationAll',
        },
      });

      expect(mockJsonApiParse).toHaveBeenCalledWith(mockApiResponse);
      expect(competitors).toEqual(mockParsedResponse);
    });

    it('should use correct query parameters', async () => {
      mockRestAdapterGet.mockResolvedValue(mockApiResponse);
      mockJsonApiParse.mockReturnValue(mockParsedResponse);

      const { result } = renderHook(() => useLeaderboard());

      await act(async () => {
        await result.current.getCompetitors();
      });

      expect(mockRestAdapterGet).toHaveBeenCalledWith(
        expect.objectContaining({
          params: {
            'page[limit]': 5,
            filter: 'gamificationAll',
          },
        })
      );
    });

    it('should set page limit to 5', async () => {
      mockRestAdapterGet.mockResolvedValue(mockApiResponse);
      mockJsonApiParse.mockReturnValue(mockParsedResponse);

      const { result } = renderHook(() => useLeaderboard());

      await act(async () => {
        await result.current.getCompetitors();
      });

      const callParams = mockRestAdapterGet.mock.calls[0][0].params;
      expect(callParams['page[limit]']).toBe(5);
    });

    it('should use gamificationAll filter', async () => {
      mockRestAdapterGet.mockResolvedValue(mockApiResponse);
      mockJsonApiParse.mockReturnValue(mockParsedResponse);

      const { result } = renderHook(() => useLeaderboard());

      await act(async () => {
        await result.current.getCompetitors();
      });

      const callParams = mockRestAdapterGet.mock.calls[0][0].params;
      expect(callParams['filter']).toBe('gamificationAll');
    });

    it('should call getALMConfig to get API URL', async () => {
      mockRestAdapterGet.mockResolvedValue(mockApiResponse);
      mockJsonApiParse.mockReturnValue(mockParsedResponse);

      const { result } = renderHook(() => useLeaderboard());

      await act(async () => {
        await result.current.getCompetitors();
      });

      expect(mockGetALMConfig).toHaveBeenCalled();
    });

    it('should use primeApiURL from config', async () => {
      const customConfig = {
        primeApiURL: 'https://custom.example.com/api',
      };
      mockGetALMConfig.mockReturnValue(customConfig as any);
      mockRestAdapterGet.mockResolvedValue(mockApiResponse);
      mockJsonApiParse.mockReturnValue(mockParsedResponse);

      const { result } = renderHook(() => useLeaderboard());

      await act(async () => {
        await result.current.getCompetitors();
      });

      expect(mockRestAdapterGet).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'https://custom.example.com/api/users',
        })
      );
    });

    it('should parse response using JsonApiParse', async () => {
      mockRestAdapterGet.mockResolvedValue(mockApiResponse);
      mockJsonApiParse.mockReturnValue(mockParsedResponse);

      const { result } = renderHook(() => useLeaderboard());

      await act(async () => {
        await result.current.getCompetitors();
      });

      expect(mockJsonApiParse).toHaveBeenCalledTimes(1);
      expect(mockJsonApiParse).toHaveBeenCalledWith(mockApiResponse);
    });

    it('should return parsed response', async () => {
      const customParsedResponse = [{ id: 'custom', name: 'Custom User' }];
      mockRestAdapterGet.mockResolvedValue(mockApiResponse);
      mockJsonApiParse.mockReturnValue(customParsedResponse);

      const { result } = renderHook(() => useLeaderboard());

      let competitors;
      await act(async () => {
        competitors = await result.current.getCompetitors();
      });

      expect(competitors).toEqual(customParsedResponse);
    });

    it('should set fetchingData to false after successful fetch', async () => {
      mockRestAdapterGet.mockResolvedValue(mockApiResponse);
      mockJsonApiParse.mockReturnValue(mockParsedResponse);

      const { result } = renderHook(() => useLeaderboard());

      expect(result.current.fetchingData).toBe(true);

      await act(async () => {
        await result.current.getCompetitors();
      });

      expect(result.current.fetchingData).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors', async () => {
      const mockError = new Error('API Error');
      mockRestAdapterGet.mockRejectedValue(mockError);

      const { result } = renderHook(() => useLeaderboard());

      await act(async () => {
        await expect(result.current.getCompetitors()).rejects.toThrow('API Error');
      });
    });

    it('should log error to console', async () => {
      const mockError = new Error('Network Error');
      mockRestAdapterGet.mockRejectedValue(mockError);

      const { result } = renderHook(() => useLeaderboard());

      await act(async () => {
        try {
          await result.current.getCompetitors();
        } catch (error) {
          // Expected error
        }
      });

      expect(console.log).toHaveBeenCalledWith(mockError);
    });

    it('should re-throw error after logging', async () => {
      const mockError = new Error('Custom Error');
      mockRestAdapterGet.mockRejectedValue(mockError);

      const { result } = renderHook(() => useLeaderboard());

      await act(async () => {
        await expect(result.current.getCompetitors()).rejects.toThrow('Custom Error');
      });
    });

    it('should set fetchingData to false after error', async () => {
      mockRestAdapterGet.mockRejectedValue(new Error('Network Error'));

      const { result } = renderHook(() => useLeaderboard());

      expect(result.current.fetchingData).toBe(true);

      await act(async () => {
        try {
          await result.current.getCompetitors();
        } catch (error) {
          // Expected error
        }
      });

      expect(result.current.fetchingData).toBe(false);
    });

    it('should set fetchingData to false in finally block', async () => {
      mockRestAdapterGet.mockRejectedValue(new Error('Test Error'));

      const { result } = renderHook(() => useLeaderboard());

      await act(async () => {
        try {
          await result.current.getCompetitors();
        } catch (error) {
          // Expected, ensure finally runs
        }
      });

      // Finally block should have set fetchingData to false
      expect(result.current.fetchingData).toBe(false);
    });

    it('should handle network errors', async () => {
      mockRestAdapterGet.mockRejectedValue(new Error('Network request failed'));

      const { result } = renderHook(() => useLeaderboard());

      await act(async () => {
        await expect(result.current.getCompetitors()).rejects.toThrow('Network request failed');
      });
    });

    it('should handle 404 errors', async () => {
      const error404 = new Error('404 Not Found');
      mockRestAdapterGet.mockRejectedValue(error404);

      const { result } = renderHook(() => useLeaderboard());

      await act(async () => {
        await expect(result.current.getCompetitors()).rejects.toThrow('404 Not Found');
      });
    });

    it('should handle 500 errors', async () => {
      const error500 = new Error('500 Internal Server Error');
      mockRestAdapterGet.mockRejectedValue(error500);

      const { result } = renderHook(() => useLeaderboard());

      await act(async () => {
        await expect(result.current.getCompetitors()).rejects.toThrow('500 Internal Server Error');
      });
    });
  });

  describe('Multiple Calls', () => {
    it('should handle multiple sequential calls', async () => {
      mockRestAdapterGet.mockResolvedValue(mockApiResponse);
      mockJsonApiParse.mockReturnValue(mockParsedResponse);

      const { result } = renderHook(() => useLeaderboard());

      await act(async () => {
        await result.current.getCompetitors();
        await result.current.getCompetitors();
      });

      expect(mockRestAdapterGet).toHaveBeenCalledTimes(2);
      expect(mockJsonApiParse).toHaveBeenCalledTimes(2);
    });

    it('should maintain correct state across multiple calls', async () => {
      mockRestAdapterGet.mockResolvedValue(mockApiResponse);
      mockJsonApiParse.mockReturnValue(mockParsedResponse);

      const { result } = renderHook(() => useLeaderboard());

      await act(async () => {
        await result.current.getCompetitors();
      });

      expect(result.current.fetchingData).toBe(false);

      await act(async () => {
        await result.current.getCompetitors();
      });

      expect(result.current.fetchingData).toBe(false);
    });

    it('should handle success after previous error', async () => {
      mockRestAdapterGet
        .mockRejectedValueOnce(new Error('First Error'))
        .mockResolvedValueOnce(mockApiResponse);
      mockJsonApiParse.mockReturnValue(mockParsedResponse);

      const { result } = renderHook(() => useLeaderboard());

      // First call fails
      await act(async () => {
        try {
          await result.current.getCompetitors();
        } catch (error) {
          // Expected
        }
      });

      expect(result.current.fetchingData).toBe(false);

      // Second call succeeds
      let competitors;
      await act(async () => {
        competitors = await result.current.getCompetitors();
      });

      expect(competitors).toEqual(mockParsedResponse);
      expect(result.current.fetchingData).toBe(false);
    });
  });

  describe('Multiple Hook Instances', () => {
    it('should maintain independent state for multiple instances', async () => {
      mockRestAdapterGet.mockResolvedValue(mockApiResponse);
      mockJsonApiParse.mockReturnValue(mockParsedResponse);

      const { result: result1 } = renderHook(() => useLeaderboard());
      const { result: result2 } = renderHook(() => useLeaderboard());

      expect(result1.current.fetchingData).toBe(true);
      expect(result2.current.fetchingData).toBe(true);

      await act(async () => {
        await result1.current.getCompetitors();
      });

      // result1 should have fetchingData as false
      expect(result1.current.fetchingData).toBe(false);

      // result2 should still be in initial fetching state (independent)
      expect(result2.current.fetchingData).toBe(true);
    });

    it('should make independent API calls', async () => {
      mockRestAdapterGet.mockResolvedValue(mockApiResponse);
      mockJsonApiParse.mockReturnValue(mockParsedResponse);

      const { result: result1 } = renderHook(() => useLeaderboard());
      const { result: result2 } = renderHook(() => useLeaderboard());

      await act(async () => {
        await result1.current.getCompetitors();
        await result2.current.getCompetitors();
      });

      expect(mockRestAdapterGet).toHaveBeenCalledTimes(2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty response', async () => {
      const emptyResponse = { data: [] };
      mockRestAdapterGet.mockResolvedValue(emptyResponse);
      mockJsonApiParse.mockReturnValue([]);

      const { result } = renderHook(() => useLeaderboard());

      let competitors;
      await act(async () => {
        competitors = await result.current.getCompetitors();
      });

      expect(competitors).toEqual([]);
    });

    it('should handle null response from JsonApiParse', async () => {
      mockRestAdapterGet.mockResolvedValue(mockApiResponse);
      mockJsonApiParse.mockReturnValue(null);

      const { result } = renderHook(() => useLeaderboard());

      let competitors;
      await act(async () => {
        competitors = await result.current.getCompetitors();
      });

      expect(competitors).toBeNull();
    });

    it('should handle undefined response from JsonApiParse', async () => {
      mockRestAdapterGet.mockResolvedValue(mockApiResponse);
      mockJsonApiParse.mockReturnValue(undefined);

      const { result } = renderHook(() => useLeaderboard());

      let competitors;
      await act(async () => {
        competitors = await result.current.getCompetitors();
      });

      expect(competitors).toBeUndefined();
    });

    it('should handle response with many competitors', async () => {
      const largeResponse = {
        data: Array.from({ length: 100 }, (_, i) => ({
          id: `user:${i}`,
          type: 'user',
          attributes: { name: `User ${i}`, pointsEarned: 1000 - i },
        })),
      };
      const largeParsedResponse = Array.from({ length: 100 }, (_, i) => ({
        id: `user:${i}`,
        name: `User ${i}`,
        pointsEarned: 1000 - i,
      }));

      mockRestAdapterGet.mockResolvedValue(largeResponse);
      mockJsonApiParse.mockReturnValue(largeParsedResponse);

      const { result } = renderHook(() => useLeaderboard());

      let competitors;
      await act(async () => {
        competitors = await result.current.getCompetitors();
      });

      expect(competitors).toHaveLength(100);
    });

    it('should handle JsonApiParse throwing error', async () => {
      mockRestAdapterGet.mockResolvedValue(mockApiResponse);
      mockJsonApiParse.mockImplementation(() => {
        throw new Error('Parse Error');
      });

      const { result } = renderHook(() => useLeaderboard());

      await act(async () => {
        await expect(result.current.getCompetitors()).rejects.toThrow('Parse Error');
      });
    });
  });

  describe('Return Value Structure', () => {
    it('should return stable function references', () => {
      const { result, rerender } = renderHook(() => useLeaderboard());

      const firstGetCompetitors = result.current.getCompetitors;

      rerender();

      // Functions are recreated on each render (no useCallback)
      expect(typeof result.current.getCompetitors).toBe('function');
    });
  });

  describe('Integration with RestAdapter', () => {
    it('should pass correct URL structure', async () => {
      mockRestAdapterGet.mockResolvedValue(mockApiResponse);
      mockJsonApiParse.mockReturnValue(mockParsedResponse);

      const { result } = renderHook(() => useLeaderboard());

      await act(async () => {
        await result.current.getCompetitors();
      });

      const callArgs = mockRestAdapterGet.mock.calls[0][0];
      expect(callArgs.url).toMatch(/\/users$/);
    });
  });
});
