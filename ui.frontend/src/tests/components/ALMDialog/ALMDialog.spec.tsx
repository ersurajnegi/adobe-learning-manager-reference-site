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
import { render, screen, fireEvent, act } from '@testing-library/react';
import {
  ALMDialog,
  ALMDialogHeader,
  ALMDialogContent,
  ALMDialogFooter,
} from '@components/ALMDialog/ALMDialog';

const mockIsOpen = jest.fn();
const mockCloseDialog = jest.fn();

jest.mock('@contextProviders/ALMDialogContextProvider', () => ({
  useDialog: () => ({ isOpen: mockIsOpen, closeDialog: mockCloseDialog }),
}));

jest.mock('@contextProviders/DeviceContextProvider', () => ({
  useDeviceTypeContext: () => ({ isDesktop: true, isMobile: false, isTablet: false }),
  DeviceTypeProvider: ({ children }: any) => <>{children}</>,
}));

jest.mock('@adobe/react-spectrum', () => ({
  View: ({ children }: any) => <div>{children}</div>,
  Content: ({ children }: any) => <div>{children}</div>,
  Flex: ({ children, justifyContent }: any) => <div data-justify={justifyContent}>{children}</div>,
}));

Object.defineProperty(window, 'scrollY', { writable: true, value: 0 });
window.scrollTo = jest.fn();

const renderDialog = (props: Partial<React.ComponentProps<typeof ALMDialog>> = {}) =>
  render(
    <ALMDialog id="test-dialog" {...props}>
      <div>Dialog Content</div>
    </ALMDialog>
  );

describe('ALMDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsOpen.mockReturnValue(true);
    window.scrollY = 100;
    document.body.classList.remove('noScroll');
    document.body.style.top = '';
  });

  it('render_dialogOpen_showsContent', () => {
    renderDialog();

    expect(screen.getByText('Dialog Content')).not.toBeNull();
  });

  it('render_dialogClosed_afterAnimation_returnsNull', () => {
    jest.useFakeTimers();
    mockIsOpen.mockReturnValue(true);
    const { rerender } = renderDialog();

    mockIsOpen.mockReturnValue(false);
    rerender(
      <ALMDialog id="test-dialog">
        <div>Dialog Content</div>
      </ALMDialog>
    );

    act(() => { jest.advanceTimersByTime(300); });

    expect(screen.queryByText('Dialog Content')).toBeNull();
    jest.useRealTimers();
  });

  it('overlayClick_overlayCloseTrue_callsCloseDialog', () => {
    const { container } = renderDialog({ overlayClose: true });

    fireEvent.click(container.querySelector('.almDialogOverlay') as HTMLElement);

    expect(mockCloseDialog).toHaveBeenCalledWith('test-dialog');
  });

  it('overlayClick_overlayCloseFalse_noCloseDialog', () => {
    const { container } = renderDialog({ overlayClose: false });

    fireEvent.click(container.querySelector('.almDialogOverlay') as HTMLElement);

    expect(mockCloseDialog).not.toHaveBeenCalled();
  });

  it('dialogClick_propagationStopped_noCloseDialog', () => {
    const { container } = renderDialog({ overlayClose: true });

    fireEvent.click(container.querySelector('.almDialog') as HTMLElement);

    expect(mockCloseDialog).not.toHaveBeenCalled();
  });

  it('height_provided_setsMinAndMaxHeight', () => {
    const { container } = renderDialog({ height: 80 });

    const dialog = container.querySelector('.almDialog') as HTMLElement;
    expect(dialog.style.minHeight).toBe('80vh');
    expect(dialog.style.maxHeight).toBe('80vh');
  });

  it('height_notProvided_defaultsToFiftyVh', () => {
    const { container } = renderDialog();

    const dialog = container.querySelector('.almDialog') as HTMLElement;
    expect(dialog.style.maxHeight).toBe('50vh');
  });

  it('height_zero_defaultsToFiftyVh', () => {
    const { container } = renderDialog({ height: 0 });

    const dialog = container.querySelector('.almDialog') as HTMLElement;
    expect(dialog.style.maxHeight).toBe('50vh');
  });

  it('stickyPosition_true_appliesStickyStyle', () => {
    const { container } = renderDialog({ stickyPosition: true });

    expect((container.querySelector('.almDialog') as HTMLElement).style.position).toBe('sticky');
  });

  it('stickyPosition_false_appliesRelativeStyle', () => {
    const { container } = renderDialog({ stickyPosition: false });

    expect((container.querySelector('.almDialog') as HTMLElement).style.position).toBe('relative');
  });

  it('direction_top_appliesTopClass', () => {
    const { container } = renderDialog({ direction: 'top' });

    expect(container.querySelector('.almDialogTop')).not.toBeNull();
  });

  it('direction_bottom_appliesBottomClass', () => {
    const { container } = renderDialog({ direction: 'bottom' });

    expect(container.querySelector('.almDialogBottom')).not.toBeNull();
  });

  it('borderRadius_default_appliesAllClass', () => {
    const { container } = renderDialog();

    expect(container.querySelector('.almDialogBorderRadiusAll')).not.toBeNull();
  });

  it('borderRadius_top_appliesTopClass', () => {
    const { container } = renderDialog({ borderRadius: 'top' });

    expect(container.querySelector('.almDialogBorderRadiusTop')).not.toBeNull();
  });

  it('scroll_onOpen_savesPositionAndAddsNoScrollClass', () => {
    window.scrollY = 250;

    renderDialog();

    expect(document.body.style.top).toBe('-250px');
    expect(document.body.classList.contains('noScroll')).toBe(true);
  });

  it('scroll_onUnmount_restoresPositionAndRemovesNoScrollClass', () => {
    const { unmount } = renderDialog();

    act(() => { unmount(); });

    expect(window.scrollTo).toHaveBeenCalledWith(0, 100);
    expect(document.body.classList.contains('noScroll')).toBe(false);
  });
});

describe('ALMDialogHeader', () => {
  it('render_showsChildren', () => {
    render(<ALMDialogHeader><h1>Title</h1></ALMDialogHeader>);

    expect(screen.getByText('Title')).not.toBeNull();
  });
});

describe('ALMDialogContent', () => {
  it('render_showsChildren', () => {
    render(<ALMDialogContent><p>Body</p></ALMDialogContent>);

    expect(screen.getByText('Body')).not.toBeNull();
  });
});

describe('ALMDialogFooter', () => {
  it('render_withAlign_passesJustifyContentToFlex', () => {
    const { container } = render(
      <ALMDialogFooter align="left"><button>OK</button></ALMDialogFooter>
    );

    expect(container.querySelector('[data-justify="left"]')).not.toBeNull();
  });

  it('render_noAlign_desktop_usesRightJustify', () => {
    const { container } = render(
      <ALMDialogFooter><button>OK</button></ALMDialogFooter>
    );

    expect(container.querySelector('[data-justify="right"]')).not.toBeNull();
  });
});
