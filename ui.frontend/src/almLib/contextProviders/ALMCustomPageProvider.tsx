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
import React, { useContext, useMemo } from 'react';
import { CustomPageConfig, Column, WidgetMap } from '../models';

/**
 * Props for the CustomPageContext
 */
type CustomPageContextProps = {
  /** Configuration for the custom page */
  pageConfig: CustomPageConfig;
  /** Function to render a widget based on column and configuration */
  renderWidget: RenderWidget;
  /** Whether to disable links in the page */
  disableLinks: boolean;
  /** Whether the page is in inspect mode */
  isInspectMode: boolean;
};

/**
 * Function type for rendering widgets
 * @param col - The column configuration
 * @param config - The widget configuration map
 * @returns React node to be rendered
 */
type RenderWidget = (col: Column, config: WidgetMap) => React.ReactNode;

const CustomPageContext = React.createContext<CustomPageContextProps | undefined>(undefined);

/**
 * Provider component for the CustomPage context
 */
const CustomPageProvider: React.FC<{
  value: CustomPageContextProps;
  children: React.ReactNode;
}> = ({ value, children }) => {
  // Memoize the context value to prevent unnecessary re-renders
  const memoizedValue = useMemo(() => value, [value]);

  return <CustomPageContext.Provider value={memoizedValue}>{children}</CustomPageContext.Provider>;
};

/**
 * Hook to access the CustomPage context
 * @throws {Error} If used outside of CustomPageProvider
 * @returns The CustomPage context value
 */
export const useCustomPageContextProvider = () => {
  const context = useContext(CustomPageContext);
  if (context === undefined) {
    throw new Error(
      'useCustomPageContextProvider must be used within a CustomPageProvider. ' +
        'Please wrap your component with CustomPageProvider.'
    );
  }

  return context;
};

export { type CustomPageContextProps, type RenderWidget, CustomPageProvider };
