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
import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { waitFor } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import PrlWizard from '@components/PrlWizard/PrlWizard';
import * as prlWizardUtils from '@utils/prlWizardUtils';
import { PrimeEvent } from '@utils/widgets/common';

const mockGetUserRecommendationPreferences = jest.fn();
const mockGetRecommendationsForType = jest.fn();
const mockGetRecommendationLevels = jest.fn();
const mockSaveUserRecommedations = jest.fn();
const mockSendMessageToParent = jest.fn();
const mockGetPrimeEmitEventLinks = jest.fn();

let mockAccount: any = {};

jest.mock('@hooks/profile/useRecommendations', () => ({
  useRecommendations: () => ({
    items: {
      id: 'rec-1',
      type: 'recommendations',
      products: [{ id: 'prod-1', name: 'Product 1' }],
      roles: [{ id: 'role-1', name: 'Role 1' }],
    },
    products: [
      { id: 'prod-1', name: 'Product 1' },
      { id: 'prod-2', name: 'Product 2' },
    ],
    roles: [
      { id: 'role-1', name: 'Role 1' },
      { id: 'role-2', name: 'Role 2' },
    ],
    levels: [],
    getUserRecommendationPreferences: mockGetUserRecommendationPreferences,
    getRecommendationsForType: mockGetRecommendationsForType,
    getRecommendationLevels: mockGetRecommendationLevels,
    saveUserRecommedations: mockSaveUserRecommedations,
  }),
}));

jest.mock('@contextProviders/userContextProvider', () => ({
  useUserContext: () => ({ user: { account: mockAccount } }),
}));

jest.mock('@utils/translationService', () => ({
  GetTranslation: (key: string) => key,
  GetTranslationReplaced: (key: string, value: string) => `${key}:${value}`,
}));

jest.mock('@utils/widgets/base/EventHandlingBase', () => ({
  SendMessageToParent: (...args: any[]) => mockSendMessageToParent(...args),
}));

jest.mock('@utils/global', () => ({
  GetPrimeEmitEventLinks: () => mockGetPrimeEmitEventLinks(),
}));

jest.mock('@utils/inline_svg', () => ({
  PRL_WIZARD_SVG: () =>
    require('react').createElement('svg', { 'data-testid': 'wizard-svg' }),
  PRL_WIZARD_SVG_SMALL: () =>
    require('react').createElement('svg', { 'data-testid': 'wizard-svg-small' }),
  PRL_WIZARD_ERROR_SVG: () =>
    require('react').createElement('svg', { 'data-testid': 'error-svg' }),
}));

jest.mock('@components/PrlPreferenceSection/PrlChips/index', () => ({
  PrlChips: ({ onAdd, onRemove }: any) =>
    require('react').createElement(
      'div',
      { 'data-testid': 'prl-chips' },
      require('react').createElement(
        'button',
        { 'data-testid': 'chip-add', onClick: () => onAdd({ id: 'prod-2', name: 'Product 2' }) },
        'Add'
      ),
      require('react').createElement(
        'button',
        { 'data-testid': 'chip-remove', onClick: () => onRemove({ id: 'prod-1' }) },
        'Remove'
      )
    ),
}));

jest.mock('@components/PrlPreferenceSection/PrlLevelSelector/index', () => ({
  PrlLevelSelector: () =>
    require('react').createElement('div', { 'data-testid': 'level-selector' }),
}));

jest.mock('@utils/prlWizardUtils', () => ({
  ...jest.requireActual('@utils/prlWizardUtils'),
  checkIfWeCanShowPRLWizard: jest.fn(),
  focusOnWizardStep: jest.fn(),
  getIsProductsEnabled: jest.fn(),
  getIsRolesEnabled: jest.fn(),
  getLevelsData: jest.fn(),
  getProductsData: jest.fn(),
  getRolesData: jest.fn(),
  isNextButtonEnable: jest.fn(),
}));

// Navigates from the start view through to the last wizard step (Finish button visible).
// Assumes the component has already been rendered.
async function navigateToFinishStep() {
  await waitFor(() => screen.getByText('prl.start.configure.button.text'));
  userEvent.click(screen.getByText('prl.start.configure.button.text'));
  await waitFor(() => screen.getByText('prl.next.text'));
  userEvent.click(screen.getByText('prl.next.text'));
  await waitFor(() => screen.getByText('prl.finish.text'));
}

describe('PrlWizard', () => {
  beforeEach(() => {
    mockAccount = {
      prlCriteria: {
        enabled: true,
        products: { enabled: true, levelsEnabled: false },
        roles: { enabled: true, levelsEnabled: false },
      },
    };

    mockGetPrimeEmitEventLinks.mockReturnValue([]);
    mockGetUserRecommendationPreferences.mockResolvedValue({});
    mockGetRecommendationsForType.mockResolvedValue({});
    mockGetRecommendationLevels.mockResolvedValue({});
    mockSaveUserRecommedations.mockResolvedValue({});

    (prlWizardUtils.checkIfWeCanShowPRLWizard as jest.Mock).mockReturnValue(true);
    (prlWizardUtils.focusOnWizardStep as jest.Mock).mockImplementation(() => {});
    (prlWizardUtils.getIsProductsEnabled as jest.Mock).mockReturnValue(true);
    (prlWizardUtils.getIsRolesEnabled as jest.Mock).mockReturnValue(true);
    (prlWizardUtils.getProductsData as jest.Mock).mockReturnValue({
      networkCall: Promise.resolve(),
      steps: [prlWizardUtils.WIZARD_STEP.PRODUCTS],
    });
    (prlWizardUtils.getRolesData as jest.Mock).mockReturnValue({
      networkCall: Promise.resolve(),
      steps: [prlWizardUtils.WIZARD_STEP.ROLES],
    });
    (prlWizardUtils.getLevelsData as jest.Mock).mockReturnValue({
      networkCall: Promise.resolve(),
    });
    (prlWizardUtils.isNextButtonEnable as jest.Mock).mockReturnValue(true);
  });

  it('init_prlEnabled_sendsHideFooterAndCallsGetUserPreferences', async () => {
    render(<PrlWizard />);

    expect(mockSendMessageToParent).toHaveBeenCalledWith({ type: PrimeEvent.ALM_HIDE_FOOTER }, []);
    await waitFor(() => {
      expect(mockGetUserRecommendationPreferences).toHaveBeenCalledTimes(1);
    });
  });

  it('init_prlDisabled_showsErrorViewAndSendsPrlDialogClosed', async () => {
    mockAccount = { prlCriteria: { enabled: false } };

    render(<PrlWizard />);

    await waitFor(() => {
      expect(screen.getByTestId('error-svg')).toBeInTheDocument();
    });
    expect(mockSendMessageToParent).toHaveBeenCalledWith({ type: PrimeEvent.PRL_DIALOG_CLOSED }, []);
    expect(mockGetUserRecommendationPreferences).not.toHaveBeenCalled();
  });

  it('getData_wizardCanBeShown_transitionsToStartViewAndSendsPrlDialogLaunched', async () => {
    render(<PrlWizard />);

    await waitFor(() => {
      expect(screen.getByText('prl.start.heading')).toBeInTheDocument();
    });
    expect(mockSendMessageToParent).toHaveBeenCalledWith(
      { type: PrimeEvent.PRL_DIALOG_LAUNCHED },
      []
    );
  });

  it('getData_wizardCannotBeShown_showsErrorViewAndSendsPrlDialogClosed', async () => {
    (prlWizardUtils.checkIfWeCanShowPRLWizard as jest.Mock).mockReturnValue(false);

    render(<PrlWizard />);

    await waitFor(() => {
      expect(screen.getByTestId('error-svg')).toBeInTheDocument();
    });
    expect(mockSendMessageToParent).toHaveBeenCalledWith({ type: PrimeEvent.PRL_DIALOG_CLOSED }, []);
  });

  it('getData_onGetUserPreferencesError_showsErrorView', async () => {
    mockGetUserRecommendationPreferences.mockRejectedValue(new Error('network error'));

    render(<PrlWizard />);

    await waitFor(() => {
      expect(screen.getByTestId('error-svg')).toBeInTheDocument();
    });
  });

  it('startWizard_clickStartButton_transitionsToWizardViewWithChips', async () => {
    render(<PrlWizard />);
    await waitFor(() => screen.getByText('prl.start.configure.button.text'));

    userEvent.click(screen.getByText('prl.start.configure.button.text'));

    await waitFor(() => {
      expect(screen.getByTestId('prl-chips')).toBeInTheDocument();
    });
    expect(screen.queryByText('prl.start.heading')).not.toBeInTheDocument();
  });

  it('isNextButtonEnable_returnsFalse_nextButtonIsDisabled', async () => {
    (prlWizardUtils.isNextButtonEnable as jest.Mock).mockReturnValue(false);

    render(<PrlWizard />);
    await waitFor(() => screen.getByText('prl.start.configure.button.text'));
    userEvent.click(screen.getByText('prl.start.configure.button.text'));

    await waitFor(() => {
      const nextButton = screen.getByText('prl.next.text').closest('button');
      expect(nextButton).toBeDisabled();
    });
  });

  it('proceedToNextStep_clickNext_advancesToLastStepAndShowsFinishButton', async () => {
    render(<PrlWizard />);
    await waitFor(() => screen.getByText('prl.start.configure.button.text'));
    userEvent.click(screen.getByText('prl.start.configure.button.text'));
    await waitFor(() => screen.getByText('prl.next.text'));

    userEvent.click(screen.getByText('prl.next.text'));

    await waitFor(() => {
      expect(screen.getByText('prl.finish.text')).toBeInTheDocument();
    });
    expect(screen.queryByText('prl.next.text')).not.toBeInTheDocument();
  });

  it('submitRecommendations_clickFinish_callsSaveWithCorrectPayloadAndSendsPrlDialogClosed', async () => {
    render(<PrlWizard />);
    await navigateToFinishStep();

    userEvent.click(screen.getByText('prl.finish.text'));

    await waitFor(() => {
      expect(mockSaveUserRecommedations).toHaveBeenCalledWith({
        id: 'rec-1',
        type: 'recommendations',
        attributes: {
          products: [{ id: 'prod-1', name: 'Product 1' }],
          roles: [{ id: 'role-1', name: 'Role 1' }],
        },
      });
      expect(mockSendMessageToParent).toHaveBeenCalledWith({ type: PrimeEvent.PRL_DIALOG_CLOSED }, []);
    });
  });

  it('submitRecommendations_onSaveError_showsErrorView', async () => {
    mockSaveUserRecommedations.mockRejectedValue(new Error('save failed'));

    render(<PrlWizard />);
    await navigateToFinishStep();
    userEvent.click(screen.getByText('prl.finish.text'));

    await waitFor(() => {
      expect(screen.getByTestId('error-svg')).toBeInTheDocument();
    });
  });

  it('almReloadPrlFrame_eventFired_reinitializesWizard', async () => {
    render(<PrlWizard />);
    await waitFor(() => expect(mockGetUserRecommendationPreferences).toHaveBeenCalledTimes(1));

    act(() => {
      document.dispatchEvent(new Event(PrimeEvent.ALM_RELOAD_PRL_FRAME));
    });

    await waitFor(() => {
      expect(mockGetUserRecommendationPreferences).toHaveBeenCalledTimes(2);
    });
  });

  it('unmount_removesAlmReloadPrlFrameEventListener', () => {
    const addEventListenerSpy = jest.spyOn(document, 'addEventListener');
    const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');

    const { unmount } = render(<PrlWizard />);

    expect(addEventListenerSpy).toHaveBeenCalledWith(
      PrimeEvent.ALM_RELOAD_PRL_FRAME,
      expect.any(Function)
    );

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      PrimeEvent.ALM_RELOAD_PRL_FRAME,
      expect.any(Function)
    );

    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
  });
});
