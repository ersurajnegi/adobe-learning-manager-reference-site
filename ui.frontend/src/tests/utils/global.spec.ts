/**
Copyright 2021 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

// Setup window mock BEFORE any imports
const mockConfig = {
  almBaseURL: 'https://test.adobe.com',
  primeApiURL: 'https://api.test.adobe.com',
  primeCdnTrainingBaseEndpoint: 'https://cdn.test.adobe.com',
  esBaseUrl: 'https://es.test.adobe.com',
  accessToken: 'test-access-token',
  csrfToken: 'test-csrf-token',
  nativeExtensionToken: 'test-native-token',
  baseUrl: '/learner',
  instancePath: '/instance',
  homePath: '/home',
  catalogPath: '/catalog',
  trainingOverviewPath: '/training',
  authorPath: '/author',
  communityPath: '/community',
  communityBoardsPath: '/boards',
  communityBoardDetailsPath: '/board-details',
  commerceBasePath: '/commerce',
  locale: 'en-US',
  pageLocale: 'en-US',
  almCdnBaseUrl: 'https://cdn.test.adobe.com',
  commerceURL: 'https://commerce.test.adobe.com',
  graphqlProxyPath: '/graphql',
  usageType: 'aem-sites',
  accountData: '{"data":{"attributes":{"name":"Test Account"}}}',
  commerceStoreName: 'test-store',
  frontendResourcesPath: '/resources',
  mountingPoints: {
    catalog: '#catalog-container',
  },
  themeData: {
    tileColors: ['#FF0000', '#00FF00'],
    primaryColor: '#0000FF',
    secondaryColor: '#FFFF00',
    neutralColors: ['#FFFFFF', '#000000'],
    themeOverrides: {},
    name: 'Prime Default',
    sidebarColor: '#333333',
    sidebarIconColor: '#FFFFFF',
    brandColor: '#0000FF',
  },
  hideBackButton: false,
  hideSearchInput: false,
  hideSearchClearButton: false,
  handleShareExternally: false,
  handleLinkedInContentExternally: false,
  useConfigLocale: false,
  theme: {},
  _cardProperties: {},
  customInjections: {
    tileColors: [],
    homePageBackground: '',
  },
} as any;

const mockALM = {
  getALMConfig: jest.fn(() => mockConfig),
  getAccessToken: jest.fn(() => 'test-access-token'),
  getCsrfToken: jest.fn(() => 'test-csrf-token'),
  getNativeExtensionToken: jest.fn(() => 'test-native-token'),
  getCommerceToken: jest.fn(() => 'test-commerce-token'),
  isPrimeUserLoggedIn: jest.fn(() => true),
  isExtensionAllowed: jest.fn(() => true),
  handleLogIn: jest.fn(),
  storage: {
    getItem: jest.fn((key: string) => `stored-${key}`),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
} as any;

const mockWindow = {
  ALM: mockALM,
  location: {
    href: 'https://test.adobe.com/learner#/catalog',
    pathname: '/learner',
    search: '?param1=value1&param2=value2',
    hash: '#/catalog',
    origin: 'https://test.adobe.com',
  },
  history: {
    replaceState: jest.fn(),
  },
  parent: [],
  innerWidth: 1024,
  open: jest.fn(),
  postMessage: jest.fn(),
  initNotNeeded: true,
} as any;

// Create non-circular reference for parent
Object.defineProperty(mockWindow.parent, '0', {
  value: {
    postMessage: mockWindow.postMessage,
  },
  writable: true,
  configurable: true,
});

// Note: jsdom provides window object, we'll configure it in beforeEach

// Mock modules that have side effects
jest.mock('@utils/translationService', () => ({
  SetupAccountTerminologies: jest.fn(),
}));

jest.mock('@utils/themes', () => ({
  InitThemeData: jest.fn(),
}));

jest.mock('@utils/widgets/utils', () => ({
  ApplyInjectables: jest.fn(() => Promise.resolve({})),
}));

jest.mock('@utils/restAdapter', () => ({
  RestAdapter: {
    ajax: jest.fn(),
  },
}));

jest.mock('@utils/jsonAPIAdapter', () => ({
  JsonApiParse: jest.fn(data => data),
}));

jest.mock('@utils/urlConv', () => ({
  convertToLearnerDesktopParams: jest.fn(() => ({})),
}));

jest.mock('@components/Catalog/PrimeTrainingCardV2/PrimeTrainingCardV2.helper', () => ({
  getLoViewRefLink: jest.fn(),
}));

jest.mock('@utils/widgets/base/EventHandlingBase', () => ({
  SendLinkEvent: jest.fn(),
}));

jest.mock('@utils/catalog', () => ({
  convertStringToObject: jest.fn(str => {
    if (!str) return {};
    return str.split(',').reduce((obj: any, key: string) => {
      obj[key.trim()] = true;
      return obj;
    }, {});
  }),
}));

// Setup global window BEFORE importing global.ts
(global as any).window = (global as any).window || {};
(global as any).window.innerWidth = 1024;

// Unmock @utils/global for this test file since we want to test the real implementation
jest.unmock('@utils/global');

import { darkTheme, lightTheme } from '@adobe/react-spectrum';
import {
  CARNIVAL_THEME,
  WINTER_SKY_THEME,
  VIVID_THEME,
  DEFAULT_THEME,
  PEBBLES_THEME,
  AUTUMN_THEME,
  SEPARATOR,
  FILTER,
} from '@utils/constants';

// Import functions after mocks and window setup
import {
  getWindowObject,
  getALMObject,
  setALMAttribute,
  getALMAttribute,
  getALMConfig,
  getAccessToken,
  getCsrfToken,
  getNativeExtensionToken,
  getTokenForNativeExtensions,
  getAuthKey,
  getCommerceToken,
  getWidgetConfig,
  setHomePageLayoutConfig,
  getPathParams,
  getQueryParamsFromUrl,
  isBookmarksEnabled,
  getConfigurableAttributes,
  isUserLoggedIn,
  redirectToLoginAndAbort,
  getItemFromStorage,
  setItemToStorage,
  removeItemFromStorage,
  getCommerceStoreName,
  getRegistrationsURLs,
  isUrl,
  isScreenBelowDesktop,
  isExtensionAllowed,
  getModalBackgroundColor,
  getModalTheme,
  isDarkThemeApplied,
  getModalColorScheme,
  addHttpsToHref,
  checkIfLinkedInLearningCourse,
  sendEvent,
  GetPrimeEmitEventLinks,
  ShouldEmitEventLinks,
  IsFlexibleWidth,
  isEmptyJson,
  isEmptyObject,
  setTrainingsLayout,
  getTrimmedText,
  containsElement,
  containsSubstr,
  needsLearnerDesktopUrlChange,
  getSkuId,
  isNotEmptyStr,
  isEnrolled,
  isStringAnArray,
  isEmptyArrString,
  getFormattedDataFromIndex,
  getDefaultFilterValues,
  getSelectedOptionsForMobile,
  customEncode,
  darkThemes,
} from '@utils/global';

import type { PrimeConfig, WidgetConfig } from '@utils/global';

describe('global.ts utility functions', () => {
  beforeEach(() => {
    // Set up window.ALM using defineProperty to ensure it sticks
    Object.defineProperty(window, 'ALM', {
      value: mockALM,
      writable: true,
      configurable: true,
    });

    // Set other window properties
    Object.defineProperty(window, 'innerWidth', {
      value: 1024,
      writable: true,
      configurable: true,
    });

    Object.defineProperty(window, 'open', {
      value: mockWindow.open,
      writable: true,
      configurable: true,
    });

    Object.defineProperty(window, 'initNotNeeded', {
      value: true,
      writable: true,
      configurable: true,
    });

    // Handle location specially (jsdom has special handling for this)
    delete (window as any).location;
    (window as any).location = {
      href: 'https://test.adobe.com/learner#/catalog',
      pathname: '/learner',
      search: '?param1=value1&param2=value2',
      hash: '#/catalog',
      origin: 'https://test.adobe.com',
    };

    // Handle parent array
    const parentArray: any = [];
    Object.defineProperty(parentArray, '0', {
      value: {
        postMessage: jest.fn(),
      },
      writable: true,
      configurable: true,
    });
    (window as any).parent = parentArray;
    mockWindow.parent = parentArray;
    mockWindow.postMessage = parentArray[0].postMessage;

    // Reset mock function return values
    mockALM.getALMConfig = jest.fn(() => mockConfig);
    mockALM.getAccessToken = jest.fn(() => 'test-access-token');
    mockALM.getCsrfToken = jest.fn(() => 'test-csrf-token');
    mockALM.getNativeExtensionToken = jest.fn(() => 'test-native-token');
    mockALM.getCommerceToken = jest.fn(() => 'test-commerce-token');
    mockALM.isPrimeUserLoggedIn = jest.fn(() => true);
    mockALM.isExtensionAllowed = jest.fn(() => true);
    mockALM.handleLogIn = jest.fn();
    mockALM.storage = {
      getItem: jest.fn((key: string) => `stored-${key}`),
      setItem: jest.fn(),
      removeItem: jest.fn(),
    };

    // Update mockWindow references
    mockWindow.location = (window as any).location;
    mockWindow.innerWidth = 1024;
    mockWindow.open = (window as any).open;

    // Reset history
    mockWindow.history = {
      replaceState: jest.fn(),
    };
    window.history.replaceState = mockWindow.history.replaceState as any;

    // Reset themeData name
    mockConfig.themeData.name = DEFAULT_THEME;

    // Mock document.querySelector
    document.querySelector = jest.fn((selector: string) => ({
      dataset: { customAttr: 'test-value' },
    })) as any;
  });

  afterEach(() => {
    // Clean up mocks
    jest.restoreAllMocks();
  });

  // ========== Window & ALM Object Functions ==========

  describe('getWindowObject', () => {
    it('should return the global window object', () => {
      const result = getWindowObject();
      expect(result).toBe(window);
      expect(typeof result.ALM.getALMConfig).toBe('function');
    });
  });

  describe('getALMObject', () => {
    it('should return the ALM object from window', () => {
      const result = getALMObject();
      expect(typeof result?.getALMConfig).toBe('function');
    });
  });

  describe('setALMAttribute', () => {
    it('should set an attribute on the ALM object', () => {
      setALMAttribute('testKey', 'testValue');
      const alm = getALMObject();
      expect((alm as any)?.testKey).toBe('testValue');
    });

    it('should handle setting object values', () => {
      const testObj = { nested: 'value' };
      setALMAttribute('complexKey', testObj);
      const alm = getALMObject();
      expect((alm as any)?.complexKey).toBe(testObj);
    });
  });

  describe('getALMAttribute', () => {
    it('should retrieve an attribute from the ALM object', () => {
      mockWindow.ALM.existingKey = 'existingValue';
      const result = getALMAttribute('existingKey');
      expect(result).toBe('existingValue');
    });

    it('should return undefined for non-existent keys', () => {
      const result = getALMAttribute('nonExistentKey');
      expect(result).toBeUndefined();
    });
  });

  // ========== Config & Token Functions ==========

  describe('getALMConfig', () => {
    it('should return the ALM configuration', () => {
      const result = getALMConfig();
      expect(result).toBe(mockConfig);
      expect(mockALM.getALMConfig).toHaveBeenCalled();
    });
  });

  describe('getAccessToken', () => {
    it('should return the access token', () => {
      const result = getAccessToken();
      expect(result).toBe('test-access-token');
      expect(mockALM.getAccessToken).toHaveBeenCalled();
    });
  });

  describe('getCsrfToken', () => {
    it('should return the CSRF token', () => {
      const result = getCsrfToken();
      expect(result).toBe('test-csrf-token');
      expect(mockALM.getCsrfToken).toHaveBeenCalled();
    });
  });

  describe('getNativeExtensionToken', () => {
    it('should return the native extension token', () => {
      const result = getNativeExtensionToken();
      expect(result).toBe('test-native-token');
      expect(mockALM.getNativeExtensionToken).toHaveBeenCalled();
    });
  });

  describe('getTokenForNativeExtensions', () => {
    it('should return access token when available in config', () => {
      const result = getTokenForNativeExtensions();
      expect(result).toBe('test-access-token');
      expect(mockALM.getAccessToken).toHaveBeenCalled();
    });

    it('should return native extension token when access token is not in config', () => {
      mockConfig.accessToken = '';
      const result = getTokenForNativeExtensions();
      expect(result).toBe('test-native-token');
      expect(mockALM.getNativeExtensionToken).toHaveBeenCalled();
    });
  });

  describe('getAuthKey', () => {
    it('should return CSRF token auth key when available', () => {
      const result = getAuthKey();
      expect(result).toBe('csrf_token=test-csrf-token');
    });

    it('should return access token auth key when CSRF token is not available', () => {
      mockConfig.csrfToken = '';
      const result = getAuthKey();
      expect(result).toBe('access_token=test-access-token');
    });
  });

  describe('getCommerceToken', () => {
    it('should return the commerce token', () => {
      const result = getCommerceToken();
      expect(result).toBe('test-commerce-token');
      expect(mockALM.getCommerceToken).toHaveBeenCalled();
    });
  });

  describe('getWidgetConfig', () => {
    it('should return widget config from ALM config', () => {
      const widgetConfig: WidgetConfig = {
        displayType: 'DESKTOP_HOME_PG',
        pageSetting: {} as any,
        emitPageLinkEvents: true,
        enableAnnouncementRecoUGWLink: false,
      };
      mockConfig.widgetConfig = widgetConfig;
      const result = getWidgetConfig();
      expect(result).toBe(widgetConfig);
    });

    it('should return empty object when widget config is not available', () => {
      mockConfig.widgetConfig = undefined;
      const result = getWidgetConfig();
      expect(result).toEqual({});
    });
  });

  describe('setHomePageLayoutConfig', () => {
    it('should set home page layout config', () => {
      const layoutConfig = { layoutMode: 'test', widgets: [] };
      setHomePageLayoutConfig(layoutConfig);
      expect(mockConfig.homePageLayoutConfig).toEqual(layoutConfig);
    });
  });

  // ========== Path & Query Parameter Functions ==========

  describe('getPathParams', () => {
    it('should extract path parameters from pathname', () => {
      mockWindow.location.pathname = '/learner/catalog/id/course123/filter/all';
      const result = getPathParams('/catalog', ['id', 'filter']);
      expect(result).toEqual({ id: 'course123', filter: 'all' });
    });

    it('should extract path parameters from hash', () => {
      mockWindow.location.hash = '#/catalog/id/course123/filter/all';
      const result = getPathParams('/catalog', ['id', 'filter']);
      expect(result).toEqual({ id: 'course123', filter: 'all' });
    });

    it('should return empty object when page path not found', () => {
      mockWindow.location.pathname = '/learner/home';
      const result = getPathParams('/catalog', ['id', 'filter']);
      expect(result).toEqual({});
    });

    it('should handle missing parameters', () => {
      mockWindow.location.pathname = '/learner/catalog/id/course123';
      const result = getPathParams('/catalog', ['id', 'filter', 'sort']);
      expect(result).toEqual({ id: 'course123' });
    });

    it('should handle learner mobile app mode', () => {
      mockConfig.learnerMobileApp = true;
      mockWindow.location.hash = '#/catalog/id/course123';
      const result = getPathParams('/catalog', ['id']);
      expect(result).toEqual({ id: 'course123' });
    });
  });

  describe('getQueryParamsFromUrl', () => {
    it('should extract query parameters from URL', () => {
      const result = getQueryParamsFromUrl();
      expect(result).toEqual({ param1: 'value1', param2: 'value2' });
    });

    it('should return empty object when no query parameters', () => {
      mockWindow.location.search = '';
      const result = getQueryParamsFromUrl();
      expect(result).toEqual({});
    });

    it('should decode URI encoded parameters', () => {
      mockWindow.location.search = '?name=John%20Doe&city=New%20York';
      const result = getQueryParamsFromUrl();
      expect(result).toEqual({ name: 'John Doe', city: 'New York' });
    });
  });

  describe('isBookmarksEnabled', () => {
    it('should return true when bookmarks query param is true', () => {
      mockWindow.location.search = '?bookmarks=true';
      const result = isBookmarksEnabled();
      expect(result).toBe(true);
    });

    it('should return false when bookmarks query param is not true', () => {
      mockWindow.location.search = '?bookmarks=false';
      const result = isBookmarksEnabled();
      expect(result).toBe(false);
    });

    it('should return false when bookmarks query param is not present', () => {
      mockWindow.location.search = '?other=value';
      const result = isBookmarksEnabled();
      expect(result).toBe(false);
    });
  });

  // ========== DOM & Configuration Functions ==========

  describe('getConfigurableAttributes', () => {
    it('should retrieve dataset from DOM element', () => {
      const result = getConfigurableAttributes('#test-selector');
      expect(result).toEqual({ customAttr: 'test-value' });
      expect(document.querySelector).toHaveBeenCalledWith('#test-selector');
    });

    it('should return undefined when element not found', () => {
      global.document.querySelector = jest.fn(() => null) as any;
      const result = getConfigurableAttributes('#non-existent');
      expect(result).toBeUndefined();
    });
  });

  // ========== User & Authentication Functions ==========

  describe('isUserLoggedIn', () => {
    it('should return true when user is logged in', () => {
      const result = isUserLoggedIn();
      expect(result).toBe(true);
      expect(mockALM.isPrimeUserLoggedIn).toHaveBeenCalled();
    });

    it('should return false when user is not logged in', () => {
      mockALM.isPrimeUserLoggedIn = jest.fn(() => false);
      const result = isUserLoggedIn();
      expect(result).toBe(false);
    });
  });

  describe('redirectToLoginAndAbort', () => {
    it('should redirect when user is not logged in', () => {
      mockALM.isPrimeUserLoggedIn = jest.fn(() => false);
      const result = redirectToLoginAndAbort();
      expect(result).toBe(true);
      expect(mockALM.handleLogIn).toHaveBeenCalled();
    });

    it('should not redirect when user is logged in', () => {
      const result = redirectToLoginAndAbort();
      expect(result).toBe(false);
      expect(mockALM.handleLogIn).not.toHaveBeenCalled();
    });

    it('should force redirect when forceRedirect is true', () => {
      const result = redirectToLoginAndAbort(true);
      expect(result).toBe(true);
      expect(mockALM.handleLogIn).toHaveBeenCalled();
    });
  });

  // ========== Storage Functions ==========

  describe('getItemFromStorage', () => {
    it('should retrieve item from storage', () => {
      const result = getItemFromStorage('testKey');
      expect(result).toBe('stored-testKey');
      expect(mockALM.storage.getItem).toHaveBeenCalledWith('testKey');
    });
  });

  describe('setItemToStorage', () => {
    it('should set item to storage with default TTL', () => {
      setItemToStorage('testKey', 'testData');
      expect(mockALM.storage.setItem).toHaveBeenCalledWith('testKey', 'testData', 900);
    });

    it('should set item to storage with custom TTL', () => {
      setItemToStorage('testKey', 'testData', 1800);
      expect(mockALM.storage.setItem).toHaveBeenCalledWith('testKey', 'testData', 1800);
    });
  });

  describe('removeItemFromStorage', () => {
    it('should remove item from storage', () => {
      removeItemFromStorage('testKey');
      expect(mockALM.storage.removeItem).toHaveBeenCalledWith('testKey');
    });
  });

  // ========== Commerce Functions ==========

  describe('getCommerceStoreName', () => {
    it('should return commerce store name from config', () => {
      const result = getCommerceStoreName();
      expect(result).toBe('test-store');
    });
  });

  describe('getRegistrationsURLs', () => {
    const accountConfig = {
      EBNLRegistrationProfile: {
        signUpURL: 'https://signup.test.com',
        signInURL: 'https://signin.test.com',
      },
    };

    it('should return IP-based URLs when ipId is present', () => {
      mockWindow.location.search = '?ipId=ip123&accesskey=key123';
      const result = getRegistrationsURLs(accountConfig, 'https://alm.adobe.com');
      expect(result.signUpURL).toContain('accountiplogin?ipId=ip123&accesskey=key123');
      expect(result.signInURL).toContain('accountiplogin?ipId=ip123&accesskey=key123');
    });

    it('should return EP-based URLs when epId is present', () => {
      mockWindow.location.search = '?groupid=ep123&accesskey=key123';
      const result = getRegistrationsURLs(accountConfig, 'https://alm.adobe.com');
      expect(result.signUpURL).toContain('eplogin?groupid=ep123&accesskey=key123');
      expect(result.signInURL).toContain('accounteplogin?epId=ep123&accesskey=key123');
    });

    it('should return default URLs from account config', () => {
      mockWindow.location.search = '';
      const result = getRegistrationsURLs(accountConfig, 'https://alm.adobe.com');
      expect(result.signUpURL).toBe('https://signup.test.com');
      expect(result.signInURL).toBe('https://signin.test.com');
    });

    it('should use ALM domain when localhost is detected', () => {
      mockWindow.location.origin = 'http://localhost:3000';
      mockWindow.location.search = '?ipId=ip123&accesskey=key123';
      const result = getRegistrationsURLs(accountConfig, 'https://alm.adobe.com');
      expect(result.signUpURL).toContain('https://alm.adobe.com');
    });
  });

  // ========== URL & Validation Functions ==========

  describe('isUrl', () => {
    it('should return true for HTTP URLs', () => {
      expect(isUrl('http://example.com')).toBe(true);
    });

    it('should return true for HTTPS URLs', () => {
      expect(isUrl('https://example.com')).toBe(true);
    });

    it('should return false for invalid URLs', () => {
      expect(isUrl('not-a-url')).toBe(false);
      expect(isUrl('ftp://example.com')).toBe(false);
      expect(isUrl('')).toBe(false);
    });
  });

  // ========== Screen & Extension Functions ==========

  describe('isScreenBelowDesktop', () => {
    it('should return false for desktop width', () => {
      Object.defineProperty(window, 'innerWidth', {
        value: 1024,
        writable: true,
        configurable: true,
      });
      const result = isScreenBelowDesktop();
      expect(result).toBe(false);
    });

    it('should return true for mobile width', () => {
      Object.defineProperty(window, 'innerWidth', {
        value: 768,
        writable: true,
        configurable: true,
      });
      const result = isScreenBelowDesktop();
      expect(result).toBe(true);
    });

    it('should return true at exactly 992px', () => {
      Object.defineProperty(window, 'innerWidth', {
        value: 992,
        writable: true,
        configurable: true,
      });
      const result = isScreenBelowDesktop();
      expect(result).toBe(true);
    });
  });

  describe('isExtensionAllowed', () => {
    const mockExtension = { name: 'test-extension' } as any;

    it('should return true when extension is allowed', () => {
      const result = isExtensionAllowed(mockExtension);
      expect(result).toBe(true);
      expect(mockALM.isExtensionAllowed).toHaveBeenCalledWith(mockExtension);
    });

    it('should return falsy when extension is null', () => {
      const result = isExtensionAllowed(null as any);
      expect(result).toBeFalsy();
    });

    it('should return false when isExtensionAllowed function is not available', () => {
      mockALM.isExtensionAllowed = undefined;
      const result = isExtensionAllowed(mockExtension);
      expect(result).toBe(false);
    });
  });

  // ========== Theme Functions ==========

  describe('getModalBackgroundColor', () => {
    it('should return #F5F5F5 for CARNIVAL_THEME', () => {
      expect(getModalBackgroundColor(CARNIVAL_THEME)).toBe('#F5F5F5');
    });

    it('should return #F5F5F5 for WINTER_SKY_THEME', () => {
      expect(getModalBackgroundColor(WINTER_SKY_THEME)).toBe('#F5F5F5');
    });

    it('should return #232323 for VIVID_THEME', () => {
      expect(getModalBackgroundColor(VIVID_THEME)).toBe('#232323');
    });

    it('should return #292929 for other themes', () => {
      expect(getModalBackgroundColor(DEFAULT_THEME)).toBe('#292929');
      expect(getModalBackgroundColor('unknown-theme')).toBe('#292929');
    });
  });

  describe('darkThemes', () => {
    it('should contain the correct dark themes', () => {
      expect(darkThemes).toEqual([DEFAULT_THEME, PEBBLES_THEME, AUTUMN_THEME, VIVID_THEME]);
    });
  });

  describe('getModalTheme', () => {
    it('should return darkTheme for dark themes', () => {
      expect(getModalTheme(DEFAULT_THEME)).toBe(darkTheme);
      expect(getModalTheme(PEBBLES_THEME)).toBe(darkTheme);
      expect(getModalTheme(AUTUMN_THEME)).toBe(darkTheme);
      expect(getModalTheme(VIVID_THEME)).toBe(darkTheme);
    });

    it('should return lightTheme for light themes', () => {
      expect(getModalTheme(CARNIVAL_THEME)).toBe(lightTheme);
      expect(getModalTheme(WINTER_SKY_THEME)).toBe(lightTheme);
      expect(getModalTheme('unknown-theme')).toBe(lightTheme);
    });
  });

  describe('isDarkThemeApplied', () => {
    it('should return true for dark themes', () => {
      mockConfig.themeData.name = DEFAULT_THEME;
      expect(isDarkThemeApplied()).toBe(true);

      mockConfig.themeData.name = VIVID_THEME;
      expect(isDarkThemeApplied()).toBe(true);
    });

    it('should return false for light themes', () => {
      mockConfig.themeData.name = CARNIVAL_THEME;
      expect(isDarkThemeApplied()).toBe(false);
    });
  });

  describe('getModalColorScheme', () => {
    it('should return "dark" for dark color schemes', () => {
      expect(getModalColorScheme(DEFAULT_THEME)).toBe('dark');
      expect(getModalColorScheme(VIVID_THEME)).toBe('dark');
    });

    it('should return "light" for other themes', () => {
      expect(getModalColorScheme(PEBBLES_THEME)).toBe('light');
      expect(getModalColorScheme(CARNIVAL_THEME)).toBe('light');
    });
  });

  // ========== HTML & Content Functions ==========

  describe('addHttpsToHref', () => {
    it('should add https to hrefs without protocol', () => {
      const html = '<a href="example.com">Link</a>';
      const result = addHttpsToHref(html);
      expect(result).toBe('<a href="https://example.com">Link</a>');
    });

    it('should not modify hrefs with http protocol', () => {
      const html = '<a href="http://example.com">Link</a>';
      const result = addHttpsToHref(html);
      expect(result).toBe(html);
    });

    it('should not modify hrefs with https protocol', () => {
      const html = '<a href="https://example.com">Link</a>';
      const result = addHttpsToHref(html);
      expect(result).toBe(html);
    });

    it('should handle multiple links', () => {
      const html = '<a href="example.com">Link1</a> <a href="https://test.com">Link2</a>';
      const result = addHttpsToHref(html);
      expect(result).toBe(
        '<a href="https://example.com">Link1</a> <a href="https://test.com">Link2</a>'
      );
    });
  });

  describe('checkIfLinkedInLearningCourse', () => {
    it('should return true for LinkedIn Learning courses', () => {
      const training = {
        authorNames: ['LinkedIn Learning', 'Other Author'],
      } as any;
      expect(checkIfLinkedInLearningCourse(training)).toBe(true);
    });

    it('should return true for case-insensitive match', () => {
      const training = {
        authorNames: ['LINKEDIN LEARNING'],
      } as any;
      expect(checkIfLinkedInLearningCourse(training)).toBe(true);
    });

    it('should return false for non-LinkedIn courses', () => {
      const training = {
        authorNames: ['Adobe', 'Other Author'],
      } as any;
      expect(checkIfLinkedInLearningCourse(training)).toBe(false);
    });

    it('should return undefined when authorNames is undefined', () => {
      const training = {} as any;
      expect(checkIfLinkedInLearningCourse(training)).toBeUndefined();
    });
  });

  // ========== Event & Messaging Functions ==========

  describe('sendEvent', () => {
    let postMessageMock: jest.Mock;

    beforeEach(() => {
      // Spy on console.log
      jest.spyOn(console, 'log').mockImplementation();

      // Setup window.parent with postMessage
      postMessageMock = jest.fn();
      const parentArray: any = [];
      parentArray[0] = {
        postMessage: postMessageMock,
      };
      Object.defineProperty(window, 'parent', {
        value: parentArray,
        writable: true,
        configurable: true,
      });
    });

    afterEach(() => {
      (console.log as jest.Mock).mockRestore();
    });

    it('should send event to parent window', () => {
      sendEvent('TEST_EVENT', 'test-body');
      expect(console.log).toHaveBeenCalledWith('Sending Event: ', 'TEST_EVENT', 'test-body');
      expect(postMessageMock).toHaveBeenCalledWith(
        {
          type: 'TEST_EVENT',
          body: 'test-body',
        },
        '*'
      );
    });

    it('should send event with empty body', () => {
      sendEvent('TEST_EVENT');
      expect(postMessageMock).toHaveBeenCalledWith(
        {
          type: 'TEST_EVENT',
          body: '',
        },
        '*'
      );
    });
  });

  describe('GetPrimeEmitEventLinks', () => {
    it('should return emitPageLinkEvents as string', () => {
      mockConfig.widgetConfig = {
        emitPageLinkEvents: 'all',
        pageSetting: {} as any,
        enableAnnouncementRecoUGWLink: false,
      };
      expect(GetPrimeEmitEventLinks()).toBe('all');
    });

    it('should return undefined when emitPageLinkEvents is not set', () => {
      mockConfig.widgetConfig = {
        pageSetting: {} as any,
        enableAnnouncementRecoUGWLink: false,
      };
      expect(GetPrimeEmitEventLinks()).toBeUndefined();
    });
  });

  describe('ShouldEmitEventLinks', () => {
    it('should return true when emitPageLinkEvents is not false', () => {
      mockConfig.widgetConfig = {
        emitPageLinkEvents: true,
        pageSetting: {} as any,
        enableAnnouncementRecoUGWLink: false,
      };
      expect(ShouldEmitEventLinks()).toBe(true);
    });

    it('should return false when emitPageLinkEvents is false', () => {
      mockConfig.widgetConfig = {
        emitPageLinkEvents: false,
        pageSetting: {} as any,
        enableAnnouncementRecoUGWLink: false,
      };
      expect(ShouldEmitEventLinks()).toBe(false);
    });
  });

  describe('IsFlexibleWidth', () => {
    it('should return true when fixedWidth is true', () => {
      mockConfig.widgetConfig = {
        fixedWidth: true,
        pageSetting: {} as any,
        enableAnnouncementRecoUGWLink: false,
      };
      expect(IsFlexibleWidth()).toBe(true);
    });

    it('should return false when fixedWidth is not set', () => {
      mockConfig.widgetConfig = {
        pageSetting: {} as any,
        enableAnnouncementRecoUGWLink: false,
      };
      expect(IsFlexibleWidth()).toBe(false);
    });
  });

  // ========== JSON & Object Functions ==========

  describe('isEmptyJson', () => {
    it('should return true for empty JSON object', () => {
      expect(isEmptyJson({})).toBe(true);
    });

    it('should return false for non-empty JSON object', () => {
      expect(isEmptyJson({ key: 'value' })).toBe(false);
    });

    it('should return null for null', () => {
      expect(isEmptyJson(null)).toBeNull();
    });

    it('should return undefined for undefined', () => {
      expect(isEmptyJson(undefined)).toBeUndefined();
    });
  });

  describe('isEmptyObject', () => {
    it('should return true for empty object', () => {
      expect(isEmptyObject({})).toBe(true);
    });

    it('should return false for non-empty object', () => {
      expect(isEmptyObject({ key: 'value' })).toBe(false);
    });

    it('should return null for null', () => {
      expect(isEmptyObject(null)).toBeNull();
    });

    it('should return false for arrays', () => {
      expect(isEmptyObject([])).toBe(false);
    });
  });

  // ========== View & Layout Functions ==========

  describe('setTrainingsLayout', () => {
    it('should call setView with the provided view', () => {
      const mockSetView = jest.fn();
      setTrainingsLayout('grid', mockSetView);
      expect(mockSetView).toHaveBeenCalledWith('grid');
    });
  });

  // ========== String Utility Functions ==========

  describe('getTrimmedText', () => {
    it('should trim text longer than specified length', () => {
      const result = getTrimmedText('This is a very long text', 10);
      expect(result).toBe('This is a ...');
    });

    it('should not trim text shorter than specified length', () => {
      const result = getTrimmedText('Short text', 20);
      expect(result).toBe('Short text');
    });

    it('should handle undefined text', () => {
      const result = getTrimmedText(undefined as any, 10);
      expect(result).toBeUndefined();
    });
  });

  describe('containsElement', () => {
    it('should return true when element is in array', () => {
      expect(containsElement(['a', 'b', 'c'], 'b')).toBe(true);
    });

    it('should return false when element is not in array', () => {
      expect(containsElement(['a', 'b', 'c'], 'd')).toBe(false);
    });
  });

  describe('containsSubstr', () => {
    it('should return true when substring is present', () => {
      expect(containsSubstr('hello world', 'world')).toBe(true);
    });

    it('should return false when substring is not present', () => {
      expect(containsSubstr('hello world', 'foo')).toBe(false);
    });
  });

  describe('needsLearnerDesktopUrlChange', () => {
    it('should return false for author routes', () => {
      expect(needsLearnerDesktopUrlChange('#/author/123')).toBe(false);
    });

    it('should return true for other routes', () => {
      expect(needsLearnerDesktopUrlChange('#/catalog')).toBe(true);
      expect(needsLearnerDesktopUrlChange('#/home')).toBe(true);
    });
  });

  describe('getSkuId', () => {
    it('should replace underscore with colon', () => {
      expect(getSkuId('course_123')).toBe('course:123');
    });

    it('should handle multiple underscores', () => {
      expect(getSkuId('course_module_123')).toBe('course:module_123');
    });
  });

  describe('isNotEmptyStr', () => {
    it('should return true for non-empty strings', () => {
      expect(isNotEmptyStr('test')).toBe(true);
    });

    it('should return false for empty strings', () => {
      expect(isNotEmptyStr('')).toBe(false);
    });
  });

  describe('isEnrolled', () => {
    it('should return truthy when training type matches and is enrolled', () => {
      const training = {
        loType: 'course',
        enrollment: { id: '123' },
      } as any;
      expect(isEnrolled(training, 'course')).toEqual({ id: '123' });
    });

    it('should return falsy when training type does not match', () => {
      const training = {
        loType: 'certification',
        enrollment: { id: '123' },
      } as any;
      expect(isEnrolled(training, 'course')).toBeFalsy();
    });

    it('should return falsy when not enrolled', () => {
      const training = {
        loType: 'course',
        enrollment: null,
      } as any;
      expect(isEnrolled(training, 'course')).toBeFalsy();
    });
  });

  describe('isStringAnArray', () => {
    it('should return true for valid JSON array strings', () => {
      expect(isStringAnArray('["a", "b", "c"]')).toBe(true);
      expect(isStringAnArray('[]')).toBe(true);
    });

    it('should return false for non-array JSON strings', () => {
      expect(isStringAnArray('{"key": "value"}')).toBe(false);
    });

    it('should return false for invalid JSON', () => {
      expect(isStringAnArray('not json')).toBe(false);
    });
  });

  describe('isEmptyArrString', () => {
    it('should return true for empty array string', () => {
      expect(isEmptyArrString('[]')).toBe(true);
    });

    it('should return false for non-empty array string', () => {
      expect(isEmptyArrString('["a"]')).toBe(false);
    });

    it('should return false for other strings', () => {
      expect(isEmptyArrString('')).toBe(false);
    });
  });

  describe('getFormattedDataFromIndex', () => {
    it('should join array elements from specified index', () => {
      const result = getFormattedDataFromIndex(['a', 'b', 'c', 'd'] as any, 1);
      expect(result).toBe(`b${SEPARATOR}c${SEPARATOR}d`);
    });

    it('should handle index 0', () => {
      const result = getFormattedDataFromIndex(['a', 'b'] as any, 0);
      expect(result).toBe(`a${SEPARATOR}b`);
    });
  });

  // ========== Filter & Catalog Functions ==========

  describe('getDefaultFilterValues', () => {
    it('should return default filter values', () => {
      const result = getDefaultFilterValues();
      expect(result).toEqual({
        loTypes: 'course,learningProgram,certification,jobAid',
        skillName: {},
        tagName: {},
        catalogs: '',
        duration: '',
        learnerState: '',
        loFormat: '',
        price: '',
        skillLevel: '',
        cities: '',
        priceRange: '',
        products: '',
        roles: '',
        levels: '',
        announcedGroups: '',
      });
    });
  });

  describe('getSelectedOptionsForMobile', () => {
    it('should return catalogs map from CSV in query params', () => {
      // Use Object.defineProperty to set location properly
      delete (window as any).location;
      (window as any).location = {
        href: 'https://test.adobe.com/learner?catalogs=cat1,cat2,cat3',
        pathname: '/learner',
        search: '?catalogs=cat1,cat2,cat3',
        hash: '#/catalog',
        origin: 'https://test.adobe.com',
      };
      const result = getSelectedOptionsForMobile(FILTER.CATALOGS);
      expect(result).toEqual({ cat1: true, cat2: true, cat3: true });
    });

    it('should return empty object for unknown filter type', () => {
      const result = getSelectedOptionsForMobile('unknown');
      expect(result).toEqual({});
    });

    it('should return empty object when params are not present', () => {
      delete (mockWindow as any).location;
      mockWindow.location = {
        href: 'https://test.adobe.com/learner',
        pathname: '/learner',
        search: '',
        hash: '#/catalog',
        origin: 'https://test.adobe.com',
      };
      const result = getSelectedOptionsForMobile(FILTER.SKILL_NAME);
      expect(result).toEqual({});
    });
  });

  // ========== Encoding Functions ==========

  describe('customEncode', () => {
    it('should encode parts separated by colons', () => {
      const result = customEncode('course:123');
      expect(result).toBe('course:123');
    });

    it('should handle special characters', () => {
      const result = customEncode('course:test name');
      expect(result).toBe('course:test%20name');
    });

    it('should handle empty strings', () => {
      const result = customEncode('');
      expect(result).toBe('');
    });

    it('should handle multiple colons', () => {
      const result = customEncode('a:b:c');
      expect(result).toBe('a:b:c');
    });
  });
});
