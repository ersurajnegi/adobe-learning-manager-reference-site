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
import { useRef, useMemo, useState } from 'react';
import { CustomWidget, HTMLWidgetAttributes } from '../../../models';
import { useStyleInjection } from '../../../hooks/widgets/useStyleInjection';
import { useScriptExecution } from '../../../hooks/widgets/useScriptExecution';
// @ts-ignore
import DOMPurify from 'dompurify';
import ALMWidgetInspectMode from '../ALMWidgetInspectMode/ALMWidgetInspectMode';
import styles from './ALMHtmlWidget.module.css';
import { useWidgetInspectMode } from '../../../hooks/customPages/useALMInspectMode';

type ALMHtmlWidgetProps = {
  widget: CustomWidget;
  isInspectMode?: boolean;
};

const ALMHtmlWidget: React.FC<ALMHtmlWidgetProps> = ({ widget, isInspectMode = false }) => {
  const {
    html = '',
    css = '',
    javascript = '',
  } = (widget.attributes || {}) as HTMLWidgetAttributes;
  const hostRef = useRef<HTMLDivElement>(null);
  const widgetSectionRef = useRef<HTMLDivElement>(null);
  const { isHovered, widgetContainerWidth, widgetContainerHeight, changeHoverState } =
    useWidgetInspectMode({
      sectionRef: widgetSectionRef,
    });

  const sanitizedHtml = useMemo(() => DOMPurify.sanitize(html), [html]);
  useStyleInjection(css, widget.id);
  useScriptExecution(javascript, widget.id);

  return (
    <section
      ref={widgetSectionRef}
      className={styles.htmlSection}
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
      <div ref={hostRef} id={widget.id} dangerouslySetInnerHTML={{ __html: sanitizedHtml }}></div>
    </section>
  );
};

export default ALMHtmlWidget;
