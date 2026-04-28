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
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import PrimeCommunityAddPostButton from '@components/Community/PrimeCommunityAddPostButton/PrimeCommunityAddPostButton';

jest.mock('@components/Community/PrimeCommunityAddPostDialogTrigger', () => ({
  PrimeCommunityAddPostDialogTrigger: ({ buttonLabel, savePostHandler, inMobileView }: any) => (
    <div>
      <span data-testid="button-label">{buttonLabel}</span>
      <span data-testid="mobile-view">{String(inMobileView)}</span>
      <button
        data-testid="save-button"
        onClick={() => savePostHandler('test input', 'POST_TYPE', 'resource', false, ['opt1'])}
      >
        Save
      </button>
    </div>
  ),
}));

const renderComponent = (
  props: Record<string, any> = {},
  messages: Record<string, string> = { 'alm.community.newPost.label': 'New Post' }
) =>
  render(
    <IntlProvider locale="en" messages={messages}>
      <PrimeCommunityAddPostButton {...props} />
    </IntlProvider>
  );

describe('PrimeCommunityAddPostButton', () => {
  describe('Label', () => {
    it('passes localized label to dialog trigger', () => {
      renderComponent({}, { 'alm.community.newPost.label': 'Translated New Post' });
      expect(screen.getByTestId('button-label').textContent).toBe('Translated New Post');
    });
  });

  describe('saveHandler guard', () => {
    it('saveHandler_functionProp_callsWithAllArguments', () => {
      const mockSave = jest.fn().mockResolvedValue(undefined);
      renderComponent({ savePostHandler: mockSave });

      userEvent.click(screen.getByTestId('save-button'));

      expect(mockSave).toHaveBeenCalledTimes(1);
      expect(mockSave).toHaveBeenCalledWith('test input', 'POST_TYPE', 'resource', false, ['opt1']);
    });

    it('saveHandler_nullProp_doesNotThrow', () => {
      renderComponent({ savePostHandler: null });
      expect(() => userEvent.click(screen.getByTestId('save-button'))).not.toThrow();
    });
  });

  describe('inMobileView prop forwarding', () => {
    it('passes true to dialog trigger when inMobileView is true', () => {
      renderComponent({ inMobileView: true });
      expect(screen.getByTestId('mobile-view').textContent).toBe('true');
    });

    it('passes false to dialog trigger when inMobileView is false', () => {
      renderComponent({ inMobileView: false });
      expect(screen.getByTestId('mobile-view').textContent).toBe('false');
    });
  });
});
