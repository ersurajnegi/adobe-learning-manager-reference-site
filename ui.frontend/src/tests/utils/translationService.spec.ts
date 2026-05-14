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

// Mock global utilities before imports
jest.mock('@utils/global', () => ({
  getALMConfig: jest.fn(() => ({
    locale: 'en-US',
  })),
}));

import {
  getLocale,
  getPreferredLocalizedMetadata,
  SetupTranslations,
  isTranslated,
  GetTranslation,
  GetTranslationReplaced,
  GetTranslationForStrings,
  interpolateTemplateAndMap,
  GetTranslationsReplaced,
  ReplaceAccountTerminology,
  getBrowserLocale,
  SetupAccountTerminologies,
  ReplaceLoTypeWithAccountTerminology,
  setupCustomPageTranslations,
  langMap,
  availableLanguages,
} from '@utils/translationService';
import { PrimeAccountTerminology, PrimePage } from '@models/PrimeModels';
import { CustomPageConfig } from '../../models';

describe('translationService', () => {
  describe('getLocale', () => {
    it('should return locale for 2-letter language code', () => {
      expect(getLocale('en')).toBe('en-US');
      expect(getLocale('fr')).toBe('fr-FR');
      expect(getLocale('de')).toBe('de-DE');
      expect(getLocale('ja')).toBe('ja-JP');
    });

    it('should return locale for longer language codes', () => {
      expect(getLocale('en-US')).toBe('en-US');
      expect(getLocale('fr-FR')).toBe('fr-FR');
      expect(getLocale('en_US')).toBe('en-US');
    });

    it('should return undefined for unsupported locales', () => {
      expect(getLocale('xx')).toBeUndefined();
      expect(getLocale('invalid')).toBeUndefined();
    });

    it('should return undefined for empty or null locale', () => {
      expect(getLocale('')).toBeUndefined();
      expect(getLocale(null as any)).toBeUndefined();
      expect(getLocale(undefined as any)).toBeUndefined();
    });

    it('should return locale for all supported languages', () => {
      availableLanguages.forEach(lang => {
        const result = getLocale(lang);
        expect(result).toBe(langMap[lang]);
      });
    });
  });

  describe('getPreferredLocalizedMetadata', () => {
    const mockMetadata = [
      { locale: 'en_US', title: 'English Title', description: 'English Description' },
      { locale: 'fr_FR', title: 'Titre Français', description: 'Description Française' },
      { locale: 'de_DE', title: 'Deutscher Titel', description: 'Deutsche Beschreibung' },
    ];

    it('should return metadata for exact locale match with underscore', () => {
      const result = getPreferredLocalizedMetadata(mockMetadata, 'en_US');
      expect(result.locale).toBe('en_US');
      expect(result.title).toBe('English Title');
    });

    it('should return metadata for exact locale match with hyphen', () => {
      const result = getPreferredLocalizedMetadata(mockMetadata, 'en-US');
      expect(result.locale).toBe('en_US');
      expect(result.title).toBe('English Title');
    });

    it('should return English metadata as fallback when locale not found', () => {
      const result = getPreferredLocalizedMetadata(mockMetadata, 'ja_JP');
      expect(result.locale).toBe('en_US');
      expect(result.title).toBe('English Title');
    });

    it('should return first metadata when English not available', () => {
      const nonEnglishMetadata = [
        { locale: 'fr_FR', title: 'Titre Français' },
        { locale: 'de_DE', title: 'Deutscher Titel' },
      ];
      const result = getPreferredLocalizedMetadata(nonEnglishMetadata, 'ja_JP');
      expect(result.locale).toBe('fr_FR');
    });

    it('should return empty object for null or undefined metadata', () => {
      const result = getPreferredLocalizedMetadata(null as any, 'en_US');
      expect(result).toEqual({});
    });

    it('should throw error for empty array', () => {
      // Function throws when trying to access properties on undefined
      expect(() => getPreferredLocalizedMetadata([], 'en_US')).toThrow();
    });

    it('should replace newlines with br tags in plain text richTextOverview', () => {
      const metadataWithNewlines = [
        {
          locale: 'en_US',
          richTextOverview: 'Line 1\nLine 2\nLine 3',
        },
      ];
      const result = getPreferredLocalizedMetadata(metadataWithNewlines, 'en_US');
      expect(result.richTextOverview).toContain('<br');
      expect(result.richTextOverview).toContain('style="display: block');
    });

    it('should not replace newlines in HTML richTextOverview', () => {
      const metadataWithHtml = [
        {
          locale: 'en_US',
          richTextOverview: '<p>Line 1</p>\n<p>Line 2</p>',
        },
      ];
      const result = getPreferredLocalizedMetadata(metadataWithHtml, 'en_US');
      expect(result.richTextOverview).toBe('<p>Line 1</p>\n<p>Line 2</p>');
      expect(result.richTextOverview).not.toContain('<br');
    });

    it('should handle metadata without richTextOverview', () => {
      const metadata = [{ locale: 'en_US', title: 'Title' }];
      const result = getPreferredLocalizedMetadata(metadata, 'en_US');
      expect(result.title).toBe('Title');
      expect((result as any).richTextOverview).toBeUndefined();
    });

    it('should handle richTextOverview with only HTML tags', () => {
      const metadata = [
        {
          locale: 'en_US',
          richTextOverview: '<div><span>Text</span></div>',
        },
      ];
      const result = getPreferredLocalizedMetadata(metadata, 'en_US');
      expect(result.richTextOverview).toBe('<div><span>Text</span></div>');
    });
  });

  describe('SetupTranslations and GetTranslation', () => {
    const mockTranslations = {
      'app.title': 'Application Title',
      'app.welcome': 'Welcome to the app',
      'error.message': 'An error occurred',
      'course.name': '||COURSE|| ||LEARNING_PATH||',
      'courses.plural': '|||COURSE||| |||LEARNING_PATH|||',
    };

    beforeEach(() => {
      SetupTranslations(JSON.stringify(mockTranslations));
    });

    it('should setup translations correctly', () => {
      expect(GetTranslation('app.title')).toBe('Application Title');
      expect(GetTranslation('app.welcome')).toBe('Welcome to the app');
    });

    it('should return undefined for non-existent keys', () => {
      expect(GetTranslation('non.existent.key')).toBeUndefined();
    });

    it('should handle empty translation strings', () => {
      SetupTranslations('{}');
      expect(GetTranslation('any.key')).toBeUndefined();
    });

    it('should not replace account terminology when flag is false', () => {
      const result = GetTranslation('course.name', false);
      expect(result).toBe('||COURSE|| ||LEARNING_PATH||');
    });

    it('should handle GetTranslation with account terminology replacement', () => {
      const accountTerminologies: PrimeAccountTerminology[] = [
        {
          id: '1',
          _transient: {},
          entityType: 'COURSE',
          locale: 'en-US',
          name: 'Training',
          pluralName: 'Trainings',
        },
        {
          id: '2',
          _transient: {},
          entityType: 'LEARNING_PATH',
          locale: 'en-US',
          name: 'Journey',
          pluralName: 'Journeys',
        },
      ];
      SetupAccountTerminologies(accountTerminologies);
      const result = GetTranslation('course.name', true);
      expect(result).toContain('Training');
      expect(result).toContain('Journey');
    });
  });

  describe('isTranslated', () => {
    it('should return true for translated strings without placeholders', () => {
      expect(isTranslated('Regular text')).toBe(true);
      expect(isTranslated('Hello World')).toBe(true);
    });

    it('should return false for strings with singular placeholder', () => {
      expect(isTranslated('Course || Text ||')).toBe(false);
      expect(isTranslated('|| placeholder ||')).toBe(false);
    });

    it('should return false for strings with plural placeholder', () => {
      expect(isTranslated('Courses ||| Text |||')).toBe(false);
      expect(isTranslated('||| placeholder |||')).toBe(false);
    });

    it('should handle empty strings', () => {
      expect(isTranslated('')).toBe(true);
    });

    it('should handle strings with similar but not exact patterns', () => {
      expect(isTranslated('Text | pipe | text')).toBe(true);
      expect(isTranslated('Text || no closing')).toBe(false);
    });
  });

  describe('GetTranslationReplaced', () => {
    beforeEach(() => {
      const translations = {
        'message.greeting': 'Hello {{name}}!',
        'message.count': 'You have {{count}} items',
        'message.multiple': '{{user}} has {{count}} courses',
      };
      SetupTranslations(JSON.stringify(translations));
    });

    it('should replace single placeholder', () => {
      const result = GetTranslationReplaced('message.greeting', 'John');
      expect(result).toBe('Hello John!');
    });

    it('should replace placeholder with number', () => {
      const result = GetTranslationReplaced('message.count', '5');
      expect(result).toBe('You have 5 items');
    });

    it('should replace only first placeholder when single value provided', () => {
      const result = GetTranslationReplaced('message.multiple', 'Alice');
      // Only replaces first placeholder ({{user}}), leaves second ({{count}}) empty
      expect(result).toBe('Alice courses');
    });

    it('should handle empty replacement value', () => {
      const result = GetTranslationReplaced('message.greeting', '');
      expect(result).toBe('Hello !');
    });

    it('should handle account terminology replacement', () => {
      const accountTerminologies: PrimeAccountTerminology[] = [
        {
          id: '1',
          _transient: {},
          entityType: 'COURSE',
          locale: 'en-US',
          name: 'Training',
          pluralName: 'Trainings',
        },
      ];
      SetupAccountTerminologies(accountTerminologies);

      const translations = {
        'with.terminology': 'Welcome to ||COURSE|| {{name}}',
      };
      SetupTranslations(JSON.stringify(translations));

      const result = GetTranslationReplaced('with.terminology', 'Test', true);
      expect(result).toContain('Training');
      expect(result).toContain('Test');
    });
  });

  describe('GetTranslationForStrings', () => {
    const translationsString = JSON.stringify({
      'template.basic': 'Hello ${name}!',
      'template.complex': 'User ${user} has ${count} items worth $${price}',
      'template.boolean': 'Active: ${isActive}',
    });

    it('should interpolate template with string params', () => {
      const result = GetTranslationForStrings('template.basic', translationsString, {
        name: 'Alice',
      });
      expect(result).toBe('Hello Alice!');
    });

    it('should interpolate template with multiple params', () => {
      const result = GetTranslationForStrings('template.complex', translationsString, {
        user: 'Bob',
        count: 10,
        price: 99.99,
      });
      expect(result).toBe('User Bob has 10 items worth $99.99');
    });

    it('should interpolate template with boolean params', () => {
      const result = GetTranslationForStrings('template.boolean', translationsString, {
        isActive: true,
      });
      expect(result).toBe('Active: true');
    });

    it('should interpolate template with number params', () => {
      const result = GetTranslationForStrings('template.complex', translationsString, {
        user: 'Charlie',
        count: 0,
        price: 0,
      });
      expect(result).toBe('User Charlie has 0 items worth $0');
    });

    it('should return empty string for non-existent key', () => {
      const result = GetTranslationForStrings('non.existent', translationsString, {});
      expect(result).toBe('');
    });

    it('should handle empty params object', () => {
      const result = GetTranslationForStrings('template.basic', translationsString, {});
      // When params is empty, template variables are not replaced (ReferenceError caught)
      // The function returns the template as-is or handles the error gracefully
      expect(result).toBe('Hello !');
    });

    it('should handle account terminology replacement', () => {
      const accountTerminologies: PrimeAccountTerminology[] = [
        {
          id: '1',
          _transient: {},
          entityType: 'COURSE',
          locale: 'en-US',
          name: 'Training',
          pluralName: 'Trainings',
        },
      ];
      SetupAccountTerminologies(accountTerminologies);

      const transWithTerminology = JSON.stringify({
        'with.term': '||COURSE|| for ${name}',
      });

      const result = GetTranslationForStrings(
        'with.term',
        transWithTerminology,
        { name: 'John' },
        true
      );
      expect(result).toContain('Training');
      expect(result).toContain('John');
    });
  });

  describe('interpolateTemplateAndMap', () => {
    it('should interpolate template with string values', () => {
      const result = interpolateTemplateAndMap('Hello ${name}!', { name: 'World' });
      expect(result).toBe('Hello World!');
    });

    it('should interpolate template with number values', () => {
      const result = interpolateTemplateAndMap('Count: ${count}', { count: 42 });
      expect(result).toBe('Count: 42');
    });

    it('should interpolate template with boolean values', () => {
      const result = interpolateTemplateAndMap('Active: ${status}', { status: true });
      expect(result).toBe('Active: true');
    });

    it('should interpolate template with multiple parameters', () => {
      const template = '${firstName} ${lastName} is ${age} years old';
      const result = interpolateTemplateAndMap(template, {
        firstName: 'John',
        lastName: 'Doe',
        age: 30,
      });
      expect(result).toBe('John Doe is 30 years old');
    });

    it('should handle template with no parameters', () => {
      const result = interpolateTemplateAndMap('Static text', {});
      expect(result).toBe('Static text');
    });

    it('should handle empty template', () => {
      const result = interpolateTemplateAndMap('', { name: 'Test' });
      expect(result).toBe('');
    });

    it('should handle special characters in values', () => {
      const result = interpolateTemplateAndMap('Value: ${val}', {
        val: 'Test & <value>',
      });
      expect(result).toBe('Value: Test & <value>');
    });
  });

  describe('GetTranslationsReplaced', () => {
    beforeEach(() => {
      const translations = {
        'multi.param': 'User ${user} has ${count} courses at ${price} each',
        'single.param': 'Hello ${name}',
      };
      SetupTranslations(JSON.stringify(translations));
    });

    it('should replace multiple parameters', () => {
      const result = GetTranslationsReplaced('multi.param', {
        user: 'Alice',
        count: 5,
        price: 99.99,
      });
      expect(result).toBe('User Alice has 5 courses at 99.99 each');
    });

    it('should replace single parameter', () => {
      const result = GetTranslationsReplaced('single.param', { name: 'Bob' });
      expect(result).toBe('Hello Bob');
    });

    it('should handle mixed type parameters', () => {
      const result = GetTranslationsReplaced('multi.param', {
        user: 'Charlie',
        count: 0,
        price: false,
      });
      expect(result).toContain('Charlie');
      expect(result).toContain('0');
      expect(result).toContain('false');
    });

    it('should handle account terminology replacement', () => {
      const accountTerminologies: PrimeAccountTerminology[] = [
        {
          id: '1',
          _transient: {},
          entityType: 'COURSE',
          locale: 'en-US',
          name: 'Training',
          pluralName: 'Trainings',
        },
      ];
      SetupAccountTerminologies(accountTerminologies);

      const translations = {
        'with.term': '||COURSE|| ${name}',
      };
      SetupTranslations(JSON.stringify(translations));

      const result = GetTranslationsReplaced('with.term', { name: 'Test' }, true);
      expect(result).toContain('Training');
      expect(result).toContain('Test');
    });
  });

  describe('ReplaceAccountTerminology', () => {
    const accountTerminologies: PrimeAccountTerminology[] = [
      {
        id: '1',
        _transient: {},
        entityType: 'COURSE',
        locale: 'en-US',
        name: 'Training',
        pluralName: 'Trainings',
      },
      {
        id: '2',
        _transient: {},
        entityType: 'LEARNING_PATH',
        locale: 'en-US',
        name: 'Journey',
        pluralName: 'Journeys',
      },
    ];

    beforeEach(() => {
      SetupAccountTerminologies(accountTerminologies);
    });

    afterEach(() => {
      // Reset to defaults after each test
      SetupAccountTerminologies();
    });

    it('should replace singular terminology', () => {
      const result = ReplaceAccountTerminology('Complete this ||COURSE||');
      expect(result).toBe('Complete this Training');
    });

    it('should replace plural terminology', () => {
      const result = ReplaceAccountTerminology('Browse |||COURSE|||');
      expect(result).toBe('Browse Trainings');
    });

    it('should replace multiple terminologies', () => {
      const result = ReplaceAccountTerminology('||COURSE|| and ||LEARNING_PATH||');
      expect(result).toContain('Training');
      expect(result).toContain('Journey');
    });

    it('should replace mixed singular and plural', () => {
      const result = ReplaceAccountTerminology('One ||COURSE|| or many |||COURSE|||');
      expect(result).toContain('Training');
      expect(result).toContain('Trainings');
    });

    it('should return string with undefined when no terminology map', () => {
      SetupAccountTerminologies([]);
      const result = ReplaceAccountTerminology('||COURSE||');
      // When map is empty, replacement returns undefined
      expect(result).toBe('undefined');
    });

    it('should return original string if translation is null', () => {
      const result = ReplaceAccountTerminology(null as any);
      expect(result).toBeNull();
    });

    it('should return original string if translation is undefined', () => {
      const result = ReplaceAccountTerminology(undefined as any);
      expect(result).toBeUndefined();
    });

    it('should handle string without terminologies', () => {
      const result = ReplaceAccountTerminology('Regular text without placeholders');
      expect(result).toBe('Regular text without placeholders');
    });

    it('should handle unknown terminology types', () => {
      const result = ReplaceAccountTerminology('||UNKNOWN||');
      // Unknown terminology returns undefined
      expect(result).toBe('undefined');
    });
  });

  describe('getBrowserLocale', () => {
    const originalNavigator = window.navigator;
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

    afterEach(() => {
      Object.defineProperty(window, 'navigator', {
        value: originalNavigator,
        writable: true,
      });
      consoleLogSpy.mockClear();
    });

    it('should return mapped locale from browser languages', () => {
      Object.defineProperty(window, 'navigator', {
        value: { languages: ['fr-FR', 'en-US'] },
        writable: true,
      });
      const result = getBrowserLocale();
      expect(result).toBe('fr-FR');
    });

    it('should return first supported language', () => {
      Object.defineProperty(window, 'navigator', {
        value: { languages: ['xx-XX', 'de-DE', 'en-US'] },
        writable: true,
      });
      const result = getBrowserLocale();
      expect(result).toBe('de-DE');
    });

    it('should fallback to English when no supported language found', () => {
      Object.defineProperty(window, 'navigator', {
        value: { languages: ['xx-XX', 'yy-YY'] },
        writable: true,
      });
      const result = getBrowserLocale();
      expect(result).toBe('en-US');
    });

    it('should fallback to English when languages array is empty', () => {
      Object.defineProperty(window, 'navigator', {
        value: { languages: [] },
        writable: true,
      });
      const result = getBrowserLocale();
      expect(result).toBe('en-US');
    });

    it('should handle 2-letter language codes', () => {
      Object.defineProperty(window, 'navigator', {
        value: { languages: ['fr', 'en'] },
        writable: true,
      });
      const result = getBrowserLocale();
      expect(result).toBe('fr-FR');
    });

    it('should log browser languages', () => {
      Object.defineProperty(window, 'navigator', {
        value: { languages: ['en-US'] },
        writable: true,
      });
      getBrowserLocale();
      expect(consoleLogSpy).toHaveBeenCalledWith('Languages: en-US');
    });
  });

  describe('SetupAccountTerminologies', () => {
    afterEach(() => {
      // Reset to defaults after each test
      SetupAccountTerminologies();
    });

    it('should setup account terminologies', () => {
      const terminologies: PrimeAccountTerminology[] = [
        {
          id: '1',
          _transient: {},
          entityType: 'COURSE',
          locale: 'en-US',
          name: 'MyTraining',
          pluralName: 'MyTrainings',
        },
      ];
      SetupAccountTerminologies(terminologies);
      const result = ReplaceAccountTerminology('||COURSE||');
      expect(result).toBe('MyTraining');
    });

    it('should setup multiple terminologies', () => {
      const terminologies: PrimeAccountTerminology[] = [
        {
          id: '1',
          _transient: {},
          entityType: 'COURSE',
          locale: 'en-US',
          name: 'Training',
          pluralName: 'Trainings',
        },
        {
          id: '2',
          _transient: {},
          entityType: 'BADGE',
          locale: 'en-US',
          name: 'Achievement',
          pluralName: 'Achievements',
        },
      ];
      SetupAccountTerminologies(terminologies);
      expect(ReplaceAccountTerminology('||COURSE||')).toBe('Training');
      expect(ReplaceAccountTerminology('||BADGE||')).toBe('Achievement');
    });

    it('should use default terminologies when not provided', () => {
      SetupAccountTerminologies();
      const result = ReplaceAccountTerminology('||COURSE||');
      expect(result).toBe('Course');
    });

    it('should override previous terminologies', () => {
      const first: PrimeAccountTerminology[] = [
        {
          id: '1',
          _transient: {},
          entityType: 'COURSE',
          locale: 'en-US',
          name: 'First',
          pluralName: 'Firsts',
        },
      ];
      SetupAccountTerminologies(first);
      expect(ReplaceAccountTerminology('||COURSE||')).toBe('First');

      const second: PrimeAccountTerminology[] = [
        {
          id: '2',
          _transient: {},
          entityType: 'COURSE',
          locale: 'en-US',
          name: 'Second',
          pluralName: 'Seconds',
        },
      ];
      SetupAccountTerminologies(second);
      expect(ReplaceAccountTerminology('||COURSE||')).toBe('Second');
    });

    it('should handle empty terminologies array', () => {
      SetupAccountTerminologies([]);
      const result = ReplaceAccountTerminology('||COURSE||');
      // When map is empty, undefined is returned
      expect(result).toBe('undefined');
    });
  });

  describe('ReplaceLoTypeWithAccountTerminology', () => {
    beforeEach(() => {
      const terminologies: PrimeAccountTerminology[] = [
        {
          id: '1',
          _transient: {},
          entityType: 'COURSE',
          locale: 'en-US',
          name: 'Training',
          pluralName: 'Trainings',
        },
        {
          id: '2',
          _transient: {},
          entityType: 'LEARNING_PATH',
          locale: 'en-US',
          name: 'Journey',
          pluralName: 'Journeys',
        },
        {
          id: '3',
          _transient: {},
          entityType: 'CERTIFICATION',
          locale: 'en-US',
          name: 'Certificate',
          pluralName: 'Certificates',
        },
        {
          id: '4',
          _transient: {},
          entityType: 'JOB_AID',
          locale: 'en-US',
          name: 'Resource',
          pluralName: 'Resources',
        },
        {
          id: '5',
          _transient: {},
          entityType: 'MODULE',
          locale: 'en-US',
          name: 'Unit',
          pluralName: 'Units',
        },
        {
          id: '6',
          _transient: {},
          entityType: 'MODULES',
          locale: 'en-US',
          name: 'Units',
          pluralName: 'Units',
        },
      ];
      SetupAccountTerminologies(terminologies);
    });

    it('should replace learningProgram with LEARNING_PATH terminology', () => {
      const result = ReplaceLoTypeWithAccountTerminology('learningProgram');
      expect(result).toBe('Journey');
    });

    it('should replace jobAid with JOB_AID terminology', () => {
      const result = ReplaceLoTypeWithAccountTerminology('jobAid');
      expect(result).toBe('Resource');
    });

    it('should replace certification with CERTIFICATION terminology', () => {
      const result = ReplaceLoTypeWithAccountTerminology('certification');
      expect(result).toBe('Certificate');
    });

    it('should replace MODULES with MODULES terminology', () => {
      const result = ReplaceLoTypeWithAccountTerminology('MODULES');
      expect(result).toBe('Units');
    });

    it('should replace MODULE with MODULE terminology', () => {
      const result = ReplaceLoTypeWithAccountTerminology('MODULE');
      expect(result).toBe('Unit');
    });

    it('should replace course with COURSE terminology', () => {
      const result = ReplaceLoTypeWithAccountTerminology('course');
      expect(result).toBe('Training');
    });

    it('should replace unknown type with COURSE terminology', () => {
      const result = ReplaceLoTypeWithAccountTerminology('unknown');
      expect(result).toBe('Training');
    });

    it('should return original term when terminology not set', () => {
      SetupAccountTerminologies([]);
      const result = ReplaceLoTypeWithAccountTerminology('learningProgram');
      expect(result).toBe('learningProgram');
    });

    it('should handle empty string', () => {
      const result = ReplaceLoTypeWithAccountTerminology('');
      expect(result).toBe('Training');
    });
  });

  describe('setupCustomPageTranslations', () => {
    const mockGetALMConfig = require('@utils/global').getALMConfig;

    beforeEach(() => {
      // Setup base translations
      SetupTranslations(
        JSON.stringify({
          'base.key': 'Base Value',
        })
      );

      // Setup account terminologies
      SetupAccountTerminologies();

      // Reset mock
      mockGetALMConfig.mockReturnValue({ locale: 'en-US' });

      // Mock navigator languages
      Object.defineProperty(window, 'navigator', {
        value: { languages: ['en-US'] },
        writable: true,
        configurable: true,
      });
    });

    it('should setup custom page translations for widgets', () => {
      const pageData: PrimePage = {
        id: 'page-1',
        defaultLocale: 'en-US',
      } as PrimePage;

      const pageConfig: CustomPageConfig = {
        pageId: 1,
        widgets: {
          'widget-1': {} as any,
          'widget-2': {} as any,
        },
        translations: {
          en_US: {
            'widget-1': {
              title: 'Widget Title',
              description: 'Widget Description',
            },
            'widget-2': {
              label: 'Widget Label',
            },
          },
        },
      };

      setupCustomPageTranslations(pageData, pageConfig);

      expect(GetTranslation('widget-1.title')).toBe('Widget Title');
      expect(GetTranslation('widget-1.description')).toBe('Widget Description');
      expect(GetTranslation('widget-2.label')).toBe('Widget Label');
    });

    it('should merge custom translations with existing translations', () => {
      const pageData: PrimePage = {
        id: 'page-1',
        defaultLocale: 'en-US',
      } as PrimePage;

      const pageConfig: CustomPageConfig = {
        pageId: 1,
        widgets: { 'widget-1': {} as any },
        translations: {
          en_US: {
            'widget-1': { custom: 'Custom Value' },
          },
        },
      };

      setupCustomPageTranslations(pageData, pageConfig);

      // Base translation should still exist
      expect(GetTranslation('base.key')).toBe('Base Value');
      // New custom translation should be added
      expect(GetTranslation('widget-1.custom')).toBe('Custom Value');
    });

    it('should handle multiple locales with priority', () => {
      const pageData: PrimePage = {
        id: 'page-1',
        defaultLocale: 'fr-FR',
      } as PrimePage;

      mockGetALMConfig.mockReturnValue({ locale: 'de-DE' });

      const pageConfig: CustomPageConfig = {
        pageId: 1,
        widgets: { 'widget-1': {} as any },
        translations: {
          fr_FR: { 'widget-1': { key: 'French' } },
          en_US: { 'widget-1': { key: 'English' } },
          de_DE: { 'widget-1': { key: 'German' } },
        },
      };

      setupCustomPageTranslations(pageData, pageConfig);

      // Config locale (de-DE) should have highest priority
      expect(GetTranslation('widget-1.key')).toBe('German');
    });

    it('should handle missing translations gracefully', () => {
      const pageData: PrimePage = {
        id: 'page-1',
      } as PrimePage;

      const pageConfig: CustomPageConfig = {
        pageId: 1,
        widgets: { 'widget-1': {} as any },
        translations: {},
      };

      setupCustomPageTranslations(pageData, pageConfig);

      expect(GetTranslation('widget-1.missing')).toBeUndefined();
    });

    it('should handle empty widgets object', () => {
      const pageData: PrimePage = {
        id: 'page-1',
      } as PrimePage;

      const pageConfig: CustomPageConfig = {
        pageId: 1,
        widgets: {},
      };

      setupCustomPageTranslations(pageData, pageConfig);

      expect(GetTranslation('base.key')).toBe('Base Value');
    });

    it('should normalize locale with hyphen to underscore', () => {
      const pageData: PrimePage = {
        id: 'page-1',
        defaultLocale: 'en-US',
      } as PrimePage;

      const pageConfig: CustomPageConfig = {
        pageId: 1,
        widgets: { 'widget-1': {} as any },
        translations: {
          en_US: { 'widget-1': { key: 'Value' } },
        },
      };

      setupCustomPageTranslations(pageData, pageConfig);

      expect(GetTranslation('widget-1.key')).toBe('Value');
    });

    it('should use browser locale when page default is not set', () => {
      Object.defineProperty(window, 'navigator', {
        value: { languages: ['fr-FR'] },
        writable: true,
        configurable: true,
      });

      mockGetALMConfig.mockReturnValue({ locale: 'en-US' });

      const pageData: PrimePage = {
        id: 'page-1',
      } as PrimePage;

      const pageConfig: CustomPageConfig = {
        pageId: 1,
        widgets: { 'widget-1': {} as any },
        translations: {
          fr_FR: { 'widget-1': { key: 'French' } },
          en_US: { 'widget-1': { key: 'English' } },
        },
      };

      setupCustomPageTranslations(pageData, pageConfig);

      // Config locale should override browser locale
      expect(GetTranslation('widget-1.key')).toBe('English');
    });

    it('should preserve empty string values', () => {
      const pageData: PrimePage = {
        id: 'page-1',
      } as PrimePage;

      const pageConfig: CustomPageConfig = {
        pageId: 1,
        widgets: { 'widget-1': {} as any },
        translations: {
          en_US: {
            'widget-1': {
              empty: '',
              filled: 'Value',
            },
          },
        },
      };

      setupCustomPageTranslations(pageData, pageConfig);

      expect(GetTranslation('widget-1.empty')).toBe('');
      expect(GetTranslation('widget-1.filled')).toBe('Value');
    });
  });

  describe('langMap and availableLanguages', () => {
    it('should have matching keys in langMap and availableLanguages', () => {
      availableLanguages.forEach(lang => {
        expect(typeof langMap[lang]).toBe('string');
      });
    });

    it('should have all expected languages', () => {
      const expectedLanguages = [
        'de',
        'en',
        'es',
        'fr',
        'hi',
        'id',
        'it',
        'ja',
        'ko',
        'nb',
        'nl',
        'pl',
        'pt',
        'ru',
        'sv',
        'tr',
        'zh',
        'zz',
        'ca',
      ];
      expectedLanguages.forEach(lang => {
        expect(availableLanguages).toContain(lang);
      });
    });

    it('should have correct locale mappings', () => {
      expect(langMap['en']).toBe('en-US');
      expect(langMap['fr']).toBe('fr-FR');
      expect(langMap['de']).toBe('de-DE');
      expect(langMap['ja']).toBe('ja-JP');
      expect(langMap['zh']).toBe('zh-CN');
      expect(langMap['ca']).toBe('fr-CA');
    });

    it('should have pseudo locale for testing', () => {
      expect(langMap['zz']).toBe('zz-ZZ');
      expect(availableLanguages).toContain('zz');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle malformed JSON in SetupTranslations', () => {
      expect(() => SetupTranslations('invalid json')).toThrow();
    });

    it('should handle special characters in translation keys', () => {
      const translations = {
        'key.with.dots': 'Value',
        'key-with-dashes': 'Value',
        key_with_underscores: 'Value',
      };
      SetupTranslations(JSON.stringify(translations));
      expect(GetTranslation('key.with.dots')).toBe('Value');
      expect(GetTranslation('key-with-dashes')).toBe('Value');
      expect(GetTranslation('key_with_underscores')).toBe('Value');
    });

    it('should handle very long translation strings', () => {
      const longString = 'A'.repeat(10000);
      const translations = { 'long.key': longString };
      SetupTranslations(JSON.stringify(translations));
      expect(GetTranslation('long.key')).toBe(longString);
    });

    it('should handle unicode characters in translations', () => {
      const translations = {
        unicode: '你好世界 🌍 Привет мир',
      };
      SetupTranslations(JSON.stringify(translations));
      expect(GetTranslation('unicode')).toBe('你好世界 🌍 Привет мир');
    });

    it('should handle nested template strings', () => {
      const result = interpolateTemplateAndMap('${outer} ${inner}', {
        outer: '${nested}',
        inner: 'value',
      });
      expect(result).toBe('${nested} value');
    });
  });
});
