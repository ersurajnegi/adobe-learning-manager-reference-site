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
import { render, screen, fireEvent, act } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import ALMEffectivenessDialog from '@components/Common/ALMEffectivenessDialog/ALMEffectivenessDialog';

const mockSendEvent = jest.fn();
const mockGetTranslation = jest.fn((key: string) => key);
const mockGetTranslationReplaced = jest.fn((key: string, val: string) => `${key}:${val}`);
const mockGetPreferredLocalizedMetadata = jest.fn(() => ({ name: 'Test Course' }));

jest.mock('@utils/global', () => ({
  sendEvent: (event: any) => mockSendEvent(event),
}));

jest.mock('@utils/translationService', () => ({
  GetTranslation: (key: string, fallback?: boolean) => mockGetTranslation(key, fallback),
  GetTranslationReplaced: (key: string, val: string, fallback?: boolean) => mockGetTranslationReplaced(key, val, fallback),
  getPreferredLocalizedMetadata: (metadata: any, locale: string) => mockGetPreferredLocalizedMetadata(metadata, locale),
}));

jest.mock('@utils/widgets/common', () => ({
  PrimeEvent: {
    ALM_DISABLE_NAV_CONTROLS: 'ALM_DISABLE_NAV_CONTROLS',
    ALM_ENABLE_NAV_CONTROLS: 'ALM_ENABLE_NAV_CONTROLS',
  },
}));

jest.mock('@spectrum-icons/workflow/ChevronDown', () => () => <span data-testid="chevron-down" />);
jest.mock('@spectrum-icons/workflow/ChevronUp', () => () => <span data-testid="chevron-up" />);

let capturedOnDismiss: (() => void) | null = null;

jest.mock('@react-spectrum/dialog', () => ({
  DialogContainer: ({ children, onDismiss }: any) => {
    capturedOnDismiss = onDismiss;
    return <div>{children}</div>;
  },
  Dialog: ({ children }: any) => <div>{children}</div>,
}));

jest.mock('@adobe/react-spectrum', () => ({
  Provider: ({ children }: any) => <>{children}</>,
  ActionButton: ({ id }: any) => <button id={id} />,
  Heading: ({ children }: any) => <h2>{children}</h2>,
  Divider: () => <hr />,
  Content: ({ children }: any) => <div>{children}</div>,
}));

const mockTraining: any = {
  id: 'course:123',
  loType: 'course',
  effectivenessIndex: 85,
  effectivenessData: JSON.stringify({
    L1: { distribution: { 1: 5, 2: 10, 3: 20, 4: 30, 5: 35 } },
    totalCompletions: 100,
  }),
  localizedMetadata: [{ locale: 'en-US', name: 'Test Course' }],
};

const renderComponent = (props: Partial<{ onClose: any; training: any }> = {}) =>
  render(
    <IntlProvider locale="en" messages={{}}>
      <ALMEffectivenessDialog onClose={jest.fn()} training={mockTraining} {...props} />
    </IntlProvider>
  );

describe('ALMEffectivenessDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    capturedOnDismiss = null;
    mockGetTranslation.mockImplementation((key: string) => key);
    mockGetTranslationReplaced.mockImplementation((key: string, val: string) => `${key}:${val}`);
    mockGetPreferredLocalizedMetadata.mockReturnValue({ name: 'Test Course' });
  });

  it('mount_disablesNavControls', () => {
    renderComponent();

    expect(mockSendEvent).toHaveBeenCalledWith('ALM_DISABLE_NAV_CONTROLS');
  });

  it('mount_clicksShowAlertButtonOnce_notOnRerender', () => {
    const clickSpy = jest.spyOn(HTMLElement.prototype, 'click');

    const { rerender } = renderComponent();
    expect(clickSpy).toHaveBeenCalledTimes(1);

    rerender(
      <IntlProvider locale="en" messages={{}}>
        <ALMEffectivenessDialog onClose={jest.fn()} training={mockTraining} />
      </IntlProvider>
    );
    expect(clickSpy).toHaveBeenCalledTimes(1);

    clickSpy.mockRestore();
  });

  it('render_effectivenessIndex_displaysValue', () => {
    renderComponent();

    expect(screen.getByText(/85/)).not.toBeNull();
  });

  it('render_effectivenessIndex_null_displaysNotRated', () => {
    renderComponent({ training: { ...mockTraining, effectivenessIndex: null } });

    expect(mockGetTranslation).toHaveBeenCalledWith('text.notRated', undefined);
  });

  it('render_effectivenessIndex_zero_displaysNotRated', () => {
    renderComponent({ training: { ...mockTraining, effectivenessIndex: 0 } });

    expect(mockGetTranslation).toHaveBeenCalledWith('text.notRated', undefined);
  });

  it('render_loType_course_usesCourseTranslationKeys', () => {
    renderComponent();

    expect(mockGetTranslation).toHaveBeenCalledWith('effectiveness.heading.course', true);
    expect(mockGetTranslation).toHaveBeenCalledWith('effectiveness.calculation.course', true);
  });

  it('render_loType_learningProgram_usesLpTranslationKeys', () => {
    renderComponent({ training: { ...mockTraining, loType: 'learningProgram' } });

    expect(mockGetTranslation).toHaveBeenCalledWith('effectiveness.heading.learningProgram', true);
    expect(mockGetTranslation).toHaveBeenCalledWith('effectiveness.calculation.learningProgram', true);
  });

  it('helperText_noEffectivenessData_showsMeaningOnly', () => {
    renderComponent({ training: { ...mockTraining, effectivenessData: null } });

    expect(mockGetTranslation).toHaveBeenCalledWith('effectiveness.meaning.course', true);
    expect(mockGetTranslationReplaced).not.toHaveBeenCalled();
  });

  it('helperText_noL1Data_showsMeaningOnly', () => {
    renderComponent({
      training: {
        ...mockTraining,
        effectivenessData: JSON.stringify({ totalCompletions: 100 }),
      },
    });

    expect(mockGetTranslation).toHaveBeenCalledWith('effectiveness.meaning.course', true);
    expect(mockGetTranslationReplaced).not.toHaveBeenCalled();
  });

  it('helperText_allUsersGaveFeedback_shows100Percent', () => {
    renderComponent();

    // distribution: 5+10+20+30+35 = 100 out of 100 completions = 100%
    expect(mockGetTranslationReplaced).toHaveBeenCalledWith(
      'effectiveness.details.course',
      '100',
      true
    );
  });

  it('helperText_partialFeedback_calculatesCorrectPercent', () => {
    renderComponent({
      training: {
        ...mockTraining,
        effectivenessData: JSON.stringify({
          L1: { distribution: { 1: 10, 2: 10, 3: 10, 4: 10, 5: 10 } },
          totalCompletions: 100,
        }),
      },
    });

    // 50 out of 100 = 50%
    expect(mockGetTranslationReplaced).toHaveBeenCalledWith(
      'effectiveness.details.course',
      '50',
      true
    );
  });

  it('helperText_decimalPercent_floored', () => {
    renderComponent({
      training: {
        ...mockTraining,
        effectivenessData: JSON.stringify({
          L1: { distribution: { 1: 5, 2: 5, 3: 5, 4: 5, 5: 5 } },
          totalCompletions: 77,
        }),
      },
    });

    // 25/77 * 100 = 32.46… → floored to 32
    expect(mockGetTranslationReplaced).toHaveBeenCalledWith(
      'effectiveness.details.course',
      '32',
      true
    );
  });

  it('helperText_zeroCompletions_showsMeaningOnly', () => {
    renderComponent({
      training: {
        ...mockTraining,
        effectivenessData: JSON.stringify({
          L1: { distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } },
          totalCompletions: 0,
        }),
      },
    });

    expect(mockGetTranslation).toHaveBeenCalledWith('effectiveness.meaning.course', true);
    expect(mockGetTranslationReplaced).not.toHaveBeenCalled();
  });

  it('toggleLink_click_expandsContent', () => {
    renderComponent();

    fireEvent.click(screen.getByText('effectiveness.calculation.course'));

    expect(screen.getByTestId('chevron-up')).not.toBeNull();
    expect(screen.getByText('effectiveness.desc.course')).not.toBeNull();
  });

  it('toggleLink_clickTwice_collapsesContent', () => {
    renderComponent();

    const link = screen.getByText('effectiveness.calculation.course');
    fireEvent.click(link);
    fireEvent.click(link);

    expect(screen.getByTestId('chevron-down')).not.toBeNull();
    expect(screen.queryByText('effectiveness.desc.course')).toBeNull();
  });

  it('hideDialog_enablesNavAndCallsOnClose', () => {
    jest.useFakeTimers();
    const onClose = jest.fn();

    renderComponent({ onClose });
    act(() => { capturedOnDismiss!(); });
    act(() => { jest.advanceTimersByTime(0); });

    expect(mockSendEvent).toHaveBeenCalledWith('ALM_ENABLE_NAV_CONTROLS');
    expect(onClose).toHaveBeenCalledTimes(1);
    jest.useRealTimers();
  });
});
