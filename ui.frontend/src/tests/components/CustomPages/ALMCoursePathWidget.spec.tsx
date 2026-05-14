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
const mockFetchMore = jest.fn();
const mockUpdateItemsPerPage = jest.fn();
const mockIsLeftNavIconDisabled = jest.fn(() => false);
const mockIsRightNavIconDisabled = jest.fn(() => false);

jest.mock('@hooks/customPages/useALMCoursePathWidget');
jest.mock('@hooks/feedback');
jest.mock('@hooks/customPages/useStripScroll');
jest.mock('@hooks/customPages/useALMInspectMode');
jest.mock('@contextProviders/userContextProvider');
jest.mock('@utils/translationService');

jest.mock('@utils/widgets/common', () => ({
  ...jest.requireActual('@utils/widgets/common'),
  CARD_WIDTH: 300,
  CARD_WIDTH_EXCLUDING_PADDING: 20,
}));

jest.mock('@components/Widgets/ALMPrimeStrip/ALMPrimeStrip.helper', () => ({
  showProgressBar: jest.fn(() => false),
  showSkills: jest.fn(() => false),
  showPRLInfo: jest.fn(() => false),
  showRating: jest.fn(() => false),
  showEffectivenessIndex: jest.fn(() => false),
  showAuthorInfo: jest.fn(() => false),
  showRecommendedReason: jest.fn(() => false),
}));

jest.mock('@components/Catalog/PrimeTrainingCardV2/PrimeTrainingCardV2.helper', () => ({
  handleLinkCLick: jest.fn(),
  canShowPrice: jest.fn(() => false),
  launchPlayerHandler: jest.fn(),
  openJobAid: jest.fn(),
}));

jest.mock('@components/Catalog/PrimeTrainingCardV2/PrimeTrainingCardV2', () => ({
  __esModule: true,
  default: ({ training, disableLinks }: any) => (
    <div data-testid={`training-card-${training.id}`} data-disable-links={String(disableLinks)} />
  ),
}));

jest.mock('@components/ALMFeedback', () => ({
  PrimeFeedbackWrapper: ({ trainingId }: any) => (
    <div data-testid="feedback-wrapper" data-training-id={trainingId} />
  ),
}));

jest.mock('@components/CustomPages/ALMStripWidgetHeader/ALMStripWidgetHeader', () => ({
  __esModule: true,
  default: ({ heading, showNavIcons }: any) => (
    <div data-testid="strip-header">
      <span data-testid="heading">{heading}</span>
      {showNavIcons && <div data-testid="nav-icons" />}
    </div>
  ),
}));

jest.mock('@components/CustomPages/ALMNoAccessContainer/ALMNoAccessContainer', () => ({
  __esModule: true,
  default: () => <div data-testid="no-access" />,
}));

jest.mock('@components/CustomPages/ALMWidgetInspectMode/ALMWidgetInspectMode', () => ({
  __esModule: true,
  default: () => <div data-testid="inspect-mode" />,
}));

jest.mock('@components/CustomPages/ALMWidgetLoader', () => ({
  ALMWidgetLoader: () => <div data-testid="widget-loader" />,
}));

import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ALMCoursePathWidget from '@components/CustomPages/ALMCoursePathWidget/ALMCoursePathWidget';
import { useCoursePathWidget } from '@hooks/customPages/useALMCoursePathWidget';
import { useFeedback } from '@hooks/feedback';
import { useStripScroll } from '@hooks/customPages/useStripScroll';
import { useWidgetInspectMode } from '@hooks/customPages/useALMInspectMode';
import { useUserContext } from '@contextProviders/userContextProvider';
import { GetTranslation } from '@utils/translationService';

const mockUseCoursePathWidget = useCoursePathWidget as jest.MockedFunction<typeof useCoursePathWidget>;
const mockUseFeedback = useFeedback as jest.MockedFunction<typeof useFeedback>;
const mockUseStripScroll = useStripScroll as jest.MockedFunction<typeof useStripScroll>;
const mockUseWidgetInspectMode = useWidgetInspectMode as jest.MockedFunction<typeof useWidgetInspectMode>;
const mockUseUserContext = useUserContext as jest.MockedFunction<typeof useUserContext>;
const mockGetTranslation = GetTranslation as jest.MockedFunction<typeof GetTranslation>;

const items = [
  { id: 't1', loType: 'course', name: 'Course 1' },
  { id: 't2', loType: 'learningProgram', name: 'LP 1' },
];

const baseWidget = { id: 'w1', widgetRef: 'cp-widget', attributes: {} };

const baseCoursePathWidget = {
  fetchingData: false,
  items,
  fetchMore: mockFetchMore,
  searchString: '',
  addBookmarkHandler: jest.fn(),
  removeBookmarkHandler: jest.fn(),
  enrollmentHandler: jest.fn(),
  updateLearningObject: jest.fn(),
};

const baseFeedback = {
  feedbackTrainingId: 'fb-t1',
  trainingInstanceId: 'inst-1',
  playerLaunchTimeStamp: 0,
  shouldLaunchFeedback: false,
  handleL1FeedbackLaunch: jest.fn(),
  fetchCurrentLo: jest.fn(),
  getFilteredNotificationForFeedback: jest.fn(),
  submitL1Feedback: jest.fn(),
  closeFeedbackWrapper: jest.fn(),
};

const baseStripScroll = {
  rollContainer: { current: null },
  onScroll: jest.fn(),
  rollAPage: jest.fn(),
  isLeftNavIconDisabled: mockIsLeftNavIconDisabled,
  isRightNavIconDisabled: mockIsRightNavIconDisabled,
  updateItemsPerPage: mockUpdateItemsPerPage,
  itemsPerPage: 4,
};

const baseInspectMode = {
  isHovered: false,
  widgetContainerWidth: 800,
  widgetContainerHeight: 400,
  changeHoverState: jest.fn(),
};

const renderWidget = (props: any = {}) =>
  render(<ALMCoursePathWidget widget={baseWidget as any} {...props} />);

describe('ALMCoursePathWidget', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseCoursePathWidget.mockReturnValue(baseCoursePathWidget as any);
    mockUseFeedback.mockReturnValue(baseFeedback as any);
    mockUseStripScroll.mockReturnValue(baseStripScroll as any);
    mockUseWidgetInspectMode.mockReturnValue(baseInspectMode);
    mockUseUserContext.mockReturnValue({ user: { id: 'u1', account: { id: 'acc-1' } } } as any);
    mockGetTranslation.mockImplementation((key: string) =>
      key.endsWith('.title') ? 'Widget Title' : 'Widget Desc'
    );
  });

  describe('Content rendering', () => {
    it('renders one training card per item when items exist', () => {
      renderWidget();
      expect(screen.getByTestId('training-card-t1')).toBeTruthy();
      expect(screen.getByTestId('training-card-t2')).toBeTruthy();
      expect(screen.queryByTestId('widget-loader')).not.toBeInTheDocument();
      expect(screen.queryByTestId('no-access')).not.toBeInTheDocument();
    });

    it('renders the loader when fetchingData is true and items is empty', () => {
      mockUseCoursePathWidget.mockReturnValue({
        ...baseCoursePathWidget,
        fetchingData: true,
        items: [],
      } as any);
      renderWidget();
      expect(screen.getByTestId('widget-loader').tagName.toLowerCase()).toBe('div');
      expect(screen.queryByTestId('no-access')).not.toBeInTheDocument();
    });

    it('renders NoAccessContainer when items is empty and not fetching', () => {
      mockUseCoursePathWidget.mockReturnValue({
        ...baseCoursePathWidget,
        fetchingData: false,
        items: [],
      } as any);
      renderWidget();
      expect(screen.getByTestId('no-access').tagName.toLowerCase()).toBe('div');
      expect(screen.queryByTestId('widget-loader')).not.toBeInTheDocument();
    });
  });

  describe('Navigation icons', () => {
    it('shows nav icons when items.length exceeds itemsPerPage', () => {
      mockUseStripScroll.mockReturnValue({ ...baseStripScroll, itemsPerPage: 1 } as any);
      renderWidget();
      expect(screen.getByTestId('nav-icons').tagName.toLowerCase()).toBe('div');
    });

    it('hides nav icons when items.length does not exceed itemsPerPage', () => {
      mockUseStripScroll.mockReturnValue({ ...baseStripScroll, itemsPerPage: 4 } as any);
      renderWidget();
      expect(screen.queryByTestId('nav-icons')).not.toBeInTheDocument();
    });
  });

  describe('Feedback wrapper', () => {
    it('renders feedback wrapper when shouldLaunchFeedback is true', () => {
      mockUseFeedback.mockReturnValue({
        ...baseFeedback,
        shouldLaunchFeedback: true,
      } as any);
      renderWidget();
      expect(screen.getByTestId('feedback-wrapper')).toHaveAttribute('data-training-id', 'fb-t1');
    });

    it('does not render feedback wrapper when shouldLaunchFeedback is false', () => {
      renderWidget();
      expect(screen.queryByTestId('feedback-wrapper')).not.toBeInTheDocument();
    });
  });

  describe('Inspect mode overlay', () => {
    it('shows inspect overlay when isInspectMode=true and widget is hovered', () => {
      mockUseWidgetInspectMode.mockReturnValue({ ...baseInspectMode, isHovered: true });
      renderWidget({ isInspectMode: true });
      expect(screen.getByTestId('inspect-mode').tagName.toLowerCase()).toBe('div');
    });

    it('hides inspect overlay when isInspectMode=false even if hovered', () => {
      mockUseWidgetInspectMode.mockReturnValue({ ...baseInspectMode, isHovered: true });
      renderWidget({ isInspectMode: false });
      expect(screen.queryByTestId('inspect-mode')).not.toBeInTheDocument();
    });

    it('hides inspect overlay when isInspectMode=true but not hovered', () => {
      renderWidget({ isInspectMode: true });
      expect(screen.queryByTestId('inspect-mode')).not.toBeInTheDocument();
    });
  });

  describe('disableLinks prop', () => {
    it('passes disableLinks=true down to training cards', () => {
      renderWidget({ disableLinks: true });
      expect(screen.getByTestId('training-card-t1')).toHaveAttribute('data-disable-links', 'true');
    });

    it('passes disableLinks=false by default', () => {
      renderWidget();
      expect(screen.getByTestId('training-card-t1')).toHaveAttribute('data-disable-links', 'false');
    });
  });

  describe('fetchMore side effect', () => {
    it('calls fetchMore on mount when items.length < itemsPerPage * 2', () => {
      // items.length=2, itemsPerPage=4 → 2 < 8 → fetchMore called
      renderWidget();
      expect(mockFetchMore).toHaveBeenCalledTimes(1);
    });

    it('does not call fetchMore when items.length >= itemsPerPage * 2', () => {
      const manyItems = Array.from({ length: 8 }, (_, i) => ({ id: `t${i}`, loType: 'course' }));
      mockUseCoursePathWidget.mockReturnValue({
        ...baseCoursePathWidget,
        items: manyItems,
      } as any);
      renderWidget();
      expect(mockFetchMore).not.toHaveBeenCalled();
    });
  });
});
