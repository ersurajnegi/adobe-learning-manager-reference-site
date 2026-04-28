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
import PrlChips from '../../../almLib/components/PrlPreferenceSection/PrlChips/PrlChips';
import { isEmptyJson } from '@utils/global';

jest.mock('@utils/global', () => ({ isEmptyJson: jest.fn() }));

jest.mock('@spectrum-icons/workflow/CheckmarkCircle', () =>
  function CheckmarkCircle() {
    return <span data-testid="checkmark-icon" />;
  }
);

const mockOptions = [
  { id: 'skill-1', name: 'JavaScript' },
  { id: 'skill-2', name: 'Python' },
  { id: 'skill-3', name: 'React' },
];

beforeEach(() => {
  // Real isEmptyJson: returns truthy only for {}. Restored here because resetMocks: true clears it.
  (isEmptyJson as jest.Mock).mockImplementation((obj: any) => obj && JSON.stringify(obj) === '{}');
});

const renderChips = (overrides: Record<string, any> = {}) =>
  render(
    <PrlChips
      options={mockOptions}
      selectedOptions={[{ id: 'skill-1', name: 'JavaScript' }]}
      onAdd={jest.fn()}
      onRemove={jest.fn()}
      radioGroupAriaLabel="Select skills"
      {...overrides}
    />
  );

describe('PrlChips', () => {
  describe('Rendering', () => {
    it('rendering_withOptions_rendersOneChipPerOption', () => {
      const { container } = renderChips();
      expect(container.querySelectorAll('[role="checkbox"]')).toHaveLength(mockOptions.length);
    });

    it('rendering_container_hasRadiogroupRoleAndAriaLabelFromProp', () => {
      const { container } = renderChips({ radioGroupAriaLabel: 'Pick a topic' });
      const group = container.querySelector('[role="radiogroup"]');
      expect(group).toBeInTheDocument();
      expect(group).toHaveAttribute('aria-label', 'Pick a topic');
    });

    it('rendering_emptyOptionsArray_rendersNoChips', () => {
      const { container } = renderChips({ options: [] });
      expect(container.querySelectorAll('[role="checkbox"]')).toHaveLength(0);
    });

    it('rendering_nullOptions_rendersNoChips', () => {
      const { container } = renderChips({ options: null });
      expect(container.querySelectorAll('[role="checkbox"]')).toHaveLength(0);
    });
  });

  describe('Selection state — Array selectedOptions', () => {
    it('selectedInArray_hasAriaCheckedTruePrlChipSelectedClassAndCheckmark', () => {
      renderChips();
      const jsChip = screen.getByLabelText('JavaScript');
      expect(jsChip).toHaveAttribute('aria-checked', 'true');
      expect(jsChip.className).toContain('prlChipSelected');
      expect(jsChip.querySelector('[data-testid="checkmark-icon"]')).toBeInTheDocument();
    });

    it('notSelectedInArray_hasAriaCheckedFalseNoClassAndNoCheckmark', () => {
      renderChips();
      const pythonChip = screen.getByLabelText('Python');
      expect(pythonChip).toHaveAttribute('aria-checked', 'false');
      expect(pythonChip.className).not.toContain('prlChipSelected');
      expect(pythonChip.querySelector('[data-testid="checkmark-icon"]')).not.toBeInTheDocument();
    });
  });

  describe('Selection state — Map selectedOptions', () => {
    it('selectedInMap_hasAriaCheckedTrue', () => {
      const selectedMap = new Map([['skill-1', { id: 'skill-1', name: 'JavaScript' }]]);
      renderChips({ selectedOptions: selectedMap });
      expect(screen.getByLabelText('JavaScript')).toHaveAttribute('aria-checked', 'true');
    });

    it('notSelectedInMap_hasAriaCheckedFalse', () => {
      const selectedMap = new Map([['skill-1', { id: 'skill-1', name: 'JavaScript' }]]);
      renderChips({ selectedOptions: selectedMap });
      expect(screen.getByLabelText('Python')).toHaveAttribute('aria-checked', 'false');
    });

    it('emptyMap_allChipsHaveAriaCheckedFalse', () => {
      renderChips({ selectedOptions: new Map() });
      mockOptions.forEach(opt => {
        expect(screen.getByLabelText(opt.name)).toHaveAttribute('aria-checked', 'false');
      });
    });
  });

  describe('Toggle interaction', () => {
    it('toggle_clickUnselectedChip_callsOnAddWithItemNotOnRemove', () => {
      const onAdd = jest.fn();
      const onRemove = jest.fn();
      renderChips({ onAdd, onRemove });

      fireEvent.click(screen.getByLabelText('Python'));

      expect(onAdd).toHaveBeenCalledWith({ id: 'skill-2', name: 'Python' });
      expect(onAdd).toHaveBeenCalledTimes(1);
      expect(onRemove).not.toHaveBeenCalled();
    });

    it('toggle_clickSelectedChip_callsOnRemoveWithItemNotOnAdd', () => {
      const onAdd = jest.fn();
      const onRemove = jest.fn();
      renderChips({ onAdd, onRemove });

      fireEvent.click(screen.getByLabelText('JavaScript'));

      expect(onRemove).toHaveBeenCalledWith({ id: 'skill-1', name: 'JavaScript' });
      expect(onRemove).toHaveBeenCalledTimes(1);
      expect(onAdd).not.toHaveBeenCalled();
    });
  });
});
