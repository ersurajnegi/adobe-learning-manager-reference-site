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
import PrimeNoteList from '../../../almLib/components/TrainingOverview/PrimeNoteList/PrimeNoteList';
import { PrimeLearningObject, PrimeLearningObjectInstance, PrimeNote } from '../../../almLib/models';

jest.mock('../../../almLib/components/TrainingOverview/PrimeNoteItem', () => ({
  PrimeNoteItem: ({
    note,
    training,
    updateNote,
    deleteNote,
    updatePlayerLoState,
    childLpId,
    isPartOfLP,
    isPartOfCertification,
  }: any) => (
    <div data-testid={`note-item-${note.id}`}>
      <span>{note.text}</span>
      <button onClick={() => updateNote(note, 'updated', training.id, note.loResource)}>Update</button>
      <button onClick={() => deleteNote(note.id, training.id, note.loResource.id)}>Delete</button>
      <button onClick={() => updatePlayerLoState({ childLpId })}>Update State</button>
      {isPartOfLP && <span data-testid="is-part-of-lp">LP</span>}
      {isPartOfCertification && <span data-testid="is-part-of-cert">Cert</span>}
    </div>
  ),
}));

// ─── Fixtures ────────────────────────────────────────────────────────────────

const makeTraining = (): PrimeLearningObject =>
  ({ id: 'course123', loType: 'course', localizedMetadata: [] } as any);

const makeInstance = (): PrimeLearningObjectInstance =>
  ({ id: 'instance123', enrollment: { id: 'enrollment123' } } as any);

const makeNote = (id: string, text: string): PrimeNote =>
  ({
    id,
    text,
    marker: '120',
    loResource: { id: `resource-${id}`, resourceType: 'Elearning' },
    dateCreated: Date.now(),
    dateUpdated: Date.now(),
  } as any);

const notes = [makeNote('note1', 'First note'), makeNote('note2', 'Second note'), makeNote('note3', 'Third note')];

const defaultProps = {
  training: makeTraining(),
  trainingInstance: makeInstance(),
  notes,
  updateNote: jest.fn(),
  deleteNote: jest.fn(),
  launchPlayerHandler: jest.fn(),
  isPartOfLP: false,
  isPartOfCertification: false,
  updatePlayerLoState: jest.fn(),
  childLpId: '',
};

const renderComponent = (props: any = {}) => render(<PrimeNoteList {...defaultProps} {...props} />);

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('PrimeNoteList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('threeNotes_allNoteItemsRendered', () => {
      renderComponent();
      expect(screen.getAllByTestId(/note-item-/)).toHaveLength(3);
    });

    it('emptyNotes_noNoteItemsRendered', () => {
      const { container } = renderComponent({ notes: [] });
      expect(screen.queryAllByTestId(/note-item-/)).toHaveLength(0);
      expect(container.querySelectorAll('hr')).toHaveLength(0);
    });
  });

  describe('Separators', () => {
    it('singleNote_noSeparatorRendered', () => {
      const { container } = renderComponent({ notes: [notes[0]] });
      expect(container.querySelectorAll('hr')).toHaveLength(0);
    });

    it('twoNotes_oneSeparatorRendered', () => {
      const { container } = renderComponent({ notes: [notes[0], notes[1]] });
      expect(container.querySelectorAll('hr')).toHaveLength(1);
    });

    it('threeNotes_twoSeparatorsRendered', () => {
      const { container } = renderComponent();
      expect(container.querySelectorAll('hr')).toHaveLength(2);
    });
  });

  describe('Prop Passthrough', () => {
    it('training_passedToAllNoteItems', () => {
      const updateNote = jest.fn();
      renderComponent({ updateNote });
      // Clicking Update on each item passes training.id — verifies training is wired
      const updateButtons = screen.getAllByText('Update');
      fireEvent.click(updateButtons[0]);
      expect(updateNote).toHaveBeenCalledWith(notes[0], 'updated', 'course123', notes[0].loResource);
    });

    it('isPartOfLP_true_allItemsShowLpIndicator', () => {
      renderComponent({ isPartOfLP: true });
      expect(screen.getAllByTestId('is-part-of-lp')).toHaveLength(3);
    });

    it('isPartOfLP_false_noLpIndicatorShown', () => {
      renderComponent({ isPartOfLP: false });
      expect(screen.queryByTestId('is-part-of-lp')).toBeNull();
    });

    it('isPartOfCertification_true_allItemsShowCertIndicator', () => {
      renderComponent({ isPartOfCertification: true });
      expect(screen.getAllByTestId('is-part-of-cert')).toHaveLength(3);
    });
  });

  describe('Note Ordering', () => {
    it('notes_renderedInProvidedOrder', () => {
      const { container } = renderComponent();
      const items = container.querySelectorAll('[data-testid^="note-item-"]');
      expect(items[0]).toHaveAttribute('data-testid', 'note-item-note1');
      expect(items[1]).toHaveAttribute('data-testid', 'note-item-note2');
      expect(items[2]).toHaveAttribute('data-testid', 'note-item-note3');
    });
  });

  describe('Handler Invocation', () => {
    it('updateNoteClick_invokesHandlerWithCorrectNote', () => {
      const updateNote = jest.fn();
      renderComponent({ updateNote });
      const updateButtons = screen.getAllByText('Update');

      fireEvent.click(updateButtons[0]);
      expect(updateNote).toHaveBeenCalledWith(notes[0], 'updated', 'course123', notes[0].loResource);
      expect(updateNote).toHaveBeenCalledTimes(1);

      fireEvent.click(updateButtons[1]);
      expect(updateNote).toHaveBeenCalledWith(notes[1], 'updated', 'course123', notes[1].loResource);
      expect(updateNote).toHaveBeenCalledTimes(2);
    });

    it('deleteNoteClick_invokesHandlerWithCorrectNote', () => {
      const deleteNote = jest.fn();
      renderComponent({ deleteNote });
      const deleteButtons = screen.getAllByText('Delete');

      fireEvent.click(deleteButtons[1]);
      expect(deleteNote).toHaveBeenCalledWith('note2', 'course123', 'resource-note2');
      expect(deleteNote).toHaveBeenCalledTimes(1);
    });

    it('childLpId_passedToUpdatePlayerLoStateOnClick', () => {
      const updatePlayerLoState = jest.fn();
      renderComponent({ childLpId: 'lp:456', updatePlayerLoState });
      const updateStateButtons = screen.getAllByText('Update State');

      fireEvent.click(updateStateButtons[0]);
      expect(updatePlayerLoState).toHaveBeenCalledWith({ childLpId: 'lp:456' });
    });
  });

  describe('Rerender', () => {
    it('rerenderWithFewerNotes_updatesRenderedCount', () => {
      const { rerender } = renderComponent();
      expect(screen.getAllByTestId(/note-item-/)).toHaveLength(3);

      rerender(<PrimeNoteList {...defaultProps} notes={[notes[0]]} />);
      expect(screen.getAllByTestId(/note-item-/)).toHaveLength(1);
    });

    it('rerenderFromEmptyToPopulated_showsAllItems', () => {
      const { rerender } = renderComponent({ notes: [] });
      expect(screen.queryAllByTestId(/note-item-/)).toHaveLength(0);

      rerender(<PrimeNoteList {...defaultProps} notes={notes} />);
      expect(screen.getAllByTestId(/note-item-/)).toHaveLength(3);
    });
  });
});
