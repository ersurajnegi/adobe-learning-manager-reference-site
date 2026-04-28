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

export const useScriptExecution = (javascript: string, elementid: string): void => {
  useEffect(() => {
    if (!javascript) {
      console.warn(`No JavaScript code provided for widget ${elementid}`);
    }

    try {
      const scriptFunction = new Function(
        'document',
        'window',
        `
        try {
          ${javascript}
        } catch (error) {
          console.error('Error in widget ${elementid}:', error);
        }
      `
      );
      scriptFunction(document, window);
    } catch (error) {
      console.error(`Error executing JavaScript for widget ${elementid}:`, error);
    }
  }, [javascript, elementid]);
};
