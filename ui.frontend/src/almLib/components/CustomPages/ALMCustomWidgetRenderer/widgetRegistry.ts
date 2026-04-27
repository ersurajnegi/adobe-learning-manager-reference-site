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
import React from 'react';
import { CustomWidget } from '../../../models';
import { WidgetType } from '../../../utils/widgets/common';
import { ALMCustomContentBox } from '../../Widgets/ALMCustomContentBox';
import { ALMCategoryWidget } from '../ALMCategoryWidget';
import ALMHtmlWidget from '../ALMHtmlWidget/ALMHtmlWidget';
import ALMCoursePathWidget from '../ALMCoursePathWidget/ALMCoursePathWidget';
import ALMIframeWidget from '../ALMIframeWidget/ALMIframeWidget';
import { ALMSocialLearning } from '../../Widgets/ALMSocialLearningWidget';
import CalendarWidget from '../../CalendarWidget/CalendarWidget';
import { ALMLeaderboard } from '../../Widgets/ALMLeaderboard';
import { ALMCompliance } from '../../Widgets/ALMComplianceWidget';

/**
 * Props interface for widget components
 */
export interface WidgetComponentProps {
  widget: CustomWidget;
  assets: Record<string, unknown>;
  disableLinks: boolean;
  isInspectMode: boolean;
}

export type WidgetComponentType = React.ComponentType<WidgetComponentProps>;

/**
 * Interface for the widget registry
 */
export interface WidgetRegistry {
  registerWidget(type: WidgetType, component: WidgetComponentType): void;
  getWidget(type: WidgetType): WidgetComponentType | undefined;
}

/**
 * Implementation of the widget registry
 */
class WidgetRegistryImpl implements WidgetRegistry {
  private static instance: WidgetRegistryImpl;
  private widgets: Map<WidgetType, WidgetComponentType> = new Map();

  private constructor() {}

  /**
   * Get the singleton instance of the widget registry
   */
  public static getInstance(): WidgetRegistryImpl {
    if (!WidgetRegistryImpl.instance) {
      WidgetRegistryImpl.instance = new WidgetRegistryImpl();
    }
    return WidgetRegistryImpl.instance;
  }

  registerWidget(type: WidgetType, component: WidgetComponentType): void {
    this.widgets.set(type, component);
  }

  getWidget(type: WidgetType): WidgetComponentType | undefined {
    const widget = this.widgets.get(type);
    if (!widget) {
      console.warn(`Widget type ${type} not found, using default widget`);
      return;
    }
    return widget;
  }
}

// Create and initialize the singleton instance
const widgetRegistry = WidgetRegistryImpl.getInstance();

// Register default widgets
widgetRegistry.registerWidget(WidgetType.HTML_WIDGET, ALMHtmlWidget as WidgetComponentType);
widgetRegistry.registerWidget(
  WidgetType.CUSTOM_CONTENT_BOX,
  ALMCustomContentBox as WidgetComponentType
);
widgetRegistry.registerWidget(WidgetType.CATEGORY, ALMCategoryWidget as WidgetComponentType);
widgetRegistry.registerWidget(
  WidgetType.COURSES_AND_PATHS,
  ALMCoursePathWidget as WidgetComponentType
);
widgetRegistry.registerWidget(WidgetType.IFRAME, ALMIframeWidget as WidgetComponentType);
widgetRegistry.registerWidget(WidgetType.CALENDAR, CalendarWidget as WidgetComponentType);
widgetRegistry.registerWidget(WidgetType.COMPLIANCE, ALMCompliance as WidgetComponentType);
widgetRegistry.registerWidget(WidgetType.SOCIAL, ALMSocialLearning as WidgetComponentType);
widgetRegistry.registerWidget(WidgetType.LEADERBOARD, ALMLeaderboard as WidgetComponentType);
widgetRegistry.registerWidget(WidgetType.MYLEARNING, ALMCoursePathWidget as WidgetComponentType);
export { widgetRegistry };
