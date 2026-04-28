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
import { useEffect } from 'react';

export const useStyleInjection = (css: string, elementId: string): void => {
  useEffect(() => {
    if (!css) {
      console.warn(`No CSS code provided for widget ${elementId}`);
    }

    const styleId = `${elementId}-style`;
    const styleTag = document.createElement('style');
    styleTag.textContent = css;
    styleTag.id = styleId;
    document.head.appendChild(styleTag);

    return () => {
      const existingStyleTag = document.getElementById(styleId);
      if (existingStyleTag) existingStyleTag.remove();
    };
  }, [css, elementId]);
};
