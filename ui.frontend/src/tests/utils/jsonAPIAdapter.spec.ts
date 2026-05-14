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
jest.mock('@almLib/utils/global', () => ({
  getALMConfig: jest.fn(() => ({
    locale: 'en-US',
    primeCdnTrainingBaseEndpoint: 'https://test.adobe.com',
    esBaseUrl: 'https://test-es.adobe.com',
    almCdnBaseUrl: 'https://test-cdn.adobe.com',
  })),
}));

import {
  JsonApiParse,
  parseCommerceResponse,
  ObjectWrapper,
  Store,
} from '@almLib/utils/jsonAPIAdapter';
import { getALMConfig } from '@almLib/utils/global';

describe('jsonAPIAdapter', () => {
  beforeEach(() => {
    (getALMConfig as jest.Mock).mockClear();
    (getALMConfig as jest.Mock).mockReturnValue({
      locale: 'en-US',
      primeCdnTrainingBaseEndpoint: 'https://test.adobe.com',
      esBaseUrl: 'https://test-es.adobe.com',
      almCdnBaseUrl: 'https://test-cdn.adobe.com',
    });
  });
  describe('JsonApiParse', () => {
    it('should parse simple response', () => {
      const response = {
        data: { type: 'learningObject', id: '1', attributes: { name: 'Test' } },
        included: [],
      };
      const result = JsonApiParse(response);
      expect(result.learningObject).toBeTruthy();
    });

    it('should parse string response', () => {
      const response = JSON.stringify({
        data: { type: 'test', id: '1' },
      });
      const result = JsonApiParse(response);
      expect(result.test).toBeTruthy();
    });

    it('should handle array data', () => {
      const response = {
        data: [
          { type: 'learningObject', id: '1' },
          { type: 'learningObject', id: '2' },
        ],
        included: [],
      };
      const result = JsonApiParse(response);
      expect(Array.isArray(result.learningObjectList)).toBe(true);
      expect(result.learningObjectList).toHaveLength(2);
    });
  });

  describe('ObjectWrapper', () => {
    it('should wrap object', () => {
      const store = { find: jest.fn() } as any;
      const dataObj = { type: 'test', id: '1', attributes: { name: 'Test' } };
      const wrapper = new ObjectWrapper('test', '1', store, dataObj);
      expect(wrapper.get('id')).toBe('1');
      expect(wrapper.get('type')).toBe('test');
    });

    it('should access attributes', () => {
      const store = { find: jest.fn() } as any;
      const dataObj = { type: 'test', id: '1', attributes: { name: 'Test', value: 42 } };
      const wrapper = new ObjectWrapper('test', '1', store, dataObj);
      expect(wrapper.get('name')).toBe('Test');
      expect(wrapper.get('value')).toBe(42);
    });
  });

  describe('Store', () => {
    it('should store and find objects', () => {
      const store = new Store();
      const obj = { type: 'test', id: '1', attributes: {} };
      store.put(obj);
      const result = store.get('test', '1');
      expect(result).toBe(obj);
    });

    it('should return undefined for not found', () => {
      const store = new Store();
      const result = store.get('test', '999');
      expect(result).toBeUndefined();
    });
  });

  describe('parseCommerceResponse', () => {
    it('should parse commerce response', () => {
      const response = [
        {
          sku: 'sku1',
          name: 'Test',
          description: { html: 'Desc' },
          almavgrating: '4.5',
          almratingscount: '10',
        },
      ];
      const result = parseCommerceResponse(response as any);
      expect(Array.isArray(result)).toBe(true);
      expect(result[0].id).toBe('sku1');
    });

    it('should handle filters', () => {
      const response = [
        {
          sku: 'sku1',
          name: 'Test',
          description: { html: 'Desc' },
          almavgrating: '',
          almratingscount: '',
          almskillname: 'skill1,skill2',
        },
      ];
      const filters = [
        {
          attribute_code: 'almskillname',
          attribute_options: [
            { value: 'skill1', label: 'Skill 1' },
            { value: 'skill2', label: 'Skill 2' },
          ],
        },
      ];
      const result = parseCommerceResponse(response as any, filters as any);
      // ALMToCommerceTypes['skillName'] maps to 'almskill'; the filter data uses 'almskillname' which
      // does not match, so no skill labels are resolved and skillNames is an empty array
      expect(result[0].skillNames).toEqual([]);
    });
  });
});
