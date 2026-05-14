/**
Copyright 2021 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import PrimeTrainingPageExtraJobAid from '../../../almLib/components/TrainingOverview/PrimeTrainingPageExtraDetailsJobAids/PrimeTrainingPageExtraDetailsJobAids';
import { PrimeLearningObject, PrimeResource } from '../../../almLib/models';

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockAlert = jest.fn();

jest.mock('../../../almLib/utils/translationService', () => ({
  GetTranslation: (key: string) => key,
}));

jest.mock('../../../almLib/hooks/useJobAids', () => ({
  useJobAids: jest.fn(),
}));

jest.mock('../../../almLib/common/Alert/useAlert', () => ({
  useAlert: () => [mockAlert],
}));

jest.mock('../../../almLib/utils/inline_svg', () => {
  const R = require('react');
  return {
    JOBAID_ICON_ADD: () => R.createElement('svg', { 'data-testid': 'add-icon' }),
    JOBAID_ICON_REMOVE: () => R.createElement('svg', { 'data-testid': 'remove-icon' }),
    VIRTUAL_COACH_JOB_AID_ICON: () => R.createElement('svg', { 'data-testid': 'virtual-coach-icon' }),
  };
});

// ─── Fixtures ────────────────────────────────────────────────────────────────

const makeResource = (overrides: any = {}): PrimeResource =>
  ({ id: 'resource123', name: 'Test Job Aid', contentType: 'VIDEO', ...overrides } as any);

const makeTraining = (): PrimeLearningObject =>
  ({ id: 'jobaid123', loType: 'jobAid', localizedMetadata: [] } as any);

const defaultHookReturn = {
  enrollJobAid: jest.fn(),
  unenrollJobAid: jest.fn(),
  jobAidAddToListMsg: 'Add to my list',
  jobAidRemoveToListMsg: 'Remove from my list',
  nameClickHandler: jest.fn(),
  isEnrolled: false,
  showAlert: false,
};

const defaultProps = {
  resource: makeResource(),
  training: makeTraining(),
  enrollmentHandler: jest.fn(),
  unEnrollmentHandler: jest.fn(),
  jobAidClickHandler: jest.fn(),
};

const renderComponent = (props: any = {}) =>
  render(<PrimeTrainingPageExtraJobAid {...defaultProps} {...props} />);

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('PrimeTrainingPageExtraJobAid', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const { useJobAids } = require('../../../almLib/hooks/useJobAids');
    useJobAids.mockReturnValue({ ...defaultHookReturn, enrollJobAid: jest.fn(), unenrollJobAid: jest.fn(), nameClickHandler: jest.fn() });
  });

  describe('Enroll / Unenroll Icon', () => {
    it('notEnrolled_addIconShown_removeIconHidden', () => {
      renderComponent();
      expect(screen.getByTestId('add-icon')).toBeInTheDocument();
      expect(screen.queryByTestId('remove-icon')).toBeNull();
    });

    it('enrolled_removeIconShown_addIconHidden', () => {
      const { useJobAids } = require('../../../almLib/hooks/useJobAids');
      useJobAids.mockReturnValue({ ...defaultHookReturn, isEnrolled: true });
      renderComponent();
      expect(screen.getByTestId('remove-icon')).toBeInTheDocument();
      expect(screen.queryByTestId('add-icon')).toBeNull();
    });

    it('notEnrolled_addIconTitle_matchesAddMsg', () => {
      renderComponent();
      const iconWrapper = screen.getByTestId('add-icon').parentElement;
      expect(iconWrapper?.getAttribute('title')).toBe('Add to my list');
    });

    it('enrolled_removeIconTitle_matchesRemoveMsg', () => {
      const { useJobAids } = require('../../../almLib/hooks/useJobAids');
      useJobAids.mockReturnValue({ ...defaultHookReturn, isEnrolled: true });
      renderComponent();
      const iconWrapper = screen.getByTestId('remove-icon').parentElement;
      expect(iconWrapper?.getAttribute('title')).toBe('Remove from my list');
    });
  });

  describe('Click Handlers', () => {
    it('nameClick_callsNameClickHandlerAndPreventsDefault', () => {
      const nameClickHandler = jest.fn();
      const { useJobAids } = require('../../../almLib/hooks/useJobAids');
      useJobAids.mockReturnValue({ ...defaultHookReturn, nameClickHandler });

      renderComponent();
      const link = screen.getByText('Test Job Aid');
      const event = new MouseEvent('click', { bubbles: true, cancelable: true });
      const preventDefaultSpy = jest.spyOn(event, 'preventDefault');
      link.dispatchEvent(event);

      expect(preventDefaultSpy).toHaveBeenCalled();
      expect(nameClickHandler).toHaveBeenCalled();
    });

    it('addIconClick_callsEnrollJobAid', () => {
      const enrollJobAid = jest.fn();
      const { useJobAids } = require('../../../almLib/hooks/useJobAids');
      useJobAids.mockReturnValue({ ...defaultHookReturn, enrollJobAid });

      renderComponent();
      fireEvent.click(screen.getByTestId('add-icon').parentElement!);
      expect(enrollJobAid).toHaveBeenCalledTimes(1);
    });

    it('removeIconClick_callsUnenrollJobAid', () => {
      const unenrollJobAid = jest.fn();
      const { useJobAids } = require('../../../almLib/hooks/useJobAids');
      useJobAids.mockReturnValue({ ...defaultHookReturn, isEnrolled: true, unenrollJobAid });

      renderComponent();
      fireEvent.click(screen.getByTestId('remove-icon').parentElement!);
      expect(unenrollJobAid).toHaveBeenCalledTimes(1);
    });
  });

  describe('Virtual Coach Icon', () => {
    it('aiCoachContentType_virtualCoachIconShownInsideLink', () => {
      renderComponent({ resource: makeResource({ contentType: 'AI_COACH' }) });
      expect(screen.getByTestId('virtual-coach-icon')).toBeInTheDocument();
    });

    it('nonAiCoachContentType_noVirtualCoachIcon', () => {
      renderComponent({ resource: makeResource({ contentType: 'PDF' }) });
      expect(screen.queryByTestId('virtual-coach-icon')).toBeNull();
    });
  });

  describe('Alert', () => {
    it('showAlert_false_alertNotCalled', () => {
      renderComponent();
      expect(mockAlert).not.toHaveBeenCalled();
    });

    it('showAlert_true_alertCalledWithErrorType', () => {
      const { useJobAids } = require('../../../almLib/hooks/useJobAids');
      useJobAids.mockReturnValue({ ...defaultHookReturn, showAlert: true });
      const { AlertType } = require('../../../almLib/common/Alert/AlertDialog');

      renderComponent();

      expect(mockAlert).toHaveBeenCalledWith(
        true,
        'alm.overview.job.aid.not.in.list',
        AlertType.error
      );
    });

    it('showAlert_changesFromFalseToTrue_alertTriggeredOnRerender', () => {
      const { useJobAids } = require('../../../almLib/hooks/useJobAids');
      useJobAids.mockReturnValue({ ...defaultHookReturn, showAlert: false });

      const { rerender } = renderComponent();
      expect(mockAlert).not.toHaveBeenCalled();

      useJobAids.mockReturnValue({ ...defaultHookReturn, showAlert: true });
      rerender(<PrimeTrainingPageExtraJobAid {...defaultProps} />);

      expect(mockAlert).toHaveBeenCalledTimes(1);
    });
  });

  describe('Hook Wiring', () => {
    it('useJobAids_calledWithTrainingAndHandlers', () => {
      const { useJobAids } = require('../../../almLib/hooks/useJobAids');
      const customEnroll = jest.fn();
      const customUnenroll = jest.fn();

      renderComponent({ enrollmentHandler: customEnroll, unEnrollmentHandler: customUnenroll });

      expect(useJobAids).toHaveBeenCalledWith(
        defaultProps.training,
        customEnroll,
        expect.any(Function),
        customUnenroll
      );
    });
  });
});
