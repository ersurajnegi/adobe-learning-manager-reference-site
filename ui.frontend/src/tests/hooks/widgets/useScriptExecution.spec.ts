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
import { useScriptExecution } from '@hooks/widgets/useScriptExecution';

function renderHook(javascript: string, elementid: string) {
  const container = document.createElement('div');
  document.body.appendChild(container);

  act(() => {
    ReactDOM.render(
      React.createElement(() => {
        useScriptExecution(javascript, elementid);
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

describe('useScriptExecution', () => {
  it('useScriptExecution_emptyJs_logsWarning', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    renderHook('', 'widget-1');

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('widget-1')
    );
    warnSpy.mockRestore();
  });

  it('useScriptExecution_validJs_executesCodeWithDocumentAndWindow', () => {
    const sideEffect = jest.fn();
    (window as any).__testCallback = sideEffect;

    renderHook('window.__testCallback();', 'widget-2');

    expect(sideEffect).toHaveBeenCalledTimes(1);
    delete (window as any).__testCallback;
  });

  it('useScriptExecution_jsWithSyntaxError_logsErrorWithoutThrowing', () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => renderHook('{{{{invalid syntax}}}}', 'widget-3')).not.toThrow();

    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it('useScriptExecution_jsThrowsAtRuntime_logsErrorWithoutThrowing', () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => renderHook('throw new Error("runtime error");', 'widget-4')).not.toThrow();

    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
