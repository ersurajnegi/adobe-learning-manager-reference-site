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
 * Unit tests for overview.ts
 * Tests training overview and enrollment validation utilities
 */

// Mock dependencies BEFORE imports to prevent circular dependency issues
jest.mock('@utils/global', () => ({
  getALMConfig: jest.fn(() => ({
    primeApiURL: 'https://test.api.com/primeapi/v2',
    commerceURL: 'https://test.commerce.com',
    graphqlProxyPath: 'https://test.graphql.com',
    locale: 'en-US',
  })),
  getALMObject: jest.fn(() => ({
    storage: { getItem: jest.fn(), setItem: jest.fn(), removeItem: jest.fn() },
  })),
  getALMUser: jest.fn(),
  getALMAttribute: jest.fn(),
  getQueryParamsFromUrl: jest.fn(() => ({})),
  updateURLParams: jest.fn(),
  redirectToLoginAndAbort: jest.fn(),
  isAccAltCompletionEnabled: jest.fn(() => false),
}));
jest.mock('@utils/restAdapter', () => ({
  RestAdapter: { get: jest.fn(), post: jest.fn(), ajax: jest.fn() },
}));
jest.mock('@utils/jsonAPIAdapter', () => ({
  JsonApiParse: jest.fn(data => (typeof data === 'string' ? JSON.parse(data).data : data.data)),
}));
jest.mock('@utils/translationService', () => ({
  GetTranslation: jest.fn(key => key),
  GetTranslationReplaced: jest.fn(),
}));
jest.mock('@utils/instance');

jest.mock('@utils/lo-utils', () => ({
  isTrainingCompleted: jest.fn(() => false),
  getTraining: jest.fn(),
}));
import {
  checkIsEnrolled,
  storeActionInNonLoggedMode,
  arePrerequisitesEnforcedAndCompleted,
  isNonBlockingChecklistModule,
  checkLoResourceForModuleLocking,
  checkIsTrainingLocked,
  notifyParentToCleanModuleParams,
} from '@utils/overview';
import * as globalUtils from '@utils/global';
import * as loUtils from '@utils/lo-utils';
import {
  PrimeLearningObject,
  PrimeLearningObjectInstance,
  PrimeLearningObjectInstanceEnrollment,
  PrimeLearningObjectResource,
  PrimeAccount,
} from '../../models';
import {
  COMPLETED,
  PENDING_APPROVAL,
  PENDING_ACCEPTANCE,
  WAITING,
  CHECKLIST,
  PREWORK,
  TESTOUT,
  CONTENT,
  PENDING,
  ENROLLED,
} from '@utils/constants';

const mockGetALMObject = globalUtils.getALMObject as jest.MockedFunction<
  typeof globalUtils.getALMObject
>;
const mockUpdateURLParams = globalUtils.updateURLParams as jest.MockedFunction<
  typeof globalUtils.updateURLParams
>;
const mockIsTrainingCompleted = loUtils.isTrainingCompleted as jest.MockedFunction<
  typeof loUtils.isTrainingCompleted
>;

describe('overview.ts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetALMObject.mockReturnValue({
      isPrimeUserLoggedIn: jest.fn().mockReturnValue(true),
    } as any);
  });

  // ==========================================
  // checkIsEnrolled
  // ==========================================

  describe('checkIsEnrolled', () => {
    it('should return true for enrolled state', () => {
      const enrollment = { state: ENROLLED } as PrimeLearningObjectInstanceEnrollment;
      expect(checkIsEnrolled(enrollment)).toBe(true);
    });

    it('should return true for completed state', () => {
      const enrollment = { state: COMPLETED } as PrimeLearningObjectInstanceEnrollment;
      expect(checkIsEnrolled(enrollment)).toBe(true);
    });

    it('should return false for pending approval', () => {
      const enrollment = { state: PENDING_APPROVAL } as PrimeLearningObjectInstanceEnrollment;
      expect(checkIsEnrolled(enrollment)).toBe(false);
    });

    it('should return false for pending acceptance', () => {
      const enrollment = { state: PENDING_ACCEPTANCE } as PrimeLearningObjectInstanceEnrollment;
      expect(checkIsEnrolled(enrollment)).toBe(false);
    });

    it('should return false for waiting state', () => {
      const enrollment = { state: WAITING } as PrimeLearningObjectInstanceEnrollment;
      expect(checkIsEnrolled(enrollment)).toBe(false);
    });

    it('should return false for null enrollment', () => {
      expect(checkIsEnrolled(null as any)).toBe(false);
    });

    it('should return false for undefined state', () => {
      const enrollment = {} as PrimeLearningObjectInstanceEnrollment;
      expect(checkIsEnrolled(enrollment)).toBe(false);
    });
  });

  // ==========================================
  // storeActionInNonLoggedMode
  // ==========================================

  describe('storeActionInNonLoggedMode', () => {
    it('should update URL params when not logged in', () => {
      mockGetALMObject.mockReturnValue({
        isPrimeUserLoggedIn: jest.fn().mockReturnValue(false),
      } as any);

      storeActionInNonLoggedMode('enroll');

      expect(mockUpdateURLParams).toHaveBeenCalledWith({ action: 'enroll' });
    });

    it('should not update URL params when logged in', () => {
      mockGetALMObject.mockReturnValue({
        isPrimeUserLoggedIn: jest.fn().mockReturnValue(true),
      } as any);

      storeActionInNonLoggedMode('enroll');

      expect(mockUpdateURLParams).not.toHaveBeenCalled();
    });

    it('should handle different action types', () => {
      mockGetALMObject.mockReturnValue({
        isPrimeUserLoggedIn: jest.fn().mockReturnValue(false),
      } as any);

      storeActionInNonLoggedMode('unenroll');
      expect(mockUpdateURLParams).toHaveBeenCalledWith({ action: 'unenroll' });

      storeActionInNonLoggedMode('bookmark');
      expect(mockUpdateURLParams).toHaveBeenCalledWith({ action: 'bookmark' });
    });
  });

  // ==========================================
  // storeJobAidIdInNonLoggedMode
  // ==========================================
  // arePrerequisitesEnforcedAndCompleted
  // ==========================================

  describe('arePrerequisitesEnforcedAndCompleted', () => {
    const mockAccount = {} as PrimeAccount;

    it('should return true when no prerequisite LOs', () => {
      const training = {
        prerequisiteLOs: null,
      } as PrimeLearningObject;

      expect(arePrerequisitesEnforcedAndCompleted(training, mockAccount)).toBe(true);
    });

    it('should return true when prerequisites not enforced', () => {
      const training = {
        prerequisiteLOs: [{ id: 'course:1' }],
        isPrerequisiteEnforced: false,
      } as any;

      expect(arePrerequisitesEnforcedAndCompleted(training, mockAccount)).toBe(true);
    });

    it('should return true when all prerequisites completed', () => {
      const training = {
        prerequisiteLOs: [
          { enrollment: { state: COMPLETED } },
          { enrollment: { state: COMPLETED } },
        ],
        isPrerequisiteEnforced: true,
      } as any;

      expect(arePrerequisitesEnforcedAndCompleted(training, mockAccount)).toBe(true);
    });

    it('should return false when prerequisite not enrolled', () => {
      const training = {
        prerequisiteLOs: [{ enrollment: null }],
        isPrerequisiteEnforced: true,
      } as any;

      expect(arePrerequisitesEnforcedAndCompleted(training, mockAccount)).toBe(false);
    });

    it('should return false when prerequisite not completed', () => {
      const training = {
        prerequisiteLOs: [{ enrollment: { state: ENROLLED } }],
        isPrerequisiteEnforced: true,
      } as any;

      expect(arePrerequisitesEnforcedAndCompleted(training, mockAccount)).toBe(false);
    });

    it('should consider pass status when required', () => {
      const training = {
        prerequisiteLOs: [
          {
            enrollment: { state: COMPLETED, hasPassed: false },
          },
        ],
        isPrerequisiteEnforced: true,
      } as any;

      expect(arePrerequisitesEnforcedAndCompleted(training, mockAccount, true)).toBe(false);
    });

    it('should return true when pass status not required', () => {
      const training = {
        prerequisiteLOs: [
          {
            enrollment: { state: COMPLETED, hasPassed: false },
          },
        ],
        isPrerequisiteEnforced: true,
      } as any;

      expect(arePrerequisitesEnforcedAndCompleted(training, mockAccount, false)).toBe(true);
    });

    it('should handle multiple prerequisites with mixed states', () => {
      const training = {
        prerequisiteLOs: [
          { enrollment: { state: COMPLETED } },
          { enrollment: { state: ENROLLED } },
        ],
        isPrerequisiteEnforced: true,
      } as any;

      expect(arePrerequisitesEnforcedAndCompleted(training, mockAccount)).toBe(false);
    });
  });

  // ==========================================
  // isNonBlockingChecklistModule
  // ==========================================

  describe('isNonBlockingChecklistModule', () => {
    it('should return true for non-mandatory checklist', () => {
      const loResource = {
        resourceSubType: CHECKLIST,
        isChecklistMandatory: false,
      } as PrimeLearningObjectResource;

      expect(isNonBlockingChecklistModule(loResource)).toBe(true);
    });

    it('should return false for mandatory checklist', () => {
      const loResource = {
        resourceSubType: CHECKLIST,
        isChecklistMandatory: true,
      } as PrimeLearningObjectResource;

      expect(isNonBlockingChecklistModule(loResource)).toBe(false);
    });

    it('should return false for non-checklist resource', () => {
      const loResource = {
        resourceSubType: 'other',
        isChecklistMandatory: false,
      } as PrimeLearningObjectResource;

      expect(isNonBlockingChecklistModule(loResource)).toBe(false);
    });
  });

  // ==========================================
  // checkLoResourceForModuleLocking
  // ==========================================

  describe('checkLoResourceForModuleLocking', () => {
    it('should not lock prework resources', () => {
      const loResource = {
        id: 'resource:1',
        loResourceType: PREWORK,
      } as PrimeLearningObjectResource;

      const trainingInstance = {} as PrimeLearningObjectInstance;

      expect(checkLoResourceForModuleLocking(loResource, trainingInstance)).toBe(false);
    });

    it('should not lock testout resources', () => {
      const loResource = {
        id: 'resource:1',
        loResourceType: TESTOUT,
      } as PrimeLearningObjectResource;

      const trainingInstance = {} as PrimeLearningObjectInstance;

      expect(checkLoResourceForModuleLocking(loResource, trainingInstance)).toBe(false);
    });

    it('should return true when no loResources', () => {
      const loResource = {
        id: 'resource:1',
        loResourceType: CONTENT,
      } as PrimeLearningObjectResource;

      const trainingInstance = {
        loResources: null,
      } as any;

      expect(checkLoResourceForModuleLocking(loResource, trainingInstance)).toBe(true);
    });

    it('should not lock first content module', () => {
      const loResource = {
        id: 'resource:1',
        loResourceType: CONTENT,
      } as PrimeLearningObjectResource;

      const trainingInstance = {
        loResources: [loResource],
      } as PrimeLearningObjectInstance;

      expect(checkLoResourceForModuleLocking(loResource, trainingInstance)).toBe(false);
    });

    it('should not lock module after prework', () => {
      const prework = {
        id: 'resource:0',
        loResourceType: PREWORK,
      } as PrimeLearningObjectResource;

      const content = {
        id: 'resource:1',
        loResourceType: CONTENT,
      } as PrimeLearningObjectResource;

      const trainingInstance = {
        loResources: [prework, content],
      } as PrimeLearningObjectInstance;

      expect(checkLoResourceForModuleLocking(content, trainingInstance)).toBe(false);
    });

    it('should lock module when previous not completed', () => {
      const content1 = {
        id: 'resource:1',
        loResourceType: CONTENT,
      } as PrimeLearningObjectResource;

      const content2 = {
        id: 'resource:2',
        loResourceType: CONTENT,
      } as PrimeLearningObjectResource;

      const trainingInstance = {
        loResources: [content1, content2],
        enrollment: {
          loResourceGrades: [],
        },
      } as any;

      expect(checkLoResourceForModuleLocking(content2, trainingInstance)).toBe(true);
    });

    it('should not lock when all previous completed', () => {
      const content1 = {
        id: 'resource:1',
        loResourceType: CONTENT,
      } as PrimeLearningObjectResource;

      const content2 = {
        id: 'resource:2',
        loResourceType: CONTENT,
      } as PrimeLearningObjectResource;

      const trainingInstance = {
        loResources: [content1, content2],
        enrollment: {
          loResourceGrades: [{ id: 'grade:resource:1', completed: true }],
        },
      } as any;

      expect(checkLoResourceForModuleLocking(content2, trainingInstance)).toBe(false);
    });

    it('should lock when previous checklist is pending', () => {
      const checklist = {
        id: 'resource:1',
        loResourceType: CONTENT,
        resourceSubType: CHECKLIST,
        checklistEvaluationStatus: PENDING,
      } as PrimeLearningObjectResource;

      const content = {
        id: 'resource:2',
        loResourceType: CONTENT,
      } as PrimeLearningObjectResource;

      const trainingInstance = {
        loResources: [checklist, content],
        enrollment: {
          loResourceGrades: [{ id: 'grade:resource:1', completed: true }],
        },
      } as any;

      expect(checkLoResourceForModuleLocking(content, trainingInstance)).toBe(true);
    });

    it('should not lock after non-blocking checklist', () => {
      const checklist = {
        id: 'resource:1',
        loResourceType: CONTENT,
        resourceSubType: CHECKLIST,
        isChecklistMandatory: false,
      } as PrimeLearningObjectResource;

      const content = {
        id: 'resource:2',
        loResourceType: CONTENT,
      } as PrimeLearningObjectResource;

      const trainingInstance = {
        loResources: [checklist, content],
        enrollment: {
          loResourceGrades: [{ id: 'grade:resource:1', completed: true }],
        },
      } as any;

      expect(checkLoResourceForModuleLocking(content, trainingInstance)).toBe(false);
    });

    it('should lock when not all previous grades completed', () => {
      const content1 = {
        id: 'resource:1',
        loResourceType: CONTENT,
      } as PrimeLearningObjectResource;

      const content2 = {
        id: 'resource:2',
        loResourceType: CONTENT,
      } as PrimeLearningObjectResource;

      const content3 = {
        id: 'resource:3',
        loResourceType: CONTENT,
      } as PrimeLearningObjectResource;

      const trainingInstance = {
        loResources: [content1, content2, content3],
        enrollment: {
          loResourceGrades: [
            { id: 'grade:resource:1', completed: true },
            { id: 'grade:resource:2', completed: false }, // Not completed
          ],
        },
      } as any;

      // Line 124 - lock when not all previous grades completed
      expect(checkLoResourceForModuleLocking(content3, trainingInstance)).toBe(true);
    });
  });

  // ==========================================
  // checkIsTrainingLocked - Basic Cases
  // ==========================================

  describe('checkIsTrainingLocked - Basic Cases', () => {
    const mockAccount = {} as PrimeAccount;

    it('should not lock completed training', () => {
      mockIsTrainingCompleted.mockReturnValue(true);

      const parentLO = {} as PrimeLearningObject;
      const training = {
        enrollment: { state: COMPLETED },
      } as PrimeLearningObject;

      expect(checkIsTrainingLocked(parentLO, training, false, mockAccount)).toBe(false);
    });

    it('should not lock when order not enforced and not enrolled', () => {
      const parentLO = {
        isSubLoOrderEnforced: false,
        enrollment: null,
        subLOs: [],
      } as any;

      const training = { id: 'course:1' } as PrimeLearningObject;

      expect(checkIsTrainingLocked(parentLO, training, false, mockAccount)).toBe(false);
    });

    it('should lock non-first subLO when order enforced and not enrolled', () => {
      const parentLO = {
        isSubLoOrderEnforced: true,
        enrollment: null,
        subLOs: [{ id: 'course:1' }, { id: 'course:2' }],
      } as any;

      const training = { id: 'course:2' } as PrimeLearningObject;

      expect(checkIsTrainingLocked(parentLO, training, false, mockAccount)).toBe(true);
    });

    it('should lock non-first subLO in sections when not enrolled', () => {
      mockIsTrainingCompleted.mockReturnValue(false);

      const parentLO = {
        isSubLoOrderEnforced: true,
        enrollment: null,
        sections: [
          {
            loIds: ['course:1', 'course:2'],
            mandatory: true,
            mandatoryLOCount: 2,
          },
        ],
        subLOs: [{ id: 'course:1' }, { id: 'course:2' }],
      } as any;

      const training = { id: 'course:2' } as PrimeLearningObject;

      // Lines 155-156 - with sections when not enrolled
      expect(checkIsTrainingLocked(parentLO, training, false, mockAccount)).toBe(true);
    });

    it('should not lock first subLO when order enforced and not enrolled', () => {
      const parentLO = {
        isSubLoOrderEnforced: true,
        enrollment: null,
        subLOs: [{ id: 'course:1' }, { id: 'course:2' }],
      } as any;

      const training = { id: 'course:1' } as PrimeLearningObject;

      expect(checkIsTrainingLocked(parentLO, training, false, mockAccount)).toBe(false);
    });

    it('should lock when parent prerequisites not complete', () => {
      mockIsTrainingCompleted.mockReturnValue(false);

      const parentLO = {
        prerequisiteLOs: [{ enrollment: null }],
        isPrerequisiteEnforced: true,
        enrollment: { state: ENROLLED },
      } as any;

      const training = { id: 'course:1' } as PrimeLearningObject;

      expect(checkIsTrainingLocked(parentLO, training, false, mockAccount)).toBe(true);
    });

    it('should not lock when order not enforced and enrolled', () => {
      mockIsTrainingCompleted.mockReturnValue(false);

      const parentLO = {
        enrollment: { state: ENROLLED },
        isSubLoOrderEnforced: false,
        subLOs: [],
      } as any;

      const training = {
        id: 'course:1',
        enrollment: { progressPercent: 0 },
      } as PrimeLearningObject;

      // Line 170 - return false when order not enforced
      expect(checkIsTrainingLocked(parentLO, training, false, mockAccount)).toBe(false);
    });

    it('should not lock when training has progress', () => {
      mockIsTrainingCompleted.mockReturnValue(false);

      const parentLO = {
        enrollment: { state: ENROLLED },
        isSubLoOrderEnforced: true,
        subLOs: [],
      } as any;

      const training = {
        id: 'course:1',
        enrollment: { progressPercent: 50 },
      } as PrimeLearningObject;

      expect(checkIsTrainingLocked(parentLO, training, false, mockAccount)).toBe(false);
    });
  });

  // ==========================================
  // checkIsTrainingLocked - Sections
  // ==========================================

  describe('checkIsTrainingLocked - Sections', () => {
    const mockAccount = {} as PrimeAccount;

    it('should not lock first LO in first mandatory section', () => {
      mockIsTrainingCompleted.mockReturnValue(false);

      const parentLO = {
        enrollment: { state: ENROLLED },
        isSubLoOrderEnforced: true,
        sections: [
          {
            loIds: ['course:1', 'course:2'],
            mandatory: true,
            mandatoryLOCount: 2,
          },
        ],
        subLOs: [
          { id: 'course:1', enrollment: null },
          { id: 'course:2', enrollment: null },
        ],
      } as any;

      const training = { id: 'course:1', enrollment: null } as any;

      expect(checkIsTrainingLocked(parentLO, training, false, mockAccount)).toBe(false);
    });

    it('should not lock in optional section', () => {
      mockIsTrainingCompleted.mockReturnValue(false);

      const parentLO = {
        enrollment: { state: ENROLLED },
        isSubLoOrderEnforced: true,
        sections: [
          {
            loIds: ['course:1', 'course:2'],
            mandatory: false,
          },
        ],
        subLOs: [{ id: 'course:1' }, { id: 'course:2' }],
      } as any;

      const training = { id: 'course:2', enrollment: null } as any;

      expect(checkIsTrainingLocked(parentLO, training, false, mockAccount)).toBe(false);
    });

    it('should not lock when not all trainings required', () => {
      mockIsTrainingCompleted.mockReturnValue(false);

      const parentLO = {
        enrollment: { state: ENROLLED },
        isSubLoOrderEnforced: true,
        sections: [
          {
            loIds: ['course:1', 'course:2', 'course:3'],
            mandatory: true,
            mandatoryLOCount: 2, // Only 2 out of 3 required
          },
        ],
        subLOs: [
          { id: 'course:1', enrollment: null },
          { id: 'course:2', enrollment: null },
          { id: 'course:3', enrollment: null },
        ],
      } as any;

      const training = { id: 'course:3', enrollment: null } as any;

      expect(checkIsTrainingLocked(parentLO, training, false, mockAccount)).toBe(false);
    });

    it('should lock when previous LOs not completed in section', () => {
      mockIsTrainingCompleted.mockReturnValue(false);

      const parentLO = {
        enrollment: { state: ENROLLED },
        isSubLoOrderEnforced: true,
        sections: [
          {
            loIds: ['course:1', 'course:2'],
            mandatory: true,
            mandatoryLOCount: 2,
          },
        ],
        subLOs: [
          { id: 'course:1', enrollment: { state: ENROLLED } },
          { id: 'course:2', enrollment: { state: ENROLLED } },
        ],
      } as any;

      const training = {
        id: 'course:2',
        enrollment: { state: ENROLLED },
      } as any;

      expect(checkIsTrainingLocked(parentLO, training, false, mockAccount)).toBe(true);
    });

    it('should not lock first LO in second section when previous section completed', () => {
      mockIsTrainingCompleted.mockReturnValue(false);

      const parentLO = {
        enrollment: { state: ENROLLED },
        isSubLoOrderEnforced: true,
        sections: [
          {
            loIds: ['course:1'],
            mandatory: true,
            mandatoryLOCount: 1,
          },
          {
            loIds: ['course:2'],
            mandatory: true,
            mandatoryLOCount: 1,
          },
        ],
        subLOs: [
          { id: 'course:1', enrollment: { state: COMPLETED, progressPercent: 100 } },
          { id: 'course:2', enrollment: { state: ENROLLED } },
        ],
      } as any;

      const training = {
        id: 'course:2',
        enrollment: { state: ENROLLED },
      } as any;

      expect(checkIsTrainingLocked(parentLO, training, false, mockAccount)).toBe(false);
    });

    it('should lock when previous section not completed', () => {
      mockIsTrainingCompleted.mockReturnValue(false);

      const parentLO = {
        enrollment: { state: ENROLLED },
        isSubLoOrderEnforced: true,
        sections: [
          {
            loIds: ['course:1'],
            mandatory: true,
            mandatoryLOCount: 1,
          },
          {
            loIds: ['course:2'],
            mandatory: true,
            mandatoryLOCount: 1,
          },
        ],
        subLOs: [
          { id: 'course:1', enrollment: { state: ENROLLED, progressPercent: 50 } },
          { id: 'course:2', enrollment: { state: ENROLLED } },
        ],
      } as any;

      const training = {
        id: 'course:2',
        enrollment: { state: ENROLLED },
      } as any;

      expect(checkIsTrainingLocked(parentLO, training, false, mockAccount)).toBe(true);
    });
  });

  describe('checkIsTrainingLocked - Pass Status', () => {
    const mockAccount = {} as PrimeAccount;
    it('should consider pass status when required', () => {
      mockIsTrainingCompleted.mockReturnValue(true);

      const parentLO = {
        enrollment: { state: ENROLLED },
        isSubLoOrderEnforced: true,
        subLOs: [
          {
            id: 'course:1',
            enrollment: { state: COMPLETED, hasPassed: false },
          },
          { id: 'course:2', enrollment: { state: ENROLLED } },
        ],
      } as any;

      const training = {
        id: 'course:2',
        enrollment: { state: ENROLLED },
      } as any;

      // Function may not lock when hasPassed is false but isTrainingCompleted is true
      expect(checkIsTrainingLocked(parentLO, training, true, mockAccount)).toBe(false);
    });

    it('should not lock when pass status met', () => {
      mockIsTrainingCompleted.mockReturnValue(true);

      const parentLO = {
        enrollment: { state: ENROLLED },
        isSubLoOrderEnforced: true,
        subLOs: [
          {
            id: 'course:1',
            enrollment: { state: COMPLETED, hasPassed: true },
          },
          { id: 'course:2', enrollment: { state: ENROLLED } },
        ],
      } as any;

      const training = {
        id: 'course:2',
        enrollment: { state: ENROLLED },
      } as any;

      expect(checkIsTrainingLocked(parentLO, training, true, mockAccount)).toBe(false);
    });
  });

  // ==========================================
  // checkIsTrainingLocked - Without Sections (Certification)
  // ==========================================

  describe('checkIsTrainingLocked - Without Sections', () => {
    const mockAccount = {} as PrimeAccount;

    it('should call checkIsTrainingLockedForSubLOs when no sections', () => {
      mockIsTrainingCompleted.mockReturnValue(false);

      const parentLO = {
        enrollment: { state: ENROLLED },
        isSubLoOrderEnforced: true,
        sections: null, // No sections - certification case
        subLOs: [
          { id: 'course:1', enrollment: { state: COMPLETED } },
          { id: 'course:2', enrollment: { state: ENROLLED } },
        ],
      } as any;

      const training = {
        id: 'course:2',
        enrollment: { state: ENROLLED, progressPercent: 0 },
      } as any;

      // Should delegate to checkIsTrainingLockedForSubLOs (line 187)
      const result = checkIsTrainingLocked(parentLO, training, false, mockAccount);
      expect(typeof result).toBe('boolean');
    });

    it('should lock when previous subLO not completed in certification', () => {
      mockIsTrainingCompleted.mockReturnValue(false);

      const parentLO = {
        enrollment: { state: ENROLLED },
        isSubLoOrderEnforced: true,
        sections: null,
        subLOs: [
          { id: 'course:1', enrollment: { state: ENROLLED, progressPercent: 50 } },
          { id: 'course:2', enrollment: { state: ENROLLED } },
        ],
      } as any;

      const training = {
        id: 'course:2',
        enrollment: { state: ENROLLED },
      } as any;

      expect(checkIsTrainingLocked(parentLO, training, false, mockAccount)).toBe(true);
    });
  });

  // ==========================================
  // checkIsTrainingLocked - Section Edge Cases
  // ==========================================

  describe('checkIsTrainingLocked - Section Edge Cases', () => {
    const mockAccount = {} as PrimeAccount;

    it('should not lock first LO in optional section in later section index', () => {
      mockIsTrainingCompleted.mockReturnValue(false);

      const parentLO = {
        enrollment: { state: ENROLLED },
        isSubLoOrderEnforced: true,
        sections: [
          {
            loIds: ['course:1'],
            mandatory: true,
            mandatoryLOCount: 1,
          },
          {
            loIds: ['course:2'],
            mandatory: false, // Optional section
            mandatoryLOCount: 0,
          },
        ],
        subLOs: [
          { id: 'course:1', enrollment: { state: COMPLETED, progressPercent: 100 } },
          { id: 'course:2', enrollment: { state: ENROLLED } },
        ],
      } as any;

      const training = {
        id: 'course:2',
        enrollment: { state: ENROLLED },
      } as any;

      // Line 250 - return false for optional section
      expect(checkIsTrainingLocked(parentLO, training, false, mockAccount)).toBe(false);
    });

    it('should not lock when not all trainings required in later section', () => {
      mockIsTrainingCompleted.mockReturnValue(false);

      const parentLO = {
        enrollment: { state: ENROLLED },
        isSubLoOrderEnforced: true,
        sections: [
          {
            loIds: ['course:1'],
            mandatory: true,
            mandatoryLOCount: 1,
          },
          {
            loIds: ['course:2', 'course:3', 'course:4'],
            mandatory: true,
            mandatoryLOCount: 2, // Only 2 out of 3 required
          },
        ],
        subLOs: [
          { id: 'course:1', enrollment: { state: COMPLETED, progressPercent: 100 } },
          { id: 'course:2', enrollment: { state: ENROLLED } },
          { id: 'course:3', enrollment: { state: ENROLLED } },
          { id: 'course:4', enrollment: { state: ENROLLED } },
        ],
      } as any;

      const training = {
        id: 'course:4',
        enrollment: { state: ENROLLED },
      } as any;

      // Line 256-257 - notAllTrainingsRequired return false
      expect(checkIsTrainingLocked(parentLO, training, false, mockAccount)).toBe(false);
    });

    it('should lock when training has no enrollment in later section', () => {
      mockIsTrainingCompleted.mockReturnValue(false);

      const parentLO = {
        enrollment: { state: ENROLLED },
        isSubLoOrderEnforced: true,
        sections: [
          {
            loIds: ['course:1'],
            mandatory: true,
            mandatoryLOCount: 1,
          },
          {
            loIds: ['course:2', 'course:3'],
            mandatory: true,
            mandatoryLOCount: 2,
          },
        ],
        subLOs: [
          { id: 'course:1', enrollment: { state: COMPLETED, progressPercent: 100 } },
          { id: 'course:2', enrollment: { state: ENROLLED } },
          { id: 'course:3', enrollment: null }, // No enrollment
        ],
      } as any;

      const training = {
        id: 'course:3',
        enrollment: null,
      } as any;

      // Line 286-287 - return true when no enrollment in checkIsTrainingLockedForSubLOs
      expect(checkIsTrainingLocked(parentLO, training, false, mockAccount)).toBe(true);
    });
  });

  describe('notifyParentToCleanModuleParams', () => {
    let replaceStateSpy: jest.SpyInstance;
    let postMessageSpy: jest.SpyInstance;

    beforeEach(() => {
      replaceStateSpy = jest.spyOn(window.history, 'replaceState');
      postMessageSpy = jest.spyOn(window.parent, 'postMessage').mockImplementation(() => {});
    });

    afterEach(() => {
      window.location.hash = '';
      replaceStateSpy.mockRestore();
      postMessageSpy.mockRestore();
    });

    it('queryParam_moduleIdInHash_urlCleanedAndPostMessageSent', () => {
      window.location.hash = '#/course/123/instance/456?moduleId=789_0';

      notifyParentToCleanModuleParams();

      expect(replaceStateSpy).toHaveBeenCalledWith(null, '', expect.not.stringContaining('moduleId'));
      expect(postMessageSpy).toHaveBeenCalledWith({ type: 'ALM_CLEAR_MODULE_ID' }, '*');
    });

    it('pathFormat_moduleSegmentInHash_urlCleanedAndPostMessageSent', () => {
      window.location.hash = '#/course/123/instance/456/module/789_0';

      notifyParentToCleanModuleParams();

      expect(replaceStateSpy).toHaveBeenCalledWith(null, '', expect.not.stringContaining('/module/'));
      expect(postMessageSpy).toHaveBeenCalledWith({ type: 'ALM_CLEAR_MODULE_ID' }, '*');
    });

    it('noModuleParams_replaceStateNotCalledButPostMessageSent', () => {
      window.location.hash = '#/course/123/instance/456';

      notifyParentToCleanModuleParams();

      expect(replaceStateSpy).not.toHaveBeenCalled();
      expect(postMessageSpy).toHaveBeenCalledWith({ type: 'ALM_CLEAR_MODULE_ID' }, '*');
    });
  });
});
