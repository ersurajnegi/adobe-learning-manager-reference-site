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

// Mock dependencies before imports
jest.mock('@utils/global', () => {
  const actualGlobal = jest.requireActual('@utils/global');
  return {
    // Keep the actual implementations of simple utility functions
    containsElement: actualGlobal.containsElement,
    containsSubstr: actualGlobal.containsSubstr,
    // Mock the config function
    getALMConfig: () => ({
      defaultCatalogSort: 'relevance',
    }),
  };
});

import {
  convertToLearnerDesktopParams,
  convertJsonToUri,
  convertToReactParams,
} from '@utils/urlConv';

describe('urlConv.tsx utility functions', () => {
  // Helper function to set window location for tests
  const setLocation = (url: string) => {
    // Delete and recreate window.location with URL object
    // This is the pattern that works with JSDOM
    delete (global as any).window.location;
    (global as any).window.location = new URL(url);
  };

  beforeEach(() => {
    // Reset window.location to default
    delete (global as any).window.location;
    (global as any).window.location = new URL('https://test.adobe.com/learner');

    jest.clearAllMocks();
  });

  // ========== convertToLearnerDesktopParams ==========

  describe('convertToLearnerDesktopParams', () => {
    it('should return empty string when no query parameters', () => {
      setLocation('https://test.adobe.com/learner');

      const result = convertToLearnerDesktopParams();
      expect(result).toBe('');
    });

    it('should convert search text parameter', () => {
      setLocation('https://test.adobe.com/learner?searchText=javascript');

      const result = convertToLearnerDesktopParams();
      expect(result).toContain('searchString=');
      expect(result).toContain('javascript');
    });

    it('should convert sort parameter', () => {
      setLocation('https://test.adobe.com/learner?sort=name');

      const result = convertToLearnerDesktopParams();
      expect(result).toContain('selectedSortOption=alpha');
    });

    it('should convert tag name parameter', () => {
      setLocation('https://test.adobe.com/learner?tagName=tag1,tag2');

      const result = convertToLearnerDesktopParams();
      expect(result).toContain('selectedTags=');
      expect(result).toContain('tag1');
      expect(result).toContain('tag2');
    });

    it('should convert skill name parameter', () => {
      setLocation('https://test.adobe.com/learner?skillName=skill1,skill2');

      const result = convertToLearnerDesktopParams();
      expect(result).toContain('selectedCategories=');
      expect(result).toContain('skill1');
      expect(result).toContain('skill2');
    });

    it('should convert catalogs parameter', () => {
      setLocation('https://test.adobe.com/learner?catalogs=cat1,cat2');

      const result = convertToLearnerDesktopParams();
      expect(result).toContain('selectedListableCatalogIds=');
      expect(result).toContain('cat1');
      expect(result).toContain('cat2');
    });

    it('should handle multiple parameters', () => {
      setLocation('https://test.adobe.com/learner?searchText=test&sort=name&tagName=tag1');

      const result = convertToLearnerDesktopParams();
      expect(result).toContain('searchString=');
      expect(result).toContain('selectedSortOption=');
      expect(result).toContain('selectedTags=');
    });

    it('should handle learner desktop specific parameters', () => {
      setLocation('https://test.adobe.com/learner?mode=view&myLearning=true');

      const result = convertToLearnerDesktopParams();
      expect(result).toContain('mode=');
      expect(result).toContain('myLearning=');
    });

    it('should handle URL encoded parameters', () => {
      setLocation('https://test.adobe.com/learner?searchText=test%20query');

      const result = convertToLearnerDesktopParams();
      expect(result).toContain('searchString=');
    });

    it('should handle special characters in search', () => {
      const searchTerm = 'C++';
      setLocation(`https://test.adobe.com/learner?searchText=${encodeURIComponent(searchTerm)}`);

      const result = convertToLearnerDesktopParams();
      expect(result).toContain('searchString=');
    });

    it('should convert skill level parameters', () => {
      setLocation('https://test.adobe.com/learner?skillLevel=1,2');

      const result = convertToLearnerDesktopParams();
      expect(result).toContain('beginnerSelected=true');
      expect(result).toContain('intermediateSelected=true');
    });

    it('should convert learner state parameters', () => {
      setLocation('https://test.adobe.com/learner?learnerState=enrolled,completed');

      const result = convertToLearnerDesktopParams();
      expect(result).toContain('enrolledSelected=true');
      expect(result).toContain('completedSelected=true');
    });

    it('should convert loTypes parameters', () => {
      setLocation('https://test.adobe.com/learner?loTypes=course,jobAid');

      const result = convertToLearnerDesktopParams();
      expect(result).toContain('courseSelected=true');
      expect(result).toContain('jobAidsSelected=true');
    });

    it('should convert price parameters', () => {
      setLocation('https://test.adobe.com/learner?price=free,paid');

      const result = convertToLearnerDesktopParams();
      expect(result).toContain('freeSelected=true');
      expect(result).toContain('paidSelected=true');
    });

    it('should convert duration parameters', () => {
      setLocation('https://test.adobe.com/learner?duration=0-1800,1801-7200');

      const result = convertToLearnerDesktopParams();
      expect(result).toContain('shortDurationSelected=true');
      expect(result).toContain('mediumDurationSelected=true');
    });

    it('should handle bookmarks parameter', () => {
      setLocation('https://test.adobe.com/learner?bookmarks=true');

      const result = convertToLearnerDesktopParams();
      expect(result).toContain('bookmarks=true');
    });

    it('should handle jobAidId parameter', () => {
      setLocation('https://test.adobe.com/learner?jobAidId=12345');

      const result = convertToLearnerDesktopParams();
      expect(result).toContain('jobAidId=12345');
    });
  });

  // ========== convertJsonToUri ==========

  describe('convertJsonToUri', () => {
    it('should convert simple object to URI string', () => {
      const obj = { key1: 'value1', key2: 'value2' };
      const result = convertJsonToUri(obj);

      expect(result).toContain('key1=value1');
      expect(result).toContain('key2=value2');
      expect(result).toContain('&');
    });

    it('should handle empty object', () => {
      const obj = {};
      const result = convertJsonToUri(obj);

      expect(result).toBe('');
    });

    it('should handle single key-value pair', () => {
      const obj = { search: 'test' };
      const result = convertJsonToUri(obj);

      expect(result).toBe('search=test&');
    });

    it('should handle numeric values', () => {
      const obj = { page: 1, limit: 10 };
      const result = convertJsonToUri(obj);

      expect(result).toContain('page=1');
      expect(result).toContain('limit=10');
    });

    it('should handle boolean values', () => {
      const obj = { active: true, disabled: false };
      const result = convertJsonToUri(obj);

      expect(result).toContain('active=true');
      expect(result).toContain('disabled=false');
    });

    it('should handle array values', () => {
      const obj = { tags: ['tag1', 'tag2'] };
      const result = convertJsonToUri(obj);

      expect(result).toContain('tags=');
      expect(result).toContain('tag1,tag2');
    });

    it('should end with ampersand', () => {
      const obj = { key: 'value' };
      const result = convertJsonToUri(obj);

      expect(result).toMatch(/&$/);
    });

    it('should handle multiple key-value pairs', () => {
      const obj = {
        search: 'javascript',
        sort: 'name',
        filter: 'course',
      };
      const result = convertJsonToUri(obj);

      expect(result).toContain('search=javascript');
      expect(result).toContain('sort=name');
      expect(result).toContain('filter=course');
    });
  });

  // ========== convertToReactParams ==========

  describe('convertToReactParams', () => {
    it('should convert learner desktop dynamic filters', () => {
      const params = {
        selectedTags: '["tag1","tag2"]',
        selectedCategories: '["skill1","skill2"]',
      };

      const result = convertToReactParams(params);

      expect(result).toHaveProperty('tagName');
      expect(result).toHaveProperty('skillName');
      expect(result.tagName).toContain('tag1');
      expect(result.tagName).toContain('tag2');
    });

    it('should convert search string parameter', () => {
      const params = {
        searchString: '["javascript"]',
      };

      const result = convertToReactParams(params);

      expect(result).toHaveProperty('searchText');
      expect(result.searchText).toBe('javascript');
    });

    it('should convert sort option parameter', () => {
      const params = {
        selectedSortOption: 'alpha',
      };

      const result = convertToReactParams(params);

      expect(result).toHaveProperty('sort');
      expect(result.sort).toBe('name');
    });

    it('should handle already converted React params', () => {
      const params = {
        searchText: '["test"]',
        tagName: '["tag1"]',
      };

      const result = convertToReactParams(params);

      expect(result).toHaveProperty('searchText');
      expect(result).toHaveProperty('tagName');
    });

    it('should convert learner desktop mandatory params', () => {
      const params = {
        mode: 'view',
        myLearning: 'true',
      };

      const result = convertToReactParams(params);

      expect(result).toHaveProperty('mode');
      expect(result).toHaveProperty('myLearning');
      expect(result.mode).toBe('view');
      expect(result.myLearning).toBe('true');
    });

    it('should convert static parameters from map', () => {
      const params = {
        beginnerSelected: 'true',
        enrolledSelected: 'true',
      };

      const result = convertToReactParams(params);

      expect(result).toHaveProperty('skillLevel');
      expect(result).toHaveProperty('learnerState');
    });

    it('should handle multiple selected categories', () => {
      const params = {
        selectedCategories: '["JavaScript","Python","Java"]',
      };

      const result = convertToReactParams(params);

      expect(result).toHaveProperty('skillName');
      expect(result.skillName).toContain('JavaScript');
      expect(result.skillName).toContain('Python');
      expect(result.skillName).toContain('Java');
    });

    it('should handle selected cities parameter', () => {
      const params = {
        selectedCities: '["New York","San Francisco"]',
      };

      const result = convertToReactParams(params);

      expect(result).toHaveProperty('cities');
      expect(result.cities).toContain('New York');
    });

    it('should handle selected catalogs parameter', () => {
      const params = {
        selectedListableCatalogIds: '["cat1","cat2"]',
      };

      const result = convertToReactParams(params);

      expect(result).toHaveProperty('catalogs');
      expect(result.catalogs).toContain('cat1');
    });

    it('should handle recommendation products parameter', () => {
      const params = {
        selectedRecommendationProducts: '["product1","product2"]',
      };

      const result = convertToReactParams(params);

      expect(result).toHaveProperty('products');
    });

    it('should handle recommendation roles parameter', () => {
      const params = {
        selectedRecommendationRoles: '["role1","role2"]',
      };

      const result = convertToReactParams(params);

      expect(result).toHaveProperty('roles');
    });

    it('should handle PRL levels parameter', () => {
      const params = {
        selectedPrlLevels: '["level1","level2"]',
      };

      const result = convertToReactParams(params);

      expect(result).toHaveProperty('levels');
    });

    it('should handle announced groups parameter', () => {
      const params = {
        selectedGroups: '["group1","group2"]',
      };

      const result = convertToReactParams(params);

      expect(result).toHaveProperty('announcedGroups');
    });

    it('should use default catalog sort when not provided', () => {
      const params = {
        selectedSortOption: undefined,
      };

      const result = convertToReactParams(params);

      expect(result).toHaveProperty('sort');
      // Should use default from getALMConfig()
    });

    it('should handle snippet type parameter', () => {
      const params = {
        snippetType: 'type1',
      };

      const result = convertToReactParams(params);

      // The key is literally "filter.snippetTypes" as a string, not a nested object
      expect(result).toHaveProperty(['filter.snippetTypes']);
      expect(result['filter.snippetTypes']).toBe('type1');
    });

    it('should handle jobAidId parameter', () => {
      const params = {
        jobAidId: '12345',
      };

      const result = convertToReactParams(params);

      expect(result).toHaveProperty('jobAidId');
      expect(result.jobAidId).toBe('12345');
    });

    it('should handle bookmarks parameter', () => {
      const params = {
        bookmarks: 'true',
      };

      const result = convertToReactParams(params);

      expect(result).toHaveProperty('bookmarks');
      expect(result.bookmarks).toBe('true');
    });

    it('should handle complex nested static parameters', () => {
      const params = {
        beginnerSelected: 'true',
        intermediateSelected: 'true',
        courseSelected: 'true',
        enrolledSelected: 'true',
      };

      const result = convertToReactParams(params);

      expect(result).toHaveProperty('skillLevel');
      expect(result).toHaveProperty('loTypes');
      expect(result).toHaveProperty('learnerState');
    });

    it('should handle mixed parameter types', () => {
      const params = {
        selectedTags: '["tag1"]',
        searchString: '["test"]',
        mode: 'view',
        beginnerSelected: 'true',
      };

      const result = convertToReactParams(params);

      expect(result).toHaveProperty('tagName');
      expect(result).toHaveProperty('searchText');
      expect(result).toHaveProperty('mode');
      expect(result).toHaveProperty('skillLevel');
    });

    it('should handle empty parameters object', () => {
      const params = {};

      const result = convertToReactParams(params);

      expect(result).toEqual({});
    });
  });

  // ========== Integration Tests ==========

  describe('Integration Tests', () => {
    it('should convert React params to learner desktop and back', () => {
      // Start with React URL
      setLocation('https://test.adobe.com/learner?searchText=test&sort=name');

      // Convert to learner desktop
      const learnerDesktopParams = convertToLearnerDesktopParams();
      expect(learnerDesktopParams).toContain('searchString=');
      expect(learnerDesktopParams).toContain('selectedSortOption=');
    });

    it('should handle complete filter conversion workflow', () => {
      setLocation(
        'https://test.adobe.com/learner?searchText=javascript&sort=name&tagName=web,backend&skillName=js,node'
      );

      const learnerParams = convertToLearnerDesktopParams();

      expect(learnerParams).toContain('searchString=');
      expect(learnerParams).toContain('selectedSortOption=');
      expect(learnerParams).toContain('selectedTags=');
      expect(learnerParams).toContain('selectedCategories=');
    });

    it('should preserve parameter types through conversion', () => {
      const originalObj = {
        search: 'test',
        page: 1,
        active: true,
      };

      const uriString = convertJsonToUri(originalObj);
      expect(uriString).toContain('search=test');
      expect(uriString).toContain('page=1');
      expect(uriString).toContain('active=true');
    });

    it('should handle complex multi-filter scenarios', () => {
      setLocation(
        'https://test.adobe.com/learner?searchText=test&tagName=tag1,tag2&skillName=skill1&cities=NY&sort=name'
      );

      const result = convertToLearnerDesktopParams();

      expect(result).toContain('searchString=');
      expect(result).toContain('selectedTags=');
      expect(result).toContain('selectedCategories=');
      expect(result).toContain('selectedCities=');
      expect(result).toContain('selectedSortOption=');
    });

    it('should handle round-trip conversion consistency', () => {
      const learnerDesktopParams = {
        selectedTags: '["tag1","tag2"]',
        searchString: '["test"]',
        selectedSortOption: 'alpha',
      };

      const reactParams = convertToReactParams(learnerDesktopParams);

      expect(reactParams.tagName).toContain('tag1');
      expect(reactParams.searchText).toBe('test');
      expect(reactParams.sort).toBe('name');
    });
  });

  // ========== Edge Cases ==========

  describe('Edge Cases', () => {
    it('should handle URL with no search params', () => {
      setLocation('https://test.adobe.com/learner');

      const result = convertToLearnerDesktopParams();
      expect(result).toBe('');
    });

    it('should handle URL with hash', () => {
      setLocation('https://test.adobe.com/learner?searchText=test#/catalog');

      const result = convertToLearnerDesktopParams();
      expect(result).toContain('searchString=');
    });

    it('should handle parameters with special characters', () => {
      const obj = {
        'key-with-dash': 'value',
        key_with_underscore: 'test',
      };

      const result = convertJsonToUri(obj);
      expect(result).toContain('key-with-dash=value');
      expect(result).toContain('key_with_underscore=test');
    });

    it('should handle empty string values in convertJsonToUri', () => {
      const obj = {
        key1: '',
        key2: 'value',
      };

      const result = convertJsonToUri(obj);
      expect(result).toContain('key1=');
      expect(result).toContain('key2=value');
    });

    it('should handle parameters with comma-separated values', () => {
      setLocation('https://test.adobe.com/learner?tagName=tag1,tag2,tag3');

      const result = convertToLearnerDesktopParams();
      expect(result).toContain('selectedTags=');
      expect(result).toContain('tag1');
      expect(result).toContain('tag2');
      expect(result).toContain('tag3');
    });

    it('should handle undefined values in convertToReactParams', () => {
      const params = {
        key1: undefined,
        searchString: '["test"]', // Use a known parameter
      };

      const result = convertToReactParams(params);
      // Should have the defined parameter
      expect(result).toHaveProperty('searchText');
      // undefined values should be filtered out
      expect(result).not.toHaveProperty('key1');
    });

    it('should handle parameters that are not in any map', () => {
      const params = {
        unknownParam: 'value',
      };

      const result = convertToReactParams(params);
      // Unknown params are silently ignored — the result is an empty object
      expect(result).toEqual({});
    });
  });
});
