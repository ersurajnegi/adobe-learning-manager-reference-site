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
import { IntlProvider } from 'react-intl';
import PrimeCommunityBoardFilters from '@components/Community/PrimeCommunityBoardFilters/PrimeCommunityBoardFilters';

jest.mock('@utils/translationService', () => ({
  GetTranslation: jest.fn((key: string, returnKey: boolean) => {
    const translations: Record<string, string> = {
      'alm.community.board.skills': 'Skills',
    };
    return translations[key] || (returnKey ? key : '');
  }),
}));

jest.mock('@utils/constants', () => ({
  DATE_UPDATED: 'Date Updated',
}));

jest.mock('@components/Community/PrimeDropdown', () => ({
  PrimeDropdown: ({ label, optionList, selectedOption, optionClickHandler }: any) => (
    <div data-testid="prime-dropdown">
      <div data-testid="dropdown-label">{label}</div>
      <div data-testid="selected-option">{selectedOption}</div>
      <div data-testid="option-list">
        {optionList.map((option: string) => (
          <button key={option} onClick={() => optionClickHandler(option)}>
            {option}
          </button>
        ))}
      </div>
    </div>
  ),
}));

describe('PrimeCommunityBoardFilters', () => {
  const mockSkillFilterChangeHandler = jest.fn();
  const mockSortFilterChangeHandler = jest.fn();

  const defaultProps = {
    skills: 'JavaScript,Python,React,TypeScript',
    selectedSkill: 'JavaScript',
    skillFilterChangeHandler: mockSkillFilterChangeHandler,
    sortFilterChangeHandler: mockSortFilterChangeHandler,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = (props = {}, locale = 'en', messages = { 'alm.community.board.sortBy': 'Sort by' }) => {
    return render(
      <IntlProvider locale={locale} messages={messages}>
        <PrimeCommunityBoardFilters {...defaultProps} {...props} />
      </IntlProvider>
    );
  };

  describe('Skills filter visibility', () => {
    it('shows both skills and sort dropdowns when skills are provided', () => {
      renderComponent();
      expect(screen.getAllByTestId('prime-dropdown').length).toBe(2);
    });

    it('hides skills dropdown when skills prop is empty string', () => {
      renderComponent({ skills: '' });
      expect(screen.queryByText('Skills')).toBeNull();
    });

    it('hides skills dropdown when skills prop is undefined', () => {
      renderComponent({ skills: undefined });
      expect(screen.queryByText('Skills')).toBeNull();
    });

    it('hides skills dropdown when skills contains only commas', () => {
      renderComponent({ skills: ',,,' });
      expect(screen.queryByText('Skills')).toBeNull();
    });

    it('hides skills dropdown when skills contains only whitespace entries', () => {
      renderComponent({ skills: '   ,   ,   ' });
      expect(screen.queryByText('Skills')).toBeNull();
    });
  });

  describe('Skill option parsing', () => {
    it('splits comma-separated skills into individual options', () => {
      renderComponent({ skills: 'Skill1,Skill2,Skill3' });
      expect(screen.getByText('Skill1').tagName).toBe('BUTTON');
      expect(screen.getByText('Skill2').tagName).toBe('BUTTON');
      expect(screen.getByText('Skill3').tagName).toBe('BUTTON');
    });

    it('filters out empty entries from the skill list', () => {
      renderComponent({ skills: 'Skill1,,Skill2, ,Skill3' });
      expect(screen.getByText('Skill1').tagName).toBe('BUTTON');
      expect(screen.getByText('Skill2').tagName).toBe('BUTTON');
      expect(screen.getByText('Skill3').tagName).toBe('BUTTON');
    });

    it('handles skills with special characters', () => {
      renderComponent({ skills: 'C++,C#,.NET,Node.js' });
      expect(screen.getByText('C++').tagName).toBe('BUTTON');
      expect(screen.getByText('C#').tagName).toBe('BUTTON');
      expect(screen.getByText('.NET').tagName).toBe('BUTTON');
      expect(screen.getByText('Node.js').tagName).toBe('BUTTON');
    });

    it('renders first and last options from a very long skill list', () => {
      const manySkills = Array.from({ length: 50 }, (_, i) => `Skill${i}`).join(',');
      renderComponent({ skills: manySkills });
      expect(screen.getByText('Skill0').tagName).toBe('BUTTON');
      expect(screen.getByText('Skill49').tagName).toBe('BUTTON');
    });
  });

  describe('Skills interaction', () => {
    it('calls skillFilterChangeHandler with the clicked skill', () => {
      renderComponent();
      userEvent.click(screen.getByText('Python'));
      expect(mockSkillFilterChangeHandler).toHaveBeenCalledWith('Python');
      expect(mockSkillFilterChangeHandler).toHaveBeenCalledTimes(1);
    });

    it('does not call skillFilterChangeHandler when prop is not provided', () => {
      renderComponent({ skillFilterChangeHandler: undefined });
      userEvent.click(screen.getByText('Python'));
      expect(mockSkillFilterChangeHandler).not.toHaveBeenCalled();
    });

    it('initialises skill dropdown with the provided selectedSkill', () => {
      renderComponent({ selectedSkill: 'React' });
      const selectedOptions = screen.getAllByTestId('selected-option');
      expect(selectedOptions[0].textContent).toBe('React');
    });

    it('initialises with an empty selected skill when selectedSkill is undefined', () => {
      renderComponent({ selectedSkill: undefined });
      const selectedOptions = screen.getAllByTestId('selected-option');
      expect(selectedOptions[0].textContent).toBe('');
    });
  });

  describe('Sort dropdown', () => {
    it('renders "Sort by" label with "Date Updated" as the default selection', () => {
      renderComponent();
      const labels = screen.getAllByTestId('dropdown-label');
      expect(labels[labels.length - 1]).toHaveTextContent('Sort by');
      const selectedOptions = screen.getAllByTestId('selected-option');
      expect(selectedOptions[selectedOptions.length - 1].textContent).toBe('Date Updated');
    });

    it('lists Date Created, Date Updated, and Name as sort options', () => {
      renderComponent();
      expect(screen.queryByText('Date Created')).not.toBeNull();
      expect(screen.queryByText('Name')).not.toBeNull();
    });

    it('calls sortFilterChangeHandler with "-dateCreated" when Date Created is clicked', () => {
      renderComponent();
      userEvent.click(screen.getByText('Date Created'));
      expect(mockSortFilterChangeHandler).toHaveBeenCalledWith('-dateCreated');
    });

    it('calls sortFilterChangeHandler with "-dateUpdated" when Date Updated is clicked', () => {
      renderComponent();
      const buttons = screen.getAllByText('Date Updated');
      userEvent.click(buttons[buttons.length - 1]);
      expect(mockSortFilterChangeHandler).toHaveBeenCalledWith('-dateUpdated');
    });

    it('calls sortFilterChangeHandler with "name" when Name is clicked', () => {
      renderComponent();
      userEvent.click(screen.getByText('Name'));
      expect(mockSortFilterChangeHandler).toHaveBeenCalledWith('name');
    });

    it('does not call sortFilterChangeHandler when prop is not provided', () => {
      renderComponent({ sortFilterChangeHandler: undefined });
      userEvent.click(screen.getByText('Name'));
      expect(mockSortFilterChangeHandler).not.toHaveBeenCalled();
    });
  });

  describe('Independent skill and sort state', () => {
    it('routes skill clicks and sort clicks to their respective handlers independently', () => {
      renderComponent();
      userEvent.click(screen.getByText('TypeScript'));
      userEvent.click(screen.getByText('Name'));
      expect(mockSkillFilterChangeHandler).toHaveBeenCalledWith('TypeScript');
      expect(mockSortFilterChangeHandler).toHaveBeenCalledWith('name');
      expect(mockSkillFilterChangeHandler).toHaveBeenCalledTimes(1);
      expect(mockSortFilterChangeHandler).toHaveBeenCalledTimes(1);
    });
  });

  describe('firstRun guard', () => {
    it('ignores skills prop changes after the initial mount', () => {
      const { rerender } = renderComponent({ skills: 'A,B,C' });
      rerender(
        <IntlProvider locale="en" messages={{ 'alm.community.board.sortBy': 'Sort by' }}>
          <PrimeCommunityBoardFilters {...defaultProps} skills="X,Y,Z" />
        </IntlProvider>
      );
      expect(screen.getByText('A').tagName).toBe('BUTTON');
      expect(screen.queryByText('X')).toBeNull();
    });
  });

  describe('Internationalisation', () => {
    it('shows the translated sort label for a non-English locale', () => {
      renderComponent({}, 'fr', { 'alm.community.board.sortBy': 'Trier par' });
      const labels = screen.getAllByTestId('dropdown-label');
      expect(labels[labels.length - 1]).toHaveTextContent('Trier par');
    });

    it('falls back to the defaultMessage when a translation is missing', () => {
      render(
        <IntlProvider locale="en" messages={{}}>
          <PrimeCommunityBoardFilters {...defaultProps} />
        </IntlProvider>
      );
      const labels = screen.getAllByTestId('dropdown-label');
      expect(labels[labels.length - 1]).toHaveTextContent('Sort by');
    });
  });
});
