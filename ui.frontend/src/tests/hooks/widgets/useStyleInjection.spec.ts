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
import React from 'react';
import ReactDOM from 'react-dom';
import { act } from '@testing-library/react';
import { useStyleInjection } from '@hooks/widgets/useStyleInjection';

function renderHook(css: string, elementId: string) {
  const container = document.createElement('div');
  document.body.appendChild(container);

  act(() => {
    ReactDOM.render(
      React.createElement(() => {
        useStyleInjection(css, elementId);
        return null;
      }),
      container
    );
  });

  return {
    unmount: () => {
      act(() => { ReactDOM.unmountComponentAtNode(container); });
      container.parentNode?.removeChild(container);
    },
  };
}

describe('useStyleInjection', () => {
  afterEach(() => {
    // Clean up any injected style tags
    document.querySelectorAll('style[id]').forEach(el => el.remove());
  });

  it('useStyleInjection_withCss_injectsStyleTagIntoDocumentHead', () => {
    renderHook('.my-class { color: red; }', 'widget-5');

    const styleTag = document.getElementById('widget-5-style');
    expect(styleTag).not.toBeNull();
    expect(styleTag?.tagName).toBe('STYLE');
  });

  it('useStyleInjection_withCss_setsCorrectCssContent', () => {
    const css = '.test { font-size: 16px; margin: 0; }';
    renderHook(css, 'widget-6');

    const styleTag = document.getElementById('widget-6-style');
    expect(styleTag?.textContent).toBe(css);
  });

  it('useStyleInjection_emptyCss_logsWarning', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    renderHook('', 'widget-7');

    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('widget-7'));
    warnSpy.mockRestore();
  });

  it('useStyleInjection_onUnmount_removesInjectedStyleTag', () => {
    const { unmount } = renderHook('.remove-me { display: none; }', 'widget-8');

    expect(document.getElementById('widget-8-style')).not.toBeNull();

    unmount();

    expect(document.getElementById('widget-8-style')).toBeNull();
  });
});
