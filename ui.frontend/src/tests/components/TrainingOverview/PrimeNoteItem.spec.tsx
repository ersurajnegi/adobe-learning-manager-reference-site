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
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import PrimeNoteItem from '../../../almLib/components/TrainingOverview/PrimeNoteItem/PrimeNoteItem';
import {
  PrimeLearningObject,
  PrimeLearningObjectInstance,
  PrimeNote,
  PrimeLearningObjectResource,
} from '../../../almLib/models';

const mockAlert = jest.fn();

jest.mock('../../../almLib/utils/translationService', () => ({
  GetTranslation: (key: string) => {
    const map: Record<string, string> = {
      'alm.text.delete': 'Delete',
      'alm.text.done': 'Done',
      'alm.text.clickToEdit': 'Click to edit',
      'alm.mqa.module.locked.message': 'Module is locked',
    };
    return map[key] ?? key;
  },
  GetTranslationReplaced: (key: string, value: string) => {
    const map: Record<string, string> = {
      'alm.text.hrs': `${value} hrs`,
      'alm.text.mins': `${value} mins`,
      'alm.text.secs': `${value} secs`,
      'alm.text.page': `Page ${value}`,
    };
    return map[key] ?? `${key} ${value}`;
  },
}));

jest.mock('../../../almLib/utils/hooks', () => ({
  getEnrolledInstancesCount: jest.fn(),
}));

jest.mock('../../../almLib/common/Alert/useAlert', () => ({
  useAlert: () => [mockAlert],
}));

jest.mock('../../../almLib/utils/inline_svg', () => ({
  NOTE_ICON: () => <span data-testid="note-icon" />,
}));

jest.mock('../../../almLib/utils/lo-utils', () => ({
  extractTrainingIdNum: (id: string) => {
    const match = id?.match(/\d+/);
    return match ? match[0] : '';
  },
}));

// ─── Fixtures ────────────────────────────────────────────────────────────────

const makeResource = (overrides: any = {}): PrimeLearningObjectResource =>
  ({
    id: 'resource123',
    resourceType: 'Elearning',
    multipleAttemptEnabled: false,
    resources: [{ contentType: 'VIDEO' }],
    ...overrides,
  } as any);

const makeNote = (overrides: any = {}): PrimeNote =>
  ({
    id: 'note123',
    text: 'Test note',
    marker: '120',
    loResource: makeResource(),
    dateCreated: Date.now(),
    dateUpdated: Date.now(),
    ...overrides,
  } as any);

const makeTraining = (): PrimeLearningObject =>
  ({ id: 'course123', loType: 'course', localizedMetadata: [] } as any);

const makeInstance = (enrollmentOverrides: any = {}): PrimeLearningObjectInstance =>
  ({
    id: 'instance123',
    enrollment: { id: 'enrollment123', loResourceGrades: [], ...enrollmentOverrides },
  } as any);

const defaultProps = {
  training: makeTraining(),
  trainingInstance: makeInstance(),
  note: makeNote(),
  updateNote: jest.fn(),
  deleteNote: jest.fn(),
  launchPlayerHandler: jest.fn(),
  isPartOfLP: false,
  isPartOfCertification: false,
  updatePlayerLoState: jest.fn(),
  childLpId: '',
};

const renderComponent = (props: any = {}) =>
  render(<PrimeNoteItem {...defaultProps} {...props} />);

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('PrimeNoteItem', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const { getEnrolledInstancesCount } = require('../../../almLib/utils/hooks');
    getEnrolledInstancesCount.mockReturnValue(1);
  });

  describe('Rendering', () => {
    it('noteText_rendered', () => {
      renderComponent();
      expect(screen.getByText('Test note')).toBeInTheDocument();
    });

    it('markerPresent_markerSpanShown', () => {
      renderComponent();
      expect(screen.getByText('02:00 mins')).toBeInTheDocument();
    });

    it('markerAbsent_markerSpanHidden', () => {
      renderComponent({ note: makeNote({ marker: '' }) });
      expect(screen.queryByText(/mins/)).toBeNull();
    });
  });

  describe('Edit Mode', () => {
    it('clickNoteText_entersEditMode_showsTextarea', () => {
      renderComponent();
      fireEvent.click(screen.getByText('Test note'));
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('editMode_textareaHasCurrentNoteValue', () => {
      renderComponent();
      fireEvent.click(screen.getByText('Test note'));
      expect((screen.getByRole('textbox') as HTMLTextAreaElement).value).toBe('Test note');
    });

    it('editMode_showsDeleteAndDoneButtons', () => {
      renderComponent();
      fireEvent.click(screen.getByText('Test note'));
      expect(screen.getByText('Delete')).toBeInTheDocument();
      expect(screen.getByText('Done')).toBeInTheDocument();
    });

    it('doneClick_exitsEditMode', () => {
      renderComponent();
      fireEvent.click(screen.getByText('Test note'));
      fireEvent.click(screen.getByText('Done'));
      expect(screen.queryByRole('textbox')).toBeNull();
    });
  });

  describe('Update Note', () => {
    it('doneClick_withUpdatedText_callsUpdateNote', () => {
      const updateNote = jest.fn();
      const note = makeNote();
      renderComponent({ updateNote, note });

      fireEvent.click(screen.getByText('Test note'));
      fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Updated note' } });
      fireEvent.click(screen.getByText('Done'));

      expect(updateNote).toHaveBeenCalledWith(note, 'Updated note', 'course123', note.loResource);
    });

    it('doneClick_withWhitespaceText_callsDeleteNoteInstead', () => {
      const updateNote = jest.fn();
      const deleteNote = jest.fn();
      renderComponent({ updateNote, deleteNote });

      fireEvent.click(screen.getByText('Test note'));
      fireEvent.change(screen.getByRole('textbox'), { target: { value: '   ' } });
      fireEvent.click(screen.getByText('Done'));

      expect(deleteNote).toHaveBeenCalledWith('note123', 'course123', 'resource123');
      expect(updateNote).not.toHaveBeenCalled();
    });
  });

  describe('Delete Note', () => {
    it('deleteClick_callsDeleteNote', () => {
      const deleteNote = jest.fn();
      renderComponent({ deleteNote });

      fireEvent.click(screen.getByText('Test note'));
      fireEvent.click(screen.getByText('Delete'));

      expect(deleteNote).toHaveBeenCalledWith('note123', 'course123', 'resource123');
    });

    it('deleteClick_exitsEditMode', () => {
      renderComponent();
      fireEvent.click(screen.getByText('Test note'));
      fireEvent.click(screen.getByText('Delete'));
      expect(screen.queryByRole('textbox')).toBeNull();
    });
  });

  describe('Marker Formatting — Time-based', () => {
    it('videoContent_secondsOnly_formatsWithSecsLabel', () => {
      renderComponent({ note: makeNote({ marker: '45' }) });
      expect(screen.getByText('00:45 secs')).toBeInTheDocument();
    });

    it('videoContent_minutesAndSeconds_formatsWithMinsLabel', () => {
      renderComponent();
      expect(screen.getByText('02:00 mins')).toBeInTheDocument();
    });

    it('videoContent_withHours_formatsWithHrsLabel', () => {
      renderComponent({ note: makeNote({ marker: '3725' }) });
      expect(screen.getByText('01:02:05 hrs')).toBeInTheDocument();
    });

    it('audioContent_formatsAsTime', () => {
      const resource = makeResource({ resources: [{ contentType: 'AUDIO' }] });
      renderComponent({ note: makeNote({ marker: '180', loResource: resource }) });
      expect(screen.getByText('03:00 mins')).toBeInTheDocument();
    });

    it('cpContent_withSlidePrefix_formatsAsSlide', () => {
      const resource = makeResource({ resources: [{ contentType: 'CP' }] });
      renderComponent({ note: makeNote({ marker: 'SLIDE__5', loResource: resource }) });
      expect(screen.getByText('alm.text.slide 5')).toBeInTheDocument();
    });
  });

  describe('Marker Formatting — Page-based', () => {
    it('pdfContent_formatsAsPageNumber', () => {
      const resource = makeResource({ resources: [{ contentType: 'PDF' }] });
      renderComponent({ note: makeNote({ marker: '5', loResource: resource }) });
      expect(screen.getByText('Page 5')).toBeInTheDocument();
    });
  });

  describe('Marker Formatting — No Format', () => {
    it('nonElearningResource_markerNotShown', () => {
      const resource = makeResource({ resourceType: 'Activity' });
      renderComponent({ note: makeNote({ marker: '120', loResource: resource }) });
      expect(screen.queryByText(/02:00/)).toBeNull();
    });

    it('unknownContentType_markerNotShown', () => {
      const resource = makeResource({ resources: [{ contentType: 'SCORM' }] });
      renderComponent({ note: makeNote({ marker: '120', loResource: resource }) });
      expect(screen.queryByText(/02:00/)).toBeNull();
      expect(screen.queryByText(/Page/)).toBeNull();
    });
  });

  describe('Marker Click Handler', () => {
    it('markerClick_callsLaunchPlayerHandlerWithCorrectArgs', () => {
      const launchPlayerHandler = jest.fn();
      renderComponent({ launchPlayerHandler });

      fireEvent.click(screen.getByText('02:00 mins'));

      expect(launchPlayerHandler).toHaveBeenCalledWith({
        id: 'course123',
        moduleId: 'resource123',
        trainingInstanceId: 'instance123',
        isMultienrolled: false,
        note_id: 'note123',
        note_position: '120',
      });
    });

    it('markerClick_multipleEnrollments_isMultienrolledTrue', () => {
      const launchPlayerHandler = jest.fn();
      const { getEnrolledInstancesCount } = require('../../../almLib/utils/hooks');
      getEnrolledInstancesCount.mockReturnValue(2);
      renderComponent({ launchPlayerHandler });

      fireEvent.click(screen.getByText('02:00 mins'));

      expect(launchPlayerHandler).toHaveBeenCalledWith(
        expect.objectContaining({ isMultienrolled: true })
      );
    });

    it('markerClick_partOfLP_callsUpdatePlayerLoState', () => {
      const updatePlayerLoState = jest.fn();
      const launchPlayerHandler = jest.fn();
      renderComponent({
        isPartOfLP: true,
        childLpId: 'lp:456',
        updatePlayerLoState,
        launchPlayerHandler,
      });

      fireEvent.click(screen.getByText('02:00 mins'));

      expect(updatePlayerLoState).toHaveBeenCalledWith({
        body: { lastPlayingChildLp: '456', lastPlayingCourse: '123' },
      });
      expect(launchPlayerHandler).toHaveBeenCalled();
    });

    it('markerClick_partOfCertification_callsUpdatePlayerLoState', () => {
      const updatePlayerLoState = jest.fn();
      renderComponent({ isPartOfCertification: true, childLpId: 'cert:789', updatePlayerLoState });

      fireEvent.click(screen.getByText('02:00 mins'));

      expect(updatePlayerLoState).toHaveBeenCalledWith({
        body: { lastPlayingChildLp: '789', lastPlayingCourse: '123' },
      });
    });

    it('markerClick_notPartOfParentLO_doesNotCallUpdatePlayerLoState', () => {
      const updatePlayerLoState = jest.fn();
      renderComponent({ updatePlayerLoState });

      fireEvent.click(screen.getByText('02:00 mins'));

      expect(updatePlayerLoState).not.toHaveBeenCalled();
    });
  });

  describe('Module Locking', () => {
    it('moduleLockedBetweenAttempts_currentAttemptEndTime_showsAlertAndBlocksPlayer', () => {
      const launchPlayerHandler = jest.fn();
      const resource = makeResource({
        multipleAttemptEnabled: true,
        multipleAttempt: { timeBetweenAttempts: 60 },
        learnerAttemptInfo: {
          currentAttemptEndTime: Date.now() - 30 * 60 * 1000, // 30 min ago; lock is 60 min
          lastAttemptEndTime: null,
        },
      });
      renderComponent({ note: makeNote({ loResource: resource }), launchPlayerHandler });

      fireEvent.click(screen.getByText('02:00 mins'));

      expect(mockAlert).toHaveBeenCalledWith(true, 'Module is locked', expect.anything());
      expect(launchPlayerHandler).not.toHaveBeenCalled();
    });

    it('moduleLockedBetweenAttempts_lastAttemptEndTimeFallback_showsAlertAndBlocksPlayer', () => {
      const launchPlayerHandler = jest.fn();
      const resource = makeResource({
        multipleAttemptEnabled: true,
        multipleAttempt: { timeBetweenAttempts: 60 },
        learnerAttemptInfo: {
          currentAttemptEndTime: null,
          lastAttemptEndTime: Date.now() - 30 * 60 * 1000, // fallback; 30 min ago, lock is 60 min
        },
      });
      renderComponent({ note: makeNote({ loResource: resource }), launchPlayerHandler });

      fireEvent.click(screen.getByText('02:00 mins'));

      expect(mockAlert).toHaveBeenCalledWith(true, 'Module is locked', expect.anything());
      expect(launchPlayerHandler).not.toHaveBeenCalled();
    });

    it('moduleCompleted_stopOnCompletion_blocksPlayer', () => {
      const launchPlayerHandler = jest.fn();
      const resource = makeResource({
        multipleAttemptEnabled: true,
        multipleAttempt: { stopAttemptOnSuccessfulComplete: true },
      });
      const trainingInstance = makeInstance({
        loResourceGrades: [{ id: 'resource123-grade', hasPassed: true }],
      });
      renderComponent({ note: makeNote({ loResource: resource }), trainingInstance, launchPlayerHandler });

      fireEvent.click(screen.getByText('02:00 mins'));

      expect(launchPlayerHandler).not.toHaveBeenCalled();
    });

    it('moduleLockTimePassed_launchesPlayer', () => {
      const launchPlayerHandler = jest.fn();
      const resource = makeResource({
        multipleAttemptEnabled: true,
        multipleAttempt: { timeBetweenAttempts: 60 },
        learnerAttemptInfo: {
          currentAttemptEndTime: Date.now() - 120 * 60 * 1000, // 120 min ago; past 60 min lock
          lastAttemptEndTime: null,
        },
      });
      renderComponent({ note: makeNote({ loResource: resource }), launchPlayerHandler });

      fireEvent.click(screen.getByText('02:00 mins'));

      expect(launchPlayerHandler).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('missingLoResourceGrades_markerClickLaunchesPlayer', () => {
      const launchPlayerHandler = jest.fn();
      const trainingInstance = makeInstance({ loResourceGrades: undefined });
      renderComponent({ trainingInstance, launchPlayerHandler });

      fireEvent.click(screen.getByText('02:00 mins'));

      expect(launchPlayerHandler).toHaveBeenCalled();
    });

    it('missingResourcesArray_rendersNoteText', () => {
      const resource = makeResource({ resources: undefined });
      renderComponent({ note: makeNote({ loResource: resource }) });
      expect(screen.getByText('Test note')).toBeInTheDocument();
    });
  });
});
