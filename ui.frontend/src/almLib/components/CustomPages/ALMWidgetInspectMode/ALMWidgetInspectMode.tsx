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
import styles from './ALMWidgetInspectMode.module.css';
import { NOT_APPLICABLE, PIXEL_SYMBOL } from '../../../utils/constants';
import { WidgetType } from '../../../utils/widgets/common';
import { GetTranslation } from '../../../utils/translationService';

interface ALMWidgetInspectModeProps {
  widget: any;
  widgetWidth: number | undefined;
  widgetHeight: number | undefined;
}

const getWidgetTypeMap = () =>
  new Map([
    [WidgetType.CATEGORY, GetTranslation('alm.widget.inspect.mode.categoriesWidget')],
    [
      WidgetType.COURSES_AND_PATHS,
      GetTranslation('alm.widget.inspect.mode.coursesAndPathsWidget', true),
    ],
    [WidgetType.MYLEARNING, GetTranslation('alm.widget.inspect.mode.myLearningWidget', true)],
    [WidgetType.SOCIAL, GetTranslation('alm.widget.inspect.mode.socialLearningWidget', true)],
    [WidgetType.COMPLIANCE, GetTranslation('alm.widget.inspect.mode.complianceWidget')],
    [WidgetType.GAMIFICATION, GetTranslation('alm.widget.inspect.mode.gamificationWidget')],
    [WidgetType.HTML_WIDGET, GetTranslation('alm.widget.inspect.mode.htmlWidget')],
    [
      WidgetType.CUSTOM_CONTENT_BOX,
      GetTranslation('alm.widget.inspect.mode.customContentBoxWidget'),
    ],
    [WidgetType.IFRAME, GetTranslation('alm.widget.inspect.mode.iframeWidget')],
    [WidgetType.CALENDAR, GetTranslation('alm.widget.inspect.mode.calendarWidget')],
  ]);

const getWidgetType = (widgetRef: any) => {
  const widgetTypeMap = getWidgetTypeMap();
  return widgetTypeMap.get(widgetRef);
};

const ALMWidgetInspectMode: React.FC<ALMWidgetInspectModeProps> = ({
  widget,
  widgetWidth,
  widgetHeight,
}) => {
  const widgetType = getWidgetType(widget.widgetRef);

  const renderWidgetDimension = (
    dimension: number | undefined,
    label: string,
    automationId: string
  ) => (
    <span className={styles.widgetDimensions} data-automationid={automationId}>
      {label}
      <span className={styles.widgetDimensionsValue}>
        {dimension ? dimension + PIXEL_SYMBOL : NOT_APPLICABLE}
      </span>
    </span>
  );

  return (
    <div>
      <div className={styles.tooltip}>
        <span className={styles.widgetType} data-automationid={`widget-type-${widgetType}`}>
          {widgetType}
        </span>
        {renderWidgetDimension(
          widgetHeight,
          GetTranslation('alm.widget.inspect.mode.widgetHeight'),
          `height-${widgetType}`
        )}
        {renderWidgetDimension(
          widgetWidth,
          GetTranslation('alm.widget.inspect.mode.widgetWidth'),
          `width-${widgetType}`
        )}
      </div>
      <div className={styles.widgetOverlay}></div>
    </div>
  );
};

ALMWidgetInspectMode.displayName = 'ALMWidgetInspectMode';

export default ALMWidgetInspectMode;
