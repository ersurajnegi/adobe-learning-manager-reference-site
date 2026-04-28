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
import {
  AssetValue,
  CustomContentBoxWidgetAttributes,
  CustomWidget,
  ElementAlignmentValues,
} from '../../../models';
import styles from './ALMCustomContentBox.module.css';
import { GetTranslation } from '../../../utils/translationService';
import ALMWidgetInspectMode from '../../CustomPages/ALMWidgetInspectMode/ALMWidgetInspectMode';
import { useWidgetInspectMode } from '../../../hooks/customPages/useALMInspectMode';
import { useRef } from 'react';
import { useCustomPageContextProvider } from '../../../contextProviders/ALMCustomPageProvider';
import { EMPTY_STRING } from '../../../utils/constants';

interface ALMCustomContentBoxProps {
  widget: CustomWidget;
  assets?: {
    [key: string]: AssetValue;
  };
  disableLinks?: boolean;
}

const DEFAULT_TEXT_COLOR = '#ffffff';

const ALMCustomContentBox: React.FC<ALMCustomContentBoxProps> = ({
  widget,
  assets = {},
  disableLinks = false,
}) => {
  const { attributes } = widget;
  const {
    pageUrl,
    alignment = ElementAlignmentValues.LEFT,
    showGradient,
    height,
    bgColor,
    titleColor = DEFAULT_TEXT_COLOR,
    descriptionColor = DEFAULT_TEXT_COLOR,
  } = attributes as CustomContentBoxWidgetAttributes;
  const conatinerClass = `${styles.container} ${assets.backgroundImage?.contentUrl ? styles.hasImage : ''}`;

  const title = GetTranslation(`${widget.id}.title`);
  const description = GetTranslation(`${widget.id}.description`);
  const actionText = GetTranslation(`${widget.id}.actionText`);
  const titleId = `${widget.id}-title`;
  const descriptionId = `${widget.id}-description`;
  const widgetSectionRef = useRef<HTMLElement>(null);
  const { isInspectMode } = useCustomPageContextProvider();
  const { isHovered, widgetContainerWidth, widgetContainerHeight, changeHoverState } =
    useWidgetInspectMode({
      sectionRef: widgetSectionRef,
    });

  const altText = GetTranslation(`${widget.id}.backgroundAltText`) || '';
  return (
    <section
      ref={widgetSectionRef}
      id={widget.id}
      className={conatinerClass}
      style={{ height: `${height}px`, backgroundColor: bgColor }}
      onMouseEnter={changeHoverState}
      onMouseLeave={changeHoverState}
      data-skip-link-target={widget.id}
      tabIndex={-1}
      aria-labelledby={title ? titleId : EMPTY_STRING}
      aria-describedby={description ? descriptionId : EMPTY_STRING}
    >
      {isInspectMode && isHovered && (
        <ALMWidgetInspectMode
          widget={widget}
          widgetWidth={widgetContainerWidth}
          widgetHeight={widgetContainerHeight}
        />
      )}
      {assets.backgroundImage?.contentUrl && (
        <img
          src={assets.backgroundImage.contentUrl}
          alt={altText}
          className={styles.backgroundImage}
        />
      )}
      {showGradient && <div className={styles.gradient} />}
      <div className={`${styles.contents} ${styles[alignment]}`}>
        {title && (
          <h2 id={titleId} className={styles.title} style={{ color: titleColor }}>
            {title}
          </h2>
        )}
        {description && (
          <p id={descriptionId} className={styles.description} style={{ color: descriptionColor }}>
            {description}
          </p>
        )}
        {actionText && (
          <a
            href={pageUrl}
            target="_blank"
            rel="noreferrer"
            className={`almButton primary ${styles.buttonLink} ${disableLinks ? styles.disabled : ''}`}
            aria-disabled={disableLinks}
            tabIndex={disableLinks ? -1 : 0}
          >
            {actionText}
          </a>
        )}
      </div>
    </section>
  );
};

export default ALMCustomContentBox;
