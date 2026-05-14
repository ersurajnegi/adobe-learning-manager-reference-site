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
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import PrimeCommunityBoardOptions from '@components/Community/PrimeCommunityBoardOptions/PrimeCommunityBoardOptions';

const mockGetALMConfig = jest.fn();

jest.mock('@utils/global', () => ({
  getALMConfig: () => mockGetALMConfig(),
}));

Object.assign(navigator, {
  clipboard: { writeText: jest.fn() },
});

delete (window as any).location;
window.location = { href: 'https://example.com:8080/app/learner' } as any;

describe('PrimeCommunityBoardOptions', () => {
  const mockBoardOptionsHandler = jest.fn();
  const mockCopyBoardUrlHandler = jest.fn();
  const mockReportBoardHandler = jest.fn();

  const defaultProps = {
    board: { id: 'board-123' },
    boardOptionsHandler: mockBoardOptionsHandler,
    copyBoardUrlHandler: mockCopyBoardUrlHandler,
    reportBoardHandler: mockReportBoardHandler,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetALMConfig.mockReturnValue({
      communityBoardDetailsPath: '/app/learner/community/board',
    });
  });

  const renderComponent = (props = {}) =>
    render(
      <IntlProvider
        locale="en"
        messages={{ 'alm.community.board.copyUrl': 'Copy URL', 'alm.community.board.report': 'Report' }}
      >
        <PrimeCommunityBoardOptions {...defaultProps} {...props} />
      </IntlProvider>
    );

  describe('Rendering', () => {
    it('renders Copy URL and Report options', () => {
      renderComponent();
      expect(screen.queryByText('Copy URL')).not.toBeNull();
      expect(screen.queryByText('Report')).not.toBeNull();
    });
  });

  describe('Copy URL', () => {
    it('writes the constructed board URL to clipboard and calls props.copyBoardUrlHandler on click', () => {
      renderComponent();
      userEvent.click(screen.getByText('Copy URL'));
      expect(navigator.clipboard.writeText as jest.Mock).toHaveBeenCalledWith(
        'https://example.com:8080/app/learner/community/board/boardId/board-123'
      );
      expect(mockCopyBoardUrlHandler).toHaveBeenCalledTimes(1);
    });

    it('still writes to clipboard when copyBoardUrlHandler is not provided', () => {
      renderComponent({ copyBoardUrlHandler: undefined });
      userEvent.click(screen.getByText('Copy URL'));
      expect(navigator.clipboard.writeText as jest.Mock).toHaveBeenCalledTimes(1);
    });
  });

  describe('Report', () => {
    it('calls props.reportBoardHandler on click', () => {
      renderComponent();
      userEvent.click(screen.getByText('Report'));
      expect(mockReportBoardHandler).toHaveBeenCalledTimes(1);
    });
  });

  describe('Click outside', () => {
    it('calls boardOptionsHandler when clicking outside the component', () => {
      renderComponent();
      userEvent.click(document.body);
      expect(mockBoardOptionsHandler).toHaveBeenCalledTimes(1);
    });

    it('does not call boardOptionsHandler when clicking inside the component', () => {
      renderComponent();
      userEvent.click(screen.getByText('Copy URL'));
      expect(mockBoardOptionsHandler).not.toHaveBeenCalled();
    });

    it('removes the click listener on unmount', () => {
      const spy = jest.spyOn(document, 'removeEventListener');
      const { unmount } = renderComponent();
      unmount();
      expect(spy).toHaveBeenCalledWith('click', expect.any(Function), true);
      spy.mockRestore();
    });
  });

  describe('Internationalisation', () => {
    it('renders translated labels for a non-English locale', () => {
      render(
        <IntlProvider
          locale="fr"
          messages={{ 'alm.community.board.copyUrl': "Copier l'URL", 'alm.community.board.report': 'Signaler' }}
        >
          <PrimeCommunityBoardOptions {...defaultProps} />
        </IntlProvider>
      );
      expect(screen.queryByText("Copier l'URL")).not.toBeNull();
      expect(screen.queryByText('Signaler')).not.toBeNull();
    });

    it('falls back to defaultMessage when translations are missing', () => {
      render(
        <IntlProvider locale="en" messages={{}}>
          <PrimeCommunityBoardOptions {...defaultProps} />
        </IntlProvider>
      );
      expect(screen.queryByText('Copy URL')).not.toBeNull();
      expect(screen.queryByText('Report')).not.toBeNull();
    });
  });
});
