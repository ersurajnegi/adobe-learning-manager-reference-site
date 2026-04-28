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
import { IntlProvider } from 'react-intl';
import { Provider as SpectrumProvider, defaultTheme } from '@adobe/react-spectrum';
import PrimeInstanceItem from '@components/Instance/PrimeInstanceItem/PrimeInstanceItem';
import '@testing-library/jest-dom/extend-expect';

jest.mock('@utils/translationService', () => ({
  GetTranslation: (key: string) => key,
  getPreferredLocalizedMetadata: (data: any) => data,
  formatMap: {
    'Self Paced': 'alm.format.selfPaced',
    Classroom: 'alm.format.classroom',
  },
}));

jest.mock('@utils/dateTime', () => ({
  formatTime: (date: string) => (date ? '10:00 AM' : ''),
  GetFormattedDate: (date: string) => (date ? '12/31/2024' : ''),
}));

jest.mock('@utils/timezoneUtils', () => ({
  formatSingleTimeWithTimezone: () => ({ time: '10:00 AM', timezoneDisplay: 'PST' }),
  formatDateWithTimezone: (date: string) => (date ? '12/31/2024' : ''),
}));

jest.mock('@utils/overview', () => ({
  checkIsEnrolled: (enrollment: any) => enrollment?.state !== 'WAITING',
}));

jest.mock('@utils/price', () => ({
  getFormattedPrice: (price: number) => `$${price}`,
}));

jest.mock('@utils/global', () => ({
  getFormattedDataFromIndex: (arr: string[], index: number) => arr.slice(index).join(', '),
}));

jest.mock('@contextProviders/userContextProvider', () => ({
  useUserContext: () => ({ user: { contentLocale: 'en-US', account: {} } }),
}));

jest.mock('@spectrum-icons/workflow/Calendar', () => () => null);
jest.mock('@spectrum-icons/workflow/Location', () => () => null);
jest.mock('@spectrum-icons/workflow/Money', () => () => null);
jest.mock('@spectrum-icons/workflow/User', () => () => null);
jest.mock('@spectrum-icons/workflow/CheckmarkCircle', () => () => null);

// Messages without defaultMessage in the component source require explicit provision
const intlMessages = {
  'alm.overviewseatsAvailableMsg': 'Seats Available',
  'alm.overview.no.seats.available': 'No seats available',
  'alm.overview.waitlist.position': 'Waitlist position: ',
  'alm.text.language': 'Language',
  'alm.instance.instructors': 'Instructors',
  'alm.text.more': 'more',
  'alm.catalog.filter.completed': 'Completed',
  'alm.instance.enrolBy.label': 'Enroll by',
  'alm.instance.select': 'Select',
};

const renderItem = (props: any) =>
  render(
    <SpectrumProvider theme={defaultTheme}>
      <IntlProvider locale="en" messages={intlMessages}>
        <PrimeInstanceItem {...props} />
      </IntlProvider>
    </SpectrumProvider>
  );

const makeProps = (overrides: object = {}) => ({
  id: 'instance-1',
  instanceId: 'instance-1',
  name: 'Test Instance',
  format: 'Self Paced',
  showStartDateAndInstructor: false,
  showLocation: false,
  showCompletionDateColumn: false,
  startDate: null,
  completionDate: null,
  enrollByDate: null,
  location: [],
  instructorsName: [],
  selectInstanceHandler: jest.fn(),
  locale: 'en-US',
  price: null,
  enrollment: null,
  showProgressBar: false,
  seatLimit: null,
  seatsAvailable: null,
  extension: null,
  extensionClickHandler: jest.fn(),
  hasCrVcModule: false,
  waitlistPosition: null,
  instanceLanguage: 'English',
  ...overrides,
});

describe('PrimeInstanceItem', () => {
  describe('Select handler', () => {
    it('selectHandler_instanceNameClicked_callsSelectInstanceHandlerWithId', () => {
      const selectInstanceHandler = jest.fn();
      renderItem(makeProps({ selectInstanceHandler }));

      fireEvent.click(screen.getByText('Test Instance'));

      expect(selectInstanceHandler).toHaveBeenCalledWith('instance-1');
      expect(selectInstanceHandler).toHaveBeenCalledTimes(1);
    });

    it('selectHandler_selectButtonClicked_callsSelectInstanceHandlerWithId', () => {
      const selectInstanceHandler = jest.fn();
      renderItem(makeProps({ selectInstanceHandler }));

      fireEvent.click(screen.getByText('Select'));

      expect(selectInstanceHandler).toHaveBeenCalledWith('instance-1');
    });
  });

  describe('Seat availability', () => {
    it('seatsAvailableText_seatLimitWithPositiveCount_showsCountInLabel', () => {
      renderItem(makeProps({ seatLimit: 10, seatsAvailable: 5 }));

      const el = screen.getByText(/Seats Available/);
      expect(el.textContent).toBe('Seats Available: 5');
    });

    it('seatsAvailableText_seatLimitWithZeroSeatsUnenrolled_showsNoSeatsAvailable', () => {
      renderItem(makeProps({ seatLimit: 10, seatsAvailable: 0 }));

      expect(screen.getByText('No seats available')).toBeInTheDocument();
    });

    it('seatsAvailableText_seatLimitWithZeroSeatsAndWaitingEnrollment_showsWaitlistPosition', () => {
      renderItem(makeProps({
        seatLimit: 10,
        seatsAvailable: 0,
        enrollment: { state: 'WAITING' },
        waitlistPosition: 3,
      }));

      const el = screen.getByText(/Waitlist position:/);
      expect(el.textContent).toBe('Waitlist position: 3');
    });

    it('seatsAvailableText_hasCrVcModuleNoSeatLimit_showsSeatsAvailableLabel', () => {
      renderItem(makeProps({ hasCrVcModule: true, seatLimit: null }));

      expect(screen.getByText('Seats Available')).toBeInTheDocument();
    });

    it('seatsAvailableText_enrolledNonWaiting_seatsInfoRowEmpty', () => {
      // The .seatsInfo <p> always renders but is gated by !enrollment || WAITING
      const { container } = renderItem(makeProps({
        seatLimit: 10,
        seatsAvailable: 5,
        enrollment: { state: 'ENROLLED' },
      }));

      expect(container.querySelector('.seatsInfo')?.textContent).toBe('');
    });
  });

  describe('Language', () => {
    it('language_instanceLanguageProvided_rendersLabelWithValue', () => {
      renderItem(makeProps({ instanceLanguage: 'English' }));

      const el = screen.getByText(/Language/);
      expect(el.textContent).toBe('Language: English');
    });

    it('language_instanceLanguageNull_notRendered', () => {
      renderItem(makeProps({ instanceLanguage: null }));

      expect(screen.queryByText(/Language/)).not.toBeInTheDocument();
    });
  });

  describe('Instructors', () => {
    it('instructors_showFlagWithSingleInstructor_rendersInstructorName', () => {
      renderItem(makeProps({
        showStartDateAndInstructor: true,
        instructorsName: ['John Doe'],
      }));

      expect(screen.getByText(/Instructors/)).toBeInTheDocument();
      expect(screen.getByText(/John Doe/)).toBeInTheDocument();
    });

    it('instructors_showFlagWithMultipleInstructors_rendersPlusNMore', () => {
      renderItem(makeProps({
        showStartDateAndInstructor: true,
        instructorsName: ['John Doe', 'Jane Smith', 'Bob Johnson'],
      }));

      expect(screen.getByText(/John Doe/)).toBeInTheDocument();
      expect(screen.getByText(/\+2.*more/)).toBeInTheDocument();
    });

    it('instructors_showFlagWithEmptyArray_instructorsParagraphNotRendered', () => {
      const { container } = renderItem(makeProps({
        showStartDateAndInstructor: true,
        instructorsName: [],
      }));

      expect(container.querySelector('.instructorsName')).not.toBeInTheDocument();
    });
  });

  describe('Progress bar', () => {
    it('progressBar_showProgressBarWithEnrolledState_rendersProgressPercent', () => {
      renderItem(makeProps({
        enrollment: { state: 'ENROLLED', progressPercent: 75 },
        showProgressBar: true,
      }));

      expect(screen.getByText('75%')).toBeInTheDocument();
    });

    it('progressBar_showProgressBarWithCompletedState_rendersCompletedText', () => {
      renderItem(makeProps({
        enrollment: { state: 'COMPLETED', progressPercent: 100 },
        showProgressBar: true,
      }));

      expect(screen.getByText(/Completed/)).toBeInTheDocument();
    });

    it.each([
      ['showProgressBarFalse', { enrollment: { state: 'ENROLLED', progressPercent: 50 }, showProgressBar: false }],
      ['nullEnrollment',       { enrollment: null, showProgressBar: true }],
    ])('progressBar_%s_progressContainerNotRendered', (_, props) => {
      const { container } = renderItem(makeProps(props));
      expect(container.querySelector('.progressContainer')).not.toBeInTheDocument();
    });
  });

  describe('Enroll by date', () => {
    it('enrollByDate_unenrolledWithDate_showsEnrollByLabelAndDate', () => {
      renderItem(makeProps({ enrollByDate: '2024-12-31' }));

      expect(screen.getByText(/Enroll by/)).toBeInTheDocument();
      expect(screen.getByText('12/31/2024')).toBeInTheDocument();
    });

    it('enrollByDate_enrolled_notShown', () => {
      renderItem(makeProps({
        enrollByDate: '2024-12-31',
        enrollment: { state: 'ENROLLED' },
      }));

      expect(screen.queryByText(/Enroll by/)).not.toBeInTheDocument();
    });
  });

  describe('Start date', () => {
    it('startDate_showFlagWithDate_rendersDateTimeAndTimezone', () => {
      renderItem(makeProps({
        showStartDateAndInstructor: true,
        startDate: '2024-12-25',
      }));

      expect(screen.getByText(/12\/31\/2024/)).toBeInTheDocument();
      expect(screen.getByText(/10:00 AM/)).toBeInTheDocument();
      expect(screen.getByText('PST')).toBeInTheDocument();
    });

    it('startDate_showFlagWithNoDate_startDateParagraphNotRendered', () => {
      const { container } = renderItem(makeProps({
        showStartDateAndInstructor: true,
        startDate: null,
      }));

      expect(container.querySelector('.startDate')).not.toBeInTheDocument();
    });
  });

  describe('Completion date', () => {
    it('completionDate_showFlagWithDate_rendersDateAndTime', () => {
      renderItem(makeProps({
        showCompletionDateColumn: true,
        completionDate: '2024-12-31',
      }));

      expect(screen.getByText(/12\/31\/2024/)).toBeInTheDocument();
      expect(screen.getByText(/10:00 AM/)).toBeInTheDocument();
    });

    it('completionDate_showFlagWithNoDate_completionDateParagraphNotRendered', () => {
      const { container } = renderItem(makeProps({
        showCompletionDateColumn: true,
        completionDate: null,
      }));

      expect(container.querySelector('.completionDate')).not.toBeInTheDocument();
    });
  });

  describe('Location', () => {
    it('location_showFlagWithItems_rendersFirstLocation', () => {
      renderItem(makeProps({
        showLocation: true,
        location: ['New York'],
      }));

      expect(screen.getByText('New York')).toBeInTheDocument();
    });

    it('location_showFlagWithMultipleItems_rendersPlusNMore', () => {
      renderItem(makeProps({
        showLocation: true,
        location: ['New York', 'Los Angeles', 'Chicago'],
      }));

      expect(screen.getByText('New York')).toBeInTheDocument();
      expect(screen.getByText(/\+2.*more/)).toBeInTheDocument();
    });

    it('location_showFlagWithEmptyArray_locationContentNotRendered', () => {
      // showLocation renders the wrapper div but the inner <p> is gated by location.length > 0
      const { container } = renderItem(makeProps({
        showLocation: true,
        location: [],
      }));

      // locationWrapper div renders (for the column layout) but has no text content
      expect(container.querySelector('.locationWrapper')?.textContent).toBe('');
    });
  });

  describe('Price', () => {
    it('price_provided_rendersFormattedPrice', () => {
      renderItem(makeProps({ price: 99 }));

      expect(screen.getByText('$99')).toBeInTheDocument();
    });

    it('price_null_priceWrapperNotRendered', () => {
      const { container } = renderItem(makeProps({ price: null }));

      expect(container.querySelector('.priceWrapper')).not.toBeInTheDocument();
    });
  });

  describe('Extension', () => {
    it('extension_provided_rendersLabelAndCallsHandlerWithInstanceIdOnClick', () => {
      const extensionClickHandler = jest.fn();
      renderItem(makeProps({
        extension: { localizedMetadata: { label: 'Launch Extension' } },
        extensionClickHandler,
      }));

      const link = screen.getByText('Launch Extension');
      expect(link).toBeInTheDocument();

      fireEvent.click(link);
      expect(extensionClickHandler).toHaveBeenCalledWith('instance-1', expect.any(Object));
    });

    it('extension_null_extensionLinkNotRendered', () => {
      renderItem(makeProps({ extension: null }));

      expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });
  });
});
