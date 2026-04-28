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
jest.mock('@components/Community/PrimeDropdown', () => ({
  PrimeDropdown: ({ label, optionList, selectedOption, optionClickHandler }: any) => (
    <div>
      <span data-testid="label">{label}</span>
      <span data-testid="selected">{selectedOption}</span>
      {optionList?.map((opt: string) => (
        <button key={opt} data-testid={`opt-${opt}`} onClick={() => optionClickHandler(opt)}>
          {opt}
        </button>
      ))}
    </div>
  ),
}));

jest.mock('react-intl', () => {
  const actual = jest.requireActual('react-intl');
  return {
    ...actual,
    useIntl: () => ({
      formatMessage: ({ defaultMessage }: any) => defaultMessage,
    }),
  };
});

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { IntlProvider } from 'react-intl';
import PrimeCommunityPostFilters from '@components/Community/PrimeCommunityPostFilters/PrimeCommunityPostFilters';

const renderFilters = (props: any = {}) =>
  render(
    <IntlProvider locale="en" messages={{}}>
      <PrimeCommunityPostFilters sortFilterChangeHandler={jest.fn()} clearSortFilter={false} {...props} />
    </IntlProvider>
  );

describe('PrimeCommunityPostFilters', () => {
  it('selects "Date Created" by default and renders both sort options', () => {
    renderFilters();
    expect(screen.getByTestId('selected')).toHaveTextContent('Date Created');
    expect(screen.getByTestId('opt-Date Created')).toBeInTheDocument();
    expect(screen.getByTestId('opt-Date Updated')).toBeInTheDocument();
  });

  it('maps "Date Updated" to "-dateUpdated" and updates selected option', () => {
    const handler = jest.fn();
    renderFilters({ sortFilterChangeHandler: handler });
    userEvent.click(screen.getByTestId('opt-Date Updated'));
    expect(handler).toHaveBeenCalledWith('-dateUpdated');
    expect(screen.getByTestId('selected')).toHaveTextContent('Date Updated');
  });

  it('maps "Date Created" to "-dateCreated"', () => {
    const handler = jest.fn();
    renderFilters({ sortFilterChangeHandler: handler });
    userEvent.click(screen.getByTestId('opt-Date Updated'));
    userEvent.click(screen.getByTestId('opt-Date Created'));
    expect(handler).toHaveBeenLastCalledWith('-dateCreated');
    expect(screen.getByTestId('selected')).toHaveTextContent('Date Created');
  });

  it('still updates selected option when sortFilterChangeHandler is not a function', () => {
    renderFilters({ sortFilterChangeHandler: undefined });
    userEvent.click(screen.getByTestId('opt-Date Updated'));
    expect(screen.getByTestId('selected')).toHaveTextContent('Date Updated');
  });

  it('resets to "Date Created" when clearSortFilter becomes true', () => {
    const { rerender } = renderFilters({ clearSortFilter: false });
    userEvent.click(screen.getByTestId('opt-Date Updated'));
    expect(screen.getByTestId('selected')).toHaveTextContent('Date Updated');
    rerender(
      <IntlProvider locale="en" messages={{}}>
        <PrimeCommunityPostFilters sortFilterChangeHandler={jest.fn()} clearSortFilter={true} />
      </IntlProvider>
    );
    expect(screen.getByTestId('selected')).toHaveTextContent('Date Created');
  });

  it('preserves selected option when clearSortFilter remains false on re-render', () => {
    const { rerender } = renderFilters({ clearSortFilter: false });
    userEvent.click(screen.getByTestId('opt-Date Updated'));
    rerender(
      <IntlProvider locale="en" messages={{}}>
        <PrimeCommunityPostFilters sortFilterChangeHandler={jest.fn()} clearSortFilter={false} />
      </IntlProvider>
    );
    expect(screen.getByTestId('selected')).toHaveTextContent('Date Updated');
  });
});
