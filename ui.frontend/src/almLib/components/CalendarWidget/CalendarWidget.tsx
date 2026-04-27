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
import styles from './CalendarWidget.module.css';
import {
  GetTranslation,
  GetTranslationReplaced,
  GetTranslationsReplaced,
} from '../../utils/translationService';
import { FILTER_ICON, EMPTY_STATE_CARD } from '../../utils/inline_svg';
import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useCalendar } from '../../hooks/widgets/calendar/useCalendar';
import { getALMUser, getWidgetConfig } from '../../utils/global';
import { ONE_DAY, add, diffBetweenDates, isAfter } from '../../utils/widgets/dates';
import { JsonApiParse } from '../../utils/jsonAPIAdapter';
import { PrimeUserCalendar } from '../../models';
import { useWidgetLayout, UseWidgetLayoutReturn } from '../../hooks/widgets/useWidgetLayout';

import { getIsCustomPage, TransformToUpperCase } from '../../utils/widgets/utils';
import { useIntl } from 'react-intl';
import {
  GetCertPageLink,
  GetCourseInstancePreviewPageLink,
  GetCoursePageLink,
  GetLPPageLink,
  GetShowCourseInstancePreviewPageLink,
  SendLinkEvent,
} from '../../utils/widgets/base/EventHandlingBase';
import { useCardIcon } from '../../utils/hooks';
import { GetTileImageFromId } from '../../utils/themes';
import { CARD_HEIGHT } from '../../utils/widgets/common';
import { ALMErrorBoundary } from '../Common/ALMErrorBoundary';
import { INSTANCE_CARD_BACKGROUND_SIZE, WAITING } from '../../utils/constants';
import ALMStripWidgetHeader from '../CustomPages/ALMStripWidgetHeader/ALMStripWidgetHeader';
import ALMWidgetLoader from '../CustomPages/ALMWidgetLoader/ALMWidgetLoader';
import ALMWidgetInspectMode from '../CustomPages/ALMWidgetInspectMode/ALMWidgetInspectMode';
import { useWidgetInspectMode } from '../../hooks/customPages/useALMInspectMode';
import { useUserContext } from '../../contextProviders/userContextProvider';
import { formatTimeRangeWithTimezone, getDatePartsInTimezone } from '../../utils/timezoneUtils';

const DAYS_IN_A_YEAR = 365;
const CALENDAR_VIEWS = {
  CALENDAR: 'CALENDAR',
  FILTER: 'FILTER',
  SESSIONS: 'SESSIONS',
};

const CalendarWidget = (props: any) => {
  const { widget, doRefresh, disableLinks = false, isInspectMode = false } = props;

  // Add calendar container ref to scope DOM operations to this specific calendar instance
  const calendarContainerRef = useRef<HTMLDivElement>(null);

  const {
    containerWidth,
    noOfCards,
    singleCardWidth,
    widgetId,
    sectionRef,
  }: UseWidgetLayoutReturn = useWidgetLayout({
    widget,
    doRefresh,
    defaultCardsToShow: 1,
    isMultiCard: true,
  });
  const newDate = new Date();
  const isCustomPage = getIsCustomPage();
  const isSingleCalender = noOfCards === 1;
  const { locale, formatMessage } = useIntl();
  const { user } = useUserContext() || {};

  const { config, getCPrimeCalendarData, getCities, fetchingData } = useCalendar(widget);
  const [month, setMonth] = useState(newDate.getMonth() + 1);
  const [year, setYear] = useState(newDate.getFullYear());
  const [fetchingMonth, setFetchingMonth] = useState(false);
  const [detailViewTemplate, setDetailViewTemplate] = useState<JSX.Element[]>([]);
  const [daysTemplate, setDaysTemplate] = useState<JSX.Element[]>([]);

  const months = [
    GetTranslation('cw.months.jan'),
    GetTranslation('cw.months.feb'),
    GetTranslation('cw.months.mar'),
    GetTranslation('cw.months.apr'),
    GetTranslation('cw.months.may'),
    GetTranslation('cw.months.jun'),
    GetTranslation('cw.months.jul'),
    GetTranslation('cw.months.aug'),
    GetTranslation('cw.months.sep'),
    GetTranslation('cw.months.oct'),
    GetTranslation('cw.months.nov'),
    GetTranslation('cw.months.dec'),
  ];

  const [detailViewTitle, setDetailViewTitle] = useState({
    day: newDate.getDate(),
    month: months[newDate.getMonth()],
    year: newDate.getFullYear(),
  });
  const enrolledSessionsRef = useRef<HTMLInputElement>(null);

  const [calendarViewEvent, setCalendarViewEvent] = useState<Event>();
  const [sessionsForTheCurrentMonth, setSessionsForTheCurrentMonth] = useState<any>([]);
  const [lastFocusedDayElement, setLastFocusedDayElement] = useState<any>();
  const [lastSelectedDate, setLastSelectedDate] = useState('');
  const [singleCalendarView, setSingleCalendarView] = useState(CALENDAR_VIEWS.CALENDAR);
  const [doubleCalendarView, setDoubleCalendarView] = useState(CALENDAR_VIEWS.CALENDAR);
  const [selectedCities, setSelectedCities] = useState(new Set());
  const [viewEnrolledSessionsOnly, setViewEnrolledSessionsOnly] = useState(false);

  // Applied filters (what's actually filtering the calendar data)
  const [appliedCities, setAppliedCities] = useState(new Set());
  const [appliedViewEnrolledOnly, setAppliedViewEnrolledOnly] = useState(false);

  const dayOfWeek = [
    GetTranslation('cw.weeks.sun'),
    GetTranslation('cw.weeks.mon'),
    GetTranslation('cw.weeks.tue'),
    GetTranslation('cw.weeks.wed'),
    GetTranslation('cw.weeks.thu'),
    GetTranslation('cw.weeks.fri'),
    GetTranslation('cw.weeks.sat'),
  ];

  const dayOfWeekFullName = [
    GetTranslation('cw.weeks.sunday'),
    GetTranslation('cw.weeks.monday'),
    GetTranslation('cw.weeks.tuesday'),
    GetTranslation('cw.weeks.wednesday'),
    GetTranslation('cw.weeks.thursday'),
    GetTranslation('cw.weeks.friday'),
    GetTranslation('cw.weeks.saturday'),
  ];

  const [locations, setLocations] = useState<string[]>([]);
  const isFilterApplied = appliedCities.size > 0 || appliedViewEnrolledOnly;

  // Function to apply filters to session data
  const applyFilters = (sessions: Record<string, PrimeUserCalendar[][]>) => {
    if (!sessions) {
      return {};
    }
    if (selectedCities.size === 0 && !viewEnrolledSessionsOnly) {
      return sessions;
    }
    let filteredSessions: Record<string, PrimeUserCalendar[][]> = {};

    Object.keys(sessions).forEach(key => {
      const filtered = sessions[key].filter((session: any) => {
        if (selectedCities.size !== 0) {
          return selectedCities.has(session?.room?.city);
        }
        if (viewEnrolledSessionsOnly) {
          return session.enrolled && session.enrolledToCourseInstance;
        }
        return true;
      });
      if (filtered.length > 0) {
        filteredSessions[key] = filtered;
      }
    });

    return filteredSessions;
  };

  useEffect(() => {
    widget.attributes!.heading = GetTranslation('text.skipToCalendar');
  }, [doRefresh]);

  useEffect(() => {
    if (enrolledSessionsRef.current) {
      enrolledSessionsRef.current.focus();
    }
  }, [singleCalendarView, doubleCalendarView]);

  // getActiveElement to be scoped to current calendar
  const getActiveElement = () => {
    const activeElement = document.activeElement;
    // Check if the active element is within this calendar instance
    if (calendarContainerRef.current && activeElement) {
      return calendarContainerRef.current.contains(activeElement as Node) ? activeElement : null;
    }
    return null;
  };

  // Helper functions to abstract calendar container DOM operations
  const getCalendarElement = (selector: string): Element | null => {
    return calendarContainerRef.current?.querySelector(selector) || null;
  };

  const getCalendarElements = (selector: string): NodeListOf<Element> | [] => {
    return calendarContainerRef.current?.querySelectorAll(selector) || [];
  };

  const forEachCalendarElement = (selector: string, callback: (element: Element) => void): void => {
    const elements = getCalendarElements(selector);
    if (elements.length > 0) {
      elements.forEach(callback);
    }
  };

  // Specific helper functions for common calendar operations
  const getDateButton = (dateStr: string): Element | null => {
    return getCalendarElement(`button[data-of-day="${dateStr}"]`);
  };

  const getDayElement = (dateStr: string): Element | null => {
    return getCalendarElement(`button[data-of-day="${dateStr}"] span.${styles.day}`);
  };

  const getDetailViewLinks = (): NodeListOf<Element> | [] => {
    return getCalendarElements(`.${styles.calendarDetailContainer} .${styles.loLink}`);
  };

  const setElementAttributes = (
    element: Element | null,
    attributes: Record<string, string>
  ): void => {
    if (element) {
      Object.entries(attributes).forEach(([key, value]) => {
        element.setAttribute(key, value);
      });
    }
  };

  function getFormatedSession(sessions: any[]) {
    const data: { [id: number]: Array<PrimeUserCalendar[]>[] } = {};
    if (!sessions?.length) {
      return data;
    }

    sessions?.forEach((entry: any) => {
      // Extract date parts in user's timezone for correct calendar placement
      const {
        year: entryYear,
        month: entryMonth,
        day: entryDate,
      } = getDatePartsInTimezone(entry.dateStart, user, user?.account);

      data[entryYear] = data[entryYear] || {};
      data[entryYear][entryMonth] = data[entryYear][entryMonth] || {};
      data[entryYear][entryMonth][entryDate] = data[entryYear][entryMonth][entryDate] || [];
      data[entryYear][entryMonth][entryDate].push(entry);
    });
    return data;
  }

  function processCalendarData(parsedResponse: any, y: number, m: number) {
    try {
      // Create date boundaries for the target month
      const monthStart = new Date(y, m - 1, 1); // First day of target month
      const monthEnd = new Date(y, m, 0, 23, 59, 59, 999); // Last day of target month
      const tempData = parsedResponse.data.reduce((acc: any, session: any) => {
        const dateStart = session.attributes.dateStart;
        const dateEnd = session.attributes.dateEnd;

        const sessionStart = new Date(dateStart);
        const sessionEnd = new Date(dateEnd);

        // Skip sessions that don't overlap with the target month
        if (sessionEnd < monthStart || sessionStart > monthEnd) {
          return acc;
        }

        let diffBetweenDays = diffBetweenDates(dateStart, dateEnd, 'd');
        diffBetweenDays = diffBetweenDays > DAYS_IN_A_YEAR ? DAYS_IN_A_YEAR : diffBetweenDays;

        if (diffBetweenDays > 0) {
          const endDate = new Date(dateStart);
          const endTime = new Date(dateEnd);
          endDate.setHours(endTime.getHours());
          endDate.setMinutes(endTime.getMinutes());
          let durationPerSession = diffBetweenDates(dateStart, endDate);
          if (durationPerSession <= 0) {
            durationPerSession = ONE_DAY - Math.abs(durationPerSession);
          }
          const today = new Date();

          for (let index = 0; index <= diffBetweenDays; index++) {
            const currentSlotStartDate = add(dateStart, index, 'd');

            // Only process dates that fall within the target month
            if (currentSlotStartDate < monthStart || currentSlotStartDate > monthEnd) {
              continue;
            }

            const currentSlotEndDate = add(currentSlotStartDate, durationPerSession, 'ms');
            if (isAfter(currentSlotEndDate, dateEnd)) {
              break;
            }

            const updatedSession = {
              ...session,
              attributes: {
                ...session.attributes,
                dateEnd: currentSlotEndDate.toISOString(),
                dateStart: currentSlotStartDate.toISOString(),
              },
            };
            acc.push(updatedSession);
          }
        } else {
          // For single-day sessions, check if they fall within the target month
          if (sessionStart >= monthStart && sessionStart <= monthEnd) {
            acc.push(session);
          }
        }
        return acc;
      }, []);

      // massaging the data to be in the format of the calendarResponse,
      // spread over days in selected month
      parsedResponse.data = tempData;
      parsedResponse = JSON.stringify(parsedResponse);
      const calendarResponse: any = JsonApiParse(parsedResponse);

      return getFormatedSession(calendarResponse.userCalendarList || []);
    } catch (error) {
      console.log('processCalendarData: error', error);
      return [];
    }
  }

  //remove selected class based on lastSelectedDate - scoped to current calendar instance
  function removeSelectedClass() {
    const selector = `span.${styles.day}`;
    forEachCalendarElement(selector, (el: Element) => el.classList.remove(styles.selected));
  }

  function addSelectedClass(date: string) {
    const element = getDayElement(date);
    if (element) {
      element.classList.add(styles.selected);
    }
  }

  // const moveFocusToDetailViewFirstItem = () => {
  //   // await updateComplete;
  //   const selectedClasses = `.${styles.calendarDetailContainer} .${styles.loLink}`;
  //   const firstGoToElement: any =
  //     document.querySelectorAll(selectedClasses)?.[0];
  //   if (firstGoToElement) {
  //     firstGoToElement.focus();
  //   }
  // };

  const moveFocusToDetailViewLastItem = () => {
    //await this.updateComplete;
    const allLinks = getDetailViewLinks();
    const lastGoToElement: any = allLinks?.[allLinks?.length - 1];

    if (lastGoToElement) {
      lastGoToElement.focus();
    }
  };

  const keydown = useCallback(
    (event: any) => {
      // Only handle keyboard events if the active element is within this calendar
      const activeElement = getActiveElement();
      if (!activeElement) {
        return;
      }

      const allCourseLinks = getDetailViewLinks();
      if (event.key === 'Escape') {
        if (lastFocusedDayElement) {
          lastFocusedDayElement.focus();
          const dateButton = lastFocusedDayElement;
          dateButton.setAttribute('aria-pressed', 'false');
        }
        if (noOfCards === 1) {
          handleSessionsListBack();
        }
        if (noOfCards === 2) {
          makeDetailViewNonTabable();
        }
      } else if (
        event.shiftKey &&
        event.key === 'Tab' &&
        activeElement &&
        activeElement === allCourseLinks?.[0]
      ) {
        event.preventDefault();
        event.stopPropagation();
        moveFocusToDetailViewLastItem();
      } else if (
        !event.shiftKey &&
        event.key === 'Tab' &&
        activeElement &&
        activeElement === allCourseLinks?.[allCourseLinks.length - 1]
      ) {
        event.preventDefault();
        event.stopPropagation();
        moveFocusToDetailViewFirstItem();
      } else if (event.key === 'ArrowDown') {
        handleArrowKeys(event, 7, false);
      } else if (event.key === 'ArrowRight') {
        handleArrowKeys(event, 1, false);
      } else if (event.key === 'ArrowUp') {
        handleArrowKeys(event, 7, true);
      } else if (event.key === 'ArrowLeft') {
        handleArrowKeys(event, 1, true);
      }
    },
    [lastFocusedDayElement, noOfCards, sessionsForTheCurrentMonth]
  );

  useEffect(() => {
    // connected callback - scope to calendar container
    const calendarContainer = calendarContainerRef.current;
    if (calendarContainer) {
      calendarContainer.addEventListener('keydown', keydown);
    }

    return () => {
      if (calendarContainer) {
        calendarContainer.removeEventListener('keydown', keydown);
      }
    };
  }, [keydown]);

  const makeDetailViewNonTabable = () => {
    const selector = `.${styles.loLink}`;
    forEachCalendarElement(selector, (button: Element) => {
      button.setAttribute('tabindex', '-1');
    });
  };

  const daysInMonth = (date: Date) => {
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    return new Date(year, month, 0).getDate();
  };

  const handleArrowKeys = (event: any, days: number, isPastDate: boolean) => {
    const element = getActiveElement();
    if (!element) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();

    const selectedDateStr = element.getAttribute('data-of-day');

    if (selectedDateStr) {
      const selectedDate = new Date(selectedDateStr);
      if (!sessionsForTheCurrentMonth[selectedDate.getDate()]) {
        element.setAttribute('tabindex', '-1');
        element.setAttribute('aria-pressed', 'false');
      }
      const dayOfMonth = selectedDate.getDate();
      if (isPastDate) {
        days = days * -1;
        if (dayOfMonth + days < 1) {
          generatePreviousMonth();
          focusDateElement(selectedDate, days);
        } else {
          focusDateElement(selectedDate, days);
        }
      } else {
        if (dayOfMonth + days > daysInMonth(selectedDate)) {
          generateNextMonth();
          focusDateElement(selectedDate, days);
        } else {
          focusDateElement(selectedDate, days);
        }
      }
    }
  };

  const focusDateElement = (date: Date, days: number) => {
    const todaysDate = new Date();
    todaysDate.setHours(0, 0, 0, 0);
    const todaysDateStr = todaysDate.toISOString();

    const todayButton = getDateButton(todaysDateStr);
    if (todayButton && !sessionsForTheCurrentMonth[todaysDate.getDate()]) {
      setElementAttributes(todayButton, {
        tabindex: '-1',
        'aria-pressed': 'false',
      });
    }
    const nextDateStr = new Date(
      date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000)
    ).toISOString();
    const nextElement: any = getDateButton(nextDateStr);
    if (nextElement) {
      setElementAttributes(nextElement, { tabindex: '0' });
      nextElement.focus();
    }
    setLastFocusedDayElement(nextElement);
  };

  async function generateMonthFor(
    year: number,
    month: number,
    focusDates = false,
    currentMonthSessions: any = []
  ) {
    const lastFocusedElement = lastFocusedDayElement! as HTMLElement;
    if (lastFocusedElement) {
      lastFocusedElement.setAttribute('tabindex', '-1');
    }
    setSessionsForTheCurrentMonth(currentMonthSessions);

    const givenDate = new Date(year, month - 1);
    const todaysDate = new Date();

    const setTodayInCalendar =
      givenDate.getMonth() === todaysDate.getMonth() &&
      givenDate.getFullYear() === todaysDate.getFullYear()
        ? true
        : false;

    const firstDayOfTheMonth = new Date(year, month - 1).getDay();
    const getTotalNumberOfDaysInThisMonth = 32 - new Date(year, month - 1, 32).getDate();

    const maxRowsInACalendar = 6;
    const maxColumnInACalendar = 7;

    let day = 1;

    const daysTemplate = [];
    let rowsTemplate = [];

    for (let row = 0; row < maxRowsInACalendar; row++) {
      rowsTemplate = [];
      for (
        let col = 0;
        col < maxColumnInACalendar && day <= getTotalNumberOfDaysInThisMonth;
        col++
      ) {
        if (row === 0 && col < firstDayOfTheMonth) {
          rowsTemplate.push(<td key={`empty-${row}-${col}`} className={styles.days}></td>);
        } else {
          const curDate = new Date(year, month - 1, day, 0, 0, 0, 0);
          const dayOfWeek = curDate.getDay();
          const dayStr = dayOfWeekFullName[dayOfWeek];
          const date = curDate.toISOString();
          const isDayCurrentDate = day === todaysDate.getDate() && setTodayInCalendar;
          const dateText = `${dayStr}, ${months[givenDate.getMonth()]} ${day} ${year}`;

          const formattedDate = curDate.toLocaleDateString('en-US', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          });
          const ariaLabel = currentMonthSessions[day]
            ? GetTranslationReplaced('text.calendar.session.planned', dateText)
            : dateText;
          const calendarDayClass = `${styles.day} ${
            isDayCurrentDate ? styles.today : ''
          } ${currentMonthSessions[day] ? styles.hasSession : ''}`;
          if (noOfCards === 2) {
            rowsTemplate.push(
              <>
                <td key={`day-${row}-${col}`} className={styles.days}>
                  <button
                    id={`primelxp-calendar-date-${date}`}
                    data-automationid={`primelxp-calendar-date-${formattedDate}`}
                    className={styles.dayButton}
                    tabIndex={
                      currentMonthSessions[day]
                        ? 0
                        : setTodayInCalendar
                          ? isDayCurrentDate
                            ? 0
                            : -1
                          : focusDates && day === 1
                            ? 0
                            : -1
                    }
                    aria-current={isDayCurrentDate ? 'date' : 'false'}
                    onClick={e => showDetailView(e, currentMonthSessions, month, year)}
                    data-of-day={date}
                    aria-label={ariaLabel}
                    aria-pressed="false"
                  >
                    <span
                      className={`${styles.calendarDayDouble} ${calendarDayClass}`}
                      aria-hidden="true"
                    >
                      {day}
                    </span>
                  </button>
                </td>
              </>
            );
          } else if (noOfCards === 1) {
            rowsTemplate.push(
              <td key={`day-${row}-${col}`} className={styles.days}>
                <button
                  id="primelxp-calendar-date-${date}"
                  data-automationid="primelxp-calendar-date-${formattedDate}"
                  className={styles.dayButton}
                  onClick={e => showSingleCalendarDetailView(e)}
                  data-of-day={date}
                  aria-current={isDayCurrentDate ? 'date' : 'false'}
                  aria-describedby="id-calendar-detail-tooltip"
                  aria-label={ariaLabel}
                  aria-pressed="false"
                  tabIndex={
                    currentMonthSessions[day]
                      ? 0
                      : setTodayInCalendar
                        ? isDayCurrentDate
                          ? 0
                          : -1
                        : focusDates && day == 1
                          ? 0
                          : -1
                  }
                >
                  <span className={calendarDayClass} aria-hidden="true">
                    {day}
                  </span>
                </button>
              </td>
            );
          }
          day++;
        }
      }
      if (rowsTemplate.length > 0) {
        daysTemplate.push(
          <tr key={`calendar-row-${row}`} style={{ display: 'flex', width: '100%' }}>
            {rowsTemplate}
          </tr>
        );
      }
    }
    setDaysTemplate(daysTemplate);
  }

  const toggleCitySelection = (name: string) => {
    const updatedCities = new Set(selectedCities);

    if (updatedCities.has(name)) {
      updatedCities.delete(name);
    } else {
      updatedCities.add(name);
    }

    setSelectedCities(updatedCities);
  };

  async function showDetailView(
    event: any,
    sessionsForTheCurrentMonth: any,
    month: number,
    year: number
  ) {
    removeSelectedClass();

    const currentTarget = event.currentTarget;
    const lastTarget: any = lastFocusedDayElement;
    let lastSelectedDateCopy = lastSelectedDate;
    if (lastTarget) {
      lastSelectedDateCopy = new Date(lastTarget.getAttribute('data-of-day')).getDate().toString();
      setLastSelectedDate(lastSelectedDateCopy);
      if (!sessionsForTheCurrentMonth[lastSelectedDateCopy]) {
        lastTarget.setAttribute('tabindex', '-1');
        lastTarget.setAttribute('aria-pressed', 'false');
      }
    }
    setLastFocusedDayElement(currentTarget);
    setLastSelectedDate(currentTarget?.getAttribute('data-of-day'));
    currentTarget?.setAttribute('tabindex', '0');
    currentTarget?.setAttribute('aria-pressed', 'true');
    addSelectedClass(currentTarget?.getAttribute('data-of-day'));

    const day: number = new Date(currentTarget?.getAttribute('data-of-day')).getDate();
    const entries: Array<Record<string, unknown>> = sessionsForTheCurrentMonth[day]
      ? sessionsForTheCurrentMonth[day]
      : [];

    generateDetailView(entries, day, month, year);
    //useEffect -> LastSelectedDate,LastFocusedDayElement

    // if (lastTarget !== currentTarget) {
    //   scrollToTopOfDetailView(".primelxp-calendar-detail-body");
    // }
  }
  useEffect(() => {
    moveFocusToDetailViewFirstItem();
    makeDetailViewTabable();
    scrollToTopOfDetailView(`.${styles.detailBody}`);
  }, [lastFocusedDayElement]);

  function moveFocusToDetailViewFirstItem() {
    const allDetailViewLinks = getDetailViewLinks();
    const firstGoToElement: any = allDetailViewLinks?.[0];
    if (firstGoToElement) {
      firstGoToElement.focus();
    }
  }
  function makeDetailViewTabable() {
    const selector = `.${styles.loLink}`;
    forEachCalendarElement(selector, (button: Element) => {
      button.setAttribute('tabindex', '0');
    });
  }

  function scrollToTopOfDetailView(selector: string) {
    const element = getCalendarElement(selector);

    if (element && element.scrollTop) {
      element.scrollTop = 0;
    }
  }
  function getLoViewRefLink(entry: PrimeUserCalendar) {
    const learningObject = entry.course;
    const loType = learningObject.loType;
    const loId = learningObject.id;
    switch (loType) {
      case 'course':
        const instanceClicked = learningObject.instances.filter(loInstance => {
          return loInstance.localizedMetadata[0].name === entry.courseInstanceName;
        });
        const instanceIdClicked =
          instanceClicked.length > 0 ? instanceClicked[0].id.split('_')[1] : '';
        if (entry.enrolled && !entry.enrolledToCourseInstance) {
          return `${GetShowCourseInstancePreviewPageLink()}?courseId=${loId}&instanceId=${instanceIdClicked}`;
        }
        return instanceIdClicked
          ? `${GetCourseInstancePreviewPageLink()}?courseId=${loId}&instanceId=${instanceIdClicked}`
          : `${GetCoursePageLink()}?courseId=${loId}`;
      case 'learningProgram':
        return `${GetLPPageLink()}?lpId=${loId}`;
      case 'certification':
        return `${GetCertPageLink()}?certId=${loId}`;
      case 'jobAid':
        return null;
      default:
        return null;
    }
  }

  const isCalendarLinkDisabled = () => {
    const config = getWidgetConfig();
    return config?.disableLinks || disableLinks;
  };

  function handleClickOnSessions(entry: PrimeUserCalendar) {
    if (!isCalendarLinkDisabled()) {
      SendLinkEvent(getLoViewRefLink(entry));
    }
  }

  const DetailView = (props: { entry: any; handleClickOnSessions: (entry: any) => void }) => {
    const { entry } = props;
    const { listThumbnailBgStyle } = useCardIcon(entry.course, INSTANCE_CARD_BACKGROUND_SIZE);
    let imageUrl = entry.course.imageUrl;
    let previewImageClass = styles.loImage;
    let previewImageContainerClass = '';
    const loDetailClass = ''; //need to check - used to disable links

    if (!imageUrl) {
      imageUrl = GetTileImageFromId(entry.course.id);
      previewImageClass = styles.loDefaultImg;
      previewImageContainerClass = styles.loDefaultImgContainer;
    }
    let location = '';
    if (entry.room) {
      location = `${entry.room.roomName}`;
      if (entry.room.city) {
        location += `, ${entry.room.city}`;
      }
    }

    const isWaitlisted = entry.course.enrollment?.state === WAITING;

    const { timeRange, timezoneDisplay } = useMemo(() => {
      return formatTimeRangeWithTimezone(
        entry.dateStart,
        entry.dateEnd,
        user,
        locale,
        user?.account
      );
    }, [entry.dateStart, entry.dateEnd, user, locale]);

    const fullText = timezoneDisplay
      ? `${timeRange} ${timezoneDisplay}${entry.location ? ` | ${entry.location}` : ''}`
      : timeRange;

    return (
      <div className={styles.loDetail} role="listitem">
        <div
          className={`${styles.loImageContainer} ${previewImageContainerClass}`}
          style={{ ...listThumbnailBgStyle }}
        >
          {entry.imageUrl ? (
            <img
              className={previewImageClass}
              src={entry.imageUrl}
              alt={GetTranslationReplaced('cw.aria.label.image.of.course', entry.courseName)}
            />
          ) : (
            ''
          )}
        </div>
        <div className={styles.loDescriptionContainer}>
          <div className={styles.overflowEllipsis}>
            <span className={styles.loSessiontime}>
              <span className={styles.textOverflow} title={fullText}>
                {fullText}
              </span>
            </span>
          </div>
          <div
            className={styles.loSessionName}
            id={`sessionname-${entry.sessionName}`}
            data-automationid={`sessionname-${entry.sessionName}`}
            title={`sessionname-${entry.sessionName}`}
          >
            {entry.sessionName}
          </div>
          <button
            className={`${styles.loCourseName} ${styles.loDetailClass}`}
            onClick={() => handleClickOnSessions(entry)}
            id={`coursename-${entry.courseName}`}
            data-automationid={`coursename-${entry.courseName}`}
            title={`coursename-${entry.courseName}`}
          >
            {entry.courseName}
          </button>
          <div className={styles.loDescriptionCourseType}>
            {entry.enrolled && entry.enrolledToCourseInstance ? (
              entry.course.enrollment?.state === 'PENDING_APPROVAL' ||
              entry.course.enrollment?.state === 'PENDING_ACCEPTANCE' ||
              isWaitlisted ? (
                <div
                  className={`${styles.loState} ${styles.pending}`}
                  id={`lo-state-${entry.courseName}`}
                  data-automationid={`lo-state-${entry.courseName}`}
                >
                  <div className={styles.pendingIndicator}></div>
                  {GetTranslation(isWaitlisted ? 'cw.session.waitlisted' : 'cw.session.pending')}
                </div>
              ) : (
                <div
                  className={`${styles.loState} ${styles.loCoursesType} ${styles.enrolled}`}
                  id={`lo-state-${entry.courseName}`}
                  data-automationid={`lo-state-${entry.courseName}`}
                >
                  <div className={styles.enrolledIndicator}></div>
                  {GetTranslation('cw.session.enrolled')}
                </div>
              )
            ) : (
              <div
                className={styles.loSessionType}
                title={
                  entry.courseType === 'VC'
                    ? GetTranslation('cw.lo.session.type.vc', true)
                    : GetTranslation('cw.lo.session.type.cr', true)
                }
              >
                <label className={styles.loCoursesType}>
                  {entry.courseType === 'VC'
                    ? TransformToUpperCase(GetTranslation('cw.lo.session.type.vc', true), locale)
                    : TransformToUpperCase(GetTranslation('cw.lo.session.type.cr', true), locale)}
                </label>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  function generateDetailView(
    entriesForDate: Array<Record<string, unknown>>,
    day: number,
    month: number,
    year: number
  ) {
    const detailViewTemplate = [];

    if (!entriesForDate.length) {
      detailViewTemplate.push(emptyCalendar());
    }

    entriesForDate.forEach((entry: any, index: number) => {
      const loDetailClass = ''; // need to check
      detailViewTemplate.push(
        <DetailView
          key={`detail-${entry.id || entry.sessionName || index}`}
          entry={entry}
          handleClickOnSessions={handleClickOnSessions}
        />
      );
    });
    //Adds gradient
    // if (detailViewTemplate.length >= 4) {
    //   detailViewTemplate.push(
    //     <div
    //       style={{
    //         position: "sticky",
    //         zIndex: "1",
    //         bottom: "0",
    //         background:
    //           "linear-gradient(180deg, rgba(255, 255, 255, 0.00) 0%, rgba(255, 255, 255, 0.79) 84.5%)",
    //         height: "15px",
    //       }}
    //     ></div>
    //   );
    // }

    // bug - month changes
    setDetailViewTemplate(detailViewTemplate);
    setDetailViewTitle({
      ...detailViewTitle,
      day: day,
      month: months[month - 1],
      year: year,
    });
  }

  async function showSingleCalendarDetailView(event: any) {
    const eventCopy = { ...event };
    setSingleCalendarView(CALENDAR_VIEWS.SESSIONS);
    setCalendarViewEvent(eventCopy);
  }

  useEffect(() => {
    if (calendarViewEvent) {
      showDetailView(calendarViewEvent, sessionsForTheCurrentMonth, month, year);
    }
  }, [calendarViewEvent]);

  async function generateNextMonth(focusDates = false): Promise<void> {
    let yearCopy = year;
    let monthCopy = month;
    if (month === 12) {
      monthCopy = 1;
      setMonth(1);
      setYear(year + 1);
      yearCopy++;
    } else {
      setMonth(month + 1);
      monthCopy++;
    }
    await fetchAndRenderCalendar(yearCopy, monthCopy, focusDates);
  }

  async function generatePreviousMonth(focusDates = false): Promise<void> {
    let prevMonth = month;
    let yearLoc = year;
    if (month === 1) {
      prevMonth = 12;
      yearLoc = year - 1;
    } else {
      prevMonth = month - 1;
    }
    setMonth(prevMonth);
    setYear(yearLoc);
    await fetchAndRenderCalendar(yearLoc, prevMonth, focusDates);
  }

  async function getEventsData() {
    const locations = await fetchLocations();
    setLocations(locations);
  }

  async function fetchDataForMonth(y: number, m: number) {
    setFetchingMonth(true);
    try {
      const userResponse = await getALMUser();
      const userId = userResponse?.user?.id;
      const calendardata = await getCPrimeCalendarData(userId!, y, m);
      setFetchingMonth(false);

      const formatted = processCalendarData(calendardata, y, m);
      return formatted;
    } catch (error) {
      setFetchingMonth(false);
      return [];
    }
  }

  async function fetchLocations() {
    const locations = await getCities();
    return locations;
  }

  const getSortedAndFilteredData = (calendarData: any, y: number, m: number) => {
    if (calendarData && calendarData[y] && calendarData[y][m]) {
      const calendarDataForMonth = calendarData[y][m] || {};

      const filteredData = applyFilters(calendarDataForMonth);

      Object.keys(filteredData).map((session: any) =>
        filteredData[session].sort((session1: any, session2: any) => {
          const isSession1Enrolled = session1.enrolled && session1.enrolledToCourseInstance;
          const isSession2Enrolled = session2.enrolled && session2.enrolledToCourseInstance;
          if (isSession1Enrolled && !isSession2Enrolled) {
            return -1;
          }
          if (!isSession1Enrolled && isSession2Enrolled) {
            return 1;
          }
          return (new Date(session1.dateStart) as any) - (new Date(session2.dateStart) as any);
        })
      );
      return filteredData;
    } else {
      setFetchingMonth(false);
      return {};
    }
  };

  async function fetchAndRenderCalendar(y: number, m: number, focusDates = false) {
    const data = await fetchDataForMonth(y, m);
    const calendarDataToRender = getSortedAndFilteredData(data, y, m);

    generateMonthFor(y, m, focusDates, calendarDataToRender);

    // Generate detail view for today's date with original data
    const todaysDate = new Date().getDate();
    const todaysSessions = calendarDataToRender[todaysDate] ? calendarDataToRender[todaysDate] : [];
    generateDetailView(
      todaysSessions as unknown as Array<Record<string, unknown>>,
      todaysDate,
      m,
      y
    );
  }

  // Rest of your code
  useEffect(() => {
    getEventsData();
    fetchAndRenderCalendar(year, month);
  }, []);

  function handleFilterClick(view: any) {
    if (isSingleCalender) {
      setSingleCalendarView(view);
      return;
    }
    setDoubleCalendarView(view);
  }

  const keyDownBind = (event: any) => keydown(event);

  const handleApplyFilterClick = () => {
    // Save current selections as applied filters
    setAppliedCities(new Set(selectedCities));
    setAppliedViewEnrolledOnly(viewEnrolledSessionsOnly);

    // Re-render calendar with applied filters
    fetchAndRenderCalendar(year, month);

    // Switch back to calendar view
    handleFilterClick(CALENDAR_VIEWS.CALENDAR);
  };

  const viewEnrolledSessionChange = () => {
    setViewEnrolledSessionsOnly(prevState => !prevState); //change to not of prevState
  };

  const emptyCalendar = () => {
    return (
      <div className={styles.calendarEmptyBody} key={`${widgetId}-empty-calendar`}>
        <div className={styles.calendarEmptyBodyIcon}>{EMPTY_STATE_CARD()}</div>
        <div
          className={styles.calendarEmptyBodyString}
          data-automationid="primelxp-calendar-nosessions"
        >
          {GetTranslation('cw.empty.detail.message')}
        </div>
      </div>
    );
  };
  function renderCalendarView(containerWidth: string, calendarBodyExtraClass = '') {
    return (
      <div className={styles.calendarContainer} style={{ width: containerWidth }}>
        <div
          id="id-calendar-header-title"
          data-automationid="id-calendar-header-title"
          role="heading"
          aria-level={2}
          className={styles.srOnly}
          aria-label={GetTranslation('cw.aria.label.calendar.body')}
        ></div>
        {/* <div > */}
        <h2 className={styles.calendarHeader} role="presentation">
          <button
            tabIndex={0}
            aria-label={GetTranslation('cw.aria.label.pre.month')}
            onClick={() => generatePreviousMonth(true)}
            className={styles.previousMonth}
            data-automationid="calendar-previous-month"
          >
            <div className={styles.leftArrow}></div>
          </button>
          <div
            className={styles.calendarHeaderTitle}
            title={`${GetTranslationsReplaced('cw.calendar.view.title', {
              month: months[month - 1],
              year: year,
            })}`}
          >
            {GetTranslationsReplaced('cw.calendar.view.title', {
              month: months[month - 1],
              year: year,
            })}
          </div>
          <button
            tabIndex={0}
            aria-label={GetTranslation('cw.aria.label.next.month')}
            onClick={() => generateNextMonth(true)}
            id={styles.nextMonth}
            data-automationid="nextMonth"
          >
            <div className={styles.rightArrow}></div>
          </button>
        </h2>

        <table className={styles.calendarBody} role="grid">
          <thead className={styles.weeksContainer}>
            <tr className={styles.calendarWeeks}>
              {dayOfWeek.map((day, index) => (
                <th scope="col" className={styles.calendarWeeks} key={`${day}${index}`}>
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={styles.daysContainer}>{daysTemplate}</tbody>
        </table>
        <div className={`${styles.sessionFilter} ${styles.containerPadding}`}>
          <button
            className={styles.filterBtn}
            tabIndex={0}
            aria-label={GetTranslation('cw.filter.session')}
            onClick={() => handleFilterClick(CALENDAR_VIEWS.FILTER)}
            id="calendar-filter-sessions"
            data-automationid="calendar-filter-sessions"
          >
            <span className={`${styles.filterIcon} ${isFilterApplied ? styles.dot : ''}`}>
              {FILTER_ICON()}
            </span>
            {GetTranslation('cw.filter.session')}
          </button>
        </div>
      </div>
    );
  }
  function renderSessionsListView(containerWidth: '100%' | '50%') {
    return (
      <div
        className={`${styles.calendarDetailContainer} ${styles.containerPadding}`}
        style={{ width: containerWidth }}
        id={`${detailViewTitle.month}_${detailViewTitle.day}_${detailViewTitle.year}`}
        data-automationid={`${detailViewTitle.month}_${detailViewTitle.day}_${detailViewTitle.year}`}
      >
        <div
          role="none"
          className={styles.srOnly}
          aria-label={GetTranslation('cw.aria.label.instruction.to.enter.tooltip.detail.body')}
        ></div>
        <div className={styles.calendarDetailHeader} data-automationid="calendar-detail-header">
          {isSingleCalender ? (
            <button
              tabIndex={0}
              className={styles.previousMonth}
              aria-label={GetTranslation('cw.aria.label.pre.month')}
              onClick={() => handleSessionsListBack()}
              data-automationid="calendar-previous-month"
            >
              <div className={styles.leftArrow}></div>
            </button>
          ) : (
            ''
          )}
          <div
            className={styles.calendarDetailHeaderTitle}
            title={GetTranslationsReplaced('cw.detail.view.date.title', {
              month: detailViewTitle.month,
              day: detailViewTitle.day,
              year: detailViewTitle.year,
            })}
          >
            <time>
              {GetTranslationsReplaced('cw.detail.view.date.title', {
                month: detailViewTitle.month,
                day: detailViewTitle.day,
                year: detailViewTitle.year,
              })}
            </time>
          </div>
        </div>
        <div
          className={styles.detailBody}
          aria-label={GetTranslation('text.calendar.planned.sessions')}
          role="list"
        >
          {detailViewTemplate}
        </div>
        <div
          role="none"
          className={styles.srOnly}
          aria-label={GetTranslation('cw.aria.label.instruction.to.leave.tooltip.detail.body')}
        ></div>
      </div>
    );
  }
  function handleSessionsListBack() {
    setSingleCalendarView(CALENDAR_VIEWS.CALENDAR);
  }

  // //review this function
  // function goToSessionsView(){
  //   let noCities:any = new Set()
  //   //restore previous state
  //   setViewEnrolledSessionsOnly(prevState=>prevState);
  //   handleFilterClick(CALENDAR_VIEWS.CALENDAR);
  // }

  function renderFilterView() {
    return (
      <div
        className={`${styles.calendarfilterContainer} ${styles.containerPadding}`}
        style={{ width: '100%' }}
        id={`${detailViewTitle.month}_${detailViewTitle.day}_${detailViewTitle.year}`}
        data-automationid={`${detailViewTitle.month}_${detailViewTitle.day}_${detailViewTitle.year}`}
      >
        <div
          role="none"
          className={styles.srOnly}
          aria-label={GetTranslation('cw.aria.label.instruction.to.enter.tooltip.detail.body')}
        ></div>
        <div className={styles.calendarDetailHeader}>
          <div
            className={styles.calendarDetailHeaderTitle}
            data-automationid="calendar-filter-session"
          >
            {GetTranslation('cw.filter.session')}
          </div>
        </div>
        <div
          className={styles.detailBody}
          aria-label={GetTranslation('text.calendar.planned.sessions')}
          role="list"
        >
          <div className={styles.checkboxItem}>
            <input
              type="checkbox"
              id="view-enrolled-only"
              data-automationid="calendar-view-enrolled-only"
              onClick={() => viewEnrolledSessionChange()}
              checked={viewEnrolledSessionsOnly}
              className={styles.filterCheckbox}
              ref={enrolledSessionsRef}
            />
            <label
              htmlFor="view-enrolled-only"
              data-automationid="calendar-view-enrolled-only-label"
            >
              {GetTranslation('cw.filter.viewEnrolledSessionOnly')}
            </label>
          </div>
          <div className={styles.horizontalSeparator}></div>
          {locations.length > 0 ? (
            <div>
              <div
                className={styles.filterLocationList}
                data-automationid="calendar-filter-session-locations"
              >
                {GetTranslation('cw.filter.trainingLocations')}
              </div>
              <div>
                {locations.map(location => (
                  <div className={styles.checkboxItem} key={location}>
                    <input
                      type="checkbox"
                      id={location}
                      checked={selectedCities?.has(location)}
                      onClick={() => toggleCitySelection(location)}
                      className={styles.filterCheckbox}
                      data-automationid={`calendar-${location}`}
                    />
                    <label
                      className={styles.overflowEllipsis}
                      title={location}
                      htmlFor={location}
                      data-automationid={`calendar-${location}-label`}
                    >
                      {location}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            ''
          )}
        </div>
        <div className={styles.sessionFilter}>
          <button
            className={styles.applyFilter}
            aria-label={GetTranslation('cw.filter.apply')}
            onClick={() => handleApplyFilterClick()}
            id="calendar-apply-filter"
            data-automationid="calendar-apply-filter"
          >
            {GetTranslation('cw.filter.apply')}
            {/* <span className="primelxp-calendar-right-arrow"></span> */}
          </button>
        </div>
        <div
          role="none"
          className={styles.srOnly}
          aria-label={GetTranslation('cw.aria.label.instruction.to.leave.tooltip.detail.body')}
        ></div>
      </div>
    );
  }

  function renderSingleViewCalendar() {
    let viewToRender = <div></div>;

    switch (singleCalendarView) {
      case CALENDAR_VIEWS.CALENDAR:
        viewToRender = renderCalendarView(`100%`, styles.calendarBodySingle);
        break;
      case CALENDAR_VIEWS.FILTER:
        viewToRender = renderFilterView();
        break;
      case CALENDAR_VIEWS.SESSIONS:
        viewToRender = renderSessionsListView(`100%`);
        break;
    }
    return (
      <section
        className={styles.widgetContainer}
        role="complementary"
        aria-labelledby="id-calendar-header-title"
        style={{ width: `${singleCardWidth}px`, height: `${CARD_HEIGHT}px` }}
      >
        {viewToRender}
      </section>
    );
  }
  function renderDoubleViewCalendar() {
    let viewToRender = <div></div>;

    switch (doubleCalendarView) {
      case CALENDAR_VIEWS.CALENDAR:
        viewToRender = (
          <>
            {renderCalendarView('50%')}
            <div role="separator" className={styles.separator}></div>
            {renderSessionsListView('50%')}
          </>
        );
        break;
      case CALENDAR_VIEWS.FILTER:
        viewToRender = renderFilterView();
        break;
    }
    return (
      <section
        className={styles.widgetContainer}
        role="complementary"
        aria-labelledby="id-calendar-header-title"
        style={{
          width: `${containerWidth}px`,
          height: `${CARD_HEIGHT}px`,
        }}
      >
        {viewToRender}
      </section>
    );
  }

  const calendarStr = GetTranslation('calendar');
  const heading = GetTranslation(`${widgetId}.title`) || widget.attributes?.title;
  const widgetDescription =
    GetTranslation(`${widgetId}.description`) || widget.attributes?.description;
  const { isHovered, widgetContainerWidth, widgetContainerHeight, changeHoverState } =
    useWidgetInspectMode({
      sectionRef: calendarContainerRef,
    });

  const renderContent = () => {
    if (fetchingData) {
      return (
        <div className={styles.loadingContainer}>
          <ALMWidgetLoader />
        </div>
      );
    }
    return isSingleCalender ? renderSingleViewCalendar() : renderDoubleViewCalendar();
  };

  return (
    <ALMErrorBoundary>
      <section
        ref={calendarContainerRef}
        id={widgetId}
        className={styles.container}
        onMouseEnter={changeHoverState}
        onMouseLeave={changeHoverState}
      >
        {isCustomPage ? (
          <div>
            {isInspectMode && isHovered && (
              <ALMWidgetInspectMode
                widget={widget}
                widgetWidth={widgetContainerWidth}
                widgetHeight={widgetContainerHeight}
              />
            )}
            <ALMStripWidgetHeader
              heading={heading}
              widgetId={widgetId}
              widgetDescription={widgetDescription}
              isLeftNavIconDisabled={true}
              isRightNavIconDisabled={true}
              rollAPage={() => {}}
              showNavIcons={false}
            />
          </div>
        ) : (
          <h2
            data-automationid="calendar-header"
            aria-labelledby={calendarStr}
            className={styles.header}
            data-skip-link-target={widgetId}
            tabIndex={0}
          >
            {calendarStr}
          </h2>
        )}
        <div
          ref={isCustomPage ? sectionRef : undefined}
          className={styles.contentContainer}
          style={{
            height: `${CARD_HEIGHT}px`,
            opacity: fetchingMonth ? 0.5 : 1,
            pointerEvents: fetchingMonth ? 'none' : 'auto',
          }}
        >
          {renderContent()}
        </div>
      </section>
    </ALMErrorBoundary>
  );
};

export default CalendarWidget;
