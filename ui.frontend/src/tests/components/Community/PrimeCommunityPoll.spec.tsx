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
jest.mock('react-intl', () => {
  const actual = jest.requireActual('react-intl');
  return {
    ...actual,
    useIntl: () => ({
      formatMessage: ({ defaultMessage }: any) => defaultMessage,
    }),
  };
});

import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { IntlProvider } from 'react-intl';
import PrimeCommunityPoll from '@components/Community/PrimeCommunityPoll/PrimeCommunityPoll';

const messages = {
  'alm.community.post.poll.voteLabel': 'vote',
  'alm.community.post.poll.submitChoice': 'Submit Choice',
  'alm.community.post.poll.submittedChoice': 'You have submitted your choice',
};

const pollOptions = [{ text: 'Option A' }, { text: 'Option B' }, { text: 'Option C' }];

// stats: A=10, B=20, C=15 → total 45 → 22.22%, 44.44%, 33.33%
const STATS_JSON = JSON.stringify({ '1': 10, '2': 20, '3': 15 });

const makePost = (overrides: any = {}) => ({
  id: 'p1',
  otherData: JSON.stringify(pollOptions),
  myPoll: undefined,
  pollStats: undefined,
  ...overrides,
});

const renderPoll = (props: any = {}) =>
  render(
    <IntlProvider locale="en" messages={messages}>
      <PrimeCommunityPoll post={makePost()} submitPoll={jest.fn()} {...props} />
    </IntlProvider>
  );

describe('PrimeCommunityPoll', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('Initial rendering', () => {
    it('renders one radio button per poll option', () => {
      renderPoll();
      expect(screen.getAllByRole('radio')).toHaveLength(3);
    });

    it('radio buttons are enabled before any vote', () => {
      renderPoll();
      screen.getAllByRole('radio').forEach(r => expect(r).not.toBeDisabled());
    });

    it('submit button is not shown before any option is selected', () => {
      renderPoll();
      expect(screen.queryByText('Submit Choice')).not.toBeInTheDocument();
    });

    it('"submitted" message is not shown before any vote', () => {
      renderPoll();
      expect(screen.queryByText('You have submitted your choice')).not.toBeInTheDocument();
    });
  });

  describe('Option selection', () => {
    it('shows submit button after selecting an option', () => {
      renderPoll();
      fireEvent.click(screen.getByDisplayValue('Option A'));
      expect(screen.getByText('Submit Choice')).toBeInTheDocument();
    });

    it('submit button remains visible when switching between options', () => {
      renderPoll();
      fireEvent.click(screen.getByDisplayValue('Option A'));
      fireEvent.click(screen.getByDisplayValue('Option B'));
      expect(screen.getByText('Submit Choice')).toBeInTheDocument();
    });
  });

  describe('Submission', () => {
    it('calls submitPoll with 1-based index of selected option', () => {
      const submitPoll = jest.fn();
      renderPoll({ submitPoll });
      fireEvent.click(screen.getByDisplayValue('Option A'));
      fireEvent.click(screen.getByText('Submit Choice'));
      expect(submitPoll).toHaveBeenCalledWith(1);
    });

    it('calls submitPoll with correct index for option 2', () => {
      const submitPoll = jest.fn();
      renderPoll({ submitPoll });
      fireEvent.click(screen.getByDisplayValue('Option B'));
      fireEvent.click(screen.getByText('Submit Choice'));
      expect(submitPoll).toHaveBeenCalledWith(2);
    });

    it('hides submit button and shows "submitted" message after submission', () => {
      renderPoll();
      fireEvent.click(screen.getByDisplayValue('Option A'));
      fireEvent.click(screen.getByText('Submit Choice'));
      expect(screen.queryByText('Submit Choice')).not.toBeInTheDocument();
      expect(screen.getByText('You have submitted your choice')).toBeInTheDocument();
    });

    it('disables all radio buttons after submission', () => {
      renderPoll();
      fireEvent.click(screen.getByDisplayValue('Option A'));
      fireEvent.click(screen.getByText('Submit Choice'));
      screen.getAllByRole('radio').forEach(r => expect(r).toBeDisabled());
    });

    it('does not call submitPoll or mark voted when submitPoll is not a function', () => {
      renderPoll({ submitPoll: undefined });
      fireEvent.click(screen.getByDisplayValue('Option A'));
      fireEvent.click(screen.getByText('Submit Choice'));
      // alreadyVoted stays false, so radios stay enabled and message not shown
      expect(screen.queryByText('You have submitted your choice')).not.toBeInTheDocument();
      screen.getAllByRole('radio').forEach(r => expect(r).not.toBeDisabled());
    });

    it('shows correct vote count for chosen option after submission with no prior stats', () => {
      renderPoll();
      fireEvent.click(screen.getByDisplayValue('Option A'));
      fireEvent.click(screen.getByText('Submit Choice'));
      // 1 vote total → 100% for Option A
      expect(screen.getByText(/100%/)).toBeInTheDocument();
      expect(screen.getByText(/1.*vote/)).toBeInTheDocument();
    });

    it('increments existing vote count and recalculates percentages when stats were pre-loaded', () => {
      // Stats loaded on mount: A=10, B=20, C=15 → total 45
      const stats = JSON.stringify({ '1': 10, '2': 20, '3': 15 });
      renderPoll({ post: makePost({ pollStats: stats }) });
      // User selects Option B and submits → B becomes 21, total becomes 46
      fireEvent.click(screen.getByDisplayValue('Option B'));
      fireEvent.click(screen.getByText('Submit Choice'));
      // Option B: 21/46 = 45.65% — assert both % and count in the same stat element
      expect(screen.getByText(/45\.65%.*\(21\s/)).toBeInTheDocument();
    });

    it('sets count to 1 (not NaN+1) when submitting for an option with no prior votes in loaded stats', () => {
      // Only Option A has prior votes (9). Options B and C have no entry → sparse undefined slots.
      const stats = JSON.stringify({ '1': 9 });
      renderPoll({ post: makePost({ pollStats: stats }) });
      // User selects Option C (index 3, undefined in loaded stats) → isNaN(undefined) → sets to 1
      fireEvent.click(screen.getByDisplayValue('Option C'));
      fireEvent.click(screen.getByText('Submit Choice'));
      // total becomes 10: A=9 (90%), C=1 (10%)
      expect(screen.getByText(/10%/)).toBeInTheDocument();
      expect(screen.getByText(/1.*vote/)).toBeInTheDocument();
      expect(screen.getByText(/90%/)).toBeInTheDocument();
    });
  });

  describe('Pre-voted state (myPoll set on mount)', () => {
    it('disables all radio buttons when already voted', () => {
      renderPoll({ post: makePost({ myPoll: { optionId: '2' }, pollStats: STATS_JSON }) });
      screen.getAllByRole('radio').forEach(r => expect(r).toBeDisabled());
    });

    it('shows "submitted" message when already voted', () => {
      renderPoll({ post: makePost({ myPoll: { optionId: '1' }, pollStats: STATS_JSON }) });
      expect(screen.getByText('You have submitted your choice')).toBeInTheDocument();
    });

    it('does not show submit button when already voted', () => {
      renderPoll({ post: makePost({ myPoll: { optionId: '1' }, pollStats: STATS_JSON }) });
      expect(screen.queryByText('Submit Choice')).not.toBeInTheDocument();
    });
  });

  describe('Poll stats display', () => {
    it('does not show vote stats when user has not voted, even if pollStats exists', () => {
      renderPoll({ post: makePost({ pollStats: STATS_JSON }) });
      expect(screen.queryByText(/vote/)).not.toBeInTheDocument();
    });

    it('shows vote percentages and counts once voted', () => {
      renderPoll({ post: makePost({ myPoll: { optionId: '1' }, pollStats: STATS_JSON }) });
      // 10/45 = 22.22%, 20/45 = 44.44%, 15/45 = 33.33%
      expect(screen.getByText(/22\.22%/)).toBeInTheDocument();
      expect(screen.getByText(/44\.44%/)).toBeInTheDocument();
      expect(screen.getByText(/33\.33%/)).toBeInTheDocument();
      expect(screen.getByText(/10.*vote/)).toBeInTheDocument();
      expect(screen.getByText(/20.*vote/)).toBeInTheDocument();
      expect(screen.getByText(/15.*vote/)).toBeInTheDocument();
    });

    it('formats whole-number percentages without trailing .00', () => {
      // 50/100 each → exactly 50%
      const stats = JSON.stringify({ '1': 50, '2': 50 });
      renderPoll({ post: makePost({ myPoll: { optionId: '1' }, pollStats: stats }) });
      expect(screen.queryByText(/50\.00%/)).not.toBeInTheDocument();
      expect(screen.getAllByText(/^50%/)).toHaveLength(2);
    });

    it('truncates fractional percentages to 2 decimal places', () => {
      // 1/7 = 14.285... → shown as 14.28%, not 14.29%
      const stats = JSON.stringify({ '1': 1, '2': 2, '3': 4 });
      renderPoll({ post: makePost({ myPoll: { optionId: '1' }, pollStats: stats }) });
      expect(screen.getByText(/14\.28%/)).toBeInTheDocument();
      expect(screen.queryByText(/14\.29%/)).not.toBeInTheDocument();
    });

    it('shows no stats for options with zero votes (missing from pollStats)', () => {
      // Only option 1 has votes
      const stats = JSON.stringify({ '1': 5 });
      renderPoll({ post: makePost({ myPoll: { optionId: '1' }, pollStats: stats }) });
      expect(screen.getByText(/5.*vote/)).toBeInTheDocument();
      // Options 2 and 3 have no vote entry → their stat rows are not rendered
      expect(screen.queryAllByText(/vote/)).toHaveLength(1);
    });
  });
});
