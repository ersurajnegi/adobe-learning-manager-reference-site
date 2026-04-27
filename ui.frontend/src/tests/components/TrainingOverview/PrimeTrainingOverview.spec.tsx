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
import PrimeTrainingOverview from '@components/TrainingOverview/PrimeTrainingOverview/PrimeTrainingOverview';
import { PrimeLearningObject } from '@models/PrimeModels';

jest.mock('@contextProviders/userContextProvider', () => ({
  useUserContext: () => ({
    user: {
      id: 'user1',
      account: { id: 'account1', shouldPreReqConsiderPassStatus: false },
    },
  }),
}));

jest.mock('@utils/hooks', () => ({
  getCoursesInsideFlexLP: (training: any) =>
    training.subLOs?.filter((lo: any) => lo.loType === 'course') || [],
  hasFlexibleChildLP: () => false,
}));

jest.mock('@utils/overview', () => ({
  checkIsTrainingLocked: () => false,
}));

jest.mock('@components/TrainingOverview/PrimeCourseItemContainer', () => ({
  PrimeCourseItemContainer: ({ training }: any) => (
    <div data-testid={`course-container-${training.id}`}>
      Course: {training.localizedMetadata[0].name}
    </div>
  ),
}));

jest.mock('@components/TrainingOverview/PrimeLPItemContainer', () => ({
  PrimeLPItemContainer: ({ training }: any) => (
    <div data-testid={`lp-container-${training.id}`}>
      LP: {training.localizedMetadata[0].name}
    </div>
  ),
}));

// ─── Fixtures ────────────────────────────────────────────────────────────────

const makeCourse = (id: string, name: string): PrimeLearningObject =>
  ({
    id,
    loType: 'course',
    localizedMetadata: [{ locale: 'en-US', name, description: '', overview: '' }],
    enrollment: null,
    instances: [{ id: `${id}-instance`, state: 'ACTIVE', localizedMetadata: [], isFlexible: false } as any],
    duration: 3600,
    hasPreview: false,
    loFormat: 'Self Paced',
    isExternal: false,
    completionDateSameAsApprovalDate: false,
    dateCreated: '2024-01-01T00:00:00Z',
    isSubLoOrderEnforced: false,
    subLOs: [],
    sections: [],
    prerequisiteLOs: [],
    prequisiteConstraints: [],
  } as any);

const makeLP = (id: string, name: string, isFlexible = false): PrimeLearningObject =>
  ({
    id,
    loType: 'learningProgram',
    localizedMetadata: [{ locale: 'en-US', name, description: '', overview: '' }],
    enrollment: null,
    instances: [{ id: `${id}-instance`, state: 'ACTIVE', localizedMetadata: [], isFlexible } as any],
    duration: 7200,
    hasPreview: false,
    loFormat: 'Self Paced',
    isExternal: false,
    completionDateSameAsApprovalDate: false,
    dateCreated: '2024-01-01T00:00:00Z',
    isSubLoOrderEnforced: false,
    subLOs: [],
    sections: [],
    prerequisiteLOs: [],
    prequisiteConstraints: [],
  } as any);

const defaultProps = {
  trainings: [] as PrimeLearningObject[],
  launchPlayerHandler: jest.fn(),
  isPartOfLP: false,
  isPartOfCertification: false,
  isParentLOEnrolled: false,
  isRootLOEnrolled: false,
  isRootLoPreviewEnabled: false,
  showMandatoryLabel: false,
  isPreviewEnabled: false,
  isFlexLPValidationEnabled: false,
  updateFileSubmissionUrl: jest.fn(),
  parentLO: makeLP('parent1', 'Parent LP'),
  parentLoName: 'Parent LP',
  setTimeBetweenAttemptEnabled: jest.fn(),
  timeBetweenAttemptEnabled: false,
  setSelectedInstanceInfo: jest.fn(),
  isFlexible: false,
  flexLPTraining: false,
  courseInstanceMapping: {},
  notes: [],
  updateNote: jest.fn(),
  deleteNote: jest.fn(),
  downloadNotes: jest.fn(),
  sendNotesOnMail: jest.fn(),
  lastPlayingCourseId: '',
  lastPlayingLoResourceId: '',
  selectedLoList: {},
  showUnselectedLOs: false,
  parentHasEnforcedPrerequisites: false,
  updatePlayerLoState: jest.fn(),
  isRootLoCompleted: false,
  parentHasSubLoOrderEnforced: false,
  setEnrollViaModuleClick: jest.fn(),
  firstChildId: '',
  discussionUtils: {},
  courseInstanceMap: {},
};

const renderComponent = (props: any = {}) =>
  render(<PrimeTrainingOverview {...defaultProps} {...props} />);

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('PrimeTrainingOverview', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Course Rendering', () => {
    it('singleCourse_rendered', () => {
      renderComponent({ trainings: [makeCourse('course1', 'Test Course')] });
      expect(screen.getByTestId('course-container-course1')).toHaveTextContent('Course: Test Course');
    });

    it('multipleCourses_allRendered', () => {
      const courses = [makeCourse('c1', 'Course 1'), makeCourse('c2', 'Course 2'), makeCourse('c3', 'Course 3')];
      renderComponent({ trainings: courses });
      expect(screen.getByTestId('course-container-c1')).toHaveTextContent('Course: Course 1');
      expect(screen.getByTestId('course-container-c2')).toHaveTextContent('Course: Course 2');
      expect(screen.getByTestId('course-container-c3')).toHaveTextContent('Course: Course 3');
    });

    it('course_showUnselectedLOs_notParentFlexLP_courseHidden', () => {
      renderComponent({ trainings: [makeCourse('c1', 'Test Course')], showUnselectedLOs: true, isFlexible: false });
      expect(screen.queryByTestId('course-container-c1')).toBeFalsy();
    });

    it('course_showUnselectedLOs_isParentFlexLP_courseShown', () => {
      renderComponent({ trainings: [makeCourse('c1', 'Test Course')], showUnselectedLOs: true, isFlexible: true });
      expect(screen.getByTestId('course-container-c1')).toBeInTheDocument();
    });
  });

  describe('Learning Program Rendering', () => {
    it('singleLP_rendered', () => {
      renderComponent({ trainings: [makeLP('lp1', 'Test LP')] });
      expect(screen.getByTestId('lp-container-lp1')).toHaveTextContent('LP: Test LP');
    });

    it('multipleLP_allRendered', () => {
      renderComponent({ trainings: [makeLP('lp1', 'LP 1'), makeLP('lp2', 'LP 2')] });
      expect(screen.getByTestId('lp-container-lp1')).toHaveTextContent('LP: LP 1');
      expect(screen.getByTestId('lp-container-lp2')).toHaveTextContent('LP: LP 2');
    });

    it('nonFlexLP_showUnselectedLOs_lpHidden', () => {
      renderComponent({ trainings: [makeLP('lp1', 'Test LP', false)], showUnselectedLOs: true });
      expect(screen.queryByTestId('lp-container-lp1')).toBeFalsy();
    });

    it('flexLP_showUnselectedLOs_allCoursesSelected_lpHidden', () => {
      const flexLP = makeLP('flex1', 'Flex LP', true);
      flexLP.subLOs = [makeCourse('c1', 'Course 1'), makeCourse('c2', 'Course 2')];
      renderComponent({ trainings: [flexLP], selectedLoList: { c1: true, c2: true }, showUnselectedLOs: true });
      expect(screen.queryByTestId('lp-container-flex1')).toBeFalsy();
    });

    it('flexLP_showUnselectedLOs_partiallySelected_lpShown', () => {
      const flexLP = makeLP('flex1', 'Flex LP', true);
      flexLP.subLOs = [makeCourse('c1', 'Course 1'), makeCourse('c2', 'Course 2')];
      renderComponent({ trainings: [flexLP], selectedLoList: { c1: true }, showUnselectedLOs: true });
      expect(screen.getByTestId('lp-container-flex1')).toBeInTheDocument();
    });

    it('flexLP_showUnselectedLOs_noneSelected_lpShown', () => {
      const flexLP = makeLP('flex1', 'Flex LP', true);
      flexLP.subLOs = [makeCourse('c1', 'Course 1'), makeCourse('c2', 'Course 2')];
      renderComponent({ trainings: [flexLP], selectedLoList: {}, showUnselectedLOs: true });
      expect(screen.getByTestId('lp-container-flex1')).toBeInTheDocument();
    });
  });

  describe('Mixed Training Types', () => {
    it('coursesAndLPs_allRendered', () => {
      const trainings = [makeCourse('c1', 'Course 1'), makeLP('lp1', 'LP 1'), makeCourse('c2', 'Course 2')];
      renderComponent({ trainings });
      expect(screen.getByTestId('course-container-c1')).toHaveTextContent('Course: Course 1');
      expect(screen.getByTestId('lp-container-lp1')).toHaveTextContent('LP: LP 1');
      expect(screen.getByTestId('course-container-c2')).toHaveTextContent('Course: Course 2');
    });
  });

  describe('Edge Cases', () => {
    it('unknownLoType_rendersNothing', () => {
      const unknown = { ...makeCourse('u1', 'Unknown'), loType: 'jobAid' };
      renderComponent({ trainings: [unknown] });
      expect(screen.queryByTestId('course-container-u1')).toBeFalsy();
    });

    it('emptyTrainingsList_nothingRendered', () => {
      renderComponent({ trainings: [] });
      expect(screen.queryAllByTestId(/course-container-|lp-container-/)).toHaveLength(0);
    });

    it('courseWithNoInstances_stillRendered', () => {
      const course = makeCourse('c1', 'No Instances');
      course.instances = [];
      renderComponent({ trainings: [course] });
      expect(screen.getByTestId('course-container-c1')).toHaveTextContent('Course: No Instances');
    });
  });
});
