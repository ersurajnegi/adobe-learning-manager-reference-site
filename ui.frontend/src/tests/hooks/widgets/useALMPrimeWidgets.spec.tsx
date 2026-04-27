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
jest.mock('react-intl', () => ({
  useIntl: jest.fn(),
}));

import React from 'react';
import ReactDOM from 'react-dom';
import { act } from '@testing-library/react';
import { useIntl } from 'react-intl';
import { useALMPrimeWidgets } from '@hooks/widgets/useALMPrimeWidgets';

const mockUseIntl = useIntl as jest.MockedFunction<typeof useIntl>;

function renderHook<T>(hookCallback: () => T) {
  const result: any = { current: null };
  const container = document.createElement('div');
  document.body.appendChild(container);

  act(() => {
    ReactDOM.render(
      React.createElement(() => {
        result.current = hookCallback();
        return null;
      }),
      container
    );
  });

  return {
    result,
    unmount: () => {
      act(() => { ReactDOM.unmountComponentAtNode(container); });
      container.parentNode?.removeChild(container);
    },
  };
}

describe('useALMPrimeWidgets', () => {
  beforeEach(() => {
    mockUseIntl.mockReturnValue({ formatMessage: jest.fn() } as any);
  });

  it('returns an empty object', () => {
    const { result } = renderHook(() => useALMPrimeWidgets());
    expect(result.current).toEqual({});
  });
});
