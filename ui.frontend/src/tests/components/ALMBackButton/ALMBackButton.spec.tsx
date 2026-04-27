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
import { render, screen, fireEvent } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import ALMBackButton from '@components/Common/ALMBackButton/ALMBackButton';

jest.mock('@spectrum-icons/workflow/ChevronLeft', () => () => null);

jest.mock('@adobe/react-spectrum', () => ({
  ActionButton: ({ children, onPress }: any) => (
    <button onClick={onPress}>{children}</button>
  ),
}));

const renderComponent = (messages: Record<string, string> = { 'alm.community.back.label': 'Back' }) =>
  render(
    <IntlProvider locale="en" messages={messages}>
      <ALMBackButton />
    </IntlProvider>
  );

describe('ALMBackButton', () => {
  beforeEach(() => {
    window.history.back = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('click_callsHistoryBack', () => {
    renderComponent();

    fireEvent.click(screen.getByRole('button'));

    expect(window.history.back).toHaveBeenCalledTimes(1);
  });

  it('render_displaysLocalizedLabel', () => {
    renderComponent({ 'alm.community.back.label': 'Zurück' });

    expect(screen.getByText('Zurück')).not.toBeNull();
  });

  it('render_missingTranslation_usesDefaultMessage', () => {
    renderComponent({});

    expect(screen.getByText('Back')).not.toBeNull();
  });
});
