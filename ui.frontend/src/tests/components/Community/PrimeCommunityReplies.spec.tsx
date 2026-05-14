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
let mockItems: any[] = [];
let mockHasMoreItems = true;
const mockPatchReply = jest.fn().mockResolvedValue(undefined);
const mockLoadMoreReplies = jest.fn();

jest.mock('@hooks/community', () => ({
  useReplies: () => ({
    items: mockItems,
    patchReply: mockPatchReply,
    loadMoreReplies: mockLoadMoreReplies,
    hasMoreItems: mockHasMoreItems,
  }),
}));

jest.mock('react-intl', () => {
  const actual = jest.requireActual('react-intl');
  return {
    ...actual,
    useIntl: () => ({
      formatMessage: ({ defaultMessage }: any) => defaultMessage,
    }),
  };
});

jest.mock('@common/Alert/useConfirmationAlert', () => ({
  useConfirmationAlert: () => [jest.fn()],
}));

jest.mock('@utils/social-utils', () => ({
  getAlmConfirmationBadwordParams: jest.fn(),
}));

jest.mock('@components/Community/PrimeCommunityReply', () => ({
  PrimeCommunityReply: ({ reply, deleteReplyHandler, updateReply }: any) => (
    <div data-testid={`reply-${reply.id}`}>
      <button data-testid={`delete-${reply.id}`} onClick={deleteReplyHandler}>Delete</button>
      <button data-testid={`update-${reply.id}`} onClick={() => updateReply(reply.id, 'updated text')}>Update</button>
    </div>
  ),
}));

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { IntlProvider } from 'react-intl';
import PrimeCommunityReplies from '@components/Community/PrimeCommunityReplies/PrimeCommunityReplies';

const renderReplies = (props: any = {}) =>
  render(
    <IntlProvider locale="en" messages={{ 'alm.community.showMoreReplies': 'Show more replies' }}>
      <PrimeCommunityReplies object={{ id: 'c1' }} {...props} />
    </IntlProvider>
  );

describe('PrimeCommunityReplies', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockHasMoreItems = true;
    mockItems = [
      { id: 'r1', parent: { id: 'c1' }, content: 'Reply 1' },
      { id: 'r2', parent: { id: 'c1' }, content: 'Reply 2' },
      { id: 'r3', parent: { id: 'other' }, content: 'Other comment reply' },
    ];
  });

  describe('Reply filtering', () => {
    it('renders only replies whose parent.id matches the comment id', () => {
      renderReplies();
      expect(screen.getByTestId('reply-r1')).toBeInTheDocument();
      expect(screen.getByTestId('reply-r2')).toBeInTheDocument();
      expect(screen.queryByTestId('reply-r3')).not.toBeInTheDocument();
    });

    it('renders no replies when items is null or undefined', () => {
      mockItems = null as any;
      renderReplies();
      expect(screen.queryAllByTestId(/^reply-/)).toHaveLength(0);
    });
  });

  describe('Show more replies button', () => {
    it('shows the button when hasMoreItems is true', () => {
      mockHasMoreItems = true;
      renderReplies();
      expect(screen.getByText('Show more replies')).toBeInTheDocument();
    });

    it('hides the button when hasMoreItems is false', () => {
      mockHasMoreItems = false;
      renderReplies();
      expect(screen.queryByText('Show more replies')).not.toBeInTheDocument();
    });

    it('calls loadMoreReplies when clicked', () => {
      renderReplies();
      userEvent.click(screen.getByText('Show more replies'));
      expect(mockLoadMoreReplies).toHaveBeenCalledTimes(1);
    });
  });

  describe('Delete reply', () => {
    it('calls props.deleteReplyHandler when delete is triggered', () => {
      const deleteReplyHandler = jest.fn();
      renderReplies({ deleteReplyHandler });
      userEvent.click(screen.getByTestId('delete-r1'));
      expect(deleteReplyHandler).toHaveBeenCalledTimes(1);
    });

    it('does not throw when deleteReplyHandler prop is not a function', () => {
      renderReplies({ deleteReplyHandler: undefined });
      expect(() => userEvent.click(screen.getByTestId('delete-r1'))).not.toThrow();
    });
  });

  describe('Update reply', () => {
    it('calls patchReply with the reply id and new value', () => {
      renderReplies();
      userEvent.click(screen.getByTestId('update-r1'));
      expect(mockPatchReply).toHaveBeenCalledWith('r1', 'updated text');
    });
  });
});
