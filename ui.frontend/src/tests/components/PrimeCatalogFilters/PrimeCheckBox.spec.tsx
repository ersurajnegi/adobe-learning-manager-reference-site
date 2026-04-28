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

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/extend-expect';
import PrimeCheckBox from '@components/Catalog/PrimeCatalogFilters/PrimeCheckBox';
import * as translationService from '@utils/translationService';
import { withProviders } from '../../common/hoc';

function makeProps(overrides: any = {}) {
  return {
    label: 'alm.catalog.loType.course',
    filterType: 'loTypes',
    checked: false,
    changeHandler: jest.fn(),
    isListDynamic: false,
    ...overrides,
  };
}

function renderComponent(props: any) {
  return render(withProviders(PrimeCheckBox, props));
}

describe('PrimeCheckBox', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(translationService, 'GetTranslation').mockImplementation((key: string) => key);
  });

  describe('Label display', () => {
    it('render_staticLabel_translatesLabelAndShowsIt', () => {
      jest
        .spyOn(translationService, 'GetTranslation')
        .mockImplementation((key: string) => `Translated: ${key}`);
      renderComponent(makeProps({ label: 'alm.catalog.loType.course', isListDynamic: false }));
      expect(translationService.GetTranslation).toHaveBeenCalledWith(
        'alm.catalog.loType.course',
        true
      );
      expect(
        screen.getByText('Translated: alm.catalog.loType.course')
      ).toHaveAttribute('title', 'Translated: alm.catalog.loType.course');
    });

    it('render_dynamicLabel_showsRawLabelAndSkipsTranslation', () => {
      renderComponent(makeProps({ label: 'React Developer', isListDynamic: true }));
      expect(translationService.GetTranslation).not.toHaveBeenCalled();
      expect(screen.getByText('React Developer')).toHaveAttribute('title', 'React Developer');
    });
  });

  describe('Checked state', () => {
    it('render_checkedTrue_checkboxIsSelected', () => {
      renderComponent(makeProps({ checked: true }));
      expect(screen.getByRole('checkbox')).toBeChecked();
    });

    it('render_checkedFalse_checkboxIsNotSelected', () => {
      renderComponent(makeProps({ checked: false }));
      expect(screen.getByRole('checkbox')).not.toBeChecked();
    });
  });

  describe('automationId attribute', () => {
    it('render_withAutomationId_setsDataAutomationIdAttribute', () => {
      const { container } = renderComponent(makeProps({ automationId: 'checkbox-course' }));
      expect(container.querySelector('[data-automationid="checkbox-course"]')).not.toBeNull();
    });

    it('render_withoutAutomationId_omitsDataAutomationIdAttribute', () => {
      const { container } = renderComponent(makeProps());
      expect(container.querySelector('[data-automationid]')).toBeNull();
    });
  });

  describe('onChange handler', () => {
    it('onChange_uncheckedCheckbox_callsChangeHandlerWithCheckedTrue', () => {
      const changeHandler = jest.fn();
      renderComponent(
        makeProps({ checked: false, changeHandler, filterType: 'loTypes', label: 'alm.catalog.loType.course' })
      );
      userEvent.click(screen.getByRole('checkbox'));
      expect(changeHandler).toHaveBeenCalledTimes(1);
      expect(changeHandler).toHaveBeenCalledWith({
        filterType: 'loTypes',
        checked: true,
        label: 'alm.catalog.loType.course',
      });
    });

    it('onChange_checkedCheckbox_callsChangeHandlerWithCheckedFalse', () => {
      const changeHandler = jest.fn();
      renderComponent(
        makeProps({ checked: true, changeHandler, filterType: 'loTypes', label: 'alm.catalog.loType.course' })
      );
      userEvent.click(screen.getByRole('checkbox'));
      expect(changeHandler).toHaveBeenCalledTimes(1);
      expect(changeHandler).toHaveBeenCalledWith({
        filterType: 'loTypes',
        checked: false,
        label: 'alm.catalog.loType.course',
      });
    });
  });
});
