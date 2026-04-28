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
import { useCallback, useEffect, useRef, useState } from 'react';
import { CARD_WIDTH, CARD_WIDTH_EXCLUDING_PADDING, ZERO } from '../../../utils/widgets/common';
import { CategorySource, CategoryWidgetAttributes, CustomWidget } from '../../../models';
import styles from './ALMCategoryWidget.module.css';
import { GetTranslation } from '../../../utils/translationService';
import { useALMCategoryWidget } from '../../../hooks/customPages/useALMCategoryWidget';
import { ALMCategoryCard } from '../ALMCategoryCard';
import ALMStripWidgetHeader from '../ALMStripWidgetHeader/ALMStripWidgetHeader';
import { useStripScroll } from '../../../hooks/customPages/useStripScroll';
import ALMNoAccessContainer from '../ALMNoAccessContainer/ALMNoAccessContainer';
import ALMWidgetInspectMode from '../ALMWidgetInspectMode/ALMWidgetInspectMode';
import { useWidgetInspectMode } from '../../../hooks/customPages/useALMInspectMode';
import { ALMWidgetLoader } from '../ALMWidgetLoader';

const ALMCategoryWidget: React.FC<{
  widget: CustomWidget;
  disableLinks?: boolean;
  isInspectMode?: boolean;
}> = ({ widget, disableLinks, isInspectMode = false }) => {
  const { fetchingData, items, fetchMore, searchString } = useALMCategoryWidget(widget as any);

  const heading = GetTranslation(`${widget.id}.title`) || widget.attributes?.title || '';
  const widgetDescription =
    GetTranslation(`${widget.id}.description`) || widget.attributes?.description || '';
  const nameId = `cb-name-${widget.id}`;
  const cardContainerId = `cb-cardHolder-${heading}`;

  const {
    rollContainer,
    onScroll,
    rollAPage,
    isLeftNavIconDisabled,
    isRightNavIconDisabled,
    updateItemsPerPage,
    itemsPerPage,
  } = useStripScroll({
    cardWidth: CARD_WIDTH,
    items,
    fetchingData,
    fetchMore,
    searchString,
  });

  const widgetsectionRef = useRef<HTMLElement>(null);
  const hasWidgetItems = items?.length > 0;
  const showNavIcons = items?.length > itemsPerPage;
  const { isHovered, widgetContainerWidth, widgetContainerHeight, changeHoverState } =
    useWidgetInspectMode({
      sectionRef: widgetsectionRef,
    });

  useEffect(() => {
    if (items.length < itemsPerPage * 2) {
      fetchMore(searchString);
    }
  }, [items]);

  const rowTemplate = useCallback((items: any) => {
    return (
      <div className={styles.stripCardContainerRow}>
        <ul className={styles.cardRow}>
          {items.map((item: any, idx: number) => {
            return (
              <li key={`${item.id}_${widget.widgetRef}`} data-index={idx}>
                <div className={`${styles.loCard} ${styles.catalogCard}`}>
                  {getItemTemplate(item, idx)}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }, []);

  const getItemTemplate = (item: any, index: number) => {
    const attributes = widget.attributes as CategoryWidgetAttributes;
    const hideImage = !attributes?.showImage;
    const hideDescription = !attributes?.showDescription;

    return (
      <ALMCategoryCard
        item={item}
        index={index}
        source={attributes?.source as CategorySource}
        hideDescription={hideDescription}
        hideImage={hideImage}
        disableLinks={disableLinks}
      />
    );
  };

  useEffect(() => {
    const noCardsWithGap = widgetContainerWidth
      ? Math.floor(widgetContainerWidth / CARD_WIDTH)
      : ZERO;
    const cardWithoutGap = widgetContainerWidth
      ? Math.floor(
          (widgetContainerWidth - noCardsWithGap * CARD_WIDTH) / CARD_WIDTH_EXCLUDING_PADDING
        )
      : ZERO;
    updateItemsPerPage({
      itemsPerPage: widgetContainerWidth ? noCardsWithGap + cardWithoutGap : ZERO,
    });
  }, [widgetContainerWidth]);

  const renderContent = () => {
    if (hasWidgetItems) {
      return rowTemplate(items);
    }
    if (fetchingData) {
      return (
        <div className={styles.loadingContainerSection}>
          <ALMWidgetLoader />
        </div>
      );
    }
    return <ALMNoAccessContainer />;
  };

  return (
    <section
      ref={widgetsectionRef}
      aria-labelledby={nameId}
      id={widget.id}
      className={styles.container}
      onMouseEnter={changeHoverState}
      onMouseLeave={changeHoverState}
    >
      {isInspectMode && isHovered && (
        <ALMWidgetInspectMode
          widget={widget}
          widgetWidth={widgetContainerWidth}
          widgetHeight={widgetContainerHeight}
        />
      )}
      <ALMStripWidgetHeader
        heading={heading}
        widgetId={widget.id}
        widgetDescription={widgetDescription}
        isLeftNavIconDisabled={isLeftNavIconDisabled()}
        isRightNavIconDisabled={isRightNavIconDisabled()}
        rollAPage={rollAPage}
        showNavIcons={showNavIcons}
      />
      <div
        id={cardContainerId}
        data-automationid={cardContainerId}
        className={styles.stripCardContainer}
        tabIndex={-1}
        ref={rollContainer}
        onScroll={onScroll}
      >
        {renderContent()}
      </div>
    </section>
  );
};

export default ALMCategoryWidget;
