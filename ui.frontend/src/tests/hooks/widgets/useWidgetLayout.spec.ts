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
jest.mock('@utils/widgets/utils', () => ({
  getIsCustomPage: jest.fn(),
}));

jest.mock('@utils/widgets/common', () => ({
  CARD_WIDTH_EXCLUDING_PADDING: 400,
  DOUBLE_CARD_WIDTH_EXCLUDING_PADDING: 820,
  MIN_COLUMN_WIDTH_FOR_2_CARDS: 600,
}));

import React from 'react';
import ReactDOM from 'react-dom';
import { act } from '@testing-library/react';
import { getIsCustomPage } from '@utils/widgets/utils';
import { useWidgetLayout } from '@hooks/widgets/useWidgetLayout';

const mockGetIsCustomPage = getIsCustomPage as jest.MockedFunction<typeof getIsCustomPage>;

function renderHook(props: any = {}) {
  const result: any = { current: null };
  const container = document.createElement('div');
  document.body.appendChild(container);

  act(() => {
    ReactDOM.render(
      React.createElement(() => {
        result.current = useWidgetLayout(props);
        return null;
      }),
      container
    );
  });

  return {
    result,
    rerender: (newProps: any = {}) => {
      act(() => {
        ReactDOM.render(
          React.createElement(() => {
            result.current = useWidgetLayout(newProps);
            return null;
          }),
          container
        );
      });
    },
    unmount: () => {
      act(() => { ReactDOM.unmountComponentAtNode(container); });
      container.parentNode?.removeChild(container);
    },
  };
}

describe('useWidgetLayout', () => {
  describe('Non-custom page (isCustomPage=false)', () => {
    beforeEach(() => {
      mockGetIsCustomPage.mockReturnValue(false);
    });

    it('returns default widgetId "homepage" when no widget provided', () => {
      const { result } = renderHook();
      expect(result.current.widgetId).toBe('homepage');
    });

    it('returns widget.id when provided', () => {
      const { result } = renderHook({ widget: { id: 'my-widget' } });
      expect(result.current.widgetId).toBe('my-widget');
    });

    it('falls back to layoutAttributes.id when widget.id is absent', () => {
      const { result } = renderHook({
        widget: { layoutAttributes: { id: 'layout-widget' } },
      });
      expect(result.current.widgetId).toBe('layout-widget');
    });

    it('noOfCards_nonMultiCard_alwaysReturns1', () => {
      const { result } = renderHook({
        widget: { layoutAttributes: { cardsToShow: 3 } },
        isMultiCard: false,
        defaultCardsToShow: 2,
      });
      expect(result.current.noOfCards).toBe(1);
    });

    it('noOfCards_multiCard_setsFromLayoutAttributes', () => {
      const { result } = renderHook({
        widget: { layoutAttributes: { cardsToShow: 3 } },
        isMultiCard: true,
        defaultCardsToShow: 1,
      });
      expect(result.current.noOfCards).toBe(3);
    });

    it('containerWidth_singleCard_equalsSingleCardWidth', () => {
      const { result } = renderHook({ isMultiCard: false });
      // For non-custom page, non-multi-card: containerWidth = CARD_WIDTH_EXCLUDING_PADDING
      expect(result.current.containerWidth).toBe(400);
    });

    it('singleCardWidth_nonCustomPage_equalsCardWidthConstant', () => {
      const { result } = renderHook({ isMultiCard: false });
      expect(result.current.singleCardWidth).toBe(400);
    });
  });

  describe('Custom page (isCustomPage=true)', () => {
    beforeEach(() => {
      mockGetIsCustomPage.mockReturnValue(true);
    });

    it('sectionRef_returned_isRefObject', () => {
      const { result } = renderHook({ isMultiCard: false });
      expect(typeof result.current.sectionRef).toBe('object');
    });

    it('addAndRemoveResizeListener_onMountAndUnmount_doesNotThrow', () => {
      const addSpy = jest.spyOn(window, 'addEventListener');
      const removeSpy = jest.spyOn(window, 'removeEventListener');

      const { unmount } = renderHook({ isCustomPage: true, isMultiCard: true });

      expect(addSpy).toHaveBeenCalledWith('resize', expect.any(Function));

      unmount();

      expect(removeSpy).toHaveBeenCalledWith('resize', expect.any(Function));
    });
  });
});
