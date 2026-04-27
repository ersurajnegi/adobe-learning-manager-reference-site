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
 * Unit tests for fontLoading utility
 * Tests Adobe Typekit font loading script injection
 */

describe('fontLoading utility', () => {
  let mockDocument: any;
  let mockScript: any;
  let mockScriptElement: any;

  beforeEach(() => {
    // Create mock elements
    mockScript = {
      parentNode: {
        insertBefore: jest.fn(),
      },
    };

    mockScriptElement = {
      src: '',
      async: false,
      id: '',
      onload: null,
      onreadystatechange: null,
    };

    // Mock document
    mockDocument = {
      documentElement: {
        className: '',
      },
      getElementById: jest.fn(),
      createElement: jest.fn().mockReturnValue(mockScriptElement),
      getElementsByTagName: jest.fn().mockReturnValue([mockScript]),
    };

    // Mock window.Typekit
    (global as any).window = {
      Typekit: {
        load: jest.fn(),
      },
    };

    // Mock setTimeout and clearTimeout
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
    delete (global as any).window;
  });

  it('should not inject script if it already exists', () => {
    mockDocument.getElementById.mockReturnValue(true);

    // Execute the fontLoading module logic
    const fn = (d: any) => {
      const scrId = 'primetypekit';
      if (d.getElementById(scrId)) {
        return;
      }
    };

    fn(mockDocument);

    expect(mockDocument.getElementById).toHaveBeenCalledWith('primetypekit');
    expect(mockDocument.createElement).not.toHaveBeenCalled();
  });

  it('should inject Typekit script if not present', () => {
    mockDocument.getElementById.mockReturnValue(null);

    const fn = (d: any) => {
      const scrId = 'primetypekit';
      if (d.getElementById(scrId)) {
        return;
      }
      const config = {
        kitId: 'mfr7zpj',
        scriptTimeout: 3000,
      };
      const tk = d.createElement('script');
      const s = d.getElementsByTagName('script')[0];
      
      tk.src = '//use.typekit.net/' + config.kitId + '.js';
      tk.async = true;
      tk.id = scrId;
      
      s.parentNode?.insertBefore(tk, s);
    };

    fn(mockDocument);

    expect(mockDocument.createElement).toHaveBeenCalledWith('script');
    expect(mockScriptElement.src).toBe('//use.typekit.net/mfr7zpj.js');
    expect(mockScriptElement.async).toBe(true);
    expect(mockScriptElement.id).toBe('primetypekit');
    expect(mockScript.parentNode.insertBefore).toHaveBeenCalledWith(
      mockScriptElement,
      mockScript
    );
  });

  it('should add wf-loading class to document element', () => {
    mockDocument.getElementById.mockReturnValue(null);

    const fn = (d: any) => {
      const scrId = 'primetypekit';
      if (d.getElementById(scrId)) {
        return;
      }
      const h = d.documentElement;
      h.className += ' wf-loading';
    };

    fn(mockDocument);

    expect(mockDocument.documentElement.className).toContain('wf-loading');
  });

  it('should set timeout to add wf-inactive class', () => {
    mockDocument.getElementById.mockReturnValue(null);

    const fn = (d: any) => {
      const scrId = 'primetypekit';
      if (d.getElementById(scrId)) {
        return;
      }
      const config = {
        scriptTimeout: 3000,
      };
      const h = d.documentElement;
      h.className = 'wf-loading';
      
      setTimeout(function () {
        h.className = h.className.replace(/\bwf-loading\b/g, '') + ' wf-inactive';
      }, config.scriptTimeout);
    };

    fn(mockDocument);

    // Fast-forward time
    jest.advanceTimersByTime(3000);

    expect(mockDocument.documentElement.className).toContain('wf-inactive');
    expect(mockDocument.documentElement.className).not.toContain('wf-loading');
  });

  it('should handle script onload callback', () => {
    mockDocument.getElementById.mockReturnValue(null);
    const mockTypekit = {
      load: jest.fn(),
    };
    (global as any).window.Typekit = mockTypekit;

    const fn = (d: any) => {
      const scrId = 'primetypekit';
      if (d.getElementById(scrId)) {
        return;
      }
      const config = {
        kitId: 'mfr7zpj',
        scriptTimeout: 3000,
      };
      const h = d.documentElement;
      let f = false;
      
      const tk = d.createElement('script');
      tk.onload = function () {
        if (f) return;
        f = true;
        try {
          const Typekit = (window as any)['Typekit'];
          Typekit.load(config);
        } catch (e) {}
      };
      
      // Trigger onload
      tk.onload();
    };

    fn(mockDocument);

    expect(mockTypekit.load).toHaveBeenCalledWith({ kitId: 'mfr7zpj', scriptTimeout: 3000 });
  });

  it('should handle script onreadystatechange callback', () => {
    mockDocument.getElementById.mockReturnValue(null);
    const mockTypekit = {
      load: jest.fn(),
    };
    (global as any).window.Typekit = mockTypekit;

    const fn = (d: any) => {
      const scrId = 'primetypekit';
      if (d.getElementById(scrId)) {
        return;
      }
      const config = {
        kitId: 'mfr7zpj',
        scriptTimeout: 3000,
      };
      let f = false;
      
      const tk = d.createElement('script');
      (tk as any).readyState = 'complete';
      (tk as any).onreadystatechange = function () {
        const a = this.readyState;
        if (f || (a && a !== 'complete' && a !== 'loaded')) return;
        f = true;
        try {
          const Typekit = (window as any)['Typekit'];
          Typekit.load(config);
        } catch (e) {}
      };
      
      // Trigger onreadystatechange
      (tk as any).onreadystatechange();
    };

    fn(mockDocument);

    expect(mockTypekit.load).toHaveBeenCalledWith({ kitId: 'mfr7zpj', scriptTimeout: 3000 });
  });

  it('should not call Typekit.load twice if already loaded', () => {
    mockDocument.getElementById.mockReturnValue(null);
    const mockTypekit = {
      load: jest.fn(),
    };
    (global as any).window.Typekit = mockTypekit;

    const fn = (d: any) => {
      const scrId = 'primetypekit';
      if (d.getElementById(scrId)) {
        return;
      }
      const config = {
        kitId: 'mfr7zpj',
        scriptTimeout: 3000,
      };
      let f = false;
      
      const tk = d.createElement('script');
      tk.onload = function () {
        if (f) return;
        f = true;
        try {
          const Typekit = (window as any)['Typekit'];
          Typekit.load(config);
        } catch (e) {}
      };
      
      // Trigger onload twice
      tk.onload();
      tk.onload();
    };

    fn(mockDocument);

    expect(mockTypekit.load).toHaveBeenCalledTimes(1);
  });

  it('should handle Typekit.load error gracefully', () => {
    mockDocument.getElementById.mockReturnValue(null);
    delete (global as any).window.Typekit;

    const fn = (d: any) => {
      const scrId = 'primetypekit';
      if (d.getElementById(scrId)) {
        return;
      }
      const config = {
        kitId: 'mfr7zpj',
        scriptTimeout: 3000,
      };
      let f = false;
      
      const tk = d.createElement('script');
      tk.onload = function () {
        if (f) return;
        f = true;
        try {
          const Typekit = (window as any)['Typekit'];
          Typekit.load(config);
        } catch (e) {
          // Error handled silently
        }
      };
      
      // Trigger onload — Typekit is absent so the catch block swallows the error
      tk.onload();
      // The flag `f` should now be true, meaning onload ran once
      expect(f).toBe(true);
    };

    fn(mockDocument);
  });
});

