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
import { useConfirmationAlert, VariantType } from '@common/Alert/useConfirmationAlert';

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

jest.mock('@components/Community/PrimeAlertDialog', () => ({
  PrimeAlertDialog: ({ variant, title, show }: any) => (
    <div data-testid="prime-alert-dialog" data-variant={variant} data-title={title} data-show={String(show)} />
  ),
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
  return calls[calls.length - 1]?.[0]?.props as Record<string, any> | undefined;
}

describe('useConfirmationAlert', () => {
  let dispatchedEvents: Event[];

  beforeEach(() => {
    mockRenderCalls = [];
    dispatchedEvents = [];
    jest.spyOn(document, 'dispatchEvent').mockImplementation((event: Event) => {
      dispatchedEvents.push(event);
      return true;
    });
    const alertContainer = document.createElement('div');
    alertContainer.id = 'alertDialog';
    document.body.appendChild(alertContainer);
  });

  afterEach(() => {
    document.body.innerHTML = '';
    jest.restoreAllMocks();
  });

  it('almConfirmationAlert_dispatchesAlmDisableBackgroundEvent', () => {
    const { result } = renderHook(() => useConfirmationAlert());
    const [almConfirmationAlert] = result.current;

    act(() => { almConfirmationAlert('Title', 'Body', 'OK'); });

    expect(dispatchedEvents.some(e => e.type === 'almDisableBackground')).toBe(true);
  });

  it('almConfirmationAlert_rendersPrimeAlertDialogWithCorrectProps', () => {
    const { result } = renderHook(() => useConfirmationAlert());
    const [almConfirmationAlert] = result.current;

    act(() => {
      almConfirmationAlert('Confirm Delete', 'Are you sure?', 'Delete', 'Cancel', undefined, undefined, VariantType.DESTRUCTIVE);
    });

    const props = latestAlertProps()!;
    expect(props.show).toBe(true);
    expect(props.title).toBe('Confirm Delete');
    expect(props.body).toBe('Are you sure?');
    expect(props.primaryActionLabel).toBe('Delete');
    expect(props.secondaryActionLabel).toBe('Cancel');
    expect(props.variant).toBe(VariantType.DESTRUCTIVE);
  });

  it('almConfirmationAlert_noVariantProvided_defaultsToConfirmationVariant', () => {
    const { result } = renderHook(() => useConfirmationAlert());
    const [almConfirmationAlert] = result.current;

    act(() => { almConfirmationAlert('Title', 'Body', 'OK'); });

    expect(latestAlertProps()!.variant).toBe(VariantType.CONFIRMATION);
  });

  it('onPrimaryAction_callsPrimaryHandlerAndDispatchesAlmEnableBackground', () => {
    const { result } = renderHook(() => useConfirmationAlert());
    const [almConfirmationAlert] = result.current;
    const onPrimary = jest.fn();

    act(() => { almConfirmationAlert('Title', 'Body', 'Confirm', undefined, onPrimary); });
    act(() => { latestAlertProps()!.onPrimaryAction(); });

    expect(onPrimary).toHaveBeenCalledTimes(1);
    expect(dispatchedEvents.some(e => e.type === 'almEnableBackground')).toBe(true);
  });

  it('onSecondaryAction_callsSecondaryHandlerAndDispatchesAlmEnableBackground', () => {
    const { result } = renderHook(() => useConfirmationAlert());
    const [almConfirmationAlert] = result.current;
    const onSecondary = jest.fn();

    act(() => {
      almConfirmationAlert('Title', 'Body', 'Confirm', 'Cancel', undefined, onSecondary);
    });
    act(() => { latestAlertProps()!.onSecondaryAction(); });

    expect(onSecondary).toHaveBeenCalledTimes(1);
    expect(dispatchedEvents.some(e => e.type === 'almEnableBackground')).toBe(true);
  });

  it('almConfirmationAlert_missingAlertContainer_doesNotRenderAndDoesNotThrow', () => {
    document.getElementById('alertDialog')?.remove();
    const { result } = renderHook(() => useConfirmationAlert());
    const [almConfirmationAlert] = result.current;
    const renderCountBefore = mockRenderCalls.length;

    act(() => { almConfirmationAlert('Title', 'Body', 'OK'); });

    expect(mockRenderCalls.length).toBe(renderCountBefore);
  });

  it('almConfirmationAlert_noPrimaryHandler_doesNotThrowWhenPrimaryActionInvoked', () => {
    const { result } = renderHook(() => useConfirmationAlert());
    const [almConfirmationAlert] = result.current;

    act(() => { almConfirmationAlert('Title', 'Body', 'OK'); });

    expect(() => {
      act(() => { latestAlertProps()!.onPrimaryAction(); });
    }).not.toThrow();
  });
});
