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
import PrlPreference from '@components/PrlPreferenceSection/PrlPreference/PrlPreference';
import { ADVANCED } from '@utils/widgets/common';

jest.mock('@components/PrlPreferenceSection/PrlChips', () => ({
  PrlChips: ({ onAdd, onRemove }: any) => (
    <div data-testid="prl-chips">
      <button data-testid="add-chip-btn" onClick={() => onAdd({ id: 'new-1', name: 'New Skill' })}>
        Add
      </button>
      <button data-testid="remove-chip-btn" onClick={() => onRemove({ id: 'skill-1', name: 'Skill 1' })}>
        Remove
      </button>
    </div>
  ),
}));

jest.mock('@components/PrlPreferenceSection/PrlLevelSelector', () => ({
  PrlLevelSelector: ({ onChangeHandler }: any) => (
    <div data-testid="prl-level-selector">
      <button
        data-testid="change-level-btn"
        onClick={() =>
          onChangeHandler({ detail: { item: { id: 'skill-1', name: 'Skill 1', levels: ['intermediate'] } } })
        }
      >
        Change Level
      </button>
      <button
        data-testid="change-level-no-id-btn"
        onClick={() => onChangeHandler({ detail: { item: {} } })}
      >
        Bad Level
      </button>
    </div>
  ),
}));

jest.mock('@components/ALMDialog', () => ({
  ALMDialog: ({ children, id }: any) => <div data-testid={`dialog-${id}`}>{children}</div>,
  ALMDialogHeader: ({ children }: any) => <div>{children}</div>,
}));

jest.mock('@adobe/react-spectrum', () => ({
  Heading: ({ children }: any) => <h3>{children}</h3>,
}));

const mockOpenDialog = jest.fn();
const mockCloseDialog = jest.fn();
const mockIsOpen = jest.fn();

jest.mock('@contextProviders/ALMDialogContextProvider', () => ({
  useDialog: () => ({
    isOpen: mockIsOpen,
    openDialog: mockOpenDialog,
    closeDialog: mockCloseDialog,
  }),
}));

const mockSelectedCriteria = [
  { id: 'skill-1', name: 'Skill 1', levels: ['advanced'] },
  { id: 'skill-2', name: 'Skill 2', levels: ['intermediate'] },
];
const mockAllCriteria = [
  { id: 'skill-1', name: 'Skill 1' },
  { id: 'skill-2', name: 'Skill 2' },
  { id: 'skill-3', name: 'Skill 3' },
];
const mockLevels = ['beginner', 'intermediate', 'advanced'];

const defaultProps = {
  selectedCriteria: mockSelectedCriteria,
  allCriteria: mockAllCriteria,
  isLevelsEnabled: false,
  levels: mockLevels,
  onUpdate: jest.fn(),
  isSaving: false,
  heading: 'Skills',
};

const renderPreference = (overrides: Record<string, any> = {}) =>
  render(
    <IntlProvider locale="en" messages={{}}>
      <PrlPreference {...defaultProps} {...overrides} />
    </IntlProvider>
  );

beforeEach(() => {
  mockIsOpen.mockReturnValue(false);
  Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1024 });
});

describe('PrlPreference', () => {
  describe('View mode', () => {
    it('viewMode_withSelectedCriteria_displaysJoinedNamesAndEditButton', () => {
      renderPreference();
      expect(screen.getByText('Skill 1, Skill 2')).toBeInTheDocument();
      expect(screen.getByText('Edit')).toBeInTheDocument();
      expect(screen.queryByTestId('prl-chips')).not.toBeInTheDocument();
    });

    it('viewMode_propsUpdate_displaysNewCriteriaNames', () => {
      const { rerender } = renderPreference();
      rerender(
        <IntlProvider locale="en" messages={{}}>
          <PrlPreference {...defaultProps} selectedCriteria={[{ id: 'skill-3', name: 'React', levels: [] }]} />
        </IntlProvider>
      );
      expect(screen.getByText('React')).toBeInTheDocument();
    });
  });

  describe('Desktop edit mode', () => {
    it('editMode_desktop_clickEdit_showsPrlChipsAndCancelSave', () => {
      renderPreference();
      fireEvent.click(screen.getByText('Edit'));
      expect(screen.getByTestId('prl-chips')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Save')).toBeInTheDocument();
    });

    it('editMode_desktop_cancel_hidesChipsAndRestoresViewMode', () => {
      renderPreference();
      fireEvent.click(screen.getByText('Edit'));
      fireEvent.click(screen.getByText('Cancel'));
      expect(screen.queryByTestId('prl-chips')).not.toBeInTheDocument();
      expect(screen.getByText('Edit')).toBeInTheDocument();
    });

    it('editMode_levelsEnabled_showsBothPrlChipsAndPrlLevelSelector', () => {
      renderPreference({ isLevelsEnabled: true });
      fireEvent.click(screen.getByText('Edit'));
      expect(screen.getByTestId('prl-chips')).toBeInTheDocument();
      expect(screen.getByTestId('prl-level-selector')).toBeInTheDocument();
    });

    it('editMode_levelsDisabled_showsPrlChipsNotLevelSelector', () => {
      renderPreference({ isLevelsEnabled: false });
      fireEvent.click(screen.getByText('Edit'));
      expect(screen.getByTestId('prl-chips')).toBeInTheDocument();
      expect(screen.queryByTestId('prl-level-selector')).not.toBeInTheDocument();
    });
  });

  describe('Save behavior', () => {
    it('save_validCriteria_callsOnUpdateWithExactPayloadAndExitsEditMode', () => {
      const onUpdate = jest.fn();
      renderPreference({ onUpdate });
      fireEvent.click(screen.getByText('Edit'));
      fireEvent.click(screen.getByText('Save'));
      expect(onUpdate).toHaveBeenCalledTimes(1);
      expect(onUpdate).toHaveBeenCalledWith({ detail: { criteria: mockSelectedCriteria } });
      expect(screen.queryByTestId('prl-chips')).not.toBeInTheDocument();
    });

    it('save_onUpdateUndefined_editModeRemainsOpen', () => {
      renderPreference({ onUpdate: undefined });
      fireEvent.click(screen.getByText('Edit'));
      fireEvent.click(screen.getByText('Save'));
      expect(screen.getByTestId('prl-chips')).toBeInTheDocument();
    });

    it('save_emptyCriteria_saveButtonIsDisabled', () => {
      renderPreference({ selectedCriteria: [] });
      fireEvent.click(screen.getByText('Edit'));
      expect(screen.getByText('Save')).toBeDisabled();
    });

    it('save_isSavingTrue_saveButtonIsDisabled', () => {
      renderPreference({ isSaving: true });
      fireEvent.click(screen.getByText('Edit'));
      expect(screen.getByText('Save')).toBeDisabled();
    });
  });

  describe('Criteria add and remove', () => {
    it('addSelected_levelsEnabled_savePayloadIncludesAdvancedLevelOnNewItem', () => {
      const onUpdate = jest.fn();
      renderPreference({ isLevelsEnabled: true, onUpdate });
      fireEvent.click(screen.getByText('Edit'));
      fireEvent.click(screen.getByTestId('add-chip-btn'));
      fireEvent.click(screen.getByText('Save'));
      expect(onUpdate).toHaveBeenCalledWith({
        detail: {
          criteria: expect.arrayContaining([
            expect.objectContaining({ id: 'new-1', levels: [ADVANCED] }),
          ]),
        },
      });
    });

    it('addSelected_levelsDisabled_savePayloadHasUndefinedLevelsOnNewItem', () => {
      const onUpdate = jest.fn();
      renderPreference({ isLevelsEnabled: false, onUpdate });
      fireEvent.click(screen.getByText('Edit'));
      fireEvent.click(screen.getByTestId('add-chip-btn'));
      fireEvent.click(screen.getByText('Save'));
      expect(onUpdate).toHaveBeenCalledWith({
        detail: {
          criteria: expect.arrayContaining([
            expect.objectContaining({ id: 'new-1', levels: undefined }),
          ]),
        },
      });
    });

    it('removeSelected_savePayloadExcludesRemovedItemAndKeepsOthers', () => {
      const onUpdate = jest.fn();
      renderPreference({ onUpdate });
      fireEvent.click(screen.getByText('Edit'));
      fireEvent.click(screen.getByTestId('remove-chip-btn')); // removes skill-1
      fireEvent.click(screen.getByText('Save'));
      const passedCriteria = onUpdate.mock.calls[0][0].detail.criteria;
      expect(passedCriteria.find((c: any) => c.id === 'skill-1')).toBeUndefined();
      expect(passedCriteria.find((c: any) => c.id === 'skill-2')).toEqual(expect.objectContaining({ id: 'skill-2', name: 'Skill 2' }));
    });
  });

  describe('Level update', () => {
    it('updateLevel_validItem_savePayloadReflectsNewLevel', () => {
      const onUpdate = jest.fn();
      renderPreference({ isLevelsEnabled: true, onUpdate });
      fireEvent.click(screen.getByText('Edit'));
      fireEvent.click(screen.getByTestId('change-level-btn')); // sets skill-1 levels → ['intermediate']
      fireEvent.click(screen.getByText('Save'));
      const passedCriteria = onUpdate.mock.calls[0][0].detail.criteria;
      expect(passedCriteria.find((c: any) => c.id === 'skill-1').levels).toEqual(['intermediate']);
    });

    it('updateLevel_missingItemId_callsConsoleError', () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      renderPreference({ isLevelsEnabled: true });
      fireEvent.click(screen.getByText('Edit'));
      fireEvent.click(screen.getByTestId('change-level-no-id-btn'));
      expect(errorSpy).toHaveBeenCalledWith('NO data in custom event : ', expect.any(String));
      errorSpy.mockRestore();
    });
  });

  describe('Mobile edit mode', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 375 });
    });

    it('mobile_editClick_callsOpenDialogNotCloseDialog', () => {
      renderPreference();
      fireEvent.click(screen.getByText('Edit'));
      expect(mockOpenDialog).toHaveBeenCalledWith('alm-prl-dialog');
      expect(mockCloseDialog).not.toHaveBeenCalled();
    });

    it('mobile_cancelClick_callsCloseDialog', () => {
      mockIsOpen.mockReturnValue(true);
      renderPreference();
      fireEvent.click(screen.getByText('Edit'));
      fireEvent.click(screen.getByText('Cancel'));
      expect(mockCloseDialog).toHaveBeenCalledWith('alm-prl-dialog');
    });

    it('mobile_isOpenTrue_rendersDialogContainingPrlChips', () => {
      mockIsOpen.mockReturnValue(true);
      renderPreference();
      fireEvent.click(screen.getByText('Edit'));
      expect(screen.getByTestId('dialog-alm-prl-dialog')).toBeInTheDocument();
      expect(screen.getByTestId('prl-chips')).toBeInTheDocument();
    });

    it('mobile_levelsDisabled_showsSaveAndCancelDirectly', () => {
      mockIsOpen.mockReturnValue(true);
      renderPreference({ isLevelsEnabled: false });
      fireEvent.click(screen.getByText('Edit'));
      expect(screen.getByText('Save')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.queryByText('Next')).not.toBeInTheDocument();
    });

    it('mobile_levelsEnabled_criteriaScreen_showsNextAndCancelNotSave', () => {
      mockIsOpen.mockReturnValue(true);
      renderPreference({ isLevelsEnabled: true });
      fireEvent.click(screen.getByText('Edit'));
      expect(screen.getByText('Next')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.queryByText('Save')).not.toBeInTheDocument();
      expect(screen.getByTestId('prl-chips')).toBeInTheDocument();
      expect(screen.queryByTestId('prl-level-selector')).not.toBeInTheDocument();
    });

    it('mobile_levelsEnabled_nextDisabledWhenNoCriteriaSelected', () => {
      mockIsOpen.mockReturnValue(true);
      renderPreference({ isLevelsEnabled: true, selectedCriteria: [] });
      fireEvent.click(screen.getByText('Edit'));
      expect(screen.getByText('Next')).toBeDisabled();
    });

    it('mobile_levelsEnabled_nextClick_transitionsToLevelsScreenWithBackAndSave', () => {
      mockIsOpen.mockReturnValue(true);
      renderPreference({ isLevelsEnabled: true });
      fireEvent.click(screen.getByText('Edit'));
      fireEvent.click(screen.getByText('Next'));
      expect(screen.getByText('Back')).toBeInTheDocument();
      expect(screen.getByText('Save')).toBeInTheDocument();
      expect(screen.queryByText('Next')).not.toBeInTheDocument();
      expect(screen.queryByTestId('prl-chips')).not.toBeInTheDocument();
      expect(screen.getByTestId('prl-level-selector')).toBeInTheDocument();
    });

    it('mobile_levelsEnabled_backClick_returnsToChipsScreen', () => {
      mockIsOpen.mockReturnValue(true);
      renderPreference({ isLevelsEnabled: true });
      fireEvent.click(screen.getByText('Edit'));
      fireEvent.click(screen.getByText('Next'));
      fireEvent.click(screen.getByText('Back'));
      expect(screen.getByText('Next')).toBeInTheDocument();
      expect(screen.getByTestId('prl-chips')).toBeInTheDocument();
      expect(screen.queryByTestId('prl-level-selector')).not.toBeInTheDocument();
    });

    it('mobile_levelsEnabled_levelsScreenHeading_containsLevels', () => {
      mockIsOpen.mockReturnValue(true);
      renderPreference({ isLevelsEnabled: true });
      fireEvent.click(screen.getByText('Edit'));
      fireEvent.click(screen.getByText('Next'));
      expect(screen.getByText('Select Prefered Levels')).toBeInTheDocument();
    });
  });
});
