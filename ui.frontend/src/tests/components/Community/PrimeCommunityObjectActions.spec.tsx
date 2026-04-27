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
import PrimeCommunityObjectActions from '@components/Community/PrimeCommunityObjectActions/PrimeCommunityObjectActions';

jest.mock('@utils/inline_svg', () => ({
  SOCIAL_LIKE_SVG: () => 'UP',
  SOCIAL_LIKE_FILLED_SVG: () => 'UP-FILLED',
  SOCIAL_DISLIKE_SVG: () => 'DN',
  SOCIAL_DISLIKE_FILLED_SVG: () => 'DN-FILLED',
  DOWNLOAD_ICON: () => '',
}));

jest.mock('@utils/constants', () => ({
  COMMENT: 'comment',
  REPLY: 'reply',
}));

describe('PrimeCommunityObjectActions', () => {
  const mockViewButtonClickHandler = jest.fn();
  const mockUpVoteButtonClickHandler = jest.fn();
  const mockDownVoteButtonClickHandler = jest.fn();
  const mockActionClickHandler = jest.fn();

  const defaultProps = {
    type: 'post',
    buttonLabel: 'Comments',
    buttonCount: 5,
    upVoteCount: 10,
    downVoteCount: 2,
    myUpVoteStatus: false,
    myDownVoteStatus: false,
    viewButtonClickHandler: mockViewButtonClickHandler,
    upVoteButtonClickHandler: mockUpVoteButtonClickHandler,
    downVoteButtonClickHandler: mockDownVoteButtonClickHandler,
    actionClickHandler: mockActionClickHandler,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = (props = {}) =>
    render(
      <IntlProvider locale="en" messages={{ 'alm.community.comment.rightAnswer': 'RIGHT ANSWER' }}>
        <PrimeCommunityObjectActions {...defaultProps} {...props} />
      </IntlProvider>
    );

  it('calls viewButtonClickHandler when the view button is clicked', () => {
    renderComponent();
    userEvent.click(screen.getByText('Comments (5)'));
    expect(mockViewButtonClickHandler).toHaveBeenCalledTimes(1);
  });

  it('calls upVoteButtonClickHandler when the upvote button is clicked', () => {
    renderComponent();
    const upvoteBtn = screen.getAllByRole('button').find(b => b.textContent?.includes('UP'))!;
    userEvent.click(upvoteBtn);
    expect(mockUpVoteButtonClickHandler).toHaveBeenCalledTimes(1);
  });

  it('calls downVoteButtonClickHandler when the downvote button is clicked', () => {
    renderComponent();
    const downvoteBtn = screen.getAllByRole('button').find(b => b.textContent?.includes('DN'))!;
    userEvent.click(downvoteBtn);
    expect(mockDownVoteButtonClickHandler).toHaveBeenCalledTimes(1);
  });

  it('shows the reply button only for comment type and calls actionClickHandler on click', () => {
    renderComponent({ type: 'comment', actionLabel: 'Reply' });
    expect(screen.queryByText('Reply')).not.toBeNull();
    userEvent.click(screen.getByText('Reply'));
    expect(mockActionClickHandler).toHaveBeenCalledTimes(1);
  });

  it('does not show the reply button for non-comment type', () => {
    renderComponent({ type: 'post', actionLabel: 'Reply' });
    expect(screen.queryByText('Reply')).toBeNull();
  });

  it('hides the view button for reply type', () => {
    renderComponent({ type: 'reply' });
    expect(screen.queryByText('Comments (5)')).toBeNull();
  });

  it('shows the filled upvote icon when myUpVoteStatus is true, unfilled when false', () => {
    const { container, rerender } = renderComponent({ myUpVoteStatus: true });
    expect(container.textContent).toContain('UP-FILLED');

    rerender(
      <IntlProvider locale="en" messages={{}}>
        <PrimeCommunityObjectActions {...defaultProps} myUpVoteStatus={false} />
      </IntlProvider>
    );
    expect(container.textContent).not.toContain('UP-FILLED');
    expect(container.textContent).toContain('UP');
  });

  it('shows the filled downvote icon when myDownVoteStatus is truthy, unfilled when falsy', () => {
    const { container, rerender } = renderComponent({ myDownVoteStatus: true });
    expect(container.textContent).toContain('DN-FILLED');

    rerender(
      <IntlProvider locale="en" messages={{}}>
        <PrimeCommunityObjectActions {...defaultProps} myDownVoteStatus={false} />
      </IntlProvider>
    );
    expect(container.textContent).not.toContain('DN-FILLED');
    expect(container.textContent).toContain('DN');
  });

  it('shows the RIGHT ANSWER badge when object.id matches answerCommentId', () => {
    renderComponent({ object: { id: 'c1' }, answerCommentId: 'c1' });
    expect(screen.queryByText('RIGHT ANSWER')).not.toBeNull();
  });

  it('hides the RIGHT ANSWER badge when object.id does not match answerCommentId', () => {
    renderComponent({ object: { id: 'c1' }, answerCommentId: 'c2' });
    expect(screen.queryByText('RIGHT ANSWER')).toBeNull();
  });

  it('hides the RIGHT ANSWER badge when object is absent', () => {
    renderComponent({ object: undefined, answerCommentId: 'c1' });
    expect(screen.queryByText('RIGHT ANSWER')).toBeNull();
  });

  it('renders the translated RIGHT ANSWER label for a non-English locale', () => {
    render(
      <IntlProvider locale="fr" messages={{ 'alm.community.comment.rightAnswer': 'BONNE RÉPONSE' }}>
        <PrimeCommunityObjectActions {...defaultProps} object={{ id: 'c1' }} answerCommentId="c1" />
      </IntlProvider>
    );
    expect(screen.queryByText('BONNE RÉPONSE')).not.toBeNull();
  });
});
