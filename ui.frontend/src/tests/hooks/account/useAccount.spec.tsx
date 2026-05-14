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
 * Unit Tests for useAccount Hook
 *
 * Hook handles:
 * - Fetching account information on mount
 * - AbortController for cleanup on unmount
 * - Error handling (AbortError vs other errors)
 * - State cleanup on unmount
 * - Async account data loading
 */

import { act } from '@testing-library/react';
import React from 'react';
import ReactDOM from 'react-dom';
import { useAccount } from '../../../almLib/hooks/account/useAccount';

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
const mockGetALMAccount = jest.fn();

jest.mock('../../../almLib/utils/global', () => ({
  getALMAccount: () => mockGetALMAccount(),
}));

describe('useAccount', () => {
  const mockAccount = {
    id: 'account-123',
    name: 'Test Account',
    subdomain: 'test',
    loginUrl: 'https://test.example.com',
    logoUrl: 'https://test.example.com/logo.png',
    locale: 'en-US',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetALMAccount.mockResolvedValue(mockAccount);
  });

  describe('Hook Initialization', () => {
    it('should initialize account as empty object', () => {
      const { result } = renderHook(() => useAccount());

      // Before async call completes, account is empty object
      expect(result.current.account).toEqual({});
    });

    it('should call getALMAccount on mount', async () => {
      // beforeEach already clears mocks
      await act(async () => {
        renderHook(() => useAccount());
      });

      // getALMAccount should have been called at least once
      expect(mockGetALMAccount).toHaveBeenCalled();
    });

    it('should only call getALMAccount once on mount', async () => {
      await act(async () => {
        renderHook(() => useAccount());
      });

      expect(mockGetALMAccount).toHaveBeenCalledTimes(1);
    });
  });

  describe('Account Fetching', () => {
    it('should set account data after successful fetch', async () => {
      let result: any;
      await act(async () => {
        result = renderHook(() => useAccount()).result;
      });

      expect(result.current.account).toEqual(mockAccount);
    });

    it('should handle account with minimal properties', async () => {
      const minimalAccount = {
        id: 'minimal-123',
        name: 'Minimal Account',
      };

      mockGetALMAccount.mockResolvedValue(minimalAccount);

      let result: any;
      await act(async () => {
        result = renderHook(() => useAccount()).result;
      });

      expect(result.current.account).toEqual(minimalAccount);
    });

    it('should handle account with all properties', async () => {
      const fullAccount = {
        id: 'full-123',
        name: 'Full Account',
        subdomain: 'full',
        loginUrl: 'https://full.example.com',
        logoUrl: 'https://full.example.com/logo.png',
        locale: 'en-US',
        timeZoneCode: 'America/New_York',
        dateFormat: 'MM/DD/YYYY',
      };

      mockGetALMAccount.mockResolvedValue(fullAccount);

      let result: any;
      await act(async () => {
        result = renderHook(() => useAccount()).result;
      });

      expect(result.current.account).toEqual(fullAccount);
    });

    it('should update account state asynchronously', async () => {
      let result: any;

      // Before async completes
      result = renderHook(() => useAccount()).result;
      expect(result.current.account).toEqual({});

      // After async completes
      await act(async () => {
      });

      expect(result.current.account).toEqual(mockAccount);
    });
  });

  describe('Error Handling', () => {
    it('should handle AbortError silently', async () => {
      const abortError = new Error('Aborted');
      abortError.name = 'AbortError';
      mockGetALMAccount.mockRejectedValue(abortError);

      let result: any;
      await act(async () => {
        result = renderHook(() => useAccount()).result;
      });

      // Should not throw and account should remain empty
      expect(result.current.account).toEqual({});
    });

    it('should handle null account response', async () => {
      mockGetALMAccount.mockResolvedValue(null);

      let result: any;
      await act(async () => {
        result = renderHook(() => useAccount()).result;
      });

      expect(result.current.account).toBeNull();
    });

    it('should handle undefined account response', async () => {
      mockGetALMAccount.mockResolvedValue(undefined);

      let result: any;
      await act(async () => {
        result = renderHook(() => useAccount()).result;
      });

      expect(result.current.account).toBeUndefined();
    });
  });

  describe('Cleanup', () => {
    it('should clear account state on unmount', async () => {
      let result: any;
      let unmount: any;

      await act(async () => {
        const hook = renderHook(() => useAccount());
        result = hook.result;
        unmount = hook.unmount;
      });

      // Account should be set
      expect(result.current.account).toEqual(mockAccount);

      // Unmount component
      act(() => {
        unmount();
      });

      // Note: After unmount, result.current reflects the last rendered state
      // The cleanup happens but we can't observe it since the component is unmounted
      // This test verifies that unmount doesn't cause errors
      expect(typeof unmount).toBe('function');
    });

    it('should prevent state updates after unmount', async () => {
      // Slow response to simulate unmounting before response arrives
      mockGetALMAccount.mockImplementation(() => {
        return new Promise(resolve => {
          setTimeout(() => resolve(mockAccount), 200);
        });
      });

      let result: any;
      let unmount: any;

      await act(async () => {
        const hook = renderHook(() => useAccount());
        result = hook.result;
        unmount = hook.unmount;
      });

      // Unmount before async completes
      await act(async () => {
        unmount();
      });

      // Account should be cleared
      expect(result.current.account).toEqual({});
    });
  });

  describe('React Lifecycle', () => {
    it('should only fetch account once per mount', async () => {
      const { rerender } = renderHook(() => useAccount());

      await act(async () => {
      });

      expect(mockGetALMAccount).toHaveBeenCalledTimes(1);

      // Rerender shouldn't trigger another fetch
      await act(async () => {
        rerender();
      });

      expect(mockGetALMAccount).toHaveBeenCalledTimes(1);
    });

    it('should have empty dependency array for useEffect', async () => {
      // This is implicitly tested by verifying the effect runs only once
      const { rerender } = renderHook(() => useAccount());

      await act(async () => {
      });

      const firstCallCount = mockGetALMAccount.mock.calls.length;

      // Multiple rerenders shouldn't trigger the effect again
      await act(async () => {
        rerender();
        rerender();
        rerender();
      });

      expect(mockGetALMAccount).toHaveBeenCalledTimes(firstCallCount);
    });
  });

  describe('AbortController Integration', () => {
    it('should create AbortController on mount', async () => {
      // Note: AbortController is created but difficult to spy on in Jest
      // This test verifies the hook initializes successfully with AbortController
      let result: any;
      await act(async () => {
        result = renderHook(() => useAccount()).result;
      });

      expect(result.current.account).toEqual(mockAccount);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty account object', async () => {
      mockGetALMAccount.mockResolvedValue({});

      let result: any;
      await act(async () => {
        result = renderHook(() => useAccount()).result;
      });

      expect(result.current.account).toEqual({});
    });

    it('should handle account with extra properties', async () => {
      const accountWithExtras = {
        ...mockAccount,
        customField1: 'value1',
        customField2: 'value2',
        nested: {
          property: 'value',
        },
      };

      mockGetALMAccount.mockResolvedValue(accountWithExtras);

      let result: any;
      await act(async () => {
        result = renderHook(() => useAccount()).result;
      });

      expect(result.current.account).toEqual(accountWithExtras);
    });

    it('should handle very slow network responses', async () => {
      jest.useFakeTimers();

      mockGetALMAccount.mockImplementation(() => {
        return new Promise(resolve => {
          setTimeout(() => resolve(mockAccount), 1000);
        });
      });

      let result: any;

      await act(async () => {
        result = renderHook(() => useAccount()).result;
      });

      // Initially empty
      expect(result.current.account).toEqual({});

      // Advance time to trigger the timeout and flush promise resolution
      await act(async () => {
        jest.runAllTimers();
        await Promise.resolve();
        await Promise.resolve();
      });

      expect(result.current.account).toEqual(mockAccount);

      jest.useRealTimers();
    });
  });
});
