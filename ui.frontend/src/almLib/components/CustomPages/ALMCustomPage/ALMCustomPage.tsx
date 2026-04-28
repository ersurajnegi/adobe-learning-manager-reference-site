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
import { useEffect, useRef, useState, useCallback } from 'react';
import { Column, CustomPageConfig, PrimePage, Row, WidgetMap } from '../../../models';
import ALMLayout from '../ALMLayout/ALMLayout';
import { CustomPageProvider } from '../../../contextProviders/ALMCustomPageProvider';
import ALMCustomWidgetRenderer from '../ALMCustomWidgetRenderer/ALMCustomWidgetRenderer';
import styles from './ALMCustomPage.module.css';
import { lightTheme, Provider, Switch } from '@adobe/react-spectrum';
import { useLoadMore } from '../../../hooks';
import { ALMWidgetLoader } from '../ALMWidgetLoader';
import { Options } from '../../../hooks/loadMore/useLoadMore';
import {
  setIsCustomPage,
  setupALMConfigEventListener,
  setupHTMLWidgetNavigationListener,
} from '../../../utils/widgets/utils';
import { getPreferredLocalizedMetadata, GetTranslation } from '../../../utils/translationService';
import { useUserContext } from '../../../contextProviders/userContextProvider';

import { PrimeEvent } from '../../../utils/widgets/common';
import { ALM, getALMObject, GetPrimeEmitEventLinks } from '../../../utils/global';
import { SendMessageToParent } from '../../../utils/widgets/base/EventHandlingBase';

const BATCH_SIZE = 4;
const LOAD_MORE_OPTIONS: Options = { threshold: 0.1 };

interface ALMCustomPageProps {
  pageConfig: CustomPageConfig;
  disableLinks?: boolean;
  pageData: PrimePage;
}

const ALMCustomPage: React.FC<ALMCustomPageProps> = ({
  pageConfig,
  pageData,
  disableLinks = false,
}) => {
  const { user } = useUserContext() || {};
  const [layout, setLayout] = useState<Row[]>([]);
  const [visibleRows, setVisibleRows] = useState<Row[]>([]);
  const loaderContainerRef = useRef<HTMLDivElement>(null);
  const [isInspectMode, setIsInspectMode] = useState(false);

  useEffect(() => {
    const desktopLayout = pageConfig.desktop || [];
    setLayout(desktopLayout);
    setVisibleRows(desktopLayout.slice(0, BATCH_SIZE));
    setIsCustomPage(true);
    return () => setIsCustomPage(false);
  }, [pageConfig]);

  useEffect(() => {
    const pageTitle =
      getPreferredLocalizedMetadata(pageData.localizedMetadata!, user?.uiLocale) || {};
    SendMessageToParent(
      { type: PrimeEvent.ALM_PAGE_TITLE_UPDATE, title: pageTitle.name },
      GetPrimeEmitEventLinks()
    );
  }, [pageData.localizedMetadata, user?.uiLocale]);

  useEffect(() => {
    const cleanupConfig = setupALMConfigEventListener(pageConfig.widgets || {});
    const cleanupNavigation = setupHTMLWidgetNavigationListener(pageConfig.widgets || {});

    return () => {
      cleanupConfig();
      cleanupNavigation();
    };
  }, []);

  useEffect(() => {
    const almObject = getALMObject() as ALM;
    almObject &&
      almObject.sendCustomPageSkipLinks &&
      almObject.sendCustomPageSkipLinks(visibleRows, pageConfig);
  }, [pageConfig, visibleRows]);

  useEffect(() => {
    const keydownShortcuts = (event: KeyboardEvent) => {
      const isAltPressed = event.altKey;
      const keyCode = event.which || event.keyCode;
      if (isAltPressed && keyCode >= 49 && keyCode <= 52) {
        event.preventDefault();
        SendMessageToParent(
          { type: PrimeEvent.KEYBOARD_SHORTCUTS, key: keyCode },
          GetPrimeEmitEventLinks()
        );
      }
    };

    document.addEventListener('keydown', keydownShortcuts);

    return () => {
      document.removeEventListener('keydown', keydownShortcuts);
    };
  }, []);

  const loadMore = useCallback(() => {
    setVisibleRows(prev => {
      const nextRows = layout.slice(prev.length, prev.length + BATCH_SIZE);
      return [...prev, ...nextRows];
    });
  }, [layout]);

  useLoadMore({
    items: layout,
    callback: loadMore,
    elementRef: loaderContainerRef,
    options: LOAD_MORE_OPTIONS,
  });

  const renderWidget = useCallback(
    (column: Column, widgets: WidgetMap) => (
      <ALMCustomWidgetRenderer column={column} widgets={widgets} />
    ),
    []
  );

  if (layout.length === 0) return null;

  const pageId = `page-${pageConfig.pageId}`;
  const isWidgetInCustomPage = layout.length > 0;

  return (
    <Provider theme={lightTheme} colorScheme={'light'}>
      <CustomPageProvider value={{ pageConfig, renderWidget, disableLinks, isInspectMode }}>
        {disableLinks && isWidgetInCustomPage && (
          <div className={styles.toggleContainer} data-automationid={`inspect-mode-toggle`}>
            <span className={styles.toggleLabel}>
              {GetTranslation('alm.widget.inspect.mode.inspectMode')}
            </span>
            <Switch
              isSelected={isInspectMode}
              onChange={setIsInspectMode}
              UNSAFE_className={styles.customSwitch}
              isEmphasized={true}
              data-automationid={`inspect-mode-toggle-switch`}
            />
            <span className={styles.toggleText} data-automationid={`inspect-mode-toggle-text`}>
              {isInspectMode
                ? GetTranslation('alm.widget.inspect.mode.on')
                : GetTranslation('alm.widget.inspect.mode.off')}
            </span>
          </div>
        )}
        <div id={pageId}>
          <ALMLayout layout={visibleRows} />
          {visibleRows.length < layout.length && (
            <div ref={loaderContainerRef} className="relative">
              <ALMWidgetLoader />
            </div>
          )}
        </div>
      </CustomPageProvider>
    </Provider>
  );
};

export default ALMCustomPage;
