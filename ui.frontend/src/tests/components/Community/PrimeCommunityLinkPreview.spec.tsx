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
import { render, act, screen } from '@testing-library/react';
import PrimeCommunityLinkPreview from '../../../almLib/components/Community/PrimeCommunityLinkPreview/PrimeCommunityLinkPreview';

const mockAjax = jest.fn();
const mockGetALMConfig = jest.fn();
const mockGetTranslation = jest.fn();
const mockJsonApiParse = jest.fn();
const mockGetLocalizedData = jest.fn();
const mockSetHttp = jest.fn();
const mockLinkifyFind = jest.fn();

jest.mock('../../../almLib/utils/restAdapter', () => ({
  RestAdapter: { ajax: (...args: any[]) => mockAjax(...args) },
}));

jest.mock('../../../almLib/utils/global', () => ({
  getALMConfig: () => mockGetALMConfig(),
}));

jest.mock('../../../almLib/utils/translationService', () => ({
  GetTranslation: (key: string, returnKey?: boolean) => mockGetTranslation(key, returnKey),
}));

jest.mock('../../../almLib/utils/jsonAPIAdapter', () => ({
  JsonApiParse: (data: any) => mockJsonApiParse(data),
}));

jest.mock('../../../almLib/utils/hooks', () => ({
  getLocalizedData: (metadata: any, locale: any) => mockGetLocalizedData(metadata, locale),
  setHttp: (url: string) => mockSetHttp(url),
}));

jest.mock('linkifyjs', () => ({
  find: (text: string, type: string) => mockLinkifyFind(text, type),
}));

jest.mock('../../../almLib/utils/inline_svg', () => ({
  SOCIAL_NO_PREVIEW: () => <span data-testid="no-preview-svg" />,
}));

jest.mock('../../../almLib/utils/themes', () => ({
  themesMap: {
    'Prime Default': Array.from({ length: 12 }, (_, i) => `#color${i}`),
  },
}));

describe('PrimeCommunityLinkPreview', () => {
  const defaultProps = {
    currentInput: '',
    showLinkPreview: true,
    viewMode: false,
  };

  const mockConfig = {
    primeApiURL: 'https://learningmanager.adobe.com/primeapi/v2',
    almBaseURL: 'https://learningmanager.adobe.com',
    locale: 'en-US',
    trainingOverviewPath: '/app/learner/training',
    themeData: { name: 'Prime Default' },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockGetALMConfig.mockReturnValue(mockConfig);
    mockGetTranslation.mockImplementation((key: string) => key);
    mockSetHttp.mockImplementation((url: string) => (url.startsWith('http') ? url : `http://${url}`));
    mockLinkifyFind.mockReturnValue([]);
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('hides the preview container when showLinkPreview is false', () => {
    const { container } = render(<PrimeCommunityLinkPreview {...defaultProps} showLinkPreview={false} />);
    expect(container.querySelector('.primeCommunityLinkPreview')).toBeNull();
  });

  it('shows the preview container when showLinkPreview is true', () => {
    const { container } = render(<PrimeCommunityLinkPreview {...defaultProps} showLinkPreview={true} />);
    expect(container.querySelector('.primeCommunityLinkPreview')).not.toBeNull();
  });

  it('hides the preview container when showLinkPreview toggles to false', () => {
    const { container, rerender } = render(<PrimeCommunityLinkPreview {...defaultProps} showLinkPreview={true} />);
    rerender(<PrimeCommunityLinkPreview {...defaultProps} showLinkPreview={false} />);
    expect(container.querySelector('.primeCommunityLinkPreview')).toBeNull();
  });

  it('does not call the API when currentInput is empty after the debounce delay', () => {
    render(<PrimeCommunityLinkPreview {...defaultProps} currentInput="" />);
    act(() => { jest.advanceTimersByTime(1000); });
    expect(mockAjax).not.toHaveBeenCalled();
  });

  it('does not call the API when linkify finds no URLs in the input', () => {
    mockLinkifyFind.mockReturnValue([]);
    render(<PrimeCommunityLinkPreview {...defaultProps} currentInput="plain text, no links" />);
    act(() => { jest.advanceTimersByTime(1000); });
    expect(mockAjax).not.toHaveBeenCalled();
  });

  it('calls the iframely API for an external URL after the debounce delay', async () => {
    mockLinkifyFind.mockReturnValue([{ value: 'https://external.com', href: 'https://external.com' }]);
    mockAjax.mockResolvedValue(JSON.stringify({ title: '', thumbnail_url: '', url: '' }));

    render(<PrimeCommunityLinkPreview {...defaultProps} currentInput="https://external.com" />);
    await act(async () => {
      jest.advanceTimersByTime(1000);
      await Promise.resolve();
    });

    expect(mockAjax).toHaveBeenCalledWith(
      expect.objectContaining({ url: expect.stringContaining('iframely'), method: 'GET' })
    );
  });

  it('calls the primeApi learningObjects endpoint for an ALM internal URL', async () => {
    const almUrl = 'https://learningmanager.adobe.com/app/learner#/course/123';
    mockLinkifyFind.mockReturnValue([{ value: almUrl, href: almUrl }]);
    mockAjax.mockResolvedValue({ data: { id: 'course:123' } });
    mockJsonApiParse.mockReturnValue({
      learningObject: {
        id: 'course:123',
        loType: 'course',
        localizedMetadata: [{ name: 'ALM Course', description: 'desc' }],
        imageUrl: '',
      },
    });
    mockGetLocalizedData.mockReturnValue({ name: 'ALM Course', description: 'desc' });

    render(<PrimeCommunityLinkPreview {...defaultProps} currentInput={almUrl} />);
    await act(async () => {
      jest.advanceTimersByTime(1000);
      await Promise.resolve();
    });

    expect(mockAjax).toHaveBeenCalledWith(
      expect.objectContaining({ url: expect.stringContaining('/learningObjects/course:123'), method: 'GET' })
    );
  });

  it('does not fire the API before 1 second has elapsed', () => {
    mockLinkifyFind.mockReturnValue([{ value: 'https://example.com', href: 'https://example.com' }]);
    render(<PrimeCommunityLinkPreview {...defaultProps} currentInput="https://example.com" />);

    act(() => { jest.advanceTimersByTime(500); });
    expect(mockAjax).not.toHaveBeenCalled();

    act(() => { jest.advanceTimersByTime(500); });
    expect(mockLinkifyFind).toHaveBeenCalledWith('https://example.com', 'url');
  });

  it('debounces rapid input changes and only processes the final value', () => {
    const { rerender } = render(<PrimeCommunityLinkPreview {...defaultProps} currentInput="a" />);
    act(() => { jest.advanceTimersByTime(500); });
    rerender(<PrimeCommunityLinkPreview {...defaultProps} currentInput="ab" />);
    rerender(<PrimeCommunityLinkPreview {...defaultProps} currentInput="abc" />);
    act(() => { jest.advanceTimersByTime(1000); });

    expect(mockLinkifyFind).toHaveBeenLastCalledWith('abc', 'url');
  });

  it('renders title text after a successful external URL response with a thumbnail', async () => {
    mockLinkifyFind.mockReturnValue([{ value: 'https://external.com', href: 'https://external.com' }]);
    mockAjax.mockResolvedValue(
      JSON.stringify({ title: 'External Site', thumbnail_url: 'https://external.com/thumb.jpg', url: 'https://external.com' })
    );

    render(<PrimeCommunityLinkPreview {...defaultProps} currentInput="https://external.com" />);
    await act(async () => {
      jest.advanceTimersByTime(1000);
      await Promise.resolve();
    });

    expect(screen.queryByText('External Site')).not.toBeNull();
  });

  it('does not throw when the API call rejects', async () => {
    mockLinkifyFind.mockReturnValue([{ value: 'https://external.com', href: 'https://external.com' }]);
    mockAjax.mockRejectedValue(new Error('Network error'));

    const { container } = render(<PrimeCommunityLinkPreview {...defaultProps} currentInput="https://external.com" />);
    await act(async () => {
      jest.advanceTimersByTime(1000);
      await Promise.resolve();
    });

    expect(container.querySelector('.primeCommunityLinkPreview')).not.toBeNull();
  });
});
