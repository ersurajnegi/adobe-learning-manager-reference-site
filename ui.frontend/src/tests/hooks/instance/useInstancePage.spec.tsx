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
/**
 * Unit tests for useInstancePage.tsx hook
 * Tests instance page data loading, filtering, and UI helper functions
 */

// Mock dependencies BEFORE imports to prevent circular dependency issues
jest.mock('@utils/global', () => ({
  getALMConfig: jest.fn(() => ({
    primeApiURL: 'https://test.api.com/primeapi/v2',
    commerceURL: 'https://test.commerce.com',
    graphqlProxyPath: 'https://test.graphql.com',
    locale: 'en-US',
    accountId: 'test-account',
  })),
  getALMObject: jest.fn(() => ({
    storage: { getItem: jest.fn(), setItem: jest.fn(), removeItem: jest.fn() },
    isPrimeUserLoggedIn: jest.fn(() => true),
  })),
  getALMUser: jest.fn(() => Promise.resolve({ user: { id: 'user:123' } })),
  getALMAttribute: jest.fn(),
  getQueryParamsFromUrl: jest.fn(() => ({})),
}));
jest.mock('@utils/restAdapter', () => ({
  RestAdapter: { get: jest.fn(), post: jest.fn() },
}));
jest.mock('@utils/jsonAPIAdapter', () => ({
  JsonApiParse: jest.fn(data => (typeof data === 'string' ? JSON.parse(data).data : data.data)),
}));
jest.mock('@utils/translationService', () => ({
  GetTranslation: jest.fn(key => key),
  GetTranslationReplaced: jest.fn(),
  getPreferredLocalizedMetadata: jest.fn(),
  formatMap: jest.fn(),
}));

jest.mock('@contextProviders/userContextProvider', () => ({
  useUserContext: () => ({
    user: {
      id: 'user-1',
      contentLocale: 'en-US',
    },
  }),
}));

jest.mock('@utils/hooks', () => ({
  useCardIcon: jest.fn(() => ({
    cardIconUrl: '',
    color: '',
    bannerUrl: '',
    cardBgStyle: {},
    listThumbnailBgStyle: {},
  })),
}));

jest.mock('@utils/instance', () => ({
  checkIfCompletionDeadlineNotPassed: jest.fn(() => true),
}));

jest.mock('@common/APIService', () => ({
  __esModule: true,
  default: {
    getTraining: jest.fn(() => Promise.resolve(null)),
    getTrainingInstanceSummary: jest.fn(() => Promise.resolve(null)),
  },
}));

import { act } from '@testing-library/react';
import { waitFor } from '@testing-library/dom';
import React from 'react';
import ReactDOM from 'react-dom';
import { IntlProvider } from 'react-intl';
import { useInstancePage } from '@hooks/instance/useInstancePage';
import APIServiceInstance from '@common/APIService';
import { PrimeLearningObject, PrimeLearningObjectInstance } from '@models/PrimeModels';
import * as globalUtils from '@utils/global';
import * as instanceUtils from '@utils/instance';
import * as hooksUtils from '@utils/hooks';
import * as translationService from '@utils/translationService';
import { WAITING } from '@utils/constants';

// Custom renderHook implementation for React Testing Library v9
function renderHook<T, P = any>(
  hookCallback: (props: P) => T,
  options?: { wrapper?: React.ComponentType<any>; initialProps?: P }
) {
  const result: any = { current: null };

  function TestComponent({ hookProps }: { hookProps: P }) {
    result.current = hookCallback(hookProps);
    return null;
  }

  const Wrapper = options?.wrapper || React.Fragment;
  const container = document.createElement('div');

  if (document.body) {
    document.body.appendChild(container);
  }

  const renderComponent = (props: P) => {
    const testElement = React.createElement(TestComponent, { hookProps: props });
    const wrappedElement = React.createElement(Wrapper, null, testElement);
    ReactDOM.render(wrappedElement, container);
  };

  // Initial render
  const initialProps = (options?.initialProps || {}) as P;
  renderComponent(initialProps);

  return {
    result,
    rerender: (newProps?: P) => {
      renderComponent(newProps !== undefined ? newProps : initialProps);
    },
    unmount: () => {
      ReactDOM.unmountComponentAtNode(container);
      if (document.body && document.body.contains(container)) {
        document.body.removeChild(container);
      }
    },
  };
}

// Mock dependencies
const mockGetALMObject = globalUtils.getALMObject as jest.MockedFunction<
  typeof globalUtils.getALMObject
>;
const mockCheckIfCompletionDeadlineNotPassed =
  instanceUtils.checkIfCompletionDeadlineNotPassed as jest.MockedFunction<
    typeof instanceUtils.checkIfCompletionDeadlineNotPassed
  >;
const mockUseCardIcon = hooksUtils.useCardIcon as jest.MockedFunction<
  typeof hooksUtils.useCardIcon
>;
const mockGetPreferredLocalizedMetadata =
  translationService.getPreferredLocalizedMetadata as jest.MockedFunction<
    typeof translationService.getPreferredLocalizedMetadata
  >;
const mockGetTranslation = translationService.GetTranslation as jest.MockedFunction<
  typeof translationService.GetTranslation
>;
const mockFormatMap = translationService.formatMap as any;

// Test data factories
const createMockInstance = (
  overrides?: Partial<PrimeLearningObjectInstance>
): PrimeLearningObjectInstance =>
  ({
    id: 'instance-1',
    state: 'Active',
    locale: 'en-US',
    enrollment: undefined,
    seatLimit: 0,
    seatsAvailable: 0,
    learningObject: { id: 'training-1' } as any,
    ...overrides,
  }) as PrimeLearningObjectInstance;

const createMockTraining = (overrides?: Partial<PrimeLearningObject>): PrimeLearningObject =>
  ({
    id: 'training-1',
    loType: 'course',
    instances: [createMockInstance()],
    localizedMetadata: [
      {
        locale: 'en-US',
        name: 'Test Course',
        description: 'Test Description',
        overview: 'Test Overview',
        richTextOverview: '<p>Test Overview</p>',
      } as any,
    ],
    ...overrides,
  }) as PrimeLearningObject;

const wrapper = ({ children }: any) => <IntlProvider locale="en">{children}</IntlProvider>;

describe('useInstancePage', () => {
  let mockALMObject: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockALMObject = {
      navigateToTrainingOverviewPage: jest.fn(),
    };

    mockGetALMObject.mockReturnValue(mockALMObject);
    mockCheckIfCompletionDeadlineNotPassed.mockReturnValue(true);
    mockUseCardIcon.mockReturnValue({
      cardIconUrl: 'https://example.com/icon.png',
      color: '#FF0000',
      bannerUrl: 'https://example.com/banner.jpg',
      cardBgStyle: {},
      listThumbnailBgStyle: {},
    } as any);
    mockGetPreferredLocalizedMetadata.mockReturnValue({
      name: 'Test Course',
      description: 'Test Description',
      overview: 'Test Overview',
      richTextOverview: '<p>Test Overview</p>',
    } as any);
    mockGetTranslation.mockImplementation((key: string) => key);
    mockFormatMap.mockReturnValue({});
  });

  // ==========================================
  // Initialization & Data Loading
  // ==========================================

  describe('initialization and data loading', () => {
    it('should initialize with loading state', () => {
      (APIServiceInstance.getTraining as jest.Mock).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      const { result } = renderHook(() => useInstancePage('training-1'), { wrapper });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.training).toEqual({});
      expect(result.current.errorCode).toBe('');
    });

    it('should fetch training data on mount', async () => {
      const mockTraining = createMockTraining();
      (APIServiceInstance.getTraining as jest.Mock).mockResolvedValue(mockTraining);

      const { result } = renderHook(() => useInstancePage('training-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(APIServiceInstance.getTraining).toHaveBeenCalledWith('training-1', {
        include: expect.stringContaining('enrollment,instances'),
        useCache: true,
        'filter.ignoreEnhancedLP': false,
      });
      expect(result.current.training).toEqual(mockTraining);
    });

    it('should use custom include parameter if provided', async () => {
      const mockTraining = createMockTraining();
      (APIServiceInstance.getTraining as jest.Mock).mockResolvedValue(mockTraining);

      renderHook(() => useInstancePage('training-1', { include: 'custom-include' }), {
        wrapper,
      });

      await waitFor(() => {
        expect(APIServiceInstance.getTraining).toHaveBeenCalledWith(
          'training-1',
          expect.objectContaining({
            include: 'custom-include',
          })
        );
      });
    });

    it('should handle API error', async () => {
      const error = { status: 404 };
      (APIServiceInstance.getTraining as jest.Mock).mockRejectedValue(error);

      const { result } = renderHook(() => useInstancePage('training-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.errorCode).toBe(404);
      expect(result.current.training).toEqual({});
    });

    it('should refetch when trainingId changes', async () => {
      const mockTraining1 = createMockTraining({ id: 'training-1' });
      const mockTraining2 = createMockTraining({ id: 'training-2' });

      (APIServiceInstance.getTraining as jest.Mock)
        .mockResolvedValueOnce(mockTraining1)
        .mockResolvedValueOnce(mockTraining2);

      const { result, rerender } = renderHook(({ id }) => useInstancePage(id), {
        wrapper,
        initialProps: { id: 'training-1' },
      });

      await waitFor(() => {
        expect(result.current.training.id).toBe('training-1');
      });

      rerender({ id: 'training-2' });

      await waitFor(() => {
        expect(result.current.training.id).toBe('training-2');
      });

      expect(APIServiceInstance.getTraining).toHaveBeenCalledTimes(2);
    });

    it('should handle empty response', async () => {
      (APIServiceInstance.getTraining as jest.Mock).mockResolvedValue(undefined);

      const { result } = renderHook(() => useInstancePage('training-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(true); // Stays loading if no response
      });
    });
  });

  // ==========================================
  // Localized Metadata
  // ==========================================

  describe('localized metadata', () => {
    it('should extract localized metadata', async () => {
      const mockTraining = createMockTraining();
      (APIServiceInstance.getTraining as jest.Mock).mockResolvedValue(mockTraining);

      const { result } = renderHook(() => useInstancePage('training-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.name).toBe('Test Course');
      expect(result.current.description).toBe('Test Description');
      expect(result.current.overview).toBe('Test Overview');
      expect(result.current.richTextOverview).toBe('<p>Test Overview</p>');
    });

    it('should return empty strings if no training', async () => {
      (APIServiceInstance.getTraining as jest.Mock).mockRejectedValue({ status: 404 });
      mockGetPreferredLocalizedMetadata.mockReturnValue({
        name: '',
        description: '',
        overview: '',
        richTextOverview: '',
      } as any);

      const { result } = renderHook(() => useInstancePage('training-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.name).toBe('');
      expect(result.current.description).toBe('');
      expect(result.current.overview).toBe('');
      expect(result.current.richTextOverview).toBe('');
    });

    it('should use user content locale', async () => {
      const mockTraining = createMockTraining();
      (APIServiceInstance.getTraining as jest.Mock).mockResolvedValue(mockTraining);

      renderHook(() => useInstancePage('training-1'), { wrapper });

      await waitFor(() => {
        expect(mockGetPreferredLocalizedMetadata).toHaveBeenCalledWith(expect.anything(), 'en-US');
      });
    });
  });

  // ==========================================
  // Active Instances Filtering
  // ==========================================

  describe('active instances', () => {
    it('should filter active instances with valid deadline', async () => {
      mockCheckIfCompletionDeadlineNotPassed.mockReturnValue(true);
      const mockTraining = createMockTraining({
        instances: [
          createMockInstance({ id: 'i1', state: 'Active' }),
          createMockInstance({ id: 'i2', state: 'Inactive' }),
          createMockInstance({ id: 'i3', state: 'Active' }),
        ],
      });
      (APIServiceInstance.getTraining as jest.Mock).mockResolvedValue(mockTraining);

      const { result } = renderHook(() => useInstancePage('training-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.activeInstances).toHaveLength(2);
      expect(result.current.activeInstances[0].id).toBe('i1');
      expect(result.current.activeInstances[1].id).toBe('i3');
    });

    it('should include enrolled instances regardless of state', async () => {
      mockCheckIfCompletionDeadlineNotPassed.mockReturnValue(false);
      const mockTraining = createMockTraining({
        instances: [
          createMockInstance({
            id: 'i1',
            state: 'Inactive',
            enrollment: { id: 'e1' } as any,
          }),
          createMockInstance({ id: 'i2', state: 'Active' }),
        ],
      });
      (APIServiceInstance.getTraining as jest.Mock).mockResolvedValue(mockTraining);

      const { result } = renderHook(() => useInstancePage('training-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.activeInstances).toHaveLength(1);
      expect(result.current.activeInstances[0].id).toBe('i1');
    });

    it('should return empty array if no instances', async () => {
      const mockTraining = createMockTraining({ instances: [] });
      (APIServiceInstance.getTraining as jest.Mock).mockResolvedValue(mockTraining);

      const { result } = renderHook(() => useInstancePage('training-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.activeInstances).toEqual([]);
    });

    it('should return empty array if instances is undefined', async () => {
      const mockTraining = createMockTraining({ instances: undefined as any });
      (APIServiceInstance.getTraining as jest.Mock).mockResolvedValue(mockTraining);

      const { result } = renderHook(() => useInstancePage('training-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.activeInstances).toEqual([]);
    });

    it('should filter out instances with passed deadline', async () => {
      mockCheckIfCompletionDeadlineNotPassed.mockReturnValueOnce(true).mockReturnValueOnce(false);

      const mockTraining = createMockTraining({
        instances: [
          createMockInstance({ id: 'i1', state: 'Active' }),
          createMockInstance({ id: 'i2', state: 'Active' }),
        ],
      });
      (APIServiceInstance.getTraining as jest.Mock).mockResolvedValue(mockTraining);

      const { result } = renderHook(() => useInstancePage('training-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.activeInstances).toHaveLength(1);
      expect(result.current.activeInstances[0].id).toBe('i1');
    });
  });

  // ==========================================
  // Card Icon & Visual Elements
  // ==========================================

  describe('card icon and visual elements', () => {
    it('should extract card icon data', async () => {
      const mockTraining = createMockTraining();
      (APIServiceInstance.getTraining as jest.Mock).mockResolvedValue(mockTraining);

      const { result } = renderHook(() => useInstancePage('training-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.cardIconUrl).toBe('https://example.com/icon.png');
      expect(result.current.color).toBe('#FF0000');
      expect(result.current.bannerUrl).toBe('https://example.com/banner.jpg');
      expect(result.current.cardBgStyle).toEqual({});
      expect(result.current.listThumbnailBgStyle).toEqual({});
    });

    it('should call useCardIcon with correct size parameter', async () => {
      const mockTraining = createMockTraining();
      (APIServiceInstance.getTraining as jest.Mock).mockResolvedValue(mockTraining);

      renderHook(() => useInstancePage('training-1'), { wrapper });

      await waitFor(() => {
        expect(mockUseCardIcon).toHaveBeenCalledWith(
          expect.anything(),
          expect.any(String) // INSTANCE_CARD_BACKGROUND_SIZE constant
        );
      });
    });
  });

  // ==========================================
  // selectInstanceHandler
  // ==========================================

  describe('selectInstanceHandler', () => {
    it('should navigate to training overview with instance ID', async () => {
      const mockTraining = createMockTraining({ id: 'training-123' });
      (APIServiceInstance.getTraining as jest.Mock).mockResolvedValue(mockTraining);

      const { result } = renderHook(() => useInstancePage('training-123'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.selectInstanceHandler('instance-456');
      });

      expect(mockALMObject.navigateToTrainingOverviewPage).toHaveBeenCalledWith(
        'training-123',
        'instance-456'
      );
    });

    it('should use training ID from loaded data', async () => {
      const mockTraining = createMockTraining({ id: 'loaded-training' });
      (APIServiceInstance.getTraining as jest.Mock).mockResolvedValue(mockTraining);

      const { result } = renderHook(() => useInstancePage('initial-training'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.selectInstanceHandler('instance-1');
      });

      expect(mockALMObject.navigateToTrainingOverviewPage).toHaveBeenCalledWith(
        'loaded-training',
        'instance-1'
      );
    });
  });

  // ==========================================
  // getSummary Function
  // ==========================================

  describe('getSummary', () => {
    it('should fetch instance summary', async () => {
      const mockTraining = createMockTraining();
      (APIServiceInstance.getTraining as jest.Mock).mockResolvedValue(mockTraining);

      const mockSummary = { loInstanceSummary: { id: 'summary-1' } };
      (APIServiceInstance.getTrainingInstanceSummary as jest.Mock).mockResolvedValue(mockSummary);

      const { result } = renderHook(() => useInstancePage('training-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const instance = createMockInstance({
        id: 'instance-1',
        learningObject: { id: 'training-1' } as any,
      });

      const summary = await result.current.getSummary(instance);

      expect(APIServiceInstance.getTrainingInstanceSummary).toHaveBeenCalledWith(
        'training-1',
        'instance-1'
      );
      expect(summary).toEqual({ id: 'summary-1' });
    });

    it('should handle getSummary error', async () => {
      const mockTraining = createMockTraining();
      (APIServiceInstance.getTraining as jest.Mock).mockResolvedValue(mockTraining);
      (APIServiceInstance.getTrainingInstanceSummary as jest.Mock).mockRejectedValue(
        new Error('API Error')
      );

      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      const { result } = renderHook(() => useInstancePage('training-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const instance = createMockInstance();
      const summary = await result.current.getSummary(instance);

      expect(summary).toBeUndefined();
      expect(consoleLogSpy).toHaveBeenCalled();

      consoleLogSpy.mockRestore();
    });
  });

  // ==========================================
  // Helper Functions
  // ==========================================

  describe('extensionLocalizedMetadata', () => {
    it('should extract localized metadata from extension', async () => {
      const mockTraining = createMockTraining();
      (APIServiceInstance.getTraining as jest.Mock).mockResolvedValue(mockTraining);

      mockGetPreferredLocalizedMetadata.mockReturnValue({
        name: 'Extension Name',
      } as any);

      const { result } = renderHook(() => useInstancePage('training-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const extension = {
        localizedMetadata: [{ locale: 'en-US', name: 'Extension Name' }],
      };

      const metadata = result.current.extensionLocalizedMetadata(extension, 'en-US');

      expect(metadata.name).toBe('Extension Name');
    });

    it('should return empty object for undefined extension', async () => {
      const mockTraining = createMockTraining();
      (APIServiceInstance.getTraining as jest.Mock).mockResolvedValue(mockTraining);

      const { result } = renderHook(() => useInstancePage('training-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const metadata = result.current.extensionLocalizedMetadata(undefined, 'en-US');

      expect(metadata).toEqual({});
    });
  });

  describe('loFormat', () => {
    it('should return translated format string', async () => {
      const mockTraining = createMockTraining();
      (APIServiceInstance.getTraining as jest.Mock).mockResolvedValue(mockTraining);

      (translationService as any).formatMap = {
        'self-paced': 'alm.format.selfPaced',
      };
      mockGetTranslation.mockReturnValue('Self Paced');

      const { result } = renderHook(() => useInstancePage('training-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const format = result.current.loFormat('self-paced');

      expect(format).toBe('Self Paced');
    });

    it('should return empty string for undefined format', async () => {
      const mockTraining = createMockTraining();
      (APIServiceInstance.getTraining as jest.Mock).mockResolvedValue(mockTraining);

      const { result } = renderHook(() => useInstancePage('training-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const format = result.current.loFormat('');

      expect(format).toBe('');
    });
  });

  describe('instanceName', () => {
    it('should render instance name link', async () => {
      const mockTraining = createMockTraining();
      (APIServiceInstance.getTraining as jest.Mock).mockResolvedValue(mockTraining);

      const { result } = renderHook(() => useInstancePage('training-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const selectHandler = jest.fn();
      const styles = { instanceName: 'instance-name-class' };

      const element = result.current.instanceName('Instance 1', selectHandler, styles);

      expect(element.props.children).toBe('Instance 1');
      expect(element.props.className).toBe('instance-name-class');
    });
  });

  describe('languageText', () => {
    it('should render language text if language provided', async () => {
      const mockTraining = createMockTraining();
      (APIServiceInstance.getTraining as jest.Mock).mockResolvedValue(mockTraining);

      mockGetTranslation.mockReturnValue('Language');

      const { result } = renderHook(() => useInstancePage('training-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const styles = { languageInfo: 'lang-info', label: 'label', value: 'value' };
      const element = result.current.languageText('English', styles);

      expect(element).toBeTruthy();
    });

    it('should return empty string if no language', async () => {
      const mockTraining = createMockTraining();
      (APIServiceInstance.getTraining as jest.Mock).mockResolvedValue(mockTraining);

      const { result } = renderHook(() => useInstancePage('training-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const styles = {};
      const element = result.current.languageText('', styles);

      expect(element).toBe('');
    });
  });

  describe('seatsAvailableText', () => {
    beforeEach(() => {
      mockGetTranslation.mockImplementation((key: string) => key);
    });

    it('should show seats available when seats > 0', async () => {
      const mockTraining = createMockTraining();
      (APIServiceInstance.getTraining as jest.Mock).mockResolvedValue(mockTraining);

      const { result } = renderHook(() => useInstancePage('training-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const styles = { label: 'label', value: 'value' };
      const element = result.current.seatsAvailableText(10, 5, null, 0, false, styles);

      expect(element).toBeTruthy();
    });

    it('should show waitlist position when enrolled in waiting state', async () => {
      const mockTraining = createMockTraining();
      (APIServiceInstance.getTraining as jest.Mock).mockResolvedValue(mockTraining);

      const { result } = renderHook(() => useInstancePage('training-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const enrollment = { state: WAITING };
      const styles = {};
      const element = result.current.seatsAvailableText(10, 0, enrollment, 3, false, styles);

      expect(element).toBeTruthy();
    });

    it('should show no seats available when seats = 0 and not enrolled', async () => {
      const mockTraining = createMockTraining();
      (APIServiceInstance.getTraining as jest.Mock).mockResolvedValue(mockTraining);

      const { result } = renderHook(() => useInstancePage('training-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const styles = { seatNotAvailable: 'not-available' };
      const element = result.current.seatsAvailableText(10, 0, null, 0, false, styles);

      expect(element).toBeTruthy();
    });

    it('should show seats message for CR/VC module without seat limit', async () => {
      const mockTraining = createMockTraining();
      (APIServiceInstance.getTraining as jest.Mock).mockResolvedValue(mockTraining);

      const { result } = renderHook(() => useInstancePage('training-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const styles = { label: 'label' };
      const element = result.current.seatsAvailableText(0, 0, null, 0, true, styles);

      expect(element).toBeTruthy();
    });

    it('should return empty string when no seat limit and no CR/VC module', async () => {
      const mockTraining = createMockTraining();
      (APIServiceInstance.getTraining as jest.Mock).mockResolvedValue(mockTraining);

      const { result } = renderHook(() => useInstancePage('training-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const styles = {};
      const element = result.current.seatsAvailableText(0, 0, null, 0, false, styles);

      expect(element).toBe('');
    });
  });

  // ==========================================
  // Edge Cases
  // ==========================================

  describe('edge cases', () => {
    it('should handle malformed training data', async () => {
      const malformedTraining = { id: 'training-1' } as PrimeLearningObject;
      (APIServiceInstance.getTraining as jest.Mock).mockResolvedValue(malformedTraining);

      const { result } = renderHook(() => useInstancePage('training-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.activeInstances).toEqual([]);
    });

    it('should handle network timeout', async () => {
      const timeoutError = { status: 'TIMEOUT', message: 'Request timeout' };
      (APIServiceInstance.getTraining as jest.Mock).mockRejectedValue(timeoutError);

      const { result } = renderHook(() => useInstancePage('training-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.errorCode).toBe('TIMEOUT');
    });

    it('should handle concurrent training ID changes', async () => {
      let callCount = 0;
      (APIServiceInstance.getTraining as jest.Mock).mockImplementation(() => {
        callCount++;
        return Promise.resolve(createMockTraining({ id: `training-${callCount}` }));
      });

      const { rerender } = renderHook(({ id }) => useInstancePage(id), {
        wrapper,
        initialProps: { id: 'training-1' },
      });

      rerender({ id: 'training-2' });
      rerender({ id: 'training-3' });

      await waitFor(() => {
        expect(callCount).toBeGreaterThan(0);
      });
    });
  });
});
