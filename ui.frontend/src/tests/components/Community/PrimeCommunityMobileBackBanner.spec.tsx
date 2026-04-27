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
import PrimeCommunityMobileBackBanner from '@components/Community/PrimeCommunityMobileBackBanner/PrimeCommunityMobileBackBanner';

jest.mock('@spectrum-icons/workflow/ChevronLeft', () => ({
  __esModule: true,
  default: () => <svg data-testid="chevron-left-icon" />,
}));

describe('PrimeCommunityMobileBackBanner', () => {
  let historyBackSpy: jest.SpyInstance;

  beforeEach(() => {
    historyBackSpy = jest.spyOn(window.history, 'back').mockImplementation(() => {});
  });

  afterEach(() => {
    historyBackSpy.mockRestore();
  });

  const renderComponent = (locale = 'en', messages: Record<string, string> = { 'alm.community.back.label': 'Back' }) =>
    render(
      <IntlProvider locale={locale} messages={messages}>
        <PrimeCommunityMobileBackBanner />
      </IntlProvider>
    );

  it('calls window.history.back when the back button is clicked', () => {
    renderComponent();
    userEvent.click(screen.getByRole('button'));
    expect(historyBackSpy).toHaveBeenCalledTimes(1);
  });

  it('renders the i18n back label', () => {
    renderComponent();
    expect(screen.queryByText('Back')).not.toBeNull();
  });

  it('renders the translated label for a non-English locale', () => {
    renderComponent('fr', { 'alm.community.back.label': 'Retour' });
    expect(screen.queryByText('Retour')).not.toBeNull();
  });

  it('falls back to defaultMessage when translation is missing', () => {
    renderComponent('en', {});
    expect(screen.queryByText('Back')).not.toBeNull();
  });
});
