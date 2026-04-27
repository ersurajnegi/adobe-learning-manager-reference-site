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
const mockVotePost = jest.fn();
const mockDeletePostVote = jest.fn();
const mockAddComment = jest.fn().mockResolvedValue(undefined);
const mockPatchPost = jest.fn().mockResolvedValue(undefined);
const mockSubmitPollVote = jest.fn();
const mockFetchComments = jest.fn();
const mockAlmConfirmationAlert = jest.fn((title, message, okLabel, cancelLabel, callback) => {
  if (callback) callback();
});

jest.mock('@hooks/community', () => ({
  usePost: () => ({
    votePost: mockVotePost,
    deletePostVote: mockDeletePostVote,
    addComment: mockAddComment,
    patchPost: mockPatchPost,
    submitPollVote: mockSubmitPollVote,
  }),
  useComments: () => ({
    fetchComments: mockFetchComments,
  }),
}));

jest.mock('@common/Alert/useConfirmationAlert', () => ({
  useConfirmationAlert: () => [mockAlmConfirmationAlert],
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
  PrimeCommunityObjectHeader: ({ updateObjectHandler }: any) => (
    <div
      data-testid="object-header"
      onClick={() => updateObjectHandler?.('updated text', 'DISCUSSION', null, false, null)}
    >
      Header
    </div>
  ),
}));

jest.mock('@components/Community/PrimeCommunityObjectBody', () => ({
  PrimeCommunityObjectBody: ({ submitPoll }: any) => (
    <div data-testid="object-body" onClick={() => submitPoll?.(2)}>
      Body
    </div>
  ),
}));

jest.mock('@components/Community/PrimeCommunityObjectActions', () => ({
  PrimeCommunityObjectActions: ({
    viewButtonClickHandler,
    upVoteButtonClickHandler,
    downVoteButtonClickHandler,
    buttonLabel,
    buttonCount,
    upVoteCount,
    downVoteCount,
    myUpVoteStatus,
    myDownVoteStatus,
  }: any) => (
    <div data-testid="object-actions">
      <button data-testid="view-comments-btn" onClick={viewButtonClickHandler}>
        {buttonLabel} ({buttonCount})
      </button>
      <button data-testid="upvote-btn" data-active={myUpVoteStatus ? 'true' : 'false'} onClick={upVoteButtonClickHandler}>
        {upVoteCount}
      </button>
      <button data-testid="downvote-btn" data-active={myDownVoteStatus ? 'true' : 'false'} onClick={downVoteButtonClickHandler}>
        {downVoteCount}
      </button>
    </div>
  ),
}));

jest.mock('@components/Community/PrimeCommunityObjectInput', () => {
  const React = jest.requireActual('react');
  return {
    PrimeCommunityObjectInput: React.forwardRef(({ primaryActionHandler }: any, _ref: any) => (
      <div data-testid="object-input">
        <button data-testid="save-comment-btn" onClick={() => primaryActionHandler?.('New comment')}>
          Save
        </button>
      </div>
    )),
  };
});

jest.mock('@components/Community/PrimeCommunityComments', () => ({
  PrimeCommunityComments: ({ deleteCommentHandler }: any) => (
    <div data-testid="comments-section">
      <button data-testid="delete-comment-btn" onClick={deleteCommentHandler}>
        Delete
      </button>
    </div>
  ),
}));

import { render, screen, fireEvent, wait } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
// Note: vote count updates use a useEffect chain; fireEvent (which wraps in act()) is needed
// to flush all cascading effects. userEvent v7 does not flush multi-step effect chains.
import '@testing-library/jest-dom';
import { IntlProvider } from 'react-intl';
import PrimeCommunityPost from '@components/Community/PrimeCommunityPost/PrimeCommunityPost';
import { UP, DOWN, UPVOTE, DOWNVOTE } from '@utils/constants';

const messages = {
  'alm.community.post.showComments': 'Show Comments',
  'alm.community.post.hideComments': 'Hide Comments',
  'alm.community.post.commentHere': 'Comment here',
  'alm.community.postPublished.label': 'Post Published',
  'alm.community.postPublished.successMessage': 'Your post has been published. It may take some time to appear on the board.',
  'alm.community.ok.label': 'Ok',
};

const makePost = (overrides: any = {}) => ({
  id: 'post-1',
  richText: 'Hello world',
  myVoteStatus: '',
  upVote: 10,
  downVote: 5,
  commentCount: 3,
  resource: null,
  ...overrides,
});

const renderPost = (props: any = {}) =>
  render(
    <IntlProvider locale="en" messages={messages}>
      <PrimeCommunityPost post={makePost()} {...props} />
    </IntlProvider>
  );

const upvoteCount = () => parseInt(screen.getByTestId('upvote-btn').textContent!);
const downvoteCount = () => parseInt(screen.getByTestId('downvote-btn').textContent!);
const upvoteActive = () => screen.getByTestId('upvote-btn').getAttribute('data-active') === 'true';
const downvoteActive = () => screen.getByTestId('downvote-btn').getAttribute('data-active') === 'true';

describe('PrimeCommunityPost', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('Initial vote state', () => {
    it('initializes upvote active and count from post when myVoteStatus is UPVOTE', () => {
      renderPost({ post: makePost({ myVoteStatus: UPVOTE, upVote: 10 }) });
      expect(upvoteActive()).toBe(true);
      expect(upvoteCount()).toBe(10);
    });

    it('initializes downvote active and count from post when myVoteStatus is DOWNVOTE', () => {
      renderPost({ post: makePost({ myVoteStatus: DOWNVOTE, downVote: 5 }) });
      expect(downvoteActive()).toBe(true);
      expect(downvoteCount()).toBe(5);
    });

    it('initializes with no active vote when myVoteStatus is absent', () => {
      renderPost({ post: makePost({ myVoteStatus: undefined }) });
      expect(upvoteActive()).toBe(false);
      expect(downvoteActive()).toBe(false);
    });
  });

  describe('Upvote', () => {
    it('calls votePost(id, UP) and increments count when not yet upvoted', () => {
      renderPost();
      expect(upvoteCount()).toBe(10);
      fireEvent.click(screen.getByTestId('upvote-btn'));
      expect(mockVotePost).toHaveBeenCalledWith('post-1', UP);
      expect(upvoteCount()).toBe(11);
      expect(upvoteActive()).toBe(true);
    });

    it('calls deletePostVote(id, UP) and decrements count when already upvoted', () => {
      renderPost({ post: makePost({ myVoteStatus: UPVOTE }) });
      expect(upvoteCount()).toBe(10);
      fireEvent.click(screen.getByTestId('upvote-btn'));
      expect(mockDeletePostVote).toHaveBeenCalledWith('post-1', UP);
      expect(upvoteCount()).toBe(9);
      expect(upvoteActive()).toBe(false);
    });

    it('clears active downvote and decrements downvote count when switching from downvote to upvote', () => {
      renderPost({ post: makePost({ myVoteStatus: DOWNVOTE, upVote: 10, downVote: 5 }) });
      expect(downvoteActive()).toBe(true);
      fireEvent.click(screen.getByTestId('upvote-btn'));
      expect(downvoteActive()).toBe(false);
      expect(downvoteCount()).toBe(4);
      expect(upvoteActive()).toBe(true);
      expect(upvoteCount()).toBe(11);
    });
  });

  describe('Downvote', () => {
    it('calls votePost(id, DOWN) and increments count when not yet downvoted', () => {
      renderPost();
      expect(downvoteCount()).toBe(5);
      fireEvent.click(screen.getByTestId('downvote-btn'));
      expect(mockVotePost).toHaveBeenCalledWith('post-1', DOWN);
      expect(downvoteCount()).toBe(6);
      expect(downvoteActive()).toBe(true);
    });

    it('calls deletePostVote(id, DOWN) and decrements count when already downvoted', () => {
      renderPost({ post: makePost({ myVoteStatus: DOWNVOTE }) });
      expect(downvoteCount()).toBe(5);
      fireEvent.click(screen.getByTestId('downvote-btn'));
      expect(mockDeletePostVote).toHaveBeenCalledWith('post-1', DOWN);
      expect(downvoteCount()).toBe(4);
      expect(downvoteActive()).toBe(false);
    });

    it('clears active upvote and decrements upvote count when switching from upvote to downvote', () => {
      renderPost({ post: makePost({ myVoteStatus: UPVOTE, upVote: 10, downVote: 5 }) });
      expect(upvoteActive()).toBe(true);
      fireEvent.click(screen.getByTestId('downvote-btn'));
      expect(upvoteActive()).toBe(false);
      expect(upvoteCount()).toBe(9);
      expect(downvoteActive()).toBe(true);
      expect(downvoteCount()).toBe(6);
    });
  });

  describe('Comments visibility', () => {
    it('shows "Show Comments (N)" and no comments section initially', () => {
      renderPost({ post: makePost({ commentCount: 3 }) });
      expect(screen.getByTestId('view-comments-btn')).toHaveTextContent('Show Comments (3)');
      expect(screen.queryByTestId('comments-section')).not.toBeInTheDocument();
    });

    it('shows comments section, fetches comments, and changes label to Hide when clicked with count > 0', () => {
      renderPost({ post: makePost({ commentCount: 3 }) });
      userEvent.click(screen.getByTestId('view-comments-btn'));
      expect(screen.getByTestId('comments-section')).toBeInTheDocument();
      expect(mockFetchComments).toHaveBeenCalledWith('post-1');
      expect(screen.getByTestId('view-comments-btn')).toHaveTextContent('Hide Comments (3)');
    });

    it('hides comments section and reverts label to Show when clicked while open', () => {
      renderPost({ post: makePost({ commentCount: 3 }) });
      userEvent.click(screen.getByTestId('view-comments-btn'));
      userEvent.click(screen.getByTestId('view-comments-btn'));
      expect(screen.queryByTestId('comments-section')).not.toBeInTheDocument();
      expect(screen.getByTestId('view-comments-btn')).toHaveTextContent('Show Comments');
    });

    it('does not show comments and does not call fetchComments when commentCount is 0', () => {
      renderPost({ post: makePost({ commentCount: 0 }) });
      userEvent.click(screen.getByTestId('view-comments-btn'));
      expect(screen.queryByTestId('comments-section')).not.toBeInTheDocument();
      expect(mockFetchComments).not.toHaveBeenCalled();
    });
  });

  describe('Add comment', () => {
    it('calls addComment and fetchComments with post id, increments count, and shows comments section', async () => {
      renderPost({ post: makePost({ commentCount: 3 }) });
      userEvent.click(screen.getByTestId('save-comment-btn'));
      await wait(() => {
        expect(mockAddComment).toHaveBeenCalledWith('post-1', 'New comment');
        expect(mockFetchComments).toHaveBeenCalledWith('post-1');
        expect(screen.getByTestId('view-comments-btn')).toHaveTextContent('Hide Comments (4)');
        expect(screen.getByTestId('comments-section')).toBeInTheDocument();
      });
    });

    it('shows comments section via save even when it was previously hidden', async () => {
      renderPost({ post: makePost({ commentCount: 3 }) });
      expect(screen.queryByTestId('comments-section')).not.toBeInTheDocument();
      userEvent.click(screen.getByTestId('save-comment-btn'));
      await wait(() => expect(screen.getByTestId('comments-section')).toBeInTheDocument());
    });
  });

  describe('Delete comment', () => {
    it('decrements commentCount when a comment is deleted', () => {
      renderPost({ post: makePost({ commentCount: 3 }) });
      userEvent.click(screen.getByTestId('view-comments-btn'));
      expect(screen.getByTestId('view-comments-btn')).toHaveTextContent('Hide Comments (3)');
      userEvent.click(screen.getByTestId('delete-comment-btn'));
      expect(screen.getByTestId('view-comments-btn')).toHaveTextContent('Hide Comments (2)');
    });

    it('hides comments section and reverts label to Show when count reaches 0', () => {
      renderPost({ post: makePost({ commentCount: 1 }) });
      fireEvent.click(screen.getByTestId('view-comments-btn'));
      fireEvent.click(screen.getByTestId('delete-comment-btn'));
      expect(screen.queryByTestId('comments-section')).not.toBeInTheDocument();
      expect(screen.getByTestId('view-comments-btn')).toHaveTextContent('Show Comments (0)');
    });
  });

  describe('Post editing', () => {
    it('calls patchPost with correct arguments when updatePostHandler fires', async () => {
      renderPost();
      userEvent.click(screen.getByTestId('object-header'));
      await wait(() =>
        expect(mockPatchPost).toHaveBeenCalledWith('post-1', 'updated text', 'DISCUSSION', null, false, null)
      );
    });

    it('shows confirmation dialog with correct messages after successful patch', async () => {
      renderPost();
      userEvent.click(screen.getByTestId('object-header'));
      await wait(() =>
        expect(mockAlmConfirmationAlert).toHaveBeenCalledWith(
          'Post Published',
          'Your post has been published. It may take some time to appear on the board.',
          'Ok',
          '',
          expect.any(Function)
        )
      );
    });
  });

  describe('Poll submission', () => {
    it('calls submitPollVote with post id and selected option index', () => {
      renderPost();
      userEvent.click(screen.getByTestId('object-body'));
      expect(mockSubmitPollVote).toHaveBeenCalledWith('post-1', 2);
    });
  });

  describe('Layout', () => {
    it('uses border wrapper class and omits hr when showBorder is true', () => {
      const { container } = renderPost({ showBorder: true });
      expect(container.querySelector('[class*="primePostWrapperWithBorder"]')).toBeInTheDocument();
      expect(container.querySelector('hr')).not.toBeInTheDocument();
    });

    it('uses plain wrapper class and renders hr when showBorder is false', () => {
      const { container } = renderPost({ showBorder: false });
      expect(container.querySelector('[class*="primePostWrapperWithBorder"]')).not.toBeInTheDocument();
      expect(container.querySelector('hr')).toBeInTheDocument();
    });
  });
});
