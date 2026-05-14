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
import {
  PrimeLearningObject,
  PrimeLearningObjectInstance,
  PrimeLearningObjectResource,
  PrimeNote,
} from '../../../models/PrimeModels';
import styles from './PrimeNoteList.module.css';
import { PrimeNoteItem } from '../PrimeNoteItem';
import React from 'react';

const PrimeNoteList: React.FC<{
  training: PrimeLearningObject;
  trainingInstance: PrimeLearningObjectInstance;
  notes: PrimeNote[];
  updateNote: (
    note: PrimeNote,
    updatedText: string,
    loId: string,
    loResourceId: PrimeLearningObjectResource
  ) => Promise<void | undefined>;
  deleteNote: (noteId: string, loId: string, loResourceId: string) => Promise<void | undefined>;
  launchPlayerHandler: Function;
  isPartOfLP?: boolean;
  isPartOfCertification?: boolean;
  updatePlayerLoState: Function;
  childLpId: string;
}> = props => {
  const {
    training,
    trainingInstance,
    notes,
    updateNote,
    deleteNote,
    launchPlayerHandler,
    isPartOfLP,
    isPartOfCertification,
    updatePlayerLoState,
    childLpId,
  } = props;

  const lastNoteIndex = notes.length - 1;

  return (
    <div className={styles.moduleNotesContainer}>
      <div className={styles.noteItemList}>
        {notes.map((note, index) => (
          <React.Fragment key={note.id}>
            <PrimeNoteItem
              training={training}
              trainingInstance={trainingInstance}
              note={note}
              key={note.id}
              updateNote={updateNote}
              deleteNote={deleteNote}
              launchPlayerHandler={launchPlayerHandler}
              isPartOfLP={isPartOfLP}
              isPartOfCertification={isPartOfCertification}
              updatePlayerLoState={updatePlayerLoState}
              childLpId={childLpId}
            ></PrimeNoteItem>
            {index !== lastNoteIndex && <hr className={styles.notesItemSeparator} />}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
export default PrimeNoteList;
