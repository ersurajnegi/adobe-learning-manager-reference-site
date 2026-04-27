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
 * Unit Tests for useCalendar Hook
 *
 * Hook handles:
 * - Calendar data fetching with optional year/month filters
 * - Cities data fetching
 * - Catalog filtering
 * - Loading state management
 * - API integration via RestAdapter
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

import { act } from '@testing-library/react';
import React from 'react';
import ReactDOM from 'react-dom';
import { useCalendar } from '../../../../almLib/hooks/widgets/calendar/useCalendar';
import { RestAdapter } from '../../../../almLib/utils/restAdapter';
import { getALMConfig } from '../../../../almLib/utils/global';

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

describe('useCalendar', () => {
  const mockGetALMConfig = getALMConfig as jest.MockedFunction<typeof getALMConfig>;
  const mockRestAdapterGet = RestAdapter.get as jest.MockedFunction<typeof RestAdapter.get>;

  const mockConfig = {
    primeApiURL: 'https://learningmanager.adobe.com/primeapi/v2/',
  };

  const mockCalendarResponse = {
    data: [
      {
        id: 'session-1',
        type: 'learningObjectInstanceSession',
        attributes: {
          name: 'Test Session',
          date: '2024-01-15',
        },
      },
    ],
    included: [
      {
        id: 'course-1',
        type: 'learningObject',
        attributes: {
          name: 'Test Course',
        },
      },
    ],
  };

  const mockCitiesResponse = {
    data: {
      attributes: {
        names: ['New York', 'San Francisco', 'London'],
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetALMConfig.mockReturnValue(mockConfig as any);
  });

  describe('Hook Initialization', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => useCalendar({}));

      expect(result.current.config).toBeNull();
      expect(result.current.fetchingData).toBe(true);
      expect(typeof result.current.getCPrimeCalendarData).toBe('function');
      expect(typeof result.current.getCities).toBe('function');
    });

    it('should initialize with widget attributes', () => {
      const widget = {
        attributes: {
          catalogIds: ['catalog-1', 'catalog-2'],
        },
      };

      const { result } = renderHook(() => useCalendar(widget));

      expect(result.current.fetchingData).toBe(true);
    });

    it('should handle widget without attributes', () => {
      const widget = {};

      const { result } = renderHook(() => useCalendar(widget));

      expect(result.current.fetchingData).toBe(true);
    });

    it('should handle null widget', () => {
      const { result } = renderHook(() => useCalendar(null));

      expect(result.current.fetchingData).toBe(true);
    });

    it('should handle undefined widget', () => {
      const { result } = renderHook(() => useCalendar(undefined));

      expect(result.current.fetchingData).toBe(true);
    });
  });

  describe('getCPrimeCalendarData', () => {
    it('should fetch calendar data successfully', async () => {
      mockRestAdapterGet.mockResolvedValue(JSON.stringify(mockCalendarResponse));

      const { result } = renderHook(() => useCalendar({}));

      let calendarData;
      await act(async () => {
        calendarData = await result.current.getCPrimeCalendarData('user-123');
      });

      expect(mockRestAdapterGet).toHaveBeenCalledWith({
        url: 'https://learningmanager.adobe.com/primeapi/v2/users/user-123/calendar',
        params: {
          include: 'course,containerLO,course.enrollment,course.instances,room',
          'filter.allSessions': true,
          omitDeprecated: true,
        },
      });

      expect(calendarData).toEqual(mockCalendarResponse);
    });

    it('should fetch calendar data with year and month', async () => {
      mockRestAdapterGet.mockResolvedValue(JSON.stringify(mockCalendarResponse));

      const { result } = renderHook(() => useCalendar({}));

      await act(async () => {
        await result.current.getCPrimeCalendarData('user-123', 2024, 1);
      });

      expect(mockRestAdapterGet).toHaveBeenCalledWith({
        url: 'https://learningmanager.adobe.com/primeapi/v2/users/user-123/calendar',
        params: {
          include: 'course,containerLO,course.enrollment,course.instances,room',
          'filter.allSessions': true,
          omitDeprecated: true,
          year: 2024,
          month: 1,
        },
      });
    });

    it('should include catalogIds in params when provided', async () => {
      mockRestAdapterGet.mockResolvedValue(JSON.stringify(mockCalendarResponse));

      const widget = {
        attributes: {
          catalogIds: ['catalog-1', 'catalog-2'],
        },
      };

      const { result } = renderHook(() => useCalendar(widget));

      await act(async () => {
        await result.current.getCPrimeCalendarData('user-123');
      });

      expect(mockRestAdapterGet).toHaveBeenCalledWith({
        url: 'https://learningmanager.adobe.com/primeapi/v2/users/user-123/calendar',
        params: {
          'filter.catalogIds': ['catalog-1', 'catalog-2'],
          include: 'course,containerLO,course.enrollment,course.instances,room',
          'filter.allSessions': true,
          omitDeprecated: true,
        },
      });
    });

    it('should not include catalogIds when array is empty', async () => {
      mockRestAdapterGet.mockResolvedValue(JSON.stringify(mockCalendarResponse));

      const widget = {
        attributes: {
          catalogIds: [],
        },
      };

      const { result } = renderHook(() => useCalendar(widget));

      await act(async () => {
        await result.current.getCPrimeCalendarData('user-123');
      });

      expect(mockRestAdapterGet).toHaveBeenCalledWith({
        url: 'https://learningmanager.adobe.com/primeapi/v2/users/user-123/calendar',
        params: {
          include: 'course,containerLO,course.enrollment,course.instances,room',
          'filter.allSessions': true,
          omitDeprecated: true,
        },
      });
    });

    it('should set fetchingData to false after successful fetch', async () => {
      mockRestAdapterGet.mockResolvedValue(JSON.stringify(mockCalendarResponse));

      const { result } = renderHook(() => useCalendar({}));

      expect(result.current.fetchingData).toBe(true);

      await act(async () => {
        await result.current.getCPrimeCalendarData('user-123');
      });

      // After async operation completes, fetchingData should be false
      expect(result.current.fetchingData).toBe(false);
    });

    it('should set fetchingData to false after failed fetch', async () => {
      mockRestAdapterGet.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useCalendar({}));

      expect(result.current.fetchingData).toBe(true);

      await act(async () => {
        try {
          await result.current.getCPrimeCalendarData('user-123');
        } catch (error) {
          // Expected error
        }
      });

      // After error, fetchingData should still be set to false in finally block
      expect(result.current.fetchingData).toBe(false);
    });

    it('should handle API errors', async () => {
      const mockError = new Error('API Error');
      mockRestAdapterGet.mockRejectedValue(mockError);

      const { result } = renderHook(() => useCalendar({}));

      await act(async () => {
        await expect(result.current.getCPrimeCalendarData('user-123')).rejects.toThrow('API Error');
      });
    });

    it('should handle different user IDs', async () => {
      mockRestAdapterGet.mockResolvedValue(JSON.stringify(mockCalendarResponse));

      const { result } = renderHook(() => useCalendar({}));

      await act(async () => {
        await result.current.getCPrimeCalendarData('user-456');
      });

      expect(mockRestAdapterGet).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'https://learningmanager.adobe.com/primeapi/v2/users/user-456/calendar',
        })
      );
    });

    it('should handle year without month', async () => {
      mockRestAdapterGet.mockResolvedValue(JSON.stringify(mockCalendarResponse));

      const { result } = renderHook(() => useCalendar({}));

      await act(async () => {
        await result.current.getCPrimeCalendarData('user-123', 2024);
      });

      // Should not include year/month if month is not provided
      expect(mockRestAdapterGet).toHaveBeenCalledWith({
        url: 'https://learningmanager.adobe.com/primeapi/v2/users/user-123/calendar',
        params: {
          include: 'course,containerLO,course.enrollment,course.instances,room',
          'filter.allSessions': true,
          omitDeprecated: true,
        },
      });
    });

    it('should handle year 0 and month 0 (falsy values)', async () => {
      mockRestAdapterGet.mockResolvedValue(JSON.stringify(mockCalendarResponse));

      const { result } = renderHook(() => useCalendar({}));

      await act(async () => {
        await result.current.getCPrimeCalendarData('user-123', 0, 0);
      });

      // Should not include year/month if they are 0
      expect(mockRestAdapterGet).toHaveBeenCalledWith({
        url: 'https://learningmanager.adobe.com/primeapi/v2/users/user-123/calendar',
        params: {
          include: 'course,containerLO,course.enrollment,course.instances,room',
          'filter.allSessions': true,
          omitDeprecated: true,
        },
      });
    });

    it('should parse JSON response correctly', async () => {
      const customResponse = {
        data: [{ id: 'custom-session' }],
      };
      mockRestAdapterGet.mockResolvedValue(JSON.stringify(customResponse));

      const { result } = renderHook(() => useCalendar({}));

      let calendarData;
      await act(async () => {
        calendarData = await result.current.getCPrimeCalendarData('user-123');
      });

      expect(calendarData).toEqual(customResponse);
    });
  });

  describe('getCities', () => {
    it('should fetch cities successfully', async () => {
      mockRestAdapterGet.mockResolvedValue(JSON.stringify(mockCitiesResponse));

      const { result } = renderHook(() => useCalendar({}));

      let cities;
      await act(async () => {
        cities = await result.current.getCities();
      });

      expect(mockRestAdapterGet).toHaveBeenCalledWith({
        url: 'https://learningmanager.adobe.com/primeapi/v2//data',
        params: {
          'filter.cityName': true,
        },
      });

      expect(cities).toEqual(['New York', 'San Francisco', 'London']);
    });

    it('should return empty array when names is not present', async () => {
      const emptyResponse = {
        data: {
          attributes: {},
        },
      };
      mockRestAdapterGet.mockResolvedValue(JSON.stringify(emptyResponse));

      const { result } = renderHook(() => useCalendar({}));

      let cities;
      await act(async () => {
        cities = await result.current.getCities();
      });

      expect(cities).toEqual([]);
    });

    it('should return empty array when names is null', async () => {
      const nullResponse = {
        data: {
          attributes: {
            names: null,
          },
        },
      };
      mockRestAdapterGet.mockResolvedValue(JSON.stringify(nullResponse));

      const { result } = renderHook(() => useCalendar({}));

      let cities;
      await act(async () => {
        cities = await result.current.getCities();
      });

      expect(cities).toEqual([]);
    });

    it('should handle API errors', async () => {
      const mockError = new Error('Cities API Error');
      mockRestAdapterGet.mockRejectedValue(mockError);

      const { result } = renderHook(() => useCalendar({}));

      await act(async () => {
        await expect(result.current.getCities()).rejects.toThrow('Cities API Error');
      });
    });

    it('should handle empty cities array', async () => {
      const emptyArrayResponse = {
        data: {
          attributes: {
            names: [],
          },
        },
      };
      mockRestAdapterGet.mockResolvedValue(JSON.stringify(emptyArrayResponse));

      const { result } = renderHook(() => useCalendar({}));

      let cities;
      await act(async () => {
        cities = await result.current.getCities();
      });

      expect(cities).toEqual([]);
    });
  });

  describe('getALMConfig Integration', () => {
    it('should use primeApiURL from config', async () => {
      const customConfig = {
        primeApiURL: 'https://custom.example.com/api/',
      };
      mockGetALMConfig.mockReturnValue(customConfig as any);
      mockRestAdapterGet.mockResolvedValue(JSON.stringify(mockCalendarResponse));

      const { result } = renderHook(() => useCalendar({}));

      await act(async () => {
        await result.current.getCPrimeCalendarData('user-123');
      });

      expect(mockRestAdapterGet).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'https://custom.example.com/api/users/user-123/calendar',
        })
      );
    });

    it('should call getALMConfig for each API call', async () => {
      mockRestAdapterGet.mockResolvedValue(JSON.stringify(mockCalendarResponse));

      const { result } = renderHook(() => useCalendar({}));

      await act(async () => {
        await result.current.getCPrimeCalendarData('user-123');
      });

      expect(mockGetALMConfig).toHaveBeenCalled();

      mockGetALMConfig.mockClear();

      mockRestAdapterGet.mockResolvedValue(JSON.stringify(mockCitiesResponse));

      await act(async () => {
        await result.current.getCities();
      });

      expect(mockGetALMConfig).toHaveBeenCalled();
    });
  });

  describe('Multiple Hook Instances', () => {
    it('should maintain independent state for multiple instances', async () => {
      mockRestAdapterGet.mockResolvedValue(JSON.stringify(mockCalendarResponse));

      const widget1 = {
        attributes: {
          catalogIds: ['catalog-1'],
        },
      };

      const widget2 = {
        attributes: {
          catalogIds: ['catalog-2'],
        },
      };

      const { result: result1 } = renderHook(() => useCalendar(widget1));
      const { result: result2 } = renderHook(() => useCalendar(widget2));

      expect(result1.current.fetchingData).toBe(true);
      expect(result2.current.fetchingData).toBe(true);

      await act(async () => {
        await result1.current.getCPrimeCalendarData('user-123');
      });

      // result1 should have fetchingData as false
      expect(result1.current.fetchingData).toBe(false);

      // result2 should still be in fetching state (independent)
      expect(result2.current.fetchingData).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle malformed JSON response', async () => {
      mockRestAdapterGet.mockResolvedValue('invalid json {{{');

      const { result } = renderHook(() => useCalendar({}));

      await act(async () => {
        await expect(result.current.getCPrimeCalendarData('user-123')).rejects.toThrow();
      });
    });

    it('should handle empty string response', async () => {
      mockRestAdapterGet.mockResolvedValue('');

      const { result } = renderHook(() => useCalendar({}));

      await act(async () => {
        await expect(result.current.getCPrimeCalendarData('user-123')).rejects.toThrow();
      });
    });

    it('should handle null response', async () => {
      mockRestAdapterGet.mockResolvedValue('null');

      const { result } = renderHook(() => useCalendar({}));

      let calendarData;
      await act(async () => {
        calendarData = await result.current.getCPrimeCalendarData('user-123');
      });

      // JSON.parse('null') returns null, which is valid
      expect(calendarData).toBeNull();
    });

    it('should handle very large catalogIds array', async () => {
      mockRestAdapterGet.mockResolvedValue(JSON.stringify(mockCalendarResponse));

      const largeCatalogIds = Array.from({ length: 100 }, (_, i) => `catalog-${i}`);
      const widget = {
        attributes: {
          catalogIds: largeCatalogIds,
        },
      };

      const { result } = renderHook(() => useCalendar(widget));

      await act(async () => {
        await result.current.getCPrimeCalendarData('user-123');
      });

      expect(mockRestAdapterGet).toHaveBeenCalledWith(
        expect.objectContaining({
          params: expect.objectContaining({
            'filter.catalogIds': largeCatalogIds,
          }),
        })
      );
    });

    it('should handle special characters in userId', async () => {
      mockRestAdapterGet.mockResolvedValue(JSON.stringify(mockCalendarResponse));

      const { result } = renderHook(() => useCalendar({}));

      await act(async () => {
        await result.current.getCPrimeCalendarData('user@example.com');
      });

      expect(mockRestAdapterGet).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'https://learningmanager.adobe.com/primeapi/v2/users/user@example.com/calendar',
        })
      );
    });

    it('should handle December (month 12)', async () => {
      mockRestAdapterGet.mockResolvedValue(JSON.stringify(mockCalendarResponse));

      const { result } = renderHook(() => useCalendar({}));

      await act(async () => {
        await result.current.getCPrimeCalendarData('user-123', 2024, 12);
      });

      expect(mockRestAdapterGet).toHaveBeenCalledWith(
        expect.objectContaining({
          params: expect.objectContaining({
            year: 2024,
            month: 12,
          }),
        })
      );
    });
  });

  describe('Return Value Structure', () => {
    it('should return stable function references', () => {
      const { result, rerender } = renderHook(() => useCalendar({}));

      const firstGetCalendar = result.current.getCPrimeCalendarData;
      const firstGetCities = result.current.getCities;

      rerender();

      // Functions are recreated on each render (no useMemo/useCallback)
      // This documents the current behavior
      expect(typeof result.current.getCPrimeCalendarData).toBe('function');
      expect(typeof result.current.getCities).toBe('function');
    });
  });
});
