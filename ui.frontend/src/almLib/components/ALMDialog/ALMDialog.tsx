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
import React, { useState, useEffect } from 'react';
import { useDialog } from '../../contextProviders/ALMDialogContextProvider';
import { Content, Flex, View } from '@adobe/react-spectrum';
import styles from './ALMDialog.module.css';
import { useDeviceTypeContext } from '../../contextProviders/DeviceContextProvider';
import { getBorderRadiusClass, getDirectionClass, getAnimationClass } from './ALMDialogHelper';

interface ALMDialogProps {
  id: string;
  direction?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  height?: number;
  stickyPosition?: boolean;
  overlayClose?: boolean;
  borderRadius?: 'top' | 'bottom' | 'left' | 'right' | 'all';
  children: React.ReactNode;
}

interface ALMDialogFooterProps {
  align?: 'left' | 'center' | 'right';
}

export const ALMDialog: React.FC<ALMDialogProps> = ({
  id,
  direction,
  height,
  stickyPosition = false,
  overlayClose = true,
  borderRadius = 'all',
  children,
}) => {
  const deviceContext = useDeviceTypeContext();
  const { isOpen, closeDialog } = useDialog();
  const [isClosing, setIsClosing] = useState(false);
  const savedScrollPositionRef = React.useRef<number>(0);

  useEffect(() => {
    if (!isOpen(id)) {
      setIsClosing(true);
      setTimeout(() => setIsClosing(false), 300); // Match the animation duration
    }
  }, [isOpen(id)]);

  useEffect(() => {
    if (isOpen(id)) {
      savedScrollPositionRef.current = window.scrollY;
      document.body.style.top = `-${savedScrollPositionRef.current}px`;
      document.body.classList.add(styles.noScroll);
    }

    return () => {
      if (savedScrollPositionRef.current !== undefined) {
        document.body.classList.remove(styles.noScroll);
        document.body.style.top = '';
        window.scrollTo(0, savedScrollPositionRef.current);
      }
    };
  }, [isOpen(id)]);

  if (!isOpen(id) && !isClosing) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (overlayClose) {
      closeDialog(id);
    }
  };

  const borderRadiusClass = getBorderRadiusClass(borderRadius);
  const directionClass = getDirectionClass(direction, deviceContext);
  const animationClass = getAnimationClass(direction, deviceContext, isClosing);

  return (
    <div className={styles.almDialogOverlay} onClick={handleOverlayClick}>
      <div
        className={`${styles.almDialog} ${directionClass} ${borderRadiusClass} ${animationClass}`}
        style={{
          minHeight: `${height ? height : ''}vh`,
          maxHeight: `${height ? height : 50}vh`,
          position: stickyPosition ? 'sticky' : 'relative',
        }}
        onClick={e => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};

export const ALMDialogHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <View UNSAFE_className={styles.almDialogHeader}>
      <div className={styles.almDialogNotch}></div>
      {children}
    </View>
  );
};

export const ALMDialogContent: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Content UNSAFE_className={styles.almDialogContent}>{children}</Content>
);

export const ALMDialogFooter: React.FC<ALMDialogFooterProps> = ({ children, align }) => {
  const deviceContext = useDeviceTypeContext();
  return (
    <Flex
      direction="row"
      justifyContent={align || (deviceContext.isMobile ? 'space-around' : 'right')}
      UNSAFE_className={styles.almDialogFooter}
    >
      {children}
    </Flex>
  );
};
