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
// Mock modules FIRST before any imports
jest.mock('@utils/global', () => ({
  getALMConfig: () => ({
    accountId: 'test-account-id',
    baseUrl: 'https://test.example.com',
    locale: 'en-US',
    accessToken: 'test-access-token',
    csrfToken: 'test-csrf-token',
    commerceURL: 'https://test.example.com/commerce',
    graphqlProxyPath: 'https://test.example.com/graphql',
    almBaseURL: 'https://test.example.com',
    primeApiURL: 'https://test.example.com/primeapi/v2',
    themeData: {
      name: 'Prime Default',
    },
  }),
  getALMObject: () => ({
    getALMConfig: () => ({
      accountId: 'test-account-id',
      baseUrl: 'https://test.example.com',
      locale: 'en-US',
      accessToken: 'test-access-token',
      csrfToken: 'test-csrf-token',
    }),
  }),
  getAuthKey: () => 'csrf_token=test-csrf-token',
  getWindowObject: () => ({
    ALM: {
      getALMConfig: () => ({
        accountId: 'test-account-id',
        baseUrl: 'https://test.example.com',
        locale: 'en-US',
        accessToken: 'test-access-token',
        csrfToken: 'test-csrf-token',
      }),
    },
  }),
}));

jest.mock('@components/Community/PrimeCommunityObjectOptions', () => ({
  __esModule: true,
  PrimeCommunityObjectOptions: (props: any) => {
    const { toggleOptions, editHandler, deleteHandler, reportAbuseHandler, updateRightAnswerHandler } = props;
    return (
      <div data-testid="community-object-options">
        <button data-testid="edit-button" onClick={editHandler}>Edit</button>
        <button data-testid="delete-button" onClick={deleteHandler}>Delete</button>
        <button data-testid="report-button" onClick={reportAbuseHandler}>Report</button>
        <button data-testid="toggle-button" onClick={toggleOptions}>Toggle</button>
        {updateRightAnswerHandler && typeof updateRightAnswerHandler === 'function' && (
          <button data-testid="right-answer-button" onClick={() => updateRightAnswerHandler('answer:1')}>
            Mark Right Answer
          </button>
        )}
      </div>
    );
  },
}));

jest.mock('@components/Community/PrimeCommunityAddPostDialogTrigger', () => ({
  __esModule: true,
  PrimeCommunityAddPostDialogTrigger: (props: any) => {
    const { openDialog, post, description, mode, savePostHandler, closeDialogHandler } = props;
    return openDialog ? (
      <div data-testid="update-post-dialog">
        <div data-testid="dialog-post-id">{post?.id}</div>
        <div data-testid="dialog-description">{description}</div>
        <div data-testid="dialog-mode">{mode}</div>
        <button
          data-testid="save-post-button"
          onClick={() => savePostHandler && savePostHandler('updated', 'POST', null, false, [])}
        >
          Save
        </button>
        <button data-testid="close-dialog-button" onClick={closeDialogHandler}>Close</button>
      </div>
    ) : null;
  },
}));

jest.mock('@utils/inline_svg', () => ({
  SOCIAL_MORE_OPTIONS_SVG: () => '<svg data-testid="more-options-icon">More Options</svg>',
}));

jest.mock('@utils/dateTime', () => ({
  GetFormattedDate: (date: string, locale: string) => {
    if (!date || date === 'invalid') return 'Invalid Date';
    return `Formatted: ${date} (${locale})`;
  },
}));

const mockDeletePostFromServer = jest.fn();
const mockReportPostAbuse = jest.fn();
const mockDeleteCommentFromServer = jest.fn();
const mockReportCommentAbuse = jest.fn();
const mockDeleteReplyFromServer = jest.fn();
const mockReportReplyAbuse = jest.fn();
const mockAlmConfirmationAlert = jest.fn();

jest.mock('@hooks/community', () => ({
  useCommunityObjectOptions: () => ({
    deletePostFromServer: mockDeletePostFromServer,
    reportPostAbuse: mockReportPostAbuse,
    deleteCommentFromServer: mockDeleteCommentFromServer,
    reportCommentAbuse: mockReportCommentAbuse,
    deleteReplyFromServer: mockDeleteReplyFromServer,
    reportReplyAbuse: mockReportReplyAbuse,
  }),
}));

jest.mock('@common/Alert/useConfirmationAlert', () => ({
  useConfirmationAlert: () => [mockAlmConfirmationAlert],
}));

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { IntlProvider } from 'react-intl';
import PrimeCommunityObjectHeader from '@components/Community/PrimeCommunityObjectHeader/PrimeCommunityObjectHeader';

const POST = 'post';
const COMMENT = 'comment';
const REPLY = 'reply';

const defaultMessages = {
  'alm.community.post.deleteConfirmation': 'Are you sure you want to delete this post?',
  'alm.community.comment.deleteConfirmation': 'Are you sure you want to delete this comment?',
  'alm.community.reply.deleteConfirmation': 'Are you sure you want to delete this reply?',
  'alm.community.post.reportConfirmation': 'Are you sure you want to report this post?',
  'alm.community.comment.reportConfirmation': 'Are you sure you want to report this comment?',
  'alm.community.reply.reportConfirmation': 'Are you sure you want to report this reply?',
  'alm.community.board.confirmationRequired': 'Confirmation Required',
  'alm.overview.button.continue': 'Continue',
  'alm.community.cancel.label': 'Cancel',
};

const renderComponent = (props: any, locale = 'en') => {
  return render(
    <IntlProvider locale={locale} messages={defaultMessages}>
      <PrimeCommunityObjectHeader {...props} />
    </IntlProvider>
  );
};

const mockObject = {
  id: 'post:123',
  createdBy: {
    name: 'John Doe',
    avatarUrl: 'https://example.com/avatar.jpg',
  },
  dateCreated: '2024-01-07T12:00:00Z',
};

// Extracts the confirmation callback passed to almConfirmationAlert
const getLastConfirmCallback = () => {
  const lastCallArgs = mockAlmConfirmationAlert.mock.lastCall as any[];
  return lastCallArgs[4] as Function;
};

// Opens the options dropdown
const openOptions = (container: HTMLElement) => {
  userEvent.click(container.querySelector('.primeCommunityOptionsIcon') as HTMLElement);
};

describe('PrimeCommunityObjectHeader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render avatar with correct src and aria-hidden', () => {
      const { container } = renderComponent({ type: POST, object: mockObject });
      const avatar = container.querySelector('img[alt="user-image"]') as HTMLImageElement;
      expect(avatar.getAttribute('src')).toBe('https://example.com/avatar.jpg');
      expect(avatar.getAttribute('aria-hidden')).toBe('true');
    });

    it('should render user name', () => {
      const { container } = renderComponent({ type: POST, object: mockObject });
      expect(container.querySelector('.primePostOwnerName')?.textContent).toBe('John Doe');
    });

    it('should render formatted date using locale from IntlProvider', () => {
      const { container } = renderComponent({ type: POST, object: mockObject });
      expect(container.querySelector('.primePostDateCreated')?.textContent).toContain(
        'Formatted: 2024-01-07T12:00:00Z (en)'
      );
    });

    it('should pass locale to GetFormattedDate when locale changes', () => {
      const { container, rerender } = render(
        <IntlProvider locale="en" messages={defaultMessages}>
          <PrimeCommunityObjectHeader type={POST} object={mockObject} />
        </IntlProvider>
      );
      expect(container.querySelector('.primePostDateCreated')?.textContent).toContain('(en)');

      rerender(
        <IntlProvider locale="fr" messages={defaultMessages}>
          <PrimeCommunityObjectHeader type={POST} object={mockObject} />
        </IntlProvider>
      );
      expect(container.querySelector('.primePostDateCreated')?.textContent).toContain('(fr)');
    });

    it('should handle missing avatarUrl', () => {
      const objectWithoutAvatar = { ...mockObject, createdBy: { name: 'John Doe', avatarUrl: '' } };
      const { container } = renderComponent({ type: POST, object: objectWithoutAvatar });
      expect(
        (container.querySelector('img[alt="user-image"]') as HTMLImageElement).getAttribute('src')
      ).toBe('');
    });
  });

  describe('Options Menu Toggle', () => {
    it('should not show options menu initially', () => {
      renderComponent({ type: POST, object: mockObject });
      expect(screen.queryByTestId('community-object-options')).not.toBeInTheDocument();
    });

    it('should show options menu after clicking options button', () => {
      const { container } = renderComponent({ type: POST, object: mockObject });
      openOptions(container);
      expect(screen.getByTestId('community-object-options')).toBeInTheDocument();
    });

    it('should hide options menu on second click', () => {
      const { container } = renderComponent({ type: POST, object: mockObject });
      const button = container.querySelector('.primeCommunityOptionsIcon') as HTMLElement;
      userEvent.click(button);
      userEvent.click(button);
      expect(screen.queryByTestId('community-object-options')).not.toBeInTheDocument();
    });

  });

  describe('Delete Functionality', () => {
    it('deletePost_confirmed_showsConfirmationWithCorrectArgsAndCallsDeletePost', () => {
      const { container } = renderComponent({ type: POST, object: mockObject });
      openOptions(container);
      userEvent.click(screen.getByTestId('delete-button'));

      expect(mockAlmConfirmationAlert).toHaveBeenCalledWith(
        'Confirmation Required',
        'Are you sure you want to delete this post?',
        'Continue',
        'Cancel',
        expect.any(Function)
      );

      getLastConfirmCallback()();
      expect(mockDeletePostFromServer).toHaveBeenCalledWith('post:123');
    });

    it('deleteComment_confirmed_callsDeleteCommentAndDeleteObjectHandler', async () => {
      const mockDeleteHandler = jest.fn();
      const { container } = renderComponent({
        type: COMMENT,
        object: mockObject,
        deleteObjectHandler: mockDeleteHandler,
      });
      openOptions(container);
      userEvent.click(screen.getByTestId('delete-button'));

      expect(mockAlmConfirmationAlert).toHaveBeenCalledWith(
        expect.any(String),
        'Are you sure you want to delete this comment?',
        expect.any(String),
        expect.any(String),
        expect.any(Function)
      );

      await getLastConfirmCallback()();
      expect(mockDeleteCommentFromServer).toHaveBeenCalledWith('post:123');
      expect(mockDeleteHandler).toHaveBeenCalled();
    });

    it('deleteReply_confirmed_callsDeleteReplyAndDeleteObjectHandler', async () => {
      const mockDeleteHandler = jest.fn();
      const { container } = renderComponent({
        type: REPLY,
        object: mockObject,
        deleteObjectHandler: mockDeleteHandler,
      });
      openOptions(container);
      userEvent.click(screen.getByTestId('delete-button'));

      expect(mockAlmConfirmationAlert).toHaveBeenCalledWith(
        expect.any(String),
        'Are you sure you want to delete this reply?',
        expect.any(String),
        expect.any(String),
        expect.any(Function)
      );

      await getLastConfirmCallback()();
      expect(mockDeleteReplyFromServer).toHaveBeenCalledWith('post:123');
      expect(mockDeleteHandler).toHaveBeenCalled();
    });

    it('deletePost_confirmed_doesNotCallDeleteObjectHandler', async () => {
      const mockDeleteHandler = jest.fn();
      const { container } = renderComponent({
        type: POST,
        object: mockObject,
        deleteObjectHandler: mockDeleteHandler,
      });
      openOptions(container);
      userEvent.click(screen.getByTestId('delete-button'));
      await getLastConfirmCallback()();
      expect(mockDeleteHandler).not.toHaveBeenCalled();
    });

    it('deleteButton_clicked_noAPICallBeforeConfirmation', () => {
      const { container } = renderComponent({ type: POST, object: mockObject });
      openOptions(container);
      userEvent.click(screen.getByTestId('delete-button'));
      expect(mockDeletePostFromServer).not.toHaveBeenCalled();
    });

    it('should propagate errors thrown by deletePostFromServer', async () => {
      mockDeletePostFromServer.mockRejectedValueOnce(new Error('Network error'));
      const { container } = renderComponent({ type: POST, object: mockObject });
      openOptions(container);
      userEvent.click(screen.getByTestId('delete-button'));
      await expect(getLastConfirmCallback()()).rejects.toThrow('Network error');
    });
  });

  describe('Report Abuse Functionality', () => {
    it('reportPost_confirmed_showsConfirmationWithCorrectArgsAndCallsReportPost', () => {
      const { container } = renderComponent({ type: POST, object: mockObject });
      openOptions(container);
      userEvent.click(screen.getByTestId('report-button'));

      expect(mockAlmConfirmationAlert).toHaveBeenCalledWith(
        'Confirmation Required',
        'Are you sure you want to report this post?',
        'Continue',
        'Cancel',
        expect.any(Function)
      );

      getLastConfirmCallback()();
      expect(mockReportPostAbuse).toHaveBeenCalledWith('post:123');
    });

    it('reportComment_confirmed_callsReportCommentAbuse', () => {
      const { container } = renderComponent({ type: COMMENT, object: mockObject });
      openOptions(container);
      userEvent.click(screen.getByTestId('report-button'));

      expect(mockAlmConfirmationAlert).toHaveBeenCalledWith(
        expect.any(String),
        'Are you sure you want to report this comment?',
        expect.any(String),
        expect.any(String),
        expect.any(Function)
      );

      getLastConfirmCallback()();
      expect(mockReportCommentAbuse).toHaveBeenCalledWith('post:123');
    });

    it('reportReply_confirmed_callsReportReplyAbuse', () => {
      const { container } = renderComponent({ type: REPLY, object: mockObject });
      openOptions(container);
      userEvent.click(screen.getByTestId('report-button'));

      expect(mockAlmConfirmationAlert).toHaveBeenCalledWith(
        expect.any(String),
        'Are you sure you want to report this reply?',
        expect.any(String),
        expect.any(String),
        expect.any(Function)
      );

      getLastConfirmCallback()();
      expect(mockReportReplyAbuse).toHaveBeenCalledWith('post:123');
    });

    it('reportButton_clicked_noAPICallBeforeConfirmation', () => {
      const { container } = renderComponent({ type: POST, object: mockObject });
      openOptions(container);
      userEvent.click(screen.getByTestId('report-button'));
      expect(mockReportPostAbuse).not.toHaveBeenCalled();
    });

    it('should propagate errors thrown by reportPostAbuse', async () => {
      mockReportPostAbuse.mockRejectedValueOnce(new Error('Network error'));
      const { container } = renderComponent({ type: POST, object: mockObject });
      openOptions(container);
      userEvent.click(screen.getByTestId('report-button'));
      await expect(getLastConfirmCallback()()).rejects.toThrow('Network error');
    });
  });

  describe('Edit Functionality', () => {
    it('editPost_clickEdit_opensDialogWithCorrectPostIdDescriptionAndMode', () => {
      const { container } = renderComponent({
        type: POST,
        object: mockObject,
        description: 'Test description',
      });
      openOptions(container);
      userEvent.click(screen.getByTestId('edit-button'));

      expect(screen.getByTestId('dialog-post-id').textContent).toBe('post:123');
      expect(screen.getByTestId('dialog-description').textContent).toBe('Test description');
      expect(screen.getByTestId('dialog-mode').textContent).toBe('UPDATE');
    });

    it('editComment_clickEdit_callsUpdateObjectHandler', () => {
      const mockUpdateHandler = jest.fn();
      const { container } = renderComponent({
        type: COMMENT,
        object: mockObject,
        updateObjectHandler: mockUpdateHandler,
      });
      openOptions(container);
      userEvent.click(screen.getByTestId('edit-button'));
      expect(mockUpdateHandler).toHaveBeenCalled();
    });

    it('editReply_clickEdit_callsUpdateObjectHandler', () => {
      const mockUpdateHandler = jest.fn();
      const { container } = renderComponent({
        type: REPLY,
        object: mockObject,
        updateObjectHandler: mockUpdateHandler,
      });
      openOptions(container);
      userEvent.click(screen.getByTestId('edit-button'));
      expect(mockUpdateHandler).toHaveBeenCalled();
    });

    it('closeDialog_clickClose_hidesUpdateModal', () => {
      const { container } = renderComponent({
        type: POST,
        object: mockObject,
        description: 'Test description',
      });
      openOptions(container);
      userEvent.click(screen.getByTestId('edit-button'));
      userEvent.click(screen.getByTestId('close-dialog-button'));
      expect(screen.queryByTestId('update-post-dialog')).not.toBeInTheDocument();
    });

    it('savePost_callsUpdateObjectHandlerWithCorrectArgs_andClosesModal', async () => {
      const mockUpdateHandler = jest.fn().mockResolvedValue(undefined);
      const { container } = renderComponent({
        type: POST,
        object: mockObject,
        description: 'Test description',
        updateObjectHandler: mockUpdateHandler,
      });
      openOptions(container);
      userEvent.click(screen.getByTestId('edit-button'));
      await userEvent.click(screen.getByTestId('save-post-button'));

      expect(mockUpdateHandler).toHaveBeenCalledWith('updated', 'POST', null, false, []);
      expect(screen.queryByTestId('update-post-dialog')).not.toBeInTheDocument();
    });
  });

  describe('Update Right Answer Handler', () => {
    it('provided_clickRightAnswer_callsHandlerWithValue', () => {
      const mockUpdateRightAnswer = jest.fn();
      const { container } = renderComponent({
        type: COMMENT,
        object: mockObject,
        updateRightAnswerHandler: mockUpdateRightAnswer,
      });
      openOptions(container);
      userEvent.click(screen.getByTestId('right-answer-button'));
      expect(mockUpdateRightAnswer).toHaveBeenCalledWith('answer:1');
    });

    it('notProvided_clickRightAnswer_doesNotThrow', () => {
      const { container } = renderComponent({ type: COMMENT, object: mockObject });
      openOptions(container);
      expect(() => userEvent.click(screen.getByTestId('right-answer-button'))).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should throw when object is null', () => {
      expect(() => renderComponent({ type: POST, object: null as any })).toThrow();
    });

    it('should throw when object is undefined', () => {
      expect(() => renderComponent({ type: POST, object: undefined as any })).toThrow();
    });

    it('should throw when createdBy is missing', () => {
      expect(() =>
        renderComponent({ type: POST, object: { ...mockObject, createdBy: undefined as any } })
      ).toThrow();
    });

    it('unknownType_clickDelete_logsObjectTypeMissing', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const { container } = renderComponent({ type: 'unknown' as any, object: mockObject });
      openOptions(container);
      userEvent.click(screen.getByTestId('delete-button'));
      expect(consoleSpy).toHaveBeenCalledWith('object type is missing');
      consoleSpy.mockRestore();
    });
  });
});
