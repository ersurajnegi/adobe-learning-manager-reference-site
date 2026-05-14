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
import React, { useRef } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider as SpectrumProvider, defaultTheme } from '@adobe/react-spectrum';
import { ALMPopup, ALMPopupContent } from '@components/ALMPopup/ALMPopup';
import { DeviceTypeProvider } from '@contextProviders/DeviceContextProvider';

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <SpectrumProvider theme={defaultTheme}>
      <DeviceTypeProvider>{component}</DeviceTypeProvider>
    </SpectrumProvider>
  );
};

describe('ALMPopup', () => {
  const defaultProps = {
    id: 'test-popup',
    children: <div>Popup Content</div>,
  };

  beforeEach(() => {
    Element.prototype.getBoundingClientRect = jest.fn(() => ({
      width: 100,
      height: 50,
      top: 100,
      bottom: 150,
      left: 50,
      right: 150,
      x: 50,
      y: 100,
      toJSON: () => {},
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should not render when isOpen is false', () => {
      renderWithProviders(<ALMPopup {...defaultProps} isOpen={false} />);

      expect(screen.queryByText('Popup Content')).toBeNull();
    });

    it('should render children when isOpen is true', () => {
      renderWithProviders(<ALMPopup {...defaultProps} isOpen={true} />);

      expect(screen.getByText('Popup Content')).toBeInTheDocument();
    });
  });

  describe('Direction Prop', () => {
    it('should apply top direction class', () => {
      const { container } = renderWithProviders(
        <ALMPopup {...defaultProps} direction="top" isOpen={true} />
      );
      expect(container.querySelector('#test-popup')!.className).toContain('almPopupTop');
    });

    it('should apply bottom direction class', () => {
      const { container } = renderWithProviders(
        <ALMPopup {...defaultProps} direction="bottom" isOpen={true} />
      );
      expect(container.querySelector('#test-popup')!.className).toContain('almPopupBottom');
    });
  });

  describe('Border Radius Prop', () => {
    it('should apply all border radius class by default', () => {
      const { container } = renderWithProviders(<ALMPopup {...defaultProps} isOpen={true} />);
      expect(container.querySelector('#test-popup')!.className).toContain('almPopupBorderRadiusAll');
    });

    it('should apply top border radius class', () => {
      const { container } = renderWithProviders(
        <ALMPopup {...defaultProps} borderRadius="top" isOpen={true} />
      );
      expect(container.querySelector('#test-popup')!.className).toContain('almPopupBorderRadiusTop');
    });
  });

  describe('Click Outside Handling', () => {
    it('should call onClose when clicking outside popup', () => {
      const onClose = jest.fn();

      renderWithProviders(
        <ALMPopup {...defaultProps} isOpen={true} onClose={onClose} closeOnClickOutside={true} />
      );

      fireEvent.mouseDown(document.body);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should not call onClose when clicking inside popup', () => {
      const onClose = jest.fn();

      renderWithProviders(
        <ALMPopup {...defaultProps} isOpen={true} onClose={onClose} closeOnClickOutside={true} />
      );

      fireEvent.mouseDown(screen.getByText('Popup Content'));

      expect(onClose).not.toHaveBeenCalled();
    });

    it('should not call onClose when closeOnClickOutside is false', () => {
      const onClose = jest.fn();

      renderWithProviders(
        <ALMPopup {...defaultProps} isOpen={true} onClose={onClose} closeOnClickOutside={false} />
      );

      fireEvent.mouseDown(document.body);

      expect(onClose).not.toHaveBeenCalled();
    });

    it('should not call onClose after unmount', () => {
      const onClose = jest.fn();

      const { unmount } = renderWithProviders(
        <ALMPopup {...defaultProps} isOpen={true} onClose={onClose} closeOnClickOutside={true} />
      );

      unmount();

      fireEvent.mouseDown(document.body);
      expect(onClose).not.toHaveBeenCalled();
    });

    it('should not add mousedown event listener when not open', () => {
      const addEventListenerSpy = jest.spyOn(document, 'addEventListener');

      renderWithProviders(<ALMPopup {...defaultProps} isOpen={false} closeOnClickOutside={true} />);

      expect(addEventListenerSpy).not.toHaveBeenCalledWith('mousedown', expect.any(Function));
    });

    it('should not throw when clicking outside without onClose handler', () => {
      renderWithProviders(<ALMPopup {...defaultProps} isOpen={true} closeOnClickOutside={true} />);
      expect(() => fireEvent.mouseDown(document.body)).not.toThrow();
    });
  });

  describe('TriggerRef Handling', () => {
    it('should not call onClose when clicking on trigger', () => {
      const onClose = jest.fn();

      const TestComponent = () => {
        const triggerRef = useRef<HTMLDivElement>(null);
        return (
          <>
            <div ref={triggerRef} data-testid="trigger">Trigger</div>
            <ALMPopup
              {...defaultProps}
              isOpen={true}
              triggerRef={triggerRef}
              onClose={onClose}
              closeOnClickOutside={true}
            />
          </>
        );
      };

      renderWithProviders(<TestComponent />);

      fireEvent.mouseDown(screen.getByTestId('trigger'));

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('CSS Classes Combination', () => {
    it('should combine almPopup, direction, and borderRadius classes', () => {
      const { container } = renderWithProviders(
        <ALMPopup {...defaultProps} direction="top" borderRadius="bottom" isOpen={true} />
      );

      const popup = container.querySelector('#test-popup');
      expect(popup?.classList.contains('almPopup')).toBe(true);
      expect(popup?.classList.contains('almPopupTop')).toBe(true);
      expect(popup?.classList.contains('almPopupBorderRadiusBottom')).toBe(true);
    });
  });
});

describe('ALMPopupContent', () => {
  it('should render children', () => {
    render(
      <SpectrumProvider theme={defaultTheme}>
        <ALMPopupContent>
          <div>Content</div>
        </ALMPopupContent>
      </SpectrumProvider>
    );
    expect(screen.getByText('Content')).toBeInTheDocument();
  });
});
