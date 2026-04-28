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
import { EXTERNAL_FONT_FACE, STYLE_SHEET } from '../../utils/constants';
import { SendMessageToParent } from '../../utils/widgets/base/EventHandlingBase';
import { GetPrimeEmitEventLinks } from '../../utils/global';
import { PrimeEvent } from '../../utils/widgets/common';
import { GetTranslation } from '../../utils/translationService';

const STYLE = 'style';
const BODY = 'body';
const LINK = 'link';

export const getCssFromParentFrame = (label: string, append = false) => {
  const stylesheets = document.styleSheets;
  const cssText = [];
  for (let sheet of stylesheets) {
    if ((sheet.ownerNode as any).tagName.toLowerCase() === STYLE) {
      for (const rule of sheet.cssRules) {
        if (rule.cssText.includes(label)) {
          if (!append) {
            return rule.cssText;
          } else {
            cssText.push(rule.cssText);
          }
        }
      }
    }
  }
  return append ? cssText.join(' ') : '';
};

export const getExternalSkillFrameCss = (element: any) => {
  return `
    ${getCssFromParentFrame(':root {')}
    ${getCssFromParentFrame('@font-face', true)}
    ${getCssFromParentFrame('@import', true)}

    canvas {
      display: block;
      margin-left: 5px;
    }

    .${element.selectedSkills} {
      margin-top: 30px;
      display: block;
      padding-left: 20px;
      padding-top: 20px;
      border: solid 2px var(--prime-color-black);
      font-size: var(--prime-font-size-14);
    }

    .${element.selectedSkillsHeading} {
      width: 350px;
      height: 22px;
      font-size: var(--prime-font-size-18);
      font-weight: 500;
      font-stretch: normal;
      font-style: normal;
      line-height: 1.38;
      letter-spacing: normal;
      color: var(--prime-color-black);
      margin-right: 18px;
      margin-bottom: 20px;
    }

    .${element.selectedSkillsArea} {
      display: flex;
      flex-wrap: wrap;
      margin-bottom: 20px;
    }

    .${element.selectedSkill}:hover {
      cursor: pointer;
    }

    .${element.showScrollbar} {
      overflow-y: scroll;
      scrollbar-color: var(--prime-color-neutral-3) var(--prime-color-neutral-1);
      scrollbar-width: thin;
    }

    .${element.accountSpecificCheckbox}[type="checkbox"] {
      background-color: transparent;
      border: solid var(--prime-color-black) 1px;
      appearance: none;
      -webkit-appearance: none;
      -moz-appearance: none;
      vertical-align: middle;
      width: 16px;
      height: 16px;
    }

    .${element.accountSpecificCheckbox}[type="checkbox"]:checked {
      background-color: var(--prime-color-primary);
      background: var(--prime-color-primary) url("data:image/gif;base64,R0lGODlhCwAKAIABAP////3cnSH5BAEKAAEALAAAAAALAAoAAAIUjH+AC73WHIsw0UCjglraO20PNhYAOw==") 2px 2px no-repeat;
    }

    .${element.selectedSkill} {
      border-radius: 4px;
      border: solid 1px var(--prime-color-body);
      margin: 0 14px 14px 0;
      display: flex;
      flex-direction: row;
      font-size: var(--prime-font-size-14);
      background: var(--prime-color-white);
      padding: 7px 10px;
      align-items: center;
    }

    .${element.emptyMessage} {
      padding-bottom: 80px;
    }

    .${element.closeButton} {
      background: transparent;
      cursor: pointer;
      border: none;
      width: 24px;
      height: 24px;
      min-width: 24px;
      min-height: 24px;
      padding: 0;
      align-items: center;
      justify-content: center;
      display: flex;
      margin-left: 10px;
      margin-left: 5px;
      outline: none;
    }
    .${element.closeButton} svg {
      width: 14px;
      height: 14px;
      display: block;
      pointer-events: none;
      fill: currentColor;
    }

    .${element.closeButton}:hover {
      cursor: pointer;
    }

    .${element.selectedSkillsActions} {
      margin-top: 5px;
    }

    .${element.remove} {
      padding-left: 5px;
    }

    .${element.topOptions} {
      margin-top: 3px;
      margin-bottom: 16px;
      font-size: var(--prime-font-size-14);
      text-align: center;
      height: 32px;
    }

    .${element.checkboxRow} {
      display: flex;
      width: 80%;
    }

    .${element.search} {
      font-size: var(--prime-font-size-16);
      position: relative;
      float: left;
    }

    .${element.searchLoader} {
      margin-top: 20px;
      left: 48%;
      position: absolute;
      background-size: contain;
      height: 16px;
      width: 16px;
      background-color: transparent;
      visibility: visible;
    }

    .${element.graphHeading} {
      margin-right: 140px;
      font-weight: 600;
      font-size: var(--prime-font-size-16);
      display: flex;
      align-items: center;
      height: 32px;
      justify-content: center;
    }

    @media(max-width:767px) {
      .${element.graphHeading} {
       display: none;
      }
      .${element.search}, .${element.skillInput} {
        width: 100%;
      }
      .${element.emptyMessage} {
        padding-bottom: 20px;
      }
    }

    .${element.skillInput} {
      padding: 7px 10px;
      font-size: var(--prime-font-size-14);
      border-radius: 4px;
      border: 1px solid rgb(86, 86, 86);
      height: 32px;
    }

    .${element.typeahead} {
      position: absolute;
      z-index: 1000;
      background: var(--prime-color-white);
      border: solid 2px var(--prime-color-primary);
      min-height: 50px;
      width: 100%;
      text-align: left;
    }

    .${element.suggestion},
    .${element.noSuggestion} {
      padding: 10px;
    }

    .${element.suggestion}:hover {
      background-color: var(--prime-color-primary);
      color: var(--prime-color-white);
      cursor: pointer;
    }

    .${element.active} {
      background-color: var(--prime-color-primary);
      color: var(--prime-color-white);
      cursor: pointer;
    }

    .${element.setting} {
      font-size: var(--prime-font-size-14);
      margin-left: 5px;
    }

    .${element.loader} {
      border: 7px solid var(--prime-color-neutral-4);
      border-radius: 50%;
      border-top: 7px solid var(--prime-color-primary);
      width: 25px;
      height: 25px;
      -webkit-animation: spin 1s linear infinite; /* Safari */
      animation: spin 1s linear infinite;
      margin-top: 190px;
      justify-content: center;
      z-index: 5;
      position: absolute;
      left: 50%;
      visibility: hidden;
    }

    .${element.visible} {
      visibility: visible;
    }

    .${element.resetGraph} {
      position: absolute;
      z-index: 10;
      margin-top: -34px;
      right: 20px;
      background-color: var(--prime-color-neutral-1);
      fill: var(--prime-color-white);
    }

    .${element.resetGraph}:hover {
      cursor: pointer;
    }

    .${element.graphArea} {
      margin-bottom: 10px;
    }

    .${element.displayNone} {
      display: none;
    }

    /* Safari */
    @-webkit-keyframes spin {
      0% {
        -webkit-transform: rotate(0deg);
      }
      100% {
        -webkit-transform: rotate(360deg);
      }
    }

    @keyframes spin {
      0% {
        transform: rotate(0deg);
      }
      100% {
        transform: rotate(360deg);
      }
    }
    `;
};

export const getAttrStyle = (attr: string) => {
  const element = document.getElementsByTagName(attr)[0];
  return element.getAttribute(STYLE);
};

export const addBodyStyles = (iframeDoc: any) => {
  const element = document.getElementsByTagName(BODY)[0] as any;
  for (let i = 0; i < element.style.length; i++) {
    const styleName = element.style[i];
    const styleValue = element.style[styleName];
    iframeDoc.body.style[styleName] = styleValue;
  }
};

export const addExternalFontLink = (iframeDoc: any) => {
  const linkElement = document.createElement(LINK);
  const link = document.head.querySelectorAll(EXTERNAL_FONT_FACE)[0];
  if (link) {
    Array.from(link.attributes).forEach(attr => {
      linkElement.setAttribute(attr.name, attr.value);
    });
    iframeDoc.head.appendChild(linkElement);
  }
};

export const addExternalSkillFrameCss = (iframeDoc: any, styles: any) => {
  const styleElement = document.createElement(STYLE);
  styleElement.textContent = getExternalSkillFrameCss(styles);
  iframeDoc.head.appendChild(styleElement);
};

export const copyStyleSheetsToChildFrame = (iframeDoc: any) => {
  const linkTags = document.head.querySelectorAll(`${LINK}[rel="${STYLE_SHEET}"]`);
  linkTags.forEach((link: any) => {
    const newLink = document.createElement(LINK);
    newLink.rel = STYLE_SHEET;
    newLink.href = link.href;
    iframeDoc.head.appendChild(newLink);
  });
};

/**
 * Sends skip navigation links to parent Ember application
 * @param isPrlEnabled - Whether PRL (recommendation) is enabled
 * @param hasItems - Whether user has skill interests
 */
export const sendSkillsSkipLinks = (isPrlEnabled: boolean, hasItems: boolean) => {
  const skipLinks: Array<{ elementId: string; label: string; widgetRef: string }> = [];

  // Main skills section (always visible)
  skipLinks.push({
    elementId: 'skills-section',
    label: GetTranslation(
      isPrlEnabled ? 'alm.text.recommendation' : 'alm.community.board.skills',
      true
    ),
    widgetRef: 'com.adobe.captivateprime.primeskills',
  });

  // Interests section (only if items exist and PRL is enabled)
  if (hasItems && isPrlEnabled) {
    skipLinks.push({
      elementId: 'interests-section',
      label: GetTranslation('alm.community.board.skills', true),
      widgetRef: 'com.adobe.captivateprime.skills.interests',
    });
  }

  SendMessageToParent(
    { type: PrimeEvent.ALM_SKIP_LINKS, widgets: skipLinks },
    GetPrimeEmitEventLinks()
  );
};
