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
import { DeviceTypeContextType } from '../../contextProviders/DeviceContextProvider';
import styles from './ALMDialog.module.css';

const borderRadiusClasses: {
  [key: string]: string;
} = {
  top: styles.almDialogBorderRadiusTop,
  bottom: styles.almDialogBorderRadiusBottom,
  left: styles.almDialogBorderRadiusLeft,
  right: styles.almDialogBorderRadiusRight,
  all: styles.almDialogBorderRadiusAll,
};

const directionClasses: {
  [key: string]: string;
} = {
  top: styles.almDialogTop,
  bottom: styles.almDialogBottom,
  left: styles.almDialogLeft,
  right: styles.almDialogRight,
  center: styles.almDialogCenter,
};

export const getBorderRadiusClass = (borderRadius: string) => {
  return borderRadiusClasses[borderRadius] || '';
};

export const getDirectionClass = (
  direction?: 'top' | 'bottom' | 'left' | 'right' | 'center',
  deviceContext?: DeviceTypeContextType
) => {
  if (direction) {
    return directionClasses[direction] || '';
  } else {
    if (deviceContext?.isDesktop || deviceContext?.isTablet) {
      return styles.almDialogCenter;
    } else {
      return styles.almDialogBottom;
    }
  }
};

export const getAnimationClass = (
  direction?: 'top' | 'bottom' | 'left' | 'right' | 'center',
  deviceContext?: DeviceTypeContextType,
  isClosing?: boolean
) => {
  isClosing = isClosing;
  if (direction) {
    const animationClasses: {
      [key: string]: string;
    } = {
      top: isClosing ? styles.slideOutToTop : styles.slideInFromTop,
      bottom: isClosing ? styles.slideOutToBottom : styles.slideInFromBottom,
      left: isClosing ? styles.slideOutToLeft : styles.slideInFromLeft,
      right: isClosing ? styles.slideOutToRight : styles.slideInFromRight,
      center: isClosing ? styles.fadeOut : styles.fadeIn,
    };

    return animationClasses[direction] || '';
  } else {
    if (deviceContext?.isDesktop || deviceContext?.isTablet) {
      return isClosing ? styles.fadeOut : styles.fadeIn;
    } else {
      return isClosing ? styles.slideOutToBottom : styles.slideInFromBottom;
    }
  }
};
