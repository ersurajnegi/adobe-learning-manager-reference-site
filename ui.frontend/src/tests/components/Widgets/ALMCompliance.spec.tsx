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
import { IntlProvider } from 'react-intl';
import ALMCompliance from '../../../almLib/components/Widgets/ALMComplianceWidget/ALMCompliance';

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('../../../almLib/utils/translationService', () => ({
  GetTranslation: (key: string) => key,
  GetTranslationReplaced: (key: string, value: any) => `${key}:${value}`,
  GetTranslationsReplaced: (key: string, params: any) => `${key}:${JSON.stringify(params)}`,
}));

jest.mock('../../../almLib/hooks/compliance', () => ({
  useCompliance: jest.fn(),
}));

jest.mock('../../../almLib/hooks/widgets/useWidgetLayout', () => ({
  useWidgetLayout: jest.fn(),
}));

jest.mock('../../../almLib/contextProviders/userContextProvider', () => ({
  useUserContext: jest.fn(),
}));

jest.mock('../../../almLib/hooks/customPages/useALMInspectMode', () => ({
  useWidgetInspectMode: jest.fn(),
}));

jest.mock('../../../almLib/utils/widgets/utils', () => ({
  getIsCustomPage: jest.fn(),
  GetFormattedDateForCompliance: (date: string) => `Formatted:${date}`,
  getDonutDimensions: () => ({
    outerRadius: 50,
    innerRadius: 30,
    svgHeight: 200,
    transformY: 100,
    fullDonutSvgPath: 'M 50 0 A 50 50 0 1 1 -50 0 A 50 50 0 1 1 50 0',
  }),
}));

jest.mock('../../../almLib/utils/global', () => ({
  getALMObject: jest.fn(),
}));

jest.mock('../../../almLib/utils/widgets/base/EventHandlingBase', () => ({
  SendMessageToParent: jest.fn(),
}));

jest.mock('../../../almLib/utils/themes', () => ({
  GetTileColor: () => '#cccccc',
  GetTileImageFromId: () => 'default-image.png',
}));

jest.mock('../../../almLib/utils/inline_svg', () => ({
  EMPTY_STATE_CARD: () => <svg data-testid="empty-state-icon" />,
  COMPLIANCE_MORE_ENROLLMENTS: () => <svg data-testid="more-enrollments-icon" />,
}));

jest.mock('../../../almLib/components/Common/ALMErrorBoundary', () => ({
  ALMErrorBoundary: ({ children }: any) => <div data-testid="error-boundary">{children}</div>,
}));

jest.mock('../../../almLib/components/CustomPages/ALMStripWidgetHeader/ALMStripWidgetHeader', () => ({
  __esModule: true,
  default: () => <div data-testid="strip-widget-header" />,
}));

jest.mock('../../../almLib/components/CustomPages/ALMWidgetLoader/ALMWidgetLoader', () => ({
  __esModule: true,
  default: () => <div data-testid="widget-loader" />,
}));

jest.mock('../../../almLib/components/CustomPages/ALMWidgetInspectMode/ALMWidgetInspectMode', () => ({
  __esModule: true,
  default: () => <div data-testid="inspect-mode" />,
}));

jest.mock('@adobe/react-spectrum', () => ({
  Divider: ({ orientation }: any) => <hr data-testid="divider" data-orientation={orientation} />,
  Item: ({ children, ...props }: any) => <option {...props}>{children}</option>,
  Picker: ({ children, selectedKey, onSelectionChange, 'aria-label': ariaLabel }: any) => (
    <select
      data-testid="compliance-dropdown"
      aria-label={ariaLabel}
      value={selectedKey || ''}
      onChange={e => onSelectionChange && onSelectionChange(e.target.value)}
    >
      {children}
    </select>
  ),
  StatusLight: ({ children }: any) => <span data-testid="status-light">{children}</span>,
}));

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const mockWidget = {
  id: 'compliance-widget-1',
  attributes: { heading: 'Compliance', disableLinks: false },
} as any;

const mockEnrollment = {
  id: 'enrollment-1',
  learningObject: {
    id: 'lo-1',
    loType: 'course',
    imageUrl: 'https://example.com/image.png',
    localizedMetadata: [{ name: 'Test Course' }],
  },
  loInstance: { id: 'instance-1' },
  completionDeadline: '2099-12-31T00:00:00.000Z',
  enrollmentSource: 'SELF_ENROLLED',
  progressPercent: 50,
};

const makeDonutStyles = () => ({
  color: '#aabbcc',
  pathData: '',
  lineStart: { x: 0, y: 0 },
  lineEnd: { x: 0, y: 0 },
  annotationPosition: { x: 0, y: 0 },
  isLeftSlice: false,
  tranformDirection: { x: 0, y: 0 },
  slantingLineStart: { x: 0, y: 0 },
  slantingLineEnd: { x: 0, y: 0 },
});

const mockComplianceData = {
  OVERDUE: { name: 'OVERDUE', count: 5, enrollmentList: { learningObjectInstanceEnrollmentList: [] }, donutStyles: makeDonutStyles() },
  UPCOMING: { name: 'UPCOMING', count: 10, enrollmentList: { learningObjectInstanceEnrollmentList: [] }, donutStyles: makeDonutStyles() },
  ONTRACK: { name: 'ONTRACK', count: 15, enrollmentList: { learningObjectInstanceEnrollmentList: [] }, donutStyles: makeDonutStyles() },
};

// ALL_DEADLINES constant = 'ALL' in widgets/common
const makeComplianceReturn = (overrides: any = {}) => ({
  isEnrollmentsOverLimit: 'false',
  getDeadlineCategory: jest.fn(() => 'UPCOMING'),
  complianceData: mockComplianceData,
  COMPLIANCE_VIEWS: { COMPLIANCE: 'COMPLIANCE', SESSIONS: 'SESSIONS' },
  COMPLIANCE_COLORS: { OVERDUE: '#D7373F', UPCOMING: '#F5A700', ONTRACK: '#18A957' },
  allEnrollmentsData: {
    count: 1,
    enrollmentList: { learningObjectInstanceEnrollmentList: [mockEnrollment] },
  },
  complianceLabelValueDetails: { values: [] },
  isLoading: false,
  fetchingData: false,
  getSelectedCategoryData: jest.fn(() => ({
    count: 0,
    enrollmentList: { learningObjectInstanceEnrollmentList: [] },
  })),
  cpCatagorySelected: { current: 'ALL' }, // ALL_DEADLINES = 'ALL'
  handleScroll: jest.fn(),
  handleComplianceLabelValueChange: jest.fn(),
  selectedComplianceValueId: { current: '' },
  reloadDonutForNewCategory: { current: false },
  totalEnrollmentCount: 30,
  ...overrides,
});

const makeWidgetLayoutReturn = (noOfCards = 1) => ({
  containerWidth: noOfCards === 2 ? 800 : 400,
  noOfCards,
  sectionRef: { current: null },
  singleCardWidth: 400,
  widgetId: 'widget-123',
});

const renderComponent = (props: any = {}) =>
  render(
    <IntlProvider locale="en" messages={{}}>
      <ALMCompliance widget={mockWidget} {...props} />
    </IntlProvider>
  );

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ALMCompliance', () => {
  let mockNavigate: jest.Mock;
  let mockNavigateToMyLearning: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate = jest.fn();
    mockNavigateToMyLearning = jest.fn();

    const { useCompliance } = require('../../../almLib/hooks/compliance');
    useCompliance.mockReturnValue(makeComplianceReturn());

    const { useWidgetLayout } = require('../../../almLib/hooks/widgets/useWidgetLayout');
    useWidgetLayout.mockReturnValue(makeWidgetLayoutReturn(1));

    const { useUserContext } = require('../../../almLib/contextProviders/userContextProvider');
    useUserContext.mockReturnValue({
      user: { account: { showComplianceLabel: false, complianceLabelDefaultValueId: '' } },
    });

    const { useWidgetInspectMode } = require('../../../almLib/hooks/customPages/useALMInspectMode');
    useWidgetInspectMode.mockReturnValue({
      isHovered: false,
      widgetContainerWidth: 800,
      widgetContainerHeight: 400,
      changeHoverState: jest.fn(),
    });

    const { getIsCustomPage } = require('../../../almLib/utils/widgets/utils');
    getIsCustomPage.mockReturnValue(false);

    const { getALMObject } = require('../../../almLib/utils/global');
    getALMObject.mockReturnValue({
      navigateFromComplianceWidget: mockNavigate,
      navigateToMyLearningPage: mockNavigateToMyLearning,
    });
  });

  describe('Loading', () => {
    it('fetchingData_true_loaderShown_complianceCardHidden', () => {
      const { useCompliance } = require('../../../almLib/hooks/compliance');
      useCompliance.mockReturnValue(makeComplianceReturn({ fetchingData: true }));
      const { container } = renderComponent();
      expect(screen.getByTestId('widget-loader')).toBeInTheDocument();
      expect(container.querySelector('[data-automationid="compliance-card"]')).toBeNull();
    });

    it('fetchingData_false_complianceCardShown_loaderHidden', () => {
      const { container } = renderComponent();
      expect(container.querySelector('[data-automationid="compliance-card"]')).not.toBeNull();
      expect(screen.queryByTestId('widget-loader')).toBeNull();
    });
  });

  describe('Layout', () => {
    it('noOfCards_1_singleView_applicationRole', () => {
      renderComponent();
      expect(screen.getByRole('application')).toBeInTheDocument();
      expect(screen.queryByRole('complementary')).toBeNull();
    });

    it('noOfCards_2_doubleView_complementaryRole_withVerticalDivider', () => {
      const { useWidgetLayout } = require('../../../almLib/hooks/widgets/useWidgetLayout');
      useWidgetLayout.mockReturnValue(makeWidgetLayoutReturn(2));
      renderComponent();
      expect(screen.getByRole('complementary')).toBeInTheDocument();
      expect(screen.queryByRole('application')).toBeNull();
      const dividers = screen.getAllByTestId('divider');
      expect(dividers.some(d => d.getAttribute('data-orientation') === 'vertical')).toBe(true);
    });
  });

  describe('Header', () => {
    it('nonCustomPage_h2HeaderRendered_stripHeaderHidden', () => {
      renderComponent();
      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
      expect(screen.queryByTestId('strip-widget-header')).toBeNull();
    });

    it('customPage_stripWidgetHeaderRendered_h2Hidden', () => {
      const { getIsCustomPage } = require('../../../almLib/utils/widgets/utils');
      getIsCustomPage.mockReturnValue(true);
      renderComponent();
      expect(screen.getByTestId('strip-widget-header')).toBeInTheDocument();
      expect(screen.queryByRole('heading', { level: 2 })).toBeNull();
    });
  });

  describe('Inspect Mode', () => {
    it('customPage_inspectMode_hovered_showsOverlay', () => {
      const { getIsCustomPage } = require('../../../almLib/utils/widgets/utils');
      getIsCustomPage.mockReturnValue(true);
      const { useWidgetInspectMode } = require('../../../almLib/hooks/customPages/useALMInspectMode');
      useWidgetInspectMode.mockReturnValue({ isHovered: true, widgetContainerWidth: 800, widgetContainerHeight: 400, changeHoverState: jest.fn() });
      renderComponent({ isInspectMode: true });
      expect(screen.getByTestId('inspect-mode')).toBeInTheDocument();
    });

    it('customPage_inspectMode_notHovered_hidesOverlay', () => {
      const { getIsCustomPage } = require('../../../almLib/utils/widgets/utils');
      getIsCustomPage.mockReturnValue(true);
      // isHovered = false (default in beforeEach)
      renderComponent({ isInspectMode: true });
      expect(screen.queryByTestId('inspect-mode')).toBeNull();
    });

    it('nonCustomPage_inspectMode_hovered_hidesOverlay', () => {
      const { useWidgetInspectMode } = require('../../../almLib/hooks/customPages/useALMInspectMode');
      useWidgetInspectMode.mockReturnValue({ isHovered: true, widgetContainerWidth: 800, widgetContainerHeight: 400, changeHoverState: jest.fn() });
      // isCustomPage = false (default)
      renderComponent({ isInspectMode: true });
      expect(screen.queryByTestId('inspect-mode')).toBeNull();
    });
  });

  describe('Donut Content State', () => {
    it('isEnrollmentsOverLimit_false_donutContainerAndButtonsShown', () => {
      const { container } = renderComponent();
      expect(container.querySelector('[data-automationid="compliance-donut-container"]')).not.toBeNull();
      expect(container.querySelector('[data-automationid="compliance-buttons"]')).not.toBeNull();
      expect(screen.queryByTestId('more-enrollments-icon')).toBeNull();
    });

    it('isEnrollmentsOverLimit_true_moreEnrollmentsStateShown_buttonsHidden', () => {
      const { useCompliance } = require('../../../almLib/hooks/compliance');
      useCompliance.mockReturnValue(makeComplianceReturn({ isEnrollmentsOverLimit: 'true' }));
      const { container } = renderComponent();
      expect(screen.getByTestId('more-enrollments-icon')).toBeInTheDocument();
      expect(container.querySelector('[data-automationid="compliance-buttons"]')).toBeNull();
    });

    it('isEnrollmentsOverLimit_empty_donutContainerEmpty', () => {
      const { useCompliance } = require('../../../almLib/hooks/compliance');
      useCompliance.mockReturnValue(makeComplianceReturn({ isEnrollmentsOverLimit: '' }));
      const { container } = renderComponent();
      expect(container.querySelector('[data-automationid="compliance-donut-container"]')).not.toBeNull();
      expect(container.querySelector('[data-automationid="compliance-buttons"]')).toBeNull();
      expect(screen.queryByTestId('more-enrollments-icon')).toBeNull();
    });
  });

  describe('Compliance Label Dropdown', () => {
    it('labelEnabled_dropdownShown', () => {
      const { useUserContext } = require('../../../almLib/contextProviders/userContextProvider');
      useUserContext.mockReturnValue({ user: { account: { showComplianceLabel: true, complianceLabelDefaultValueId: 'label-1' } } });
      renderComponent();
      expect(screen.getByTestId('compliance-dropdown')).toBeInTheDocument();
    });

    it('labelDisabled_dropdownHidden', () => {
      renderComponent();
      expect(screen.queryByTestId('compliance-dropdown')).toBeNull();
    });
  });

  describe('Hook Wiring', () => {
    it('useCompliance_calledWithAccountComplianceLabelParams', () => {
      const { useUserContext } = require('../../../almLib/contextProviders/userContextProvider');
      useUserContext.mockReturnValue({ user: { account: { showComplianceLabel: true, complianceLabelDefaultValueId: 'label-abc' } } });
      const { useCompliance } = require('../../../almLib/hooks/compliance');
      renderComponent();
      expect(useCompliance).toHaveBeenCalledWith(true, 'label-abc');
    });

    it('useWidgetLayout_calledWith_widgetAndMultiCardConfig', () => {
      const { useWidgetLayout } = require('../../../almLib/hooks/widgets/useWidgetLayout');
      renderComponent({ doRefresh: jest.fn() });
      expect(useWidgetLayout).toHaveBeenCalledWith(
        expect.objectContaining({ widget: mockWidget, defaultCardsToShow: 1, isMultiCard: true })
      );
    });
  });

  describe('Category Filter Navigation', () => {
    it('allButtonClick_singleView_switchesToSessionsList', () => {
      const { container } = renderComponent();
      // Initially COMPLIANCE view: donut shown, sessions card absent
      expect(container.querySelector('[data-automationid="compliance-donut-container"]')).not.toBeNull();
      expect(container.querySelector('[data-automationid="enrollments-detail-card"]')).toBeNull();

      fireEvent.click(container.querySelector('[data-automationid="ALL-button"]')!);

      expect(container.querySelector('[data-automationid="enrollments-detail-card"]')).not.toBeNull();
    });
  });

  describe('Enrollment Click', () => {
    it('enrollmentClick_linksEnabled_callsNavigateFromComplianceWidget', () => {
      // Double view always shows sessions list alongside donut
      const { useWidgetLayout } = require('../../../almLib/hooks/widgets/useWidgetLayout');
      useWidgetLayout.mockReturnValue(makeWidgetLayoutReturn(2));
      renderComponent();
      fireEvent.click(screen.getByText('Test Course'));
      expect(mockNavigate).toHaveBeenCalledWith(mockEnrollment);
    });

    it('enrollmentClick_disableLinks_noNavigation', () => {
      const { useWidgetLayout } = require('../../../almLib/hooks/widgets/useWidgetLayout');
      useWidgetLayout.mockReturnValue(makeWidgetLayoutReturn(2));
      renderComponent({ disableLinks: true });
      fireEvent.click(screen.getByText('Test Course'));
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });
});
