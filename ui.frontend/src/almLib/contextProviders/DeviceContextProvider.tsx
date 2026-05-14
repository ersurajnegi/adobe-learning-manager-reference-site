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
import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { BREAKPOINTS } from '../utils/constants';
import { debounce } from '../utils/catalog';

// Define the shape of the device type context
export interface DeviceTypeContextType {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  screenWidth: number;
}

// Create the context with a default value
const DeviceTypeContext = createContext<DeviceTypeContextType>({
  isMobile: false,
  isTablet: false,
  isDesktop: true,
  screenWidth: 0,
});

// Create a provider component
interface DeviceTypeProviderProps {
  children: ReactNode;
  // Optional custom breakpoints
  mobileBreakpoint?: number;
  tabletBreakpoint?: number;
}

export const DeviceTypeProvider: React.FC<DeviceTypeProviderProps> = ({
  children,
  mobileBreakpoint = BREAKPOINTS.MOBILE,
  tabletBreakpoint = BREAKPOINTS.TABLET,
}) => {
  const [deviceType, setDeviceType] = useState<DeviceTypeContextType>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    screenWidth: window.innerWidth,
  });

  useEffect(() => {
    const checkDeviceType = () => {
      const width = window.innerWidth;

      setDeviceType({
        isMobile: width < mobileBreakpoint,
        isTablet: width >= mobileBreakpoint && width <= tabletBreakpoint,
        isDesktop: width > tabletBreakpoint,
        screenWidth: width,
      });
    };

    // Initial check
    checkDeviceType();

    // Add event listener for window resize
    const debouncedCheckDeviceType = debounce(checkDeviceType, 100);
    window.addEventListener('resize', debouncedCheckDeviceType);

    // Cleanup event listener
    return () => {
      window.removeEventListener('resize', debouncedCheckDeviceType);
    };
  }, [mobileBreakpoint, tabletBreakpoint]);

  return <DeviceTypeContext.Provider value={deviceType}>{children}</DeviceTypeContext.Provider>;
};

// Custom hook to use the device type context
export const useDeviceTypeContext = () => {
  const context = useContext(DeviceTypeContext);

  if (context === undefined) {
    throw new Error('useDeviceType must be used within a DeviceTypeProvider');
  }

  return context;
};
