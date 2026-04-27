/**
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
import { IntlProvider } from 'react-intl';
import userEvent from '@testing-library/user-event';
import ALMUserProfile from '@components/UserProfile/ALMUserProfile';

jest.mock('../../../store/APIStore', () => ({
  __esModule: true,
  default: { getState: jest.fn() },
}));

const mockStore = require('../../../store/APIStore').default;

const mockUpdateProfileImage = jest.fn();
const mockDeleteProfileImage = jest.fn();

jest.mock('@hooks');
const hooks = require('@hooks');

jest.mock('@utils/uploadUtils', () => ({
  cancelUploadFile: jest.fn(),
}));

jest.mock('@components/Common/ALMBackButton/ALMBackButton', () =>
  function MockALMBackButton() {
    return <div data-testid="back-button" />;
  }
);

jest.mock('@components/Common/ALMErrorBoundary', () => ({
  ALMErrorBoundary: ({ children }: any) => <>{children}</>,
}));

jest.mock('@utils/inline_svg', () => ({
  SOCIAL_CANCEL_SVG: jest.fn(() => null),
}));

const defaultUser = {
  name: 'John Doe',
  email: 'john.doe@example.com',
  avatarUrl: 'https://example.com/avatar.jpg',
};

function renderComponent() {
  return render(
    <IntlProvider locale="en-US">
      <ALMUserProfile />
    </IntlProvider>
  );
}

// Puts files on the hidden file input and fires the change event.
function triggerFileChange(container: HTMLElement, files: File[]) {
  const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
  Object.defineProperty(fileInput, 'files', {
    value: files,
    writable: false,
    configurable: true,
  });
  fireEvent.change(fileInput);
}

describe('ALMUserProfile', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockStore.getState.mockReturnValue({
      fileUpload: { uploadProgress: 0, fileName: 'test.jpg' },
    });
    mockUpdateProfileImage.mockResolvedValue({});
    mockDeleteProfileImage.mockResolvedValue({});
    hooks.useProfile = jest.fn().mockReturnValue({
      profileAttributes: { user: defaultUser },
      updateProfileImage: mockUpdateProfileImage,
      deleteProfileImage: mockDeleteProfileImage,
    });
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('fileInput_onRender_acceptsImagesOnly', () => {
    const { container } = renderComponent();

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput.accept).toBe('image/*');
  });

  it('userInfo_onRender_displaysNameEmailAvatarAndAltText', () => {
    const { container } = renderComponent();

    expect(container.textContent).toContain('John Doe');
    expect(container.textContent).toContain('john.doe@example.com');
    const img = container.querySelector('img') as HTMLImageElement;
    expect(img.getAttribute('src')).toBe('https://example.com/avatar.jpg');
    expect(img.getAttribute('alt')).toBe('profile');
  });

  describe('image state transitions', () => {
    it('initialState_onRender_showsChangeImageButtonOnly', () => {
      const { container } = renderComponent();

      expect(container.textContent).toContain('Change image');
      expect(container.textContent).not.toContain('Edit image');
      expect(container.textContent).not.toContain('Uploading...');
    });

    it('changeImage_clicked_showsEditAndDeleteHidesChangeImage', () => {
      const { container } = renderComponent();

      userEvent.click(screen.getByText('Change image'));

      expect(container.textContent).toContain('Edit image');
      expect(container.textContent).toContain('Delete image');
      expect(container.textContent).not.toContain('Change image');
    });
  });

  describe('delete image', () => {
    function enterEditState() {
      userEvent.click(screen.getByText('Change image'));
    }

    it('deleteImage_clicked_callsDeleteProfileImage', async () => {
      renderComponent();
      enterEditState();

      userEvent.click(screen.getByText('Delete image'));

      await waitFor(() => expect(mockDeleteProfileImage).toHaveBeenCalledTimes(1));
    });

    it('deleteImage_clicked_exitsEditStateAndShowsChangeImage', async () => {
      const { container } = renderComponent();
      enterEditState();

      userEvent.click(screen.getByText('Delete image'));

      await waitFor(() => {
        expect(container.textContent).not.toContain('Edit image');
        expect(container.textContent).toContain('Change image');
      });
    });
  });

  describe('image upload', () => {
    it('imageUpload_imageFileSelected_callsUpdateProfileImageWithNameAndFile', async () => {
      const { container } = renderComponent();
      const file = new File(['dummy'], 'photo.jpg', { type: 'image/jpeg' });

      triggerFileChange(container, [file]);

      await waitFor(() =>
        expect(mockUpdateProfileImage).toHaveBeenCalledWith('photo.jpg', file)
      );
    });

    it('imageUpload_mixedFileTypes_skipsNonImageAndUploadsFirstImageFile', async () => {
      const { container } = renderComponent();
      const textFile = new File(['txt'], 'doc.txt', { type: 'text/plain' });
      const imageFile = new File(['img'], 'photo.jpg', { type: 'image/jpeg' });

      triggerFileChange(container, [textFile, imageFile]);

      await waitFor(() =>
        expect(mockUpdateProfileImage).toHaveBeenCalledWith('photo.jpg', imageFile)
      );
    });
  });

  // A never-resolving promise keeps isUploading=true so upload UI stays visible.
  describe('uploading state', () => {
    beforeEach(() => {
      mockUpdateProfileImage.mockReturnValue(new Promise(() => {}));
    });

    it('imageUpload_inProgress_showsUploadingLabelAndHidesChangeImageButton', async () => {
      const { container } = renderComponent();

      triggerFileChange(container, [new File(['dummy'], 'photo.jpg', { type: 'image/jpeg' })]);

      await waitFor(() => {
        expect(container.textContent).toContain('Uploading...');
        expect(container.textContent).not.toContain('Change image');
      });
    });

    it('cancelUpload_clicked_callsCancelUploadFileWithFileName', async () => {
      const { cancelUploadFile } = require('@utils/uploadUtils');
      const { container } = renderComponent();
      triggerFileChange(container, [new File(['dummy'], 'test.jpg', { type: 'image/jpeg' })]);
      await waitFor(() => expect(container.textContent).toContain('Uploading...'));

      fireEvent.click(container.querySelector('button[title="Remove upload"]') as HTMLElement);

      expect(cancelUploadFile).toHaveBeenCalledWith('test.jpg');
    });

    it('cancelUpload_clicked_resetsToNormalState', async () => {
      const { container } = renderComponent();
      triggerFileChange(container, [new File(['dummy'], 'test.jpg', { type: 'image/jpeg' })]);
      await waitFor(() => expect(container.textContent).toContain('Uploading...'));

      fireEvent.click(container.querySelector('button[title="Remove upload"]') as HTMLElement);

      await waitFor(() => {
        expect(container.textContent).toContain('Change image');
        expect(container.textContent).not.toContain('Uploading...');
      });
    });
  });

  it('editIcon_clicked_triggersFileInputClick', () => {
    const { container } = renderComponent();
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const clickSpy = jest.spyOn(fileInput, 'click');

    fireEvent.click(container.querySelector('.editIcon') as HTMLElement);

    expect(clickSpy).toHaveBeenCalled();
  });

  it('avatar_emptyAvatarUrl_rendersImgWithEmptySrc', () => {
    hooks.useProfile.mockReturnValue({
      profileAttributes: { user: { ...defaultUser, avatarUrl: '' } },
      updateProfileImage: mockUpdateProfileImage,
      deleteProfileImage: mockDeleteProfileImage,
    });
    const { container } = renderComponent();

    expect((container.querySelector('img') as HTMLImageElement).getAttribute('src')).toBe('');
  });
});
