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
 * Unit Tests for useFooter Hook
 *
 * Hook handles:
 * - Props-based footer configuration (HTML + CSS)
 * - Account-based footer configuration (from templatesConfig)
 * - CSS injection into DOM (preventing duplicates)
 * - HTML fetching from URLs
 * - HTML sanitization with DOMPurify
 * - Link target="_blank" enforcement
 * - Error handling for API failures
 */

import { act } from '@testing-library/react';
import React from 'react';
import ReactDOM from 'react-dom';
import { useFooter } from '../../../almLib/hooks/footer/useFooter';
// @ts-ignore
import DOMPurify from 'dompurify';

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

// Mocks
const mockUseAccount = jest.fn();
const mockRestAdapterGet = jest.fn();

jest.mock('../../../almLib/hooks/account', () => ({
  useAccount: () => mockUseAccount(),
}));

jest.mock('../../../almLib/utils/restAdapter', () => ({
  RestAdapter: {
    get: (params: any) => mockRestAdapterGet(params),
  },
}));

jest.mock('dompurify', () => ({
  __esModule: true,
  default: {
    sanitize: jest.fn(),
    addHook: jest.fn(),
  },
}));

describe('useFooter', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementations
    mockUseAccount.mockReturnValue({
      account: {},
    });

    (DOMPurify.sanitize as jest.Mock).mockImplementation((html: string) => html);
    (DOMPurify.addHook as jest.Mock).mockImplementation(() => {});

    mockRestAdapterGet.mockResolvedValue('');

    // Clear DOM
    document.head.innerHTML = '';
  });

  afterEach(() => {
    // Clean up injected styles
    const existingStyle = document.querySelector('style[data-footer-custom-css]');
    if (existingStyle) {
      existingStyle.remove();
    }
  });

  describe('Hook Initialization', () => {
    it('should initialize isFooterStylingEnabled to false', async () => {
      let result: any;
      await act(async () => {
        result = renderHook(() => useFooter()).result;
      });
      expect(result.current.isFooterStylingEnabled).toBe(false);
    });

    it('should initialize html to empty string', async () => {
      let result: any;
      await act(async () => {
        result = renderHook(() => useFooter()).result;
      });
      expect(result.current.html).toBe('');
    });

    it('should initialize cssUrl to empty string', async () => {
      let result: any;
      await act(async () => {
        result = renderHook(() => useFooter()).result;
      });
      expect(result.current.cssUrl).toBe('');
    });
  });

  describe('Props-based Footer Configuration', () => {
    it('should use props htmlCode when provided', async () => {
      const footerConfig = {
        htmlCode: '<footer>Custom Footer</footer>',
        cssCode: '.footer { color: red; }',
      };

      let result: any;
      await act(async () => {
        result = renderHook(() => useFooter(footerConfig)).result;
      });

      expect(result.current.isFooterStylingEnabled).toBe(true);
      expect(DOMPurify.sanitize).toHaveBeenCalledWith('<footer>Custom Footer</footer>');
    });

    it('should inject CSS from props cssCode', async () => {
      const footerConfig = {
        htmlCode: '<footer>Test</footer>',
        cssCode: '.custom-footer { background: blue; }',
      };

      await act(async () => {
        renderHook(() => useFooter(footerConfig));
      });

      const injectedStyle = document.querySelector('style[data-footer-custom-css]');
      expect(injectedStyle).toBeTruthy();
      expect(injectedStyle?.textContent).toBe('.custom-footer { background: blue; }');
    });

    it('should set cssUrl from props cssCode', async () => {
      const footerConfig = {
        htmlCode: '<footer>Test</footer>',
        cssCode: '.footer { margin: 0; }',
      };

      let result: any;
      await act(async () => {
        result = renderHook(() => useFooter(footerConfig)).result;
      });

      expect(result.current.cssUrl).toBe('.footer { margin: 0; }');
    });

    it('should handle empty htmlCode in props', async () => {
      const footerConfig = {
        htmlCode: '',
        cssCode: '.footer {}',
      };

      let result: any;
      await act(async () => {
        result = renderHook(() => useFooter(footerConfig)).result;
      });

      expect(result.current.html).toBe('');
      expect(result.current.isFooterStylingEnabled).toBe(true);
    });

    it('should handle undefined htmlCode in props', async () => {
      const footerConfig = {
        cssCode: '.footer {}',
      };

      let result: any;
      await act(async () => {
        result = renderHook(() => useFooter(footerConfig)).result;
      });

      expect(result.current.html).toBe('');
    });

    it('should handle undefined cssCode in props', async () => {
      const footerConfig = {
        htmlCode: '<footer>Test</footer>',
      };

      let result: any;
      await act(async () => {
        result = renderHook(() => useFooter(footerConfig)).result;
      });

      expect(result.current.cssUrl).toBe('');
    });

    it('should not inject CSS twice for props-based config', async () => {
      const footerConfig = {
        htmlCode: '<footer>Test</footer>',
        cssCode: '.footer { color: green; }',
      };

      const { rerender } = renderHook(() => useFooter(footerConfig));

      await act(async () => {
      });

      const firstInjectedStyle = document.querySelector('style[data-footer-custom-css]');
      expect(firstInjectedStyle).toBeTruthy();

      await act(async () => {
        rerender();
      });

      const allStyles = document.querySelectorAll('style[data-footer-custom-css]');
      expect(allStyles.length).toBe(1);
    });
  });

  describe('Account-based Footer Configuration', () => {
    it('should use account templatesConfig when no props provided', async () => {
      const templatesConfig = {
        footerStyling: true,
        footerContent: {
          cssContentUrl: 'https://example.com/footer.css',
          htmlContentUrl: 'https://example.com/footer.html',
        },
      };

      mockUseAccount.mockReturnValue({
        account: {
          templatesConfig: JSON.stringify(templatesConfig),
        },
      });

      mockRestAdapterGet.mockImplementation((params: any) => {
        if (params.url.includes('footer.css')) {
          return Promise.resolve('.footer { padding: 10px; }');
        }
        if (params.url.includes('footer.html')) {
          return Promise.resolve('<footer>Account Footer</footer>');
        }
        return Promise.resolve('');
      });

      let result: any;
      await act(async () => {
        result = renderHook(() => useFooter()).result;
      });

      expect(result.current.isFooterStylingEnabled).toBe(true);
      expect(DOMPurify.sanitize).toHaveBeenCalledWith('<footer>Account Footer</footer>');
    });

    it('should fetch CSS from cssContentUrl', async () => {
      const templatesConfig = {
        footerStyling: true,
        footerContent: {
          cssContentUrl: 'https://example.com/styles.css',
          htmlContentUrl: 'https://example.com/content.html',
        },
      };

      mockUseAccount.mockReturnValue({
        account: {
          templatesConfig: JSON.stringify(templatesConfig),
        },
      });

      mockRestAdapterGet.mockImplementation((params: any) => {
        if (params.url.includes('styles.css')) {
          return Promise.resolve('.custom { font-size: 14px; }');
        }
        return Promise.resolve('<div>Content</div>');
      });

      await act(async () => {
        renderHook(() => useFooter());
      });

      expect(mockRestAdapterGet).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining('styles.css'),
        })
      );

      const injectedStyle = document.querySelector('style[data-footer-custom-css]');
      expect(injectedStyle?.textContent).toBe('.custom { font-size: 14px; }');
    });

    it('should fetch HTML from htmlContentUrl', async () => {
      const templatesConfig = {
        footerStyling: true,
        footerContent: {
          cssContentUrl: 'https://example.com/footer.css',
          htmlContentUrl: 'https://example.com/footer.html',
        },
      };

      mockUseAccount.mockReturnValue({
        account: {
          templatesConfig: JSON.stringify(templatesConfig),
        },
      });

      mockRestAdapterGet.mockImplementation((params: any) => {
        if (params.url.includes('footer.html')) {
          return Promise.resolve('<footer>Fetched HTML</footer>');
        }
        return Promise.resolve('.footer {}');
      });

      let result: any;
      await act(async () => {
        result = renderHook(() => useFooter()).result;
      });

      expect(mockRestAdapterGet).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining('footer.html'),
        })
      );
      expect(DOMPurify.sanitize).toHaveBeenCalledWith('<footer>Fetched HTML</footer>');
    });

    it('should add returnOrigin=true query param to CSS URL', async () => {
      const templatesConfig = {
        footerStyling: true,
        footerContent: {
          cssContentUrl: 'https://example.com/footer.css',
        },
      };

      mockUseAccount.mockReturnValue({
        account: {
          templatesConfig: JSON.stringify(templatesConfig),
        },
      });

      mockRestAdapterGet.mockResolvedValue('.footer {}');

      await act(async () => {
        renderHook(() => useFooter());
      });

      expect(mockRestAdapterGet).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining('returnOrigin=true'),
        })
      );
    });

    it('should add returnOrigin=true query param to HTML URL', async () => {
      const templatesConfig = {
        footerStyling: true,
        footerContent: {
          htmlContentUrl: 'https://example.com/footer.html',
        },
      };

      mockUseAccount.mockReturnValue({
        account: {
          templatesConfig: JSON.stringify(templatesConfig),
        },
      });

      mockRestAdapterGet.mockResolvedValue('<div>Test</div>');

      await act(async () => {
        renderHook(() => useFooter());
      });

      expect(mockRestAdapterGet).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining('returnOrigin=true'),
        })
      );
    });

    it('should handle footerStyling false in account config', async () => {
      const templatesConfig = {
        footerStyling: false,
        footerContent: {
          cssContentUrl: 'https://example.com/footer.css',
          htmlContentUrl: 'https://example.com/footer.html',
        },
      };

      mockUseAccount.mockReturnValue({
        account: {
          templatesConfig: JSON.stringify(templatesConfig),
        },
      });

      let result: any;
      await act(async () => {
        result = renderHook(() => useFooter()).result;
      });

      expect(result.current.isFooterStylingEnabled).toBe(false);
      expect(mockRestAdapterGet).not.toHaveBeenCalled();
    });

    it('should handle missing footerContent in account config', async () => {
      const templatesConfig = {
        footerStyling: true,
      };

      mockUseAccount.mockReturnValue({
        account: {
          templatesConfig: JSON.stringify(templatesConfig),
        },
      });

      let result: any;
      await act(async () => {
        result = renderHook(() => useFooter()).result;
      });

      expect(result.current.isFooterStylingEnabled).toBe(true);
      expect(result.current.html).toBe('');
      expect(result.current.cssUrl).toBe('');
    });

    it('should handle empty account templatesConfig', async () => {
      mockUseAccount.mockReturnValue({
        account: {},
      });

      let result: any;
      await act(async () => {
        result = renderHook(() => useFooter()).result;
      });

      expect(result.current.isFooterStylingEnabled).toBe(false);
      expect(mockRestAdapterGet).not.toHaveBeenCalled();
    });
  });

  describe('CSS Injection', () => {
    it('should inject CSS into document head', async () => {
      const footerConfig = {
        cssCode: '.test-css { display: block; }',
      };

      await act(async () => {
        renderHook(() => useFooter(footerConfig));
      });

      const injectedStyle = document.querySelector('style[data-footer-custom-css]');
      expect(injectedStyle).toBeTruthy();
      expect(injectedStyle?.getAttribute('data-footer-custom-css')).toBe('true');
    });

    it('should remove existing CSS before injecting new CSS', async () => {
      // First injection
      const existingStyle = document.createElement('style');
      existingStyle.setAttribute('data-footer-custom-css', 'true');
      existingStyle.textContent = '.old-css {}';
      document.head.appendChild(existingStyle);

      const footerConfig = {
        cssCode: '.new-css {}',
      };

      await act(async () => {
        renderHook(() => useFooter(footerConfig));
      });

      const allStyles = document.querySelectorAll('style[data-footer-custom-css]');
      expect(allStyles.length).toBe(1);
      expect(allStyles[0].textContent).toBe('.new-css {}');
    });

    it('should not inject CSS twice from account config', async () => {
      const templatesConfig = {
        footerStyling: true,
        footerContent: {
          cssContentUrl: 'https://example.com/footer.css',
        },
      };

      mockUseAccount.mockReturnValue({
        account: {
          templatesConfig: JSON.stringify(templatesConfig),
        },
      });

      mockRestAdapterGet.mockResolvedValue('.footer { margin: 0; }');

      const { rerender } = renderHook(() => useFooter());

      await act(async () => {
      });

      await act(async () => {
        rerender();
      });

      const allStyles = document.querySelectorAll('style[data-footer-custom-css]');
      expect(allStyles.length).toBe(1);
    });
  });

  describe('HTML Sanitization', () => {
    it('should sanitize HTML using DOMPurify', async () => {
      const footerConfig = {
        htmlCode: '<footer><script>alert("xss")</script></footer>',
      };

      (DOMPurify.sanitize as jest.Mock).mockReturnValue('<footer></footer>');

      let result: any;
      await act(async () => {
        result = renderHook(() => useFooter(footerConfig)).result;
      });

      expect(DOMPurify.sanitize).toHaveBeenCalledWith(
        '<footer><script>alert("xss")</script></footer>'
      );
      expect(result.current.html).toBe('<footer></footer>');
    });

    it('should use useMemo for sanitized HTML', async () => {
      const footerConfig = {
        htmlCode: '<footer>Test</footer>',
      };

      let callCount = 0;
      (DOMPurify.sanitize as jest.Mock).mockImplementation((html: string) => {
        callCount++;
        return html;
      });

      const { rerender } = renderHook(() => useFooter(footerConfig));

      await act(async () => {
      });

      const firstCallCount = callCount;

      // Rerender without changing footerData.html
      await act(async () => {
        rerender();
      });

      // sanitize should be called same number of times (memoized)
      expect(callCount).toBe(firstCallCount);
    });

    it('should add DOMPurify hook for link targets', async () => {
      await act(async () => {
        renderHook(() => useFooter());
      });

      expect(DOMPurify.addHook).toHaveBeenCalledWith(
        'afterSanitizeAttributes',
        expect.any(Function)
      );
    });

    it('should configure DOMPurify hook to add target="_blank" to links', async () => {
      let hookCallback: any;
      (DOMPurify.addHook as jest.Mock).mockImplementation((event: string, callback: any) => {
        if (event === 'afterSanitizeAttributes') {
          hookCallback = callback;
        }
      });

      await act(async () => {
        renderHook(() => useFooter());
      });

      // Test the hook callback with a node that has 'target' property
      const mockNodeWithTarget = {
        target: '_self',
        setAttribute: jest.fn(),
        hasAttribute: jest.fn().mockReturnValue(false),
      };

      hookCallback(mockNodeWithTarget);

      expect(mockNodeWithTarget.setAttribute).toHaveBeenCalledWith('target', '_blank');
    });

    it('should configure DOMPurify hook to add xlink:show="new" for xlink:href', async () => {
      let hookCallback: any;
      (DOMPurify.addHook as jest.Mock).mockImplementation((event: string, callback: any) => {
        if (event === 'afterSanitizeAttributes') {
          hookCallback = callback;
        }
      });

      await act(async () => {
        renderHook(() => useFooter());
      });

      // Test the hook callback with a node that has xlink:href but no target
      const mockNodeWithXlink = {
        setAttribute: jest.fn(),
        hasAttribute: jest.fn((attr: string) => {
          if (attr === 'target') return false;
          if (attr === 'xlink:href') return true;
          return false;
        }),
      };

      hookCallback(mockNodeWithXlink);

      expect(mockNodeWithXlink.setAttribute).toHaveBeenCalledWith('xlink:show', 'new');
    });

    it('should configure DOMPurify hook to add xlink:show="new" for href', async () => {
      let hookCallback: any;
      (DOMPurify.addHook as jest.Mock).mockImplementation((event: string, callback: any) => {
        if (event === 'afterSanitizeAttributes') {
          hookCallback = callback;
        }
      });

      await act(async () => {
        renderHook(() => useFooter());
      });

      // Test the hook callback with a node that has href but no target
      const mockNodeWithHref = {
        setAttribute: jest.fn(),
        hasAttribute: jest.fn((attr: string) => {
          if (attr === 'target') return false;
          if (attr === 'href') return true;
          return false;
        }),
      };

      hookCallback(mockNodeWithHref);

      expect(mockNodeWithHref.setAttribute).toHaveBeenCalledWith('xlink:show', 'new');
    });
  });

  describe('Error Handling', () => {
    it('should handle JSON parse error in templatesConfig', async () => {
      mockUseAccount.mockReturnValue({
        account: {
          templatesConfig: 'invalid-json',
        },
      });

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      let result: any;
      await act(async () => {
        result = renderHook(() => useFooter()).result;
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error setting up footer:', expect.any(Error));
      expect(result.current.html).toBe('');
      expect(result.current.cssUrl).toBe('');

      consoleErrorSpy.mockRestore();
    });

    it('should handle CSS fetch error', async () => {
      const templatesConfig = {
        footerStyling: true,
        footerContent: {
          cssContentUrl: 'https://example.com/footer.css',
        },
      };

      mockUseAccount.mockReturnValue({
        account: {
          templatesConfig: JSON.stringify(templatesConfig),
        },
      });

      mockRestAdapterGet.mockRejectedValue(new Error('Network error'));

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await act(async () => {
        renderHook(() => useFooter());
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error fetching CSS from API:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it('should handle HTML fetch error', async () => {
      const templatesConfig = {
        footerStyling: true,
        footerContent: {
          htmlContentUrl: 'https://example.com/footer.html',
        },
      };

      mockUseAccount.mockReturnValue({
        account: {
          templatesConfig: JSON.stringify(templatesConfig),
        },
      });

      mockRestAdapterGet.mockRejectedValue(new Error('Fetch failed'));

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      let result: any;
      await act(async () => {
        result = renderHook(() => useFooter()).result;
      });

      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(result.current.html).toBe('');

      consoleErrorSpy.mockRestore();
    });

    it('should continue after CSS fetch error', async () => {
      const templatesConfig = {
        footerStyling: true,
        footerContent: {
          cssContentUrl: 'https://example.com/footer.css',
          htmlContentUrl: 'https://example.com/footer.html',
        },
      };

      mockUseAccount.mockReturnValue({
        account: {
          templatesConfig: JSON.stringify(templatesConfig),
        },
      });

      mockRestAdapterGet.mockImplementation((params: any) => {
        if (params.url.includes('footer.css')) {
          return Promise.reject(new Error('CSS error'));
        }
        return Promise.resolve('<footer>HTML still works</footer>');
      });

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      let result: any;
      await act(async () => {
        result = renderHook(() => useFooter()).result;
      });

      expect(DOMPurify.sanitize).toHaveBeenCalledWith('<footer>HTML still works</footer>');

      consoleErrorSpy.mockRestore();
    });
  });
});
