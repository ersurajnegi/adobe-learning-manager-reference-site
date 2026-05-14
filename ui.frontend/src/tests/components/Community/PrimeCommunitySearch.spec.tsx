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
const mockSearchPostResult = jest.fn();

jest.mock('@hooks/community', () => ({
  usePosts: () => ({
    searchPostResult: mockSearchPostResult,
  }),
}));

jest.mock('@utils/inline_svg', () => ({
  SEARCH_SVG: () => null,
}));

import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import PrimeCommunitySearch from '@components/Community/PrimeCommunitySearch/PrimeCommunitySearch';

const defaultProps = {
  objectId: 'board-1',
  type: 'board',
  searchModeHandler: jest.fn(),
  showLoaderHandler: jest.fn(),
  searchCountHandler: jest.fn(),
  resetSearchHandler: jest.fn(),
  placeHolderText: 'Search posts',
};

const renderSearch = (props: any = {}) =>
  render(<PrimeCommunitySearch {...defaultProps} {...props} />);

const getInput = () => screen.getByRole('textbox') as HTMLInputElement;
const getButton = () => screen.getByRole('button');

// Helper: set the uncontrolled input value and flush async search
const triggerButtonSearch = async (value: string, props?: any) => {
  const searchModeHandler = jest.fn();
  const showLoaderHandler = jest.fn();
  const searchCountHandler = jest.fn();
  renderSearch({ searchModeHandler, showLoaderHandler, searchCountHandler, ...props });
  const input = getInput();
  fireEvent.change(input, { target: { value } });
  fireEvent.click(getButton());
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
  return { searchModeHandler, showLoaderHandler, searchCountHandler };
};

describe('PrimeCommunitySearch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockSearchPostResult.mockResolvedValue([{ id: 'r1' }, { id: 'r2' }]);
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('renders input with the provided placeholder text', () => {
    renderSearch();
    expect(getInput()).toHaveAttribute('placeholder', 'Search posts');
  });

  describe('Search button', () => {
    it('calls searchPostResult(value, objectId, type), shows then hides loader, and delivers results', async () => {
      const { searchModeHandler, showLoaderHandler, searchCountHandler } =
        await triggerButtonSearch('hello');
      expect(searchModeHandler).toHaveBeenCalledWith(true);
      expect(showLoaderHandler).toHaveBeenNthCalledWith(1, true);
      expect(mockSearchPostResult).toHaveBeenCalledWith('hello', 'board-1', 'board');
      expect(searchCountHandler).toHaveBeenCalledWith([{ id: 'r1' }, { id: 'r2' }], 'hello');
      expect(showLoaderHandler).toHaveBeenLastCalledWith(false);
    });

    it('searches with empty string when input is blank', async () => {
      await triggerButtonSearch('');
      expect(mockSearchPostResult).toHaveBeenCalledWith('', 'board-1', 'board');
    });
  });

  describe('Enter key', () => {
    it('triggers full search flow and clears the input', async () => {
      renderSearch();
      const input = getInput();
      fireEvent.change(input, { target: { value: 'query' } });
      fireEvent.keyUp(input, { key: 'Enter' });
      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      });
      expect(mockSearchPostResult).toHaveBeenCalledWith('query', 'board-1', 'board');
      expect(input.value).toBe('');
    });
  });

  describe('Debounced keyUp', () => {
    it('fires search after 1500ms when input has 3+ non-whitespace characters', async () => {
      renderSearch();
      const input = getInput();
      fireEvent.change(input, { target: { value: 'abc' } });
      fireEvent.keyUp(input, { key: 'c' });
      expect(mockSearchPostResult).not.toHaveBeenCalled();
      jest.advanceTimersByTime(1500);
      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      });
      expect(mockSearchPostResult).toHaveBeenCalledWith('abc', 'board-1', 'board');
    });

    it('does not fire search when input has fewer than 3 non-whitespace characters', () => {
      renderSearch();
      const input = getInput();
      fireEvent.change(input, { target: { value: 'ab' } });
      fireEvent.keyUp(input, { key: 'b' });
      jest.advanceTimersByTime(2000);
      expect(mockSearchPostResult).not.toHaveBeenCalled();
    });

    it('resets the debounce timer on each keystroke so only one search fires', async () => {
      renderSearch();
      const input = getInput();
      // First keystroke
      fireEvent.change(input, { target: { value: 'abc' } });
      fireEvent.keyUp(input, { key: 'c' });
      jest.advanceTimersByTime(1000);
      // Second keystroke before timer fires
      fireEvent.change(input, { target: { value: 'abcd' } });
      fireEvent.keyUp(input, { key: 'd' });
      jest.advanceTimersByTime(1500);
      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      });
      expect(mockSearchPostResult).toHaveBeenCalledTimes(1);
      expect(mockSearchPostResult).toHaveBeenCalledWith('abcd', 'board-1', 'board');
    });
  });

  describe('Reset on empty input', () => {
    it('calls resetSearchHandler when keyUp fires with an empty input value', async () => {
      const resetSearchHandler = jest.fn();
      renderSearch({ resetSearchHandler });
      const input = getInput();
      fireEvent.change(input, { target: { value: '' } });
      fireEvent.keyUp(input, { key: 'Backspace' });
      await act(async () => { await Promise.resolve(); });
      expect(resetSearchHandler).toHaveBeenCalledTimes(1);
    });

    it('does not call resetSearchHandler when input has content', () => {
      const resetSearchHandler = jest.fn();
      renderSearch({ resetSearchHandler });
      const input = getInput();
      fireEvent.change(input, { target: { value: 'ab' } });
      fireEvent.keyUp(input, { key: 'b' });
      jest.advanceTimersByTime(2000);
      expect(resetSearchHandler).not.toHaveBeenCalled();
    });
  });
});
