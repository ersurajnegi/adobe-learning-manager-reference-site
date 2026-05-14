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
jest.mock('@utils/inline_svg', () => ({
  ARROW_DOWN_SVG: () => null,
}));

import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import PrimeDropdown from '@components/Community/PrimeDropdown/PrimeDropdown';

const renderDropdown = (props: any = {}) =>
  render(
    <PrimeDropdown
      label="Sort by"
      selectedOption="Recent"
      optionList={['Recent', 'Popular', 'Oldest']}
      optionClickHandler={jest.fn()}
      {...props}
    />
  );

const getToggle = (container: HTMLElement) =>
  container.querySelector('[class*="primeDropdownValue"]') as HTMLElement;

const isOpen = (container: HTMLElement) =>
  container.querySelector('[class*="primeDropdownOptionList"]') !== null;

describe('PrimeDropdown', () => {
  it('displays label and selected option; hides option list initially', () => {
    const { container } = renderDropdown();
    expect(screen.getByText('Sort by')).toBeInTheDocument();
    expect(container.querySelector('[class*="primeDropdownValue"]')).toHaveTextContent('Recent');
    expect(isOpen(container)).toBe(false);
  });

  it('opens option list on toggle click and closes on second click', () => {
    const { container } = renderDropdown();
    const toggle = getToggle(container);
    fireEvent.click(toggle);
    expect(isOpen(container)).toBe(true);
    fireEvent.click(toggle);
    expect(isOpen(container)).toBe(false);
  });

  it('renders all options when open', () => {
    const { container } = renderDropdown();
    fireEvent.click(getToggle(container));
    expect(screen.getByText('Recent')).toBeInTheDocument();
    expect(screen.getByText('Popular')).toBeInTheDocument();
    expect(screen.getByText('Oldest')).toBeInTheDocument();
  });

  it('calls optionClickHandler with the option text and closes the dropdown', () => {
    const optionClickHandler = jest.fn();
    const { container } = renderDropdown({ optionClickHandler });
    fireEvent.click(getToggle(container));
    fireEvent.click(screen.getByText('Popular'));
    expect(optionClickHandler).toHaveBeenCalledWith('Popular');
    expect(isOpen(container)).toBe(false);
  });

  it('does not throw and does not close when optionClickHandler is not a function', () => {
    const { container } = renderDropdown({ optionClickHandler: undefined });
    fireEvent.click(getToggle(container));
    expect(() => fireEvent.click(screen.getByText('Popular'))).not.toThrow();
    expect(isOpen(container)).toBe(true);
  });

  it('closes when clicking outside the dropdown', () => {
    const { container } = renderDropdown();
    fireEvent.click(getToggle(container));
    expect(isOpen(container)).toBe(true);
    fireEvent.click(document.body);
    expect(isOpen(container)).toBe(false);
  });
});
