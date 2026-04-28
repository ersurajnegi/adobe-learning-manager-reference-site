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
import { waitFor } from '@testing-library/dom';
import { act } from 'react-dom/test-utils';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { IntlProvider } from 'react-intl';
import PrimeCommunityAddPost from '@components/Community/PrimeCommunityAddPost/PrimeCommunityAddPost';
import * as communityHooks from '@hooks/community';
import * as alertHooks from '@common/Alert/useConfirmationAlert';

jest.mock('@hooks/community', () => ({ usePost: jest.fn() }));
jest.mock('@common/Alert/useConfirmationAlert', () => ({ useConfirmationAlert: jest.fn() }));
jest.mock('@utils/social-utils', () => ({ getAlmConfirmationBadwordParams: jest.fn() }));
jest.mock('@utils/widgets/common', () => ({
  PrimeEvent: { ALM_SHOW_POST_CONFIRMATION: 'ALM_SHOW_POST_CONFIRMATION' },
}));
jest.mock('@components/Community/PrimeCommunityAddPostButton', () => ({
  PrimeCommunityAddPostButton: ({ savePostHandler, inMobileView }: any) => (
    <button
      data-testid={inMobileView ? 'mobile-add-post' : 'desktop-add-post'}
      onClick={() => savePostHandler('input text', 'discussion', null, false, null)}
    >
      Add Post
    </button>
  ),
}));

const ALM_SHOW_POST_CONFIRMATION = 'ALM_SHOW_POST_CONFIRMATION';

describe('PrimeCommunityAddPost', () => {
  const mockAddPost = jest.fn();
  const mockAlmConfirmationAlert = jest.fn();
  const mockReloadPosts = jest.fn();

  const defaultProps = { boardId: 'board-123', reloadPosts: mockReloadPosts };

  const enMessages = {
    'alm.community.postPublished.label': 'Post Published',
    'alm.community.postPublished.successMessage':
      'Your post has been published. It may take some time to appear on the board.',
    'alm.community.ok.label': 'Ok',
  };

  const renderComponent = (props = {}) =>
    render(
      <IntlProvider locale="en" messages={enMessages}>
        <PrimeCommunityAddPost {...defaultProps} {...props} />
      </IntlProvider>
    );

  beforeEach(() => {
    jest.clearAllMocks();
    (communityHooks.usePost as jest.Mock).mockReturnValue({ addPost: mockAddPost });
    (alertHooks.useConfirmationAlert as jest.Mock).mockReturnValue([mockAlmConfirmationAlert]);
  });

  it('savePostHandler_desktopButtonClicked_callsAddPostWithBoardIdAndArgs', async () => {
    renderComponent();
    userEvent.click(screen.getByTestId('desktop-add-post'));

    await waitFor(() =>
      expect(mockAddPost).toHaveBeenCalledWith(
        'board-123',
        'input text',
        'discussion',
        null,
        false,
        null
      )
    );
  });

  it('savePostHandler_mobileButtonClicked_callsAddPostWithBoardIdAndArgs', async () => {
    renderComponent();
    userEvent.click(screen.getByTestId('mobile-add-post'));

    await waitFor(() =>
      expect(mockAddPost).toHaveBeenCalledWith(
        'board-123',
        'input text',
        'discussion',
        null,
        false,
        null
      )
    );
  });

  it('unmount_cleanup_doesNotFireHandlerAfterUnmount', () => {
    const { unmount } = renderComponent();
    act(() => { unmount(); });

    document.dispatchEvent(new Event(ALM_SHOW_POST_CONFIRMATION));

    expect(mockAlmConfirmationAlert).not.toHaveBeenCalled();
  });

  it('showConfirmationDialog_eventDispatched_callsAlmConfirmationAlertWithI18nStringsAndReloadPosts', () => {
    renderComponent();
    document.dispatchEvent(new Event(ALM_SHOW_POST_CONFIRMATION));

    expect(mockAlmConfirmationAlert).toHaveBeenCalledWith(
      'Post Published',
      'Your post has been published. It may take some time to appear on the board.',
      'Ok',
      '',
      mockReloadPosts
    );
  });
});
