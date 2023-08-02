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
import { Item, TabList, TabPanels, Tabs } from "@react-spectrum/tabs";
import React from "react";
import { useEffect, useState } from "react";
import { useIntl } from "react-intl";
import {
  PrimeLearningObject,
  PrimeLearningObjectInstance,
  PrimeLearningObjectResource,
  PrimeNote,
} from "../../../models/PrimeModels";
import { CONTENT, PREWORK, TESTOUT } from "../../../utils/constants";
import { convertSecondsToTimeText } from "../../../utils/dateTime";
import {
  filteredResource,
  filterLoReourcesBasedOnResourceType,
} from "../../../utils/hooks";
import {
  getPreferredLocalizedMetadata,
  GetTranslation,
} from "../../../utils/translationService";
import { PrimeModuleList } from "../PrimeModuleList";
import { PrimeNoteList } from "../PrimeNoteList";
import styles from "./PrimeCourseOverview.module.css";
import Email from "@spectrum-icons/workflow/Email";
import Download from "@spectrum-icons/workflow/Download";

const PrimeCourseOverview: React.FC<{
  training: PrimeLearningObject;
  trainingInstance: PrimeLearningObjectInstance;
  launchPlayerHandler: Function;
  isParentLOEnrolled?: boolean;
  isPartOfLP?: boolean;
  showDuration?: boolean;
  showNotes: boolean;
  isPreviewEnabled: boolean;
  updateFileSubmissionUrl: Function;
  notes: PrimeNote[];
  lastPlayingLoResourceId: String;
  updateNote: (
    note: PrimeNote,
    updatedText: string,
    loId: string,
    loResourceId: PrimeLearningObjectResource
  ) => Promise<void | undefined>;
  deleteNote: (
    noteId: string,
    loId: string,
    loResourceId: string
  ) => Promise<void | undefined>;
  downloadNotes: (
    loId: string,
    loInstanceId: string
  ) => Promise<void | undefined>;
  sendNotesOnMail: (
    loId: string,
    loInstanceId: string
  ) => Promise<void | undefined>;
}> = (props: any) => {
  const {
    training,
    trainingInstance,
    showDuration = true,
    showNotes,
    launchPlayerHandler,
    isPartOfLP = false,
    isParentLOEnrolled = false,
    isPreviewEnabled = false,
    updateFileSubmissionUrl,
    notes,
    updateNote,
    deleteNote,
    downloadNotes,
    sendNotesOnMail,
    lastPlayingLoResourceId
  } = props;

  const { locale } = useIntl();
  interface INotesbyModuleName {
    moduleName: string;
    notes: PrimeNote[];
  }
  interface INotesByNamesAndId {
    [key: string]: INotesbyModuleName;
  }
  const getDuration = (
    learningObjectResources: PrimeLearningObjectResource[]
  ) => {
    let duration = 0;
    learningObjectResources?.forEach((learningObjectResource) => {
      const resource = filteredResource(learningObjectResource, locale);
      const resDuration =
        resource.authorDesiredDuration || resource.desiredDuration || 0;
      duration += resDuration;
    });
    return duration;
  };

  let moduleReources = filterLoReourcesBasedOnResourceType(
    trainingInstance,
    CONTENT
  );
  const testOutResources = filterLoReourcesBasedOnResourceType(
    trainingInstance,
    TESTOUT
  );

  let preWorkResources = filterLoReourcesBasedOnResourceType(
    trainingInstance,
    PREWORK
  );

  const contentModuleDuration = getDuration(moduleReources);

  if (isPartOfLP) {
    moduleReources = [...preWorkResources, ...moduleReources];
    preWorkResources = [] as PrimeLearningObjectResource[];
  }

  let [preWorkDuration, setPreWorkDuration] = useState(0);
  useEffect(() => {
    if (preWorkResources?.length) {
      setPreWorkDuration(getDuration(preWorkResources));
    }
  }, [locale, preWorkResources]);

  const showTestout = testOutResources?.length !== 0;
  const showTabs = showTestout || showNotes;
  const classNames = `${styles.tablist} ${showTabs ? "" : styles.hide}`;
  const filterNotesByModuleName = (notesList: PrimeNote[]) => {
    const notesbyModuleId = notesList.reduce(function (
      accumulator: INotesByNamesAndId,
      note: PrimeNote
    ) {
      const metaData = getPreferredLocalizedMetadata(
        note?.loResource?.localizedMetadata,
        locale
      );
      const moduleId = note?.loResource?.id;
      if (!accumulator[moduleId]) {
        accumulator[moduleId] = {
          notes: [],
          moduleName: metaData.name,
        };
      }
      accumulator[moduleId].notes.push(note);
      return accumulator;
    },
    {});
    return Object.keys(notesbyModuleId).map(
      (id: string) => notesbyModuleId[id]
    );
  };
  const notesByModuleName = filterNotesByModuleName(notes);

  const handleNotesDownload = () => {
    downloadNotes(training.id, trainingInstance.id);
  };

  const handleNotesMailing = () => {
    sendNotesOnMail(training.id, trainingInstance.id);
  };

  return (
    <Tabs
      aria-label={GetTranslation("alm.text.moduleList", true)}
      UNSAFE_className={isPartOfLP ? styles.isPartOfLP : ""}
    >
      <TabList id="tabList" UNSAFE_className={classNames}>
        <Item key="Modules">
          {GetTranslation("alm.training.modules", true)}
        </Item>
        {showTestout && (
          <Item key="Testout">{GetTranslation("alm.text.testout", true)}</Item>
        )}
        {showNotes && (
          <Item key="Notes">{GetTranslation("alm.text.notes")}</Item>
        )}
      </TabList>
      <TabPanels UNSAFE_className={styles.tabPanels}>
        <Item key="Modules">
          {preWorkResources?.length > 0 && (
            <>
              <div className={styles.overviewcontainer}>
                <header role="heading" className={styles.header} aria-level={2}>
                  <div className={styles.loResourceType}>
                    {GetTranslation("alm.text.prework", true)}
                  </div>
                  {showDuration && (
                    <div className={styles.time}>
                      {convertSecondsToTimeText(preWorkDuration)}
                    </div>
                  )}
                </header>
              </div>
              <PrimeModuleList
                launchPlayerHandler={launchPlayerHandler}
                loResources={preWorkResources}
                training={training}
                isPartOfLP={isPartOfLP}
                trainingInstance={trainingInstance}
                isPreviewEnabled={isPreviewEnabled}
                updateFileSubmissionUrl={updateFileSubmissionUrl}
                isParentLOEnrolled={isParentLOEnrolled}
                lastPlayingLoResourceId={lastPlayingLoResourceId}
              ></PrimeModuleList>
            </>
          )}

          {showDuration && (
            <div className={styles.overviewcontainer}>
              <header role="heading" className={styles.header} aria-level={2}>
                <div className={styles.loResourceType}>
                  {GetTranslation("alm.text.coreContent", true)}
                </div>
                <div className={styles.time}>
                  {convertSecondsToTimeText(contentModuleDuration)}
                </div>
              </header>
            </div>
          )}
          <PrimeModuleList
            launchPlayerHandler={launchPlayerHandler}
            loResources={moduleReources}
            training={training}
            isPartOfLP={isPartOfLP}
            trainingInstance={trainingInstance}
            isContent={true}
            isPreviewEnabled={isPreviewEnabled}
            updateFileSubmissionUrl={updateFileSubmissionUrl}
            isParentLOEnrolled={isParentLOEnrolled}
            lastPlayingLoResourceId={lastPlayingLoResourceId}
          ></PrimeModuleList>
        </Item>
        {showTestout && (
          <Item key="Testout">
            <PrimeModuleList
              launchPlayerHandler={launchPlayerHandler}
              loResources={testOutResources}
              training={training}
              trainingInstance={trainingInstance}
              isPreviewEnabled={isPreviewEnabled}
              updateFileSubmissionUrl={updateFileSubmissionUrl}
              isParentLOEnrolled={isParentLOEnrolled}
              lastPlayingLoResourceId={lastPlayingLoResourceId}
            ></PrimeModuleList>
          </Item>
        )}
        {showNotes && (
          <Item key="Notes">
            {Object.keys(notes[0] || {}).length ? (
              <>
                <div className={styles.notesActions}>
                  <p onClick={handleNotesDownload}>
                    <span aria-hidden="true" className={styles.downloadIcon}>
                      <Download />
                    </span>
                    {GetTranslation("alm.text.download", true)}
                  </p>
                  <p onClick={handleNotesMailing}>
                    <span aria-hidden="true" className={styles.mailIcon}>
                      <Email />
                    </span>
                    {GetTranslation("alm.text.email", true)}
                  </p>
                </div>
                {notesByModuleName.map((item: INotesbyModuleName) => (
                  <React.Fragment key={`notes-${item.moduleName}`}>
                    <div className={styles.moduleContainer}>
                      <p className={styles.moduleName}>
                        {GetTranslation("alm.text.moduleName", true)}
                        {item.moduleName}
                      </p>
                    </div>
                    <PrimeNoteList
                      training={training}
                      trainingInstance={trainingInstance}
                      notes={item.notes}
                      updateNote={updateNote}
                      deleteNote={deleteNote}
                      launchPlayerHandler={launchPlayerHandler}
                    />
                  </React.Fragment>
                ))}
              </>
            ) : (
              <div className={styles.notesNotPresent}>
                {GetTranslation("alm.text.noNotes")}
              </div>
            )}
          </Item>
        )}
      </TabPanels>
    </Tabs>
  );
};

export default PrimeCourseOverview;
