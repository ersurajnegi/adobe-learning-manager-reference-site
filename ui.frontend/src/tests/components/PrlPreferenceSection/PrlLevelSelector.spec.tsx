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
import PrlLevelSelector from '@components/PrlPreferenceSection/PrlLevelSelector/PrlLevelSelector';
import { INTERMEDIATE, ADVANCED } from '@utils/constants';

const LEVELS = ['beginner', INTERMEDIATE, ADVANCED];

const mockOptions = [
  { id: 'skill-1', name: 'JavaScript', levels: [ADVANCED] },
  { id: 'skill-2', name: 'Python', levels: [INTERMEDIATE] },
  { id: 'skill-3', name: 'React', levels: ['beginner'] },
];

const renderSelector = (overrides: Record<string, any> = {}) =>
  render(
    <IntlProvider locale="en" messages={{}}>
      <PrlLevelSelector
        options={mockOptions}
        levels={LEVELS}
        onChangeHandler={jest.fn()}
        headerText=""
        {...overrides}
      />
    </IntlProvider>
  );

describe('PrlLevelSelector', () => {
  describe('Rendering', () => {
    it('rendering_withOptions_rendersH3PerCriterionAndRadioGroupPerCriterion', () => {
      const { container } = renderSelector();
      expect(container.querySelectorAll('[role="radiogroup"]')).toHaveLength(mockOptions.length);
      expect(container.querySelectorAll('h3')).toHaveLength(mockOptions.length);
      // 3 criteria × 3 levels = 9 radio inputs
      expect(container.querySelectorAll('input[type="radio"]')).toHaveLength(9);
    });

    it('rendering_emptyOptions_rendersNoItems', () => {
      const { container } = renderSelector({ options: [] });
      expect(container.querySelectorAll('input[type="radio"]')).toHaveLength(0);
    });

    it('rendering_nullOptions_rendersNoItems', () => {
      const { container } = renderSelector({ options: null });
      expect(container.querySelectorAll('input[type="radio"]')).toHaveLength(0);
    });
  });

  describe('Header', () => {
    it('header_withHeaderText_rendersH2WithTabIndexMinus1', () => {
      renderSelector({ headerText: 'Select Your Level' });
      const h2 = screen.getByText('Select Your Level');
      expect(h2.tagName).toBe('H2');
      expect(h2).toHaveAttribute('tabindex', '-1');
    });

    it('header_emptyHeaderText_rendersNoH2', () => {
      const { container } = renderSelector({ headerText: '' });
      expect(container.querySelector('h2')).not.toBeInTheDocument();
    });
  });

  describe('Level pre-selection', () => {
    it('levelSelection_checksRadioMatchingItemsFirstLevel', () => {
      const { container } = renderSelector();
      // Each item's levels[0] should be checked; others should not
      expect((container.querySelector(`#skill-1${ADVANCED}`) as HTMLInputElement).checked).toBe(true);
      expect((container.querySelector(`#skill-1${INTERMEDIATE}`) as HTMLInputElement).checked).toBe(false);

      expect((container.querySelector(`#skill-2${INTERMEDIATE}`) as HTMLInputElement).checked).toBe(true);
      expect((container.querySelector(`#skill-2${ADVANCED}`) as HTMLInputElement).checked).toBe(false);

      expect((container.querySelector('#skill-3beginner') as HTMLInputElement).checked).toBe(true);
      expect((container.querySelector(`#skill-3${ADVANCED}`) as HTMLInputElement).checked).toBe(false);
    });

    it('levelSelection_emptyLevelsArray_defaultsToAdvanced', () => {
      const { container } = renderSelector({
        options: [{ id: 'skill-1', name: 'TypeScript', levels: [] }],
      });
      expect((container.querySelector(`#skill-1${ADVANCED}`) as HTMLInputElement).checked).toBe(true);
    });

    it('levelSelection_undefinedLevels_defaultsToAdvanced', () => {
      const { container } = renderSelector({
        options: [{ id: 'skill-1', name: 'TypeScript' }],
      });
      expect((container.querySelector(`#skill-1${ADVANCED}`) as HTMLInputElement).checked).toBe(true);
    });
  });

  describe('onChange handler', () => {
    it('onChangeHandler_radioClick_callsHandlerWithUpdatedItemAndNewLevel', () => {
      const onChangeHandler = jest.fn();
      const { container } = renderSelector({ onChangeHandler });

      fireEvent.click(container.querySelector('#skill-1beginner') as HTMLInputElement);

      expect(onChangeHandler).toHaveBeenCalledTimes(1);
      expect(onChangeHandler).toHaveBeenCalledWith({
        detail: {
          item: { id: 'skill-1', name: 'JavaScript', levels: ['beginner'] },
        },
      });
    });

    it('onChangeHandler_clickDifferentItem_passesCorrectItemAndLevel', () => {
      const onChangeHandler = jest.fn();
      const { container } = renderSelector({ onChangeHandler });

      fireEvent.click(container.querySelector(`#skill-2${ADVANCED}`) as HTMLInputElement);

      expect(onChangeHandler).toHaveBeenCalledWith({
        detail: {
          item: { id: 'skill-2', name: 'Python', levels: [ADVANCED] },
        },
      });
    });

    it('onChangeHandler_notAFunction_doesNotThrow', () => {
      const { container } = renderSelector({ onChangeHandler: undefined });
      expect(() =>
        fireEvent.click(container.querySelector('#skill-1beginner') as HTMLInputElement)
      ).not.toThrow();
    });
  });

  describe('Levels prop variants', () => {
    it('levels_objectWithNamesProperty_usesNamesArrayForRadios', () => {
      const { container } = renderSelector({ levels: { names: LEVELS } });
      // 3 criteria × 3 levels = 9 radios — levels.names path was followed
      expect(container.querySelectorAll('input[type="radio"]')).toHaveLength(9);
    });

    it('levels_customTwoLevelArray_rendersCorrectRadioCount', () => {
      const { container } = renderSelector({ levels: ['beginner', ADVANCED] });
      // 3 criteria × 2 levels = 6 radios
      expect(container.querySelectorAll('input[type="radio"]')).toHaveLength(6);
    });
  });

  describe('Accessibility', () => {
    it('a11y_eachRadioGroupLinkedToH3ViaAriaLabelledBy', () => {
      const { container } = renderSelector();
      mockOptions.forEach(({ id, name }) => {
        const group = container.querySelector(`[aria-labelledby="${id}"]`);
        expect(group).toHaveAttribute('role', 'radiogroup');
        expect(container.querySelector(`#${id}`)?.textContent).toBe(name);
      });
    });

    it('a11y_radiosWithinGroupShareItemNameAttribute', () => {
      const { container } = renderSelector();
      // name attribute groups radios so only one per criterion can be selected
      expect(container.querySelectorAll('input[name="JavaScript"]')).toHaveLength(LEVELS.length);
      expect(container.querySelectorAll('input[name="Python"]')).toHaveLength(LEVELS.length);
    });
  });
});
