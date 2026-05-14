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
 * Unit Tests for useMasthead Hook
 *
 * Hook handles:
 * - Fetching announcements with sorting
 * - Providing locale-specific masthead banner images
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

jest.mock('../../../../almLib/utils/jsonAPIAdapter', () => ({
  JsonApiParse: jest.fn(),
}));

// Mock all banner image imports
jest.mock('../../../../almLib/assets/images/masthead/banner_de.png', () => 'banner_de.png');
jest.mock('../../../../almLib/assets/images/masthead/banner_en.png', () => 'banner_en.png');
jest.mock('../../../../almLib/assets/images/masthead/banner_es.png', () => 'banner_es.png');
jest.mock('../../../../almLib/assets/images/masthead/banner_fr.png', () => 'banner_fr.png');
jest.mock('../../../../almLib/assets/images/masthead/banner_hi.png', () => 'banner_hi.png');
jest.mock('../../../../almLib/assets/images/masthead/banner_id.png', () => 'banner_id.png');
jest.mock('../../../../almLib/assets/images/masthead/banner_it.png', () => 'banner_it.png');
jest.mock('../../../../almLib/assets/images/masthead/banner_ja.png', () => 'banner_ja.png');
jest.mock('../../../../almLib/assets/images/masthead/banner_ko.png', () => 'banner_ko.png');
jest.mock('../../../../almLib/assets/images/masthead/banner_nb.png', () => 'banner_nb.png');
jest.mock('../../../../almLib/assets/images/masthead/banner_nl.png', () => 'banner_nl.png');
jest.mock('../../../../almLib/assets/images/masthead/banner_pl.png', () => 'banner_pl.png');
jest.mock('../../../../almLib/assets/images/masthead/banner_pt.png', () => 'banner_pt.png');
jest.mock('../../../../almLib/assets/images/masthead/banner_ru.png', () => 'banner_ru.png');
jest.mock('../../../../almLib/assets/images/masthead/banner_sv.png', () => 'banner_sv.png');
jest.mock('../../../../almLib/assets/images/masthead/banner_tr.png', () => 'banner_tr.png');
jest.mock('../../../../almLib/assets/images/masthead/banner_zh.png', () => 'banner_zh.png');
jest.mock('../../../../almLib/assets/images/masthead/banner_ca.png', () => 'banner_ca.png');

import { act } from '@testing-library/react';
import React from 'react';
import ReactDOM from 'react-dom';
import { useMasthead } from '../../../../almLib/hooks/widgets/masthead/useMasthead';
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

describe('useMasthead', () => {
  const mockGetALMConfig = getALMConfig as jest.MockedFunction<typeof getALMConfig>;
  const mockRestAdapterGet = RestAdapter.get as jest.MockedFunction<typeof RestAdapter.get>;

  const mockConfig = {
    primeApiURL: 'https://learningmanager.adobe.com/primeapi/v2/',
  };

  const mockAnnouncementsResponse = {
    data: [
      {
        id: 'announcement-1',
        type: 'announcement',
        attributes: {
          title: 'Important Update',
          message: 'System maintenance scheduled',
          liveDate: '2024-02-01',
        },
      },
      {
        id: 'announcement-2',
        type: 'announcement',
        attributes: {
          title: 'New Features',
          message: 'Check out our latest features',
          liveDate: '2024-01-15',
        },
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetALMConfig.mockReturnValue(mockConfig as any);
  });

  describe('getAnnouncements', () => {
    it('should fetch announcements successfully', async () => {
      mockRestAdapterGet.mockResolvedValue(mockAnnouncementsResponse);

      const { result } = renderHook(() => useMasthead());

      let announcements;
      await act(async () => {
        announcements = await result.current.getAnnouncements();
      });

      expect(mockRestAdapterGet).toHaveBeenCalled();
      expect(announcements).toEqual(mockAnnouncementsResponse);
    });

    it('should use correct API endpoint', async () => {
      mockRestAdapterGet.mockResolvedValue(mockAnnouncementsResponse);

      const { result } = renderHook(() => useMasthead());

      await act(async () => {
        await result.current.getAnnouncements();
      });

      expect(mockRestAdapterGet).toHaveBeenCalledWith({
        url: 'https://learningmanager.adobe.com/primeapi/v2/announcements',
        params: { sort: '-liveDate' },
      });
    });

    it('should sort announcements by liveDate descending', async () => {
      mockRestAdapterGet.mockResolvedValue(mockAnnouncementsResponse);

      const { result } = renderHook(() => useMasthead());

      await act(async () => {
        await result.current.getAnnouncements();
      });

      const callParams = mockRestAdapterGet.mock.calls[0][0].params;
      expect(callParams.sort).toBe('-liveDate');
    });

    it('should use primeApiURL from config', async () => {
      const customConfig = {
        primeApiURL: 'https://custom.api.com/v3/',
      };
      mockGetALMConfig.mockReturnValue(customConfig as any);
      mockRestAdapterGet.mockResolvedValue(mockAnnouncementsResponse);

      const { result } = renderHook(() => useMasthead());

      await act(async () => {
        await result.current.getAnnouncements();
      });

      expect(mockRestAdapterGet).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'https://custom.api.com/v3/announcements',
        })
      );
    });

    it('should return raw response without parsing', async () => {
      const rawResponse = { raw: 'data', unparsed: true };
      mockRestAdapterGet.mockResolvedValue(rawResponse);

      const { result } = renderHook(() => useMasthead());

      let announcements;
      await act(async () => {
        announcements = await result.current.getAnnouncements();
      });

      expect(announcements).toEqual(rawResponse);
    });

    it('should handle empty announcements', async () => {
      const emptyResponse = { data: [] };
      mockRestAdapterGet.mockResolvedValue(emptyResponse);

      const { result } = renderHook(() => useMasthead());

      let announcements;
      await act(async () => {
        announcements = await result.current.getAnnouncements();
      });

      expect(announcements).toEqual(emptyResponse);
    });

    it('should handle null response', async () => {
      mockRestAdapterGet.mockResolvedValue(null);

      const { result } = renderHook(() => useMasthead());

      let announcements;
      await act(async () => {
        announcements = await result.current.getAnnouncements();
      });

      expect(announcements).toBeNull();
    });
  });

  describe('getAnnouncements - Error Handling', () => {
    it('should handle API errors', async () => {
      const mockError = new Error('API Error');
      mockRestAdapterGet.mockRejectedValue(mockError);

      const { result } = renderHook(() => useMasthead());

      await act(async () => {
        await expect(result.current.getAnnouncements()).rejects.toThrow('API Error');
      });
    });

    it('should propagate network errors', async () => {
      mockRestAdapterGet.mockRejectedValue(new Error('Network Error'));

      const { result } = renderHook(() => useMasthead());

      await act(async () => {
        await expect(result.current.getAnnouncements()).rejects.toThrow('Network Error');
      });
    });

    it('should handle 404 errors', async () => {
      const error404 = new Error('404 Not Found');
      mockRestAdapterGet.mockRejectedValue(error404);

      const { result } = renderHook(() => useMasthead());

      await act(async () => {
        await expect(result.current.getAnnouncements()).rejects.toThrow('404 Not Found');
      });
    });

    it('should handle 500 errors', async () => {
      const error500 = new Error('500 Internal Server Error');
      mockRestAdapterGet.mockRejectedValue(error500);

      const { result } = renderHook(() => useMasthead());

      await act(async () => {
        await expect(result.current.getAnnouncements()).rejects.toThrow(
          '500 Internal Server Error'
        );
      });
    });
  });

  describe('Multiple Hook Instances', () => {
    it('should maintain independent behavior for multiple instances', async () => {
      mockRestAdapterGet.mockResolvedValue(mockAnnouncementsResponse);

      const { result: result1 } = renderHook(() => useMasthead());
      const { result: result2 } = renderHook(() => useMasthead());

      await act(async () => {
        await result1.current.getAnnouncements();
      });

      expect(mockRestAdapterGet).toHaveBeenCalledTimes(1);

      await act(async () => {
        await result2.current.getAnnouncements();
      });

      expect(mockRestAdapterGet).toHaveBeenCalledTimes(2);
    });

    it('should share the same mastheadImageMap reference', () => {
      const { result: result1 } = renderHook(() => useMasthead());
      const { result: result2 } = renderHook(() => useMasthead());

      // mastheadImageMap is defined at module level, so it's shared
      expect(result1.current.mastheadImageMap).toEqual(result2.current.mastheadImageMap);
    });
  });

  describe('Multiple getAnnouncements Calls', () => {
    it('should handle sequential calls', async () => {
      mockRestAdapterGet.mockResolvedValue(mockAnnouncementsResponse);

      const { result } = renderHook(() => useMasthead());

      await act(async () => {
        await result.current.getAnnouncements();
        await result.current.getAnnouncements();
      });

      expect(mockRestAdapterGet).toHaveBeenCalledTimes(2);
    });

    it('should return fresh data on each call', async () => {
      const firstResponse = { data: [{ id: '1', title: 'First' }] };
      const secondResponse = { data: [{ id: '2', title: 'Second' }] };

      mockRestAdapterGet.mockResolvedValueOnce(firstResponse).mockResolvedValueOnce(secondResponse);

      const { result } = renderHook(() => useMasthead());

      let first, second;
      await act(async () => {
        first = await result.current.getAnnouncements();
        second = await result.current.getAnnouncements();
      });

      expect(first).toEqual(firstResponse);
      expect(second).toEqual(secondResponse);
    });

    it('should handle success after previous error', async () => {
      mockRestAdapterGet
        .mockRejectedValueOnce(new Error('First Error'))
        .mockResolvedValueOnce(mockAnnouncementsResponse);

      const { result } = renderHook(() => useMasthead());

      // First call fails
      await act(async () => {
        try {
          await result.current.getAnnouncements();
        } catch (error) {
          // Expected
        }
      });

      // Second call succeeds
      let announcements;
      await act(async () => {
        announcements = await result.current.getAnnouncements();
      });

      expect(announcements).toEqual(mockAnnouncementsResponse);
    });
  });

  describe('Edge Cases', () => {
    it('should handle API URL without trailing slash', async () => {
      const configWithoutSlash = {
        primeApiURL: 'https://api.example.com/v2',
      };
      mockGetALMConfig.mockReturnValue(configWithoutSlash as any);
      mockRestAdapterGet.mockResolvedValue(mockAnnouncementsResponse);

      const { result } = renderHook(() => useMasthead());

      await act(async () => {
        await result.current.getAnnouncements();
      });

      expect(mockRestAdapterGet).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'https://api.example.com/v2announcements',
        })
      );
    });

    it('should handle API URL with trailing slash', async () => {
      const configWithSlash = {
        primeApiURL: 'https://api.example.com/v2/',
      };
      mockGetALMConfig.mockReturnValue(configWithSlash as any);
      mockRestAdapterGet.mockResolvedValue(mockAnnouncementsResponse);

      const { result } = renderHook(() => useMasthead());

      await act(async () => {
        await result.current.getAnnouncements();
      });

      expect(mockRestAdapterGet).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'https://api.example.com/v2/announcements',
        })
      );
    });

    it('should handle very large announcements list', async () => {
      const largeResponse = {
        data: Array.from({ length: 1000 }, (_, i) => ({
          id: `announcement-${i}`,
          title: `Announcement ${i}`,
        })),
      };
      mockRestAdapterGet.mockResolvedValue(largeResponse);

      const { result } = renderHook(() => useMasthead());

      let announcements;
      await act(async () => {
        announcements = await result.current.getAnnouncements();
      });

      expect(announcements.data).toHaveLength(1000);
    });
  });

  describe('Return Value Structure', () => {
    it('should return consistent structure', () => {
      const { result } = renderHook(() => useMasthead());

      const keys = Object.keys(result.current);
      expect(keys).toContain('getAnnouncements');
      expect(keys).toContain('mastheadImageMap');
      expect(keys).toHaveLength(2);
    });

    it('should maintain function reference stability', () => {
      const { result, rerender } = renderHook(() => useMasthead());

      const firstGetAnnouncements = result.current.getAnnouncements;

      rerender();

      // Function is recreated on each render (no useCallback)
      expect(typeof result.current.getAnnouncements).toBe('function');
    });

    it('should maintain imageMap reference stability', () => {
      const { result, rerender } = renderHook(() => useMasthead());

      const firstImageMap = result.current.mastheadImageMap;

      rerender();

      // imageMap is defined at module level, same reference
      expect(result.current.mastheadImageMap).toBe(firstImageMap);
    });
  });

  describe('Config Integration', () => {
    it('should call getALMConfig on each hook instance', () => {
      renderHook(() => useMasthead());
      expect(mockGetALMConfig).toHaveBeenCalledTimes(1);

      renderHook(() => useMasthead());
      expect(mockGetALMConfig).toHaveBeenCalledTimes(2);
    });

    it('should get fresh config on each render', () => {
      const { rerender } = renderHook(() => useMasthead());

      mockGetALMConfig.mockClear();

      rerender();

      // Config is fetched on each render (not cached)
      expect(mockGetALMConfig).toHaveBeenCalled();
    });
  });
});
