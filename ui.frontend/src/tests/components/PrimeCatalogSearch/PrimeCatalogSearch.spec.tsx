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
import { waitFor } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import PrimeCatalogSearch from '@components/Catalog/PrimeCatalogSearch/PrimeCatalogSearch';
import * as globalUtils from '@utils/global';
import * as searchActions from '@almStore/actions/search/actions';
import * as translationService from '@utils/translationService';
import { withProviders } from '../../common/hoc';
import '@testing-library/jest-dom/extend-expect';

jest.mock('../../../index', () => ({
  reducer: jest.fn((state = {}) => state),
}));

import store from '../../../store/APIStore';

jest.mock('@utils/translationService', () => ({
  GetTranslation: jest.fn((key: string) => key),
}));

jest.mock('@utils/global', () => ({
  getALMObject: jest.fn(),
  getALMConfig: jest.fn(() => ({
    primeApiURL: 'https://test.api.com',
    graphqlProxyPath: 'https://test.graphql.com',
  })),
}));

jest.mock('@utils/catalog', () => ({
  debounce: (fn: any) => fn,
}));

jest.mock('@utils/inline_svg', () => ({
  SEARCH_ICON_SVG: jest.fn(() => {
    const React = require('react');
    return React.createElement('svg', { 'data-testid': 'search-icon' });
  }),
}));

jest.mock('@utils/constants', () => ({
  POPULAR_SUGGESTIONS: 'POPULAR_SUGGESTIONS',
  USERS_SUGGESTIONS: 'USERS_SUGGESTIONS',
}));

jest.mock('@almStore/actions/search/actions', () => ({
  closeSuggestionsList: jest.fn(() => ({ type: 'CLOSE_SUGGESTIONS_LIST' })),
  searchInput: jest.fn(value => ({ type: 'SEARCH_INPUT', payload: value })),
  showSuggestionsList: jest.fn(suggestions => ({ type: 'SHOW_SUGGESTIONS_LIST', payload: suggestions })),
}));

jest.mock('@almStore/reducers/catalog', () => ({
  defaultSearchInDropdownList: [
    { label: 'alm.catalog.searchIn.title', value: 'title', checked: true },
    { label: 'alm.catalog.searchIn.description', value: 'description', checked: false },
  ],
}));

const INPUT_PLACEHOLDER = 'Enter text and press enter';

const defaultProps = {
  query: '',
  handleSearch: jest.fn(),
  getSearchSuggestions: jest.fn().mockResolvedValue({ userSearchHistory: [], popularSearches: [] }),
  updateSnippet: jest.fn(),
  autoCorrectMode: false,
};

describe('PrimeCatalogSearch', () => {
  let mockDispatch: jest.Mock;
  // Single spy instance per test — updated via mockReturnValue rather than re-spying
  let storeGetStateSpy: jest.SpyInstance;

  const setStoreState = (overrides: object = {}) => {
    storeGetStateSpy.mockReturnValue({
      search: {
        autocomplete: true,
        userSearchHistory: [],
        popularSearches: [],
        searchQuery: '',
        ...overrides,
      },
    } as any);
  };

  beforeEach(() => {
    mockDispatch = jest.fn();
    jest.spyOn(require('react-redux'), 'useDispatch').mockReturnValue(mockDispatch);

    // resetMocks:true clears jest.fn() implementations, so restore them here
    (translationService.GetTranslation as jest.Mock).mockImplementation((key: string) => key);
    (searchActions.closeSuggestionsList as jest.Mock).mockReturnValue({ type: 'CLOSE_SUGGESTIONS_LIST' });
    (searchActions.searchInput as jest.Mock).mockImplementation(v => ({ type: 'SEARCH_INPUT', payload: v }));
    (searchActions.showSuggestionsList as jest.Mock).mockImplementation(s => ({ type: 'SHOW_SUGGESTIONS_LIST', payload: s }));

    (globalUtils.getALMObject as jest.Mock).mockReturnValue({ isPrimeUserLoggedIn: () => true });

    // Create ONE spy per test; tests that need different state call setStoreState()
    storeGetStateSpy = jest.spyOn(store, 'getState').mockReturnValue({
      search: { autocomplete: true, userSearchHistory: [], popularSearches: [], searchQuery: '' },
    } as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const getInput = () => screen.getByPlaceholderText(INPUT_PLACEHOLDER) as HTMLInputElement;

  describe('Search execution', () => {
    it('searchChangedHandler_enterKeyPressed_callsHandleSearchWithTextAndAutoCorrectFalse', async () => {
      const handleSearch = jest.fn();
      render(withProviders(PrimeCatalogSearch, { ...defaultProps, handleSearch, autoCorrectMode: false }));

      await userEvent.type(getInput(), 'React');
      fireEvent.keyDown(getInput(), { key: 'Enter' });

      expect(handleSearch).toHaveBeenCalledWith('React', false);
      expect(handleSearch).toHaveBeenCalledTimes(1);
    });

    it('searchChangedHandler_enterKeyWithAutoCorrectModeTrue_passesAutoCorrectFlag', async () => {
      const handleSearch = jest.fn();
      render(withProviders(PrimeCatalogSearch, { ...defaultProps, handleSearch, autoCorrectMode: true }));

      await userEvent.type(getInput(), 'Test');
      fireEvent.keyDown(getInput(), { key: 'Enter' });

      expect(handleSearch).toHaveBeenCalledWith('Test', true);
    });

    it('beginSearchHandler_searchIconClickedWithNonEmptyInput_callsHandleSearch', async () => {
      // autocomplete:false → searchSuggestionsTemplate renders nothing → ref is null
      // → handleClickOutside does NOT stopPropagation → span onClick fires normally
      setStoreState({ autocomplete: false });
      const handleSearch = jest.fn();
      const { container } = render(withProviders(PrimeCatalogSearch, { ...defaultProps, handleSearch }));

      await userEvent.type(getInput(), 'JavaScript');
      fireEvent.click(container.querySelector('.searchIcon')!);

      expect(handleSearch).toHaveBeenCalledWith('JavaScript', false);
    });

    it('beginSearchHandler_searchIconClickedWithEmptyInput_doesNotCallHandleSearch', () => {
      setStoreState({ autocomplete: false });
      const handleSearch = jest.fn();
      const { container } = render(withProviders(PrimeCatalogSearch, { ...defaultProps, handleSearch, query: '' }));

      fireEvent.click(container.querySelector('.searchIcon')!);

      expect(handleSearch).not.toHaveBeenCalled();
    });

    it('queryProp_changesViaRerender_inputValueUpdates', () => {
      const { rerender } = render(withProviders(PrimeCatalogSearch, defaultProps));
      expect(getInput().value).toBe('');

      rerender(withProviders(PrimeCatalogSearch, { ...defaultProps, query: 'Updated Query' }));

      expect(getInput().value).toBe('Updated Query');
    });
  });

  describe('openSuggestionList — input event handling (logged-in users)', () => {
    it('openSuggestionList_inputLengthBetween1And2_dispatchesCloseSuggestionsListAndSkipsFetch', () => {
      const getSearchSuggestions = jest.fn();
      render(withProviders(PrimeCatalogSearch, { ...defaultProps, getSearchSuggestions }));
      const input = getInput();

      Object.defineProperty(input, 'value', { value: 'Re', writable: true, configurable: true });
      fireEvent.input(input);

      expect(mockDispatch).toHaveBeenCalledWith({ type: 'CLOSE_SUGGESTIONS_LIST' });
      expect(getSearchSuggestions).not.toHaveBeenCalled();
    });

    it('openSuggestionList_inputLength3orMore_callsGetSearchSuggestionsWithCorrectValue', async () => {
      const getSearchSuggestions = jest.fn().mockResolvedValue({ userSearchHistory: [], popularSearches: [] });
      render(withProviders(PrimeCatalogSearch, { ...defaultProps, getSearchSuggestions }));
      const input = getInput();

      Object.defineProperty(input, 'value', { value: 'Rea', writable: true, configurable: true });
      fireEvent.input(input);

      await waitFor(() => {
        expect(getSearchSuggestions).toHaveBeenCalledWith('Rea');
      });
    });

    it('openSuggestionList_inputLength3orMore_dispatchesShowSuggestionsListWithFetchedData', async () => {
      const suggestions = { userSearchHistory: ['React'], popularSearches: ['Python'] };
      const getSearchSuggestions = jest.fn().mockResolvedValue(suggestions);
      render(withProviders(PrimeCatalogSearch, { ...defaultProps, getSearchSuggestions }));
      const input = getInput();

      Object.defineProperty(input, 'value', { value: 'Rea', writable: true, configurable: true });
      fireEvent.input(input);

      await waitFor(() => {
        // Only assert on dispatch integration; action creator assertion is redundant
        expect(mockDispatch).toHaveBeenCalledWith({ type: 'SHOW_SUGGESTIONS_LIST', payload: suggestions });
      });
    });

    it('openSuggestionList_inputOver200Chars_callsGetSearchSuggestionsWithValueTruncatedTo200', async () => {
      const getSearchSuggestions = jest.fn().mockResolvedValue({ userSearchHistory: [], popularSearches: [] });
      render(withProviders(PrimeCatalogSearch, { ...defaultProps, getSearchSuggestions }));

      const input = getInput();
      Object.defineProperty(input, 'value', { value: 'a'.repeat(250), writable: true, configurable: true });
      fireEvent.input(input);

      await waitFor(() => {
        expect(getSearchSuggestions).toHaveBeenCalledWith('a'.repeat(200));
      });
    });

    it('openSuggestionList_inputLength3orMore_dispatchesSearchInputWithValueBeforeFetching', async () => {
      // searchInput(value) tracks current query in Redux; must be dispatched before the async fetch
      const getSearchSuggestions = jest.fn().mockResolvedValue({ userSearchHistory: [], popularSearches: [] });
      render(withProviders(PrimeCatalogSearch, { ...defaultProps, getSearchSuggestions }));

      const input = getInput();
      Object.defineProperty(input, 'value', { value: 'React', writable: true, configurable: true });
      fireEvent.input(input);

      // searchInput dispatched synchronously before the async getSearchSuggestions resolves
      expect(searchActions.searchInput).toHaveBeenCalledWith('React');
      expect(mockDispatch).toHaveBeenCalledWith({ type: 'SEARCH_INPUT', payload: 'React' });
    });

    it('openSuggestionList_emptyInput_callsGetSearchSuggestionsWithEmptyString', async () => {
      // Empty input (length 0) falls through the 1-2 char early-return branch.
      // openSuggestionList still calls the API with '' — used to show unfiltered history/popular on focus.
      const getSearchSuggestions = jest.fn().mockResolvedValue({ userSearchHistory: [], popularSearches: [] });
      render(withProviders(PrimeCatalogSearch, { ...defaultProps, getSearchSuggestions }));

      fireEvent.input(getInput()); // input.value is '' (empty)

      await waitFor(() => {
        expect(getSearchSuggestions).toHaveBeenCalledWith('');
        expect(mockDispatch).toHaveBeenCalledWith({ type: 'SEARCH_INPUT', payload: '' });
      });
    });

    it('openSuggestionList_guestUser_doesNotCallGetSearchSuggestionsOnInput', () => {
      (globalUtils.getALMObject as jest.Mock).mockReturnValue({ isPrimeUserLoggedIn: () => false });
      const getSearchSuggestions = jest.fn();
      render(withProviders(PrimeCatalogSearch, { ...defaultProps, getSearchSuggestions }));
      const input = getInput();

      Object.defineProperty(input, 'value', { value: 'React', writable: true, configurable: true });
      fireEvent.input(input);

      expect(getSearchSuggestions).not.toHaveBeenCalled();
    });
  });

  describe('Autocomplete suggestions rendering', () => {
    it('searchSuggestionsTemplate_userHistoryPresent_rendersItemsFromUserHistory', () => {
      // Suggestions render from store state (canAutoComplete=true), no interaction needed
      setStoreState({ userSearchHistory: ['React Testing'], popularSearches: [] });
      render(withProviders(PrimeCatalogSearch, defaultProps));

      expect(screen.getByText('React Testing')).toBeInTheDocument();
    });

    it('searchSuggestionsTemplate_popularSearchesPresent_rendersItemsFromPopularSearches', () => {
      setStoreState({ userSearchHistory: [], popularSearches: ['Python', 'Java'] });
      render(withProviders(PrimeCatalogSearch, defaultProps));

      expect(screen.getByText('Python')).toBeInTheDocument();
      expect(screen.getByText('Java')).toBeInTheDocument();
    });

    it('autoComplete_bothTypesPresent_rendersDividerBetweenSections', () => {
      setStoreState({ userSearchHistory: ['React'], popularSearches: ['Python'] });
      const { container } = render(withProviders(PrimeCatalogSearch, defaultProps));

      expect(container.querySelector('hr')).toBeInTheDocument();
    });

    it('autoComplete_onlyUserHistory_noDivider', () => {
      setStoreState({ userSearchHistory: ['React'], popularSearches: [] });
      const { container } = render(withProviders(PrimeCatalogSearch, defaultProps));

      expect(screen.getByText('React')).toBeInTheDocument();
      expect(container.querySelector('hr')).not.toBeInTheDocument();
    });

    it('autoComplete_bothArraysEmpty_rendersNoSuggestionItems', () => {
      setStoreState({ userSearchHistory: [], popularSearches: [] });
      render(withProviders(PrimeCatalogSearch, defaultProps));

      // getSuggestionHtml returns '' for empty arrays; nothing to find
      expect(screen.queryByText('alm.search.userSearchHistory.label')).not.toBeInTheDocument();
      expect(screen.queryByText('alm.search.popularSearchHistory.label')).not.toBeInTheDocument();
    });

    it('searchSuggestionsTemplate_autocompleteDisabledInStore_noSuggestionsContainerRendered', () => {
      setStoreState({ autocomplete: false, userSearchHistory: ['React'], popularSearches: [] });
      render(withProviders(PrimeCatalogSearch, defaultProps));

      expect(screen.queryByText('React')).not.toBeInTheDocument();
    });

    it('searchSuggestionsTemplate_guestUser_noSuggestionsContainerRendered', () => {
      (globalUtils.getALMObject as jest.Mock).mockReturnValue({ isPrimeUserLoggedIn: () => false });
      setStoreState({ userSearchHistory: ['React'], popularSearches: [] });
      render(withProviders(PrimeCatalogSearch, defaultProps));

      expect(screen.queryByText('React')).not.toBeInTheDocument();
    });

    it('handleClick_suggestionClicked_callsHandleSearchWithItemAndDispatchesClose', () => {
      // Suggestion items are INSIDE searchAutocompleteDropdownRef
      // → handleClickOutside does NOT stopPropagation → li onClick fires normally
      const handleSearch = jest.fn();
      setStoreState({ userSearchHistory: ['React Testing'], popularSearches: [] });
      render(withProviders(PrimeCatalogSearch, { ...defaultProps, handleSearch }));

      fireEvent.click(screen.getByText('React Testing').closest('li')!);

      expect(handleSearch).toHaveBeenCalledWith('React Testing');
      expect(mockDispatch).toHaveBeenCalledWith({ type: 'CLOSE_SUGGESTIONS_LIST' });
    });

    it('handleEnter_enterKeyPressedOnSuggestion_callsHandleSearchWithItemAndDispatchesClose', () => {
      const handleSearch = jest.fn();
      setStoreState({ userSearchHistory: ['JavaScript'], popularSearches: [] });
      render(withProviders(PrimeCatalogSearch, { ...defaultProps, handleSearch }));

      fireEvent.keyDown(screen.getByText('JavaScript').closest('li')!, { key: 'Enter' });

      expect(handleSearch).toHaveBeenCalledWith('JavaScript');
      expect(mockDispatch).toHaveBeenCalledWith({ type: 'CLOSE_SUGGESTIONS_LIST' });
    });
  });

  describe('Filter dropdown (Search In)', () => {
    it('filterButton_loggedInUser_isVisibleWithoutHideClass', () => {
      const { container } = render(withProviders(PrimeCatalogSearch, defaultProps));

      expect(container.querySelector('button')).not.toHaveClass('hide');
    });

    it('filterButton_guestUser_hasHideClass', () => {
      (globalUtils.getALMObject as jest.Mock).mockReturnValue({ isPrimeUserLoggedIn: () => false });
      const { container } = render(withProviders(PrimeCatalogSearch, defaultProps));

      expect(container.querySelector('button')).toHaveClass('hide');
    });

    it('filterButton_clicked_opensDropdownWithSearchInHeading', async () => {
      // autocomplete:false → suggestions ref is null → capture listener does NOT stopPropagation
      // → button onClick fires and setShowSearchInDropdown(true) takes effect
      setStoreState({ autocomplete: false });
      const { container } = render(withProviders(PrimeCatalogSearch, defaultProps));

      expect(screen.queryByText('alm.catalog.searchIn')).not.toBeInTheDocument();
      fireEvent.click(container.querySelector('button')!);

      await waitFor(() => {
        expect(screen.getByText('alm.catalog.searchIn')).toBeInTheDocument();
      });
    });
  });

  describe('Search flow — typing progression and suggestions display', () => {
    // Use fireEvent.input with Object.defineProperty for discrete, deterministic input steps
    const setInputValue = (input: HTMLElement, value: string) => {
      Object.defineProperty(input, 'value', { value, writable: true, configurable: true });
    };

    it('typingProgression_2CharsThen3Chars_suggestionsFetchStartsExactlyAt3', async () => {
      // At 2 chars: closeSuggestionsList dispatched, no API call.
      // At 3 chars: API called. This verifies the threshold is exactly 3.
      const getSearchSuggestions = jest.fn().mockResolvedValue({ userSearchHistory: [], popularSearches: [] });
      render(withProviders(PrimeCatalogSearch, { ...defaultProps, getSearchSuggestions }));
      const input = getInput();

      setInputValue(input, 'Re');
      fireEvent.input(input);
      expect(getSearchSuggestions).not.toHaveBeenCalled();
      expect(mockDispatch).toHaveBeenCalledWith({ type: 'CLOSE_SUGGESTIONS_LIST' });

      mockDispatch.mockClear();
      setInputValue(input, 'Rea');
      fireEvent.input(input);

      await waitFor(() => {
        expect(getSearchSuggestions).toHaveBeenCalledWith('Rea');
        expect(mockDispatch).toHaveBeenCalledWith({ type: 'SHOW_SUGGESTIONS_LIST', payload: { userSearchHistory: [], popularSearches: [] } });
      });
    });

    it('typingProgression_queryUpdatesAsUserTypes_apiCalledWithLatestValue', async () => {
      // Each new input fires openSuggestionList with the current full query value
      const getSearchSuggestions = jest.fn().mockResolvedValue({ userSearchHistory: [], popularSearches: [] });
      render(withProviders(PrimeCatalogSearch, { ...defaultProps, getSearchSuggestions }));
      const input = getInput();

      setInputValue(input, 'Rea');
      fireEvent.input(input);
      await waitFor(() => expect(getSearchSuggestions).toHaveBeenCalledWith('Rea'));

      setInputValue(input, 'React');
      fireEvent.input(input);
      await waitFor(() => expect(getSearchSuggestions).toHaveBeenCalledWith('React'));
    });

    it('typingProgression_differentQueries_showSuggestionsDispatchedWithCorrespondingFetchedData', async () => {
      // Each query produces a separate showSuggestionsList dispatch carrying the API result for THAT query
      const result1 = { userSearchHistory: ['React Router'], popularSearches: [] };
      const result2 = { userSearchHistory: ['React Native'], popularSearches: [] };
      const getSearchSuggestions = jest.fn()
        .mockResolvedValueOnce(result1)
        .mockResolvedValueOnce(result2);
      render(withProviders(PrimeCatalogSearch, { ...defaultProps, getSearchSuggestions }));
      const input = getInput();

      setInputValue(input, 'Rea');
      fireEvent.input(input);
      await waitFor(() =>
        expect(mockDispatch).toHaveBeenCalledWith({ type: 'SHOW_SUGGESTIONS_LIST', payload: result1 })
      );

      setInputValue(input, 'React');
      fireEvent.input(input);
      await waitFor(() =>
        expect(mockDispatch).toHaveBeenCalledWith({ type: 'SHOW_SUGGESTIONS_LIST', payload: result2 })
      );
    });

    it('fullPipeline_typingTriggersFetchAndDispatch_suggestionsDisplayedFromStoreState', async () => {
      // Simulates the full search flow:
      // user types → API called → showSuggestionsList dispatched → Redux updates store →
      // component re-renders showing suggestions from store state
      // (store update is simulated by pre-setting state to match what the API returns)
      const fetchedSuggestions = { userSearchHistory: ['React Hooks', 'React Router'], popularSearches: ['Vue', 'Angular'] };
      const getSearchSuggestions = jest.fn().mockResolvedValue(fetchedSuggestions);

      // Pre-set store state to match what the API returns (simulates Redux store update after dispatch)
      setStoreState({
        userSearchHistory: fetchedSuggestions.userSearchHistory,
        popularSearches: fetchedSuggestions.popularSearches,
      });

      render(withProviders(PrimeCatalogSearch, { ...defaultProps, getSearchSuggestions }));
      const input = getInput();
      Object.defineProperty(input, 'value', { value: 'Reac', writable: true, configurable: true });
      fireEvent.input(input);

      await waitFor(() => {
        // API called with the typed query
        expect(getSearchSuggestions).toHaveBeenCalledWith('Reac');
        // Results dispatched to Redux
        expect(mockDispatch).toHaveBeenCalledWith({ type: 'SHOW_SUGGESTIONS_LIST', payload: fetchedSuggestions });
        // Suggestions visible in the DOM (from store state matching fetched data)
        expect(screen.getByText('React Hooks')).toBeInTheDocument();
        expect(screen.getByText('Vue')).toBeInTheDocument();
      });
    });
  });

  describe('Click outside handling', () => {
    it('handleClickOutside_clickOutsideWithSuggestionsMounted_dispatchesCloseSuggestionsList', () => {
      // Suggestions are already in DOM from pre-set store state
      setStoreState({ userSearchHistory: ['React'], popularSearches: [] });
      render(withProviders(PrimeCatalogSearch, defaultProps));

      fireEvent.click(document.body);

      expect(mockDispatch).toHaveBeenCalledWith({ type: 'CLOSE_SUGGESTIONS_LIST' });
    });

    it('mount_addsDocumentClickListenerWithCaptureFlag', () => {
      const addEventListenerSpy = jest.spyOn(document, 'addEventListener');
      render(withProviders(PrimeCatalogSearch, defaultProps));

      expect(addEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function), true);
    });
  });
});
