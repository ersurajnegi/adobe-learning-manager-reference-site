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
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import PrimeCheckbox from '@components/Catalog/PrimeCatalogFilters/PrimeCheckBox';

jest.mock('@adobe/react-spectrum', () => ({
  Checkbox: ({
    children,
    onChange,
    isSelected,
    'data-automationId': automationId,
    UNSAFE_className,
  }: any) => (
    <div className={UNSAFE_className}>
      <input
        type="checkbox"
        checked={isSelected}
        onChange={e => onChange(e.target.checked)}
        data-automationid={automationId}
        data-testid="checkbox-input"
      />
      <label>{children}</label>
    </div>
  ),
}));

const mockGetTranslation = jest.fn();
jest.mock('@utils/translationService', () => ({
  GetTranslation: (key: string, flag?: boolean) => mockGetTranslation(key, flag),
}));

describe('PrimeCheckbox', () => {
  const mockChangeHandler = jest.fn();

  const defaultProps = {
    label: 'alm.filter.course',
    filterType: 'loType',
    checked: false,
    changeHandler: mockChangeHandler,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetTranslation.mockImplementation((key: string) => {
      const translations: Record<string, string> = {
        'alm.filter.course': 'Course',
        'alm.filter.certification': 'Certification',
      };
      return translations[key] || key;
    });
  });

  describe('label rendering', () => {
    it('calls GetTranslation and shows translated text when isListDynamic is false', () => {
      render(<PrimeCheckbox {...defaultProps} isListDynamic={false} />);

      expect(mockGetTranslation).toHaveBeenCalledWith('alm.filter.course', true);
      expect(screen.getByTitle('Course')).toHaveTextContent('Course');
    });

    it('shows raw label and skips GetTranslation when isListDynamic is true', () => {
      render(<PrimeCheckbox {...defaultProps} isListDynamic={true} label="Dynamic Label" />);

      expect(mockGetTranslation).not.toHaveBeenCalled();
      expect(screen.getByTitle('Dynamic Label')).toHaveTextContent('Dynamic Label');
    });
  });

  describe('checked state', () => {
    it('renders unchecked when checked prop is false', () => {
      render(<PrimeCheckbox {...defaultProps} checked={false} />);
      expect(screen.getByTestId<HTMLInputElement>('checkbox-input').checked).toBe(false);
    });

    it('renders checked when checked prop is true', () => {
      render(<PrimeCheckbox {...defaultProps} checked={true} />);
      expect(screen.getByTestId<HTMLInputElement>('checkbox-input').checked).toBe(true);
    });
  });

  describe('changeHandler', () => {
    it('calls changeHandler with checked:true when unchecked checkbox is clicked', () => {
      render(<PrimeCheckbox {...defaultProps} checked={false} />);

      userEvent.click(screen.getByTestId('checkbox-input'));

      expect(mockChangeHandler).toHaveBeenCalledTimes(1);
      expect(mockChangeHandler).toHaveBeenCalledWith({
        filterType: 'loType',
        checked: true,
        label: 'alm.filter.course',
      });
    });

    it('calls changeHandler with checked:false when checked checkbox is clicked', () => {
      render(<PrimeCheckbox {...defaultProps} checked={true} />);

      userEvent.click(screen.getByTestId('checkbox-input'));

      expect(mockChangeHandler).toHaveBeenCalledWith({
        filterType: 'loType',
        checked: false,
        label: 'alm.filter.course',
      });
    });
  });

  describe('automationId', () => {
    it('sets data-automationId attribute when automationId prop is provided', () => {
      render(<PrimeCheckbox {...defaultProps} automationId="course-filter" />);
      expect(screen.getByTestId('checkbox-input')).toHaveAttribute('data-automationid', 'course-filter');
    });

    it('omits data-automationId attribute when automationId prop is absent', () => {
      render(<PrimeCheckbox {...defaultProps} />);
      expect(screen.getByTestId('checkbox-input').getAttribute('data-automationid')).toBeNull();
    });
  });
});
