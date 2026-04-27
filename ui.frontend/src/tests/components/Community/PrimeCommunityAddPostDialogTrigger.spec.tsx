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
import PrimeCommunityAddPostDialogTrigger from '../../../almLib/components/Community/PrimeCommunityAddPostDialogTrigger/PrimeCommunityAddPostDialogTrigger';

const mockGetUploadInfo = jest.fn();
const mockSavePostHandler = jest.fn();
const mockCloseDialogHandler = jest.fn();

jest.mock('../../../almLib/utils/uploadUtils', () => ({
  getUploadInfo: () => mockGetUploadInfo(),
}));

jest.mock('@adobe/react-spectrum', () => ({
  Provider: ({ children }: any) => <div>{children}</div>,
  lightTheme: {},
  DialogTrigger: ({ children }: any) => {
    const childArray = Array.isArray(children) ? children : [children];
    const button = childArray[0];
    const dialogFn = childArray[1];
    const mockClose = jest.fn();
    return (
      <div>
        {button}
        <div>{typeof dialogFn === 'function' ? dialogFn(mockClose) : null}</div>
      </div>
    );
  },
  ActionButton: ({ id, UNSAFE_className, onPress, isDisabled, children }: any) => (
    <button
      id={id}
      className={UNSAFE_className}
      onClick={onPress}
      disabled={isDisabled}
      data-testid={id}
    >
      {children}
    </button>
  ),
}));

jest.mock('../../../almLib/components/Community/PrimeCommunityAddPostDialog', () => ({
  PrimeCommunityAddPostDialog: ({ saveHandler, close, closeHandler }: any) => (
    <div data-testid="add-post-dialog">
      <button
        onClick={() => saveHandler(null, 'typed text', 'DISCUSSION', null, false, null, close)}
        data-testid="save-btn"
      >
        Save
      </button>
      <button onClick={closeHandler} data-testid="close-btn">
        Close
      </button>
    </div>
  ),
}));

describe('PrimeCommunityAddPostDialogTrigger', () => {
  const defaultProps = {
    buttonLabel: 'Add Post',
    savePostHandler: mockSavePostHandler,
    closeDialogHandler: mockCloseDialogHandler,
    openDialog: false,
    inMobileView: false,
    post: null,
    description: 'Test Description',
    mode: 'CREATE',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUploadInfo.mockResolvedValue(undefined);
    mockSavePostHandler.mockResolvedValue(undefined);
  });

  describe('Button rendering', () => {
    it('renders visible trigger button with button label when openDialog is false', () => {
      render(<PrimeCommunityAddPostDialogTrigger {...defaultProps} openDialog={false} />);
      expect(screen.getByTestId('showAddPostDialog').textContent).toBe('Add Post');
      expect(screen.queryByTestId('hiddenActionButton')).toBeNull();
    });

    it('renders hidden trigger button and no visible button when openDialog is true', () => {
      render(<PrimeCommunityAddPostDialogTrigger {...defaultProps} openDialog={true} />);
      expect(screen.queryByTestId('showAddPostDialog')).toBeNull();
      expect(screen.queryByTestId('hiddenActionButton')).not.toBeNull();
    });
  });

  describe('onClickHandler', () => {
    it('calls getUploadInfo when the trigger button is clicked', async () => {
      render(<PrimeCommunityAddPostDialogTrigger {...defaultProps} />);
      userEvent.click(screen.getByTestId('showAddPostDialog'));
      await waitFor(() => expect(mockGetUploadInfo).toHaveBeenCalledTimes(1));
    });

    it('disables the trigger button after click in mobile view', async () => {
      render(<PrimeCommunityAddPostDialogTrigger {...defaultProps} inMobileView={true} />);
      const button = screen.getByTestId('showAddPostDialog') as HTMLButtonElement;
      userEvent.click(button);
      await waitFor(() => expect(button.disabled).toBe(true));
    });

    it('does not disable the trigger button after click in desktop view', async () => {
      render(<PrimeCommunityAddPostDialogTrigger {...defaultProps} inMobileView={false} />);
      const button = screen.getByTestId('showAddPostDialog') as HTMLButtonElement;
      userEvent.click(button);
      await waitFor(() => expect(mockGetUploadInfo).toHaveBeenCalled());
      expect(button.disabled).toBe(false);
    });
  });

  describe('savePostHandler', () => {
    it('calls props.savePostHandler with (input, postingType, resource, isResourceModified, pollOptions) — dropping event and close args', async () => {
      render(<PrimeCommunityAddPostDialogTrigger {...defaultProps} />);
      userEvent.click(screen.getByTestId('save-btn'));
      await waitFor(() =>
        expect(mockSavePostHandler).toHaveBeenCalledWith(
          'typed text',
          'DISCUSSION',
          null,
          false,
          null
        )
      );
    });

    it('re-enables the trigger button after save in mobile view', async () => {
      render(<PrimeCommunityAddPostDialogTrigger {...defaultProps} inMobileView={true} />);
      const button = screen.getByTestId('showAddPostDialog') as HTMLButtonElement;

      userEvent.click(button);
      await waitFor(() => expect(button.disabled).toBe(true));

      userEvent.click(screen.getByTestId('save-btn'));
      await waitFor(() => expect(button.disabled).toBe(false));
    });
  });

  describe('closeDialogHandler', () => {
    it('calls props.closeDialogHandler when the dialog close button is clicked', () => {
      render(<PrimeCommunityAddPostDialogTrigger {...defaultProps} />);
      userEvent.click(screen.getByTestId('close-btn'));
      expect(mockCloseDialogHandler).toHaveBeenCalledTimes(1);
    });

    it('re-enables the trigger button after close in mobile view', async () => {
      render(<PrimeCommunityAddPostDialogTrigger {...defaultProps} inMobileView={true} />);
      const button = screen.getByTestId('showAddPostDialog') as HTMLButtonElement;

      userEvent.click(button);
      await waitFor(() => expect(button.disabled).toBe(true));

      userEvent.click(screen.getByTestId('close-btn'));
      expect(button.disabled).toBe(false);
    });
  });
});
