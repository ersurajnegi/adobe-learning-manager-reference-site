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
import PrimeTrainingOverviewHeader from '@components/TrainingOverview/PrimeTrainingOverviewHeader/PrimeTrainingOverviewHeader';
import { PrimeLearningObject, PrimeLearningObjectInstance } from '@models/PrimeModels';

jest.mock('@common/Alert/useAlert', () => ({
  useAlert: () => [jest.fn()],
}));

jest.mock('@contextProviders/userContextProvider', () => ({
  useUserContext: () => ({
    user: {
      id: 'user1',
      contentLocale: 'en-US',
      account: { id: 'account1', shouldPreReqConsiderPassStatus: false },
    },
  }),
}));

jest.mock('@contextProviders/DeviceContextProvider', () => ({
  useDeviceTypeContext: jest.fn(() => ({
    isDesktop: true,
    isMobile: false,
    isTablet: false,
  })),
}));

jest.mock('@utils/overview', () => ({
  checkIsEnrolled: (enrollment: any) =>
    enrollment?.state === 'ENROLLED' || enrollment?.state === 'COMPLETED',
}));

jest.mock('@utils/translationService', () => ({
  getPreferredLocalizedMetadata: (metadata: any) => metadata[0],
  GetTranslation: (key: string) => key,
  formatMap: {
    Activity: 'alm.format.activity',
    Video: 'alm.format.video',
  },
  GetTranslationReplaced: (key: string) => key,
  GetTranslationsReplaced: (key: string) => key,
}));

jest.mock('@components/ALMRatings', () => ({
  ALMStarRating: ({ avgRating, ratingsCount }: any) => (
    <div data-testid="star-rating">
      {avgRating} stars ({ratingsCount} ratings)
    </div>
  ),
}));

jest.mock('@utils/global', () => ({
  getALMConfig: jest.fn(() => ({
    almBaseURL: 'https://example.com',
    handleShareExternally: false,
  })),
  getALMObject: jest.fn(() => ({
    navigateToTrainingOverviewPage: jest.fn(),
    navigateToInstancePage: jest.fn(),
  })),
}));

jest.mock('@utils/hooks', () => ({
  getLoId: (str: string) => str.split('|')[0],
  getLoName: (str: string) => str.split('|')[1] || 'Training',
  getTrainingUrl: (url: string) => url,
  hasSingleActiveInstance: jest.fn(() => true),
  useCanShowRating: jest.fn(() => true),
}));

jest.mock('@utils/dateTime', () => ({
  GetFormattedDate: (date: string) => date,
}));

jest.mock('@utils/lo-utils', () => ({
  getCertificationProofPendingMessage: () => 'Proof pending message',
  getCertificationStatusMessage: () => 'Certification status message',
  getTrainingLink: (trainingId: string, accountId: string) =>
    `https://example.com/training/${trainingId}?account=${accountId}`,
}));

jest.mock('@components/Catalog/PrimeTrainingCardV2/PrimeTrainingCardV2.helper', () => ({
  ratingFormatter: (count: number) => `${count}`,
}));

jest.mock('@utils/breadcrumbUtils', () => ({
  getBreadcrumbPath: jest.fn(() => ({ parentPath: [] })),
}));

jest.mock('@utils/inline_svg', () => ({
  SHARE_ICON: () => '<svg>Share</svg>',
}));

Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(() => Promise.resolve()),
  },
});

// ─── Fixtures ────────────────────────────────────────────────────────────────

const createMockTraining = (overrides: any = {}): PrimeLearningObject =>
  ({
    id: 'training1',
    loType: 'course',
    localizedMetadata: [
      {
        locale: 'en-US',
        name: 'Test Training',
        description: 'Test Description',
        overview: 'Test Overview',
      },
    ],
    isBookmarked: false,
    enrollment: null,
    instances: [
      {
        id: 'instance1',
        state: 'ACTIVE',
        localizedMetadata: [{ locale: 'en-US', name: 'Instance 1' }],
      } as any,
    ],
    duration: 3600,
    hasPreview: false,
    loFormat: 'Self Paced',
    isExternal: false,
    completionDateSameAsApprovalDate: false,
    dateCreated: '2024-01-01T00:00:00Z',
    isSubLoOrderEnforced: false,
    subLOs: [],
    sections: [],
    prerequisiteLOs: [],
    prequisiteConstraints: [],
    rating: { averageRating: 0, ratingsCount: 0 } as any,
    ...overrides,
  } as any);

const createMockInstance = (loResources: any[] = []): PrimeLearningObjectInstance =>
  ({
    id: 'instance1',
    state: 'ACTIVE',
    localizedMetadata: [{ locale: 'en-US', name: 'Instance 1' }],
    isFlexible: false,
    loResources,
  } as any);

const defaultProps = {
  format: 'Self Paced',
  title: 'Test Training',
  color: '#007bff',
  bannerUrl: '',
  showProgressBar: false,
  enrollment: undefined,
  training: createMockTraining(),
  trainingInstance: createMockInstance(),
  instanceSummary: {} as any,
  updateBookMark: jest.fn(() => Promise.resolve()),
  isCourseEnrollable: true,
  isCourseEnrolled: false,
};

const renderComponent = (props: any = {}) =>
  render(
    <SpectrumProvider theme={defaultTheme}>
      <IntlProvider locale="en" messages={{}}>
        <PrimeTrainingOverviewHeader {...defaultProps} {...props} />
      </IntlProvider>
    </SpectrumProvider>
  );

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('PrimeTrainingOverviewHeader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    const { getALMConfig, getALMObject } = require('@utils/global');
    getALMConfig.mockReturnValue({ almBaseURL: 'https://example.com', handleShareExternally: false });
    getALMObject.mockReturnValue({
      navigateToTrainingOverviewPage: jest.fn(),
      navigateToInstancePage: jest.fn(),
    });

    const { hasSingleActiveInstance, useCanShowRating } = require('@utils/hooks');
    hasSingleActiveInstance.mockReturnValue(true);
    useCanShowRating.mockReturnValue(true);

    const { getBreadcrumbPath } = require('@utils/breadcrumbUtils');
    getBreadcrumbPath.mockReturnValue({ parentPath: [] });

    const { useDeviceTypeContext } = require('@contextProviders/DeviceContextProvider');
    useDeviceTypeContext.mockReturnValue({ isDesktop: true, isMobile: false, isTablet: false });

    (navigator.clipboard.writeText as jest.Mock).mockResolvedValue(undefined);
    window.parent.postMessage = jest.fn();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Title', () => {
    it('titleRendered_headingAriaLabelContainsTitle', () => {
      renderComponent();
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading.getAttribute('aria-label')).toContain('Test Training');
    });

    it('heading_hasTabIndexZero', () => {
      renderComponent();
      expect(screen.getByRole('heading', { level: 1 }).getAttribute('tabIndex')).toBe('0');
    });
  });

  describe('Format Label', () => {
    it('loType_learningProgram_lpLabelShown', () => {
      renderComponent({ training: createMockTraining({ loType: 'learningProgram' }) });
      expect(screen.getByText('alm.training.learningProgram')).toBeInTheDocument();
    });

    it('loType_internalCertification_internalLabelShown', () => {
      renderComponent({ training: createMockTraining({ loType: 'certification', isExternal: false }) });
      expect(screen.getByText('Internal alm.training.certification')).toBeInTheDocument();
    });

    it('loType_externalCertification_externalLabelShown', () => {
      renderComponent({ training: createMockTraining({ loType: 'certification', isExternal: true }) });
      expect(screen.getByText('External alm.training.certification')).toBeInTheDocument();
    });

    it('course_noLoResources_noFormatLabelShown', () => {
      renderComponent({ trainingInstance: createMockInstance([]) });
      expect(screen.queryByText(/alm\.format\./i)).toBeNull();
    });

    it('course_mixedResourceTypes_blendedLabelShown', () => {
      const loResources = [
        { id: 'r1', resourceType: 'Activity', localizedMetadata: [{ name: 'Module 1' }] },
        { id: 'r2', resourceType: 'Video', localizedMetadata: [{ name: 'Module 2' }] },
      ];
      renderComponent({ trainingInstance: createMockInstance(loResources) });
      // getCourseFormat() returns 'alm.catalog.card.blended', then .toUpperCase() is applied
      expect(screen.getByText('ALM.CATALOG.CARD.BLENDED')).toBeInTheDocument();
    });
  });

  describe('Bookmark', () => {
    it('bookmark_toggle_callsUpdateBookMarkWithTrue', () => {
      const updateBookMark = jest.fn(() => Promise.resolve());
      const { container } = renderComponent({
        training: createMockTraining({ isBookmarked: false }),
        updateBookMark,
      });
      fireEvent.click(container.querySelector('button[class*="bookMark"]')!);
      expect(updateBookMark).toHaveBeenCalledWith(true, 'training1');
    });

    it('bookmark_courseNotEnrollableAndNotEnrolled_bookmarkHidden', () => {
      const { container } = renderComponent({ isCourseEnrollable: false, isCourseEnrolled: false });
      expect(container.querySelector('button[class*="bookMark"]')).toBeNull();
    });

    it('bookmark_courseNotEnrollableButEnrolled_bookmarkShown', () => {
      const { container } = renderComponent({ isCourseEnrollable: false, isCourseEnrolled: true });
      expect(container.querySelector('button[class*="bookMark"]')).toBeInTheDocument();
    });
  });

  describe('Share', () => {
    it('share_desktop_shareButtonVisible', () => {
      renderComponent();
      expect(screen.getByText('alm.text.share')).toBeInTheDocument();
    });

    it('share_mobile_shareButtonNotShown', () => {
      const { useDeviceTypeContext } = require('@contextProviders/DeviceContextProvider');
      useDeviceTypeContext.mockReturnValue({ isDesktop: false, isMobile: true, isTablet: false });
      renderComponent();
      expect(screen.queryByText('alm.text.share')).toBeNull();
    });

    it('share_buttonClick_opensShareMenu', () => {
      renderComponent();
      fireEvent.click(screen.getByText('alm.text.share').closest('button')!);
      expect(screen.getByText('alm.text.shareUrl')).toBeInTheDocument();
      expect(screen.getByText('alm.text.shareViaEmail')).toBeInTheDocument();
    });

    it('share_copyUrlClick_writesToClipboard', () => {
      renderComponent();
      fireEvent.click(screen.getByText('alm.text.share').closest('button')!);
      fireEvent.click(screen.getByText('alm.text.shareUrl').closest('button')!);
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        'https://example.com/training/training1?account=account1'
      );
    });

    it('share_copyUrlClick_closesShareMenu', () => {
      renderComponent();
      fireEvent.click(screen.getByText('alm.text.share').closest('button')!);
      fireEvent.click(screen.getByText('alm.text.shareUrl').closest('button')!);
      expect(screen.queryByText('alm.text.shareUrl')).toBeNull();
    });

    it('share_emailClick_setsMailtoHref', () => {
      delete (window as any).location;
      window.location = { href: '' } as any;
      renderComponent();
      fireEvent.click(screen.getByText('alm.text.share').closest('button')!);
      fireEvent.click(screen.getByText('alm.text.shareViaEmail').closest('button')!);
      expect(window.location.href).toContain('mailto:');
    });

    it('share_handleShareExternally_postsMessageToParentNotMenu', () => {
      const { getALMConfig } = require('@utils/global');
      getALMConfig.mockReturnValue({ almBaseURL: 'https://example.com', handleShareExternally: true });
      renderComponent();
      fireEvent.click(screen.getByText('alm.text.share').closest('button')!);
      expect(window.parent.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({ eventType: 'shareLoInTeams' }),
        '*'
      );
      expect(screen.queryByText('alm.text.shareUrl')).toBeNull();
    });
  });

  describe('Rating', () => {
    it('rating_averageZero_starRatingHidden', () => {
      renderComponent({ training: createMockTraining({ rating: { averageRating: 0, ratingsCount: 0 } }) });
      expect(screen.queryByTestId('star-rating')).toBeNull();
    });

    it('rating_nonZeroAverage_starRatingShown', () => {
      renderComponent({ training: createMockTraining({ rating: { averageRating: 4.5, ratingsCount: 250 } }) });
      // Component renders star rating in both mobile and desktop containers
      expect(screen.getAllByTestId('star-rating').length).toBeGreaterThan(0);
    });
  });

  describe('Enrollment Count', () => {
    it('enrollmentCount_notEnrolled_countShown', () => {
      const { container } = renderComponent({
        instanceSummary: { enrollmentCount: 150 } as any,
        enrollment: undefined,
      });
      expect(container.textContent).toContain('150');
    });

    it('enrollmentCount_enrolled_countHidden', () => {
      renderComponent({
        instanceSummary: { enrollmentCount: 150 } as any,
        enrollment: { state: 'ENROLLED' } as any,
      });
      expect(screen.queryByText('alm.overview.enrollment.count.text')).toBeNull();
    });

    it('enrollmentCount_undefined_countHidden', () => {
      renderComponent({ instanceSummary: {} as any });
      expect(screen.queryByText('alm.overview.enrollment.count.text')).toBeNull();
    });
  });

  describe('Progress Bar', () => {
    it('progressBar_enrolled_showProgressBar_percentRendered', () => {
      const enrollment = { state: 'ENROLLED', progressPercent: 50 } as any;
      const { container } = renderComponent({ showProgressBar: true, enrollment });
      expect(container.querySelector('[data-automationid="progress-value-50"]')).toBeInTheDocument();
    });

    it('progressBar_notEnrolled_progressBarHidden', () => {
      renderComponent({ showProgressBar: true, enrollment: undefined });
      expect(screen.queryByText(/Progress/i)).toBeNull();
    });

    it('progressBar_externalCert_enrolled_progressBarHidden', () => {
      const training = createMockTraining({ loType: 'certification', isExternal: true });
      const enrollment = { state: 'ENROLLED', progressPercent: 50 } as any;
      const { container } = renderComponent({ training, showProgressBar: true, enrollment });
      expect(container.querySelector('[data-automationid="progress-value-50"]')).toBeNull();
    });
  });

  describe('Certification Status', () => {
    it('externalCert_enrolled_proofPendingMessageShown', () => {
      const training = createMockTraining({ loType: 'certification', isExternal: true });
      renderComponent({ training, enrollment: { state: 'ENROLLED' } as any });
      expect(screen.getByText('Proof pending message')).toBeInTheDocument();
    });

    it('externalCert_pendingApproval_approvalPendingMessageShown', () => {
      const training = createMockTraining({ loType: 'certification', isExternal: true });
      renderComponent({ training, enrollment: { state: 'PENDING_APPROVAL' } as any });
      expect(screen.getByText('msg.approvalPending')).toBeInTheDocument();
    });

    it('externalCert_rejected_rejectedMessageShown', () => {
      const training = createMockTraining({ loType: 'certification', isExternal: true });
      renderComponent({ training, enrollment: { state: 'REJECTED' } as any });
      expect(screen.getByText('msg.proof.rejected')).toBeInTheDocument();
    });

    it('externalCert_completed_completedMessageShown', () => {
      const training = createMockTraining({ loType: 'certification', isExternal: true });
      renderComponent({ training, enrollment: { state: 'COMPLETED' } as any });
      expect(screen.getByText('alm.certification.completed')).toBeInTheDocument();
    });

    it('internalCert_expired_expiredMessageShown', () => {
      const training = createMockTraining({ loType: 'certification', isExternal: false, gracePeriod: 30 });
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 10);
      const enrollment = { state: 'ENROLLED', previousExpiryDate: pastDate.toISOString() } as any;
      renderComponent({ training, enrollment });
      expect(screen.getByText('msg.validityExpired.internal')).toBeInTheDocument();
    });

    it('internalCert_expiryApproaching_expiringMessageShown', () => {
      // previousExpiryDate in 5 days; gracePeriod 30 days → notification period already started
      const training = createMockTraining({ loType: 'certification', isExternal: false, gracePeriod: 30 });
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);
      const enrollment = {
        state: 'ENROLLED',
        previousExpiryDate: futureDate.toISOString(),
        progressPercent: 50,
      } as any;
      renderComponent({ training, enrollment });
      expect(screen.getByText('msg.validityExpiration')).toBeInTheDocument();
    });
  });

  describe('Breadcrumbs', () => {
    it('breadcrumb_emptyParentPath_noBreadcrumbsRendered', () => {
      const { container } = renderComponent();
      expect(container.querySelectorAll('[class*="breadcrumbLink"]')).toHaveLength(0);
    });

    it('breadcrumb_nonEmptyParentPath_breadcrumbButtonsRendered', () => {
      const { getBreadcrumbPath } = require('@utils/breadcrumbUtils');
      getBreadcrumbPath.mockReturnValue({ parentPath: ['lp1|Parent LP'] });
      // Component renders showParentBreadCrumbs() in both mobile and desktop containers
      renderComponent();
      expect(screen.getAllByText('Parent LP')).toHaveLength(2);
    });

    it('breadcrumb_multipleInstances_noEnrollmentInstance_allInstancesButtonShown', () => {
      const { getBreadcrumbPath } = require('@utils/breadcrumbUtils');
      getBreadcrumbPath.mockReturnValue({ parentPath: ['lp1|Parent LP'] });
      const { hasSingleActiveInstance } = require('@utils/hooks');
      hasSingleActiveInstance.mockReturnValue(false);
      renderComponent({ training: createMockTraining({ enrollment: null }) });
      expect(screen.getAllByText('alm.breadcrumb.all.instances')).toHaveLength(2);
    });
  });

  describe('Accessibility', () => {
    it('progressBar_enrolled_hasAriaLabel', () => {
      const enrollment = { state: 'ENROLLED', progressPercent: 50 } as any;
      const { container } = renderComponent({ showProgressBar: true, enrollment });
      const progressBar = container.querySelector('[role="progressbar"]');
      expect(progressBar?.getAttribute('aria-label')).toBeTruthy();
    });

    it('shareButton_desktop_hasAriaLabel', () => {
      renderComponent();
      const shareButton = screen.getByText('alm.text.share').closest('button');
      expect(shareButton?.getAttribute('aria-label')).toBeTruthy();
    });
  });
});
