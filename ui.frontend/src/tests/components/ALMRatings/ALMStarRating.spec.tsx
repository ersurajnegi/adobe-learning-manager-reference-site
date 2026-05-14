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
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { IntlProvider } from 'react-intl';
import ALMRatingsComponent from '@components/ALMRatings/ALMStarRating';

// Mock the SVG icons
jest.mock('@utils/inline_svg', () => ({
  EMPTY_STAR_SVG: () => <svg data-testid="empty-star">EmptyStar</svg>,
  FULL_STAR_SVG: () => <svg data-testid="full-star">FullStar</svg>,
  HALF_STAR_SVG: () => <svg data-testid="half-star">HalfStar</svg>,
  AVG_RATING_STAR: () => <svg data-testid="avg-rating-star">AvgStar</svg>,
}));

// Mock GetTranslation
jest.mock('@utils/translationService', () => ({
  GetTranslation: (key: string) => {
    const translations: { [key: string]: string } = {
      'text.star': 'star',
    };
    return translations[key] || key;
  },
}));

describe('ALMRatingsComponent', () => {
  const defaultMessages = {
    'alm.catalog.card.noRating': 'No Rating',
  };

  const renderWithIntl = (component: React.ReactElement) => {
    return render(
      <IntlProvider locale="en" messages={defaultMessages}>
        {component}
      </IntlProvider>
    );
  };

  describe('Average Rating Display', () => {
    it('should render average rating text', () => {
      renderWithIntl(<ALMRatingsComponent avgRating={5} />);
      expect(screen.getByText(/5\/5/).textContent).toContain('5/5');
    });

    it('should render avg-rating-star icon in display mode', () => {
      renderWithIntl(<ALMRatingsComponent avgRating={4} />);
      expect(screen.getByTestId('avg-rating-star')).toBeInTheDocument();
    });
  });

  describe('No Rating Display', () => {
    it('should display "No Rating" text when avgRating is 0', () => {
      renderWithIntl(<ALMRatingsComponent avgRating={0} />);
      expect(screen.getByText('No Rating').textContent).toBe('No Rating');
    });
  });

  describe('Interactive Rating Mode', () => {
    it('should render 5 radio inputs for rating', () => {
      const submitRating = jest.fn();
      const { container } = renderWithIntl(
        <ALMRatingsComponent ratingGiven={0} submitRating={submitRating} />
      );

      const radioInputs = container.querySelectorAll('input[type="radio"]');
      expect(radioInputs.length).toBe(5);
    });

    it('should render star labels with correct aria-label values', () => {
      const submitRating = jest.fn();
      renderWithIntl(<ALMRatingsComponent ratingGiven={0} submitRating={submitRating} />);

      expect(screen.getByLabelText('1 star').getAttribute('aria-label')).toBe('1 star');
      expect(screen.getByLabelText('2 star').getAttribute('aria-label')).toBe('2 star');
      expect(screen.getByLabelText('3 star').getAttribute('aria-label')).toBe('3 star');
      expect(screen.getByLabelText('4 star').getAttribute('aria-label')).toBe('4 star');
      expect(screen.getByLabelText('5 star').getAttribute('aria-label')).toBe('5 star');
    });

    it('should call submitRating with correct star index on click', () => {
      const submitRating = jest.fn();
      renderWithIntl(<ALMRatingsComponent ratingGiven={0} submitRating={submitRating} />);

      userEvent.click(screen.getByLabelText('3 star'));

      expect(submitRating).toHaveBeenCalledWith(3);
    });

    it('should mark the selected radio as checked', () => {
      const submitRating = jest.fn();
      renderWithIntl(<ALMRatingsComponent ratingGiven={3} submitRating={submitRating} />);

      const star3 = screen.getByLabelText('3 star') as HTMLInputElement;
      expect(star3.checked).toBe(true);
    });
  });

  describe('Hover Behavior', () => {
    it('should show full stars up to hovered index on mouse enter', () => {
      const submitRating = jest.fn();
      const { container } = renderWithIntl(
        <ALMRatingsComponent ratingGiven={0} submitRating={submitRating} />
      );

      const labels = container.querySelectorAll('.givenRatingStars');
      fireEvent.mouseEnter(labels[2]);

      expect(labels[2].querySelector('[data-testid="full-star"]')).not.toBeNull();
    });

    it('should show full stars for indices up to ratingGiven and empty stars beyond', () => {
      const submitRating = jest.fn();
      const { container } = renderWithIntl(
        <ALMRatingsComponent ratingGiven={2} submitRating={submitRating} />
      );

      const labels = container.querySelectorAll('.givenRatingStars');
      expect(labels[1].querySelector('[data-testid="full-star"]')).not.toBeNull();
      expect(labels[2].querySelector('[data-testid="empty-star"]')).not.toBeNull();
    });

    it('should revert stars to ratingGiven on mouse leave', () => {
      const submitRating = jest.fn();
      const { container } = renderWithIntl(
        <ALMRatingsComponent ratingGiven={2} submitRating={submitRating} />
      );

      const labels = container.querySelectorAll('.givenRatingStars');
      fireEvent.mouseEnter(labels[4]);
      fireEvent.mouseLeave(labels[4]);

      expect(labels[4].querySelector('[data-testid="empty-star"]')).not.toBeNull();
    });
  });

  describe('Props Handling', () => {
    it('should call submitRating on initial render with ratingGiven', () => {
      const submitRating = jest.fn();
      renderWithIntl(<ALMRatingsComponent ratingGiven={4} submitRating={submitRating} />);

      expect(submitRating).toHaveBeenCalledWith(4);
    });

    it('should call submitRating on initial render with avgRating', () => {
      const submitRating = jest.fn();
      renderWithIntl(<ALMRatingsComponent avgRating={3.5} submitRating={submitRating} />);

      expect(submitRating).toHaveBeenCalledWith(3.5);
    });
  });

  describe('Edge Cases', () => {
    it('should render empty container when ratingGiven is -1', () => {
      const { container } = renderWithIntl(<ALMRatingsComponent ratingGiven={-1} />);
      const starRadioGroup = container.querySelector('.starRadioGroup');
      expect(starRadioGroup?.children.length).toBe(0);
    });
  });

  describe('Internationalization', () => {
    it('should display translated "No Rating" in Spanish locale', () => {
      render(
        <IntlProvider locale="es" messages={{ 'alm.catalog.card.noRating': 'Sin calificación' }}>
          <ALMRatingsComponent avgRating={0} />
        </IntlProvider>
      );

      expect(screen.getByText('Sin calificación').textContent).toBe('Sin calificación');
    });
  });

  describe('Accessibility', () => {
    it('should have aria-hidden on average rating display container', () => {
      const { container } = renderWithIntl(<ALMRatingsComponent avgRating={4} />);
      const starRating = container.querySelector('[aria-hidden="true"]');
      expect(starRating?.getAttribute('aria-hidden')).toBe('true');
    });

    it('should have proper label htmlFor association with input id', () => {
      const submitRating = jest.fn();
      const { container } = renderWithIntl(
        <ALMRatingsComponent ratingGiven={0} submitRating={submitRating} />
      );

      const input = container.querySelector('#rating1') as HTMLInputElement;
      const label = container.querySelector('label[for="rating1"]');

      expect(input?.getAttribute('type')).toBe('radio');
      expect(label?.getAttribute('for')).toBe('rating1');
    });
  });
});
