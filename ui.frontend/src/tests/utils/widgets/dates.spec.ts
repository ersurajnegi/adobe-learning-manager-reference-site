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
import {
  ONE_SEC,
  ONE_MIN,
  ONE_HOUR,
  ONE_DAY,
  msToDays,
  msToHours,
  isAfter,
  add,
  diffBetweenDates,
} from '@almLib/utils/widgets/dates';

describe('dates.ts', () => {
  it('constants', () => {
    expect(ONE_SEC).toBe(1000);
    expect(ONE_MIN).toBe(60000);
    expect(ONE_HOUR).toBe(3600000);
    expect(ONE_DAY).toBe(86400000);
  });

  it('msToDays', () => {
    expect(msToDays(86400000)).toBe(1);
    expect(msToDays(0)).toBe(0);
    msToDays(172800000);
  });

  it('msToHours', () => {
    expect(msToHours(3600000)).toBe(1);
    expect(msToHours(0)).toBe(0);
    msToHours(7200000);
  });

  it('isAfter', () => {
    expect(isAfter('2024-02-01', '2024-01-01')).toBe(true);
    expect(isAfter('2024-01-01', '2024-02-01')).toBe(false);
    isAfter(new Date(), new Date());
  });

  it('add', () => {
    const result = add('2024-01-15', 1, 'd');
    expect(result).toBeInstanceOf(Date);
    add('2024-01-15', 3600000);
  });

  it('diffBetweenDates', () => {
    const diff = diffBetweenDates('2024-01-15', '2024-01-20', 'd');
    expect(diff).toBe(5);
    diffBetweenDates('2024-01-15', '2024-01-20');
    diffBetweenDates('2024-01-15', '2024-01-20', 'h');
  });
});
