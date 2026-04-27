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
jest.mock('@almLib/utils/translationService', () => ({
  GetTranslation: jest.fn(k => k),
}));

import {
  checkIfEnrollmentDeadlineNotPassed,
  checkIfCompletionDeadlineNotPassed,
  checkIfUnenrollmentDeadlinePassed,
  getResourceBasedOnLocale,
  filterInstanceList,
  getLoInstanceLocales,
  getLanguageDropdownObject,
} from '@almLib/utils/instance';
import { GetTranslation } from '@almLib/utils/translationService';

describe('instance', () => {
  beforeEach(() => {
    (GetTranslation as jest.Mock).mockClear();
    (GetTranslation as jest.Mock).mockImplementation((k: string) => k);
  });

  it('checkIfEnrollmentDeadlineNotPassed', () => {
    const future = new Date(Date.now() + 86400000).toISOString();
    const past = new Date(Date.now() - 86400000).toISOString();
    expect(checkIfEnrollmentDeadlineNotPassed({ enrollmentDeadline: future } as any)).toBe(true);
    expect(checkIfEnrollmentDeadlineNotPassed({ enrollmentDeadline: past } as any)).toBe(false);
  });

  it('checkIfCompletionDeadlineNotPassed', () => {
    const future = new Date(Date.now() + 86400000).toISOString();
    const past = new Date(Date.now() - 86400000).toISOString();
    expect(checkIfCompletionDeadlineNotPassed({ completionDeadline: future } as any)).toBe(true);
    expect(checkIfCompletionDeadlineNotPassed({ completionDeadline: past } as any)).toBe(false);
  });

  it('checkIfUnenrollmentDeadlinePassed', () => {
    const future = new Date(Date.now() + 86400000).toISOString();
    const past = new Date(Date.now() - 86400000).toISOString();
    expect(checkIfUnenrollmentDeadlinePassed({ unenrollmentDeadline: future } as any)).toBe(false);
    expect(checkIfUnenrollmentDeadlinePassed({ unenrollmentDeadline: past } as any)).toBe(true);
  });

  it('getResourceBasedOnLocale', () => {
    const loResource = {
      resources: [
        { locale: 'en-US', location: 'url1' },
        { locale: 'fr-FR', location: 'url2' },
      ],
    } as any;
    const result = getResourceBasedOnLocale(loResource, 'en-US');
    expect(result.locale).toBe('en-US');
  });

  it('filterInstanceList', () => {
    const instances = [{ locale: { name: 'en-US' } }, { locale: { name: 'fr-FR' } }] as any;
    const result = filterInstanceList(instances, 'en-US');
    expect(Array.isArray(result)).toBe(true);
  });

  it('getLoInstanceLocales', () => {
    const instances = [{ locale: 'en-US' }, { locale: 'fr-FR' }] as any;
    const result = getLoInstanceLocales(instances);
    expect(result).toBeInstanceOf(Set);
    expect(result.has('en-US')).toBe(true);
  });

  it('getLanguageDropdownObject', () => {
    const contentLocales = [
      { locale: 'en-US', name: 'English' },
      { locale: 'fr-FR', name: 'French' },
    ] as any;
    const loInstanceLocales = new Set(['en-US', 'fr-FR']);
    const result = getLanguageDropdownObject(contentLocales, loInstanceLocales);
    expect(typeof result).toBe('object');
    expect(result.all).toBe('alm.instance.all');
  });
});
