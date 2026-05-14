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
import PrimeInstanceCard from '@components/Instance/PrimeInstanceCard/PrimeInstanceCard';
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
  GetFormattedDate: (date: string) => (date ? '12/31/2024' : ''),
}));

jest.mock('@utils/overview', () => ({
  checkIsEnrolled: (enrollment: any) => enrollment?.state !== 'WAITING',
}));

jest.mock('@utils/price', () => ({
  getFormattedPrice: (price: number) => `$${price}`,
}));

jest.mock('@utils/inline_svg', () => ({
  THREE_DOTS_MENU_SVG: () => null,
}));

jest.mock('@contextProviders/userContextProvider', () => ({
  useUserContext: () => ({ user: { contentLocale: 'en-US' } }),
}));

jest.mock('@spectrum-icons/workflow/Calendar', () => () => null);

// These messages are required because the component uses formatMessage without defaultMessage
// for seat/waitlist strings. Progress/completed strings have defaultMessage so are not listed.
const intlMessages = {
  'alm.overview.seatsAvailable': '{x} seats available',
  'alm.overview.no.seats.available': 'No seats available',
  'alm.overview.waitlist.position': 'Waitlist position: ',
  'alm.overviewseatsAvailableMsg': 'Seats information not available',
  'alm.catalog.filter.completed': 'Completed',
  'alm.catalog.card.progress.percent': '{0}% complete',
};

const renderCard = (props: any) =>
  render(
    <SpectrumProvider theme={defaultTheme}>
      <IntlProvider locale="en" messages={intlMessages}>
        <PrimeInstanceCard {...props} />
      </IntlProvider>
    </SpectrumProvider>
  );

// Each call creates fresh jest.fn() instances — avoids resetMocks:true clearing shared fns
const makeProps = (overrides: object = {}) => ({
  id: 'instance-1',
  instanceId: 'instance-1',
  name: 'Test Instance',
  type: 'course',
  format: 'Self Paced',
  completionDate: '2024-12-31',
  selectInstanceHandler: jest.fn(),
  locale: 'en-US',
  enrollment: null,
  showProgressBar: false,
  seatLimit: null,
  seatsAvailable: null,
  cardBgStyle: {},
  extension: null,
  extensionClickHandler: jest.fn(),
  price: null,
  hasCrVcModule: false,
  waitlistPosition: null,
  instanceLanguage: 'English',
  skill: 'JavaScript, React',
  ...overrides,
});

describe('PrimeInstanceCard', () => {
  describe('Select handler', () => {
    it('selectHandler_cardTileViewClicked_callsSelectInstanceHandlerWithId', () => {
      const selectInstanceHandler = jest.fn();
      const { container } = renderCard(makeProps({ selectInstanceHandler }));

      fireEvent.click(container.querySelector('.cardTileView')!);

      expect(selectInstanceHandler).toHaveBeenCalledWith('instance-1');
      expect(selectInstanceHandler).toHaveBeenCalledTimes(1);
    });

    it('selectHandler_selectButtonClicked_callsSelectInstanceHandlerWithId', () => {
      const selectInstanceHandler = jest.fn();
      renderCard(makeProps({ selectInstanceHandler }));

      // Unenrolled path: single Select span in hoverBlock
      fireEvent.click(screen.getByText('alm.instance.select'));

      expect(selectInstanceHandler).toHaveBeenCalledWith('instance-1');
    });

    it('selectHandler_enterKeyOnSelectButton_callsSelectInstanceHandlerWithId', () => {
      const selectInstanceHandler = jest.fn();
      renderCard(makeProps({ selectInstanceHandler }));

      // onKeyDownCapture fires selectHandler when Enter pressed
      fireEvent.keyDown(screen.getByText('alm.instance.select'), { key: 'Enter' });

      expect(selectInstanceHandler).toHaveBeenCalledWith('instance-1');
    });
  });

  describe('Completion date', () => {
    it('completionDate_provided_formattedDateRendered', () => {
      renderCard(makeProps({ completionDate: '2024-12-31' }));
      expect(screen.getByText('12/31/2024')).toBeInTheDocument();
    });

    it('completionDate_null_noDeadlineTextRendered', () => {
      renderCard(makeProps({ completionDate: null }));
      expect(screen.getByText('alm.instance.noDeadLine')).toBeInTheDocument();
    });
  });

  describe('Price', () => {
    it('price_provided_formattedPriceRendered', () => {
      renderCard(makeProps({ price: 99 }));
      expect(screen.getByText('$99')).toBeInTheDocument();
    });

    it('price_null_priceNotRendered', () => {
      renderCard(makeProps({ price: null }));
      expect(screen.queryByText(/\$/)).not.toBeInTheDocument();
    });
  });

  describe('Seat availability', () => {
    it('seatsAvailableText_seatLimitWithPositiveCount_showsAvailableSeats', () => {
      renderCard(makeProps({ seatLimit: 10, seatsAvailable: 5 }));
      expect(screen.getByText('5 seats available')).toBeInTheDocument();
    });

    it('seatsAvailableText_seatLimitWithZeroSeatsUnenrolled_showsNoSeatsAvailable', () => {
      renderCard(makeProps({ seatLimit: 10, seatsAvailable: 0 }));
      expect(screen.getByText('No seats available')).toBeInTheDocument();
    });

    it('seatsAvailableText_seatLimitWithZeroSeatsAndWaitingEnrollment_showsWaitlistPosition', () => {
      renderCard(makeProps({
        seatLimit: 10,
        seatsAvailable: 0,
        enrollment: { state: 'WAITING' },
        waitlistPosition: 3,
      }));
      const el = screen.getByText(/Waitlist position:/);
      expect(el.textContent).toBe('Waitlist position: 3');
    });

    it('seatsAvailableText_hasCrVcModuleNoSeatLimit_showsSeatsInfoNotAvailable', () => {
      renderCard(makeProps({ hasCrVcModule: true, seatLimit: null }));
      expect(screen.getByText('Seats information not available')).toBeInTheDocument();
    });

    it('seatsAvailableText_enrolledNonWaiting_seatsInfoNotRendered', () => {
      const { container } = renderCard(makeProps({
        seatLimit: 10,
        seatsAvailable: 5,
        enrollment: { state: 'ENROLLED' },
      }));
      expect(container.querySelector('.seatsAvailableContainer')).not.toBeInTheDocument();
    });
  });

  describe('Progress and enrollment state', () => {
    it('progressBar_showProgressBarWithEnrolledState_rendersProgressPercent', () => {
      renderCard(makeProps({
        enrollment: { state: 'ENROLLED', progressPercent: 75 },
        showProgressBar: true,
      }));
      // Component renders the progress label in both extraBlock and hoverBlock — two occurrences expected
      expect(screen.getAllByText('75% complete')).toHaveLength(2);
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

  describe('Skills', () => {
    it('skills_provided_skillsValueRendered', () => {
      renderCard(makeProps({ skill: 'JavaScript, React' }));
      expect(screen.getByText('JavaScript, React')).toBeInTheDocument();
    });

    it('skills_empty_skillsContainerNotRendered', () => {
      // enrollment:null so no second skillsContainer (enrollment block) is present
      const { container } = renderCard(makeProps({ skill: '' }));
      expect(container.querySelector('.skillsContainer')).not.toBeInTheDocument();
    });
  });

  describe('Hover state', () => {
    it('hover_mouseEnterDescriptionContainer_addsHoverClassToCard', () => {
      const { container } = renderCard(makeProps());

      fireEvent.mouseEnter(container.querySelector('.descriptionContainer')!);

      expect(container.querySelector('.card')).toHaveClass('hover');
    });

    it('hover_mouseLeaveCardTileView_removesHoverClassFromCard', () => {
      const { container } = renderCard(makeProps());

      fireEvent.mouseEnter(container.querySelector('.descriptionContainer')!);
      fireEvent.mouseLeave(container.querySelector('.cardTileView')!);

      expect(container.querySelector('.card')).not.toHaveClass('hover');
    });
  });

  describe('Extension', () => {
    it('extension_provided_rendersLinkAndCallsHandlerWithInstanceIdOnClick', () => {
      const extensionClickHandler = jest.fn();
      renderCard(makeProps({
        extension: { localizedMetadata: { label: 'Launch Extension' } },
        extensionClickHandler,
      }));

      const link = screen.getByText('Launch Extension');
      expect(link).toBeInTheDocument();

      fireEvent.click(link);
      expect(extensionClickHandler).toHaveBeenCalledWith('instance-1', expect.any(Object));
    });

    it('extension_null_extensionLinkNotRendered', () => {
      renderCard(makeProps({ extension: null }));
      expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });
  });
});
