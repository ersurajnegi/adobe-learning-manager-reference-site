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
import { PrimeAccount, PrimeUser } from '../models';
import { getALMObject, getWindowObject } from './global';

interface JsonApiResponseUser {
  data?: {
    attributes?: PrimeUser;
    relationships?: any;
  };
  included: Array<{
    type: string;
    attributes?: PrimeAccount;
  }>;
}
/**
 * Public API interface for widgetHelperALM
 * This interface defines the methods available to external consumers
 */
export interface WidgetHelperALM {
  /**
   * Gets the current ALM user data
   * @returns Promise resolving to user data or null
   */
  getALMUser: () => Promise<JsonApiResponseUser | null>;

  /**
   * Gets the current ALM account data
   * @returns Promise resolving to account data
   */
  getALMAccount: () => Promise<PrimeAccount | null>;

  /**
   * Initializes the widgetHelperALM on the window object
   * @returns void
   */
  init: () => void;
}

/**
 * Class-based Singleton Pattern
 * Similar to Store/APIWidgetStore pattern in codebase
 */
class WidgetHelperALMClass implements WidgetHelperALM {
  private static instance: WidgetHelperALMClass | null = null;
  private _initialized: boolean = false;

  private constructor() {}

  /**
   * Gets the singleton instance of WidgetHelperALMClass
   * Creates a new instance if one doesn't exist
   *
   * @returns The singleton instance of WidgetHelperALMClass
   *
   */
  public static getInstance(): WidgetHelperALMClass {
    if (!WidgetHelperALMClass.instance) {
      WidgetHelperALMClass.instance = new WidgetHelperALMClass();
    }
    return WidgetHelperALMClass.instance;
  }

  /**
   * Initializes the widgetHelperALM on the window object
   * This method attaches the helper instance to window.widgetHelperALM
   * Can only be called once; subsequent calls are ignored
   *
   * @returns void
   *
   */
  public init(): void {
    if (this._initialized) {
      return;
    }
    this._initialized = true;
    if (typeof window !== 'undefined') {
      getWindowObject().widgetHelperALM = this;
    }
  }

  /**
   * Checks if the module has been initialized on the window object
   *
   * @returns Boolean indicating if module has been initialized
   */
  public isInitialized(): boolean {
    return this._initialized;
  }

  /**
   * Fetches ALM user data with included relationships from the ALM object
   * This is a private helper method used by public methods
   *
   * @returns Promise resolving to the full JSON API response with user and included data, or null if unavailable
   */
  private async getALMUserWithIncludes(): Promise<JsonApiResponseUser | null> {
    const response = await getALMObject().getALMUser();
    if (!response) {
      return null;
    }
    const user = JSON.parse(response);
    return user as JsonApiResponseUser;
  }

  /**
   * Gets the current ALM user data
   * Returns user data without relationships for cleaner consumption
   *
   * @returns Promise resolving to user data object or null if unavailable
   *
   */
  public async getALMUser(): Promise<JsonApiResponseUser | null> {
    const response = await this.getALMUserWithIncludes();
    if (!response) {
      return null;
    }
    const user = response.data || {};
    delete user?.relationships;
    return user as unknown as JsonApiResponseUser;
  }

  /**
   * Gets the current ALM account data
   * Extracts account information from the included resources in the user response
   *
   * @returns Promise resolving to account data or null if unavailable
   */
  public async getALMAccount(): Promise<PrimeAccount | null> {
    const response = (await this.getALMUserWithIncludes()) as unknown as JsonApiResponseUser;
    if (!response) {
      return null;
    }
    if (response.included?.length > 0) {
      return response.included[0] as unknown as PrimeAccount;
    }
    return null;
  }
}

/**
 * Exported singleton instance of WidgetHelperALMClass
 * This is the primary way to access the widget helper functionality
 */
export const widgetHelperALM = WidgetHelperALMClass.getInstance();

/**
 * Initializes the widgetHelperALM singleton instance on the window object
 * Convenience function for initializing the helper without accessing the instance directly
 *
 * @returns void
 */
export const initWidgetHelperALM = (): void => {
  widgetHelperALM.init();
};

/**
 * Type alias for WidgetHelperALMClass
 * Useful for type annotations when working with the widget helper
 */
export type WidgetHelperALMType = WidgetHelperALMClass;
