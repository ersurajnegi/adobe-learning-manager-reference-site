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
import PrlPreferenceSection from '@components/PrlPreferenceSection/PrlPreferenceSection';
import { useRecommendations } from '@hooks/profile/useRecommendations';
import { getALMAccount, isEmptyJson } from '@utils/global';
import { GetTranslation } from '@utils/translationService';

jest.mock('@hooks/profile/useRecommendations', () => ({ useRecommendations: jest.fn() }));
jest.mock('@utils/global', () => ({ getALMAccount: jest.fn(), isEmptyJson: jest.fn() }));
jest.mock('@utils/translationService', () => ({ GetTranslation: jest.fn() }));
jest.mock('@components/Common/ALMLoader', () => ({
  ALMLoader: () => <div data-testid="loader" />,
}));
jest.mock('@components/PrlPreferenceSection/PrlPreference/PrlPreference', () => ({
  __esModule: true,
  default: ({ heading, onUpdate }: any) => (
    <div data-testid="prl-preference">
      <span>{heading}</span>
      <button
        data-testid={`save-${heading}`}
        onClick={() => onUpdate({ detail: { criteria: ['updated'] } })}
      >
        Save
      </button>
    </div>
  ),
}));

const waitForAsync = async () => { await act(async () => {}); };

// Translation keys returned verbatim by the GetTranslation mock
const PRODUCTS_HEADING = 'text.preferedProducts';
const ROLES_HEADING = 'text.preferedRoles';

const mockItems = {
  id: 'pref-123',
  type: 'userRecommendationPreferences',
  roles: [{ id: 'role-1', name: 'Developer' }],
  products: [{ id: 'prod-1', name: 'Product A' }],
};

const mockAccount = {
  prlCriteria: {
    enabled: true,
    products: { enabled: true, levelsEnabled: true },
    roles: { enabled: true, levelsEnabled: true },
  },
};

const mockGetUserRecommendationPreferences = jest.fn();
const mockGetRecommendationsForType = jest.fn();
const mockGetRecommendationLevels = jest.fn();
const mockSaveUserRecommedations = jest.fn();

beforeEach(() => {
  (isEmptyJson as jest.Mock).mockImplementation((obj: any) => obj && JSON.stringify(obj) === '{}');
  (GetTranslation as jest.Mock).mockImplementation((key: string) => key);
  (getALMAccount as jest.Mock).mockResolvedValue(mockAccount);

  mockGetUserRecommendationPreferences.mockResolvedValue(undefined);
  mockGetRecommendationsForType.mockResolvedValue(undefined);
  mockGetRecommendationLevels.mockResolvedValue(undefined);
  mockSaveUserRecommedations.mockResolvedValue(undefined);

  (useRecommendations as jest.Mock).mockReturnValue({
    items: { ...mockItems },
    products: [{ id: 'prod-1', name: 'Product A' }],
    roles: [{ id: 'role-1', name: 'Developer' }],
    levels: ['beginner', 'intermediate', 'advanced'],
    getUserRecommendationPreferences: mockGetUserRecommendationPreferences,
    getRecommendationsForType: mockGetRecommendationsForType,
    getRecommendationLevels: mockGetRecommendationLevels,
    saveUserRecommedations: mockSaveUserRecommedations,
  });
});

describe('PrlPreferenceSection', () => {
  describe('Rendering', () => {
    it('rendering_prlEnabledBothCriteria_showsProductsAndRolesHeadingAndTwoPreferences', async () => {
      render(<PrlPreferenceSection />);
      await waitForAsync();
      expect(screen.getByRole('heading')).toBeInTheDocument();
      expect(screen.getByText('alm.text.productsAndRoles')).toBeInTheDocument();
      expect(screen.getAllByTestId('prl-preference')).toHaveLength(2);
    });

    it('rendering_prlDisabled_rendersNothing', async () => {
      (getALMAccount as jest.Mock).mockResolvedValue({ prlCriteria: { enabled: false } });
      render(<PrlPreferenceSection />);
      await waitForAsync();
      expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    });

    it('rendering_nullAccount_rendersNothing', async () => {
      (getALMAccount as jest.Mock).mockResolvedValue(null);
      render(<PrlPreferenceSection />);
      await waitForAsync();
      expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    });

    it('rendering_wrongItemType_rendersNothing', async () => {
      (useRecommendations as jest.Mock).mockReturnValue({
        items: { ...mockItems, type: 'differentType' },
        products: [],
        roles: [],
        levels: [],
        getUserRecommendationPreferences: mockGetUserRecommendationPreferences,
        getRecommendationsForType: mockGetRecommendationsForType,
        getRecommendationLevels: mockGetRecommendationLevels,
        saveUserRecommedations: mockSaveUserRecommedations,
      });
      render(<PrlPreferenceSection />);
      await waitForAsync();
      expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    });

    it('rendering_productsOnlyEnabled_showsProductsHeadingAndOneProductsPreference', async () => {
      (getALMAccount as jest.Mock).mockResolvedValue({
        prlCriteria: { enabled: true, products: { enabled: true }, roles: { enabled: false } },
      });
      render(<PrlPreferenceSection />);
      await waitForAsync();
      expect(screen.getByText('alm.prl.products.text')).toBeInTheDocument();
      expect(screen.getAllByTestId('prl-preference')).toHaveLength(1);
      expect(screen.getByText(PRODUCTS_HEADING)).toBeInTheDocument();
      expect(screen.queryByText(ROLES_HEADING)).not.toBeInTheDocument();
    });

    it('rendering_rolesOnlyEnabled_showsRolesHeadingAndOneRolesPreference', async () => {
      (getALMAccount as jest.Mock).mockResolvedValue({
        prlCriteria: { enabled: true, products: { enabled: false }, roles: { enabled: true } },
      });
      render(<PrlPreferenceSection />);
      await waitForAsync();
      expect(screen.getByText('alm.prl.roles.text')).toBeInTheDocument();
      expect(screen.getAllByTestId('prl-preference')).toHaveLength(1);
      expect(screen.getByText(ROLES_HEADING)).toBeInTheDocument();
      expect(screen.queryByText(PRODUCTS_HEADING)).not.toBeInTheDocument();
    });
  });

  describe('getData on mount', () => {
    it('getData_mount_callsUserPreferencesAndBothTypeApisAndLevels', async () => {
      render(<PrlPreferenceSection />);
      await waitForAsync();
      expect(mockGetUserRecommendationPreferences).toHaveBeenCalledTimes(1);
      expect(mockGetRecommendationsForType).toHaveBeenCalledWith('recommendationProducts');
      expect(mockGetRecommendationsForType).toHaveBeenCalledWith('recommendationRoles');
      expect(mockGetRecommendationLevels).toHaveBeenCalledTimes(1);
    });

    it('getData_productsDisabled_skipsProductsApiCallButFetchesRoles', async () => {
      (getALMAccount as jest.Mock).mockResolvedValue({
        prlCriteria: { enabled: true, products: { enabled: false }, roles: { enabled: true, levelsEnabled: false } },
      });
      render(<PrlPreferenceSection />);
      await waitForAsync();
      expect(mockGetRecommendationsForType).not.toHaveBeenCalledWith('recommendationProducts');
      expect(mockGetRecommendationsForType).toHaveBeenCalledWith('recommendationRoles');
    });

    it('getData_rolesDisabled_skipsRolesApiCallButFetchesProducts', async () => {
      (getALMAccount as jest.Mock).mockResolvedValue({
        prlCriteria: { enabled: true, products: { enabled: true, levelsEnabled: false }, roles: { enabled: false } },
      });
      render(<PrlPreferenceSection />);
      await waitForAsync();
      expect(mockGetRecommendationsForType).not.toHaveBeenCalledWith('recommendationRoles');
      expect(mockGetRecommendationsForType).toHaveBeenCalledWith('recommendationProducts');
    });

    it('getData_noLevelsEnabled_skipsLevelsApiCall', async () => {
      (getALMAccount as jest.Mock).mockResolvedValue({
        prlCriteria: {
          enabled: true,
          products: { enabled: true, levelsEnabled: false },
          roles: { enabled: true, levelsEnabled: false },
        },
      });
      render(<PrlPreferenceSection />);
      await waitForAsync();
      expect(mockGetRecommendationLevels).not.toHaveBeenCalled();
    });
  });

  describe('updatePreference', () => {
    it('updatePreference_productsUpdate_callsSaveWithProductsCriteriaAndExistingRoles', async () => {
      render(<PrlPreferenceSection />);
      await waitForAsync();
      fireEvent.click(screen.getByTestId(`save-${PRODUCTS_HEADING}`));
      await waitForAsync();
      expect(mockSaveUserRecommedations).toHaveBeenCalledTimes(1);
      expect(mockSaveUserRecommedations).toHaveBeenCalledWith({
        id: 'pref-123',
        type: 'userRecommendationPreferences',
        attributes: {
          roles: mockItems.roles,
          products: ['updated'],
        },
      });
    });

    it('updatePreference_rolesUpdate_callsSaveWithRolesCriteriaAndExistingProducts', async () => {
      render(<PrlPreferenceSection />);
      await waitForAsync();
      fireEvent.click(screen.getByTestId(`save-${ROLES_HEADING}`));
      await waitForAsync();
      expect(mockSaveUserRecommedations).toHaveBeenCalledWith({
        id: 'pref-123',
        type: 'userRecommendationPreferences',
        attributes: {
          roles: ['updated'],
          products: mockItems.products,
        },
      });
    });

    it('updatePreference_inProgress_loaderIsVisible', async () => {
      mockSaveUserRecommedations.mockReturnValue(new Promise(() => {})); // never resolves
      render(<PrlPreferenceSection />);
      await waitForAsync();
      fireEvent.click(screen.getByTestId(`save-${PRODUCTS_HEADING}`));
      expect(screen.getByTestId('loader')).toBeInTheDocument();
    });

    it('updatePreference_saveCompletes_loaderIsHidden', async () => {
      render(<PrlPreferenceSection />);
      await waitForAsync();
      fireEvent.click(screen.getByTestId(`save-${PRODUCTS_HEADING}`));
      await waitForAsync();
      expect(screen.queryByTestId('loader')).not.toBeInTheDocument();
    });

    it('updatePreference_saveError_logsErrorToConsole', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      mockSaveUserRecommedations.mockRejectedValue(new Error('Save failed'));
      render(<PrlPreferenceSection />);
      await waitForAsync();
      fireEvent.click(screen.getByTestId(`save-${PRODUCTS_HEADING}`));
      await waitForAsync();
      expect(consoleSpy).toHaveBeenCalledWith('Error while saving preference: ', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });
});
