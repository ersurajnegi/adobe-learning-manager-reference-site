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
import React, { useMemo } from 'react';
import { useCustomPageContextProvider } from '../../../contextProviders/ALMCustomPageProvider';
import { Column, WidgetMap, CustomWidget } from '../../../models';
import { withSuspense } from '../../Portal/portal';
import { widgetRegistry } from './widgetRegistry';
import { WidgetType } from '../../../utils/widgets/common';

interface ALMCustomWidgetRendererProps {
  column: Column;
  widgets: WidgetMap;
}

const handleError = (errorMessage: string, error?: unknown) => {
  console.error(errorMessage, error);
  return null;
};

const ALMCustomWidgetRenderer: React.FC<ALMCustomWidgetRendererProps> = ({ column, widgets }) => {
  const { pageConfig, disableLinks, isInspectMode } = useCustomPageContextProvider();
  const { widgetId, id } = column;

  const componentProps = useMemo(() => {
    if (!widgetId || !widgets) {
      return handleError(`Missing widgetId or widgets for column: ${id}`);
    }
    return widgets[widgetId];
  }, [widgetId, widgets, id]);

  const component = useMemo(() => {
    if (!componentProps) {
      return handleError(`No component props found for column: ${id}`);
    }
    const component = widgetRegistry.getWidget(componentProps.widgetRef as WidgetType);
    if (!component) {
      return handleError(`Unsupported component type: ${componentProps.widgetRef}`);
    }
    return component;
  }, [componentProps, id]);

  const assets = pageConfig.assets?.[componentProps?.id || ''] || {};

  try {
    if (!component) {
      return component;
    }
    return withSuspense(component)({
      widget: componentProps as CustomWidget,
      assets,
      disableLinks,
      isInspectMode,
    });
  } catch (error) {
    return handleError(`Error rendering component ${widgetId}:`, error);
  }
};

export default React.memo(ALMCustomWidgetRenderer);
