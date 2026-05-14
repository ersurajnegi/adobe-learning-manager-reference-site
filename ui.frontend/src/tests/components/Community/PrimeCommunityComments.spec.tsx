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
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import PrimeCommunityComments from '@components/Community/PrimeCommunityComments/PrimeCommunityComments';

const mockUseComments = jest.fn();

jest.mock('@hooks/community', () => ({
  useComments: () => mockUseComments(),
}));

jest.mock('@common/Alert/useConfirmationAlert', () => ({
  useConfirmationAlert: () => [jest.fn()],
}));

jest.mock('@utils/social-utils', () => ({
  getAlmConfirmationBadwordParams: jest.fn(),
}));

jest.mock('@components/Community/PrimeCommunityComment', () => ({
  PrimeCommunityComment: ({ comment, updateComment, updateRightAnswerHandler, answerCommentId }: any) => (
    <div data-testid={`comment-${comment.id}`} data-is-answer={String(comment.id === answerCommentId)}>
      <button onClick={() => updateComment(comment.id, 'new text')} data-testid={`update-${comment.id}`}>
        Update
      </button>
      <button onClick={() => updateRightAnswerHandler(comment.id, true)} data-testid={`mark-answer-${comment.id}`}>
        Mark Answer
      </button>
    </div>
  ),
}));

describe('PrimeCommunityComments', () => {
  const mockLoadMoreComments = jest.fn();
  const mockPatchComment = jest.fn();
  const mockMarkCommentAsRightAnswer = jest.fn();

  const makeComment = (id: string, postId: string, isCorrectAnswer = false) => ({
    id,
    parent: { id: postId },
    isCorrectAnswer,
  });

  const defaultHookValue = {
    items: [
      makeComment('c1', 'post-123'),
      makeComment('c2', 'post-123'),
      makeComment('c3', 'post-123', true),
    ],
    loadMoreComments: mockLoadMoreComments,
    hasMoreItems: true,
    patchComment: mockPatchComment,
    markCommentAsRightAnswer: mockMarkCommentAsRightAnswer,
  };

  const defaultProps = { object: { id: 'post-123' } };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseComments.mockReturnValue(defaultHookValue);
    mockPatchComment.mockResolvedValue({});
    mockMarkCommentAsRightAnswer.mockResolvedValue({});
  });

  const renderComponent = (props = {}) =>
    render(
      <IntlProvider locale="en" messages={{ 'alm.community.showMoreComments': 'Show more comments' }}>
        <PrimeCommunityComments {...defaultProps} {...props} />
      </IntlProvider>
    );

  it('renders only comments whose parent id matches the post', () => {
    mockUseComments.mockReturnValue({
      ...defaultHookValue,
      items: [makeComment('c1', 'post-123'), makeComment('c2', 'post-456'), makeComment('c3', 'post-123')],
    });
    renderComponent();
    expect(screen.queryByTestId('comment-c1')).not.toBeNull();
    expect(screen.queryByTestId('comment-c2')).toBeNull();
    expect(screen.queryByTestId('comment-c3')).not.toBeNull();
  });

  it('shows "Show more comments" button when hasMoreItems is true', () => {
    renderComponent();
    expect(screen.queryByText('Show more comments')).not.toBeNull();
  });

  it('hides "Show more comments" button when hasMoreItems is false', () => {
    mockUseComments.mockReturnValue({ ...defaultHookValue, hasMoreItems: false });
    renderComponent();
    expect(screen.queryByText('Show more comments')).toBeNull();
  });

  it('calls loadMoreComments when "Show more comments" is clicked', () => {
    renderComponent();
    userEvent.click(screen.getByText('Show more comments'));
    expect(mockLoadMoreComments).toHaveBeenCalledTimes(1);
  });

  it('passes answerCommentId from the isCorrectAnswer comment on mount', () => {
    renderComponent();
    expect(screen.getByTestId('comment-c3').getAttribute('data-is-answer')).toBe('true');
    expect(screen.getByTestId('comment-c1').getAttribute('data-is-answer')).toBe('false');
  });

  it('sets answerCommentId to empty when no comment has isCorrectAnswer', () => {
    mockUseComments.mockReturnValue({
      ...defaultHookValue,
      items: [makeComment('c1', 'post-123'), makeComment('c2', 'post-123')],
    });
    renderComponent();
    expect(screen.getByTestId('comment-c1').getAttribute('data-is-answer')).toBe('false');
    expect(screen.getByTestId('comment-c2').getAttribute('data-is-answer')).toBe('false');
  });

  it('calls markCommentAsRightAnswer and updates answerCommentId on "Mark Answer" click', async () => {
    renderComponent();
    userEvent.click(screen.getByTestId('mark-answer-c1'));
    expect(mockMarkCommentAsRightAnswer).toHaveBeenCalledWith('c1', true);
    await waitFor(() => {
      expect(screen.getByTestId('comment-c1').getAttribute('data-is-answer')).toBe('true');
      expect(screen.getByTestId('comment-c3').getAttribute('data-is-answer')).toBe('false');
    });
  });

  it('logs an error when markCommentAsRightAnswer rejects', async () => {
    mockMarkCommentAsRightAnswer.mockRejectedValue(new Error('network error'));
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    renderComponent();
    userEvent.click(screen.getByTestId('mark-answer-c1'));
    await waitFor(() => expect(consoleSpy).toHaveBeenCalledWith('error while updating comment'));
    consoleSpy.mockRestore();
  });

  it('calls patchComment with the comment id and new value when updateComment is triggered', async () => {
    renderComponent();
    userEvent.click(screen.getByTestId('update-c1'));
    await waitFor(() => expect(mockPatchComment).toHaveBeenCalledWith('c1', 'new text'));
  });

  it('renders translated "Show more comments" for a non-English locale', () => {
    render(
      <IntlProvider locale="fr" messages={{ 'alm.community.showMoreComments': 'Voir plus de commentaires' }}>
        <PrimeCommunityComments {...defaultProps} />
      </IntlProvider>
    );
    expect(screen.queryByText('Voir plus de commentaires')).not.toBeNull();
  });

  it('falls back to defaultMessage when translation is missing', () => {
    render(
      <IntlProvider locale="en" messages={{}}>
        <PrimeCommunityComments {...defaultProps} />
      </IntlProvider>
    );
    expect(screen.queryByText('Show more comments')).not.toBeNull();
  });
});
