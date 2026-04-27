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
jest.mock('@utils/global', () => ({
  getALMUser: jest.fn(),
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

import { render, screen, fireEvent, wait } from '@testing-library/react';
import '@testing-library/jest-dom';
import { IntlProvider } from 'react-intl';
import PrimeCommunityObjectOptions from '@components/Community/PrimeCommunityObjectOptions/PrimeCommunityObjectOptions';
import { getALMUser } from '@utils/global';
import { QUESTION } from '@utils/constants';

const mockGetALMUser = getALMUser as jest.MockedFunction<typeof getALMUser>;

const OWNER_ID = 'user-1';
const OTHER_ID = 'user-2';

const messages = {
  'alm.community.board.edit': 'Edit',
  'alm.text.delete': 'Delete',
  'alm.community.board.report': 'Report',
  'alm.community.board.markAsRightAnswer': 'Mark as Right answer',
  'alm.community.board.unmarkAsRightAnswer': 'Unmark as Right answer',
};

// Default: owner, QUESTION-type parent, object.id matches answerCommentId, no poll vote
const defaultProps = {
  object: { id: 'post-1', createdBy: { id: OWNER_ID }, myPoll: undefined },
  parentPost: { postingType: QUESTION },
  answerCommentId: 'post-1',
  toggleOptions: jest.fn(),
  deleteHandler: jest.fn(),
  reportAbuseHandler: jest.fn(),
  editHandler: jest.fn(),
  updateRightAnswerHandler: jest.fn(),
};

const renderComponent = (props: any = {}) =>
  render(
    <IntlProvider locale="en" messages={messages}>
      <PrimeCommunityObjectOptions {...defaultProps} {...props} />
    </IntlProvider>
  );

describe('PrimeCommunityObjectOptions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetALMUser.mockResolvedValue({ user: { id: OWNER_ID } } as any);
  });

  describe('Report option', () => {
    it('is always rendered, regardless of ownership', () => {
      renderComponent();
      expect(screen.getByText('Report')).toBeInTheDocument();
    });

    it('is rendered for non-owners too', async () => {
      renderComponent({ object: { id: 'post-1', createdBy: { id: OTHER_ID } } });
      await wait(() => expect(mockGetALMUser).toHaveBeenCalled());
      expect(screen.getByText('Report')).toBeInTheDocument();
    });

    it('calls reportAbuseHandler on click', () => {
      const reportAbuseHandler = jest.fn();
      renderComponent({ reportAbuseHandler });
      fireEvent.click(screen.getByText('Report'));
      expect(reportAbuseHandler).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edit option', () => {
    it('shown when user is the post owner and no poll vote submitted', async () => {
      renderComponent();
      await wait(() => expect(screen.getByText('Edit')).toBeInTheDocument());
    });

    it('hidden when user is not the post owner', async () => {
      renderComponent({ object: { id: 'post-1', createdBy: { id: OTHER_ID }, myPoll: undefined } });
      await wait(() => expect(mockGetALMUser).toHaveBeenCalled());
      expect(screen.queryByText('Edit')).not.toBeInTheDocument();
    });

    it('hidden when a poll vote has been submitted (myPoll has keys)', async () => {
      renderComponent({ object: { id: 'post-1', createdBy: { id: OWNER_ID }, myPoll: { vote: 'yes' } } });
      await wait(() => expect(mockGetALMUser).toHaveBeenCalled());
      expect(screen.queryByText('Edit')).not.toBeInTheDocument();
    });

    it('shown when myPoll is an empty object (no vote submitted yet)', async () => {
      renderComponent({ object: { id: 'post-1', createdBy: { id: OWNER_ID }, myPoll: {} } });
      await wait(() => expect(screen.getByText('Edit')).toBeInTheDocument());
    });

    it('calls editHandler on click', async () => {
      const editHandler = jest.fn();
      renderComponent({ editHandler });
      await wait(() => expect(screen.getByText('Edit')).toBeInTheDocument());
      fireEvent.click(screen.getByText('Edit'));
      expect(editHandler).toHaveBeenCalledTimes(1);
    });
  });

  describe('Delete option', () => {
    it('shown when user is the post owner', async () => {
      renderComponent();
      await wait(() => expect(screen.getByText('Delete')).toBeInTheDocument());
    });

    it('hidden when user is not the post owner', async () => {
      renderComponent({ object: { id: 'post-1', createdBy: { id: OTHER_ID } } });
      await wait(() => expect(mockGetALMUser).toHaveBeenCalled());
      expect(screen.queryByText('Delete')).not.toBeInTheDocument();
    });

    it('shown even when a poll vote has been submitted', async () => {
      renderComponent({ object: { id: 'post-1', createdBy: { id: OWNER_ID }, myPoll: { vote: 'yes' } } });
      await wait(() => expect(screen.getByText('Delete')).toBeInTheDocument());
    });

    it('calls deleteHandler on click', async () => {
      const deleteHandler = jest.fn();
      renderComponent({ deleteHandler });
      await wait(() => expect(screen.getByText('Delete')).toBeInTheDocument());
      fireEvent.click(screen.getByText('Delete'));
      expect(deleteHandler).toHaveBeenCalledTimes(1);
    });
  });

  describe('Poll options (Mark / Unmark as Right answer)', () => {
    it('shown when owner, parentPost is QUESTION type, and object.id matches answerCommentId', async () => {
      renderComponent();
      await wait(() => expect(screen.getByText('Mark as Right answer')).toBeInTheDocument());
      expect(screen.getByText('Unmark as Right answer')).toBeInTheDocument();
    });

    it('hidden when user is not the owner', async () => {
      renderComponent({ object: { id: 'post-1', createdBy: { id: OTHER_ID } } });
      await wait(() => expect(mockGetALMUser).toHaveBeenCalled());
      expect(screen.queryByText('Mark as Right answer')).not.toBeInTheDocument();
    });

    it('hidden when parentPost is absent', async () => {
      renderComponent({ parentPost: undefined });
      await wait(() => expect(mockGetALMUser).toHaveBeenCalled());
      expect(screen.queryByText('Mark as Right answer')).not.toBeInTheDocument();
    });

    it('hidden when parentPost.postingType is not QUESTION', async () => {
      renderComponent({ parentPost: { postingType: 'DISCUSSION' } });
      await wait(() => expect(mockGetALMUser).toHaveBeenCalled());
      expect(screen.queryByText('Mark as Right answer')).not.toBeInTheDocument();
    });

    it('hidden when object.id does not match answerCommentId', async () => {
      renderComponent({ answerCommentId: 'different-id' });
      await wait(() => expect(mockGetALMUser).toHaveBeenCalled());
      expect(screen.queryByText('Mark as Right answer')).not.toBeInTheDocument();
    });

    it('calls updateRightAnswerHandler(true) when Mark is clicked', async () => {
      const updateRightAnswerHandler = jest.fn();
      renderComponent({ updateRightAnswerHandler });
      await wait(() => expect(screen.getByText('Mark as Right answer')).toBeInTheDocument());
      fireEvent.click(screen.getByText('Mark as Right answer'));
      expect(updateRightAnswerHandler).toHaveBeenCalledWith(true);
    });

    it('calls updateRightAnswerHandler(false) when Unmark is clicked', async () => {
      const updateRightAnswerHandler = jest.fn();
      renderComponent({ updateRightAnswerHandler });
      await wait(() => expect(screen.getByText('Unmark as Right answer')).toBeInTheDocument());
      fireEvent.click(screen.getByText('Unmark as Right answer'));
      expect(updateRightAnswerHandler).toHaveBeenCalledWith(false);
    });
  });

  describe('Separator', () => {
    it('shown when Edit option is visible', async () => {
      // Owner, no poll vote, non-QUESTION parent (poll options hidden so only Edit triggers separator)
      const { container } = renderComponent({ parentPost: { postingType: 'DISCUSSION' } });
      await wait(() => expect(screen.getByText('Edit')).toBeInTheDocument());
      expect(container.querySelector('.primeSeperator')).toBeInTheDocument();
    });

    it('shown when poll options are visible', async () => {
      // Owner with poll vote submitted: Edit hidden, poll options still shown
      const { container } = renderComponent({
        object: { id: 'post-1', createdBy: { id: OWNER_ID }, myPoll: { vote: 'yes' } },
      });
      await wait(() => expect(screen.getByText('Mark as Right answer')).toBeInTheDocument());
      expect(container.querySelector('.primeSeperator')).toBeInTheDocument();
    });

    it('hidden when neither Edit nor poll options are visible', async () => {
      // Non-owner, non-QUESTION post
      const { container } = renderComponent({
        object: { id: 'post-1', createdBy: { id: OTHER_ID } },
        parentPost: { postingType: 'DISCUSSION' },
      });
      await wait(() => expect(mockGetALMUser).toHaveBeenCalled());
      expect(container.querySelector('.primeSeperator')).not.toBeInTheDocument();
    });
  });

  describe('Click outside behavior', () => {
    it('calls toggleOptions when clicking outside the menu', () => {
      const toggleOptions = jest.fn();
      renderComponent({ toggleOptions });
      fireEvent.click(document.body);
      expect(toggleOptions).toHaveBeenCalledTimes(1);
    });

    it('does not call toggleOptions when clicking inside the menu', () => {
      const toggleOptions = jest.fn();
      const { container } = renderComponent({ toggleOptions });
      fireEvent.click(container.querySelector('.primeObjectOptionsList')!);
      expect(toggleOptions).not.toHaveBeenCalled();
    });
  });

  describe('User fetch', () => {
    it('calls getALMUser once on mount', () => {
      renderComponent();
      expect(mockGetALMUser).toHaveBeenCalledTimes(1);
    });

    it('does not call getALMUser again on rerender', () => {
      const { rerender } = renderComponent();
      rerender(
        <IntlProvider locale="en" messages={messages}>
          <PrimeCommunityObjectOptions {...defaultProps} />
        </IntlProvider>
      );
      expect(mockGetALMUser).toHaveBeenCalledTimes(1);
    });
  });
});
