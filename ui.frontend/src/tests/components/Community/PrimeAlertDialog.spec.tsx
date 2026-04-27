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
import PrimeAlertDialog from '../../../almLib/components/Community/PrimeAlertDialog/PrimeAlertDialog';

const mockGetALMConfig = jest.fn();
const mockGetModalTheme = jest.fn();
const mockGetModalColorScheme = jest.fn();
const mockSendEvent = jest.fn();
const mockOnPrimaryAction = jest.fn();
const mockOnSecondaryAction = jest.fn();

jest.mock('../../../almLib/utils/global', () => ({
  getALMConfig: () => mockGetALMConfig(),
  getModalTheme: (themeName: string) => mockGetModalTheme(themeName),
  getModalColorScheme: (themeName: string) => mockGetModalColorScheme(themeName),
  sendEvent: (event: string) => mockSendEvent(event),
}));

jest.mock('../../../almLib/utils/widgets/common', () => ({
  PrimeEvent: {
    ALM_DISABLE_NAV_CONTROLS: 'ALM_DISABLE_NAV_CONTROLS',
    ALM_ENABLE_NAV_CONTROLS: 'ALM_ENABLE_NAV_CONTROLS',
  },
}));

jest.mock('@adobe/react-spectrum', () => ({
  Provider: ({ children, theme, colorScheme }: any) => (
    <div data-testid="provider" data-theme={theme} data-color-scheme={colorScheme}>
      {children}
    </div>
  ),
  DialogTrigger: ({ children }: any) => {
    const childArray = Array.isArray(children) ? children : [children];
    return (
      <div data-testid="dialog-trigger">
        {childArray[0]}
        <div data-testid="dialog-content">{childArray[1]}</div>
      </div>
    );
  },
  ActionButton: ({ id, UNSAFE_className }: any) => (
    <button id={id} className={UNSAFE_className} />
  ),
  AlertDialog: ({ onPrimaryAction, onSecondaryAction, UNSAFE_className, children }: any) => (
    <div data-testid="alert-dialog" className={UNSAFE_className}>
      <div data-testid="dialog-body">{children}</div>
      <button onClick={onPrimaryAction} data-testid="primary-action-btn">Primary</button>
      <button onClick={onSecondaryAction} data-testid="secondary-action-btn">Secondary</button>
    </div>
  ),
}));

describe('PrimeAlertDialog', () => {
  const defaultProps = {
    show: true,
    variant: 'confirmation',
    title: 'Confirm Action',
    body: 'Are you sure?',
    primaryActionLabel: 'Confirm',
    onPrimaryAction: mockOnPrimaryAction,
    secondaryActionLabel: 'Cancel',
    onSecondaryAction: mockOnSecondaryAction,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetALMConfig.mockReturnValue({ themeData: { name: 'light' } });
    mockGetModalTheme.mockReturnValue('lightTheme');
    mockGetModalColorScheme.mockReturnValue('light');
  });

  it('renders dialog when show is true', () => {
    render(<PrimeAlertDialog {...defaultProps} show={true} />);
    expect(screen.queryByTestId('provider')).not.toBeNull();
  });

  it('renders nothing when show is false', () => {
    render(<PrimeAlertDialog {...defaultProps} show={false} />);
    expect(screen.queryByTestId('provider')).toBeNull();
  });

  it('sends ALM_DISABLE_NAV_CONTROLS on mount when show is true', () => {
    render(<PrimeAlertDialog {...defaultProps} show={true} />);
    expect(mockSendEvent).toHaveBeenCalledWith('ALM_DISABLE_NAV_CONTROLS');
    expect(mockSendEvent).toHaveBeenCalledTimes(1);
  });

  it('does not send any events when show is false', () => {
    render(<PrimeAlertDialog {...defaultProps} show={false} />);
    expect(mockSendEvent).not.toHaveBeenCalled();
  });

  it('calls onPrimaryAction and sends ALM_ENABLE_NAV_CONTROLS on primary button click', () => {
    render(<PrimeAlertDialog {...defaultProps} />);
    userEvent.click(screen.getByTestId('primary-action-btn'));
    expect(mockOnPrimaryAction).toHaveBeenCalledTimes(1);
    expect(mockSendEvent).toHaveBeenCalledWith('ALM_ENABLE_NAV_CONTROLS');
  });

  it('sends ALM_ENABLE_NAV_CONTROLS on primary click even when onPrimaryAction is not provided', () => {
    render(<PrimeAlertDialog {...defaultProps} onPrimaryAction={undefined} />);
    userEvent.click(screen.getByTestId('primary-action-btn'));
    expect(mockOnPrimaryAction).not.toHaveBeenCalled();
    expect(mockSendEvent).toHaveBeenCalledWith('ALM_ENABLE_NAV_CONTROLS');
  });

  it('calls onSecondaryAction and sends ALM_ENABLE_NAV_CONTROLS on secondary button click', () => {
    render(<PrimeAlertDialog {...defaultProps} />);
    userEvent.click(screen.getByTestId('secondary-action-btn'));
    expect(mockOnSecondaryAction).toHaveBeenCalledTimes(1);
    expect(mockSendEvent).toHaveBeenCalledWith('ALM_ENABLE_NAV_CONTROLS');
  });

  it('sends ALM_ENABLE_NAV_CONTROLS on secondary click even when onSecondaryAction is not provided', () => {
    render(<PrimeAlertDialog {...defaultProps} onSecondaryAction={undefined} />);
    userEvent.click(screen.getByTestId('secondary-action-btn'));
    expect(mockOnSecondaryAction).not.toHaveBeenCalled();
    expect(mockSendEvent).toHaveBeenCalledWith('ALM_ENABLE_NAV_CONTROLS');
  });

  it('passes theme and colorScheme derived from config to Provider', () => {
    render(<PrimeAlertDialog {...defaultProps} />);
    const provider = screen.getByTestId('provider');
    expect(mockGetModalTheme).toHaveBeenCalledWith('light');
    expect(mockGetModalColorScheme).toHaveBeenCalledWith('light');
    expect(provider).toHaveAttribute('data-theme', 'lightTheme');
    expect(provider).toHaveAttribute('data-color-scheme', 'light');
  });

  it('uses dark theme and colorScheme when config specifies dark', () => {
    mockGetALMConfig.mockReturnValue({ themeData: { name: 'dark' } });
    mockGetModalTheme.mockReturnValue('darkTheme');
    mockGetModalColorScheme.mockReturnValue('dark');

    render(<PrimeAlertDialog {...defaultProps} />);
    const provider = screen.getByTestId('provider');
    expect(provider).toHaveAttribute('data-theme', 'darkTheme');
    expect(provider).toHaveAttribute('data-color-scheme', 'dark');
  });

  it('passes undefined to theme helpers when themeData is absent', () => {
    mockGetALMConfig.mockReturnValue({});
    render(<PrimeAlertDialog {...defaultProps} />);
    expect(mockGetModalTheme).toHaveBeenCalledWith(undefined);
    expect(mockGetModalColorScheme).toHaveBeenCalledWith(undefined);
  });
});
