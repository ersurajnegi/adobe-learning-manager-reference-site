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
import styles from './SessionConflictDialog.module.css';
import { getALMObject } from '../../utils/global';
import { GetTranslation } from '../../utils/translationService';

interface sessionData {
  conflictingSessionsList: any[];
  locale: string;
  handleEnrollment: Function;
  confirmationDialog: Function;
  delay: number;
}

const SessionConflictDialog = async (props: sessionData) => {
  const { conflictingSessionsList, locale, handleEnrollment, confirmationDialog, delay } = props;

  const sessionInfo = (
    <>
      <p className={styles.conflictDialogMessage}>
        {GetTranslation('alm.conflicting.sessions.message1', true)}
      </p>
      <ul>
        {conflictingSessionsList.map((session: any) => {
          const trainingId = session.course.id;
          const instanceId = session.courseInstance.id;
          const courseName = session.courseName[0].name;

          const sessionStart = new Date(session.timeSlot.startTime);
          const sessionEnd = new Date(session.timeSlot.endTime);

          const options: Intl.DateTimeFormatOptions = {
            hour: 'numeric',
            minute: 'numeric',
            hour12: true,
          };
          const timeText = `(${sessionStart.toLocaleTimeString(
            locale,
            options
          )} - ${sessionEnd.toLocaleTimeString(locale, options)})`;
          return (
            <li key={trainingId} style={{ paddingBottom: '10px' }}>
              <p>
                {timeText} - {session.loResourceName[0].name}
              </p>
              <span
                className={styles.sessionDetails}
                onClick={() =>
                  getALMObject().navigateToTrainingOverviewPage(trainingId, instanceId)
                }
                title={courseName}
                data-automationid={`${courseName}-conflicting-session`}
              >
                {courseName}
              </span>
            </li>
          );
        })}
      </ul>
      <p className={styles.conflictDialogMessage}>
        {GetTranslation('alm.conflicting.sessions.message2', true)}
      </p>
    </>
  );

  confirmationDialog(
    GetTranslation('text.warning'),
    sessionInfo,
    GetTranslation('alm.overview.button.enroll'),
    GetTranslation('alm.overview.cancel'),
    () => setTimeout(handleEnrollment, delay)
  );
};

export default SessionConflictDialog;
