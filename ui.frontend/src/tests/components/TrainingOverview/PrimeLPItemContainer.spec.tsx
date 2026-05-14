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
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import PrimeLPItemContainer from '@components/TrainingOverview/PrimeLPItemContainer/PrimeLPItemContainer';
import { PrimeLearningObject, PrimeNote } from '@models/PrimeModels';

jest.mock('@adobe/react-spectrum', () => ({
  Button: ({ children, onPress, ...props }: any) => (
    <button onClick={onPress} {...props}>
      {children}
    </button>
  ),
}));

jest.mock('@spectrum-icons/workflow/ChevronDown', () => ({
  __esModule: true,
  default: () => <span data-testid="chevron-down" />,
}));

jest.mock('@spectrum-icons/workflow/ChevronUp', () => ({
  __esModule: true,
  default: () => <span data-testid="chevron-up" />,
}));

jest.mock('react-intl', () => ({
  useIntl: () => ({
    formatMessage: ({ id }: any, values?: any) => {
      if (id === 'alm.overview.section.optional') return 'Optional';
      if (id === 'alm.overview.section.xOutOfy') return `${values?.[0]} out of ${values?.[1]}`;
      return id;
    },
    locale: 'en-US',
  }),
}));

jest.mock('@contextProviders/userContextProvider', () => ({
  useUserContext: () => ({
    user: { account: { shouldPreReqConsiderPassStatus: false }, contentLocale: 'en-US' },
  }),
}));

jest.mock('@utils/translationService', () => ({
  getPreferredLocalizedMetadata: (metadata: any) =>
    metadata?.[0] ?? { name: '', description: '', overview: '', richTextOverview: '' },
}));

jest.mock('@utils/hooks', () => ({
  filterTrainingInstance: (training: any) =>
    training?.instances?.[0] ?? { id: 'i1', isFlexible: false },
  getCourseInstanceMapping: (selectedLoList: any, loId: string) => selectedLoList?.[loId],
}));

jest.mock('@utils/overview', () => ({
  checkIsTrainingLocked: () => false,
}));

jest.mock('@components/TrainingOverview/PrimeTrainingItemContainerHeader', () => ({
  PrimeTrainingItemContainerHeader: ({ name }: any) => (
    <div data-testid="training-item-header">{name}</div>
  ),
}));

jest.mock('@components/TrainingOverview/PrimeCourseItemContainer', () => ({
  PrimeCourseItemContainer: ({
    training,
    showMandatoryLabel,
    isTrainingLocked,
    isParentLOEnrolled,
    parentHasSubLoOrderEnforced,
  }: any) => (
    <div data-testid={`course-item-${training.id}`}>
      {showMandatoryLabel && <span data-testid="mandatory-label">Mandatory</span>}
      {isTrainingLocked && <span data-testid="locked-label">Locked</span>}
      {isParentLOEnrolled && <span data-testid="parent-enrolled">Enrolled</span>}
      {parentHasSubLoOrderEnforced && <span data-testid="order-enforced">Order</span>}
    </div>
  ),
}));

const makeCourse = (id: string) => ({
  id,
  loType: 'course',
  localizedMetadata: [{ locale: 'en-US', name: `Course ${id}` }],
  instances: [{ id: `${id}-i1`, isFlexible: false, localizedMetadata: [] }],
  subLOs: [],
  enrollment: null,
});

const baseTraining: PrimeLearningObject = {
  id: 'lp1',
  loType: 'learningProgram',
  localizedMetadata: [{ locale: 'en-US', name: 'Test LP', description: '', overview: '', richTextOverview: '' }],
  instances: [{ id: 'lp1-i1', isFlexible: false, localizedMetadata: [] }],
  sections: [
    {
      id: 's1',
      mandatory: true,
      mandatoryLOCount: 2,
      loIds: ['c1', 'c2'],
      localizedMetadata: [{ locale: 'en-US', name: 'Section One' }],
    },
  ],
  subLOs: [makeCourse('c1'), makeCourse('c2')],
  enrollment: null,
  isSubLoOrderEnforced: false,
} as any;

const baseProps = {
  training: baseTraining,
  launchPlayerHandler: jest.fn(),
  isPartOfLP: true,
  isParentLOEnrolled: true,
  isRootLOEnrolled: true,
  isRootLoPreviewEnabled: false,
  showMandatoryLabel: false,
  isPreviewEnabled: false,
  isFlexLPValidationEnabled: false,
  flexLPTraining: false,
  updateFileSubmissionUrl: jest.fn(),
  parentLoName: 'Root LP',
  setTimeBetweenAttemptEnabled: jest.fn(),
  timeBetweenAttemptEnabled: false,
  setSelectedInstanceInfo: jest.fn(),
  courseInstanceMapping: {},
  selectedLoList: {},
  notes: [] as PrimeNote[],
  updateNote: jest.fn(),
  deleteNote: jest.fn(),
  downloadNotes: jest.fn(),
  sendNotesOnMail: jest.fn(),
  lastPlayingCourseId: '',
  lastPlayingLoResourceId: '',
  showUnselectedLOs: false,
  parentHasEnforcedPrerequisites: false,
  parentHasSubLoOrderEnforced: false,
  isTrainingLocked: false,
  updatePlayerLoState: jest.fn(),
  isRootLoCompleted: false,
  setEnrollViaModuleClick: jest.fn(),
  isPartOfFirstChildTraining: false,
  discussionUtils: {},
  courseInstanceMap: {},
};

describe('PrimeLPItemContainer', () => {
  describe('Collapse/Expand', () => {
    it('collapseOnMount_subLOsHiddenAndChevronDown', () => {
      render(<PrimeLPItemContainer {...baseProps} />);

      expect(screen.queryByTestId('course-item-c1')).not.toBeInTheDocument();
      expect(screen.getByTestId('chevron-down')).toBeInTheDocument();
    });

    it('expand_onButtonClick_showsSubLOsAndChevronUp', () => {
      render(<PrimeLPItemContainer {...baseProps} />);

      userEvent.click(screen.getByRole('button'));

      expect(screen.getByTestId('course-item-c1')).toBeInTheDocument();
      expect(screen.getByTestId('course-item-c2')).toBeInTheDocument();
      expect(screen.getByTestId('chevron-up')).toBeInTheDocument();
    });

    it('collapse_onSecondClick_hidesSubLOs', () => {
      render(<PrimeLPItemContainer {...baseProps} />);

      userEvent.click(screen.getByRole('button'));
      userEvent.click(screen.getByRole('button'));

      expect(screen.queryByTestId('course-item-c1')).not.toBeInTheDocument();
    });
  });

  describe('Section labels', () => {
    it('optionalSection_showsOptionalLabel', () => {
      const training = {
        ...baseTraining,
        sections: [{ id: 's1', mandatory: false, mandatoryLOCount: 0, loIds: ['c1'], localizedMetadata: [] }],
      };
      render(<PrimeLPItemContainer {...baseProps} training={training as any} />);
      userEvent.click(screen.getByRole('button'));

      expect(screen.getByText('Optional')).toBeInTheDocument();
    });

    it('partialMandatorySection_showsXOutOfYLabel', () => {
      const training = {
        ...baseTraining,
        sections: [
          { id: 's1', mandatory: true, mandatoryLOCount: 1, loIds: ['c1', 'c2'], localizedMetadata: [] },
        ],
      };
      render(<PrimeLPItemContainer {...baseProps} training={training as any} />);
      userEvent.click(screen.getByRole('button'));

      expect(screen.getByText('1 out of 2')).toBeInTheDocument();
    });

    it('fullyMandatorySection_showsNoOptionalOrCountLabel', () => {
      render(<PrimeLPItemContainer {...baseProps} />);
      userEvent.click(screen.getByRole('button'));

      expect(screen.queryByText('Optional')).not.toBeInTheDocument();
      expect(screen.queryByText(/out of/)).not.toBeInTheDocument();
    });
  });

  describe('showMandatoryLabel passed to children', () => {
    it('fullyMandatorySection_passedTrueToAllChildren', () => {
      render(<PrimeLPItemContainer {...baseProps} />);
      userEvent.click(screen.getByRole('button'));

      expect(screen.getAllByTestId('mandatory-label')).toHaveLength(2);
    });

    it('partialMandatorySection_passedFalseToChildren', () => {
      const training = {
        ...baseTraining,
        sections: [
          { id: 's1', mandatory: true, mandatoryLOCount: 1, loIds: ['c1', 'c2'], localizedMetadata: [] },
        ],
      };
      render(<PrimeLPItemContainer {...baseProps} training={training as any} />);
      userEvent.click(screen.getByRole('button'));

      expect(screen.queryByTestId('mandatory-label')).not.toBeInTheDocument();
    });
  });

  describe('isTrainingLocked passed to children', () => {
    it('parentLocked_allChildrenReceiveLocked', () => {
      render(<PrimeLPItemContainer {...baseProps} isTrainingLocked={true} />);
      userEvent.click(screen.getByRole('button'));

      expect(screen.getAllByTestId('locked-label')).toHaveLength(2);
    });

    it('parentNotLocked_checkIsTrainingLockedFalse_childrenNotLocked', () => {
      render(<PrimeLPItemContainer {...baseProps} isTrainingLocked={false} />);
      userEvent.click(screen.getByRole('button'));

      expect(screen.queryByTestId('locked-label')).not.toBeInTheDocument();
    });
  });

  describe('isParentLOEnrolled passed to children', () => {
    it('trainingHasEnrollment_childrenReceiveParentEnrolledTrue', () => {
      const training = { ...baseTraining, enrollment: { id: 'e1', state: 'ACTIVE' } };
      render(<PrimeLPItemContainer {...baseProps} training={training as any} />);
      userEvent.click(screen.getByRole('button'));

      expect(screen.getAllByTestId('parent-enrolled')).toHaveLength(2);
    });

    it('trainingHasNoEnrollment_childrenReceiveParentEnrolledFalse', () => {
      render(<PrimeLPItemContainer {...baseProps} />);
      userEvent.click(screen.getByRole('button'));

      expect(screen.queryByTestId('parent-enrolled')).not.toBeInTheDocument();
    });
  });

  describe('parentHasSubLoOrderEnforced passed to children', () => {
    it('trainingIsSubLoOrderEnforced_childrenReceiveOrderEnforcedTrue', () => {
      const training = { ...baseTraining, isSubLoOrderEnforced: true };
      render(
        <PrimeLPItemContainer {...baseProps} training={training as any} parentHasSubLoOrderEnforced={false} />
      );
      userEvent.click(screen.getByRole('button'));

      expect(screen.getAllByTestId('order-enforced')).toHaveLength(2);
    });

    it('parentPropHasSubLoOrderEnforced_childrenReceiveOrderEnforcedTrue', () => {
      render(<PrimeLPItemContainer {...baseProps} parentHasSubLoOrderEnforced={true} />);
      userEvent.click(screen.getByRole('button'));

      expect(screen.getAllByTestId('order-enforced')).toHaveLength(2);
    });

    it('neitherTrainingNorParentHasOrderEnforced_childrenNotOrderEnforced', () => {
      render(<PrimeLPItemContainer {...baseProps} parentHasSubLoOrderEnforced={false} />);
      userEvent.click(screen.getByRole('button'));

      expect(screen.queryByTestId('order-enforced')).not.toBeInTheDocument();
    });
  });

  describe('SubLO ordering', () => {
    it('subLOs_renderedInLoIdsOrder_notSubLOsArrayOrder', () => {
      const training = {
        ...baseTraining,
        sections: [
          { id: 's1', mandatory: true, mandatoryLOCount: 2, loIds: ['c2', 'c1'], localizedMetadata: [] },
        ],
      };
      render(<PrimeLPItemContainer {...baseProps} training={training as any} />);
      userEvent.click(screen.getByRole('button'));

      const items = screen.getAllByTestId(/^course-item-/);
      expect(items[0]).toHaveAttribute('data-testid', 'course-item-c2');
      expect(items[1]).toHaveAttribute('data-testid', 'course-item-c1');
    });
  });

  describe('Flex LP visibility (showUnselectedLOs)', () => {
    const flexTraining = {
      ...baseTraining,
      instances: [{ id: 'lp1-i1', isFlexible: true, localizedMetadata: [] }],
      sections: [
        {
          id: 's1',
          mandatory: true,
          mandatoryLOCount: 2,
          loIds: ['c1', 'c2'],
          localizedMetadata: [{ locale: 'en-US', name: 'Flex Section' }],
        },
      ],
    };

    it('allInstancesSelected_sectionNotRendered', () => {
      render(
        <PrimeLPItemContainer
          {...baseProps}
          training={flexTraining as any}
          showUnselectedLOs={true}
          selectedLoList={{ c1: true, c2: true }}
        />
      );
      userEvent.click(screen.getByRole('button'));

      expect(screen.queryByTestId('course-item-c1')).not.toBeInTheDocument();
      expect(screen.queryByTestId('course-item-c2')).not.toBeInTheDocument();
    });

    it('partiallySelectedInstances_unselectedCoursesRendered_selectedCourseHidden', () => {
      render(
        <PrimeLPItemContainer
          {...baseProps}
          training={flexTraining as any}
          showUnselectedLOs={true}
          selectedLoList={{ c1: true }}
        />
      );
      userEvent.click(screen.getByRole('button'));

      expect(screen.queryByTestId('course-item-c1')).not.toBeInTheDocument();
      expect(screen.getByTestId('course-item-c2')).toBeInTheDocument();
    });
  });
});
