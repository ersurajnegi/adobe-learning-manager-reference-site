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
import { Provider as SpectrumProvider, defaultTheme } from '@adobe/react-spectrum';
import PrimeTrainingsContainer from '@components/Catalog/PrimeTrainingsContainer/PrimeTrainingsContainer';
import { useLoadMore } from '@hooks';
import { useFeedback } from '@hooks/feedback';
import { navigateToLo } from '@utils/global';
import {
  showRating,
  showEffectivenessIndex,
} from '@components/Widgets/ALMPrimeStrip/ALMPrimeStrip.helper';
import { openJobAid } from '@components/Catalog/PrimeTrainingCardV2/PrimeTrainingCardV2.helper';
import { PrimeAccount, PrimeLearningObject, PrimeUser } from '@models/PrimeModels';

// Factory mocks prevent transitive module loading
jest.mock('@components/Catalog/PrimeTrainingList', () => ({
  PrimeTrainingList: ({ training }: any) => (
    <li data-testid="training-list-item" data-training-id={training.id} />
  ),
}));

jest.mock('@components/Catalog/PrimeTrainingCardV2', () => ({
  PrimeTrainingCardV2: ({ training, handleActionClick, handleLoNameClick, showProgressBar }: any) => (
    <div
      data-testid="training-card"
      data-training-id={training.id}
      data-show-progress={String(showProgressBar)}
    >
      <button data-testid="action-btn" onClick={handleActionClick}>Action</button>
      <button data-testid="name-btn" onClick={() => handleLoNameClick(training)}>Name</button>
    </div>
  ),
}));

jest.mock('@components/ALMFeedback', () => ({
  PrimeFeedbackWrapper: () => <div data-testid="feedback-wrapper" />,
}));

jest.mock('@hooks', () => ({ useLoadMore: jest.fn() }));
jest.mock('@hooks/feedback', () => ({ useFeedback: jest.fn() }));

jest.mock('@utils/global', () => ({
  navigateToLo: jest.fn(),
  getALMConfig: jest.fn(() => ({})),
}));

jest.mock('@components/Widgets/ALMPrimeStrip/ALMPrimeStrip.helper', () => ({
  showRating: jest.fn(),
  showEffectivenessIndex: jest.fn(),
  showAuthorInfo: jest.fn(),
}));

jest.mock('@components/Catalog/PrimeTrainingCardV2/PrimeTrainingCardV2.helper', () => ({
  canShowPrice: jest.fn(),
  launchPlayerHandler: jest.fn(),
  openJobAid: jest.fn(),
}));

jest.mock('@utils/widgets/common', () => ({
  CARD_WIDTH_EXCLUDING_PADDING: 300,
}));

const mockAccount = { id: 'account123' } as PrimeAccount;
const mockUser = { id: 'user1' } as PrimeUser;

const mockTrainings: PrimeLearningObject[] = [
  { id: 'training1', loType: 'course', enrollment: null } as any,
  { id: 'training2', loType: 'learningProgram', enrollment: { id: 'e1' } } as any,
  { id: 'training3', loType: 'course', enrollment: null } as any,
];

const defaultFeedbackReturn = {
  feedbackTrainingId: '',
  trainingInstanceId: '',
  playerLaunchTimeStamp: 0,
  shouldLaunchFeedback: false,
  handleL1FeedbackLaunch: jest.fn(),
  fetchCurrentLo: jest.fn(),
  getFilteredNotificationForFeedback: jest.fn(),
  submitL1Feedback: jest.fn(),
  closeFeedbackWrapper: jest.fn(),
};

beforeEach(() => {
  // useFeedback return value is destructured — must be restored with resetMocks: true
  (useFeedback as jest.Mock).mockReturnValue({ ...defaultFeedbackReturn });
});

const renderContainer = (props: Partial<React.ComponentProps<typeof PrimeTrainingsContainer>> = {}) =>
  render(
    <SpectrumProvider theme={defaultTheme}>
      <IntlProvider locale="en" messages={{ 'alm.catalog.no.result': 'No results found' }}>
        <PrimeTrainingsContainer
          trainings={mockTrainings}
          loadMoreTraining={jest.fn()}
          hasMoreItems={false}
          guest={false}
          user={mockUser}
          account={mockAccount}
          view="LIST_VIEW"
          enrollmentHandler={jest.fn() as any}
          updateLearningObject={jest.fn() as any}
          isloading={false}
          removeTrainingFromListById={jest.fn()}
          addBookmarkHandler={jest.fn()}
          removeBookmarkHandler={jest.fn()}
          {...props}
        />
      </IntlProvider>
    </SpectrumProvider>
  );

describe('PrimeTrainingsContainer', () => {
  describe('List view rendering', () => {
    it('listView_rendersTrainingsList_notCardContainer', () => {
      const { container } = renderContainer({ view: 'LIST_VIEW' });
      expect(container.querySelector('[data-automationid="trainingsList"]')).toBeInTheDocument();
      expect(container.querySelector('[data-automationid="trainingsCard"]')).not.toBeInTheDocument();
    });

    it('listView_rendersOneListItemPerTraining', () => {
      renderContainer({ view: 'LIST_VIEW' });
      expect(screen.getAllByTestId('training-list-item')).toHaveLength(3);
    });
  });

  describe('Tile/card view rendering', () => {
    it('tileView_rendersTrainingsCard_notListContainer', () => {
      const { container } = renderContainer({ view: 'TILE_VIEW' });
      expect(container.querySelector('[data-automationid="trainingsCard"]')).toBeInTheDocument();
      expect(container.querySelector('[data-automationid="trainingsList"]')).not.toBeInTheDocument();
    });

    it('tileView_rendersOneCardPerTraining', () => {
      renderContainer({ view: 'TILE_VIEW' });
      expect(screen.getAllByTestId('training-card')).toHaveLength(3);
    });

    it('tileView_eachCardLiHasWidthFromConstant', () => {
      const { container } = renderContainer({ view: 'TILE_VIEW' });
      const listItems = container.querySelectorAll('[data-automationid="trainingsCard"] > li');
      expect(listItems.length).toBeGreaterThan(0);
      listItems.forEach(item => {
        expect((item as HTMLElement).style.width).toBe('300px');
      });
    });

    it('tileView_enrolledTraining_passesShowProgressBarTrue', () => {
      renderContainer({ view: 'TILE_VIEW' });
      // training2 has enrollment; training1 does not
      const cards = screen.getAllByTestId('training-card');
      const enrolledCard = cards.find(c => c.getAttribute('data-training-id') === 'training2');
      const unenrolledCard = cards.find(c => c.getAttribute('data-training-id') === 'training1');
      expect(enrolledCard).toHaveAttribute('data-show-progress', 'true');
      expect(unenrolledCard).toHaveAttribute('data-show-progress', 'false');
    });
  });

  describe('Empty state', () => {
    it('emptyState_trainingsEmptyAndNotLoading_showsNoResultsMessage', () => {
      renderContainer({ trainings: [], isloading: false });
      const noResults = screen.getByText('No results found');
      expect(noResults).toBeInTheDocument();
      expect(noResults).toHaveAttribute('aria-live', 'polite');
    });

    it('emptyState_trainingsEmptyButLoading_hidesNoResultsMessage', () => {
      renderContainer({ trainings: [], isloading: true });
      expect(screen.queryByText('No results found')).not.toBeInTheDocument();
    });
  });

  describe('useLoadMore hook', () => {
    it('useLoadMore_calledWithTrainingsCallbackAndRef', () => {
      const loadMoreTraining = jest.fn();
      renderContainer({ loadMoreTraining });
      expect(useLoadMore).toHaveBeenCalledWith({
        items: mockTrainings,
        callback: loadMoreTraining,
        elementRef: expect.objectContaining({ current: expect.anything() }),
      });
    });
  });

  describe('Feedback wrapper', () => {
    it('feedback_shouldLaunchFeedbackFalse_hidesFeedbackWrapper', () => {
      renderContainer();
      expect(screen.queryByTestId('feedback-wrapper')).not.toBeInTheDocument();
    });

    it('feedback_shouldLaunchFeedbackTrue_showsFeedbackWrapper', () => {
      (useFeedback as jest.Mock).mockReturnValue({
        ...defaultFeedbackReturn,
        shouldLaunchFeedback: true,
        feedbackTrainingId: 'training1',
        trainingInstanceId: 'instance1',
      });
      renderContainer();
      expect(screen.getByTestId('feedback-wrapper')).toBeInTheDocument();
    });
  });

  describe('Navigation callbacks', () => {
    it('handleActionClick_course_callsNavigateToLoWithTraining', () => {
      renderContainer({ view: 'TILE_VIEW' });
      fireEvent.click(screen.getAllByTestId('action-btn')[0]);
      expect(navigateToLo).toHaveBeenCalledWith(mockTrainings[0]);
    });

    it('handleLoNameClick_jobAid_callsOpenJobAid', () => {
      const jobAidTraining = { id: 'ja1', loType: 'jobAid', enrollment: null } as any;
      renderContainer({ view: 'TILE_VIEW', trainings: [jobAidTraining] });
      fireEvent.click(screen.getByTestId('name-btn'));
      expect(openJobAid).toHaveBeenCalledWith(jobAidTraining, undefined);
      expect(navigateToLo).not.toHaveBeenCalled();
    });

    it('handleLoNameClick_course_callsNavigateToLo', () => {
      const courseTraining = { id: 'c1', loType: 'course', enrollment: null } as any;
      renderContainer({ view: 'TILE_VIEW', trainings: [courseTraining] });
      fireEvent.click(screen.getByTestId('name-btn'));
      expect(navigateToLo).toHaveBeenCalledWith(courseTraining);
      expect(openJobAid).not.toHaveBeenCalled();
    });
  });

  describe('Helper function calls', () => {
    it('showRating_calledWithEachTrainingAndAccount', () => {
      renderContainer({ view: 'LIST_VIEW' });
      expect(showRating).toHaveBeenCalledWith(mockTrainings[0], mockAccount);
      expect(showRating).toHaveBeenCalledWith(mockTrainings[1], mockAccount);
      expect(showRating).toHaveBeenCalledWith(mockTrainings[2], mockAccount);
    });

    it('showEffectivenessIndex_calledPerTraining', () => {
      renderContainer({ view: 'LIST_VIEW' });
      expect(showEffectivenessIndex).toHaveBeenCalledTimes(mockTrainings.length);
    });
  });
});
