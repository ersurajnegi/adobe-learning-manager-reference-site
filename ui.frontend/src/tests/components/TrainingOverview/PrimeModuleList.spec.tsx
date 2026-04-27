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
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import PrimeModuleList from '@components/TrainingOverview/PrimeModuleList/PrimeModuleList';
import { PrimeLearningObject, PrimeLearningObjectInstance, PrimeLearningObjectResource } from '@models/PrimeModels';

jest.mock('@contextProviders/userContextProvider', () => ({
  useUserContext: () => ({
    user: {
      id: 'user1',
      account: { id: 'account1', shouldPreReqConsiderPassStatus: false },
    },
  }),
}));

jest.mock('@utils/hooks', () => ({
  filterLoReourcesBasedOnResourceType: (instance: any, type: string) => {
    if (type === 'Content') {
      return instance.loResources?.filter((r: any) => r.loResourceType === 'Content') || [];
    }
    return instance.loResources || [];
  },
  filterChecklistResources: (instance: any) =>
    instance.loResources?.filter(
      (r: any) => r.resourceType === 'Activity' && r.resourceSubType === 'Checklist'
    ) || [],
}));

jest.mock('@utils/overview', () => ({
  arePrerequisitesEnforcedAndCompleted: () => true,
  checkLoResourceForModuleLocking: () => false,
  isNonBlockingChecklistModule: () => false,
}));

jest.mock('@components/TrainingOverview/PrimeModuleItem', () => ({
  PrimeModuleItem: ({ loResource, canPlay }: any) => (
    <div data-testid={`module-item-${loResource.id}`} data-can-play={canPlay}>
      Module: {loResource.localizedMetadata[0].name}
    </div>
  ),
}));

// ─── Fixtures ────────────────────────────────────────────────────────────────

const createMockLoResource = (
  id: string,
  name: string,
  loResourceType = 'Content'
): PrimeLearningObjectResource =>
  ({
    id,
    localizedMetadata: [{ locale: 'en-US', name, description: '' }],
    loResourceType,
    resourceType: 'Activity',
    resourceSubType: '',
    mandatory: true,
  } as any);

const createMockTraining = (overrides: any = {}): PrimeLearningObject =>
  ({
    id: 'training1',
    loType: 'course',
    localizedMetadata: [{ locale: 'en-US', name: 'Test Training', description: '', overview: '' }],
    isSubLoOrderEnforced: false,
    enrollment: null,
    instances: [],
    subLOs: [],
    sections: [],
    ...overrides,
  } as any);

const createMockInstance = (
  loResources: PrimeLearningObjectResource[] = []
): PrimeLearningObjectInstance =>
  ({
    id: 'instance1',
    state: 'ACTIVE',
    localizedMetadata: [{ locale: 'en-US', name: 'Instance 1' }],
    isFlexible: false,
    loResources,
    enrollment: null,
  } as any);

const defaultProps = {
  training: createMockTraining(),
  trainingInstance: createMockInstance(),
  launchPlayerHandler: jest.fn(),
  loResources: [],
  isPartOfLP: false,
  isPartOfCertification: false,
  isParentLOEnrolled: false,
  isRootLOEnrolled: false,
  isRootLoPreviewEnabled: false,
  isParentFlexLP: false,
  parentHasEnforcedPrerequisites: false,
  parentHasSubLoOrderEnforced: false,
  isContent: true,
  isPreviewEnabled: false,
  updateFileSubmissionUrl: jest.fn(),
  lastPlayingLoResourceId: '',
  setTimeBetweenAttemptEnabled: jest.fn(),
  timeBetweenAttemptEnabled: false,
  isLocked: false,
  updatePlayerLoState: jest.fn(),
  childLpId: '',
  isRootLoCompleted: false,
  setEnrollViaModuleClick: jest.fn(),
  isPartOfFirstChildTraining: false,
};

const renderComponent = (props: any = {}) =>
  render(<PrimeModuleList {...defaultProps} {...props} />);

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('PrimeModuleList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('emptyLoResources_rendersEmptyList', () => {
      const { container } = renderComponent({ loResources: [] });
      const list = container.querySelector('ul');
      expect(list).toBeTruthy();
      expect(list?.children.length).toBe(0);
    });

    it('multipleLoResources_allModulesRendered', () => {
      const loResources = [
        createMockLoResource('module1', 'Module 1'),
        createMockLoResource('module2', 'Module 2'),
        createMockLoResource('module3', 'Module 3'),
      ];

      renderComponent({ loResources });

      expect(screen.getByTestId('module-item-module1')).toHaveTextContent('Module: Module 1');
      expect(screen.getByTestId('module-item-module2')).toHaveTextContent('Module: Module 2');
      expect(screen.getByTestId('module-item-module3')).toHaveTextContent('Module: Module 3');
    });
  });

  describe('Module Item Rendering', () => {
    it('twoModules_renderedAsTwoListItems', () => {
      const loResources = [
        createMockLoResource('module1', 'Module 1'),
        createMockLoResource('module2', 'Module 2'),
      ];
      const { container } = renderComponent({ loResources });
      expect(container.querySelectorAll('li').length).toBe(2);
    });

    it('twoModules_eachHasHrSeparatorWithCorrectClass', () => {
      const loResources = [
        createMockLoResource('module1', 'Module 1'),
        createMockLoResource('module2', 'Module 2'),
      ];
      const { container } = renderComponent({ loResources });
      const separators = container.querySelectorAll('hr');
      expect(separators.length).toBe(2);
      separators.forEach(sep => expect(sep.className).toContain('loResourceSeparator'));
    });
  });

  describe('Module Locking — isLocked prop', () => {
    it('isLockedTrue_allModulesReceiveCanPlayFalse', () => {
      const loResources = [
        createMockLoResource('module1', 'Module 1'),
        createMockLoResource('module2', 'Module 2'),
      ];

      renderComponent({ loResources, isLocked: true });

      expect(screen.getByTestId('module-item-module1').getAttribute('data-can-play')).toBe('false');
      expect(screen.getByTestId('module-item-module2').getAttribute('data-can-play')).toBe('false');
    });
  });

  describe('Module Locking — Order Enforcement', () => {
    it('noOrderEnforcement_allModulesUnlocked', () => {
      const loResources = [
        createMockLoResource('module1', 'Module 1'),
        createMockLoResource('module2', 'Module 2'),
      ];

      renderComponent({
        loResources,
        training: createMockTraining({ isSubLoOrderEnforced: false }),
        parentHasSubLoOrderEnforced: false,
      });

      expect(screen.getByTestId('module-item-module1').getAttribute('data-can-play')).toBe('true');
      expect(screen.getByTestId('module-item-module2').getAttribute('data-can-play')).toBe('true');
    });
  });

  describe('Module Locking — First Child Training', () => {
    it('notFirstChildTraining_parentOrderEnforced_allModulesLocked', () => {
      const loResources = [createMockLoResource('module1', 'Module 1')];

      renderComponent({
        loResources,
        isPartOfLP: true,
        isRootLOEnrolled: false,
        parentHasSubLoOrderEnforced: true,
        isPartOfFirstChildTraining: false,
      });

      expect(screen.getByTestId('module-item-module1').getAttribute('data-can-play')).toBe('false');
    });

    it('firstChildTraining_trainingOrderEnforced_firstModuleUnlocked_secondLocked', () => {
      const loResources = [
        createMockLoResource('module1', 'Module 1', 'Content'),
        createMockLoResource('module2', 'Module 2', 'Content'),
      ];
      const instance = createMockInstance(loResources);

      renderComponent({
        loResources,
        training: createMockTraining({ isSubLoOrderEnforced: true }),
        trainingInstance: instance,
        isPartOfLP: true,
        isRootLOEnrolled: false,
        parentHasSubLoOrderEnforced: true,
        isPartOfFirstChildTraining: true,
      });

      expect(screen.getByTestId('module-item-module1').getAttribute('data-can-play')).toBe('true');
      expect(screen.getByTestId('module-item-module2').getAttribute('data-can-play')).toBe('false');
    });

    it('firstChildTraining_noTrainingOrderEnforced_allModulesUnlocked', () => {
      const loResources = [
        createMockLoResource('module1', 'Module 1', 'Content'),
        createMockLoResource('module2', 'Module 2', 'Content'),
      ];
      const instance = createMockInstance(loResources);

      renderComponent({
        loResources,
        training: createMockTraining({ isSubLoOrderEnforced: false }),
        trainingInstance: instance,
        isPartOfLP: true,
        isRootLOEnrolled: false,
        parentHasSubLoOrderEnforced: true,
        isPartOfFirstChildTraining: true,
      });

      expect(screen.getByTestId('module-item-module1').getAttribute('data-can-play')).toBe('true');
      expect(screen.getByTestId('module-item-module2').getAttribute('data-can-play')).toBe('true');
    });
  });

  describe('Module Locking — Resource Types', () => {
    it('preworkResourceType_orderEnforced_moduleUnlocked', () => {
      const loResources = [createMockLoResource('module1', 'Prework', 'Prework')];
      const instance = createMockInstance(loResources);

      renderComponent({
        loResources,
        training: createMockTraining({ isSubLoOrderEnforced: true }),
        trainingInstance: instance,
      });

      expect(screen.getByTestId('module-item-module1').getAttribute('data-can-play')).toBe('true');
    });

    it('testoutResourceType_orderEnforced_moduleUnlocked', () => {
      const loResources = [createMockLoResource('module1', 'Testout', 'Testout')];
      const instance = createMockInstance(loResources);

      renderComponent({
        loResources,
        training: createMockTraining({ isSubLoOrderEnforced: true }),
        trainingInstance: instance,
      });

      expect(screen.getByTestId('module-item-module1').getAttribute('data-can-play')).toBe('true');
    });
  });

  describe('Module Locking — Enrollment', () => {
    it('noEnrollment_orderEnforced_firstModuleUnlocked', () => {
      const loResources = [createMockLoResource('module1', 'Module 1', 'Content')];
      const instance = createMockInstance(loResources);
      instance.enrollment = null;

      renderComponent({
        loResources,
        training: createMockTraining({ isSubLoOrderEnforced: true }),
        trainingInstance: instance,
        isParentLOEnrolled: false,
      });

      expect(screen.getByTestId('module-item-module1').getAttribute('data-can-play')).toBe('true');
    });

    it('noEnrollment_orderEnforced_secondModuleLocked', () => {
      const loResources = [
        createMockLoResource('module1', 'Module 1', 'Content'),
        createMockLoResource('module2', 'Module 2', 'Content'),
      ];
      const instance = createMockInstance(loResources);
      instance.enrollment = null;

      renderComponent({
        loResources,
        training: createMockTraining({ isSubLoOrderEnforced: true }),
        trainingInstance: instance,
        isParentLOEnrolled: false,
      });

      expect(screen.getByTestId('module-item-module2').getAttribute('data-can-play')).toBe('false');
    });
  });

  describe('Module Locking — Checklist', () => {
    it('previousModuleIsChecklist_noOrderEnforcement_nextModuleUnlocked', () => {
      const checklistResource = createMockLoResource('checklist1', 'Checklist', 'Content');
      checklistResource.resourceType = 'Activity';
      checklistResource.resourceSubType = 'Checklist';
      const contentResource = createMockLoResource('module1', 'Module 1', 'Content');
      const loResources = [checklistResource, contentResource];
      const instance = createMockInstance(loResources);
      instance.enrollment = { loResourceGrades: [] } as any;

      renderComponent({
        loResources,
        training: createMockTraining({ isSubLoOrderEnforced: false }),
        trainingInstance: instance,
        isParentLOEnrolled: true,
      });

      expect(screen.getByTestId('module-item-module1').getAttribute('data-can-play')).toBe('true');
    });

    it('previousChecklistPassed_orderEnforced_nextModuleUnlocked', () => {
      const checklistResource = createMockLoResource('checklist1', 'Checklist', 'Content');
      checklistResource.resourceType = 'Activity';
      checklistResource.resourceSubType = 'Checklist';
      const contentResource = createMockLoResource('module1', 'Module 1', 'Content');
      const loResources = [checklistResource, contentResource];
      const instance = createMockInstance(loResources);
      instance.enrollment = {
        loResourceGrades: [{ id: 'grade-checklist1', hasPassed: true }],
      } as any;

      renderComponent({
        loResources,
        training: createMockTraining({ isSubLoOrderEnforced: true }),
        trainingInstance: instance,
        isParentLOEnrolled: true,
      });

      expect(screen.getByTestId('module-item-module1').getAttribute('data-can-play')).toBe('true');
    });
  });

  describe('Module Locking — Prerequisites', () => {
    afterEach(() => {
      jest.requireMock('@utils/overview').arePrerequisitesEnforcedAndCompleted = jest.fn(() => true);
    });

    it('prerequisitesEnforcedAndNotCompleted_moduleLocked', () => {
      jest.requireMock('@utils/overview').arePrerequisitesEnforcedAndCompleted = jest.fn(
        () => false
      );
      const loResources = [
        createMockLoResource('module1', 'Module 1', 'Content'),
        createMockLoResource('module2', 'Module 2', 'Content'),
      ];
      const instance = createMockInstance(loResources);
      instance.enrollment = { loResourceGrades: [] } as any;

      renderComponent({
        loResources,
        training: createMockTraining({ isSubLoOrderEnforced: true }),
        trainingInstance: instance,
        isParentLOEnrolled: true,
      });

      expect(screen.getByTestId('module-item-module2').getAttribute('data-can-play')).toBe('false');
    });
  });

  describe('Module Locking — Mixed Resource Types', () => {
    it('preworkAndTestout_alwaysUnlocked_evenWithEnrollmentAndOrderEnforced', () => {
      const preworkResource = createMockLoResource('prework1', 'Prework', 'Prework');
      const contentResource1 = createMockLoResource('module1', 'Module 1', 'Content');
      const contentResource2 = createMockLoResource('module2', 'Module 2', 'Content');
      const testoutResource = createMockLoResource('testout1', 'Testout', 'Testout');
      const loResources = [preworkResource, contentResource1, contentResource2, testoutResource];
      const instance = createMockInstance(loResources);
      instance.enrollment = { loResourceGrades: [{ id: 'module1', hasPassed: true }] } as any;

      renderComponent({
        loResources,
        training: createMockTraining({ isSubLoOrderEnforced: true }),
        trainingInstance: instance,
        isParentLOEnrolled: true,
      });

      expect(screen.getByTestId('module-item-prework1').getAttribute('data-can-play')).toBe('true');
      expect(screen.getByTestId('module-item-testout1').getAttribute('data-can-play')).toBe('true');
    });
  });
});
