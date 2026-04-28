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
/* eslint-disable jsx-a11y/iframe-has-title */
import { useCustomPageContextProvider } from '../../../contextProviders/ALMCustomPageProvider';
import { useUserContext } from '../../../contextProviders/userContextProvider';
import { CustomWidget, IframeWidgetAttributes, PrimeAccount } from '../../../models';
import { getALMConfig, getALMObject, getTokenForNativeExtensions } from '../../../utils/global';
import ALMWidgetInspectMode from '../ALMWidgetInspectMode/ALMWidgetInspectMode';
import styles from './ALMIframeWidget.module.css';
import { useMemo, useRef, useState } from 'react';
import { useWidgetInspectMode } from '../../../hooks/customPages/useALMInspectMode';

interface ALMIframeWidgetProps {
  widget: CustomWidget;
  disableLinks?: boolean;
  isInspectMode?: boolean;
}

const ALMIframeWidget: React.FC<ALMIframeWidgetProps> = ({ widget, isInspectMode = false }) => {
  const { user } = useUserContext() || {};
  const account = user.account as PrimeAccount;
  const { attributes } = widget;
  const { url, height } = attributes as IframeWidgetAttributes;
  const config = getALMConfig();
  const widgetSectionRef = useRef<HTMLElement>(null);
  const { isHovered, widgetContainerWidth, widgetContainerHeight, changeHoverState } =
    useWidgetInspectMode({
      sectionRef: widgetSectionRef,
    });

  const iframeUrl = useMemo(() => {
    if (!url) {
      return '';
    }
    try {
      const isLoggedIn = getALMObject().isPrimeUserLoggedIn();
      const urlWithParams = new URL(url);
      if (isLoggedIn) {
        urlWithParams.searchParams.append('userId', user.id || '');
        urlWithParams.searchParams.append('authToken', getTokenForNativeExtensions() || '');
      }
      urlWithParams.searchParams.append('accountId', account.id || '');
      urlWithParams.searchParams.append('locale', config.locale || '');
      return urlWithParams.toString();
    } catch (error) {
      console.error('Error constructing iframe URL:', error);
      return '';
    }
  }, [url]);

  return (
    <section
      id={widget.id}
      ref={widgetSectionRef}
      className={styles.container}
      style={{ height: `${height}px` }}
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
      <iframe src={iframeUrl} className={styles.iframe} />
    </section>
  );
};

export default ALMIframeWidget;
