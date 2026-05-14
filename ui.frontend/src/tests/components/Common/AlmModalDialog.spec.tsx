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
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import AlmModalDialog from '@components/Common/AlmModalDialog/AlmModalDialog';

const mockSendMessageToParent = jest.fn();
const mockGetPrimeEmitEventLinks = jest.fn();
const mockGetTranslation = jest.fn();
const mockCrossIcon = jest.fn();

jest.mock('@utils/widgets/base/EventHandlingBase', () => ({
  SendMessageToParent: (message: any, links: any) => mockSendMessageToParent(message, links),
}));

jest.mock('@utils/global', () => ({
  GetPrimeEmitEventLinks: () => mockGetPrimeEmitEventLinks(),
}));

jest.mock('@utils/translationService', () => ({
  GetTranslation: (key: string) => mockGetTranslation(key),
}));

jest.mock('@utils/inline_svg', () => ({
  CROSS_ICON: () => mockCrossIcon(),
}));

jest.mock('@utils/widgets/common', () => ({
  PrimeEvent: {
    MODAL_DIALOG_LAUNCHED: 'MODAL_DIALOG_LAUNCHED',
  },
}));

describe('AlmModalDialog', () => {
  const mockCloseDialog = jest.fn();
  const mockBody = <div data-testid="modal-body-content">Test body content</div>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockGetPrimeEmitEventLinks.mockReturnValue('test-event-link');
    mockGetTranslation.mockImplementation((key: string) => {
      if (key === 'text.ok') return 'OK';
      return key;
    });
    mockCrossIcon.mockReturnValue('×');
  });

  const renderComponent = (props = {}) => {
    return render(
      <AlmModalDialog
        title="Test Modal Title"
        showCrossButton={true}
        showCloseButton={true}
        body={mockBody}
        closeDialog={mockCloseDialog}
        {...props}
      />
    );
  };

  describe('Rendering', () => {
    it('should render body content inside the modal body', () => {
      const { container } = renderComponent();
      const bodyContainer = container.querySelector('[class*="modalBody"]');
      expect(bodyContainer?.querySelector('[data-testid="modal-body-content"]')).not.toBeNull();
    });
  });

  describe('Cross Button', () => {
    it('should render cross button when showCrossButton is true', () => {
      const { container } = renderComponent({ showCrossButton: true });
      const crossButton = container.querySelector('[class*="modalCloseButton"]');
      expect(crossButton).not.toBeNull();
      expect(crossButton?.tagName).toBe('BUTTON');
    });

    it('should not render cross button when showCrossButton is false', () => {
      const { container } = renderComponent({ showCrossButton: false });
      expect(container.querySelector('[class*="modalCloseButton"]')).toBeNull();
    });

    it('should call closeDialog when cross button clicked', () => {
      const { container } = renderComponent();
      fireEvent.click(container.querySelector('[class*="modalCloseButton"]') as HTMLElement);
      expect(mockCloseDialog).toHaveBeenCalledTimes(1);
    });
  });

  describe('Close Button', () => {
    it('should render close button when showCloseButton is true', () => {
      renderComponent({ showCloseButton: true });
      expect(screen.getByText('OK')).toBeInTheDocument();
    });

    it('should not render close button when showCloseButton is false', () => {
      renderComponent({ showCloseButton: false });
      expect(screen.queryByText('OK')).toBeNull();
    });

    it('should call closeDialog when close button clicked', () => {
      renderComponent({ showCloseButton: true });
      fireEvent.click(screen.getByText('OK'));
      expect(mockCloseDialog).toHaveBeenCalledTimes(1);
    });

    it('should call GetTranslation for button text', () => {
      renderComponent({ showCloseButton: true });
      expect(mockGetTranslation).toHaveBeenCalledWith('text.ok');
    });
  });

  describe('useEffect Hook', () => {
    it('should send message on mount', () => {
      renderComponent();
      expect(mockSendMessageToParent).toHaveBeenCalledWith(
        { type: 'MODAL_DIALOG_LAUNCHED' },
        'test-event-link'
      );
    });
  });

  describe('Accessibility', () => {
    it('should have tabIndex -1 on overlay', () => {
      const { container } = renderComponent();
      const overlay = container.querySelector('[class*="modalDialogOverlay"]');
      expect(overlay?.getAttribute('tabIndex')).toBe('-1');
    });

    it('should have title in modal header', () => {
      const { container } = renderComponent({ title: 'Accessible Title' });
      const title = container.querySelector('[class*="modalTitle"]');
      expect(title?.textContent).toBe('Accessible Title');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty title', () => {
      const { container } = renderComponent({ title: '' });
      expect(container.querySelector('[class*="modalTitle"]')?.textContent).toBe('');
    });

    it('should handle missing closeDialog function', () => {
      const { container } = renderComponent({ closeDialog: undefined });
      fireEvent.click(container.querySelector('[class*="modalCloseButton"]') as HTMLElement);
      expect(container.querySelector('[class*="modalDialogOverlay"]')).not.toBeNull();
    });

    it('should handle both buttons hidden', () => {
      const { container } = renderComponent({ showCrossButton: false, showCloseButton: false });
      expect(container.querySelector('[class*="modalCloseButton"]')).toBeNull();
      expect(screen.queryByText('OK')).toBeNull();
    });
  });

  describe('Multiple Renders', () => {
    it('should not call SendMessageToParent multiple times on rerender', () => {
      const { rerender } = renderComponent();
      expect(mockSendMessageToParent).toHaveBeenCalledTimes(1);

      rerender(
        <AlmModalDialog
          title="Updated Title"
          showCrossButton={true}
          showCloseButton={true}
          body={mockBody}
          closeDialog={mockCloseDialog}
        />
      );

      expect(mockSendMessageToParent).toHaveBeenCalledTimes(1);
    });

    it('should update title on rerender', () => {
      const { rerender } = renderComponent({ title: 'Original Title' });

      rerender(
        <AlmModalDialog
          title="Updated Title"
          showCrossButton={true}
          showCloseButton={true}
          body={mockBody}
          closeDialog={mockCloseDialog}
        />
      );

      expect(screen.getByText('Updated Title')).toBeInTheDocument();
      expect(screen.queryByText('Original Title')).toBeNull();
    });
  });
});
