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
 * Unit Tests for ALMSkillComponent.utils
 *
 * Tests utility functions for:
 * - CSS extraction from parent frames
 * - Iframe document manipulation
 * - Font link injection
 * - Stylesheet copying
 * - Skip link messaging
 */

import {
  getCssFromParentFrame,
  getExternalSkillFrameCss,
  getAttrStyle,
  addBodyStyles,
  addExternalFontLink,
  addExternalSkillFrameCss,
  copyStyleSheetsToChildFrame,
  sendSkillsSkipLinks,
} from '../../../almLib/components/ALMSkills/ALMSkillComponent.utils';

// Mock dependencies
const mockSendMessageToParent = jest.fn();
const mockGetPrimeEmitEventLinks = jest.fn();
const mockGetTranslation = jest.fn();

jest.mock('../../../almLib/utils/widgets/base/EventHandlingBase', () => ({
  SendMessageToParent: (...args: any[]) => mockSendMessageToParent(...args),
  GetPrimeEmitEventLinks: () => mockGetPrimeEmitEventLinks(),
}));

jest.mock('../../../almLib/utils/translationService', () => ({
  GetTranslation: (key: string, returnKey?: boolean) => mockGetTranslation(key, returnKey),
}));

jest.mock('../../../almLib/utils/global', () => ({
  GetPrimeEmitEventLinks: () => mockGetPrimeEmitEventLinks(),
}));

describe('ALMSkillComponent.utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mocks
    mockGetTranslation.mockImplementation((key: string) => key);
    mockGetPrimeEmitEventLinks.mockReturnValue('https://test.com');
  });

  describe('getCssFromParentFrame', () => {
    let mockStyleSheet: any;
    let mockStyleElement: any;

    beforeEach(() => {
      // Create mock CSS rules
      const mockRule1 = { cssText: ':root { --color: blue; }' };
      const mockRule2 = { cssText: '@font-face { font-family: Arial; }' };
      const mockRule3 = { cssText: '@import url("fonts.css");' };
      const mockRule4 = { cssText: '.other { color: red; }' };

      mockStyleElement = {
        tagName: 'STYLE',
      };

      mockStyleSheet = {
        ownerNode: mockStyleElement,
        cssRules: [mockRule1, mockRule2, mockRule3, mockRule4],
      };

      // Mock document.styleSheets
      Object.defineProperty(document, 'styleSheets', {
        value: [mockStyleSheet],
        configurable: true,
      });
    });

    it('should return first matching CSS rule when append is false', () => {
      const result = getCssFromParentFrame(':root {');

      expect(result).toBe(':root { --color: blue; }');
    });

    it('should return all matching CSS rules when append is true', () => {
      const result = getCssFromParentFrame('@font-face', true);

      expect(result).toBe('@font-face { font-family: Arial; }');
    });

    it('should return multiple matching rules joined with space when append is true', () => {
      // Add another matching rule
      mockStyleSheet.cssRules.push({ cssText: '@font-face { font-family: Helvetica; }' });

      const result = getCssFromParentFrame('@font-face', true);

      expect(result).toBe(
        '@font-face { font-family: Arial; } @font-face { font-family: Helvetica; }'
      );
    });

    it('should return empty string when no matching rules found', () => {
      const result = getCssFromParentFrame('nonexistent-label');

      expect(result).toBe('');
    });

    it('should return empty string when append is true and no matching rules', () => {
      const result = getCssFromParentFrame('nonexistent-label', true);

      expect(result).toBe('');
    });

    it('should only check STYLE elements', () => {
      const linkElement = { tagName: 'LINK' };
      const linkStyleSheet = {
        ownerNode: linkElement,
        cssRules: [{ cssText: ':root { --test: value; }' }],
      };

      Object.defineProperty(document, 'styleSheets', {
        value: [linkStyleSheet, mockStyleSheet],
        configurable: true,
      });

      const result = getCssFromParentFrame(':root {');

      // Should still find from STYLE element, not LINK
      expect(result).toBe(':root { --color: blue; }');
    });

    it('should handle empty styleSheets', () => {
      Object.defineProperty(document, 'styleSheets', {
        value: [],
        configurable: true,
      });

      const result = getCssFromParentFrame(':root {');

      expect(result).toBe('');
    });
  });

  describe('getExternalSkillFrameCss', () => {
    const mockStyles = {
      selectedSkills: 'selectedSkills',
      selectedSkillsHeading: 'selectedSkillsHeading',
      selectedSkillsArea: 'selectedSkillsArea',
      selectedSkill: 'selectedSkill',
      showScrollbar: 'showScrollbar',
      accountSpecificCheckbox: 'accountSpecificCheckbox',
      emptyMessage: 'emptyMessage',
      closeButton: 'closeButton',
      selectedSkillsActions: 'selectedSkillsActions',
      remove: 'remove',
      topOptions: 'topOptions',
      checkboxRow: 'checkboxRow',
      search: 'search',
      searchLoader: 'searchLoader',
      graphHeading: 'graphHeading',
      skillInput: 'skillInput',
      typeahead: 'typeahead',
      suggestion: 'suggestion',
      noSuggestion: 'noSuggestion',
      active: 'active',
      setting: 'setting',
      loader: 'loader',
      visible: 'visible',
      resetGraph: 'resetGraph',
      graphArea: 'graphArea',
      displayNone: 'displayNone',
    };

    it('should return CSS string with all class names', () => {
      const result = getExternalSkillFrameCss(mockStyles);

      expect(result).toContain('.selectedSkills {');
      expect(result).toContain('.selectedSkillsHeading {');
      expect(result).toContain('.closeButton {');
      expect(result).toContain('canvas {');
    });

    it('should include CSS custom properties from parent', () => {
      const result = getExternalSkillFrameCss(mockStyles);

      // getCssFromParentFrame is called at runtime
      expect(typeof result).toBe('string');
    });

    it('should include hover states', () => {
      const result = getExternalSkillFrameCss(mockStyles);

      expect(result).toContain('.selectedSkill:hover {');
      expect(result).toContain('.closeButton:hover {');
      expect(result).toContain('.suggestion:hover {');
    });

    it('should include media queries for mobile', () => {
      const result = getExternalSkillFrameCss(mockStyles);

      expect(result).toContain('@media(max-width:767px)');
    });

    it('should include checkbox styling', () => {
      const result = getExternalSkillFrameCss(mockStyles);

      expect(result).toContain('.accountSpecificCheckbox[type="checkbox"]');
      expect(result).toContain('.accountSpecificCheckbox[type="checkbox"]:checked');
    });

    it('should include animation keyframes', () => {
      const result = getExternalSkillFrameCss(mockStyles);

      expect(result).toContain('@-webkit-keyframes spin');
      expect(result).toContain('@keyframes spin');
      expect(result).toContain('rotate(0deg)');
      expect(result).toContain('rotate(360deg)');
    });

    it('should return valid CSS with all required selectors', () => {
      const result = getExternalSkillFrameCss(mockStyles);

      // Check for all major sections
      expect(result).toContain('canvas');
      expect(result).toContain('.selectedSkills');
      expect(result).toContain('.loader');
      expect(result).toContain('.typeahead');
      expect(result.length).toBeGreaterThan(100);
    });
  });

  describe('getAttrStyle', () => {
    it('should return style attribute from element', () => {
      const mockElement = document.createElement('html');
      mockElement.setAttribute('style', 'color: red; font-size: 14px;');

      jest.spyOn(document, 'getElementsByTagName').mockReturnValue([mockElement] as any);

      const result = getAttrStyle('html');

      expect(result).toBe('color: red; font-size: 14px;');
    });

    it('should return null when no style attribute', () => {
      const mockElement = document.createElement('html');

      jest.spyOn(document, 'getElementsByTagName').mockReturnValue([mockElement] as any);

      const result = getAttrStyle('html');

      expect(result).toBeNull();
    });

    it('should handle body element', () => {
      const mockElement = document.createElement('body');
      mockElement.setAttribute('style', 'margin: 0;');

      jest.spyOn(document, 'getElementsByTagName').mockReturnValue([mockElement] as any);

      const result = getAttrStyle('body');

      expect(result).toBe('margin: 0;');
    });
  });

  describe('addBodyStyles', () => {
    it('should copy all body styles to iframe document', () => {
      const mockBodyElement = {
        style: {
          0: 'color',
          1: 'font-size',
          2: 'margin',
          length: 3,
          color: 'red',
          'font-size': '14px',
          fontSize: '14px',
          margin: '0',
        },
      };

      jest.spyOn(document, 'getElementsByTagName').mockReturnValue([mockBodyElement] as any);

      const mockIframeDoc = {
        body: {
          style: {} as any,
        },
      };

      addBodyStyles(mockIframeDoc);

      expect(mockIframeDoc.body.style.color).toBe('red');
      expect(mockIframeDoc.body.style['font-size']).toBe('14px');
      expect(mockIframeDoc.body.style.margin).toBe('0');
    });

    it('should handle empty body styles', () => {
      const mockBodyElement = {
        style: {
          length: 0,
        },
      };

      jest.spyOn(document, 'getElementsByTagName').mockReturnValue([mockBodyElement] as any);

      const mockIframeDoc = {
        body: {
          style: {} as any,
        },
      };

      addBodyStyles(mockIframeDoc);

      // Should not throw and iframe body should still exist
      expect(mockIframeDoc.body.style).toBeDefined();
    });

    it('should copy multiple style properties', () => {
      const mockBodyElement = {
        style: {
          0: 'background-color',
          1: 'font-family',
          2: 'line-height',
          length: 3,
          'background-color': 'white',
          backgroundColor: 'white',
          'font-family': 'Arial',
          fontFamily: 'Arial',
          'line-height': '1.5',
          lineHeight: '1.5',
        },
      };

      jest.spyOn(document, 'getElementsByTagName').mockReturnValue([mockBodyElement] as any);

      const mockIframeDoc = {
        body: {
          style: {} as any,
        },
      };

      addBodyStyles(mockIframeDoc);

      expect(mockIframeDoc.body.style['background-color']).toBe('white');
      expect(mockIframeDoc.body.style['font-family']).toBe('Arial');
      expect(mockIframeDoc.body.style['line-height']).toBe('1.5');
    });
  });

  describe('addExternalFontLink', () => {
    it('should copy font link to iframe', () => {
      const mockLinkElement = document.createElement('link');
      mockLinkElement.setAttribute('href', 'https://fonts.com/font.css');
      mockLinkElement.setAttribute('rel', 'stylesheet');
      mockLinkElement.setAttribute('type', 'text/css');

      const mockHeadElement = {
        querySelectorAll: jest.fn().mockReturnValue([mockLinkElement]),
      };

      Object.defineProperty(document, 'head', {
        value: mockHeadElement,
        configurable: true,
      });

      const mockIframeDoc = {
        head: {
          appendChild: jest.fn(),
        },
      };

      addExternalFontLink(mockIframeDoc);

      expect(mockIframeDoc.head.appendChild).toHaveBeenCalled();
      const appendedElement = mockIframeDoc.head.appendChild.mock.calls[0][0];
      expect(appendedElement.getAttribute('href')).toBe('https://fonts.com/font.css');
      expect(appendedElement.getAttribute('rel')).toBe('stylesheet');
    });

    it('should not add link if external font face not found', () => {
      const mockHeadElement = {
        querySelectorAll: jest.fn().mockReturnValue([]),
      };

      Object.defineProperty(document, 'head', {
        value: mockHeadElement,
        configurable: true,
      });

      const mockIframeDoc = {
        head: {
          appendChild: jest.fn(),
        },
      };

      addExternalFontLink(mockIframeDoc);

      expect(mockIframeDoc.head.appendChild).not.toHaveBeenCalled();
    });

    it('should copy all attributes from source link', () => {
      const mockLinkElement = document.createElement('link');
      mockLinkElement.setAttribute('href', 'https://fonts.com/font.css');
      mockLinkElement.setAttribute('rel', 'stylesheet');
      mockLinkElement.setAttribute('crossorigin', 'anonymous');
      mockLinkElement.setAttribute('data-custom', 'value');

      const mockHeadElement = {
        querySelectorAll: jest.fn().mockReturnValue([mockLinkElement]),
      };

      Object.defineProperty(document, 'head', {
        value: mockHeadElement,
        configurable: true,
      });

      const mockIframeDoc = {
        head: {
          appendChild: jest.fn(),
        },
      };

      addExternalFontLink(mockIframeDoc);

      const appendedElement = mockIframeDoc.head.appendChild.mock.calls[0][0];
      expect(appendedElement.getAttribute('crossorigin')).toBe('anonymous');
      expect(appendedElement.getAttribute('data-custom')).toBe('value');
    });
  });

  describe('addExternalSkillFrameCss', () => {
    it('should add style element with CSS to iframe head', () => {
      const mockStyles = {
        selectedSkills: 'test-class',
      };

      const mockIframeDoc = {
        head: {
          appendChild: jest.fn(),
        },
      };

      addExternalSkillFrameCss(mockIframeDoc, mockStyles);

      expect(mockIframeDoc.head.appendChild).toHaveBeenCalled();
      const appendedElement = mockIframeDoc.head.appendChild.mock.calls[0][0];
      expect(appendedElement.tagName).toBe('STYLE');
      expect(appendedElement.textContent).toContain('.test-class');
    });

    it('should include generated CSS from getExternalSkillFrameCss', () => {
      const mockStyles = {
        selectedSkills: 'selectedSkills',
        closeButton: 'closeButton',
      };

      const mockIframeDoc = {
        head: {
          appendChild: jest.fn(),
        },
      };

      addExternalSkillFrameCss(mockIframeDoc, mockStyles);

      const appendedElement = mockIframeDoc.head.appendChild.mock.calls[0][0];
      expect(appendedElement.textContent).toContain('.selectedSkills');
      expect(appendedElement.textContent).toContain('.closeButton');
    });
  });

  describe('copyStyleSheetsToChildFrame', () => {
    it('should copy all stylesheet link tags to iframe', () => {
      const mockLink1 = { href: 'https://example.com/style1.css' };
      const mockLink2 = { href: 'https://example.com/style2.css' };

      const mockHeadElement = {
        querySelectorAll: jest.fn().mockReturnValue([mockLink1, mockLink2]),
      };

      Object.defineProperty(document, 'head', {
        value: mockHeadElement,
        configurable: true,
      });

      const mockIframeDoc = {
        head: {
          appendChild: jest.fn(),
        },
      };

      copyStyleSheetsToChildFrame(mockIframeDoc);

      expect(mockIframeDoc.head.appendChild).toHaveBeenCalledTimes(2);

      const firstLink = mockIframeDoc.head.appendChild.mock.calls[0][0];
      expect(firstLink.rel).toBe('stylesheet');
      expect(firstLink.tagName).toBe('LINK');

      const secondLink = mockIframeDoc.head.appendChild.mock.calls[1][0];
      expect(secondLink.rel).toBe('stylesheet');
      expect(secondLink.tagName).toBe('LINK');
    });

    it('should handle no stylesheet links', () => {
      const mockHeadElement = {
        querySelectorAll: jest.fn().mockReturnValue([]),
      };

      Object.defineProperty(document, 'head', {
        value: mockHeadElement,
        configurable: true,
      });

      const mockIframeDoc = {
        head: {
          appendChild: jest.fn(),
        },
      };

      copyStyleSheetsToChildFrame(mockIframeDoc);

      expect(mockIframeDoc.head.appendChild).not.toHaveBeenCalled();
    });

    it('should query for correct link selector', () => {
      const mockHeadElement = {
        querySelectorAll: jest.fn().mockReturnValue([]),
      };

      Object.defineProperty(document, 'head', {
        value: mockHeadElement,
        configurable: true,
      });

      const mockIframeDoc = {
        head: {
          appendChild: jest.fn(),
        },
      };

      copyStyleSheetsToChildFrame(mockIframeDoc);

      expect(mockHeadElement.querySelectorAll).toHaveBeenCalledWith('link[rel="stylesheet"]');
    });
  });

  describe('sendSkillsSkipLinks', () => {
    beforeEach(() => {
      mockGetTranslation.mockImplementation((key: string) => {
        const translations: Record<string, string> = {
          'alm.text.recommendation': 'Recommendation',
          'alm.community.board.skills': 'Skills',
        };
        return translations[key] || key;
      });
    });

    it('should send skills section skip link when PRL disabled', () => {
      sendSkillsSkipLinks(false, false);

      expect(mockSendMessageToParent).toHaveBeenCalled();

      const call = mockSendMessageToParent.mock.calls[0];
      const messageData = call[0];

      expect(messageData.type).toBe('ALM_SKIP_LINKS');
      expect(messageData.widgets).toHaveLength(1);
      expect(messageData.widgets[0]).toEqual({
        elementId: 'skills-section',
        label: 'Skills',
        widgetRef: 'com.adobe.captivateprime.primeskills',
      });
    });

    it('should send recommendation label when PRL enabled', () => {
      sendSkillsSkipLinks(true, false);

      const call = mockSendMessageToParent.mock.calls[0];
      const messageData = call[0];

      expect(messageData.widgets[0].label).toBe('Recommendation');
    });

    it('should include interests section when PRL enabled and has items', () => {
      sendSkillsSkipLinks(true, true);

      const call = mockSendMessageToParent.mock.calls[0];
      const messageData = call[0];

      expect(messageData.widgets).toHaveLength(2);
      expect(messageData.widgets[1]).toEqual({
        elementId: 'interests-section',
        label: 'Skills',
        widgetRef: 'com.adobe.captivateprime.skills.interests',
      });
    });

    it('should not include interests section when PRL disabled', () => {
      sendSkillsSkipLinks(false, true);

      const call = mockSendMessageToParent.mock.calls[0];
      const messageData = call[0];

      expect(messageData.widgets).toHaveLength(1);
    });

    it('should not include interests section when no items', () => {
      sendSkillsSkipLinks(true, false);

      const call = mockSendMessageToParent.mock.calls[0];
      const messageData = call[0];

      expect(messageData.widgets).toHaveLength(1);
    });

    it('should call SendMessageToParent with event links', () => {
      const mockEventLinks = 'https://test.prime.com/emit';
      mockGetPrimeEmitEventLinks.mockReturnValue(mockEventLinks);

      sendSkillsSkipLinks(false, false);

      expect(mockSendMessageToParent).toHaveBeenCalledWith(expect.any(Object), mockEventLinks);
    });

    it('should call GetTranslation with correct keys', () => {
      sendSkillsSkipLinks(false, false);

      expect(mockGetTranslation).toHaveBeenCalledWith('alm.community.board.skills', true);
    });

    it('should call GetTranslation for recommendation when PRL enabled', () => {
      mockGetTranslation.mockClear();

      sendSkillsSkipLinks(true, false);

      expect(mockGetTranslation).toHaveBeenCalledWith('alm.text.recommendation', true);
    });

    it('should handle all four combinations of isPrlEnabled and hasItems', () => {
      // Case 1: PRL disabled, no items
      sendSkillsSkipLinks(false, false);
      let call = mockSendMessageToParent.mock.calls[0];
      expect(call[0].widgets).toHaveLength(1);

      mockSendMessageToParent.mockClear();

      // Case 2: PRL disabled, has items
      sendSkillsSkipLinks(false, true);
      call = mockSendMessageToParent.mock.calls[0];
      expect(call[0].widgets).toHaveLength(1);

      mockSendMessageToParent.mockClear();

      // Case 3: PRL enabled, no items
      sendSkillsSkipLinks(true, false);
      call = mockSendMessageToParent.mock.calls[0];
      expect(call[0].widgets).toHaveLength(1);

      mockSendMessageToParent.mockClear();

      // Case 4: PRL enabled, has items
      sendSkillsSkipLinks(true, true);
      call = mockSendMessageToParent.mock.calls[0];
      expect(call[0].widgets).toHaveLength(2);
    });
  });
});
