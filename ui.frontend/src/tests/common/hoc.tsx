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
import { Provider as ReduxProvider } from 'react-redux';
import { Provider as SpectrumProvider, defaultTheme } from '@adobe/react-spectrum';
import { BrowserRouter } from 'react-router-dom';
import { IntlProvider } from 'react-intl';
import store from '../../store/APIStore';

/**
 * Higher-order component that wraps a component with all necessary providers for testing
 *
 * @param Component - The component to wrap
 * @param props - Props to pass to the component
 * @returns The component wrapped with all providers
 */
export const withProviders = <P extends object>(
  Component: React.ComponentType<P>,
  props?: P
): React.ReactElement => {
  return (
    <BrowserRouter>
      <ReduxProvider store={store}>
        <IntlProvider locale="en" defaultLocale="en">
          <SpectrumProvider theme={defaultTheme}>
            <Component {...(props as P)} />
          </SpectrumProvider>
        </IntlProvider>
      </ReduxProvider>
    </BrowserRouter>
  );
};

/**
 * Creates a wrapper component with all necessary providers for React Testing Library
 *
 * @returns A wrapper component that can be used with the `wrapper` option in render()
 */
export const createTestWrapper = () => {
  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <BrowserRouter>
      <ReduxProvider store={store}>
        <IntlProvider locale="en" defaultLocale="en">
          <SpectrumProvider theme={defaultTheme}>{children}</SpectrumProvider>
        </IntlProvider>
      </ReduxProvider>
    </BrowserRouter>
  );
  return Wrapper;
};
