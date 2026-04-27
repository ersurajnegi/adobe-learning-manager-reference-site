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
import PrimeInstanceCardMobile from '@components/Instance/PrimeInstanceCardMobile/PrimeInstanceCardMobile';
import '@testing-library/jest-dom/extend-expect';

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

jest.mock('@utils/widgets/common', () => ({
  INSTANCE_CARD_WIDTH: '400px',
}));

jest.mock('@contextProviders/userContextProvider', () => ({
  useUserContext: () => ({ user: { contentLocale: 'en-US', account: {} } }),
}));

// Messages used with formatMessage (no defaultMessage in component source)
const intlMessages = {
  'alm.instance.enrolBy.label': 'Enroll by',
  'alm.instance.instructors': 'Instructors',
  'alm.text.more': 'more',
  'alm.catalog.filter.completed': 'Completed',
  'alm.catalog.card.progress.percent': '{0}% complete',
  'alm.instance.start.date': 'Starts On',
  'alm.instance.completeBy.label': 'Complete By',
  'alm.instance.location': 'Location(s)',
  'alm.instance.price': 'Price',
  'alm.instance.select': 'Select',
};

const renderCard = (props: any) =>
  render(
    <SpectrumProvider theme={defaultTheme}>
      <IntlProvider locale="en" messages={intlMessages}>
        <PrimeInstanceCardMobile {...props} />
      </IntlProvider>
    </SpectrumProvider>
  );

// Each call creates fresh jest.fn() instances to avoid resetMocks:true interactions
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
  // Prop render helpers — implementations defined per test via makeProps overrides
  instanceName: jest.fn((name: string) => name),
  loFormat: jest.fn((fmt: string) => `Format: ${fmt}`),
  languageText: jest.fn((lang: string) => `Lang: ${lang}`),
  seatsAvailableText: jest.fn(() => ''),
  extensionLocalizedMetadata: jest.fn(
    (ext: any) => (ext ? { label: 'Extension Label' } : null)
  ),
  ...overrides,
});

describe('PrimeInstanceCardMobile', () => {
  describe('Select handler', () => {
    it('selectHandler_buttonPressed_callsSelectInstanceHandlerWithId', () => {
      const selectInstanceHandler = jest.fn();
      renderCard(makeProps({ selectInstanceHandler }));

      fireEvent.click(screen.getByText('Select'));

      expect(selectInstanceHandler).toHaveBeenCalledWith('instance-1');
      expect(selectInstanceHandler).toHaveBeenCalledTimes(1);
    });
  });

  describe('Enroll by date', () => {
    it('enrollByDate_unenrolledWithDate_showsEnrollByLabelAndDate', () => {
      renderCard(makeProps({ enrollByDate: '2024-12-31' }));

      expect(screen.getByText(/Enroll by/)).toBeInTheDocument();
      expect(screen.getByText(/12\/31\/2024/)).toBeInTheDocument();
    });

    it('enrollByDate_enrolled_enrollByLabelNotShown', () => {
      renderCard(makeProps({
        enrollByDate: '2024-12-31',
        enrollment: { state: 'ENROLLED' },
      }));

      expect(screen.queryByText(/Enroll by/)).not.toBeInTheDocument();
    });
  });

  describe('Instructors', () => {
    it('instructors_showFlagWithSingleInstructor_rendersInstructorName', () => {
      renderCard(makeProps({
        showStartDateAndInstructor: true,
        instructorsName: ['John Doe'],
      }));

      expect(screen.getByText(/Instructors/)).toBeInTheDocument();
      expect(screen.getByText(/John Doe/)).toBeInTheDocument();
    });

    it('instructors_showFlagWithMultipleInstructors_rendersPlusNMore', () => {
      renderCard(makeProps({
        showStartDateAndInstructor: true,
        instructorsName: ['John Doe', 'Jane Smith', 'Bob Johnson'],
      }));

      expect(screen.getByText(/John Doe/)).toBeInTheDocument();
      // First shown, rest collapsed into "+N more" tooltip span
      expect(screen.getByText(/\+2.*more/)).toBeInTheDocument();
    });

    it('instructors_showFlagWithEmptyArray_notShown', () => {
      renderCard(makeProps({
        showStartDateAndInstructor: true,
        instructorsName: [],
      }));

      expect(screen.queryByText(/Instructors/)).not.toBeInTheDocument();
    });
  });

  describe('Progress bar', () => {
    it('progressBar_showProgressBarWithEnrolledState_rendersProgressPercent', () => {
      renderCard(makeProps({
        enrollment: { state: 'ENROLLED', progressPercent: 75 },
        showProgressBar: true,
      }));

      expect(screen.getByText('75% complete')).toBeInTheDocument();
    });

    it('progressBar_showProgressBarWithCompletedState_rendersCompletedText', () => {
      renderCard(makeProps({
        enrollment: { state: 'COMPLETED', progressPercent: 100 },
        showProgressBar: true,
      }));

      expect(screen.getByText('Completed')).toBeInTheDocument();
    });

    it.each([
      ['showProgressBarFalse', { enrollment: { state: 'ENROLLED', progressPercent: 50 }, showProgressBar: false }],
      ['nullEnrollment',       { enrollment: null, showProgressBar: true }],
    ])('progressBar_%s_progressContainerNotRendered', (_, props) => {
      const { container } = renderCard(makeProps(props));
      expect(container.querySelector('.progressContainer')).not.toBeInTheDocument();
    });
  });

  describe('Start date', () => {
    it('startDate_showFlagWithDate_rendersDateTimeAndTimezone', () => {
      renderCard(makeProps({
        showStartDateAndInstructor: true,
        startDate: '2024-12-25',
      }));

      expect(screen.getByText(/Starts On/)).toBeInTheDocument();
      // formatted date + time rendered together
      expect(screen.getByText(/12\/31\/2024/)).toBeInTheDocument();
      expect(screen.getByText(/10:00 AM/)).toBeInTheDocument();
      expect(screen.getByText('PST')).toBeInTheDocument();
    });

    it('startDate_showFlagWithNoDate_notShown', () => {
      renderCard(makeProps({
        showStartDateAndInstructor: true,
        startDate: null,
      }));

      expect(screen.queryByText(/Starts On/)).not.toBeInTheDocument();
    });
  });

  describe('Completion date', () => {
    it('completionDate_showFlagWithDate_rendersDateAndTime', () => {
      renderCard(makeProps({
        showCompletionDateColumn: true,
        completionDate: '2024-12-31',
      }));

      expect(screen.getByText(/Complete By/)).toBeInTheDocument();
      expect(screen.getByText(/12\/31\/2024/)).toBeInTheDocument();
    });

    it('completionDate_showFlagWithNoDate_notShown', () => {
      renderCard(makeProps({
        showCompletionDateColumn: true,
        completionDate: null,
      }));

      expect(screen.queryByText(/Complete By/)).not.toBeInTheDocument();
    });
  });

  describe('Location', () => {
    it('location_showFlagWithItems_rendersLocationLabel', () => {
      renderCard(makeProps({
        showLocation: true,
        location: ['New York'],
      }));

      expect(screen.getByText(/Location\(s\)/)).toBeInTheDocument();
      expect(screen.getByText('New York')).toBeInTheDocument();
    });

    it('location_showFlagWithMultipleItems_rendersPlusNMore', () => {
      renderCard(makeProps({
        showLocation: true,
        location: ['New York', 'Los Angeles', 'Chicago'],
      }));

      expect(screen.getByText('New York')).toBeInTheDocument();
      expect(screen.getByText(/\+2.*more/)).toBeInTheDocument();
    });

    it('location_showFlagWithEmptyArray_notShown', () => {
      renderCard(makeProps({
        showLocation: true,
        location: [],
      }));

      expect(screen.queryByText(/Location\(s\)/)).not.toBeInTheDocument();
    });
  });

  describe('Price', () => {
    it('price_provided_rendersFormattedPriceWithLabel', () => {
      renderCard(makeProps({ price: 99 }));

      expect(screen.getByText('Price')).toBeInTheDocument();
      expect(screen.getByText('$99')).toBeInTheDocument();
    });

    it('price_null_priceAndLabelNotShown', () => {
      renderCard(makeProps({ price: null }));

      expect(screen.queryByText('Price')).not.toBeInTheDocument();
    });
  });

  describe('Extension', () => {
    it('extension_provided_rendersLabelAndCallsHandlerWithInstanceIdOnClick', () => {
      const extensionClickHandler = jest.fn();
      renderCard(makeProps({
        extension: { localizedMetadata: { label: 'Launch' } },
        extensionClickHandler,
      }));

      const link = screen.getByText('Extension Label');
      expect(link).toBeInTheDocument();

      fireEvent.click(link);
      expect(extensionClickHandler).toHaveBeenCalledWith('instance-1', expect.any(Object));
    });

    it('extension_null_linkNotRendered', () => {
      renderCard(makeProps({ extension: null }));
      expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });
  });

  describe('Seat availability helper', () => {
    it('seatsAvailableText_unenrolled_calledWithAllCorrectArgs', () => {
      const seatsAvailableText = jest.fn(() => '');
      renderCard(makeProps({
        seatsAvailableText,
        seatLimit: 10,
        seatsAvailable: 5,
        waitlistPosition: null,
        hasCrVcModule: false,
      }));

      expect(seatsAvailableText).toHaveBeenCalledWith(
        10,
        5,
        null,
        null,
        false,
        expect.any(Object) // styles
      );
    });

    it('seatsAvailableText_enrolledNonWaiting_helperNotCalled', () => {
      // Enrollment state that is not WAITING hides the seats row entirely
      const seatsAvailableText = jest.fn(() => '');
      renderCard(makeProps({
        seatsAvailableText,
        seatLimit: 10,
        seatsAvailable: 5,
        enrollment: { state: 'ENROLLED' },
      }));

      expect(seatsAvailableText).not.toHaveBeenCalled();
    });
  });

  describe('Language text helper', () => {
    it('languageText_instanceLanguageNull_helperNotCalled', () => {
      // Component skips the language row when instanceLanguage is falsy
      const languageText = jest.fn();
      renderCard(makeProps({ instanceLanguage: null, languageText }));

      expect(languageText).not.toHaveBeenCalled();
    });
  });
});
