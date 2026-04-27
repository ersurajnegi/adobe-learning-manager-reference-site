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
import { useCallback, useRef, useState } from 'react';
import { ONE } from '../../utils/widgets/common';

interface UseStripScrollProps {
  cardWidth: number;
  items: any[];
  fetchingData: boolean;
  fetchMore: (searchString: string) => void;
  searchString: string;
}

export const useStripScroll = ({
  cardWidth,
  items,
  fetchingData,
  fetchMore,
  searchString,
}: UseStripScrollProps) => {
  const rollContainer = useRef<HTMLDivElement>(null);
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);
  const [state, setState] = useState({
    firstVisibleItemPosition: 0,
    disableRightNavIcon: false,
    disableLeftNavIcon: false,
    itemsPerPage: 4,
  });

  const { firstVisibleItemPosition, disableRightNavIcon, disableLeftNavIcon, itemsPerPage } = state;

  const updateItemsPerPage = (newState: Partial<typeof state>) => {
    setState(prevState => ({ ...prevState, ...newState }));
  };

  const fetchIfNeeded = useCallback(
    (firstVisibleItemPosition: number) => {
      if (
        !fetchingData &&
        items.length &&
        items.length - firstVisibleItemPosition < itemsPerPage * 2
      ) {
        fetchMore(searchString);
      }
    },
    [itemsPerPage, items.length, fetchingData, fetchMore, searchString]
  );

  const getFirstVisibleItemAfterSwipe = useCallback(
    (offsetLeftToUse: number): number => {
      const itemsPerRow = itemsPerPage;
      const oneItemWidth = cardWidth;
      const numItems =
        offsetLeftToUse < itemsPerPage ? ONE : Math.ceil(offsetLeftToUse / oneItemWidth);
      const numPages = Math.floor(numItems / itemsPerRow);
      const retval = numPages * itemsPerPage + (numItems % itemsPerRow);
      return retval;
    },
    [itemsPerPage, cardWidth]
  );

  const getItemOffsetLeft = useCallback(
    (firstVisibleItemPosition: number, smoothScrolling: boolean, itemsPerPage: number): number => {
      const itemsPerRow = itemsPerPage;
      const pageIdx = firstVisibleItemPosition / itemsPerPage;
      let smoothScrollingPartialCards = 0;
      if (smoothScrolling) {
        smoothScrollingPartialCards = firstVisibleItemPosition % itemsPerRow;
      }
      return (pageIdx * itemsPerRow + smoothScrollingPartialCards) * cardWidth;
    },
    [cardWidth]
  );

  const scrollTo = useCallback(
    (firstVisibleItemPosition: number, smoothScrolling: boolean, scrollTime: number) => {
      const positionToUse = getItemOffsetLeft(
        firstVisibleItemPosition,
        smoothScrolling,
        itemsPerPage
      );
      if (positionToUse != rollContainer.current?.scrollLeft) {
        rollContainer.current?.scrollTo({
          left: positionToUse,
          behavior: 'smooth',
        });
      }
      setState(prevState => ({
        ...prevState,
        firstVisibleItemPosition,
      }));
    },
    [itemsPerPage, getItemOffsetLeft]
  );

  const rollAPage = useCallback(
    (right: boolean) => {
      let firstVisibleItemPosition_local = firstVisibleItemPosition;
      if (right) {
        firstVisibleItemPosition_local += itemsPerPage;
        fetchIfNeeded(firstVisibleItemPosition_local);
      } else {
        firstVisibleItemPosition_local -= itemsPerPage;
      }
      if (firstVisibleItemPosition_local < 0) {
        firstVisibleItemPosition_local = 0;
      }
      scrollTo(firstVisibleItemPosition_local, false, 1000);
    },
    [firstVisibleItemPosition, itemsPerPage, fetchIfNeeded, scrollTo]
  );

  const onScroll = useCallback(
    (event: any) => {
      if (fetchingData) return;
      const { target } = event;
      if ((items.length - (itemsPerPage + 5)) * cardWidth < target.scrollLeft) {
        fetchMore(searchString);
      }
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
      scrollTimeout.current = setTimeout(() => {
        setState(prevState => {
          const { scrollLeft, offsetWidth, scrollWidth } = target;
          const disableLeftNavIcon = scrollLeft === 0;
          const disableRightNavIcon = scrollLeft + offsetWidth === scrollWidth;
          const firstVisibleItemPosition = disableLeftNavIcon
            ? 0
            : getFirstVisibleItemAfterSwipe(scrollLeft);
          return {
            ...prevState,
            disableRightNavIcon,
            firstVisibleItemPosition,
            disableLeftNavIcon,
          };
        });
      }, 100);
    },
    [
      itemsPerPage,
      items.length,
      fetchingData,
      fetchMore,
      getFirstVisibleItemAfterSwipe,
      cardWidth,
      searchString,
    ]
  );

  const isLeftNavIconDisabled = useCallback((): boolean => {
    return firstVisibleItemPosition === 0 || disableLeftNavIcon;
  }, [firstVisibleItemPosition, disableLeftNavIcon, itemsPerPage]);

  const isRightNavIconDisabled = useCallback((): boolean => {
    return (
      items.length <= itemsPerPage ||
      firstVisibleItemPosition + itemsPerPage >= items.length ||
      disableRightNavIcon
    );
  }, [firstVisibleItemPosition, items.length, itemsPerPage, disableRightNavIcon, itemsPerPage]);

  return {
    rollContainer,
    firstVisibleItemPosition,
    disableRightNavIcon,
    disableLeftNavIcon,
    onScroll,
    rollAPage,
    isLeftNavIconDisabled,
    isRightNavIconDisabled,
    itemsPerPage,
    updateItemsPerPage,
  };
};
