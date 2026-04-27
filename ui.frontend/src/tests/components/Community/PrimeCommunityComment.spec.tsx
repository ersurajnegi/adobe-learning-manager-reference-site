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
import { act } from 'react-dom/test-utils';
import { render, screen } from '@testing-library/react';
import { waitFor } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import PrimeCommunityComment from '../../../almLib/components/Community/PrimeCommunityComment/PrimeCommunityComment';

const mockVoteComment = jest.fn();
const mockDeleteCommentVote = jest.fn();
const mockAddReply = jest.fn();
const mockFetchReplies = jest.fn();
const mockUpdateComment = jest.fn();
const mockDeleteCommentHandler = jest.fn();
const mockUpdateRightAnswerHandler = jest.fn();

jest.mock('../../../almLib/hooks/community', () => ({
  useComment: () => ({ voteComment: mockVoteComment, deleteCommentVote: mockDeleteCommentVote }),
  useReplies: () => ({ addReply: mockAddReply, fetchReplies: mockFetchReplies }),
}));

jest.mock('../../../almLib/common/Alert/useConfirmationAlert', () => ({
  useConfirmationAlert: () => [jest.fn()],
}));

jest.mock('../../../almLib/components/Community/PrimeCommunityObjectHeader', () => ({
  PrimeCommunityObjectHeader: ({ updateObjectHandler, deleteObjectHandler, updateRightAnswerHandler }: any) => (
    <div data-testid="comment-header">
      <button onClick={updateObjectHandler} data-testid="edit-button">Edit</button>
      <button onClick={deleteObjectHandler} data-testid="delete-button">Delete</button>
      <button onClick={() => updateRightAnswerHandler(true)} data-testid="mark-answer-button">Mark Answer</button>
    </div>
  ),
}));

jest.mock('../../../almLib/components/Community/PrimeCommunityObjectBody', () => ({
  PrimeCommunityObjectBody: ({ text }: any) => <div data-testid="comment-body">{text}</div>,
}));

jest.mock('../../../almLib/components/Community/PrimeCommunityObjectActions', () => ({
  PrimeCommunityObjectActions: ({
    actionClickHandler,
    viewButtonClickHandler,
    upVoteButtonClickHandler,
    downVoteButtonClickHandler,
    myUpVoteStatus,
    myDownVoteStatus,
    upVoteCount,
    downVoteCount,
    buttonCount,
    buttonLabel,
  }: any) => (
    <div data-testid="comment-actions">
      <button onClick={actionClickHandler} data-testid="reply-button">Reply</button>
      <button onClick={viewButtonClickHandler} data-testid="view-replies-button">{buttonLabel}</button>
      <button onClick={upVoteButtonClickHandler} data-testid="upvote-button">
        Upvote {myUpVoteStatus ? '(active)' : ''} ({upVoteCount})
      </button>
      <button onClick={downVoteButtonClickHandler} data-testid="downvote-button">
        Downvote {myDownVoteStatus ? '(active)' : ''} ({downVoteCount})
      </button>
      <span data-testid="reply-count">{buttonCount}</span>
    </div>
  ),
}));

jest.mock('../../../almLib/components/Community/PrimeCommunityObjectInput', () => ({
  PrimeCommunityObjectInput: ({ primaryActionHandler, secondaryActionHandler, inputPlaceholder }: any) => (
    <div data-testid="comment-input">
      <input placeholder={inputPlaceholder} data-testid="input-field" />
      <button onClick={() => primaryActionHandler('Test input')} data-testid="save-button">Save</button>
      {secondaryActionHandler && (
        <button onClick={secondaryActionHandler} data-testid="cancel-button">Cancel</button>
      )}
    </div>
  ),
}));

jest.mock('../../../almLib/components/Community/PrimeCommunityReplies', () => ({
  PrimeCommunityReplies: ({ deleteReplyHandler }: any) => (
    <div data-testid="replies-section">
      <button onClick={deleteReplyHandler} data-testid="delete-reply-button">Delete Reply</button>
    </div>
  ),
}));

describe('PrimeCommunityComment', () => {
  const mockComment = {
    id: 'comment123',
    richText: 'This is a comment',
    upVote: 5,
    downVote: 2,
    myVoteStatus: '',
    replyCount: 3,
  };

  const defaultProps = {
    comment: mockComment,
    parentPost: { id: 'post123', postingType: 'DEFAULT' },
    updateComment: mockUpdateComment,
    deleteCommentHandler: mockDeleteCommentHandler,
    updateRightAnswerHandler: mockUpdateRightAnswerHandler,
    answerCommentId: '',
  };

  const renderWithIntl = (component: React.ReactElement) =>
    render(<IntlProvider locale="en">{component}</IntlProvider>);

  beforeEach(() => {
    jest.clearAllMocks();
    mockAddReply.mockResolvedValue(undefined);
    mockUpdateComment.mockResolvedValue(undefined);
  });

  it('renders the comment body with the initial richText', () => {
    renderWithIntl(<PrimeCommunityComment {...defaultProps} />);
    expect(screen.getByTestId('comment-body').textContent).toBe('This is a comment');
  });

  describe('Upvote/Downvote', () => {
    it('calls voteComment("UP") and increments upvote count when not yet upvoted', () => {
      renderWithIntl(<PrimeCommunityComment {...defaultProps} />);
      act(() => { userEvent.click(screen.getByTestId('upvote-button')); });
      expect(mockVoteComment).toHaveBeenCalledWith('comment123', 'UP');
      expect(screen.getByTestId('upvote-button').textContent).toContain('(6)');
    });

    it('calls deleteCommentVote("UP") and decrements upvote count when already upvoted', () => {
      renderWithIntl(<PrimeCommunityComment {...defaultProps} comment={{ ...mockComment, myVoteStatus: 'UPVOTE' }} />);
      act(() => { userEvent.click(screen.getByTestId('upvote-button')); });
      expect(mockDeleteCommentVote).toHaveBeenCalledWith('comment123', 'UP');
      expect(screen.getByTestId('upvote-button').textContent).toContain('(4)');
    });

    it('calls voteComment("DOWN") and increments downvote count when not yet downvoted', () => {
      renderWithIntl(<PrimeCommunityComment {...defaultProps} />);
      act(() => { userEvent.click(screen.getByTestId('downvote-button')); });
      expect(mockVoteComment).toHaveBeenCalledWith('comment123', 'DOWN');
      expect(screen.getByTestId('downvote-button').textContent).toContain('(3)');
    });

    it('calls deleteCommentVote("DOWN") and decrements downvote count when already downvoted', () => {
      renderWithIntl(<PrimeCommunityComment {...defaultProps} comment={{ ...mockComment, myVoteStatus: 'DOWNVOTE' }} />);
      act(() => { userEvent.click(screen.getByTestId('downvote-button')); });
      expect(mockDeleteCommentVote).toHaveBeenCalledWith('comment123', 'DOWN');
      expect(screen.getByTestId('downvote-button').textContent).toContain('(1)');
    });

    it('clears the downvote when upvoting while already downvoted', () => {
      renderWithIntl(<PrimeCommunityComment {...defaultProps} comment={{ ...mockComment, myVoteStatus: 'DOWNVOTE' }} />);
      act(() => { userEvent.click(screen.getByTestId('upvote-button')); });
      expect(mockVoteComment).toHaveBeenCalledWith('comment123', 'UP');
      expect(screen.getByTestId('downvote-button').textContent).toContain('(1)');
      expect(screen.getByTestId('upvote-button').textContent).toContain('(6)');
    });
  });

  describe('Reply', () => {
    it('shows the reply input when the reply button is clicked', () => {
      renderWithIntl(<PrimeCommunityComment {...defaultProps} />);
      userEvent.click(screen.getByTestId('reply-button'));
      expect(screen.queryByTestId('comment-input')).not.toBeNull();
    });

    it('calls addReply, increments replyCount, shows replies section, and fetches replies on save', async () => {
      renderWithIntl(<PrimeCommunityComment {...defaultProps} />);
      userEvent.click(screen.getByTestId('reply-button'));
      userEvent.click(screen.getByTestId('save-button'));
      expect(mockAddReply).toHaveBeenCalledWith('comment123', 'Test input');
      await waitFor(() => {
        expect(screen.getByTestId('reply-count').textContent).toBe('4');
        expect(screen.queryByTestId('replies-section')).not.toBeNull();
      });
      expect(mockFetchReplies).toHaveBeenCalledWith('comment123');
    });
  });

  describe('View replies', () => {
    it('shows replies section, changes label to "Hide Replies", and fetches replies on click', () => {
      renderWithIntl(<PrimeCommunityComment {...defaultProps} />);
      expect(screen.getByTestId('view-replies-button').textContent).toBe('Show Replies');
      userEvent.click(screen.getByTestId('view-replies-button'));
      expect(screen.queryByTestId('replies-section')).not.toBeNull();
      expect(screen.getByTestId('view-replies-button').textContent).toBe('Hide Replies');
      expect(mockFetchReplies).toHaveBeenCalledWith('comment123');
    });

    it('hides replies section and restores "Show Replies" label on second click', () => {
      renderWithIntl(<PrimeCommunityComment {...defaultProps} />);
      userEvent.click(screen.getByTestId('view-replies-button'));
      userEvent.click(screen.getByTestId('view-replies-button'));
      expect(screen.queryByTestId('replies-section')).toBeNull();
      expect(screen.getByTestId('view-replies-button').textContent).toBe('Show Replies');
    });

    it('does not show replies when replyCount is 0', () => {
      renderWithIntl(<PrimeCommunityComment {...defaultProps} comment={{ ...mockComment, replyCount: 0 }} />);
      userEvent.click(screen.getByTestId('view-replies-button'));
      expect(screen.queryByTestId('replies-section')).toBeNull();
    });
  });

  describe('Edit comment', () => {
    it('shows edit input and hides comment body when edit is clicked', () => {
      renderWithIntl(<PrimeCommunityComment {...defaultProps} />);
      userEvent.click(screen.getByTestId('edit-button'));
      expect(screen.queryByTestId('comment-input')).not.toBeNull();
      expect(screen.queryByTestId('comment-body')).toBeNull();
    });

    it('calls updateComment, shows updated text, and exits edit mode on save', async () => {
      renderWithIntl(<PrimeCommunityComment {...defaultProps} />);
      userEvent.click(screen.getByTestId('edit-button'));
      userEvent.click(screen.getByTestId('save-button'));
      expect(mockUpdateComment).toHaveBeenCalledWith('comment123', 'Test input');
      await waitFor(() => {
        expect(screen.queryByTestId('comment-body')).not.toBeNull();
        expect(screen.getByTestId('comment-body').textContent).toBe('Test input');
      });
    });

    it('exits edit mode and preserves original text when cancel is clicked', () => {
      renderWithIntl(<PrimeCommunityComment {...defaultProps} />);
      userEvent.click(screen.getByTestId('edit-button'));
      userEvent.click(screen.getByTestId('cancel-button'));
      expect(screen.queryByTestId('comment-body')).not.toBeNull();
      expect(screen.getByTestId('comment-body').textContent).toBe('This is a comment');
    });
  });

  describe('Delete comment', () => {
    it('calls props.deleteCommentHandler when delete is clicked', () => {
      renderWithIntl(<PrimeCommunityComment {...defaultProps} />);
      userEvent.click(screen.getByTestId('delete-button'));
      expect(mockDeleteCommentHandler).toHaveBeenCalledTimes(1);
    });
  });

  describe('Delete reply', () => {
    it('decrements replyCount when a reply is deleted', () => {
      renderWithIntl(<PrimeCommunityComment {...defaultProps} />);
      userEvent.click(screen.getByTestId('view-replies-button'));
      userEvent.click(screen.getByTestId('delete-reply-button'));
      expect(screen.getByTestId('reply-count').textContent).toBe('2');
    });

    it('hides replies section when replyCount reaches 0', () => {
      renderWithIntl(<PrimeCommunityComment {...defaultProps} comment={{ ...mockComment, replyCount: 1 }} />);
      userEvent.click(screen.getByTestId('view-replies-button'));
      act(() => { userEvent.click(screen.getByTestId('delete-reply-button')); });
      expect(screen.queryByTestId('replies-section')).toBeNull();
    });
  });

  describe('Mark as answer', () => {
    it('calls updateRightAnswerHandler with comment id and the value passed from the header', () => {
      renderWithIntl(<PrimeCommunityComment {...defaultProps} />);
      userEvent.click(screen.getByTestId('mark-answer-button'));
      expect(mockUpdateRightAnswerHandler).toHaveBeenCalledWith('comment123', true);
    });
  });
});
