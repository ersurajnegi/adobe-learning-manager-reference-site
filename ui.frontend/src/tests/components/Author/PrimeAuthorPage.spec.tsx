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
import '@testing-library/jest-dom/extend-expect';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// ─── Module mocks (factories only — implementations set in beforeEach) ────────

jest.mock('@hooks/author', () => ({ useAuthor: jest.fn() }));
jest.mock('@hooks/feedback', () => ({ useFeedback: jest.fn() }));
jest.mock('@hooks', () => ({ useLoadMore: jest.fn() }));
jest.mock('@contextProviders/userContextProvider', () => ({ useUserContext: jest.fn() }));
jest.mock('@contextProviders/DeviceContextProvider', () => ({ useDeviceTypeContext: jest.fn() }));
jest.mock('@contextProviders/ALMDialogContextProvider', () => ({ useDialog: jest.fn() }));

jest.mock('@utils/global', () => ({
  getALMConfig: jest.fn(),
  getPathParams: jest.fn(),
  getQueryParamsFromUrl: jest.fn(),
  containsSubstr: jest.fn(),
  setTrainingsLayout: jest.fn(),
  navigateToLo: jest.fn(),
  customEncode: jest.fn((s: string) => s),
  getALMObject: jest.fn(() => ({})),
}));
jest.mock('@utils/translationService', () => ({ GetTranslation: jest.fn() }));
jest.mock('@utils/catalog', () => ({ getInitialView: jest.fn() }));

jest.mock('@utils/inline_svg', () => ({
  DEFAULT_USER_SVG: jest.fn(),
  BACK_BUTTON_ICON: jest.fn(),
}));

jest.mock('@components/Catalog/PrimeTrainingList', () => ({
  PrimeTrainingList: ({ training }: any) => (
    <div data-testid={`training-list-${training.id}`}>{training.name}</div>
  ),
}));

jest.mock('@components/Catalog/PrimeTrainingCardV2', () => ({
  PrimeTrainingCardV2: ({ training }: any) => (
    <div data-testid={`training-card-${training.id}`}>{training.name}</div>
  ),
}));

jest.mock('@components/Catalog/PrimeTrainingCardV2/PrimeTrainingCardV2.helper', () => ({
  canShowPrice: jest.fn(() => false),
  launchPlayerHandler: jest.fn(),
}));

jest.mock('@components/Widgets/ALMPrimeStrip/ALMPrimeStrip.helper', () => ({
  showEffectivenessIndex: jest.fn(() => false),
  showRating: jest.fn(() => false),
}));

// Button-based mock so userEvent.click works without needing selectOptions
jest.mock('@components/Common/ALMCustomPicker', () => ({
  ALMCustomPicker: ({ options, onOptionSelected }: any) => (
    <div data-testid="sort-picker">
      {options.map((opt: any) => (
        <button key={opt.id} data-testid={`sort-option-${opt.id}`} onClick={() => onOptionSelected(opt.id)}>
          {opt.name}
        </button>
      ))}
    </div>
  ),
}));

jest.mock('@components/Common/ALMLoader', () => ({
  ALMLoader: () => <div data-testid="loader" />,
}));

jest.mock('@components/ALMFeedback', () => ({
  PrimeFeedbackWrapper: () => <div data-testid="feedback-wrapper" />,
}));

jest.mock('@components/ALMGoToTop', () => ({
  ALMGoToTop: () => <div data-testid="go-to-top" />,
}));

jest.mock('@components/ALMDialog', () => ({
  ALMDialog: ({ children }: any) => <div data-testid="alm-dialog">{children}</div>,
  ALMDialogHeader: ({ children }: any) => <div>{children}</div>,
}));

jest.mock('@adobe/react-spectrum', () => ({
  Provider: ({ children }: any) => <>{children}</>,
  lightTheme: {},
  Divider: () => <hr />,
  Heading: ({ children }: any) => <h3>{children}</h3>,
  ListBox: ({ children, items }: any) => (
    <div>{items.map((item: any) => children(item))}</div>
  ),
  Item: ({ children }: any) => <div>{children}</div>,
}));

jest.mock('@spectrum-icons/workflow/ViewList', () => ({
  __esModule: true,
  default: () => <svg data-testid="view-list-icon" />,
}));
jest.mock('@spectrum-icons/workflow/ClassicGridView', () => ({
  __esModule: true,
  default: () => <svg data-testid="grid-view-icon" />,
}));
jest.mock('@spectrum-icons/workflow/SortOrderDown', () => ({
  __esModule: true,
  default: () => <svg data-testid="sort-icon" />,
}));

jest.mock('react-intl', () => ({ useIntl: jest.fn() }));

// ─── Imports (after mocks) ────────────────────────────────────────────────────

import PrimeAuthorPage from '@components/Author/PrimeAuthorPage';
import { useAuthor } from '@hooks/author';
import { useFeedback } from '@hooks/feedback';
import { useLoadMore } from '@hooks';
import { useUserContext } from '@contextProviders/userContextProvider';
import { useDeviceTypeContext } from '@contextProviders/DeviceContextProvider';
import { useDialog } from '@contextProviders/ALMDialogContextProvider';
import { useIntl } from 'react-intl';
import {
  getALMConfig,
  getPathParams,
  getQueryParamsFromUrl,
  setTrainingsLayout,
  containsSubstr,
} from '@utils/global';
import { GetTranslation } from '@utils/translationService';
import { getInitialView } from '@utils/catalog';

// ─── Test data ────────────────────────────────────────────────────────────────

const TRAININGS = [
  { id: 'training-1', name: 'Training 1', enrollment: null },
  { id: 'training-2', name: 'Training 2', enrollment: { id: 'enroll-1' } },
];

const AUTHOR_DETAILS = {
  name: 'John Doe',
  avatarUrl: 'https://example.com/avatar.jpg',
  bio: 'Experienced instructor',
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('PrimeAuthorPage', () => {
  let mockFetchTrainings: jest.Mock;

  beforeEach(() => {
    mockFetchTrainings = jest.fn();

    (getALMConfig as jest.Mock).mockReturnValue({ authorPath: '/author/:author' });
    (getPathParams as jest.Mock).mockReturnValue({ author: 'url-author-1' });
    (getQueryParamsFromUrl as jest.Mock).mockReturnValue({
      authorName: 'Jane URL',
      isLegacyAuthor: false,
    });
    (containsSubstr as jest.Mock).mockReturnValue(false);
    (getInitialView as jest.Mock).mockReturnValue('LIST_VIEW');
    (GetTranslation as jest.Mock).mockImplementation((key: string) => key);

    (useAuthor as jest.Mock).mockReturnValue({
      trainings: TRAININGS,
      totalTrainings: 2,
      hasMoreItems: false,
      loadMoreTraining: jest.fn(),
      enrollmentHandler: jest.fn(),
      updateLearningObject: jest.fn(),
      fetchTrainings: mockFetchTrainings,
      authorDetails: AUTHOR_DETAILS,
      isLoading: false,
      addBookmarkHandler: jest.fn(),
      removeBookmarkHandler: jest.fn(),
    });

    (useFeedback as jest.Mock).mockReturnValue({
      feedbackTrainingId: null,
      trainingInstanceId: null,
      playerLaunchTimeStamp: null,
      shouldLaunchFeedback: false,
      handleL1FeedbackLaunch: jest.fn(),
      fetchCurrentLo: jest.fn(),
      getFilteredNotificationForFeedback: jest.fn(),
      submitL1Feedback: jest.fn(),
      closeFeedbackWrapper: jest.fn(),
    });

    (useLoadMore as jest.Mock).mockReturnValue(undefined);
    (useUserContext as jest.Mock).mockReturnValue({
      user: { account: { viewType: 'LIST_VIEW' } },
    });

    (useIntl as jest.Mock).mockReturnValue({
      formatMessage: ({ id, defaultMessage }: any, values?: any) => {
        if (id === 'alm.author.trainings') return `${values?.x ?? 0} trainings`;
        if (id === 'alm.catalog.no.result') return 'No results found';
        if (id === 'alm.author.back.label') return 'Back';
        if (id === 'alm.picker.sortBy') return 'Sort by';
        if (id === 'alm.label.authorName') return 'Author name';
        return defaultMessage || id;
      },
    });

    (useDeviceTypeContext as jest.Mock).mockReturnValue({
      isDesktop: true,
      isMobile: false,
      isTablet: false,
    });

    (useDialog as jest.Mock).mockReturnValue({
      isOpen: jest.fn(() => false),
      openDialog: jest.fn(),
      closeDialog: jest.fn(),
    });
  });

  // ─── authorType derivation ──────────────────────────────────────────────────

  describe('authorType derivation', () => {
    it('useAuthor_calledWith_externalType_whenIsLegacyAuthor_isTrue', () => {
      render(
        <PrimeAuthorPage
          authorId="author-123"
          authorName="External Author"
          isLegacyAuthor={true}
        />
      );
      expect(useAuthor).toHaveBeenCalledWith('author-123', 'External');
    });

    it('useAuthor_calledWith_internalType_fromURLParams_whenPropsAbsent', () => {
      render(<PrimeAuthorPage />);
      expect(useAuthor).toHaveBeenCalledWith('url-author-1', 'Internal');
    });
  });

  // ─── Avatar and name display ────────────────────────────────────────────────

  describe('avatar and author name', () => {
    it('externalAuthor_showsDefaultAvatarSpan_notImg', () => {
      const { container } = render(
        <PrimeAuthorPage authorId="a1" authorName="Ext Author" isLegacyAuthor={true} />
      );
      expect(container.querySelector('[data-automationid="default-avatar"]')).toBeInTheDocument();
      expect(container.querySelector('img.avatar')).not.toBeInTheDocument();
    });

    it('externalAuthor_showsAuthorNameFromProp_withCorrectAriaLabel', () => {
      render(
        <PrimeAuthorPage authorId="a1" authorName="Ext Author" isLegacyAuthor={true} />
      );
      expect(screen.getByText('Ext Author')).toHaveAttribute('aria-label', 'Author name Ext Author');
    });

    it('internalAuthor_showsAvatarImg_withHookAvatarUrl', () => {
      const { container } = render(<PrimeAuthorPage />);
      const img = container.querySelector('img.avatar') as HTMLImageElement;
      expect(img).toBeInTheDocument();
      expect(img.src).toBe('https://example.com/avatar.jpg');
    });

    it('internalAuthor_showsAuthorName_fromHookDetails_withCorrectAriaLabel', () => {
      render(<PrimeAuthorPage />);
      expect(screen.getByText('John Doe')).toHaveAttribute('aria-label', 'Author name John Doe');
    });
  });

  // ─── Training list rendering ────────────────────────────────────────────────

  describe('training list rendering', () => {
    it('listView_renders_PrimeTrainingList_notPrimeTrainingCardV2', () => {
      (getInitialView as jest.Mock).mockReturnValue('LIST_VIEW');
      render(<PrimeAuthorPage />);
      expect(screen.getByTestId('training-list-training-1')).toBeInTheDocument();
      expect(screen.queryByTestId('training-card-training-1')).not.toBeInTheDocument();
    });

    it('tileView_renders_PrimeTrainingCardV2_notPrimeTrainingList', () => {
      (getInitialView as jest.Mock).mockReturnValue('TILE_VIEW');
      render(<PrimeAuthorPage />);
      expect(screen.getByTestId('training-card-training-1')).toBeInTheDocument();
      expect(screen.queryByTestId('training-list-training-1')).not.toBeInTheDocument();
    });
  });

  // ─── Empty state ────────────────────────────────────────────────────────────

  describe('empty state', () => {
    it('showsNoResults_whenTrainings_isEmpty_andNotLoading', () => {
      (useAuthor as jest.Mock).mockReturnValue({
        trainings: [],
        totalTrainings: 0,
        hasMoreItems: false,
        loadMoreTraining: jest.fn(),
        enrollmentHandler: jest.fn(),
        updateLearningObject: jest.fn(),
        fetchTrainings: mockFetchTrainings,
        authorDetails: AUTHOR_DETAILS,
        isLoading: false,
        addBookmarkHandler: jest.fn(),
        removeBookmarkHandler: jest.fn(),
      });
      render(<PrimeAuthorPage />);
      expect(screen.getByText('No results found')).toBeInTheDocument();
      expect(screen.queryByTestId('loader')).not.toBeInTheDocument();
    });

    it('hidesNoResults_whenTrainings_isEmpty_butIsLoading', () => {
      (useAuthor as jest.Mock).mockReturnValue({
        trainings: [],
        totalTrainings: 0,
        hasMoreItems: false,
        loadMoreTraining: jest.fn(),
        enrollmentHandler: jest.fn(),
        updateLearningObject: jest.fn(),
        fetchTrainings: mockFetchTrainings,
        authorDetails: AUTHOR_DETAILS,
        isLoading: true,
        addBookmarkHandler: jest.fn(),
        removeBookmarkHandler: jest.fn(),
      });
      render(<PrimeAuthorPage />);
      expect(screen.queryByText('No results found')).not.toBeInTheDocument();
    });
  });

  // ─── Loading indicator ──────────────────────────────────────────────────────

  describe('loading indicator', () => {
    it('showsLoader_whenIsLoading_andHidesNoResults', () => {
      (useAuthor as jest.Mock).mockReturnValue({
        trainings: TRAININGS,
        totalTrainings: 2,
        hasMoreItems: false,
        loadMoreTraining: jest.fn(),
        enrollmentHandler: jest.fn(),
        updateLearningObject: jest.fn(),
        fetchTrainings: mockFetchTrainings,
        authorDetails: AUTHOR_DETAILS,
        isLoading: true,
        addBookmarkHandler: jest.fn(),
        removeBookmarkHandler: jest.fn(),
      });
      render(<PrimeAuthorPage />);
      expect(screen.getByTestId('loader')).toBeInTheDocument();
      expect(screen.queryByText('No results found')).not.toBeInTheDocument();
    });

    it('showsLoader_whenHasMoreItems_andHidesNoResults', () => {
      (useAuthor as jest.Mock).mockReturnValue({
        trainings: TRAININGS,
        totalTrainings: 2,
        hasMoreItems: true,
        loadMoreTraining: jest.fn(),
        enrollmentHandler: jest.fn(),
        updateLearningObject: jest.fn(),
        fetchTrainings: mockFetchTrainings,
        authorDetails: AUTHOR_DETAILS,
        isLoading: false,
        addBookmarkHandler: jest.fn(),
        removeBookmarkHandler: jest.fn(),
      });
      render(<PrimeAuthorPage />);
      expect(screen.getByTestId('loader')).toBeInTheDocument();
      expect(screen.queryByText('No results found')).not.toBeInTheDocument();
    });

    it('hidesLoader_whenNotLoading_andNoMoreItems', () => {
      render(<PrimeAuthorPage />);
      expect(screen.queryByTestId('loader')).not.toBeInTheDocument();
    });
  });

  // ─── Sort and layout controls ───────────────────────────────────────────────

  describe('sort and layout controls', () => {
    it('desktop_showsSortPicker_andHidesSortIcon', () => {
      render(<PrimeAuthorPage />);
      expect(screen.getByTestId('sort-picker')).toBeInTheDocument();
      expect(screen.queryByTestId('sort-icon')).not.toBeInTheDocument();
    });

    it('nonDesktop_showsSortIcon_andHidesSortPicker', () => {
      (useDeviceTypeContext as jest.Mock).mockReturnValue({
        isDesktop: false,
        isMobile: true,
        isTablet: false,
      });
      render(<PrimeAuthorPage />);
      expect(screen.getByTestId('sort-icon')).toBeInTheDocument();
      expect(screen.queryByTestId('sort-picker')).not.toBeInTheDocument();
    });

    it('sortOption_click_callsFetchTrainings_withSelectedOption', () => {
      render(<PrimeAuthorPage />);
      userEvent.click(screen.getByTestId('sort-option-name'));
      expect(mockFetchTrainings).toHaveBeenCalledWith('name');
    });
  });

  // ─── View toggle ────────────────────────────────────────────────────────────

  describe('view toggle', () => {
    it('tileViewButton_click_callsSetTrainingsLayout_withTILE_VIEW', () => {
      const { container } = render(<PrimeAuthorPage />);
      userEvent.click(container.querySelector('[data-automationid="trainingsTileView"]')!);
      expect(setTrainingsLayout).toHaveBeenCalledWith('TILE_VIEW', expect.any(Function));
    });

    it('listViewButton_click_callsSetTrainingsLayout_withLIST_VIEW', () => {
      const { container } = render(<PrimeAuthorPage />);
      userEvent.click(container.querySelector('[data-automationid="trainingsListView"]')!);
      expect(setTrainingsLayout).toHaveBeenCalledWith('LIST_VIEW', expect.any(Function));
    });
  });

  // ─── Back button ────────────────────────────────────────────────────────────

  describe('back button', () => {
    it('backButton_click_callsWindowHistoryBack', () => {
      const mockBack = jest.fn();
      Object.defineProperty(window, 'history', { writable: true, value: { back: mockBack } });
      const { container } = render(<PrimeAuthorPage />);
      userEvent.click(container.querySelector('[data-automationid="Back-Button"]')!);
      expect(mockBack).toHaveBeenCalled();
    });
  });

  // ─── Feedback wrapper ───────────────────────────────────────────────────────

  describe('feedback wrapper', () => {
    it('rendersFeedbackWrapper_whenShouldLaunchFeedback_isTrue', () => {
      (useFeedback as jest.Mock).mockReturnValue({
        feedbackTrainingId: 'training-1',
        trainingInstanceId: 'instance-1',
        playerLaunchTimeStamp: 12345,
        shouldLaunchFeedback: true,
        handleL1FeedbackLaunch: jest.fn(),
        fetchCurrentLo: jest.fn(),
        getFilteredNotificationForFeedback: jest.fn(),
        submitL1Feedback: jest.fn(),
        closeFeedbackWrapper: jest.fn(),
      });
      render(<PrimeAuthorPage />);
      expect(screen.getByTestId('feedback-wrapper')).toBeInTheDocument();
      expect(screen.queryByTestId('loader')).not.toBeInTheDocument();
    });

    it('hidesFeedbackWrapper_whenShouldLaunchFeedback_isFalse', () => {
      render(<PrimeAuthorPage />);
      expect(screen.queryByTestId('feedback-wrapper')).not.toBeInTheDocument();
    });
  });
});
