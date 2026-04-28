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
import LeftSideBar from '@components/Social/LeftSideBar';

const mockFormatMessage = jest.fn();
const mockGetALMObject = jest.fn();
const mockNavigateToBoardDetailsPage = jest.fn();
const mockLoadMyBoards = jest.fn();

jest.mock('react-intl', () => ({
  useIntl: () => ({ formatMessage: mockFormatMessage }),
}));

jest.mock('@utils/global', () => ({
  getALMObject: () => mockGetALMObject(),
}));

jest.mock('@spectrum-icons/workflow/Globe', () => ({
  __esModule: true,
  default: () => require('react').createElement('svg', { 'data-testid': 'globe-icon' }),
}));

jest.mock('@spectrum-icons/workflow/Article', () => ({
  __esModule: true,
  default: () => require('react').createElement('svg', { 'data-testid': 'article-icon' }),
}));

jest.mock('@components/Social/SectionLine', () => ({
  __esModule: true,
  default: ({ title }: any) => require('react').createElement('span', null, title),
}));

// Propagate `id` so document.getElementById finds the rendered elements without an extra spy.
jest.mock('@adobe/react-spectrum', () => ({
  Grid: ({ children, id, UNSAFE_className }: any) =>
    require('react').createElement('div', { id, className: UNSAFE_className }, children),
  View: ({ children }: any) => require('react').createElement('div', null, children),
}));

const defaultFavBoards = [
  { id: 'board-1', name: 'Board One' },
  { id: 'board-2', name: 'Board Two' },
];

function renderLeftSideBar(favBoards = defaultFavBoards) {
  return render(<LeftSideBar loadMyBoards={mockLoadMyBoards} favBoards={favBoards} />);
}

describe('LeftSideBar', () => {
  beforeEach(() => {
    mockFormatMessage.mockImplementation(({ defaultMessage }) => defaultMessage);
    mockGetALMObject.mockReturnValue({ navigateToBoardDetailsPage: mockNavigateToBoardDetailsPage });
  });

  describe('BoardHtml board toggle', () => {
    it('loadMyBoards_onMount_calledWithTrue', () => {
      renderLeftSideBar();

      expect(mockLoadMyBoards).toHaveBeenCalledWith(true);
      expect(mockLoadMyBoards).toHaveBeenCalledTimes(1);
    });

    it('loadMyBoardsPage_myBoardsClicked_callsLoadMyBoardsWithTrue', () => {
      renderLeftSideBar();

      userEvent.click(screen.getByText('My Boards'));

      // toHaveBeenLastCalledWith isolates the click call from the mount-effect call.
      expect(mockLoadMyBoards).toHaveBeenLastCalledWith(true);
      expect(mockLoadMyBoards).toHaveBeenCalledTimes(2);
    });

    it('loadMyBoardsPage_allBoardsClicked_callsLoadMyBoardsWithFalse', () => {
      renderLeftSideBar();

      userEvent.click(screen.getByText('all Boards'));

      expect(mockLoadMyBoards).toHaveBeenLastCalledWith(false);
      expect(mockLoadMyBoards).toHaveBeenCalledTimes(2);
    });
  });

  describe('FavHtml favourite boards', () => {
    it('favBoards_rendered_correctNumberOfNavigableItems', () => {
      renderLeftSideBar();

      expect(screen.getAllByRole('link')).toHaveLength(defaultFavBoards.length);
    });

    it.each([
      ['Board One', 'board-1'],
      ['Board Two', 'board-2'],
    ])('favBoardClick_%s_navigatesWithCorrectId', (name, id) => {
      renderLeftSideBar();

      userEvent.click(screen.getByText(name));

      expect(mockNavigateToBoardDetailsPage).toHaveBeenCalledWith(id);
      expect(mockNavigateToBoardDetailsPage).toHaveBeenCalledTimes(1);
    });

    it('favBoards_emptyArray_rendersNoNavigableItems', () => {
      renderLeftSideBar([]);

      expect(screen.queryAllByRole('link')).toHaveLength(0);
    });
  });
});
