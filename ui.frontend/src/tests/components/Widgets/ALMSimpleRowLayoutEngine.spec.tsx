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
import { act } from 'react-dom/test-utils';
import ALMSimpleRowLayoutEngine from '@components/Widgets/ALMSimpleRowLayoutEngine/ALMSimpleRowLayoutEngine';
import { WidgetTypeNew, PrimeEvent } from '@utils/widgets/common';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockSendSkipLinksEvent = jest.fn();
const mockDebounce = jest.fn();

jest.mock('@utils/catalog', () => ({
  debounce: (fn: any) => mockDebounce(fn),
}));

jest.mock('@components/Widgets/ALMPrimeStrip/ALMPrimeStrip.helper', () => ({
  sendSkipLinksEvent: (...args: any[]) => mockSendSkipLinksEvent(...args),
}));

jest.mock('@components/Widgets/ALMPrimeStrip', () => ({
  ALMPrimeStrip: ({ widget }: any) => <div data-testid={`prime-strip-${widget.id}`} />,
}));

jest.mock('@components/Widgets/ALMPrimeRecommendations', () => ({
  ALMPrimeRecommendations: ({ widget }: any) => <div data-testid={`recommendations-${widget.id}`} />,
}));

jest.mock('@components/CalendarWidget', () => ({
  CalendarWidget: ({ widget }: any) => <div data-testid={`calendar-${widget.id}`} />,
}));

jest.mock('@components/Widgets/ALMSocialLearningWidget', () => ({
  ALMSocialLearning: ({ widget }: any) => <div data-testid={`social-${widget.id}`} />,
}));

jest.mock('@components/Widgets/ALMLeaderboard', () => ({
  ALMLeaderboard: ({ widget }: any) => <div data-testid={`leaderboard-${widget.id}`} />,
}));

jest.mock('@components/Widgets/ALMComplianceWidget', () => ({
  ALMCompliance: ({ widget }: any) => <div data-testid={`compliance-${widget.id}`} />,
}));

jest.mock('@components/Masthead', () => ({
  ALMMasthead: ({ widget }: any) => <div data-testid={`masthead-${widget.id}`} />,
}));

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const mockAccount = {
  id: 'account-1',
  showComplianceLabel: false,
  complianceLabelDefaultValueId: '',
  catalogsVisible: true,
} as any;

const mockUser = { id: 'user-1' } as any;

const makeWidget = (type: WidgetTypeNew | string, id = 'w1') => ({
  id,
  type,
  widgetRef: `ref-${type}`,
  layoutAttributes: { id: `layout-${id}`, width: '400px' },
});

const makeConfig = (widgets: any[], parentWidth = '100%') => ({
  widgets: [{ id: 'row-1', parentContainerWidth: parentWidth, widgets }],
});

const renderComponent = (config: any, accountOverrides: any = {}) =>
  render(
    <ALMSimpleRowLayoutEngine
      config={config}
      doRefresh={false}
      aoiStripCount={{}}
      account={{ ...mockAccount, ...accountOverrides }}
      user={mockUser}
    />
  );

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ALMSimpleRowLayoutEngine', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // resetMocks:true clears mockDebounce's implementation; restore it so
    // debounce(fn) returns fn instead of undefined.
    mockDebounce.mockImplementation((fn: any) => fn);
  });

  describe('Widget Type Dispatch', () => {
    it('masthead_widgetType_mastheadComponentRendered', () => {
      renderComponent(makeConfig([makeWidget(WidgetTypeNew.MASTHEAD)]));
      expect(screen.getByTestId('masthead-w1')).toBeInTheDocument();
    });

    // MYLEARNING is representative of the 9-case fall-through to ALMPrimeStrip
    // (MYLEARNING, RECOMMENDATIONS_STRIP, ADMIN_RECO, BOOKMARKS, VIRTUAL_COACH,
    //  TRENDING_RECO, AOI_RECO, DISCOVERY_RECO, CATALOG all share this branch)
    it('primeStrip_widgetTypes_primeStripComponentRendered', () => {
      renderComponent(makeConfig([makeWidget(WidgetTypeNew.MYLEARNING)]));
      expect(screen.getByTestId('prime-strip-w1')).toBeInTheDocument();
    });

    it('calendar_widgetType_calendarWidgetRendered', () => {
      renderComponent(makeConfig([makeWidget(WidgetTypeNew.CALENDAR)]));
      expect(screen.getByTestId('calendar-w1')).toBeInTheDocument();
    });

    it('gamification_widgetType_leaderboardRendered', () => {
      renderComponent(makeConfig([makeWidget(WidgetTypeNew.GAMIFICATION)]));
      expect(screen.getByTestId('leaderboard-w1')).toBeInTheDocument();
    });

    it('social_widgetType_socialLearningRendered', () => {
      renderComponent(makeConfig([makeWidget(WidgetTypeNew.SOCIAL)]));
      expect(screen.getByTestId('social-w1')).toBeInTheDocument();
    });

    it('compliance_widgetType_complianceRendered', () => {
      renderComponent(makeConfig([makeWidget(WidgetTypeNew.COMPLIANCE)]));
      expect(screen.getByTestId('compliance-w1')).toBeInTheDocument();
    });

    it('recommendations_widgetType_primeRecommendationsRendered', () => {
      renderComponent(makeConfig([makeWidget(WidgetTypeNew.RECOMMENDATIONS)]));
      expect(screen.getByTestId('recommendations-w1')).toBeInTheDocument();
    });

    it('footer_widgetType_noNamedChildComponentRendered', () => {
      // Footer branch renders an empty placeholder div; no widget component mounted
      renderComponent(makeConfig([makeWidget(WidgetTypeNew.FOOTER)]));
      expect(screen.queryByTestId('prime-strip-w1')).toBeNull();
      expect(screen.queryByTestId('masthead-w1')).toBeNull();
    });

    it('catalogBrowser_catalogsVisible_primeStripRendered', () => {
      renderComponent(makeConfig([makeWidget(WidgetTypeNew.CATALOG_BROWSER)]), { catalogsVisible: true });
      expect(screen.getByTestId('prime-strip-w1')).toBeInTheDocument();
    });

    it('catalogBrowser_catalogsHidden_nothingRendered', () => {
      renderComponent(makeConfig([makeWidget(WidgetTypeNew.CATALOG_BROWSER)]), { catalogsVisible: false });
      expect(screen.queryByTestId('prime-strip-w1')).toBeNull();
    });

    it('unsupportedType_consoleErrorLoggedAndNoWidgetRendered', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      renderComponent(makeConfig([makeWidget('UNSUPPORTED')]));
      expect(consoleSpy).toHaveBeenCalledWith('Widget not supported', 'ref-UNSUPPORTED');
      expect(screen.queryByTestId(/^prime-strip/)).toBeNull();
      consoleSpy.mockRestore();
    });
  });

  describe('Layout Width', () => {
    it('singleWidgetRow_sectionWidthIsParentContainerWidth', () => {
      const { container } = renderComponent(makeConfig([makeWidget(WidgetTypeNew.MYLEARNING)], '1200px'));
      expect(container.querySelector('section')?.getAttribute('style')).toContain('1200px');
    });

    it('singleWidgetRow_innerDivWidthIsParentContainerWidth', () => {
      const { container } = renderComponent(makeConfig([makeWidget(WidgetTypeNew.MYLEARNING)], '1200px'));
      const innerDiv = container.querySelector('section > div');
      expect(innerDiv?.getAttribute('style')).toContain('1200px');
    });

    it('multipleWidgetsInRow_innerDivWidthIsLayoutAttributesWidth', () => {
      const { container } = renderComponent(
        makeConfig([makeWidget(WidgetTypeNew.MYLEARNING, 'w1'), makeWidget(WidgetTypeNew.CALENDAR, 'w2')])
      );
      const divs = container.querySelectorAll('section > div');
      // Each widget's layoutAttributes.width ('400px') is used when row has >1 widget
      expect(divs[0].getAttribute('style')).toContain('400px');
      expect(divs[1].getAttribute('style')).toContain('400px');
    });
  });

  describe('Skip Links & Event Lifecycle', () => {
    it('onMount_sendSkipLinksEventCalledWithConfigWidgets', () => {
      const config = makeConfig([makeWidget(WidgetTypeNew.MYLEARNING)]);
      renderComponent(config);
      // Called immediately on mount (not debounced path) with rows and empty strip list
      expect(mockSendSkipLinksEvent).toHaveBeenCalledWith(config.widgets, []);
    });

    it('onMount_widgetsToRenderEventListenerRegistered', () => {
      const spy = jest.spyOn(document, 'addEventListener');
      renderComponent(makeConfig([makeWidget(WidgetTypeNew.MYLEARNING)]));
      expect(spy).toHaveBeenCalledWith(PrimeEvent.WIDGETS_TO_RENDER, expect.any(Function));
      spy.mockRestore();
    });

    it('onUnmount_widgetsToRenderEventListenerRemoved', () => {
      const removeSpy = jest.spyOn(document, 'removeEventListener');
      const { unmount } = renderComponent(makeConfig([makeWidget(WidgetTypeNew.MYLEARNING)]));
      act(() => { unmount(); });
      expect(removeSpy).toHaveBeenCalledWith(PrimeEvent.WIDGETS_TO_RENDER, expect.any(Function));
      removeSpy.mockRestore();
    });
  });

  describe('Edge Cases', () => {
    it('emptyConfig_noSectionsRendered', () => {
      const { container } = render(
        <ALMSimpleRowLayoutEngine
          config={{ widgets: [] }}
          doRefresh={false}
          aoiStripCount={{}}
          account={mockAccount}
          user={mockUser}
        />
      );
      expect(container.querySelector('section')).toBeNull();
    });

    it('multipleRows_eachRowRenderedAsSeparateSection', () => {
      const config = {
        widgets: [
          { id: 'row-1', parentContainerWidth: '100%', widgets: [makeWidget(WidgetTypeNew.MYLEARNING, 'w1')] },
          { id: 'row-2', parentContainerWidth: '100%', widgets: [makeWidget(WidgetTypeNew.CALENDAR, 'w2')] },
        ],
      };
      const { container } = renderComponent(config);
      expect(container.querySelectorAll('section')).toHaveLength(2);
      expect(screen.getByTestId('prime-strip-w1')).toBeInTheDocument();
      expect(screen.getByTestId('calendar-w2')).toBeInTheDocument();
    });
  });
});
