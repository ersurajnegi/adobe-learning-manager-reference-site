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
import { useEffect, useRef, useState } from 'react';
import { getIsCustomPage } from '../../utils/widgets/utils';
import {
  CARD_WIDTH_EXCLUDING_PADDING,
  DOUBLE_CARD_WIDTH_EXCLUDING_PADDING,
  MIN_COLUMN_WIDTH_FOR_2_CARDS,
} from '../../utils/widgets/common';

interface UseWidgetLayoutProps {
  widget?: {
    id?: string;
    layoutAttributes?: {
      id?: string;
      cardsToShow?: number;
    };
  };
  defaultCardsToShow?: number;
  doRefresh?: boolean;
  isMultiCard?: boolean; // Flag to indicate if widget supports multiple cards
}

export interface UseWidgetLayoutReturn {
  containerWidth: number;
  noOfCards: number;
  singleCardWidth: number;
  widgetId: string;
  sectionRef: React.RefObject<HTMLDivElement>;
}

export const useWidgetLayout = ({
  widget,
  defaultCardsToShow = 1,
  doRefresh,
  isMultiCard = false, // Default to false for backward compatibility
}: UseWidgetLayoutProps = {}): UseWidgetLayoutReturn => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [noOfCards, setNoOfCards] = useState<number>(defaultCardsToShow);
  const isCustomPage = getIsCustomPage();

  // Calculate widgetId with fallback
  const widgetId = widget?.id || widget?.layoutAttributes?.id || 'homepage';

  // Handle doRefresh for non-custom pages (only for multi-card widgets)
  useEffect(() => {
    if (!isCustomPage && isMultiCard) {
      setNoOfCards(widget?.layoutAttributes?.cardsToShow || defaultCardsToShow);
    }
  }, [
    doRefresh,
    widget?.layoutAttributes?.cardsToShow,
    defaultCardsToShow,
    isCustomPage,
    isMultiCard,
  ]);

  // Handle responsive behavior for custom pages
  useEffect(() => {
    if (isCustomPage) {
      const updateWidth = () => {
        if (sectionRef.current) {
          const newWidth = sectionRef.current.offsetWidth;
          setContainerWidth(newWidth);
          // Update cards based on width only for multi-card widgets
          if (isMultiCard) {
            setNoOfCards(newWidth >= MIN_COLUMN_WIDTH_FOR_2_CARDS ? 2 : 1);
          }
        }
      };

      updateWidth();
      window.addEventListener('resize', updateWidth);
      return () => window.removeEventListener('resize', updateWidth);
    } else {
      // For non-custom pages, set containerWidth based on number of cards
      const totalWidth = isMultiCard
        ? noOfCards === 1
          ? CARD_WIDTH_EXCLUDING_PADDING
          : DOUBLE_CARD_WIDTH_EXCLUDING_PADDING
        : CARD_WIDTH_EXCLUDING_PADDING;
      setContainerWidth(totalWidth);
    }
  }, [isCustomPage, isMultiCard, noOfCards]);

  const singleCardWidth = isCustomPage
    ? isMultiCard && noOfCards === 2
      ? containerWidth / 2
      : containerWidth
    : CARD_WIDTH_EXCLUDING_PADDING;

  return {
    containerWidth,
    noOfCards: isMultiCard ? noOfCards : 1, // Always return a number, defaulting to 1 for non-multi-card widgets
    singleCardWidth,
    widgetId,
    sectionRef,
  };
};
