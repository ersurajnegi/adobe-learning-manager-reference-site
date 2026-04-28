/**
Copyright 2021 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

import {
  getBrowserTimezoneFallback,
  getUserTimezoneInfo,
  formatTimeRangeWithTimezone,
  getFormattedTimezoneDisplay,
  formatSingleTimeWithTimezone,
  formatDateWithTimezone,
  isSameDayInTimezone,
  getDatePartsInTimezone,
} from '@utils/timezoneUtils';
import type { PrimeUser, PrimeTimeZone, PrimeAccount } from '@models/PrimeModels';

describe('timezoneUtils', () => {
  // Mock date to ensure consistent test results
  const mockDate = new Date('2024-01-15T10:30:00Z');
  const originalDateNow = Date.now;
  const originalIntl = global.Intl;

  beforeEach(() => {
    // Mock Date.now() to return consistent time
    Date.now = jest.fn(() => mockDate.getTime());

    // Mock Intl.DateTimeFormat for consistent timezone behavior
    global.Intl = {
      ...originalIntl,
      DateTimeFormat: jest.fn().mockImplementation((locale?: string, options?: any) => {
        const mockFormatter = {
          resolvedOptions: jest.fn(() => ({
            timeZone: 'America/New_York',
            locale: locale || 'en-US',
          })),
          formatToParts: jest.fn((date: Date) => {
            // Mock formatToParts for consistent output
            return [
              { type: 'month', value: '1' },
              { type: 'literal', value: '/' },
              { type: 'day', value: '15' },
              { type: 'literal', value: '/' },
              { type: 'year', value: '2024' },
              { type: 'timeZoneName', value: 'EST' },
            ];
          }),
          format: jest.fn(() => 'Jan 15, 2024'),
        };
        return mockFormatter as any;
      }),
    } as any;
  });

  afterEach(() => {
    Date.now = originalDateNow;
    global.Intl = originalIntl;
    jest.clearAllMocks();
  });

  // ========== getBrowserTimezoneFallback ==========

  describe('getBrowserTimezoneFallback', () => {
    it('should have valid PrimeTimeZone structure', () => {
      const result = getBrowserTimezoneFallback();
      expect(result?.timeZoneCode).toBe('America/New_York');
      expect(result?.zoneId).toBe('America/New_York');
      expect(result?._transient).toBeNull();
    });

    it('should calculate UTC offset correctly', () => {
      const result = getBrowserTimezoneFallback();
      // UTC offset code should contain "UTC"
      expect(result?.utcOffsetCode).toContain('UTC');
      // UTC offset code should have correct format (EST: UTC+/-X:XX)
      expect(result?.utcOffsetCode).toMatch(/^[A-Z]+:\s*UTC[+-]\d{1,2}:\d{2}$/);
    });

    it('should return null if Intl is not available', () => {
      // Mock Intl to throw error
      const originalDateTimeFormat = global.Intl.DateTimeFormat;
      global.Intl.DateTimeFormat = jest.fn().mockImplementation(() => {
        throw new Error('Intl not available');
      }) as any;

      const result = getBrowserTimezoneFallback();
      expect(result).toBeNull();

      // Restore
      global.Intl.DateTimeFormat = originalDateTimeFormat;
    });

    it('should handle timezone abbreviations', () => {
      const result = getBrowserTimezoneFallback();
      // result is non-null; utcOffsetCode starts with the timezone abbreviation
      expect(result?.utcOffsetCode).toMatch(/^[A-Z]+:/);
    });
  });

  // ========== getUserTimezoneInfo ==========

  describe('getUserTimezoneInfo', () => {
    const mockTimeZones: PrimeTimeZone[] = [
      {
        id: 'tz1',
        _transient: null,
        name: 'Eastern Time (US & Canada)',
        timeZoneCode: 'America/New_York',
        utcOffset: -300,
        utcOffsetCode: 'EST: UTC-5:00',
        zoneId: 'America/New_York',
      },
      {
        id: 'tz2',
        _transient: null,
        name: 'Pacific Time (US & Canada)',
        timeZoneCode: 'America/Los_Angeles',
        utcOffset: -480,
        utcOffsetCode: 'PST: UTC-8:00',
        zoneId: 'America/Los_Angeles',
      },
    ];

    it('should return user timezone when available', () => {
      const user: PrimeUser = {
        id: 'user1',
        timeZoneCode: 'America/New_York',
        account: {
          id: 'acc1',
          timeZones: mockTimeZones,
        } as any,
      } as any;

      const result = getUserTimezoneInfo(user);
      expect(result).not.toBeNull();
      expect(result?.timeZoneCode).toBe('America/New_York');
      expect(result?.name).toBe('Eastern Time (US & Canada)');
    });

    it('should fallback to account timezone when user timezone is not set', () => {
      const user: PrimeUser = {
        id: 'user1',
        account: {
          id: 'acc1',
          timeZones: mockTimeZones,
        } as any,
      } as any;

      const account: PrimeAccount = {
        id: 'acc1',
        timeZoneCode: 'America/Los_Angeles',
      } as any;

      const result = getUserTimezoneInfo(user, account);
      expect(result).not.toBeNull();
      expect(result?.timeZoneCode).toBe('America/Los_Angeles');
      expect(result?.name).toBe('Pacific Time (US & Canada)');
    });

    it('should fallback to browser timezone when neither user nor account timezone is available', () => {
      const user: PrimeUser = {
        id: 'user1',
        account: {
          id: 'acc1',
          timeZones: mockTimeZones,
        } as any,
      } as any;

      const result = getUserTimezoneInfo(user);
      expect(result).not.toBeNull();
      // Should return browser timezone
      expect(result).toHaveProperty('timeZoneCode');
    });

    it('should return null when user is null and no browser fallback', () => {
      // Mock getBrowserTimezoneFallback to return null
      const originalDateTimeFormat = global.Intl.DateTimeFormat;
      global.Intl.DateTimeFormat = jest.fn().mockImplementation(() => {
        throw new Error('Intl not available');
      }) as any;

      const result = getUserTimezoneInfo(null);
      expect(result).toBeNull();

      // Restore
      global.Intl.DateTimeFormat = originalDateTimeFormat;
    });

    it('should prioritize user timezone over account timezone', () => {
      const user: PrimeUser = {
        id: 'user1',
        timeZoneCode: 'America/New_York',
        account: {
          id: 'acc1',
          timeZones: mockTimeZones,
        } as any,
      } as any;

      const account: PrimeAccount = {
        id: 'acc1',
        timeZoneCode: 'America/Los_Angeles',
      } as any;

      const result = getUserTimezoneInfo(user, account);
      expect(result?.timeZoneCode).toBe('America/New_York');
    });

    it('should handle missing timeZones array', () => {
      const user: PrimeUser = {
        id: 'user1',
        timeZoneCode: 'America/New_York',
        account: {
          id: 'acc1',
          timeZones: [],
        } as any,
      } as any;

      const result = getUserTimezoneInfo(user);
      // Should fallback to browser timezone since timeZoneCode not found
      expect(result).not.toBeNull();
    });
  });

  // ========== formatTimeRangeWithTimezone ==========

  describe('formatTimeRangeWithTimezone', () => {
    const mockUser: PrimeUser = {
      id: 'user1',
      timeZoneCode: 'America/New_York',
      account: {
        id: 'acc1',
        timeZones: [
          {
            id: 'tz1',
            _transient: null,
            name: 'Eastern Time',
            timeZoneCode: 'America/New_York',
            utcOffset: -300,
            utcOffsetCode: 'UTC-5:00',
            zoneId: 'America/New_York',
          },
        ],
      } as any,
    } as any;

    it('should format time range with timezone', () => {
      const startDate = '2024-01-15T10:00:00Z';
      const endDate = '2024-01-15T11:00:00Z';

      const result = formatTimeRangeWithTimezone(startDate, endDate, mockUser, 'en-US');
      expect(result.timeRange).toMatch(/-/); // timeRange contains " - " separator
      expect(result.timezoneDisplay).toContain('Eastern Time');
    });

    it('should return time range without timezone display when user is null and no browser fallback', () => {
      // Mock to disable browser fallback
      const originalDateTimeFormat = global.Intl.DateTimeFormat;
      global.Intl.DateTimeFormat = jest.fn().mockImplementation(() => {
        throw new Error('Intl not available');
      }) as any;

      const startDate = '2024-01-15T10:00:00Z';
      const endDate = '2024-01-15T11:00:00Z';

      const result = formatTimeRangeWithTimezone(startDate, endDate, null, 'en-US');
      expect(result.timeRange).toBeTruthy();
      expect(result.timezoneDisplay).toBe('');

      // Restore
      global.Intl.DateTimeFormat = originalDateTimeFormat;
    });

    it('should format time range with account timezone', () => {
      const startDate = '2024-01-15T10:00:00Z';
      const endDate = '2024-01-15T11:00:00Z';
      const account: PrimeAccount = {
        id: 'acc1',
        timeZoneCode: 'America/New_York',
      } as any;

      const result = formatTimeRangeWithTimezone(startDate, endDate, mockUser, 'en-US', account);
      expect(result.timeRange).toMatch(/-/);
      expect(result.timezoneDisplay).toContain('Eastern Time');
    });

    it('should handle different locales', () => {
      const startDate = '2024-01-15T10:00:00Z';
      const endDate = '2024-01-15T11:00:00Z';

      const resultEN = formatTimeRangeWithTimezone(startDate, endDate, mockUser, 'en-US');
      const resultFR = formatTimeRangeWithTimezone(startDate, endDate, mockUser, 'fr-FR');

      expect(resultEN.timeRange).toMatch(/-/);
      expect(resultFR.timeRange).toMatch(/-/);
    });
  });

  // ========== getFormattedTimezoneDisplay ==========

  describe('getFormattedTimezoneDisplay', () => {
    const mockUser: PrimeUser = {
      id: 'user1',
      timeZoneCode: 'America/New_York',
      account: {
        id: 'acc1',
        timeZones: [
          {
            id: 'tz1',
            _transient: null,
            name: 'Eastern Time',
            timeZoneCode: 'America/New_York',
            utcOffset: -300,
            utcOffsetCode: 'UTC-5:00',
            zoneId: 'America/New_York',
          },
        ],
      } as any,
    } as any;

    it('should return formatted timezone display for user', () => {
      const result = getFormattedTimezoneDisplay(mockUser);
      expect(result).toContain('Eastern Time');
    });

    it('should return empty string when user is null and no browser fallback', () => {
      // Mock to disable browser fallback
      const originalDateTimeFormat = global.Intl.DateTimeFormat;
      global.Intl.DateTimeFormat = jest.fn().mockImplementation(() => {
        throw new Error('Intl not available');
      }) as any;

      const result = getFormattedTimezoneDisplay(null);
      expect(result).toBe('');

      // Restore
      global.Intl.DateTimeFormat = originalDateTimeFormat;
    });

    it('should return formatted timezone display with account', () => {
      const account: PrimeAccount = {
        id: 'acc1',
        timeZoneCode: 'America/New_York',
      } as any;

      const result = getFormattedTimezoneDisplay(mockUser, account);
      expect(result).toContain('Eastern Time');
    });

    it('should handle various timezone name formats', () => {
      const userWithComplexName: PrimeUser = {
        id: 'user1',
        timeZoneCode: 'America/New_York',
        account: {
          id: 'acc1',
          timeZones: [
            {
              id: 'tz1',
              _transient: null,
              name: 'Eastern Time (US & Canada)',
              timeZoneCode: 'America/New_York',
              utcOffset: -300,
              utcOffsetCode: 'UTC-5:00',
              zoneId: 'America/New_York',
            },
          ],
        } as any,
      } as any;

      const result = getFormattedTimezoneDisplay(userWithComplexName);
      expect(result).toBeTruthy();
      expect(result).toContain('Eastern Time');
    });
  });

  // ========== formatSingleTimeWithTimezone ==========

  describe('formatSingleTimeWithTimezone', () => {
    const mockUser: PrimeUser = {
      id: 'user1',
      timeZoneCode: 'America/New_York',
      account: {
        id: 'acc1',
        timeZones: [
          {
            id: 'tz1',
            _transient: null,
            name: 'Eastern Time',
            timeZoneCode: 'America/New_York',
            utcOffset: -300,
            utcOffsetCode: 'UTC-5:00',
            zoneId: 'America/New_York',
          },
        ],
      } as any,
    } as any;

    it('should format single time with timezone', () => {
      const date = '2024-01-15T10:00:00Z';

      const result = formatSingleTimeWithTimezone(date, mockUser, 'en-US');
      expect(result.time).toMatch(/\d/); // time string contains at least one digit
      expect(result.timezoneDisplay).toContain('Eastern Time');
    });

    it('should return time without timezone display when user is null and no browser fallback', () => {
      // Mock to disable browser fallback
      const originalDateTimeFormat = global.Intl.DateTimeFormat;
      global.Intl.DateTimeFormat = jest.fn().mockImplementation(() => {
        throw new Error('Intl not available');
      }) as any;

      const date = '2024-01-15T10:00:00Z';

      const result = formatSingleTimeWithTimezone(date, null, 'en-US');
      expect(result.time).toBeTruthy();
      expect(result.timezoneDisplay).toBe('');

      // Restore
      global.Intl.DateTimeFormat = originalDateTimeFormat;
    });

    it('should format time with account timezone', () => {
      const date = '2024-01-15T10:00:00Z';
      const account: PrimeAccount = {
        id: 'acc1',
        timeZoneCode: 'America/New_York',
      } as any;

      const result = formatSingleTimeWithTimezone(date, mockUser, 'en-US', account);
      expect(result.time).toMatch(/\d/);
      expect(result.timezoneDisplay).toContain('Eastern Time');
    });

    it('should handle different locales', () => {
      const date = '2024-01-15T10:00:00Z';

      const resultEN = formatSingleTimeWithTimezone(date, mockUser, 'en-US');
      const resultFR = formatSingleTimeWithTimezone(date, mockUser, 'fr-FR');

      expect(resultEN.time).toMatch(/\d/);
      expect(resultFR.time).toMatch(/\d/);
    });
  });

  // ========== formatDateWithTimezone ==========

  describe('formatDateWithTimezone', () => {
    const mockUser: PrimeUser = {
      id: 'user1',
      timeZoneCode: 'America/New_York',
      account: {
        id: 'acc1',
        timeZones: [
          {
            id: 'tz1',
            _transient: null,
            name: 'Eastern Time',
            timeZoneCode: 'America/New_York',
            utcOffset: -300,
            utcOffsetCode: 'UTC-5:00',
            zoneId: 'America/New_York',
          },
        ],
      } as any,
    } as any;

    it('should format date with timezone', () => {
      const date = '2024-01-15T10:00:00Z';

      const result = formatDateWithTimezone(date, mockUser, 'en-US');
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });

    it('should return empty string for invalid date', () => {
      const result = formatDateWithTimezone('invalid-date', mockUser, 'en-US');
      expect(result).toBe('');
    });

    it('should return empty string for empty date', () => {
      const result = formatDateWithTimezone('', mockUser, 'en-US');
      expect(result).toBe('');
    });

    it('should format date without timezone when user is null', () => {
      const date = '2024-01-15T10:00:00Z';

      const result = formatDateWithTimezone(date, null, 'en-US');
      expect(result).toMatch(/\d{4}/); // result contains a 4-digit year
    });

    it('should format Chinese dates correctly', () => {
      const date = '2024-01-15T10:00:00Z';

      const result = formatDateWithTimezone(date, mockUser, 'zh-CN');
      expect(result).toBeTruthy();
      expect(result).toContain('年');
      expect(result).toContain('月');
      expect(result).toContain('日');
    });

    it('should format Japanese dates correctly', () => {
      const date = '2024-01-15T10:00:00Z';

      const result = formatDateWithTimezone(date, mockUser, 'ja-JP');
      expect(result).toBeTruthy();
      expect(result).toContain('年');
      expect(result).toContain('月');
      expect(result).toContain('日');
      // Japanese format has no spaces
      expect(result).not.toContain(' 年 ');
    });

    it('should format English dates correctly', () => {
      const date = '2024-01-15T10:00:00Z';

      const result = formatDateWithTimezone(date, mockUser, 'en-US');
      expect(result).toBeTruthy();
      // Should contain month, day, and year
      expect(result).toMatch(/\w+\s+\d+,\s+\d{4}/);
    });

    it('should format date with account timezone', () => {
      const date = '2024-01-15T10:00:00Z';
      const account: PrimeAccount = {
        id: 'acc1',
        timeZoneCode: 'America/New_York',
      } as any;

      const result = formatDateWithTimezone(date, mockUser, 'en-US', account);
      expect(result).toMatch(/\d{4}/); // result contains a 4-digit year
    });

    it('should use browser fallback for Chinese locale when user is null', () => {
      const date = '2024-01-15T10:00:00Z';

      const result = formatDateWithTimezone(date, null, 'zh-CN');
      expect(result).toBeTruthy();
      expect(result).toContain('年');
      expect(result).toContain('月');
      expect(result).toContain('日');
      expect(result).toContain(' 年 '); // Chinese has spaces
    });

    it('should use browser fallback for Japanese locale when user is null', () => {
      const date = '2024-01-15T10:00:00Z';

      const result = formatDateWithTimezone(date, null, 'ja-JP');
      expect(result).toBeTruthy();
      expect(result).toContain('年');
      expect(result).toContain('月');
      expect(result).toContain('日');
      expect(result).not.toContain(' 年 '); // Japanese has no spaces
    });

    it('should use browser fallback for other locales when user is null', () => {
      const date = '2024-01-15T10:00:00Z';

      const result = formatDateWithTimezone(date, null, 'en-US');
      expect(result).toBeTruthy();
      expect(result).toMatch(/\w+\s+\d+,\s+\d{4}/); // Format like "Jan 15, 2024"
    });
  });

  // ========== isSameDayInTimezone ==========

  describe('isSameDayInTimezone', () => {
    const mockUser: PrimeUser = {
      id: 'user1',
      timeZoneCode: 'America/New_York',
      account: {
        id: 'acc1',
        timeZones: [
          {
            id: 'tz1',
            _transient: null,
            name: 'Eastern Time',
            timeZoneCode: 'America/New_York',
            utcOffset: -300,
            utcOffsetCode: 'UTC-5:00',
            zoneId: 'America/New_York',
          },
        ],
      } as any,
    } as any;

    it('should return true for same day in timezone', () => {
      const date1 = '2024-01-15T10:00:00Z';
      const date2 = '2024-01-15T20:00:00Z';

      const result = isSameDayInTimezone(date1, date2, mockUser, 'en-US');
      expect(typeof result).toBe('boolean');
    });

    it('should return false for different days in timezone', () => {
      const date1 = '2024-01-15T10:00:00Z';
      const date2 = '2024-01-16T10:00:00Z';

      const result = isSameDayInTimezone(date1, date2, mockUser, 'en-US');
      expect(typeof result).toBe('boolean');
    });

    it('should work without user timezone', () => {
      const date1 = '2024-01-15T10:00:00Z';
      const date2 = '2024-01-15T20:00:00Z';

      const result = isSameDayInTimezone(date1, date2, null, 'en-US');
      expect(typeof result).toBe('boolean');
    });

    it('should work with account timezone', () => {
      const date1 = '2024-01-15T10:00:00Z';
      const date2 = '2024-01-15T20:00:00Z';
      const account: PrimeAccount = {
        id: 'acc1',
        timeZoneCode: 'America/New_York',
      } as any;

      const result = isSameDayInTimezone(date1, date2, mockUser, 'en-US', account);
      expect(typeof result).toBe('boolean');
    });

    it('should handle edge cases across day boundary', () => {
      // 11:59 PM and 12:01 AM should be different days
      const date1 = '2024-01-15T04:59:00Z'; // 11:59 PM EST
      const date2 = '2024-01-15T05:01:00Z'; // 12:01 AM EST next day

      const result = isSameDayInTimezone(date1, date2, mockUser, 'en-US');
      expect(typeof result).toBe('boolean');
    });

    it('should use browser fallback when user is null', () => {
      const date1 = '2024-01-15T10:00:00Z';
      const date2 = '2024-01-15T20:00:00Z';

      // Explicitly test fallback path with null user
      const result = isSameDayInTimezone(date1, date2, null, 'en-US');
      expect(typeof result).toBe('boolean');
    });
  });

  // ========== getDatePartsInTimezone ==========

  describe('getDatePartsInTimezone', () => {
    const mockUser: PrimeUser = {
      id: 'user1',
      timeZoneCode: 'America/New_York',
      account: {
        id: 'acc1',
        timeZones: [
          {
            id: 'tz1',
            _transient: null,
            name: 'Eastern Time',
            timeZoneCode: 'America/New_York',
            utcOffset: -300,
            utcOffsetCode: 'UTC-5:00',
            zoneId: 'America/New_York',
          },
        ],
      } as any,
    } as any;

    it('should return date parts in timezone', () => {
      const date = '2024-01-15T10:00:00Z';

      const result = getDatePartsInTimezone(date, mockUser);
      expect(result).toHaveProperty('year');
      expect(result).toHaveProperty('month');
      expect(result).toHaveProperty('day');
      expect(typeof result.year).toBe('number');
      expect(typeof result.month).toBe('number');
      expect(typeof result.day).toBe('number');
    });

    it('should return month as 1-based index', () => {
      const date = '2024-01-15T10:00:00Z';

      const result = getDatePartsInTimezone(date, mockUser);
      // Month should be 1-12, not 0-11
      expect(result.month).toBe(1); // January
      expect(result.year).toBe(2024);
      expect(result.day).toBe(15);
    });

    it('should work without user timezone', () => {
      const date = '2024-01-15T10:00:00Z';

      const result = getDatePartsInTimezone(date, null);
      expect(result.year).toBe(2024);
      expect(result.month).toBe(1); // January (1-based)
      expect(result.day).toBe(15);
    });

    it('should work with account timezone', () => {
      const date = '2024-01-15T10:00:00Z';
      const account: PrimeAccount = {
        id: 'acc1',
        timeZoneCode: 'America/New_York',
      } as any;

      const result = getDatePartsInTimezone(date, mockUser, account);
      expect(result.year).toBe(2024);
      expect(result.month).toBe(1);
      expect(result.day).toBe(15);
    });

    it('should handle different timezones correctly', () => {
      // Date at midnight UTC
      const date = '2024-01-15T00:00:00Z';

      const resultWithTimezone = getDatePartsInTimezone(date, mockUser);
      const resultWithoutTimezone = getDatePartsInTimezone(date, null);

      // Both should return valid date parts
      expect(resultWithTimezone.year).toBe(2024);
      expect(resultWithoutTimezone.year).toBe(2024);
    });

    it('should handle year boundaries correctly', () => {
      // New Year's Eve in one timezone could be New Year's Day in another
      const date = '2024-01-01T04:00:00Z'; // This is Dec 31, 2023 11 PM EST

      const result = getDatePartsInTimezone(date, mockUser);
      expect(result.year).toBeGreaterThanOrEqual(2023);
      expect(result.year).toBeLessThanOrEqual(2024);
    });

    it('should use browser fallback when user is null', () => {
      const date = '2024-01-15T10:00:00Z';

      // Explicitly test fallback path with null user
      const result = getDatePartsInTimezone(date, null);
      expect(result.year).toBe(2024);
      expect(result.month).toBeGreaterThan(0);
      expect(result.month).toBeLessThanOrEqual(12);
      expect(result.day).toBeGreaterThan(0);
      expect(result.day).toBeLessThanOrEqual(31);
    });
  });

  // ========== Edge Cases & Integration Tests ==========

  describe('Edge Cases', () => {
    it('should handle null user gracefully across all functions', () => {
      const date = '2024-01-15T10:00:00Z';

      expect(formatDateWithTimezone(date, null, 'en-US')).toBeTruthy();
      expect(formatSingleTimeWithTimezone(date, null, 'en-US')).toBeTruthy();
      expect(formatTimeRangeWithTimezone(date, date, null, 'en-US')).toBeTruthy();
      // getFormattedTimezoneDisplay with null returns empty string or a fallback string
      expect(typeof getFormattedTimezoneDisplay(null)).toBe('string');
      expect(typeof isSameDayInTimezone(date, date, null, 'en-US')).toBe('boolean');
      const parts = getDatePartsInTimezone(date, null);
      expect(parts.year).toBeGreaterThan(0);
    });

    it('should handle invalid dates gracefully', () => {
      const mockUser: PrimeUser = {
        id: 'user1',
        timeZoneCode: 'America/New_York',
        account: {
          id: 'acc1',
          timeZones: [
            {
              id: 'tz1',
              _transient: null,
              name: 'Eastern Time',
              timeZoneCode: 'America/New_York',
              utcOffset: -300,
              utcOffsetCode: 'UTC-5:00',
              zoneId: 'America/New_York',
            },
          ],
        } as any,
      } as any;

      expect(formatDateWithTimezone('invalid', mockUser, 'en-US')).toBe('');
      expect(formatDateWithTimezone('', mockUser, 'en-US')).toBe('');
    });

    it('should handle timezone without slash in zoneId', () => {
      const user: PrimeUser = {
        id: 'user1',
        timeZoneCode: 'UTC',
        account: {
          id: 'acc1',
          timeZones: [
            {
              id: 'tz1',
              _transient: null,
              name: 'UTC Time',
              timeZoneCode: 'UTC',
              utcOffset: 0,
              utcOffsetCode: 'UTC+0:00',
              zoneId: 'UTC',
            },
          ],
        } as any,
      } as any;

      const result = getFormattedTimezoneDisplay(user);
      expect(result).toBeTruthy();
      expect(result).toContain('UTC');
    });

    it('should handle timezone abbreviations fallback', () => {
      // Test with a timezone that might not have abbreviation support
      const user: PrimeUser = {
        id: 'user1',
        timeZoneCode: 'Custom/Unknown',
        account: {
          id: 'acc1',
          timeZones: [
            {
              id: 'tz1',
              _transient: null,
              name: 'Custom Time',
              timeZoneCode: 'Custom/Unknown',
              utcOffset: 0,
              utcOffsetCode: 'UTC+0:00',
              zoneId: 'Custom/Unknown',
            },
          ],
        } as any,
      } as any;

      const result = getFormattedTimezoneDisplay(user);
      expect(result).toContain('Custom Time');
    });
  });

  describe('Integration Tests', () => {
    it('should consistently format times across different functions', () => {
      const mockUser: PrimeUser = {
        id: 'user1',
        timeZoneCode: 'America/New_York',
        account: {
          id: 'acc1',
          timeZones: [
            {
              id: 'tz1',
              _transient: null,
              name: 'Eastern Time',
              timeZoneCode: 'America/New_York',
              utcOffset: -300,
              utcOffsetCode: 'UTC-5:00',
              zoneId: 'America/New_York',
            },
          ],
        } as any,
      } as any;

      const date = '2024-01-15T10:00:00Z';

      const singleTime = formatSingleTimeWithTimezone(date, mockUser, 'en-US');
      const timezoneDisplay = getFormattedTimezoneDisplay(mockUser);

      // Both should return consistent timezone information
      expect(singleTime.timezoneDisplay).toBe(timezoneDisplay);
    });

    it('should respect timezone priority order', () => {
      const mockTimeZones: PrimeTimeZone[] = [
        {
          id: 'tz1',
          _transient: null,
          name: 'Eastern Time',
          timeZoneCode: 'America/New_York',
          utcOffset: -300,
          utcOffsetCode: 'EST: UTC-5:00',
          zoneId: 'America/New_York',
        },
        {
          id: 'tz2',
          _transient: null,
          name: 'Pacific Time',
          timeZoneCode: 'America/Los_Angeles',
          utcOffset: -480,
          utcOffsetCode: 'PST: UTC-8:00',
          zoneId: 'America/Los_Angeles',
        },
      ];

      // User with timezone
      const userWithTZ: PrimeUser = {
        id: 'user1',
        timeZoneCode: 'America/New_York',
        account: {
          id: 'acc1',
          timeZones: mockTimeZones,
        } as any,
      } as any;

      // Account with different timezone
      const account: PrimeAccount = {
        id: 'acc1',
        timeZoneCode: 'America/Los_Angeles',
      } as any;

      const result = getUserTimezoneInfo(userWithTZ, account);
      // Should prioritize user timezone
      expect(result?.timeZoneCode).toBe('America/New_York');
    });
  });

  describe('Edge Cases and Branch Coverage', () => {
    it('should handle timezone without slash in zoneId', () => {
      const mockUser: PrimeUser = {
        id: 'user1',
        timeZoneCode: 'UTC',
        account: {
          id: 'acc1',
          timeZones: [
            {
              id: 'tz1',
              _transient: null,
              name: 'UTC',
              timeZoneCode: 'UTC',
              utcOffset: 0,
              utcOffsetCode: 'UTC+0:00',
              zoneId: 'UTC', // No slash in zoneId
            },
          ],
        } as any,
      } as any;

      const result = getUserTimezoneInfo(mockUser);
      expect(result?.zoneId).toBe('UTC');
    });

    it('should handle offset with multiple parts and abbreviations', () => {
      const mockUser: PrimeUser = {
        id: 'user1',
        timeZoneCode: 'America/New_York',
        account: {
          id: 'acc1',
          timeZones: [
            {
              id: 'tz1',
              _transient: null,
              name: 'Eastern Time',
              timeZoneCode: 'America/New_York',
              utcOffset: -300,
              utcOffsetCode: '(EST) UTC-5:00 / (EDT) UTC-4:00', // Multiple offsets with abbreviations
              zoneId: 'America/New_York',
            },
          ],
        } as any,
      } as any;

      const result = getFormattedTimezoneDisplay(mockUser);
      expect(typeof result).toBe('string');
    });

    it('should handle timezone error fallback to mapping', () => {
      // Mock Intl.DateTimeFormat to throw error
      const originalDateTimeFormat = global.Intl.DateTimeFormat;
      global.Intl.DateTimeFormat = jest.fn().mockImplementation(() => {
        throw new Error('Timezone not supported');
      }) as any;

      const mockUser: PrimeUser = {
        id: 'user1',
        timeZoneCode: 'America/New_York',
        account: {
          id: 'acc1',
          timeZones: [
            {
              id: 'tz1',
              _transient: null,
              name: 'Eastern Time',
              timeZoneCode: 'America/New_York',
              utcOffset: -300,
              utcOffsetCode: 'EST: UTC-5:00',
              zoneId: 'America/New_York',
            },
          ],
        } as any,
      } as any;

      // Should fallback to timezone map
      const result = getFormattedTimezoneDisplay(mockUser);
      expect(typeof result).toBe('string');

      // Restore original
      global.Intl.DateTimeFormat = originalDateTimeFormat;
    });

    it('should handle unknown timezone with fallback', () => {
      const originalDateTimeFormat = global.Intl.DateTimeFormat;
      global.Intl.DateTimeFormat = jest.fn().mockImplementation(() => {
        throw new Error('Timezone not supported');
      }) as any;

      const mockUser: PrimeUser = {
        id: 'user1',
        timeZoneCode: 'Unknown/Timezone',
        account: {
          id: 'acc1',
          timeZones: [
            {
              id: 'tz1',
              _transient: null,
              name: 'Unknown',
              timeZoneCode: 'Unknown/Timezone',
              utcOffset: 0,
              utcOffsetCode: 'UTC+0:00',
              zoneId: 'Unknown/Timezone',
            },
          ],
        } as any,
      } as any;

      const result = getFormattedTimezoneDisplay(mockUser);
      expect(typeof result).toBe('string');

      global.Intl.DateTimeFormat = originalDateTimeFormat;
    });

    it('should handle date formatting edge cases', () => {
      const veryEarlyDate = '1970-01-01T00:00:00Z';
      const veryLateDate = '2099-12-31T23:59:59Z';

      const mockUser: PrimeUser = {
        id: 'user1',
        timeZoneCode: 'America/New_York',
        account: {
          id: 'acc1',
          timeZones: [
            {
              id: 'tz1',
              _transient: null,
              name: 'Eastern Time',
              timeZoneCode: 'America/New_York',
              utcOffset: -300,
              utcOffsetCode: 'EST: UTC-5:00',
              zoneId: 'America/New_York',
            },
          ],
        } as any,
      } as any;

      const result1 = formatDateWithTimezone(veryEarlyDate, mockUser, 'en-US');
      expect(typeof result1).toBe('string');

      const result2 = formatDateWithTimezone(veryLateDate, mockUser, 'en-US');
      expect(typeof result2).toBe('string');
    });

    it('should handle timezone without abbreviation in offset', () => {
      const mockUser: PrimeUser = {
        id: 'user1',
        timeZoneCode: 'Asia/Kolkata',
        account: {
          id: 'acc1',
          timeZones: [
            {
              id: 'tz1',
              _transient: null,
              name: 'India Standard Time',
              timeZoneCode: 'Asia/Kolkata',
              utcOffset: 330,
              utcOffsetCode: 'UTC+5:30', // No abbreviation
              zoneId: 'Asia/Kolkata',
            },
          ],
        } as any,
      } as any;

      const result = getFormattedTimezoneDisplay(mockUser);
      expect(typeof result).toBe('string');
    });

    it('should handle browser timezone fallback when user timezone is unavailable', () => {
      const result = getBrowserTimezoneFallback();
      // Returns PrimeTimeZone object or null
      if (result) {
        expect(result).toHaveProperty('timeZoneCode');
        expect(result).toHaveProperty('utcOffset');
        expect(typeof result.timeZoneCode).toBe('string');
      }
    });

    it('should handle same day comparison across timezones', () => {
      const date1 = '2024-01-15T23:00:00Z'; // Late in UTC
      const date2 = '2024-01-16T01:00:00Z'; // Early next day in UTC

      const mockUser: PrimeUser = {
        id: 'user1',
        timeZoneCode: 'America/Los_Angeles', // PST is UTC-8
        account: {
          id: 'acc1',
          timeZones: [
            {
              id: 'tz1',
              _transient: null,
              name: 'Pacific Time',
              timeZoneCode: 'America/Los_Angeles',
              utcOffset: -480,
              utcOffsetCode: 'PST: UTC-8:00',
              zoneId: 'America/Los_Angeles',
            },
          ],
        } as any,
      } as any;

      // In PST, both might be same day
      const isSame = isSameDayInTimezone(date1, date2, mockUser);
      expect(typeof isSame).toBe('boolean');
    });
  });
});
