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
jest.mock('react-intl', () => ({
  useIntl: jest.fn(() => ({
    formatMessage: jest.fn((descriptor: any) => descriptor.defaultMessage || descriptor.id),
  })),
}));

jest.mock('@contextProviders/userContextProvider', () => ({
  useUserContext: jest.fn(() => ({ user: { contentLocale: 'en-US' } })),
}));

jest.mock('@utils/catalog', () => ({
  isJobaidContentTypeUrl: jest.fn(),
  getJobaidUrl: jest.fn(),
}));

jest.mock('@utils/global', () => ({
  getWidgetConfig: jest.fn(() => ({ isMobile: false })),
  updateURLParams: jest.fn(),
}));

jest.mock('@utils/widgets/utils', () => ({
  CalculateIfTablet: jest.fn(() => false),
}));

jest.mock('@utils/constants', () => ({
  ENGLISH_LOCALE: 'en-US',
  JOB_AID_ID: 'jobAidId',
  UPDATE_LO_ERROR: 'UPDATE_LO_ERROR',
  DEFUALT_LO_INCLUDE: 'enrollment',
}));

jest.mock('@common/APIService', () => ({
  __esModule: true,
  default: {
    unenrollFromTraining: jest.fn(),
  },
}));

jest.mock('@common/Alert/useAlert', () => ({
  useAlert: jest.fn(() => [jest.fn()]),
}));

jest.mock('@common/Alert/AlertDialog', () => ({
  AlertType: { error: 'error', success: 'success' },
}));

jest.mock('@utils/translationService', () => ({
  GetTranslation: jest.fn((key: string) => key),
}));

jest.mock('@utils/playback-utils', () => ({
  LaunchPlayer: jest.fn(),
}));

jest.mock('@utils/lo-utils', () => ({
  getTraining: jest.fn(),
  fetchJobAidResource: jest.fn(),
}));

jest.mock('@components/Catalog/PrimeTrainingCardV2/PrimeTrainingCardV2.helper', () => ({
  openJobAid: jest.fn(),
}));

jest.mock('@common/ALMCustomHooks', () => ({
  DEFUALT_LO_INCLUDE: 'enrollment',
}));

import React from 'react';
import ReactDOM from 'react-dom';
import { act } from '@testing-library/react';
import { useIntl } from 'react-intl';
import { useUserContext } from '@contextProviders/userContextProvider';
import { useJobAids } from '@hooks/useJobAids';
import * as catalogUtils from '@utils/catalog';
import APIServiceInstance from '@common/APIService';
import * as loUtils from '@utils/lo-utils';
import * as playbackUtils from '@utils/playback-utils';
import * as trainingCardHelper from '@components/Catalog/PrimeTrainingCardV2/PrimeTrainingCardV2.helper';
import * as globalUtils from '@utils/global';

const mockUseIntl = useIntl as jest.MockedFunction<typeof useIntl>;
const mockUseUserContext = useUserContext as jest.MockedFunction<typeof useUserContext>;
const mockIsJobaidContentTypeUrl = catalogUtils.isJobaidContentTypeUrl as jest.MockedFunction<typeof catalogUtils.isJobaidContentTypeUrl>;
const mockGetJobaidUrl = catalogUtils.getJobaidUrl as jest.MockedFunction<typeof catalogUtils.getJobaidUrl>;
const mockUnenroll = APIServiceInstance.unenrollFromTraining as jest.MockedFunction<typeof APIServiceInstance.unenrollFromTraining>;
const mockGetTraining = loUtils.getTraining as jest.MockedFunction<typeof loUtils.getTraining>;
const mockFetchJobAidResource = loUtils.fetchJobAidResource as jest.MockedFunction<typeof loUtils.fetchJobAidResource>;
const mockLaunchPlayer = playbackUtils.LaunchPlayer as jest.MockedFunction<typeof playbackUtils.LaunchPlayer>;
const mockOpenJobAid = trainingCardHelper.openJobAid as jest.MockedFunction<typeof trainingCardHelper.openJobAid>;
const mockUpdateURLParams = globalUtils.updateURLParams as jest.MockedFunction<typeof globalUtils.updateURLParams>;

function makeTraining(overrides: any = {}): any {
  return {
    id: 'jobAid:1',
    loType: 'jobAid',
    enrollment: null,
    instances: [{ id: 'inst:1' }],
    ...overrides,
  };
}

function renderHook(training: any, handlers: any = {}) {
  const result: any = { current: null };
  const container = document.createElement('div');
  document.body.appendChild(container);

  act(() => {
    ReactDOM.render(
      React.createElement(() => {
        result.current = useJobAids(
          training,
          handlers.handleLoEnrollment,
          handlers.updateLearningObject,
          handlers.unEnrollmentHandler,
          handlers.removeTrainingFromListById
        );
        return null;
      }),
      container
    );
  });

  return {
    result,
    rerender: (newTraining: any, newHandlers: any = {}) => {
      act(() => {
        ReactDOM.render(
          React.createElement(() => {
            result.current = useJobAids(
              newTraining,
              newHandlers.handleLoEnrollment,
              newHandlers.updateLearningObject,
              newHandlers.unEnrollmentHandler,
              newHandlers.removeTrainingFromListById
            );
            return null;
          }),
          container
        );
      });
    },
    unmount: () => {
      act(() => { ReactDOM.unmountComponentAtNode(container); });
      container.parentNode?.removeChild(container);
    },
  };
}

describe('useJobAids', () => {
  beforeEach(() => {
    // resetMocks:true clears jest.fn() implementations — restore them here
    mockUseIntl.mockReturnValue({
      formatMessage: jest.fn((d: any) => d.defaultMessage || d.id),
    } as any);
    mockUseUserContext.mockReturnValue({ user: { contentLocale: 'en-US' } } as any);
    (globalUtils.getWidgetConfig as jest.Mock).mockReturnValue({ isMobile: false });
    (require('@utils/widgets/utils').CalculateIfTablet as jest.Mock).mockReturnValue(false);
    (require('@common/Alert/useAlert').useAlert as jest.Mock).mockReturnValue([jest.fn()]);
  });

  describe('Initial state', () => {
    it('isEnrolled_withEnrollment_returnsTrue', () => {
      const training = makeTraining({ enrollment: { id: 'enroll:1' } });
      const { result } = renderHook(training);
      expect(result.current.isEnrolled).toBe(true);
    });

    it('isEnrolled_withoutEnrollment_returnsFalse', () => {
      const training = makeTraining({ enrollment: null });
      const { result } = renderHook(training);
      expect(result.current.isEnrolled).toBe(false);
    });

    it('showAlert_initially_returnsFalse', () => {
      const { result } = renderHook(makeTraining());
      expect(result.current.showAlert).toBe(false);
    });
  });

  describe('handleJobAidClick', () => {
    it('handleJobAidClick_urlType_opensInNewTab', () => {
      mockIsJobaidContentTypeUrl.mockReturnValue(true);
      mockGetJobaidUrl.mockReturnValue('https://example.com/aid');
      window.open = jest.fn();

      const training = makeTraining();
      const { result } = renderHook(training);

      act(() => { result.current.handleJobAidClick(training); });

      expect(window.open).toHaveBeenCalledWith('https://example.com/aid', '_blank');
      expect(mockLaunchPlayer).not.toHaveBeenCalled();
    });

    it('handleJobAidClick_playerType_launchesPlayer', () => {
      mockIsJobaidContentTypeUrl.mockReturnValue(false);

      const training = makeTraining();
      const { result } = renderHook(training);

      act(() => { result.current.handleJobAidClick(training); });

      expect(mockLaunchPlayer).toHaveBeenCalledWith(
        expect.objectContaining({ trainingId: training.id })
      );
    });

    it('handleJobAidClick_mobileViewport_uses100PercentDimension', () => {
      mockIsJobaidContentTypeUrl.mockReturnValue(false);
      const { getWidgetConfig } = require('@utils/global');
      (getWidgetConfig as jest.Mock).mockReturnValue({ isMobile: true });

      const training = makeTraining();
      const { result } = renderHook(training);

      act(() => { result.current.handleJobAidClick(training); });

      expect(mockLaunchPlayer).toHaveBeenCalledWith(
        expect.objectContaining({ playerDimension: '100%' })
      );
    });
  });

  describe('unenroll', () => {
    it('unenroll_success_setsIsEnrolledFalse', async () => {
      mockUnenroll.mockResolvedValue({} as any);
      const training = makeTraining({ enrollment: { id: 'enroll:1' } });
      const { result } = renderHook(training);

      await act(async () => { await result.current.unenroll(); });

      expect(mockUnenroll).toHaveBeenCalledWith('enroll:1');
      expect(result.current.isEnrolled).toBe(false);
    });

    it('unenroll_apiError_setsIsEnrolledTrueAndShowsAlert', async () => {
      mockUnenroll.mockRejectedValue(new Error('API Error'));
      const training = makeTraining({ enrollment: { id: 'enroll:1' } });
      const { result } = renderHook(training);

      await act(async () => { await result.current.unenroll(); });

      expect(result.current.isEnrolled).toBe(true);
    });

    it('unenroll_updateLoError_removesTrainingFromList', async () => {
      mockUnenroll.mockRejectedValue({ message: 'UPDATE_LO_ERROR' });
      const removeTrainingFromListById = jest.fn();
      const training = makeTraining({ enrollment: { id: 'enroll:1' } });

      const { result } = renderHook(training, { removeTrainingFromListById });

      await act(async () => { await result.current.unenroll(); });

      expect(removeTrainingFromListById).toHaveBeenCalledWith(training.id);
    });

  });

  describe('enroll', () => {
    it('enroll_success_setsIsEnrolledTrue', async () => {
      const handleLoEnrollment = jest.fn().mockResolvedValue({});
      const training = makeTraining({ enrollment: null });
      const { result } = renderHook(training, { handleLoEnrollment });

      await act(async () => { await result.current.enroll(); });

      expect(handleLoEnrollment).toHaveBeenCalledWith(training.id, training.instances[0].id);
      expect(result.current.isEnrolled).toBe(true);
    });

    it('enroll_noHandler_returnsEarly', async () => {
      const training = makeTraining();
      const { result } = renderHook(training);

      await act(async () => { await result.current.enroll(); });

      // No handler provided — should not throw and isEnrolled stays false
      expect(result.current.isEnrolled).toBe(false);
    });

    it('enroll_handlerThrows_rethrowsError', async () => {
      const handleLoEnrollment = jest.fn().mockRejectedValue(new Error('Enroll failed'));
      const training = makeTraining();
      const { result } = renderHook(training, { handleLoEnrollment });

      await expect(
        act(async () => { await result.current.enroll(); })
      ).rejects.toThrow();
    });
  });

  describe('enrollJobAid / unenrollJobAid', () => {
    it('enrollJobAid_called_callsHandleLoEnrollmentWithCorrectArgs', () => {
      const handleLoEnrollment = jest.fn();
      const training = makeTraining({ enrollment: null });
      const { result } = renderHook(training, { handleLoEnrollment });

      act(() => { result.current.enrollJobAid(); });

      expect(handleLoEnrollment).toHaveBeenCalledWith({
        id: training.id,
        instanceId: training.instances[0].id,
        isSupplementaryLO: false,
      });
      expect(result.current.isEnrolled).toBe(true);
    });

    it('unenrollJobAid_withEnrollment_callsUnEnrollmentHandler', () => {
      const unEnrollmentHandler = jest.fn();
      const training = makeTraining({ enrollment: { id: 'enroll:1' } });
      const { result } = renderHook(training, { unEnrollmentHandler });

      act(() => { result.current.unenrollJobAid(); });

      expect(unEnrollmentHandler).toHaveBeenCalledWith({
        enrollmentId: 'enroll:1',
        isSupplementaryLO: true,
      });
      expect(result.current.isEnrolled).toBe(false);
    });
  });

  describe('nameClickHandler', () => {
    it('nameClickHandler_urlType_launchesDirectly', () => {
      mockIsJobaidContentTypeUrl.mockReturnValue(true);
      mockGetJobaidUrl.mockReturnValue('https://example.com/aid');
      window.open = jest.fn();

      const training = makeTraining();
      const { result } = renderHook(training);

      act(() => { result.current.nameClickHandler(); });

      expect(window.open).toHaveBeenCalled();
    });

    it('nameClickHandler_enrolledPlayerType_launchesPlayer', () => {
      mockIsJobaidContentTypeUrl.mockReturnValue(false);
      const training = makeTraining({ enrollment: { id: 'enroll:1' } });
      const { result } = renderHook(training);

      act(() => { result.current.nameClickHandler(); });

      expect(mockLaunchPlayer).toHaveBeenCalledWith(
        expect.objectContaining({ trainingId: training.id, playerDimension: '100%' })
      );
    });

    it('nameClickHandler_notEnrolledPlayerType_setsShowAlertTrue', () => {
      jest.useFakeTimers();
      mockIsJobaidContentTypeUrl.mockReturnValue(false);
      const training = makeTraining({ enrollment: null });
      const { result } = renderHook(training);

      act(() => { result.current.nameClickHandler(); });

      expect(result.current.showAlert).toBe(true);

      act(() => { jest.runAllTimers(); });

      expect(result.current.showAlert).toBe(false);
      jest.useRealTimers();
    });
  });

  describe('launchJobAid', () => {
    it('launchJobAid_enrolledTraining_fetchesResourceAndOpens', async () => {
      const enrolledTraining = makeTraining({ enrollment: { id: 'enroll:1' } });
      mockGetTraining.mockResolvedValue(enrolledTraining);
      mockFetchJobAidResource.mockResolvedValue('https://resource.example.com/aid.pdf');

      const { result } = renderHook(makeTraining());

      await act(async () => { await result.current.launchJobAid('jobAid:1'); });

      expect(mockGetTraining).toHaveBeenCalledWith('jobAid:1', expect.any(String));
      expect(mockFetchJobAidResource).toHaveBeenCalledWith(enrolledTraining, false, 'en-US');
      expect(mockOpenJobAid).toHaveBeenCalledWith(enrolledTraining, 'https://resource.example.com/aid.pdf');
    });

    it('launchJobAid_unenrolledTraining_showsErrorAlert', async () => {
      const unenrolledTraining = makeTraining({ enrollment: null });
      mockGetTraining.mockResolvedValue(unenrolledTraining);

      const { result } = renderHook(makeTraining());

      await act(async () => { await result.current.launchJobAid('jobAid:1'); });

      expect(mockOpenJobAid).not.toHaveBeenCalled();
    });

    it('launchJobAid_apiError_showsErrorAlertAndClearsJobAidParam', async () => {
      mockGetTraining.mockRejectedValue(new Error('API Error'));

      const { result } = renderHook(makeTraining());

      await act(async () => { await result.current.launchJobAid('jobAid:1'); });

      expect(mockUpdateURLParams).toHaveBeenCalledWith({ jobAidId: '' });
    });

    it('launchJobAid_always_clearsJobAidUrlParam', async () => {
      mockGetTraining.mockResolvedValue(makeTraining({ enrollment: { id: 'e:1' } }));
      mockFetchJobAidResource.mockResolvedValue('');

      const { result } = renderHook(makeTraining());

      await act(async () => { await result.current.launchJobAid('jobAid:1'); });

      expect(mockUpdateURLParams).toHaveBeenCalledWith({ jobAidId: '' });
    });
  });
});
