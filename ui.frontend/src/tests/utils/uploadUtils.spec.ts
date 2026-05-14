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
  getALMConfig: jest.fn(),
  getAccessToken: jest.fn(),
  getCsrfToken: jest.fn(),
}));

jest.mock('@utils/restAdapter', () => ({
  RestAdapter: {
    ajax: jest.fn(),
  },
}));

jest.mock('evaporate', () => ({
  create: jest.fn(),
}));

jest.mock('spark-md5', () => ({
  ArrayBuffer: { hash: jest.fn(() => 'fakeMd5') },
}));

jest.mock('js-sha256', () => ({ sha256: jest.fn() }));

jest.mock('../../store/APIStore', () => ({
  __esModule: true,
  default: {
    getState: jest.fn(() => ({
      fileUpload: { uploadProgress: 0 },
    })),
    dispatch: jest.fn(),
  },
}));

const uploadInfoResponse = JSON.stringify({
  awsKey: 'my-aws-key',
  bucket: 'my-bucket',
  region: 'us-east-1',
  key: 'uploads/file.jpg',
  awsUrl: '',
});

const mockEvaporateInstance = {
  add: jest.fn(),
  cancel: jest.fn(),
};

function setupFreshMocks() {
  const globalUtils = require('@utils/global');
  const restAdapter = require('@utils/restAdapter');
  const Evaporate = require('evaporate');
  const storeModule = require('../../store/APIStore');

  (globalUtils.getALMConfig as jest.Mock).mockReturnValue({
    primeApiURL: 'https://api.example.com/',
    csrfToken: '',
  });
  (globalUtils.getAccessToken as jest.Mock).mockReturnValue('bearer-token');
  (globalUtils.getCsrfToken as jest.Mock).mockReturnValue('');
  (restAdapter.RestAdapter.ajax as jest.Mock).mockResolvedValue(uploadInfoResponse);
  (Evaporate.create as jest.Mock).mockResolvedValue(mockEvaporateInstance);
  (storeModule.default.getState as jest.Mock).mockReturnValue({
    fileUpload: { uploadProgress: 0 },
  });
}

describe('uploadUtils', () => {
  beforeEach(() => {
    jest.resetModules();
    // Re-acquire fresh mock references after module reset and set return values
    setupFreshMocks();
    // Also reset the evaporateInstance mock functions' call history
    mockEvaporateInstance.add.mockReset();
    mockEvaporateInstance.cancel.mockReset();
  });

  describe('getUploadInfo', () => {
    it('getUploadInfo_calledFirstTime_fetchesUploadInfoAndInitializesEvaporate', async () => {
      const { getUploadInfo } = require('@utils/uploadUtils');
      const { RestAdapter } = require('@utils/restAdapter');
      const Evaporate = require('evaporate');

      await getUploadInfo();

      expect(RestAdapter.ajax).toHaveBeenCalledWith({
        url: 'https://api.example.com//uploadInfo',
        method: 'GET',
      });
      expect(Evaporate.create).toHaveBeenCalledTimes(1);
    });

    it('getUploadInfo_withCsrfToken_includesCsrfInHeaders', async () => {
      const { getUploadInfo } = require('@utils/uploadUtils');
      const globalUtils = require('@utils/global');
      const Evaporate = require('evaporate');

      (globalUtils.getALMConfig as jest.Mock).mockReturnValue({
        primeApiURL: 'https://api.example.com/',
        csrfToken: 'my-csrf-token',
      });
      (globalUtils.getCsrfToken as jest.Mock).mockReturnValue('my-csrf-token');

      await getUploadInfo();

      expect(Evaporate.create).toHaveBeenCalledWith(
        expect.objectContaining({
          signHeaders: expect.objectContaining({ 'X-CSRF-TOKEN': 'my-csrf-token' }),
        })
      );
    });

    it('getUploadInfo_withAccessToken_includesAuthorizationInHeaders', async () => {
      const { getUploadInfo } = require('@utils/uploadUtils');
      const globalUtils = require('@utils/global');
      const Evaporate = require('evaporate');

      (globalUtils.getALMConfig as jest.Mock).mockReturnValue({
        primeApiURL: 'https://api.example.com/',
        csrfToken: '',
      });
      (globalUtils.getAccessToken as jest.Mock).mockReturnValue('test-access-token');

      await getUploadInfo();

      expect(Evaporate.create).toHaveBeenCalledWith(
        expect.objectContaining({
          signHeaders: expect.objectContaining({ authorization: 'oauth test-access-token' }),
        })
      );
    });
  });

  describe('uploadFile', () => {
    it('uploadFile_success_returnsUploadedUrl', async () => {
      const { getUploadInfo, uploadFile } = require('@utils/uploadUtils');
      mockEvaporateInstance.add.mockResolvedValue('path/to/uploaded/file.jpg');

      await getUploadInfo();

      const file = new File(['content'], 'test file.jpg', { type: 'image/jpeg' });
      const result = await uploadFile('test file.jpg', file);

      // File name is sanitized (spaces removed)
      expect(mockEvaporateInstance.add).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'testfile.jpg', file })
      );
      expect(result).toContain('path/to/uploaded/file.jpg');
    });

    it('uploadFile_sanitizesFileName_removesNonAlphanumericChars', async () => {
      const { getUploadInfo, uploadFile } = require('@utils/uploadUtils');
      mockEvaporateInstance.add.mockResolvedValue('uploaded.jpg');

      await getUploadInfo();

      const file = new File(['content'], 'my file (1).jpg', { type: 'image/jpeg' });
      await uploadFile('my file (1).jpg', file);

      expect(mockEvaporateInstance.add).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'myfile1.jpg' })
      );
    });

    it('uploadFile_uploadFails_dispatchesResetAndReturnsEmptyString', async () => {
      const { getUploadInfo, uploadFile } = require('@utils/uploadUtils');
      const storeModule = require('../../store/APIStore');
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockEvaporateInstance.add.mockRejectedValue(new Error('Upload failed'));

      await getUploadInfo();

      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      const result = await uploadFile('test.jpg', file);

      expect(result).toBe('');
      expect(storeModule.default.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'RESET_UPLOAD' })
      );
      consoleSpy.mockRestore();
    });
  });

  describe('cancelUploadFile', () => {
    it('cancelUploadFile_success_returnsResetAction', async () => {
      const { getUploadInfo, cancelUploadFile } = require('@utils/uploadUtils');
      mockEvaporateInstance.cancel.mockResolvedValue(undefined);

      await getUploadInfo();

      const result = await cancelUploadFile('test.jpg');

      expect(mockEvaporateInstance.cancel).toHaveBeenCalledWith(
        expect.stringContaining('test.jpg')
      );
      expect(result).toEqual({ type: 'RESET_UPLOAD' });
    });

    it('cancelUploadFile_fails_logsErrorWithoutThrowing', async () => {
      const { getUploadInfo, cancelUploadFile } = require('@utils/uploadUtils');
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockEvaporateInstance.cancel.mockRejectedValue(new Error('Cancel failed'));

      await getUploadInfo();

      await expect(cancelUploadFile('test.jpg')).resolves.toBeUndefined();
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});
