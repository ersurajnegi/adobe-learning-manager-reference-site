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

import React from 'react';
import { act } from '@testing-library/react';
import ReactDOM from 'react-dom';
import { useAlert } from '@common/Alert/useAlert';
import { AlertType } from '@common/Alert/AlertDialog';

let mockRenderCalls: any[] = [];

jest.mock('react-dom', () => {
  const actual = jest.requireActual('react-dom');
  return {
    ...actual,
    render: (...args: any[]) => {
      mockRenderCalls.push(args);
      return actual.render(...args);
    },
  };
});

jest.mock('@common/Alert/AlertDialog', () => ({
  AlertDialog: ({ type, show, message }: any) => (
    <div data-testid="alert-dialog" data-type={type} data-show={String(show)} data-message={message} />
  ),
  AlertType: { success: 'success', error: 'error' },
}));

// Custom renderHook for @testing-library/react v9 (no built-in renderHook)
function renderHook<T>(hookCallback: () => T) {
  const result: any = { current: null };
  function TestComponent() {
    result.current = hookCallback();
    return null;
  }
  const container = document.createElement('div');
  document.body.appendChild(container);
  act(() => { ReactDOM.render(React.createElement(TestComponent), container); });
  return { result, unmount: () => ReactDOM.unmountComponentAtNode(container) };
}

// Returns the props from the most recent react-dom.render call targeting #alertDialog
function latestAlertProps() {
  const calls = mockRenderCalls.filter(call => call[1]?.id === 'alertDialog');
  return calls[calls.length - 1]?.[0]?.props as { show: boolean; message: string; type: string } | undefined;
}

describe('useAlert', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockRenderCalls = [];
    const alertContainer = document.createElement('div');
    alertContainer.id = 'alertDialog';
    document.body.appendChild(alertContainer);
  });

  afterEach(() => {
    document.body.innerHTML = '';
    jest.useRealTimers();
  });

  it('almAlert_showTrue_rendersAlertDialogWithCorrectPropsToAlertContainer', () => {
    const { result } = renderHook(() => useAlert());
    const [almAlert] = result.current;

    act(() => { almAlert(true, 'Upload complete', AlertType.success); });

    const props = latestAlertProps()!;
    expect(props.show).toBe(true);
    expect(props.message).toBe('Upload complete');
    expect(props.type).toBe(AlertType.success);
  });

  it('almAlert_errorType_rendersWithErrorType', () => {
    const { result } = renderHook(() => useAlert());
    const [almAlert] = result.current;

    act(() => { almAlert(true, 'Save failed', AlertType.error); });

    expect(latestAlertProps()!.type).toBe(AlertType.error);
  });

  it('almAlert_afterDefaultTimeout_reRendersWithShowFalse', () => {
    const { result } = renderHook(() => useAlert());
    const [almAlert] = result.current;

    act(() => { almAlert(true, 'Test', AlertType.success); });
    expect(latestAlertProps()!.show).toBe(true);

    act(() => { jest.advanceTimersByTime(3000); });

    expect(latestAlertProps()!.show).toBe(false);
  });

  it('almAlert_customTimeout_doesNotDismissBeforeTimeoutExpires_thenDismisses', () => {
    const { result } = renderHook(() => useAlert());
    const [almAlert] = result.current;

    act(() => { almAlert(true, 'Test', AlertType.success, 1000); });

    act(() => { jest.advanceTimersByTime(999); });
    expect(latestAlertProps()!.show).toBe(true);

    act(() => { jest.advanceTimersByTime(1); });
    expect(latestAlertProps()!.show).toBe(false);
  });
});
