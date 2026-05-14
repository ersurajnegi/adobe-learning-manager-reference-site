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
import { render, screen, fireEvent } from '@testing-library/react';
import { waitFor } from '@testing-library/dom';
import ALMErrorBoundary from '@components/Common/ALMErrorBoundary/ALMErrorBoundary';

const mockGetALMUser = jest.fn();
const mockGetALMConfig = jest.fn();
const mockGetPrimeEmitEventLinks = jest.fn();
const mockIsUserLoggedIn = jest.fn();
const mockAjax = jest.fn();
const mockSendMessageToParent = jest.fn();

jest.mock('@utils/global', () => ({
  getALMUser: () => mockGetALMUser(),
  getALMConfig: () => mockGetALMConfig(),
  GetPrimeEmitEventLinks: () => mockGetPrimeEmitEventLinks(),
  isUserLoggedIn: () => mockIsUserLoggedIn(),
}));

jest.mock('@utils/restAdapter', () => ({
  RestAdapter: { ajax: (params: any) => mockAjax(params) },
}));

jest.mock('@utils/widgets/base/EventHandlingBase', () => ({
  SendMessageToParent: (msg: any, link: any) => mockSendMessageToParent(msg, link),
}));

jest.mock('@utils/widgets/common', () => ({
  PrimeEvent: { ALM_RETRY_PAGE_RELOAD: 'ALM_RETRY_PAGE_RELOAD' },
}));

jest.mock('@utils/translationService', () => ({
  GetTranslation: (key: string) =>
    ({ 'alm.error.message': 'Something went wrong', 'alm.retry': 'Retry' }[key] ?? key),
}));

jest.mock('@adobe/react-spectrum', () => ({
  Provider: ({ children }: any) => <>{children}</>,
  Button: ({ children, onPress }: any) => <button onClick={onPress}>{children}</button>,
  lightTheme: {},
}));

const ThrowError: React.FC<{ shouldThrow?: boolean }> = ({ shouldThrow = false }) => {
  if (shouldThrow) throw new Error('test error');
  return <div>Normal content</div>;
};

describe('ALMErrorBoundary', () => {
  beforeAll(() => { jest.spyOn(console, 'error').mockImplementation(() => {}); });
  afterAll(() => { (console.error as jest.Mock).mockRestore(); });

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetALMConfig.mockReturnValue({ primeApiURL: 'https://api.example.com' });
    mockGetALMUser.mockResolvedValue({ user: { id: 'user123', account: { id: 'account456' } } });
    mockGetPrimeEmitEventLinks.mockReturnValue('event-link');
    mockIsUserLoggedIn.mockReturnValue(true);
    mockAjax.mockResolvedValue({});
  });

  it('render_noError_showsChildren', () => {
    render(
      <ALMErrorBoundary>
        <div>Normal content</div>
      </ALMErrorBoundary>
    );

    expect(screen.getByText('Normal content')).not.toBeNull();
    expect(screen.queryByText('Something went wrong')).toBeNull();
  });

  it('render_childThrows_showsErrorUIAndHidesChildren', () => {
    render(
      <ALMErrorBoundary>
        <ThrowError shouldThrow />
      </ALMErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).not.toBeNull();
    expect(screen.getByText('Retry')).not.toBeNull();
    expect(screen.queryByText('Normal content')).toBeNull();
  });

  it('retryHandler_loggedIn_callsApiWithAccountAndUserId', async () => {
    render(
      <ALMErrorBoundary>
        <ThrowError shouldThrow />
      </ALMErrorBoundary>
    );

    await waitFor(() =>
      expect(mockAjax).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'GET',
          url: expect.stringContaining('accountId=account456'),
        })
      )
    );

    expect(mockAjax).toHaveBeenCalledWith(
      expect.objectContaining({ url: expect.stringContaining('userId=user123') })
    );
  });

  it('retryHandler_notLoggedIn_skipsApiCall', async () => {
    mockIsUserLoggedIn.mockReturnValue(false);

    render(
      <ALMErrorBoundary>
        <ThrowError shouldThrow />
      </ALMErrorBoundary>
    );

    await waitFor(() => expect(mockGetALMUser).toHaveBeenCalled());
    expect(mockAjax).not.toHaveBeenCalled();
  });

  it('retryHandler_apiError_logsToConsoleWithoutCrashing', async () => {
    mockAjax.mockRejectedValue(new Error('API Error'));

    render(
      <ALMErrorBoundary>
        <ThrowError shouldThrow />
      </ALMErrorBoundary>
    );

    await waitFor(() =>
      expect(console.error).toHaveBeenCalledWith(
        'Error logging UI error:',
        expect.any(Error)
      )
    );

    expect(screen.getByText('Something went wrong')).not.toBeNull();
  });

  it('retryButton_click_callsSendMessageToParent', async () => {
    render(
      <ALMErrorBoundary>
        <ThrowError shouldThrow />
      </ALMErrorBoundary>
    );

    fireEvent.click(screen.getByText('Retry'));

    await waitFor(() =>
      expect(mockSendMessageToParent).toHaveBeenCalledWith(
        { type: 'ALM_RETRY_PAGE_RELOAD' },
        'event-link'
      )
    );
  });

  it('retryHandler_onCatch_doesNotCallSendMessageToParent', async () => {
    render(
      <ALMErrorBoundary>
        <ThrowError shouldThrow />
      </ALMErrorBoundary>
    );

    await waitFor(() => expect(mockAjax).toHaveBeenCalled());
    expect(mockSendMessageToParent).not.toHaveBeenCalled();
  });
});
