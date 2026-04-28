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
import { render, screen, fireEvent } from '@testing-library/react';
import { waitFor } from '@testing-library/dom';
import '@testing-library/jest-dom';
import PrimeDiscussionItem from '@components/TrainingOverview/PrimeDiscussionItem/PrimeDiscussionItem';
import { PrimeLearningObject, PrimeDiscussionPost } from '@models/PrimeModels';
import { useUserContext } from '@contextProviders/userContextProvider';
import { modifyTimeFor24hourCycle } from '@utils/dateTime';

jest.mock('react-intl', () => ({
  useIntl: () => ({
    formatMessage: ({ id }: any) => {
      const map: Record<string, string> = {
        'alm.text.unknown': 'Unknown',
        'alm.text.deleteComment': 'Delete comment',
      };
      return map[id] ?? id;
    },
  }),
}));

jest.mock('@contextProviders/userContextProvider', () => ({
  useUserContext: jest.fn(),
}));

jest.mock('@spectrum-icons/workflow/DeleteOutline', () => ({
  __esModule: true,
  default: () => <span data-testid="delete-icon" />,
}));

jest.mock('@utils/dateTime', () => ({
  modifyTimeFor24hourCycle: jest.fn(),
}));

jest.mock('@components/Common/ALMImage', () => ({
  ALMImage: ({ src }: any) => <img data-testid="alm-image" src={src} />,
}));

const DEFAULT_USER_AVATAR =
  'https://cpcontents.adobe.com/public/images/default_user_avatar.svg';

const mockUser = {
  id: 'user123',
  name: 'John Doe',
  uiLocale: 'en-US',
  roles: [] as string[],
};

const mockTraining: PrimeLearningObject = {
  id: 'course123',
  loType: 'course',
  localizedMetadata: [],
} as any;

const mockDiscussion: PrimeDiscussionPost = {
  id: 'discussion123',
  comment: 'This is a great course!',
  dateCreated: Date.now(),
  learner: {
    id: 'learner456',
    name: 'Jane Smith',
    avatarUrl: 'https://example.com/avatar.jpg',
  },
} as any;

const mockDeleteDiscussion = jest.fn();

const defaultProps = {
  training: mockTraining,
  discussion: mockDiscussion,
  deleteDiscussion: mockDeleteDiscussion,
};

// Discussion authored by the logged-in user — used in delete interaction tests.
const ownDiscussion = {
  ...mockDiscussion,
  learner: { ...mockDiscussion.learner!, id: mockUser.id },
};

describe('PrimeDiscussionItem', () => {
  beforeEach(() => {
    // resetMocks:true clears jest.fn() implementations; restore them here.
    (useUserContext as jest.Mock).mockReturnValue({ user: mockUser });
    (modifyTimeFor24hourCycle as jest.Mock).mockReturnValue('January 31, 2026');
    mockDeleteDiscussion.mockResolvedValue(undefined);
  });

  it('comment_rendered', () => {
    render(<PrimeDiscussionItem {...defaultProps} />);
    screen.getByText('This is a great course!');
  });

  it('learnerName_rendered', () => {
    render(<PrimeDiscussionItem {...defaultProps} />);
    screen.getByText('Jane Smith');
  });

  it('avatar_withUrl_rendersProvidedSrc', () => {
    render(<PrimeDiscussionItem {...defaultProps} />);
    expect(screen.getByTestId('alm-image').getAttribute('src')).toBe(
      'https://example.com/avatar.jpg'
    );
  });

  it('avatar_noUrl_rendersDefaultAvatar', () => {
    const discussion = {
      ...mockDiscussion,
      learner: { ...mockDiscussion.learner!, avatarUrl: undefined },
    };
    render(<PrimeDiscussionItem {...defaultProps} discussion={discussion as any} />);
    expect(screen.getByTestId('alm-image').getAttribute('src')).toBe(DEFAULT_USER_AVATAR);
  });

  it('learner_null_rendersUnknownNameAndDefaultAvatar', () => {
    const discussion = { ...mockDiscussion, learner: undefined };
    render(<PrimeDiscussionItem {...defaultProps} discussion={discussion as any} />);
    screen.getByText('Unknown');
    expect(screen.getByTestId('alm-image').getAttribute('src')).toBe(DEFAULT_USER_AVATAR);
  });

  it('timestamp_passesDateAndUiLocaleToFormatter', () => {
    render(<PrimeDiscussionItem {...defaultProps} />);
    expect(modifyTimeFor24hourCycle as jest.Mock).toHaveBeenCalledWith(
      mockDiscussion.dateCreated,
      'en-US'
    );
  });

  it('timestamp_undefinedUiLocale_fallsBackToEnglishLocale', () => {
    (useUserContext as jest.Mock).mockReturnValue({
      user: { ...mockUser, uiLocale: undefined },
    });
    render(<PrimeDiscussionItem {...defaultProps} />);
    expect(modifyTimeFor24hourCycle as jest.Mock).toHaveBeenCalledWith(
      mockDiscussion.dateCreated,
      'en-US'
    );
  });

  describe('delete button visibility', () => {
    it('deleteButton_owner_visible', () => {
      render(<PrimeDiscussionItem {...defaultProps} discussion={ownDiscussion as any} />);
      screen.getByTestId('delete-icon');
    });

    // Admin with a different user ID than the learner can still delete.
    it('deleteButton_admin_visible', () => {
      (useUserContext as jest.Mock).mockReturnValue({
        user: { id: 'admin123', roles: ['Admin'], uiLocale: 'en-US' },
      });
      render(<PrimeDiscussionItem {...defaultProps} />);
      screen.getByTestId('delete-icon');
    });

    it('deleteButton_nonOwnerNonAdmin_hidden', () => {
      render(<PrimeDiscussionItem {...defaultProps} />);
      expect(screen.queryByTestId('delete-icon')).toBeNull();
    });

    // user?.roles?.includes() must not throw when roles is undefined.
    it('deleteButton_undefinedRoles_hidden', () => {
      (useUserContext as jest.Mock).mockReturnValue({
        user: { id: 'other', roles: undefined, uiLocale: 'en-US' },
      });
      render(<PrimeDiscussionItem {...defaultProps} />);
      expect(screen.queryByTestId('delete-icon')).toBeNull();
    });
  });

  describe('delete interaction', () => {
    it('deleteButton_clicked_callsDeleteWithTrainingIdAndDiscussionId', async () => {
      render(<PrimeDiscussionItem {...defaultProps} discussion={ownDiscussion as any} />);

      fireEvent.click(screen.getByRole('button', { name: 'Delete comment' }));

      await waitFor(() =>
        expect(mockDeleteDiscussion).toHaveBeenCalledWith('course123', 'discussion123')
      );
    });

    it('deleteButton_whileDeleting_secondClickIgnored', () => {
      // Never-resolving promise keeps isDeleting=true.
      mockDeleteDiscussion.mockReturnValue(new Promise(() => {}));
      render(<PrimeDiscussionItem {...defaultProps} discussion={ownDiscussion as any} />);

      const btn = screen.getByRole('button', { name: 'Delete comment' });
      fireEvent.click(btn);
      fireEvent.click(btn);

      expect(mockDeleteDiscussion).toHaveBeenCalledTimes(1);
    });

    it('deleteError_finally_resetsIsDeleteingAllowingRetry', async () => {
      mockDeleteDiscussion
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue(undefined);
      render(<PrimeDiscussionItem {...defaultProps} discussion={ownDiscussion as any} />);

      const btn = screen.getByRole('button', { name: 'Delete comment' });
      fireEvent.click(btn);

      // The finally block resets isDeleting, re-enabling the button.
      await waitFor(() => expect(btn).not.toBeDisabled());

      fireEvent.click(btn);
      await waitFor(() => expect(mockDeleteDiscussion).toHaveBeenCalledTimes(2));
    });
  });
});
