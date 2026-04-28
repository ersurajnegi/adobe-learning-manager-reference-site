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
import userEvent from '@testing-library/user-event';
import { Provider as ReduxProvider } from 'react-redux';
import { Provider as SpectrumProvider, defaultTheme } from '@adobe/react-spectrum';
import { IntlProvider } from 'react-intl';
import PrimeTrainingCard from '@components/Catalog/PrimeTrainingCard/PrimeTrainingCard';
import '@testing-library/jest-dom/extend-expect';
import store from '../../../store/APIStore';

jest.mock('@utils/translationService', () => ({
  GetTranslation: (key: string) => {
    const map: Record<string, string> = {
      'alm.training.course': 'Course',
      'alm.training.learningProgram': 'Learning Program',
      'alm.training.jobAid': 'Job Aid',
      'alm.format.selfPaced': 'Self Paced',
      'alm.catalog.card.skills.label': 'Skills',
      'alm.jobaid.view': 'View',
      'alm.text.download': 'Download',
    };
    return map[key] || key;
  },
  formatMap: { 'Self Paced': 'alm.format.selfPaced' },
}));

jest.mock('@utils/dateTime', () => ({
  modifyTimeDDMMYY: (date: string) => (date ? '12/31/2024' : ''),
}));

jest.mock('@utils/price', () => ({
  getFormattedPrice: (price: string) => `$${price}`,
  isCommerceEnabled: jest.fn(() => true),
}));

jest.mock('@utils/global', () => ({
  navigateToLogin: jest.fn(),
}));

jest.mock('@utils/inline_svg', () => ({
  SEND_SVG: () => null,
  THREE_DOTS_MENU_SVG: () => null,
}));

// useCanShowRating is a jest.fn() — implementation restored in beforeEach (resetMocks: true clears it)
jest.mock('@utils/hooks', () => ({
  useCanShowRating: jest.fn(() => true),
}));

jest.mock('@components/ALMRatings', () => ({
  ALMStarRating: () => <div data-testid="star-rating" />,
}));

jest.mock('@contextProviders/userContextProvider', () => ({
  useUserContext: () => ({ user: { id: 'user1', account: {} } }),
  UserContextProvider: ({ children }: any) => <>{children}</>,
}));

// Hook mocks — return values restored in beforeEach (resetMocks: true clears mockReturnValue)
jest.mock('@hooks/catalog/useTrainingCard', () => ({
  useTrainingCard: jest.fn(),
}));

jest.mock('@hooks', () => ({
  useTrainingPage: jest.fn(),
}));

jest.mock('@hooks/useJobAids', () => ({
  useJobAids: jest.fn(),
}));

// Messages for formatMessage calls that have no defaultMessage in the component source
const intlMessages = {
  'alm.catalog.card.due.date': 'Due: {0}',
  'alm.catalog.card.progress.percent': '{0}% complete',
  'alm.label.view': 'View {name}',
};

const renderCard = (props: any) =>
  render(
    <ReduxProvider store={store}>
      <SpectrumProvider theme={defaultTheme}>
        <IntlProvider locale="en" messages={intlMessages}>
          <PrimeTrainingCard {...props} />
        </IntlProvider>
      </SpectrumProvider>
    </ReduxProvider>
  );

const makeTraining = (overrides: object = {}) => ({
  id: 'training-1',
  loType: 'course',
  price: null,
  rating: null,
  instances: [],
  ...overrides,
});

const makeProps = (training: any = makeTraining()) => ({
  training,
  guest: false,
  signUpURL: '',
  almDomain: 'test.example.com',
});

const makeCardHookReturn = (overrides: object = {}) => ({
  format: 'Self Paced',
  type: 'course',
  skillNames: 'React, TypeScript',
  name: 'Test Training',
  description: 'Test Description',
  imageUrl: '',
  cardBgStyle: {},
  enrollment: null,
  cardClickHandler: jest.fn(),
  ...overrides,
});

const makeJobAidsHookReturn = (overrides: object = {}) => ({
  enroll: jest.fn(),
  unenroll: jest.fn(),
  jobAidAddToListMsg: 'Add to My Learning',
  jobAidRemoveToListMsg: 'Remove from My Learning',
  nameClickHandler: jest.fn(),
  isEnrolled: false,
  ...overrides,
});

describe('PrimeTrainingCard', () => {
  let mockUseTrainingCard: jest.Mock;
  let mockUseTrainingPage: jest.Mock;
  let mockUseJobAids: jest.Mock;

  beforeEach(() => {
    mockUseTrainingCard = require('@hooks/catalog/useTrainingCard').useTrainingCard;
    mockUseTrainingPage = require('@hooks').useTrainingPage;
    mockUseJobAids = require('@hooks/useJobAids').useJobAids;

    mockUseTrainingCard.mockReturnValue(makeCardHookReturn());
    mockUseTrainingPage.mockReturnValue({
      enrollmentHandler: jest.fn(),
      unEnrollmentHandler: jest.fn(),
      jobAidClickHandler: jest.fn(),
    });
    mockUseJobAids.mockReturnValue(makeJobAidsHookReturn());

    require('@utils/price').isCommerceEnabled.mockReturnValue(true);
    require('@utils/hooks').useCanShowRating.mockReturnValue(true);

    jest.spyOn(store, 'getState').mockReturnValue({} as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Card click', () => {
    it('cardClickHandler_cardClicked_callsHandler', () => {
      const cardClickHandler = jest.fn();
      mockUseTrainingCard.mockReturnValue(makeCardHookReturn({ cardClickHandler }));
      const { container } = renderCard(makeProps());

      userEvent.click(container.querySelector('[role="link"]')!);

      expect(cardClickHandler).toHaveBeenCalledTimes(1);
    });
  });

  describe('Price', () => {
    it('price_commerceEnabledWithPrice_rendersPriceLabel', () => {
      renderCard(makeProps(makeTraining({ price: '99.99' })));

      expect(screen.getByText('$99.99')).toBeInTheDocument();
    });

    it('price_commerceDisabled_priceNotRendered', () => {
      require('@utils/price').isCommerceEnabled.mockReturnValue(false);
      renderCard(makeProps(makeTraining({ price: '99.99' })));

      expect(screen.queryByText(/\$/)).not.toBeInTheDocument();
    });

    it('price_nullPrice_priceNotRendered', () => {
      renderCard(makeProps(makeTraining({ price: null })));

      expect(screen.queryByText(/\$/)).not.toBeInTheDocument();
    });
  });

  describe('Rating', () => {
    it('rating_canShowRatingTrue_rendersStarRating', () => {
      renderCard(makeProps());

      expect(screen.getByTestId('star-rating')).toBeInTheDocument();
    });

    it('rating_canShowRatingFalse_starRatingNotRendered', () => {
      require('@utils/hooks').useCanShowRating.mockReturnValue(false);
      renderCard(makeProps());

      expect(screen.queryByTestId('star-rating')).not.toBeInTheDocument();
    });
  });

  describe('Skills', () => {
    it('skills_withSkillNames_rendersSkillsValue', () => {
      mockUseTrainingCard.mockReturnValue(makeCardHookReturn({ skillNames: 'React, TypeScript' }));
      const { container } = renderCard(makeProps());

      expect(container.querySelector('.skillsValue')?.textContent).toBe('React, TypeScript');
    });

    it('skills_noSkillNames_skillsValueNotRendered', () => {
      mockUseTrainingCard.mockReturnValue(makeCardHookReturn({ skillNames: '' }));
      const { container } = renderCard(makeProps());

      expect(container.querySelector('.skillsValue')).not.toBeInTheDocument();
    });
  });

  describe('Progress and completion', () => {
    it('progress_enrolledInProgress_rendersProgressPercent', () => {
      mockUseTrainingCard.mockReturnValue(makeCardHookReturn({
        enrollment: { progressPercent: 50, hasPassed: false },
      }));
      renderCard(makeProps());

      expect(screen.getByText('50% complete')).toBeInTheDocument();
    });

    it('progress_enrolledHasPassed_rendersCompleteLabel', () => {
      mockUseTrainingCard.mockReturnValue(makeCardHookReturn({
        enrollment: { progressPercent: 100, hasPassed: true },
      }));
      renderCard(makeProps());

      expect(screen.getByText('Complete')).toBeInTheDocument();
    });

    it('progress_notEnrolled_progressNotRendered', () => {
      renderCard(makeProps());

      expect(screen.queryByText(/% complete/)).not.toBeInTheDocument();
      expect(screen.queryByText('Complete')).not.toBeInTheDocument();
    });
  });

  describe('Due date', () => {
    it('completionDeadline_enrolledWithDeadline_rendersDueDate', () => {
      mockUseTrainingCard.mockReturnValue(makeCardHookReturn({
        enrollment: { progressPercent: 50, hasPassed: false, completionDeadline: '2024-12-31T00:00:00.000Z' },
      }));
      renderCard(makeProps());

      expect(screen.getByText('Due: 12/31/2024')).toBeInTheDocument();
    });

    it('completionDeadline_noDeadline_dueDateNotRendered', () => {
      mockUseTrainingCard.mockReturnValue(makeCardHookReturn({
        enrollment: { progressPercent: 50, hasPassed: false, completionDeadline: null },
      }));
      renderCard(makeProps());

      expect(screen.queryByText(/Due:/)).not.toBeInTheDocument();
    });
  });

  describe('Hover', () => {
    it('hover_mouseEnterDescriptionContainer_addsHoverClass', () => {
      const { container } = renderCard(makeProps());

      fireEvent.mouseEnter(container.querySelector('.descriptionContainer')!);

      expect(container.querySelector('.card')).toHaveClass('hover');
    });

    it('hover_mouseLeaveCard_removesHoverClass', () => {
      const { container } = renderCard(makeProps());

      fireEvent.mouseEnter(container.querySelector('.descriptionContainer')!);
      fireEvent.mouseLeave(container.querySelector('[role="link"]')!);

      expect(container.querySelector('.card')).not.toHaveClass('hover');
    });
  });

  describe('Job aid options', () => {
    it('jobAid_unenrolled_rendersViewAndAddToMyLearning', () => {
      mockUseJobAids.mockReturnValue(makeJobAidsHookReturn({ isEnrolled: false }));
      renderCard(makeProps(makeTraining({ loType: 'jobAid' })));

      expect(screen.getByText('View')).toBeInTheDocument();
      expect(screen.getByText('Add to My Learning')).toBeInTheDocument();
    });

    it('jobAid_viewClicked_callsNameClickHandler', () => {
      const nameClickHandler = jest.fn();
      mockUseJobAids.mockReturnValue(makeJobAidsHookReturn({ nameClickHandler }));
      renderCard(makeProps(makeTraining({ loType: 'jobAid' })));

      userEvent.click(screen.getByText('View'));

      expect(nameClickHandler).toHaveBeenCalledTimes(1);
    });

    it('jobAid_enrolled_rendersRemoveFromMyLearning', () => {
      mockUseJobAids.mockReturnValue(makeJobAidsHookReturn({ isEnrolled: true }));
      renderCard(makeProps(makeTraining({ loType: 'jobAid' })));

      expect(screen.getByText('Remove from My Learning')).toBeInTheDocument();
    });

    it('jobAid_addToMyLearningClicked_callsEnroll', () => {
      const enroll = jest.fn();
      mockUseJobAids.mockReturnValue(makeJobAidsHookReturn({ enroll }));
      renderCard(makeProps(makeTraining({ loType: 'jobAid' })));

      userEvent.click(screen.getByText('Add to My Learning'));

      expect(enroll).toHaveBeenCalledTimes(1);
    });

    it('jobAid_removeFromMyLearningClicked_callsUnenroll', () => {
      const unenroll = jest.fn();
      mockUseJobAids.mockReturnValue(makeJobAidsHookReturn({ isEnrolled: true, unenroll }));
      renderCard(makeProps(makeTraining({ loType: 'jobAid' })));

      userEvent.click(screen.getByText('Remove from My Learning'));

      expect(unenroll).toHaveBeenCalledTimes(1);
    });

    it('jobAid_enrolledNoInstances_downloadLinkNotRendered', () => {
      mockUseJobAids.mockReturnValue(makeJobAidsHookReturn({ isEnrolled: true }));
      renderCard(makeProps(makeTraining({ loType: 'jobAid', instances: [] })));

      expect(screen.queryByText('Download')).not.toBeInTheDocument();
    });

    it.each([
      ['nonOtherContentType', 'pdf',   true],
      ['otherContentType',    'OTHER', false],
    ])('jobAid_enrolled_%s_downloadLinkRenderedCorrectly', (_, contentType, shouldRender) => {
      mockUseJobAids.mockReturnValue(makeJobAidsHookReturn({ isEnrolled: true }));
      renderCard(makeProps(makeTraining({
        loType: 'jobAid',
        instances: [{
          loResources: [{
            resources: [{ downloadUrl: 'https://example.com/file', contentType }],
          }],
        }],
      })));

      if (shouldRender) {
        expect(screen.getByText('Download')).toBeInTheDocument();
      } else {
        expect(screen.queryByText('Download')).not.toBeInTheDocument();
      }
    });

    it('jobAid_courseType_jobAidOptionsNotRendered', () => {
      renderCard(makeProps(makeTraining({ loType: 'course' })));

      expect(screen.queryByText('View')).not.toBeInTheDocument();
      expect(screen.queryByText('Add to My Learning')).not.toBeInTheDocument();
    });

    it('jobAid_enrolledHasPassed_completeLabelNotShown', () => {
      // type === JOBAID suppresses the "Complete" label even when hasPassed=true
      mockUseTrainingCard.mockReturnValue(makeCardHookReturn({
        type: 'jobAid',
        enrollment: { progressPercent: 100, hasPassed: true },
      }));
      mockUseJobAids.mockReturnValue(makeJobAidsHookReturn({ isEnrolled: true }));
      renderCard(makeProps(makeTraining({ loType: 'jobAid' })));

      expect(screen.queryByText('Complete')).not.toBeInTheDocument();
    });
  });
});
