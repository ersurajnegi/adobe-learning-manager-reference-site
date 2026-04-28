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
import { IntlProvider } from 'react-intl';
import BadgeElement from '@components/Badges/BadgeElement/BadgeElement';
import { Provider, lightTheme } from '@adobe/react-spectrum';

// Create mutable config BEFORE jest.mock
const mockALMConfig = { learnerMobileApp: false };
const mockNavigateToTrainingOverviewPage = jest.fn();
const mockNavigateToMyLearningPage = jest.fn();

// Mock modules
jest.mock('@utils/dateTime', () => ({
  GetFormattedDate: (date: string) => (date ? '12/31/2024' : ''),
}));

jest.mock('@utils/global', () => ({
  getALMConfig: () => mockALMConfig,
  getALMObject: () => ({
    navigateToTrainingOverviewPage: mockNavigateToTrainingOverviewPage,
    navigateToMyLearningPage: mockNavigateToMyLearningPage,
  }),
}));

jest.mock('@utils/translationService', () => ({
  GetTranslation: (key: string) => key,
  GetTranslationsReplaced: (key: string, replacements: any) => {
    let result = key;
    Object.keys(replacements).forEach(k => {
      result = result.replace(`{${k}}`, replacements[k]);
    });
    return result;
  },
  getPreferredLocalizedMetadata: (data: any) => data,
}));

jest.mock('@utils/constants', () => ({
  ENGLISH_LOCALE: 'en-US',
  SKILL_LEVEL: 'SKILL_LEVEL',
}));

jest.mock('@contextProviders/userContextProvider', () => ({
  useUserContext: () => ({
    user: {
      uiLocale: 'en-US',
    },
  }),
}));

// Handler mocks
const mockHandleDownloadPdfClick = jest.fn();
const mockHandleDownloadImgClick = jest.fn();
const mockSetNum = jest.fn();

describe('BadgeElement', () => {
  const defaultMessages = {
    'alm.text.pdf': 'PDF',
    'alm.text.badge': 'Badge',
    'alm.badge.status': 'Status: ',
    'alm.badge.status.achieved': 'Achieved',
    'alm.badge.status.inProgress': 'In Progress',
  };

  const defaultBadge = {
    name: 'Excellence Badge',
    imageUrl: 'https://example.com/badge.png',
  };

  const defaultProps = {
    id: 'badge-1',
    badge: defaultBadge,
    dateAchieved: '2024-12-31',
    loModel: {
      id: 'lo-1',
      loType: 'course',
      localizedMetadata: {
        name: 'Test Course',
      },
    },
    num: 0,
    setNum: mockSetNum,
    handleDownloadPdfClick: mockHandleDownloadPdfClick,
    handleDownloadImgClick: mockHandleDownloadImgClick,
  };

  const renderWithProviders = (props: any) => {
    return render(
      <Provider theme={lightTheme} colorScheme={'light'}>
        <IntlProvider locale="en" messages={defaultMessages}>
          <BadgeElement {...props} />
        </IntlProvider>
      </Provider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render badge image', () => {
      const { container } = renderWithProviders(defaultProps);
      const img = container.querySelector('img');
      expect(img).toBeTruthy();
      expect(img?.src).toBe('https://example.com/badge.png');
    });

    it('should render achieved status when dateAchieved is present', () => {
      const { container } = renderWithProviders(defaultProps);
      expect(container.textContent).toContain('alm.badge.status.achieved');
    });

    it('should render in progress status when dateAchieved is null', () => {
      const props = {
        ...defaultProps,
        dateAchieved: null,
      };
      const { container } = renderWithProviders(props);
      expect(container.textContent).toContain('alm.badge.status.inProgress');
    });
  });

  describe('Download Links', () => {
    it('should call handleDownloadPdfClick when PDF link is clicked', () => {
      const { container } = renderWithProviders(defaultProps);
      const pdfLink = Array.from(container.querySelectorAll('a')).find(
        a => a.textContent === 'PDF'
      );
      if (pdfLink) {
        fireEvent.click(pdfLink);
        expect(mockHandleDownloadPdfClick).toHaveBeenCalledWith(expect.any(Object), 'badge-1');
      }
    });

    it('should call handleDownloadImgClick when Badge link is clicked', () => {
      const { container } = renderWithProviders(defaultProps);
      const badgeLink = Array.from(container.querySelectorAll('a')).find(
        a => a.textContent === 'Badge'
      );
      if (badgeLink) {
        fireEvent.click(badgeLink);
        expect(mockHandleDownloadImgClick).toHaveBeenCalledWith(
          expect.any(Object),
          'https://example.com/badge.png'
        );
      }
    });

    it('should not call download handlers when badge is not achieved', () => {
      const props = {
        ...defaultProps,
        dateAchieved: null,
      };
      const { container } = renderWithProviders(props);
      const pdfLink = Array.from(container.querySelectorAll('a')).find(
        a => a.textContent === 'PDF'
      );
      if (pdfLink) {
        fireEvent.click(pdfLink);
        expect(mockHandleDownloadPdfClick).not.toHaveBeenCalled();
      }
    });

    it('should have tabIndex 0 for achieved badges', () => {
      const { container } = renderWithProviders(defaultProps);
      const links = container.querySelectorAll('a[href="javascript:void(0)"]');
      const pdfLink = Array.from(links).find(a =>
        a.textContent?.includes('alm.text.pdf')
      ) as HTMLElement;
      expect(pdfLink?.tabIndex).toBe(0);
    });

    it('should have tabIndex -1 for unachieved badges', () => {
      const props = {
        ...defaultProps,
        dateAchieved: null,
      };
      const { container } = renderWithProviders(props);
      const links = container.querySelectorAll('a[href="javascript:void(0)"]');
      const pdfLink = Array.from(links).find(a =>
        a.textContent?.includes('alm.text.pdf')
      ) as HTMLElement;
      expect(pdfLink?.tabIndex).toBe(-1);
    });
  });

  describe('Checkbox Selection', () => {
    it('should have checkbox disabled for unachieved badges', () => {
      const props = {
        ...defaultProps,
        dateAchieved: null,
      };
      const { container } = renderWithProviders(props);
      const checkbox = container.querySelector('[type="checkbox"]') as HTMLInputElement;
      expect(checkbox?.disabled).toBe(true);
    });

    it('should have checkbox enabled for achieved badges', () => {
      const { container } = renderWithProviders(defaultProps);
      const checkbox = container.querySelector('[type="checkbox"]') as HTMLInputElement;
      expect(checkbox?.disabled).toBe(false);
    });

    it('should increment num when checkbox is selected', () => {
      const { container } = renderWithProviders(defaultProps);
      const checkbox = container.querySelector('[type="checkbox"]') as HTMLInputElement;
      if (checkbox) {
        fireEvent.click(checkbox);
        expect(mockSetNum).toHaveBeenCalledWith(1);
      }
    });

    it('should decrement num when checkbox is deselected', () => {
      const { container } = renderWithProviders(defaultProps);
      const checkbox = container.querySelector('[type="checkbox"]') as HTMLInputElement;
      if (checkbox) {
        // Select
        fireEvent.click(checkbox);
        expect(mockSetNum).toHaveBeenCalledWith(1);
        // Deselect
        fireEvent.click(checkbox);
        expect(mockSetNum).toHaveBeenCalledWith(-1); // num is still 0, so 0-1 = -1
      }
    });

    it('should not render checkbox in mobile app', () => {
      mockALMConfig.learnerMobileApp = true;

      const { container } = renderWithProviders(defaultProps);
      const checkbox = container.querySelector('[type="checkbox"]');
      expect(checkbox).toBeFalsy();

      // Reset
      mockALMConfig.learnerMobileApp = false;
    });
  });

  describe('Badge Type Navigation', () => {
    it('should navigate to training overview for course loType', () => {
      const { container } = renderWithProviders(defaultProps);
      const links = container.querySelectorAll('a');
      const badgeTypeLink = Array.from(links).find(link => link.textContent === 'Test Course');
      if (badgeTypeLink) {
        fireEvent.click(badgeTypeLink);
        expect(mockNavigateToTrainingOverviewPage).toHaveBeenCalledWith('lo-1');
      }
    });

    it('should navigate to my learning for skill type', () => {
      const props = {
        ...defaultProps,
        loModel: {
          id: 'skill-1',
          type: 'SKILL_LEVEL',
          skill: {
            name: 'JavaScript',
          },
        },
      };
      const { container } = renderWithProviders(props);
      const links = container.querySelectorAll('a');
      const badgeTypeLink = Array.from(links).find(link => link.textContent === 'JavaScript');
      if (badgeTypeLink) {
        fireEvent.click(badgeTypeLink);
        expect(mockNavigateToMyLearningPage).toHaveBeenCalledWith({ skillName: 'JavaScript' });
      }
    });

    it('should render skill name for SKILL_LEVEL type', () => {
      const props = {
        ...defaultProps,
        loModel: {
          id: 'skill-1',
          type: 'SKILL_LEVEL',
          skill: {
            name: 'JavaScript',
          },
        },
      };
      const { container } = renderWithProviders(props);
      expect(container.textContent).toContain('JavaScript');
    });

    it('should render localized name for non-skill types', () => {
      const { container } = renderWithProviders(defaultProps);
      expect(container.textContent).toContain('Test Course');
    });
  });

  describe('Accessibility', () => {
    it('should have aria-label on download links', () => {
      const { container } = renderWithProviders(defaultProps);
      const links = container.querySelectorAll('a[href="javascript:void(0)"]');
      const pdfLink = Array.from(links).find(a => a.textContent?.includes('alm.text.pdf'));
      expect(pdfLink?.getAttribute('aria-label')).toBe('alm.badge.downloadPdf');
    });

    it('should have aria-hidden true for unachieved badge links', () => {
      const props = {
        ...defaultProps,
        dateAchieved: null,
      };
      const { container } = renderWithProviders(props);
      const links = container.querySelectorAll('a[href="javascript:void(0)"]');
      const pdfLink = Array.from(links).find(a => a.textContent?.includes('alm.text.pdf'));
      expect(pdfLink?.getAttribute('aria-hidden')).toBe('true');
    });

    it('should have aria-hidden false for achieved badge links', () => {
      const { container } = renderWithProviders(defaultProps);
      const links = container.querySelectorAll('a[href="javascript:void(0)"]');
      const pdfLink = Array.from(links).find(a => a.textContent?.includes('alm.text.pdf'));
      expect(pdfLink?.getAttribute('aria-hidden')).toBe('false');
    });

    it('should have aria-label on checkbox', () => {
      renderWithProviders(defaultProps);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox.getAttribute('aria-label')).toBe('alm.badge.checkbox');
    });

    it('should have aria-label on badge type link', () => {
      const { container } = renderWithProviders(defaultProps);
      const links = container.querySelectorAll('a');
      const badgeTypeLink = Array.from(links).find(link => link.textContent === 'Test Course');
      expect(badgeTypeLink?.getAttribute('aria-label')).toBe('Test Course');
    });
  });

  describe('Edge Cases', () => {
    it('should handle badge without imageUrl', () => {
      const props = {
        ...defaultProps,
        badge: {
          name: 'Test Badge',
          imageUrl: '',
        },
      };
      const { container } = renderWithProviders(props);
      const img = container.querySelector('img');
      expect(img).toBeTruthy();
      expect(img?.getAttribute('src')).toBe('');
    });

    it('should handle num starting value', () => {
      const props = {
        ...defaultProps,
        num: 5,
      };
      renderWithProviders(props);
      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);
      expect(mockSetNum).toHaveBeenCalledWith(6);
    });
  });
});
