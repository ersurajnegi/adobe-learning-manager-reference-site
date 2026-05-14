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
import { render, screen } from '@testing-library/react';
import { AlertDialog, renderAlert } from '@common/Alert/AlertDialog';

const mockGetALMConfig = jest.fn();
const mockGetModalTheme = jest.fn();
const mockGetModalColorScheme = jest.fn();

jest.mock('@utils/global', () => ({
  getALMConfig: () => mockGetALMConfig(),
  getModalTheme: (theme: string) => mockGetModalTheme(theme),
  getModalColorScheme: (theme: string) => mockGetModalColorScheme(theme),
}));

jest.mock('@spectrum-icons/workflow/Alert', () =>
  function Alert(props: any) {
    return <svg data-testid="alert-icon" className={props.UNSAFE_className} />;
  }
);

jest.mock('@spectrum-icons/workflow/CheckmarkCircleOutline', () =>
  function CheckmarkCircleOutline(props: any) {
    return <svg data-testid="checkmark-icon" className={props.UNSAFE_className} />;
  }
);

jest.mock('@adobe/react-spectrum', () => ({
  Provider: ({ children }: any) => children,
}));

describe('AlertDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetALMConfig.mockReturnValue({ themeData: { name: 'light' } });
    mockGetModalTheme.mockReturnValue({});
    mockGetModalColorScheme.mockReturnValue('light');
  });

  describe('renderAlert', () => {
    it('renderAlert_success_rendersCheckmarkIconWithSuccessClass', () => {
      const { container } = render(<div>{renderAlert('success')}</div>);
      const icon = container.querySelector('[data-testid="checkmark-icon"]');
      expect(icon).not.toBeNull();
      expect(icon?.getAttribute('class')).toContain('success');
    });

    it('renderAlert_error_rendersAlertIconWithErrorClass', () => {
      const { container } = render(<div>{renderAlert('error')}</div>);
      const icon = container.querySelector('[data-testid="alert-icon"]');
      expect(icon).not.toBeNull();
      expect(icon?.getAttribute('class')).toContain('error');
    });
  });

  describe('AlertDialog component', () => {
    it('AlertDialog_showTrue_rendersAlertWithMessageAndAriaAttributes', () => {
      render(<AlertDialog type="success" show={true} message="Operation succeeded" />);
      const alert = screen.getByRole('alert');
      expect(alert.innerHTML).toContain('Operation succeeded');
      expect(alert.getAttribute('aria-live')).toBe('assertive');
      expect(alert.getAttribute('aria-atomic')).toBe('true');
    });

    it('AlertDialog_showFalse_doesNotRenderAlert', () => {
      render(<AlertDialog type="success" show={false} message="Test" />);
      expect(screen.queryByRole('alert')).toBeNull();
    });

    it('AlertDialog_successType_rendersCheckmarkIconNotAlertIcon', () => {
      const { container } = render(<AlertDialog type="success" show={true} message="OK" />);
      expect(container.querySelector('[data-testid="checkmark-icon"]')).not.toBeNull();
      expect(container.querySelector('[data-testid="alert-icon"]')).toBeNull();
    });

    it('AlertDialog_errorType_rendersAlertIconNotCheckmarkIcon', () => {
      const { container } = render(<AlertDialog type="error" show={true} message="Fail" />);
      expect(container.querySelector('[data-testid="alert-icon"]')).not.toBeNull();
      expect(container.querySelector('[data-testid="checkmark-icon"]')).toBeNull();
    });

    it('AlertDialog_htmlMessage_renderedViaInnerHTML', () => {
      render(<AlertDialog type="success" show={true} message="<strong>Bold</strong>" />);
      expect(screen.getByRole('alert').innerHTML).toBe('<strong>Bold</strong>');
    });

    it('AlertDialog_rerenderWithShowFalse_hidesAlert', () => {
      const { rerender } = render(<AlertDialog type="success" show={true} message="Test" />);
      expect(screen.getByRole('alert')).not.toBeNull();

      rerender(<AlertDialog type="success" show={false} message="Test" />);
      expect(screen.queryByRole('alert')).toBeNull();
    });

    it('AlertDialog_missingThemeData_passesUndefinedToGetModalTheme', () => {
      mockGetALMConfig.mockReturnValue({});
      render(<AlertDialog type="success" show={true} message="Test" />);
      expect(mockGetModalTheme).toHaveBeenCalledWith(undefined);
    });
  });
});
