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
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { IntlProvider } from 'react-intl';
import StarRatingSubmitDialog from '@components/StarRatingSubmitDialog/StarRatingSubmitDialog';

jest.mock('@components/ALMRatings', () => ({
  ALMStarRating: ({ ratingGiven, submitRating }: any) => (
    <div data-testid="star-rating">
      <span>Rating: {ratingGiven}</span>
      <button onClick={() => submitRating(4)}>Set 4 stars</button>
      <button onClick={() => submitRating(5)}>Set 5 stars</button>
    </div>
  ),
}));

jest.mock('@utils/translationService', () => ({
  GetTranslation: (key: string) => {
    const translations: Record<string, string> = {
      'alm.text.ratingSuccess': 'Rating submitted successfully',
      'alm.text.submit': 'Submit',
    };
    return translations[key] ?? key;
  },
}));

jest.mock('@utils/inline_svg', () => ({
  ADDED_TICK_SVG: jest.fn(() => <svg data-testid="tick-svg" />),
}));

const mockUpdateRating = jest.fn();

const defaultProps = {
  ratingGiven: 3,
  updateRating: mockUpdateRating,
  training: { id: 'training-1', name: 'Test Training' } as any,
  trainingInstance: { id: 'instance-1' } as any,
  loType: 'course',
};

function renderComponent(props = {}) {
  return render(
    <IntlProvider locale="en-US">
      <StarRatingSubmitDialog {...defaultProps} {...props} />
    </IntlProvider>
  );
}

describe('StarRatingSubmitDialog', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockUpdateRating.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('submit button state', () => {
    it('submitButton_ratingUnchanged_isDisabled', () => {
      const { container } = renderComponent();

      const btn = container.querySelector('button[type="submit"]') as HTMLButtonElement;
      expect(btn.disabled).toBe(true);
    });

    it('submitButton_ratingChanged_isEnabled', () => {
      const { container } = renderComponent();

      fireEvent.click(screen.getByText('Set 4 stars'));

      const btn = container.querySelector('button[type="submit"]') as HTMLButtonElement;
      expect(btn.disabled).toBe(false);
    });
  });

  describe('rating state', () => {
    it('submitRating_starClicked_updatesDisplayedRating', () => {
      renderComponent();

      fireEvent.click(screen.getByText('Set 4 stars'));

      expect(screen.getByTestId('star-rating').textContent).toContain('Rating: 4');
    });

    it('ratingGiven_propChanges_internalRatingSyncs', () => {
      const { rerender } = renderComponent({ ratingGiven: 3 });

      rerender(
        <IntlProvider locale="en-US">
          <StarRatingSubmitDialog {...defaultProps} ratingGiven={5} />
        </IntlProvider>
      );

      expect(screen.getByTestId('star-rating').textContent).toContain('Rating: 5');
    });
  });

  describe('submit', () => {
    it('submit_ratingChanged_callsUpdateRatingWithCorrectArgs', async () => {
      const { container } = renderComponent();

      fireEvent.click(screen.getByText('Set 4 stars'));
      fireEvent.click(container.querySelector('button[type="submit"]') as HTMLElement);

      await act(async () => {
        await Promise.resolve();
      });

      expect(mockUpdateRating).toHaveBeenCalledWith(4, 'instance-1');
      expect(mockUpdateRating).toHaveBeenCalledTimes(1);
    });

    it('submit_ratingUnchanged_doesNotCallUpdateRating', async () => {
      const { container } = renderComponent();

      fireEvent.click(container.querySelector('button[type="submit"]') as HTMLElement);

      await act(async () => {
        await Promise.resolve();
      });

      expect(mockUpdateRating).not.toHaveBeenCalled();
    });

    it('submit_apiError_doesNotShowSuccessMessage', async () => {
      mockUpdateRating.mockRejectedValue(new Error('API Error'));
      const { container } = renderComponent();

      fireEvent.click(screen.getByText('Set 5 stars'));
      fireEvent.click(container.querySelector('button[type="submit"]') as HTMLElement);

      await act(async () => {
        await Promise.resolve();
      });

      expect(container.textContent).not.toContain('Rating submitted successfully');
    });
  });

  describe('success state', () => {
    async function triggerSuccess(container: HTMLElement) {
      fireEvent.click(screen.getByText('Set 5 stars'));
      fireEvent.click(container.querySelector('button[type="submit"]') as HTMLElement);
      await act(async () => {
        await Promise.resolve();
      });
    }

    it('submit_success_showsSuccessMessageAndHidesRatingForm', async () => {
      const { container } = renderComponent();

      await triggerSuccess(container);

      expect(container.textContent).toContain('Rating submitted successfully');
      expect(screen.queryByTestId('star-rating')).toBeNull();
    });

    it('submit_success_liveRegionAnnouncesSuccessMessage', async () => {
      const { container } = renderComponent();

      await triggerSuccess(container);

      const srRegion = container.querySelector('[role="region"]') as HTMLElement;
      expect(srRegion.textContent).toContain('Rating submitted successfully');
    });

    it('submit_success_successMessageAutoHidesAfter5s', async () => {
      const { container } = renderComponent();

      await triggerSuccess(container);
      expect(container.textContent).toContain('Rating submitted successfully');

      act(() => {
        jest.advanceTimersByTime(5000);
      });

      expect(container.textContent).not.toContain('Rating submitted successfully');
    });

    it('submit_successMessageClears_ratingFormRestoredWithSubmittedRating', async () => {
      const { container } = renderComponent();

      await triggerSuccess(container);

      act(() => {
        jest.advanceTimersByTime(5000);
      });

      expect(screen.getByTestId('star-rating').textContent).toContain('Rating: 5');
    });
  });

  describe('accessibility', () => {
    it('srRegion_onRender_hasCorrectAriaAttributes', () => {
      const { container } = renderComponent();

      const srRegion = container.querySelector('[role="region"]') as HTMLElement;
      expect(srRegion.getAttribute('aria-live')).toBe('polite');
      expect(srRegion.getAttribute('aria-atomic')).toBe('false');
      expect(srRegion.getAttribute('aria-relevant')).toBe('additions');
    });
  });
});
