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

jest.mock('@utils/global', () => ({
  getALMConfig: () => ({
    accountId: 'test-account-id',
    baseUrl: 'https://test.example.com',
    locale: 'en-US',
    accessToken: 'test-access-token',
    csrfToken: 'test-csrf-token',
  }),
}));

const mockGetEditor = jest.fn();

jest.mock('react-quill', () => {
  const React = jest.requireActual('react');
  return React.forwardRef((props: any, ref: any) => {
    React.useImperativeHandle(ref, () => ({
      value: props.value || '',
      getEditor: mockGetEditor,
    }));
    return React.createElement(
      'div',
      { 'data-testid': 'react-quill-editor' },
      React.createElement('textarea', {
        'data-testid': 'quill-textarea',
        value: props.value || '',
        onChange: (e: any) => props.onChange && props.onChange(e.target.value),
        placeholder: props.placeholder,
      })
    );
  });
});

jest.mock('@components/Community/PrimeCommunityLinkPreview', () => {
  const React = jest.requireActual('react');
  return {
    PrimeCommunityLinkPreview: ({ currentInput, showLinkPreview }: any) =>
      showLinkPreview
        ? React.createElement('div', { 'data-testid': 'link-preview', 'data-current-input': currentInput }, 'Link Preview')
        : null,
  };
});

jest.mock('@spectrum-icons/workflow/Send', () => {
  const React = jest.requireActual('react');
  return { __esModule: true, default: () => React.createElement('svg', { 'data-testid': 'send-icon' }) };
});

jest.mock('@spectrum-icons/workflow/Cancel', () => {
  const React = jest.requireActual('react');
  return { __esModule: true, default: () => React.createElement('svg', { 'data-testid': 'cancel-icon' }) };
});

jest.mock('@utils/social-utils', () => ({
  getAlmConfirmationBadwordParams: jest.fn(() => ({
    title: 'Bad Word Detected',
    body: 'Your post contains inappropriate content',
    actionlabel: 'OK',
  })),
}));

const mockAlmConfirmationAlert = jest.fn();
jest.mock('@common/Alert/useConfirmationAlert', () => ({
  useConfirmationAlert: () => [mockAlmConfirmationAlert],
}));

import { render, screen, wait, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { IntlProvider } from 'react-intl';
import PrimeCommunityObjectInput from '@components/Community/PrimeCommunityObjectInput/PrimeCommunityObjectInput';
import { BAD_WORD_FOUND } from '@utils/constants';
import { getAlmConfirmationBadwordParams } from '@utils/social-utils';

const mockGetAlmConfirmationBadwordParams = jest.mocked(getAlmConfirmationBadwordParams);

const messages = { 'alm.community.post.charactersLeft': 'characters left' };

const renderComponent = (props: any = {}) => {
  const ref = React.createRef<any>();
  const defaultProps = {
    primaryActionHandler: jest.fn().mockResolvedValue(undefined),
    ...props,
  };
  const result = render(
    <IntlProvider locale="en" messages={messages}>
      <PrimeCommunityObjectInput {...defaultProps} ref={ref} />
    </IntlProvider>
  );
  return { ...result, ref };
};

describe('PrimeCommunityObjectInput', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetEditor.mockReturnValue({ history: { undo: jest.fn() } });
    mockGetAlmConfirmationBadwordParams.mockReturnValue({
      title: 'Bad Word Detected',
      body: 'Your post contains inappropriate content',
      actionlabel: 'OK',
    });
  });

  describe('Rendering', () => {
    it('renders editor with placeholder', () => {
      renderComponent({ inputPlaceholder: 'Write something...' });
      expect(screen.getByTestId('quill-textarea')).toHaveAttribute('placeholder', 'Write something...');
    });

    it('shows default character limit of 1000', () => {
      const { container } = renderComponent();
      expect(container.textContent).toContain('1000 characters left');
    });

    it('shows custom characterLimit when provided', () => {
      const { container } = renderComponent({ characterLimit: 500 });
      expect(container.textContent).toContain('500 characters left');
    });

    it('shows Send button when primaryAction is provided', () => {
      renderComponent({ primaryActionHandler: jest.fn() });
      expect(screen.getByTestId('send-icon')).toBeInTheDocument();
    });

    it('hides Send button when no primaryAction is provided', () => {
      renderComponent({ primaryActionHandler: undefined });
      expect(screen.queryByTestId('send-icon')).not.toBeInTheDocument();
    });

    it('shows Cancel button when secondaryActionHandler is provided', () => {
      renderComponent({ secondaryActionHandler: jest.fn() });
      expect(screen.getByTestId('cancel-icon')).toBeInTheDocument();
    });

    it('hides Cancel button when no secondaryActionHandler is provided', () => {
      renderComponent({ primaryActionHandler: jest.fn() });
      expect(screen.queryByTestId('cancel-icon')).not.toBeInTheDocument();
    });

    it('initializes editor with defaultValue', () => {
      renderComponent({ defaultValue: 'Initial content' });
      expect(screen.getByTestId('quill-textarea')).toHaveValue('Initial content');
    });
  });

  describe('Character limit', () => {
    it('decrements counter as text is typed', () => {
      const { container } = renderComponent({ defaultValue: '' });
      userEvent.type(screen.getByTestId('quill-textarea'), 'Hello');
      expect(container.textContent).toContain('995 characters left');
    });

    it('strips HTML tags when counting characters', () => {
      const { container } = renderComponent({ defaultValue: '' });
      // Simulate quill calling onChange with HTML-formatted content directly.
      // Without stripping: '<b>Hi</b>' = 9 chars → 991 remaining.
      // With stripping: textContent = 'Hi' = 2 chars → 998 remaining.
      fireEvent.change(screen.getByTestId('quill-textarea'), { target: { value: '<b>Hi</b>' } });
      expect(container.textContent).toContain('998 characters left');
    });

    it('calls undo when typed text exceeds character limit', () => {
      const mockUndo = jest.fn();
      mockGetEditor.mockReturnValue({ history: { undo: mockUndo } });
      renderComponent({ characterLimit: 3, defaultValue: '' });
      // Typing 4 chars; the 4th character triggers undo since it exceeds limit of 3
      userEvent.type(screen.getByTestId('quill-textarea'), 'Test');
      expect(mockUndo).toHaveBeenCalled();
    });
  });

  describe('Send action', () => {
    it('does not call primaryAction when editor is empty', () => {
      const mockHandler = jest.fn();
      renderComponent({ primaryActionHandler: mockHandler, defaultValue: '' });
      userEvent.click(screen.getByTestId('send-icon').closest('button')!);
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('calls primaryAction with editor content on send', async () => {
      const mockHandler = jest.fn().mockResolvedValue(undefined);
      renderComponent({ primaryActionHandler: mockHandler, defaultValue: '' });
      userEvent.type(screen.getByTestId('quill-textarea'), 'My post');
      userEvent.click(screen.getByTestId('send-icon').closest('button')!);
      await wait(() => expect(mockHandler).toHaveBeenCalledWith('My post'));
    });

    it('clears editor and resets counter after successful send', async () => {
      const mockHandler = jest.fn().mockResolvedValue(undefined);
      const { container } = renderComponent({ primaryActionHandler: mockHandler, defaultValue: '' });
      const textarea = screen.getByTestId('quill-textarea');
      userEvent.type(textarea, 'Post content');
      userEvent.click(screen.getByTestId('send-icon').closest('button')!);
      await wait(() => {
        expect(textarea).toHaveValue('');
        expect(container.textContent).toContain('1000 characters left');
      });
    });

    it('hides link preview after successful send', async () => {
      const mockHandler = jest.fn().mockResolvedValue(undefined);
      renderComponent({ primaryActionHandler: mockHandler, defaultValue: '' });
      userEvent.type(screen.getByTestId('quill-textarea'), 'Post');
      expect(screen.getByTestId('link-preview')).toBeInTheDocument();
      userEvent.click(screen.getByTestId('send-icon').closest('button')!);
      await wait(() => expect(screen.queryByTestId('link-preview')).not.toBeInTheDocument());
    });

    it('shows confirmation alert when BAD_WORD_FOUND error is thrown', async () => {
      const error = new Error(BAD_WORD_FOUND);
      const mockHandler = jest.fn().mockRejectedValue(error);
      renderComponent({ primaryActionHandler: mockHandler, defaultValue: '' });
      userEvent.type(screen.getByTestId('quill-textarea'), 'bad input');
      userEvent.click(screen.getByTestId('send-icon').closest('button')!);
      await wait(() =>
        expect(mockAlmConfirmationAlert).toHaveBeenCalledWith(
          'Bad Word Detected',
          'Your post contains inappropriate content',
          'OK',
          ''
        )
      );
    });

    it('does not show bad-word alert for unrelated send errors', async () => {
      const mockHandler = jest.fn().mockRejectedValue(new Error('Network error'));
      renderComponent({ primaryActionHandler: mockHandler, defaultValue: '' });
      userEvent.type(screen.getByTestId('quill-textarea'), 'some text');
      userEvent.click(screen.getByTestId('send-icon').closest('button')!);
      await wait(() => expect(mockHandler).toHaveBeenCalled());
      expect(mockAlmConfirmationAlert).not.toHaveBeenCalled();
    });
  });

  describe('Cancel action', () => {
    it('calls secondaryActionHandler with current text on cancel', () => {
      const mockHandler = jest.fn();
      renderComponent({
        primaryActionHandler: jest.fn(),
        secondaryActionHandler: mockHandler,
        defaultValue: '',
      });
      userEvent.type(screen.getByTestId('quill-textarea'), 'Draft text');
      userEvent.click(screen.getByTestId('cancel-icon').closest('button')!);
      expect(mockHandler).toHaveBeenCalledWith('Draft text');
    });

    it('clears editor and resets counter after cancel', () => {
      const { container } = renderComponent({
        primaryActionHandler: jest.fn(),
        secondaryActionHandler: jest.fn(),
        defaultValue: '',
      });
      const textarea = screen.getByTestId('quill-textarea');
      userEvent.type(textarea, 'Some text');
      userEvent.click(screen.getByTestId('cancel-icon').closest('button')!);
      expect(textarea).toHaveValue('');
      expect(container.textContent).toContain('1000 characters left');
    });

    it('hides link preview after cancel', () => {
      renderComponent({
        primaryActionHandler: jest.fn(),
        secondaryActionHandler: jest.fn(),
        defaultValue: '',
      });
      userEvent.type(screen.getByTestId('quill-textarea'), 'Some text');
      userEvent.click(screen.getByTestId('cancel-icon').closest('button')!);
      expect(screen.queryByTestId('link-preview')).not.toBeInTheDocument();
    });
  });

  describe('enable/disable primary action callbacks', () => {
    it('calls enablePrimaryAction when non-empty text is entered', () => {
      const mockEnable = jest.fn();
      renderComponent({
        primaryActionHandler: jest.fn(),
        enablePrimaryAction: mockEnable,
        disablePrimaryAction: jest.fn(),
        defaultValue: '',
      });
      userEvent.type(screen.getByTestId('quill-textarea'), 'Hi');
      expect(mockEnable).toHaveBeenCalled();
    });

    it('calls disablePrimaryAction for whitespace-only input', () => {
      const mockDisable = jest.fn();
      renderComponent({
        primaryActionHandler: jest.fn(),
        enablePrimaryAction: jest.fn(),
        disablePrimaryAction: mockDisable,
        defaultValue: '',
      });
      userEvent.type(screen.getByTestId('quill-textarea'), '  ');
      expect(mockDisable).toHaveBeenCalled();
    });
  });

  describe('Link preview', () => {
    it('is hidden initially when defaultValue is empty string', () => {
      renderComponent({ defaultValue: '' });
      expect(screen.queryByTestId('link-preview')).not.toBeInTheDocument();
    });

    it('is shown after first text input', () => {
      renderComponent({ defaultValue: '' });
      userEvent.type(screen.getByTestId('quill-textarea'), 'text');
      expect(screen.getByTestId('link-preview')).toBeInTheDocument();
    });

    it('is shown on mount when defaultValue is non-empty', () => {
      renderComponent({ defaultValue: 'some content' });
      expect(screen.getByTestId('link-preview')).toBeInTheDocument();
    });
  });
});
