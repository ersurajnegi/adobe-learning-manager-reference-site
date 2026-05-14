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
const mockVoteReply = jest.fn();
const mockDeleteReplyVote = jest.fn();

jest.mock('@hooks/community', () => ({
  useReply: () => ({
    voteReply: mockVoteReply,
    deleteReplyVote: mockDeleteReplyVote,
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

jest.mock('@components/Community/PrimeCommunityObjectHeader', () => ({
  PrimeCommunityObjectHeader: ({ updateObjectHandler, deleteReplyHandler }: any) => (
    <div data-testid="object-header">
      <button data-testid="edit-btn" onClick={updateObjectHandler}>Edit</button>
      <button data-testid="delete-btn" onClick={deleteReplyHandler}>Delete</button>
    </div>
  ),
}));

jest.mock('@components/Community/PrimeCommunityObjectBody', () => ({
  PrimeCommunityObjectBody: ({ text }: any) => (
    <div data-testid="object-body">{text}</div>
  ),
}));

jest.mock('@components/Community/PrimeCommunityObjectActions', () => ({
  PrimeCommunityObjectActions: ({
    upVoteButtonClickHandler,
    downVoteButtonClickHandler,
    upVoteCount,
    downVoteCount,
    myUpVoteStatus,
    myDownVoteStatus,
  }: any) => (
    <div data-testid="object-actions">
      <button
        data-testid="upvote-btn"
        data-active={myUpVoteStatus ? 'true' : 'false'}
        onClick={upVoteButtonClickHandler}
      >
        {upVoteCount}
      </button>
      <button
        data-testid="downvote-btn"
        data-active={myDownVoteStatus ? 'true' : 'false'}
        onClick={downVoteButtonClickHandler}
      >
        {downVoteCount}
      </button>
    </div>
  ),
}));

jest.mock('@components/Community/PrimeCommunityObjectInput', () => {
  const React = jest.requireActual('react');
  return {
    PrimeCommunityObjectInput: React.forwardRef(
      ({ primaryActionHandler, secondaryActionHandler, defaultValue, inputPlaceholder }: any, _ref: any) => (
        <div data-testid="object-input">
          <input data-testid="input-field" placeholder={inputPlaceholder} defaultValue={defaultValue} />
          <button data-testid="save-btn" onClick={() => primaryActionHandler('Updated reply text')}>Save</button>
          <button data-testid="cancel-btn" onClick={secondaryActionHandler}>Cancel</button>
        </div>
      )
    ),
  };
});

import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
// Note: vote count updates use a useEffect chain; fireEvent (which wraps in act()) is needed
// to flush all cascading effects. userEvent v7 does not flush multi-step effect chains.
import '@testing-library/jest-dom';
import { IntlProvider } from 'react-intl';
import PrimeCommunityReply from '@components/Community/PrimeCommunityReply/PrimeCommunityReply';
import { UP, DOWN, UPVOTE, DOWNVOTE } from '@utils/constants';

const makeReply = (overrides: any = {}) => ({
  id: 'reply-1',
  richText: 'Original reply text',
  myVoteStatus: '',
  upVote: 10,
  downVote: 5,
  ...overrides,
});

const renderReply = (props: any = {}) =>
  render(
    <IntlProvider locale="en" messages={{}}>
      <PrimeCommunityReply reply={makeReply()} {...props} />
    </IntlProvider>
  );

const upvoteCount = () => parseInt(screen.getByTestId('upvote-btn').textContent!);
const downvoteCount = () => parseInt(screen.getByTestId('downvote-btn').textContent!);
const upvoteActive = () => screen.getByTestId('upvote-btn').getAttribute('data-active') === 'true';
const downvoteActive = () => screen.getByTestId('downvote-btn').getAttribute('data-active') === 'true';

describe('PrimeCommunityReply', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('Initial vote state', () => {
    it('initializes upvote active when myVoteStatus is UPVOTE', () => {
      renderReply({ reply: makeReply({ myVoteStatus: UPVOTE, upVote: 10 }) });
      expect(upvoteActive()).toBe(true);
      expect(upvoteCount()).toBe(10);
      expect(downvoteActive()).toBe(false);
    });

    it('initializes downvote active when myVoteStatus is DOWNVOTE', () => {
      renderReply({ reply: makeReply({ myVoteStatus: DOWNVOTE, downVote: 5 }) });
      expect(downvoteActive()).toBe(true);
      expect(downvoteCount()).toBe(5);
      expect(upvoteActive()).toBe(false);
    });

    it('initializes with no active vote when myVoteStatus is absent', () => {
      renderReply({ reply: makeReply({ myVoteStatus: undefined }) });
      expect(upvoteActive()).toBe(false);
      expect(downvoteActive()).toBe(false);
    });
  });

  describe('Upvote', () => {
    it('calls voteReply(id, UP) and increments count when not yet upvoted', () => {
      renderReply();
      expect(upvoteCount()).toBe(10);
      fireEvent.click(screen.getByTestId('upvote-btn'));
      expect(mockVoteReply).toHaveBeenCalledWith('reply-1', UP);
      expect(upvoteCount()).toBe(11);
      expect(upvoteActive()).toBe(true);
    });

    it('calls deleteReplyVote(id, UP) and decrements count when already upvoted', () => {
      renderReply({ reply: makeReply({ myVoteStatus: UPVOTE, upVote: 10 }) });
      expect(upvoteCount()).toBe(10);
      fireEvent.click(screen.getByTestId('upvote-btn'));
      expect(mockDeleteReplyVote).toHaveBeenCalledWith('reply-1', UP);
      expect(upvoteCount()).toBe(9);
      expect(upvoteActive()).toBe(false);
    });

    it('clears active downvote and decrements downvote count when switching from downvote to upvote', () => {
      renderReply({ reply: makeReply({ myVoteStatus: DOWNVOTE, upVote: 10, downVote: 5 }) });
      expect(downvoteActive()).toBe(true);
      fireEvent.click(screen.getByTestId('upvote-btn'));
      expect(mockVoteReply).toHaveBeenCalledWith('reply-1', UP);
      expect(downvoteActive()).toBe(false);
      expect(downvoteCount()).toBe(4);
      expect(upvoteActive()).toBe(true);
      expect(upvoteCount()).toBe(11);
    });
  });

  describe('Downvote', () => {
    it('calls voteReply(id, DOWN) and increments count when not yet downvoted', () => {
      renderReply();
      expect(downvoteCount()).toBe(5);
      fireEvent.click(screen.getByTestId('downvote-btn'));
      expect(mockVoteReply).toHaveBeenCalledWith('reply-1', DOWN);
      expect(downvoteCount()).toBe(6);
      expect(downvoteActive()).toBe(true);
    });

    it('calls deleteReplyVote(id, DOWN) and decrements count when already downvoted', () => {
      renderReply({ reply: makeReply({ myVoteStatus: DOWNVOTE, downVote: 5 }) });
      expect(downvoteCount()).toBe(5);
      fireEvent.click(screen.getByTestId('downvote-btn'));
      expect(mockDeleteReplyVote).toHaveBeenCalledWith('reply-1', DOWN);
      expect(downvoteCount()).toBe(4);
      expect(downvoteActive()).toBe(false);
    });

    it('clears active upvote and decrements upvote count when switching from upvote to downvote', () => {
      renderReply({ reply: makeReply({ myVoteStatus: UPVOTE, upVote: 10, downVote: 5 }) });
      expect(upvoteActive()).toBe(true);
      fireEvent.click(screen.getByTestId('downvote-btn'));
      expect(mockVoteReply).toHaveBeenCalledWith('reply-1', DOWN);
      expect(upvoteActive()).toBe(false);
      expect(upvoteCount()).toBe(9);
      expect(downvoteActive()).toBe(true);
      expect(downvoteCount()).toBe(6);
    });
  });

  describe('Edit mode', () => {
    it('shows ObjectInput and hides header/body/actions when edit is triggered', () => {
      renderReply();
      expect(screen.getByTestId('object-header')).toBeInTheDocument();
      expect(screen.queryByTestId('object-input')).not.toBeInTheDocument();
      userEvent.click(screen.getByTestId('edit-btn'));
      expect(screen.queryByTestId('object-header')).not.toBeInTheDocument();
      expect(screen.getByTestId('object-input')).toBeInTheDocument();
    });

    it('calls props.updateReply with reply id and new value, updates displayed text, and exits edit mode', async () => {
      const updateReply = jest.fn().mockResolvedValue(undefined);
      renderReply({ updateReply });
      userEvent.click(screen.getByTestId('edit-btn'));
      userEvent.click(screen.getByTestId('save-btn'));
      await new Promise(r => setTimeout(r, 0));
      expect(updateReply).toHaveBeenCalledWith('reply-1', 'Updated reply text');
      expect(screen.queryByTestId('object-input')).not.toBeInTheDocument();
      expect(screen.getByTestId('object-body')).toHaveTextContent('Updated reply text');
    });

    it('does not call props.updateReply and stays in edit mode when updateReply prop is not a function', async () => {
      renderReply({ updateReply: undefined });
      userEvent.click(screen.getByTestId('edit-btn'));
      userEvent.click(screen.getByTestId('save-btn'));
      await new Promise(r => setTimeout(r, 0));
      expect(screen.getByTestId('object-input')).toBeInTheDocument();
    });

    it('exits edit mode without saving when cancel is clicked', () => {
      const updateReply = jest.fn();
      renderReply({ updateReply });
      userEvent.click(screen.getByTestId('edit-btn'));
      userEvent.click(screen.getByTestId('cancel-btn'));
      expect(updateReply).not.toHaveBeenCalled();
      expect(screen.queryByTestId('object-input')).not.toBeInTheDocument();
      expect(screen.getByTestId('object-header')).toBeInTheDocument();
    });
  });

  describe('Delete reply', () => {
    it('calls props.deleteReplyHandler when delete is triggered', () => {
      const deleteReplyHandler = jest.fn();
      renderReply({ deleteReplyHandler });
      userEvent.click(screen.getByTestId('delete-btn'));
      expect(deleteReplyHandler).toHaveBeenCalledTimes(1);
    });

    it('does not throw when deleteReplyHandler prop is not a function', () => {
      renderReply({ deleteReplyHandler: undefined });
      expect(() => userEvent.click(screen.getByTestId('delete-btn'))).not.toThrow();
    });
  });
});
