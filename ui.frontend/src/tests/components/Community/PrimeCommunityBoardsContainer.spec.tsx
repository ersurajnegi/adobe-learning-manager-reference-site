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
import PrimeCommunityBoardsContainer from '@components/Community/PrimeCommunityBoardsContainer/PrimeCommunityBoardsContainer';
import { PrimeBoard } from '@models/PrimeModels';

jest.mock('@adobe/react-spectrum', () => ({
  lightTheme: {},
  Provider: ({ children }: any) => <div>{children}</div>,
}));

jest.mock('@components/Community/PrimeCommunityBoard', () => ({
  PrimeCommunityBoard: ({ board, showBorder }: any) => (
    <div data-testid={`board-${board.id}`} data-showborder={String(showBorder)}>
      {board.name}
    </div>
  ),
}));

describe('PrimeCommunityBoardsContainer', () => {
  const mockLoadMoreBoards = jest.fn();

  const makeBoard = (id: string, name: string): PrimeBoard =>
    ({ id, name }) as PrimeBoard;

  const defaultProps = {
    boards: [makeBoard('b1', 'Board 1'), makeBoard('b2', 'Board 2')],
    loadMoreBoards: mockLoadMoreBoards,
    hasMoreItems: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = (props = {}, messages: Record<string, string> = { 'alm.community.loadMore': 'Load more' }) =>
    render(
      <IntlProvider locale="en" messages={messages}>
        <PrimeCommunityBoardsContainer {...defaultProps} {...props} />
      </IntlProvider>
    );

  it('renders all boards with showBorder=true', () => {
    renderComponent();
    expect(screen.getByTestId('board-b1').getAttribute('data-showborder')).toBe('true');
    expect(screen.getByTestId('board-b2').getAttribute('data-showborder')).toBe('true');
  });

  it('renders no board elements when boards is null', () => {
    renderComponent({ boards: null });
    expect(screen.queryByTestId(/^board-/)).toBeNull();
  });

  it('shows "Load more" button when hasMoreItems is true', () => {
    renderComponent({ hasMoreItems: true });
    expect(screen.queryByText('Load more')).not.toBeNull();
  });

  it('hides "Load more" button when hasMoreItems is false', () => {
    renderComponent({ hasMoreItems: false });
    expect(screen.queryByText('Load more')).toBeNull();
  });

  it('calls loadMoreBoards when "Load more" is clicked', () => {
    renderComponent();
    userEvent.click(screen.getByText('Load more'));
    expect(mockLoadMoreBoards).toHaveBeenCalledTimes(1);
  });

  it('renders translated "Load more" label for a non-English locale', () => {
    render(
      <IntlProvider locale="fr" messages={{ 'alm.community.loadMore': 'Charger plus' }}>
        <PrimeCommunityBoardsContainer {...defaultProps} />
      </IntlProvider>
    );
    expect(screen.queryByText('Charger plus')).not.toBeNull();
  });

  it('falls back to defaultMessage when translation is missing', () => {
    renderComponent({}, {});
    expect(screen.queryByText('Load more')).not.toBeNull();
  });
});
