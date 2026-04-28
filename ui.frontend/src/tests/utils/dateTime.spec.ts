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
import { GetTranslation, GetTranslationReplaced } from '@almLib/utils/translationService';

jest.mock('@almLib/utils/translationService', () => ({
  GetTranslation: jest.fn(k => k),
  GetTranslationReplaced: jest.fn((k, v) => `${v} ${k}`),
}));

import {
  convertSecondsToHourAndMinsText,
  modifyTime,
  GetFormattedDate,
  calculateSecondsToTime,
} from '@almLib/utils/dateTime';

describe('dateTime', () => {
  beforeEach(() => {
    (GetTranslation as jest.Mock).mockImplementation((k: string) => k);
    (GetTranslationReplaced as jest.Mock).mockImplementation((k: string, v: string) => `${v} ${k}`);
  });
  it('convertSecondsToHourAndMinsText', () => {
    expect(convertSecondsToHourAndMinsText(0)).toContain('alm.text.mins');
    expect(convertSecondsToHourAndMinsText(60)).toBe('alm.text.1min');
    expect(convertSecondsToHourAndMinsText(3600)).toBe('alm.text.1hr ');
    expect(convertSecondsToHourAndMinsText(3661)).toContain('alm.text.1hr');
  });

  it('modifyTime', () => {
    expect(modifyTime('2024-01-15T10:30:00', 'en-US')).toBeTruthy();
    expect(modifyTime('invalid', 'en-US')).toBe('');
  });

  it('GetFormattedDate', () => {
    expect(GetFormattedDate('2024-01-15', 'en-US')).toBeTruthy();
    expect(GetFormattedDate('invalid', 'en-US')).toBe('');
  });

  it('calculateSecondsToTime', () => {
    expect(calculateSecondsToTime(0)).toContain('alm.text.mins');
    expect(calculateSecondsToTime(3661)).toContain('alm.text');
  });
});
