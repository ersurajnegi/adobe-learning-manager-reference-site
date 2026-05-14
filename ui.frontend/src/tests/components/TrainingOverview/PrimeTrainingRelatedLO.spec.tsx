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
import { act } from 'react-dom/test-utils';
import '@testing-library/jest-dom';
import PrimeTrainingRelatedLO from '@components/TrainingOverview/PrimeTrainingRelatedLO/PrimeTrainingRelatedLO';
import { PrimeLearningObject } from '@models/PrimeModels';

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('@utils/translationService', () => ({
  GetTranslation: (key: string) => key,
  GetTranslationsReplaced: (_key: string, params?: any) => `Bookmark ${params?.relatedLo}`,
}));

jest.mock('@utils/inline_svg', () => {
  const R = require('react');
  return {
    BOOKMARK_ICON: () => R.createElement('span', { 'data-testid': 'bookmark-icon' }),
    BOOKMARKED_ICON: () => R.createElement('span', { 'data-testid': 'bookmarked-icon' }),
  };
});

jest.mock('@utils/global', () => ({
  getALMObject: jest.fn(() => ({
    isPrimeUserLoggedIn: () => true,
  })),
}));

jest.mock('@utils/themes', () => ({
  GetTileImageFromId: (id: string) => `tile-${id}`,
  GetTileColor: () => '#aabbcc',
}));

jest.mock('@utils/breadcrumbUtils', () => ({
  clearBreadcrumbPathDetails: jest.fn(),
}));

jest.mock('@utils/lo-utils', () => ({
  getTraining: jest.fn(),
}));

jest.mock('@components/Catalog/PrimeTrainingCardV2/PrimeTrainingCardV2.helper', () => ({
  handleRedirectionForLoggedIn: jest.fn(),
  handleRedirectionForNonLoggedIn: jest.fn(),
}));

jest.mock('@utils/catalog', () => ({
  getActiveInstances: jest.fn(() => []),
}));

jest.mock('@utils/hooks', () => ({
  useCardIcon: () => ({ listThumbnailBgStyle: {} }),
}));

jest.mock('@utils/constants', () => ({
  TRAINING_CARD_ICON_SIZE_OVERVIEW_PAGE: 48,
}));

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const makeSkill = (name: string) => ({
  id: 'skill1',
  skillLevel: { id: 'level1', skill: { id: 'skill1', name } as any } as any,
} as any);

const makeLO = (overrides: any = {}): PrimeLearningObject =>
  ({
    id: 'lo123',
    loType: 'course',
    localizedMetadata: [{ locale: 'en-US', name: 'Test Course', description: '', overview: '' }],
    isBookmarked: false,
    skills: [makeSkill('JavaScript')],
    enrollment: null,
    instances: [],
    ...overrides,
  } as any);

const defaultProps = {
  relatedLO: makeLO(),
  skills: [],
  updateBookMark: jest.fn(() => Promise.resolve()),
};

const renderComponent = (props: any = {}) =>
  render(<PrimeTrainingRelatedLO {...defaultProps} {...props} />);

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('PrimeTrainingRelatedLO', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Restore jest.fn() implementations cleared by resetMocks:true
    const loUtils = require('@utils/lo-utils');
    loUtils.getTraining.mockResolvedValue(makeLO());

    const global = require('@utils/global');
    global.getALMObject.mockReturnValue({ isPrimeUserLoggedIn: () => true });
  });

  describe('LO Name', () => {
    it('loName_renderedAsLinkWithCorrectText', () => {
      renderComponent();
      expect(screen.getByRole('link', { name: 'Test Course' })).toBeInTheDocument();
    });
  });

  describe('Skill Section', () => {
    it('skill_present_skillNameShown', () => {
      renderComponent();
      expect(screen.getByText('JavaScript')).toBeInTheDocument();
      expect(screen.getByText('alm.related.lo.skills')).toBeInTheDocument();
    });

    it('skill_absent_skillSectionHidden', () => {
      renderComponent({ relatedLO: makeLO({ skills: undefined }) });
      expect(screen.queryByText('alm.related.lo.skills')).toBeNull();
    });

    it('skill_missingSkillLevel_skillSectionHidden', () => {
      renderComponent({ relatedLO: makeLO({ skills: [{ id: 's1', skillLevel: undefined }] }) });
      expect(screen.queryByText('alm.related.lo.skills')).toBeNull();
    });
  });

  describe('Bookmark Icon', () => {
    it('notBookmarked_bookmarkIconShown', () => {
      renderComponent({ relatedLO: makeLO({ isBookmarked: false }) });
      expect(screen.getByTestId('bookmark-icon')).toBeInTheDocument();
      expect(screen.queryByTestId('bookmarked-icon')).toBeNull();
    });

    it('bookmarked_bookmarkedIconShown', () => {
      renderComponent({ relatedLO: makeLO({ isBookmarked: true }) });
      expect(screen.getByTestId('bookmarked-icon')).toBeInTheDocument();
      expect(screen.queryByTestId('bookmark-icon')).toBeNull();
    });
  });

  describe('Bookmark Toggle', () => {
    it('bookmarkClick_notBookmarked_callsUpdateBookMarkTrueAndSwitchesIcon', () => {
      const updateBookMark = jest.fn(() => Promise.resolve());
      renderComponent({ relatedLO: makeLO({ isBookmarked: false }), updateBookMark });

      fireEvent.click(screen.getByRole('button'));

      expect(updateBookMark).toHaveBeenCalledWith(true, 'lo123');
      expect(screen.getByTestId('bookmarked-icon')).toBeInTheDocument();
    });

    it('bookmarkClick_bookmarked_callsUpdateBookMarkFalseAndSwitchesIcon', () => {
      const updateBookMark = jest.fn(() => Promise.resolve());
      renderComponent({ relatedLO: makeLO({ isBookmarked: true }), updateBookMark });

      fireEvent.click(screen.getByRole('button'));

      expect(updateBookMark).toHaveBeenCalledWith(false, 'lo123');
      expect(screen.getByTestId('bookmark-icon')).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('nameClick_loggedIn_callsHandleRedirectionForLoggedIn', async () => {
      const { handleRedirectionForLoggedIn } = require(
        '@components/Catalog/PrimeTrainingCardV2/PrimeTrainingCardV2.helper'
      );
      renderComponent();
      fireEvent.click(screen.getByRole('link', { name: 'Test Course' }));
      await act(async () => {});
      expect(handleRedirectionForLoggedIn).toHaveBeenCalledTimes(1);
    });

    it('nameClick_notLoggedIn_callsHandleRedirectionForNonLoggedIn', async () => {
      const global = require('@utils/global');
      global.getALMObject.mockReturnValue({ isPrimeUserLoggedIn: () => false });
      const { handleRedirectionForNonLoggedIn } = require(
        '@components/Catalog/PrimeTrainingCardV2/PrimeTrainingCardV2.helper'
      );
      renderComponent();
      fireEvent.click(screen.getByRole('link', { name: 'Test Course' }));
      await act(async () => {});
      expect(handleRedirectionForNonLoggedIn).toHaveBeenCalledTimes(1);
    });

    it('nameClick_trainingResponseNull_noRedirection', async () => {
      const loUtils = require('@utils/lo-utils');
      loUtils.getTraining.mockResolvedValue(null);
      const { handleRedirectionForLoggedIn, handleRedirectionForNonLoggedIn } = require(
        '@components/Catalog/PrimeTrainingCardV2/PrimeTrainingCardV2.helper'
      );
      renderComponent();
      fireEvent.click(screen.getByRole('link', { name: 'Test Course' }));
      await act(async () => {});
      expect(loUtils.getTraining).toHaveBeenCalledWith('lo123');
      expect(handleRedirectionForLoggedIn).not.toHaveBeenCalled();
      expect(handleRedirectionForNonLoggedIn).not.toHaveBeenCalled();
    });
  });
});
