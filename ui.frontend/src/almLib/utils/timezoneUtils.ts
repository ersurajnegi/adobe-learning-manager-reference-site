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

import { PrimeUser, PrimeTimeZone, PrimeAccount } from '../models/PrimeModels';

/**
 * Gets browser timezone information as a fallback when account/user timezone is not available
 * @returns PrimeTimeZone object based on browser timezone or null if detection fails
 */
export const getBrowserTimezoneFallback = (): PrimeTimeZone | null => {
  try {
    const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    // Get timezone offset
    const offset = new Date().getTimezoneOffset() * -1; // Convert to positive offset
    const offsetHours = Math.floor(offset / 60);
    const offsetMinutes = Math.abs(offset % 60);
    const offsetCode = `UTC${offset >= 0 ? '+' : ''}${offsetHours}:${String(offsetMinutes).padStart(2, '0')}`;

    // Get timezone abbreviation
    const timeZoneAbbr = getTimezoneAbbreviation(browserTimezone);

    // Create a fallback timezone object using browser timezone
    const fallbackTimezone: PrimeTimeZone = {
      id: browserTimezone,
      _transient: null,
      name: browserTimezone, // Use raw timezone ID, let formatTimeZoneDisplay handle formatting
      timeZoneCode: browserTimezone,
      utcOffset: offset,
      utcOffsetCode: `${timeZoneAbbr}: ${offsetCode}`,
      zoneId: browserTimezone,
    };

    return fallbackTimezone;
  } catch (error) {
    return null;
  }
};

/**
 * Gets the timezone information from user profile using existing PrimeTimeZone structure
 * Priority order: User profile timezone → Account timezone → Browser timezone (fallback)
 * @param user - The user object containing timezone information
 * @param account - Optional account object to use account-level timezone instead of user timezone
 * @returns PrimeTimeZone object or null if not available
 */
export const getUserTimezoneInfo = (
  user: PrimeUser | null,
  account?: PrimeAccount | null
): PrimeTimeZone | null => {
  const accountTimeZones = user?.account?.timeZones || [];

  // Priority 1: User profile timezone
  if (user?.timeZoneCode) {
    const timezoneInfo = accountTimeZones.find(tz => tz.timeZoneCode === user.timeZoneCode);
    if (timezoneInfo) {
      return timezoneInfo;
    }
  }

  // Priority 2: Account-level timezone
  if (account?.timeZoneCode) {
    const timezoneInfo = accountTimeZones.find(tz => tz.timeZoneCode === account.timeZoneCode);
    if (timezoneInfo) {
      return timezoneInfo;
    }
  }

  // Priority 3: Browser timezone as fallback
  const browserTimezoneInfo = getBrowserTimezoneFallback();
  if (browserTimezoneInfo) {
    return browserTimezoneInfo;
  }

  return null;
};

// --- Formatting functions ---
/**
 * Gets the zone ID suffix (last part after '/')
 * @param zoneId - The timezone ID
 * @returns The zone ID suffix
 */
function getZoneIdSuffix(zoneId: string): string {
  // If zoneId contains '/', return last part, else return as is
  if (zoneId.includes('/')) {
    const result = zoneId.split('/').pop() || zoneId;
    return result;
  }
  return zoneId;
}

/**
 * Gets the main description by removing trailing region in parentheses
 * @param description - The timezone description
 * @returns The main description without region
 */
function getMainDescription(description: string): string {
  // Remove trailing region in parentheses, if present
  const match = description.match(/^(.+?)\s*\([^)]+\)$/);
  const result = match ? match[1].trim() : description.trim();
  return result;
}

/**
 * Formats the UTC offset with abbreviations
 * @param offset - The UTC offset string
 * @returns Formatted offset string
 */
function formatOffset(offset: string): string {
  // Split on slashes for multiple offsets
  const parts = offset.split('/').map(s => s.trim());
  const formatted = parts.map(part => {
    // Extract offset and abbreviation
    const abbrMatch = part.match(/\((.*?)\)/);
    const abbr = abbrMatch ? abbrMatch[1] : '';
    const utc = part.replace(/\(.*?\)/, '').trim();
    return abbr ? `${abbr}: ${utc}` : utc;
  });
  const result = formatted.join(', ');
  return result;
}

/**
 * Formats timezone display using custom logic
 * @param tz - PrimeTimeZone object
 * @returns Formatted timezone display string
 */
function formatTimeZoneDisplay(tz: PrimeTimeZone): string {
  const desc = tz.name;
  const zoneId = tz.zoneId;
  const formattedOffset = `(${getTimezoneAbbreviation(zoneId)}: ${tz.utcOffsetCode})`;

  // Case 1: description is "aaa Time (bbb)" and zoneId is "ccc/ddd"
  if (desc.match(/^.+\([^)]+\)$/) && zoneId.includes('/')) {
    const result = `${getMainDescription(desc)} - ${getZoneIdSuffix(zoneId)} ${formattedOffset}`;
    return result;
  }
  // Case 2: description is "aaa Time" and zoneId is "ccc/ddd"
  if (desc.match(/Time$/) && zoneId.includes('/')) {
    const result = `${desc} - ${getZoneIdSuffix(zoneId)} ${formattedOffset}`;
    return result;
  }
  // Case 3: description is "aaa Time" and zoneId is "ccc"
  if (desc.match(/Time$/) && !zoneId.includes('/')) {
    const result = `${desc} - ${zoneId} ${formattedOffset}`;
    return result;
  }
  // Case 4: description is "aaa"
  const result = `${desc} ${formattedOffset}`;
  return result;
}

/**
 * Gets timezone abbreviation from timezone code
 * @param timeZoneCode - The timezone code
 * @returns Timezone abbreviation
 */
const getTimezoneAbbreviation = (timeZoneCode: string): string => {
  try {
    const date = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timeZoneCode,
      timeZoneName: 'short',
    });

    const parts = formatter.formatToParts(date);
    const timeZonePart = parts.find(part => part.type === 'timeZoneName');

    const result = timeZonePart?.value || timeZoneCode.split('/').pop()?.toUpperCase() || 'UTC';
    return result;
  } catch (error) {
    // Fallback mapping for common timezones
    const timezoneMap: { [key: string]: string } = {
      'America/New_York': 'EST',
      'America/Chicago': 'CST',
      'America/Denver': 'MST',
      'America/Los_Angeles': 'PST',
      'Europe/London': 'GMT',
      'Europe/Paris': 'CET',
      'Asia/Tokyo': 'JST',
      'Asia/Shanghai': 'CST',
      'Australia/Sydney': 'AEST',
      UTC: 'UTC',
    };

    const result =
      timezoneMap[timeZoneCode] || timeZoneCode.split('/').pop()?.toUpperCase() || 'UTC';
    return result;
  }
};

/**
 * Formats time range with timezone information
 * Converts times to the specified timezone from user profile → account → browser
 * @param startDate - Start date string
 * @param endDate - End date string
 * @param user - User object containing timezone information
 * @param locale - Locale for date formatting
 * @param account - Optional account object to use account-level timezone instead of user timezone
 * @returns Object with timeRange and timezoneDisplay for proper rendering
 */
export const formatTimeRangeWithTimezone = (
  startDate: string,
  endDate: string,
  user: PrimeUser | null,
  locale: string,
  account?: PrimeAccount | null
): { timeRange: string; timezoneDisplay: string } => {
  const timezoneInfo = getUserTimezoneInfo(user, account);

  if (!timezoneInfo) {
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);

    const options: Intl.DateTimeFormatOptions = {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    };

    const timeRange = `${startDateObj.toLocaleTimeString(locale, options)} - ${endDateObj.toLocaleTimeString(locale, options)}`;
    return { timeRange, timezoneDisplay: '' };
  }

  const startDateObj = new Date(startDate);
  const endDateObj = new Date(endDate);

  // Use the timezone from user profile/account to convert the time
  // Use zoneId which contains the IANA timezone identifier (e.g., "America/New_York")
  const options: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
    timeZone: timezoneInfo.zoneId,
  };

  const timeRange = `${startDateObj.toLocaleTimeString(locale, options)} - ${endDateObj.toLocaleTimeString(locale, options)}`;
  const timezoneDisplay = formatTimeZoneDisplay(timezoneInfo);

  return { timeRange, timezoneDisplay };
};

/**
 * Gets formatted timezone display string for user or account
 * @param user - User object containing timezone information
 * @param account - Optional account object to use account-level timezone instead of user timezone
 * @returns Formatted timezone string or empty string if not available
 */
export const getFormattedTimezoneDisplay = (
  user: PrimeUser | null,
  account?: PrimeAccount | null
): string => {
  const timezoneInfo = getUserTimezoneInfo(user, account);

  if (!timezoneInfo) {
    return '';
  }

  const result = formatTimeZoneDisplay(timezoneInfo);
  return result;
};

/**
 * Formats a single time with timezone information
 * Converts time to the specified timezone from user profile → account → browser
 * @param date - The date string
 * @param user - The user object
 * @param locale - The locale string
 * @param account - Optional account object to use account-level timezone instead of user timezone
 * @returns Object with time and timezone display
 */
export const formatSingleTimeWithTimezone = (
  date: string,
  user: PrimeUser | null,
  locale: string,
  account?: PrimeAccount | null
): { time: string; timezoneDisplay: string } => {
  const timezoneInfo = getUserTimezoneInfo(user, account);

  if (!timezoneInfo) {
    const dateObj = new Date(date);
    const options: Intl.DateTimeFormatOptions = {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    };
    const time = dateObj.toLocaleTimeString(locale, options);
    return { time, timezoneDisplay: '' };
  }

  const dateObj = new Date(date);
  // Use the timezone from user profile/account to convert the time
  // Use zoneId which contains the IANA timezone identifier (e.g., "America/New_York")
  const options: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
    timeZone: timezoneInfo.zoneId,
  };

  const time = dateObj.toLocaleTimeString(locale, options);
  const timezoneDisplay = formatTimeZoneDisplay(timezoneInfo);

  return { time, timezoneDisplay };
};

/**
 * Formats date with timezone conversion
 * Converts date to the specified timezone from user profile → account → browser
 * @param dateStr - The date string
 * @param user - The user object
 * @param locale - The locale string
 * @param account - Optional account object to use account-level timezone instead of user timezone
 * @returns Formatted date string in the user's timezone
 */
export const formatDateWithTimezone = (
  dateStr: string,
  user: PrimeUser | null,
  locale: string,
  account?: PrimeAccount | null
): string => {
  if (!dateStr || isNaN(Date.parse(dateStr))) {
    return '';
  }

  const timezoneInfo = getUserTimezoneInfo(user, account);
  const date = new Date(dateStr);

  // If no timezone info, use browser's timezone (existing behavior)
  if (!timezoneInfo) {
    const dateTimeFormat = new Intl.DateTimeFormat(locale, {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    });
    let month, day, year;
    dateTimeFormat.formatToParts(date).forEach(elem => {
      if (elem.type === 'month') {
        month = elem.value;
      } else if (elem.type === 'day') {
        day = elem.value;
      } else if (elem.type === 'year') {
        year = elem.value;
      }
    });
    // Chinese needs space in between the characters
    if (locale === 'zh-CN') {
      return `${year} 年 ${month} 月 ${day} 日`;
    } else if (locale === 'ja-JP') {
      return `${year}年${month}月${day}日`;
    }
    return `${month} ${day}, ${year}`;
  }

  // Convert date to user's timezone
  const dateTimeFormat = new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    timeZone: timezoneInfo.zoneId,
  });

  let month, day, year;
  dateTimeFormat.formatToParts(date).forEach(elem => {
    if (elem.type === 'month') {
      month = elem.value;
    } else if (elem.type === 'day') {
      day = elem.value;
    } else if (elem.type === 'year') {
      year = elem.value;
    }
  });

  // Chinese needs space in between the characters
  if (locale === 'zh-CN') {
    return `${year} 年 ${month} 月 ${day} 日`;
  } else if (locale === 'ja-JP') {
    return `${year}年${month}月${day}日`;
  }
  return `${month} ${day}, ${year}`;
};

/**
 * Checks if two dates are on the same day in the specified timezone
 * @param date1 - First date string
 * @param date2 - Second date string
 * @param user - User object
 * @param locale - Locale string
 * @param account - Optional account object
 * @returns true if dates are on same day in the user's timezone
 */
export const isSameDayInTimezone = (
  date1: string,
  date2: string,
  user: PrimeUser | null,
  locale: string,
  account?: PrimeAccount | null
): boolean => {
  const timezoneInfo = getUserTimezoneInfo(user, account);
  const d1 = new Date(date1);
  const d2 = new Date(date2);

  if (!timezoneInfo) {
    // Fallback to browser timezone
    return d1.toLocaleDateString(locale) === d2.toLocaleDateString(locale);
  }

  // Compare dates in the user's timezone
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    timeZone: timezoneInfo.zoneId,
  };

  const date1Str = d1.toLocaleDateString(locale, options);
  const date2Str = d2.toLocaleDateString(locale, options);

  return date1Str === date2Str;
};

/**
 * Gets date parts (year, month, day) in the specified timezone
 * @param dateStr - Date string
 * @param user - User object
 * @param account - Optional account object
 * @returns Object with year, month (1-12), and day in the user's timezone
 */
export const getDatePartsInTimezone = (
  dateStr: string,
  user: PrimeUser | null,
  account?: PrimeAccount | null
): { year: number; month: number; day: number } => {
  const timezoneInfo = getUserTimezoneInfo(user, account);
  const date = new Date(dateStr);

  if (!timezoneInfo) {
    // Fallback to browser timezone
    return {
      year: date.getFullYear(),
      month: date.getMonth() + 1, // Convert to 1-based indexing
      day: date.getDate(),
    };
  }

  // Get date parts in the user's timezone
  const formatter = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    timeZone: timezoneInfo.zoneId,
  });

  const parts = formatter.formatToParts(date);
  const year = parseInt(parts.find(p => p.type === 'year')?.value || '0');
  const month = parseInt(parts.find(p => p.type === 'month')?.value || '0');
  const day = parseInt(parts.find(p => p.type === 'day')?.value || '0');

  return { year, month, day };
};
