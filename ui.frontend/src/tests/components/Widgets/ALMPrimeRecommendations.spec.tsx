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
import { waitFor } from '@testing-library/dom';
import { act } from 'react-dom/test-utils';
import ALMPrimeRecommendations from '@components/Widgets/ALMPrimeRecommendations/ALMPrimeRecommendations';

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('@utils/global', () => ({
  getALMConfig: jest.fn(),
  getALMObject: jest.fn(),
  getALMUser: jest.fn(),
  getWidgetConfig: jest.fn(),
}));

jest.mock('@utils/translationService', () => ({
  GetTranslation: jest.fn((key: string) => key),
  getPreferredLocalizedMetadata: jest.fn(),
}));

jest.mock('@utils/restAdapter', () => ({
  RestAdapter: { ajax: jest.fn() },
}));

jest.mock('@utils/jsonAPIAdapter', () => ({
  JsonApiParse: jest.fn(),
}));

jest.mock('@utils/inline_svg', () => ({
  DOWN_ARROW_FILLED: jest.fn(() => null),
}));

jest.mock('@utils/widgets/base/EventHandlingBase', () => ({
  GetSkillsPageLink: jest.fn(() => '/skills'),
  PrimeDispatchEvent: jest.fn(),
}));

jest.mock('@components/Widgets/ALMPrimeRecommendations/recommendations.helper', () => ({
  makeStripsConfig: jest.fn(),
}));

// Preserves stripType in the data-testid so tests can assert on which types were rendered.
jest.mock('@components/Widgets/ALMPrimeStrip/ALMPrimeStrip', () => ({
  __esModule: true,
  default: ({ widget }: any) => (
    <div data-testid={`strip-${widget.layoutAttributes?.id}`} />
  ),
}));

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const mockWidget = {
  widgetRef: 'com.adobe.captivateprime.recommendations',
  type: 'recommendations',
  attributes: { view: 'individual' },
  layoutAttributes: { id: 'main-widget', cardsToShow: 5 },
} as any;

const mockNavigateToSkillsPage = jest.fn();

const makeCpeNewAccount = (overrides: any = {}) => ({
  id: 'account-1',
  recommendationAccountType: 'CPENEW',
  prlCriteria: { enabled: false },
  exploreSkills: true,
  ...overrides,
});

const makeUser = (overrides: any = {}) => ({
  id: 'user-1',
  name: 'Test User',
  account: makeCpeNewAccount(),
  ...overrides,
});

const makeStrips = (types: string[]) =>
  types.map((stripType, i) => ({ id: `strip-${i}`, stripType }));

const renderAndWait = async (props: any = {}) => {
  let result: any;
  await act(async () => {
    result = render(
      <ALMPrimeRecommendations widget={mockWidget} doRefresh={false} {...props} />
    );
  });
  return result!;
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ALMPrimeRecommendations', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    const { GetTranslation } = require('@utils/translationService');
    GetTranslation.mockImplementation((key: string) => key);

    const { getALMConfig, getALMObject, getALMUser, getWidgetConfig } = require('@utils/global');
    getALMConfig.mockReturnValue({ primeApiURL: 'https://api.example.com' });
    getALMObject.mockReturnValue({ navigateToSkillsPage: mockNavigateToSkillsPage });
    getALMUser.mockResolvedValue({ user: makeUser() });
    getWidgetConfig.mockReturnValue({ isMobile: false, hideSkillInterestViewUpdate: false });

    const { JsonApiParse } = require('@utils/jsonAPIAdapter');
    JsonApiParse.mockImplementation((data: any) => data);

    const { RestAdapter } = require('@utils/restAdapter');
    RestAdapter.ajax.mockResolvedValue({
      recommendationCriteriaStripList: makeStrips(['TRENDING_STRIP', 'SKILL_INTEREST_STRIP']),
    });

    const { makeStripsConfig } = require('@components/Widgets/ALMPrimeRecommendations/recommendations.helper');
    // Encode stripType in the layoutAttributes.id so tests can query by type.
    makeStripsConfig.mockImplementation((strips: any[]) =>
      strips.map((strip: any, index: number) => ({
        ...strip,
        layoutAttributes: { id: `${strip.stripType}-${index}` },
        attributes: {},
      }))
    );
  });

  describe('Data Fetching', () => {
    it('onMount_getALMUserCalled', async () => {
      const { getALMUser } = require('@utils/global');
      await renderAndWait();
      expect(getALMUser).toHaveBeenCalledTimes(1);
    });

    it('userWithId_recommendationStripsAPICalledWithCorrectUrl', async () => {
      const { RestAdapter } = require('@utils/restAdapter');
      await renderAndWait();
      await waitFor(() =>
        expect(RestAdapter.ajax).toHaveBeenCalledWith({
          url: 'https://api.example.com/users/user-1/recommendationStrips',
          method: 'GET',
        })
      );
    });

    it('userWithoutId_recommendationStripsAPINotCalled', async () => {
      const { getALMUser } = require('@utils/global');
      getALMUser.mockResolvedValue({ user: null });
      const { RestAdapter } = require('@utils/restAdapter');
      await renderAndWait();
      expect(RestAdapter.ajax).not.toHaveBeenCalled();
    });
  });

  describe('Strip Filtering', () => {
    it('cpeNew_individual_discoveryAndSuperRelevantFiltered_othersShown', async () => {
      const { RestAdapter } = require('@utils/restAdapter');
      RestAdapter.ajax.mockResolvedValue({
        recommendationCriteriaStripList: makeStrips([
          'DISCOVERY_STRIP',
          'TRENDING_STRIP',
          'SUPER_RELEVANT_STRIP',
          'SKILL_INTEREST_STRIP',
        ]),
      });
      await renderAndWait();
      // makeStripsConfig re-indexes from 0 on the filtered subset, so indices restart.
      await waitFor(() =>
        expect(screen.getByTestId('strip-TRENDING_STRIP-0')).toBeInTheDocument()
      );
      expect(screen.getByTestId('strip-SKILL_INTEREST_STRIP-1')).toBeInTheDocument();
      expect(screen.queryByTestId('strip-DISCOVERY_STRIP-0')).toBeNull();
      expect(screen.queryByTestId('strip-SUPER_RELEVANT_STRIP-0')).toBeNull();
    });

    it('cpeNew_consolidated_onlySuperRelevantShown', async () => {
      const { RestAdapter } = require('@utils/restAdapter');
      RestAdapter.ajax.mockResolvedValue({
        recommendationCriteriaStripList: makeStrips([
          'DISCOVERY_STRIP',
          'TRENDING_STRIP',
          'SUPER_RELEVANT_STRIP',
        ]),
      });
      await renderAndWait({
        widget: { ...mockWidget, attributes: { view: 'consolidated' } },
      });
      // After filtering DISCOVERY and keeping only SUPER_RELEVANT, makeStripsConfig re-indexes from 0.
      await waitFor(() =>
        expect(screen.getByTestId('strip-SUPER_RELEVANT_STRIP-0')).toBeInTheDocument()
      );
      expect(screen.queryByTestId('strip-DISCOVERY_STRIP-0')).toBeNull();
      expect(screen.queryByTestId('strip-TRENDING_STRIP-0')).toBeNull();
    });

    it('nonCpeNew_noTypeFiltering_discoveryStripShown', async () => {
      const { getALMUser } = require('@utils/global');
      getALMUser.mockResolvedValue({
        user: makeUser({ account: { ...makeCpeNewAccount(), recommendationAccountType: 'OTHER' } }),
      });
      const { RestAdapter } = require('@utils/restAdapter');
      RestAdapter.ajax.mockResolvedValue({
        recommendationCriteriaStripList: makeStrips(['DISCOVERY_STRIP', 'TRENDING_STRIP']),
      });
      await renderAndWait();
      await waitFor(() =>
        expect(screen.getByTestId('strip-DISCOVERY_STRIP-0')).toBeInTheDocument()
      );
    });
  });

  describe('Load More', () => {
    it('remainingStrips_loadMoreButtonShown', async () => {
      // CPENEW sets STRIPS_TO_LOAD_COUNT=2; 5 strips → 2 initial, 3 remaining → button shown.
      const { RestAdapter } = require('@utils/restAdapter');
      RestAdapter.ajax.mockResolvedValue({
        recommendationCriteriaStripList: makeStrips([
          'TRENDING_STRIP',
          'TRENDING_STRIP',
          'TRENDING_STRIP',
          'TRENDING_STRIP',
          'TRENDING_STRIP',
        ]),
      });
      await renderAndWait();
      await waitFor(() => expect(screen.getByText('viewMore')).toBeInTheDocument());
    });

    it('noRemainingStrips_loadMoreButtonHidden', async () => {
      // Only 1 strip → fits in initial load → no remaining → no button.
      const { RestAdapter } = require('@utils/restAdapter');
      RestAdapter.ajax.mockResolvedValue({
        recommendationCriteriaStripList: makeStrips(['TRENDING_STRIP']),
      });
      await renderAndWait();
      await waitFor(() =>
        expect(screen.getByTestId('strip-TRENDING_STRIP-0')).toBeInTheDocument()
      );
      expect(screen.queryByText('viewMore')).toBeNull();
    });

    it('loadMoreClick_additionalStripsAdded', async () => {
      // 5 TRENDING strips → 2 shown initially, button present; click → more strips added.
      const { RestAdapter } = require('@utils/restAdapter');
      RestAdapter.ajax.mockResolvedValue({
        recommendationCriteriaStripList: makeStrips([
          'TRENDING_STRIP',
          'TRENDING_STRIP',
          'TRENDING_STRIP',
          'TRENDING_STRIP',
          'TRENDING_STRIP',
        ]),
      });
      await renderAndWait();
      await waitFor(() => expect(screen.getByText('viewMore')).toBeInTheDocument());
      const initialCount = screen.getAllByTestId(/^strip-TRENDING/).length;
      fireEvent.click(screen.getByText('viewMore'));
      await waitFor(() =>
        expect(screen.getAllByTestId(/^strip-TRENDING/).length).toBeGreaterThan(initialCount)
      );
    });
  });

  describe('Skill Interest Links', () => {
    it('skillLinks_allConditionsMet_viewAndUpdateLinksShown', async () => {
      await renderAndWait();
      await waitFor(() => expect(screen.getByText('lo.strip.view')).toBeInTheDocument());
      expect(screen.getByText('lo.strip.update')).toBeInTheDocument();
    });

    it('skillLinks_consolidatedView_hidden', async () => {
      await renderAndWait({
        widget: { ...mockWidget, attributes: { view: 'consolidated' } },
      });
      await waitFor(() =>
        expect(document.querySelector('[data-automationid="primelxp-view-skills"]')).toBeNull()
      );
    });

    it('skillLinks_mobile_hidden', async () => {
      const { getWidgetConfig } = require('@utils/global');
      getWidgetConfig.mockReturnValue({ isMobile: true, hideSkillInterestViewUpdate: false });
      await renderAndWait();
      await waitFor(() =>
        expect(document.querySelector('[data-automationid="primelxp-view-skills"]')).toBeNull()
      );
    });

    it('skillLinks_hideSkillInterestViewUpdate_hidden', async () => {
      const { getWidgetConfig } = require('@utils/global');
      getWidgetConfig.mockReturnValue({ isMobile: false, hideSkillInterestViewUpdate: true });
      await renderAndWait();
      await waitFor(() =>
        expect(document.querySelector('[data-automationid="primelxp-view-skills"]')).toBeNull()
      );
    });

    it('viewLink_click_navigatesWithViewConstant', async () => {
      await renderAndWait();
      await waitFor(() => expect(screen.getByText('lo.strip.view')).toBeInTheDocument());
      fireEvent.click(screen.getByText('lo.strip.view'));
      expect(mockNavigateToSkillsPage).toHaveBeenCalledWith('view');
    });

    it('updateLink_click_navigatesWithUpdateConstant', async () => {
      await renderAndWait();
      await waitFor(() => expect(screen.getByText('lo.strip.update')).toBeInTheDocument());
      fireEvent.click(screen.getByText('lo.strip.update'));
      expect(mockNavigateToSkillsPage).toHaveBeenCalledWith('update');
    });
  });
});
