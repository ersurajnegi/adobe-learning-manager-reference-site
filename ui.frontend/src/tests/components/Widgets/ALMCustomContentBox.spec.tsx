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
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ALMCustomContentBox from '@components/Widgets/ALMCustomContentBox/ALMCustomContentBox';
import { ElementAlignmentValues } from '@models';

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('@utils/translationService', () => ({
  GetTranslation: jest.fn(),
}));

jest.mock('@hooks/customPages/useALMInspectMode', () => ({
  useWidgetInspectMode: jest.fn(),
}));

jest.mock('@contextProviders/ALMCustomPageProvider', () => ({
  useCustomPageContextProvider: jest.fn(),
}));

jest.mock('@components/CustomPages/ALMWidgetInspectMode/ALMWidgetInspectMode', () => ({
  __esModule: true,
  default: () => <div data-testid="inspect-mode" />,
}));

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const mockWidget = {
  id: 'widget-1',
  type: 'customContentBox',
  attributes: {
    pageUrl: 'https://example.com/learn',
    alignment: ElementAlignmentValues.LEFT,
    showGradient: false,
    height: 300,
    bgColor: '#4A90E2',
    titleColor: '#ffffff',
    descriptionColor: '#f0f0f0',
  },
} as any;

const mockAssets = {
  backgroundImage: {
    contentUrl: 'https://example.com/background.jpg',
    altText: 'Background',
  },
};

const mockChangeHoverState = jest.fn();

const renderComponent = (props: any = {}) =>
  render(
    <ALMCustomContentBox
      widget={mockWidget}
      assets={mockAssets}
      disableLinks={false}
      {...props}
    />
  );

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ALMCustomContentBox', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    const { GetTranslation } = require('@utils/translationService');
    GetTranslation.mockImplementation((key: string) =>
      ({
        'widget-1.title': 'Welcome to Learning',
        'widget-1.description': 'Start your learning journey',
        'widget-1.actionText': 'Get Started',
        'widget-1.backgroundAltText': 'Background alt text',
      }[key] ?? '')
    );

    const { useWidgetInspectMode } = require('@hooks/customPages/useALMInspectMode');
    useWidgetInspectMode.mockReturnValue({
      isHovered: false,
      widgetContainerWidth: 800,
      widgetContainerHeight: 300,
      changeHoverState: mockChangeHoverState,
    });

    const { useCustomPageContextProvider } = require('@contextProviders/ALMCustomPageProvider');
    useCustomPageContextProvider.mockReturnValue({ isInspectMode: false });
  });

  describe('Section Root', () => {
    it('sectionId_matchesWidgetId', () => {
      const { container } = renderComponent();
      expect(container.querySelector('section')?.id).toBe('widget-1');
    });

    it('sectionHeight_appliedFromAttributes', () => {
      const { container } = renderComponent();
      expect((container.querySelector('section') as HTMLElement).style.height).toBe('300px');
    });

    it('sectionBackgroundColor_appliedFromAttributes', () => {
      const { container } = renderComponent();
      // jsdom converts hex to rgb
      expect((container.querySelector('section') as HTMLElement).style.backgroundColor).toBe('rgb(74, 144, 226)');
    });
  });

  describe('Background Image', () => {
    it('backgroundImage_present_imgShownAndHasImageClassAdded', () => {
      const { container } = renderComponent();
      const img = container.querySelector('img');
      expect(img).not.toBeNull();
      expect(img?.src).toBe('https://example.com/background.jpg');
      expect(img?.alt).toBe('Background alt text');
      expect(container.querySelector('section')?.className).toContain('hasImage');
    });

    it('backgroundImage_absent_imgHiddenAndHasImageClassAbsent', () => {
      const { container } = renderComponent({ assets: {} });
      expect(container.querySelector('img')).toBeNull();
      expect(container.querySelector('section')?.className).not.toContain('hasImage');
    });
  });

  describe('Gradient', () => {
    it('showGradient_true_gradientDivRendered', () => {
      const { container } = renderComponent({
        widget: { ...mockWidget, attributes: { ...mockWidget.attributes, showGradient: true } },
      });
      expect(container.querySelector('[class*="gradient"]')).not.toBeNull();
    });

    it('showGradient_false_gradientDivHidden', () => {
      const { container } = renderComponent();
      expect(container.querySelector('[class*="gradient"]')).toBeNull();
    });
  });

  describe('Title', () => {
    it('title_nonEmpty_h2ShownWithAriaLabelledBy', () => {
      const { container } = renderComponent();
      const h2 = container.querySelector('h2');
      expect(h2).not.toBeNull();
      expect(h2?.textContent).toBe('Welcome to Learning');
      expect(container.querySelector('section')?.getAttribute('aria-labelledby')).toBe('widget-1-title');
    });

    it('title_empty_h2HiddenAndAriaLabelledByCleared', () => {
      const { container } = renderComponent({ widget: { ...mockWidget, id: 'widget-empty' } });
      expect(container.querySelector('h2')).toBeNull();
      expect(container.querySelector('section')?.getAttribute('aria-labelledby')).toBe('');
    });

    it('titleColor_undefined_defaultsToWhite', () => {
      const { container } = renderComponent({
        widget: { ...mockWidget, attributes: { ...mockWidget.attributes, titleColor: undefined } },
      });
      expect((container.querySelector('h2') as HTMLElement).style.color).toBe('rgb(255, 255, 255)');
    });
  });

  describe('Description', () => {
    it('description_nonEmpty_pShownWithAriaDescribedBy', () => {
      const { container } = renderComponent();
      const p = container.querySelector('p');
      expect(p).not.toBeNull();
      expect(p?.textContent).toBe('Start your learning journey');
      expect(container.querySelector('section')?.getAttribute('aria-describedby')).toBe('widget-1-description');
    });

    it('description_empty_pHiddenAndAriaDescribedByCleared', () => {
      const { container } = renderComponent({ widget: { ...mockWidget, id: 'widget-empty' } });
      expect(container.querySelector('p')).toBeNull();
      expect(container.querySelector('section')?.getAttribute('aria-describedby')).toBe('');
    });

    it('descriptionColor_undefined_defaultsToWhite', () => {
      const { container } = renderComponent({
        widget: { ...mockWidget, attributes: { ...mockWidget.attributes, descriptionColor: undefined } },
      });
      expect((container.querySelector('p') as HTMLElement).style.color).toBe('rgb(255, 255, 255)');
    });
  });

  describe('Action Link', () => {
    it('actionText_present_linkRenderedWithHrefTargetRel', () => {
      const { container } = renderComponent();
      const link = container.querySelector('a');
      expect(link).not.toBeNull();
      expect(link?.getAttribute('href')).toBe('https://example.com/learn');
      expect(link?.target).toBe('_blank');
      expect(link?.rel).toBe('noreferrer');
      expect(link?.textContent).toBe('Get Started');
    });

    it('actionText_empty_linkNotRendered', () => {
      const { container } = renderComponent({ widget: { ...mockWidget, id: 'widget-empty' } });
      expect(container.querySelector('a')).toBeNull();
    });

    it('disableLinks_true_linkDisabledWithAriaAndTabIndex', () => {
      const { container } = renderComponent({ disableLinks: true });
      const link = container.querySelector('a')!;
      expect(link.className).toContain('disabled');
      expect(link.getAttribute('aria-disabled')).toBe('true');
      expect(link.tabIndex).toBe(-1);
    });

    it('disableLinks_false_linkEnabledWithAriaAndTabIndex', () => {
      const { container } = renderComponent({ disableLinks: false });
      const link = container.querySelector('a')!;
      expect(link.className).not.toContain('disabled');
      expect(link.getAttribute('aria-disabled')).toBe('false');
      expect(link.tabIndex).toBe(0);
    });
  });

  describe('Alignment', () => {
    it('alignment_left_startClassApplied', () => {
      const { container } = renderComponent();
      // ElementAlignmentValues.LEFT = 'start'
      expect(container.querySelector('[class*="contents"]')?.className).toContain(ElementAlignmentValues.LEFT);
    });

    it('alignment_center_centerClassApplied', () => {
      const { container } = renderComponent({
        widget: { ...mockWidget, attributes: { ...mockWidget.attributes, alignment: ElementAlignmentValues.CENTER } },
      });
      expect(container.querySelector('[class*="contents"]')?.className).toContain(ElementAlignmentValues.CENTER);
    });

    it('alignment_right_endClassApplied', () => {
      const { container } = renderComponent({
        widget: { ...mockWidget, attributes: { ...mockWidget.attributes, alignment: ElementAlignmentValues.RIGHT } },
      });
      expect(container.querySelector('[class*="contents"]')?.className).toContain(ElementAlignmentValues.RIGHT);
    });
  });

  describe('Inspect Mode', () => {
    it('inspectMode_true_hovered_overlayShown', () => {
      const { useWidgetInspectMode } = require('@hooks/customPages/useALMInspectMode');
      useWidgetInspectMode.mockReturnValue({ isHovered: true, widgetContainerWidth: 800, widgetContainerHeight: 300, changeHoverState: mockChangeHoverState });
      const { useCustomPageContextProvider } = require('@contextProviders/ALMCustomPageProvider');
      useCustomPageContextProvider.mockReturnValue({ isInspectMode: true });
      renderComponent();
      expect(screen.getByTestId('inspect-mode')).toBeInTheDocument();
    });

    it('inspectMode_true_notHovered_overlayHidden', () => {
      const { useCustomPageContextProvider } = require('@contextProviders/ALMCustomPageProvider');
      useCustomPageContextProvider.mockReturnValue({ isInspectMode: true });
      // isHovered = false (default)
      renderComponent();
      expect(screen.queryByTestId('inspect-mode')).toBeNull();
    });

    it('inspectMode_false_hovered_overlayHidden', () => {
      const { useWidgetInspectMode } = require('@hooks/customPages/useALMInspectMode');
      useWidgetInspectMode.mockReturnValue({ isHovered: true, widgetContainerWidth: 800, widgetContainerHeight: 300, changeHoverState: mockChangeHoverState });
      // isInspectMode = false (default)
      renderComponent();
      expect(screen.queryByTestId('inspect-mode')).toBeNull();
    });
  });

  describe('Hover Events', () => {
    it('mouseEnter_callsChangeHoverState', () => {
      const { container } = renderComponent();
      fireEvent.mouseEnter(container.querySelector('section')!);
      expect(mockChangeHoverState).toHaveBeenCalledTimes(1);
    });

    it('mouseLeave_callsChangeHoverState', () => {
      const { container } = renderComponent();
      fireEvent.mouseLeave(container.querySelector('section')!);
      expect(mockChangeHoverState).toHaveBeenCalledTimes(1);
    });
  });
});
