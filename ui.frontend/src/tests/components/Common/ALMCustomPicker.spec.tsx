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
import '@testing-library/jest-dom';
import ALMCustomPicker from '@components/Common/ALMCustomPicker/ALMCustomPicker';

const mockOnSelectionChange = jest.fn();

jest.mock('@adobe/react-spectrum', () => ({
  Picker: ({
    children,
    onSelectionChange,
    'aria-label': ariaLabel,
    defaultSelectedKey,
  }: any) => {
    mockOnSelectionChange.mockImplementation(onSelectionChange);
    return (
      <div data-testid="custom-picker" aria-label={ariaLabel} data-default-key={defaultSelectedKey}>
        {children}
      </div>
    );
  },
  Item: ({ children, 'data-automationid': automationId }: any) => (
    <div data-testid="picker-item" data-automationid={automationId}>
      {children}
    </div>
  ),
}));

const mockGetTranslationsReplaced = jest.fn();

jest.mock('@utils/translationService', () => ({
  GetTranslationsReplaced: (key: string, replacements: any, _flag?: boolean) =>
    mockGetTranslationsReplaced(key, replacements, _flag),
}));

describe('ALMCustomPicker', () => {
  const mockOptions = [
    { id: 'option-1', name: 'Sort by Name' },
    { id: 'option-2', name: 'Sort by Date' },
    { id: 'option-3', name: 'Sort by Popular' },
  ];

  const mockOnOptionSelected = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    mockGetTranslationsReplaced.mockImplementation((key: string, replacements: any) => {
      if (key === 'alm.sort.selectedOption') {
        return `Selected: ${replacements.selectedOption}`;
      }
      return '';
    });
  });

  const renderComponent = (props = {}) => {
    return render(
      <ALMCustomPicker
        options={mockOptions}
        onOptionSelected={mockOnOptionSelected}
        defaultSelectedOptionId="option-1"
        {...props}
      />
    );
  };

  describe('Rendering', () => {
    it('should render all option items', () => {
      renderComponent();
      expect(screen.getAllByTestId('picker-item')).toHaveLength(3);
    });

    it('should render options with automation ids', () => {
      renderComponent();
      const item = screen.getByText('Sort by Name').closest('[data-testid="picker-item"]');
      expect(item?.getAttribute('data-automationid')).toBe('Sort by Name');
    });
  });

  describe('Default Selection', () => {
    it('should pass default selected key to Picker', () => {
      renderComponent();
      expect(screen.getByTestId('custom-picker').getAttribute('data-default-key')).toBe('option-1');
    });

    it('should set aria-label with default selection', () => {
      renderComponent();
      expect(screen.getByTestId('custom-picker').getAttribute('aria-label')).toBe(
        'Selected: Sort by Name'
      );
    });

    it('should call GetTranslationsReplaced with correct key and replacement for default option', () => {
      renderComponent();
      const calls = mockGetTranslationsReplaced.mock.calls;
      const matchingCall = calls.find(
        call => call[0] === 'alm.sort.selectedOption' && call[1].selectedOption === 'Sort by Name'
      );
      expect(matchingCall).toEqual(['alm.sort.selectedOption', { selectedOption: 'Sort by Name' }, true]);
    });
  });

  describe('Option Selection', () => {
    it('should call onOptionSelected with selected id', () => {
      renderComponent();
      act(() => { mockOnSelectionChange('option-2'); });
      expect(mockOnOptionSelected).toHaveBeenCalledWith('option-2');
      expect(mockOnOptionSelected).toHaveBeenCalledTimes(1);
    });

    it('should update aria-label after selection change', () => {
      renderComponent();
      act(() => { mockOnSelectionChange('option-2'); });
      expect(screen.getByTestId('custom-picker').getAttribute('aria-label')).toBe(
        'Selected: Sort by Date'
      );
    });

    it('should not call onOptionSelected when key has no matching option', () => {
      renderComponent();
      act(() => { mockOnSelectionChange('nonexistent-key'); });
      expect(mockOnOptionSelected).not.toHaveBeenCalled();
    });

    it('should handle rapid selection changes in order', () => {
      renderComponent();
      act(() => {
        mockOnSelectionChange('option-2');
        mockOnSelectionChange('option-3');
        mockOnSelectionChange('option-1');
      });
      expect(mockOnOptionSelected).toHaveBeenCalledTimes(3);
      expect(mockOnOptionSelected).toHaveBeenNthCalledWith(1, 'option-2');
      expect(mockOnOptionSelected).toHaveBeenNthCalledWith(2, 'option-3');
      expect(mockOnOptionSelected).toHaveBeenNthCalledWith(3, 'option-1');
    });

    it('should not call onOptionSelected on initial render', () => {
      renderComponent();
      expect(mockOnOptionSelected).not.toHaveBeenCalled();
    });
  });

  describe('Props Changes', () => {
    it('should update aria-label when default option changes via rerender', () => {
      const newOptions = [
        { id: 'new-1', name: 'New Sort by Name' },
        { id: 'new-2', name: 'New Sort by Date' },
      ];

      const { rerender } = renderComponent();

      rerender(
        <ALMCustomPicker
          options={newOptions}
          onOptionSelected={mockOnOptionSelected}
          defaultSelectedOptionId="new-1"
        />
      );

      expect(screen.getByTestId('custom-picker').getAttribute('aria-label')).toBe(
        'Selected: New Sort by Name'
      );
    });

    it('should handle empty options array', () => {
      render(
        <ALMCustomPicker
          options={[]}
          onOptionSelected={mockOnOptionSelected}
          defaultSelectedOptionId=""
        />
      );
      expect(screen.queryAllByTestId('picker-item')).toHaveLength(0);
    });

    it('should handle single option', () => {
      render(
        <ALMCustomPicker
          options={[{ id: 'single', name: 'Only Option' }]}
          onOptionSelected={mockOnOptionSelected}
          defaultSelectedOptionId="single"
        />
      );
      expect(screen.getAllByTestId('picker-item')).toHaveLength(1);
    });

    it('should handle options with duplicate names but different ids', () => {
      render(
        <ALMCustomPicker
          options={[
            { id: 'id-1', name: 'Same Name' },
            { id: 'id-2', name: 'Same Name' },
          ]}
          onOptionSelected={mockOnOptionSelected}
          defaultSelectedOptionId="id-1"
        />
      );
      expect(screen.getAllByText('Same Name')).toHaveLength(2);
    });
  });
});
