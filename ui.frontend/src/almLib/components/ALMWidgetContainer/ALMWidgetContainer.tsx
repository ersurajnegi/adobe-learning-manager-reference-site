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
import React, { useEffect, useMemo } from 'react';
import { CustomWidget } from '../../models';
import { Portal } from '../Portal';
import { widgetRegistry } from './widgetRegistry';
import { WidgetType, WIDGET_REF_TO_TYPE, WidgetTypeNew } from '../../utils/widgets/common';
import { setIsCustomPage } from '../../utils/widgets/utils';
import { Provider, lightTheme } from '@adobe/react-spectrum';
import { handleCommaSeparatedValues } from './almWidgetUtils';

export interface ALMWidgetProps {
  widgetId: string;
  widgetRef: string;
  params: any;
}

interface ALMWidgetContainerProps {
  container: HTMLElement;
  widgetProps: ALMWidgetProps;
}

const handleError = (errorMessage: string, error?: unknown) => {
  console.error(errorMessage, error);
  return null;
};

const ALMWidgetContainer: React.FC<ALMWidgetContainerProps> = ({ container, widgetProps }) => {
  useEffect(() => {
    setIsCustomPage(true);
    return () => setIsCustomPage(false);
  }, []);

  const component = useMemo(() => {
    if (!widgetProps || !widgetProps.widgetRef || !widgetProps.widgetId) {
      return handleError(`No props found for component`);
    }
    const component = widgetRegistry.getWidget(widgetProps.widgetRef as WidgetType);
    if (!component) {
      return handleError(`Unsupported component type: ${widgetProps.widgetRef}`);
    }
    return component;
  }, [widgetProps]);

  try {
    if (!component) {
      handleError(
        `No registered component found for ref: ${widgetProps.widgetRef} id: ${widgetProps.widgetId}`
      );
      return component;
    }

    const componentProps: CustomWidget = {
      id: widgetProps.widgetId,
      widgetRef: widgetProps.widgetRef,
      type: (WIDGET_REF_TO_TYPE as { [key: string]: WidgetTypeNew })[widgetProps.widgetRef],
      attributes: handleCommaSeparatedValues(widgetProps.widgetRef, widgetProps.params || {}),
    };

    return (
      <Portal key={`alm-widget-container-${widgetProps.widgetId}`} selector={container}>
        <Provider theme={lightTheme} colorScheme={'light'}>
          {component({
            widget: componentProps,
          })}
        </Provider>
      </Portal>
    );
  } catch (error) {
    return handleError(`Error rendering component ${widgetProps.widgetId}:`, error);
  }
};

export default React.memo(ALMWidgetContainer);
