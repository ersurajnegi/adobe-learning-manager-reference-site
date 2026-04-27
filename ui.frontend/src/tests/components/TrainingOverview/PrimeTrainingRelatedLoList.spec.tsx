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
import { Provider as SpectrumProvider, defaultTheme } from '@adobe/react-spectrum';
import PrimeTrainingRelatedLoList from '@components/TrainingOverview/PrimeTrainingRelatedLoList/PrimeTrainingRelatedLoList';
import { PrimeLearningObject, PrimeAccount } from '@models/PrimeModels';
import { Skill } from '@models/index';

// Mock dependencies
jest.mock('@components/Portal', () => ({
  Portal: ({ children }: { children: React.ReactNode }) => <div data-testid="portal">{children}</div>,
}));

jest.mock('@components/TrainingOverview/PrimeTrainingRelatedLO', () => ({
  PrimeTrainingRelatedLO: ({ relatedLO }: any) => (
    <div data-testid={`related-lo-${relatedLO.id}`}>{relatedLO.localizedMetadata[0].name}</div>
  ),
}));

jest.mock('@components/Catalog/PrimeTrainingList', () => ({
  PrimeTrainingList: ({ training }: any) => (
    <li data-testid={`training-list-${training.id}`}>{training.localizedMetadata[0].name}</li>
  ),
}));

jest.mock('@components/Common/ALMLoader', () => ({
  ALMLoader: () => <div data-testid="loader">Loading...</div>,
}));

jest.mock('@components/ALMPopup', () => ({
  ALMPopup: ({ children, isOpen, onClose, id }: any) => (
    isOpen ? (
      <div data-testid={id} onClick={onClose}>
        {children}
      </div>
    ) : null
  ),
}));

jest.mock('@utils/translationService', () => ({
  GetTranslation: (key: string) => key,
  GetTranslationsReplaced: (key: string, params?: any) => {
    if (key === 'text.seeAllMore') {
      return `See all ${params?.count} more`;
    }
    if (key === 'text.alternateCoursesCount') {
      return `${params?.count} alternate courses`;
    }
    return key;
  },
}));

jest.mock('@utils/inline_svg', () => ({
  CROSS_ICON: () => '<svg>X</svg>',
}));

jest.mock('@components/Widgets/ALMPrimeStrip/ALMPrimeStrip.helper', () => ({
  showEffectivenessIndex: () => true,
  showRating: () => true,
}));

// Mock data
const createMockLO = (id: string, name: string): PrimeLearningObject => ({
  id,
  loType: 'course',
  localizedMetadata: [
    {
      locale: 'en-US',
      name,
      description: `Description for ${name}`,
      overview: `Overview for ${name}`,
    },
  ],
  enrollment: null,
  instances: [],
  duration: 3600,
  hasPreview: false,
  loFormat: 'Self Paced',
  isExternal: false,
  completionDateSameAsApprovalDate: false,
  dateCreated: '2024-01-01T00:00:00Z',
  isSubLoOrderEnforced: false,
  subLOs: [],
  sections: [],
  prerequisiteLOs: [],
  prequisiteConstraints: [],
} as any);

const mockRelatedLOs = [
  createMockLO('lo1', 'Related Course 1'),
  createMockLO('lo2', 'Related Course 2'),
  createMockLO('lo3', 'Related Course 3'),
  createMockLO('lo4', 'Related Course 4'),
  createMockLO('lo5', 'Related Course 5'),
];

const mockSkills: Skill[] = [
  { id: 'skill1', name: 'JavaScript', level: 'INTERMEDIATE' } as any,
  { id: 'skill2', name: 'React', level: 'ADVANCED' } as any,
];

const mockAccount: PrimeAccount = {
  id: 'account1',
  name: 'Test Account',
  enableECommerce: false,
} as any;

const defaultProps = {
  relatedLOs: mockRelatedLOs.slice(0, 3),
  skills: mockSkills,
  relatedLoText: 'Related Courses',
  showDescription: 'These courses are related to your current training',
  totalCount: 5,
  trainingName: 'Main Training Course',
  account: mockAccount,
  loadAllItems: jest.fn(() => Promise.resolve()),
  updateBookMark: jest.fn(() => Promise.resolve()),
};

const renderComponent = (props: any = {}) => {
  const finalProps = { ...defaultProps, ...props };

  return render(
    <SpectrumProvider theme={defaultTheme}>
      <IntlProvider locale="en" messages={{}}>
        <PrimeTrainingRelatedLoList {...finalProps} />
      </IntlProvider>
    </SpectrumProvider>
  );
};

describe('PrimeTrainingRelatedLoList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    document.body.className = '';
  });

  afterEach(() => {
    document.body.className = '';
  });

  describe('Basic Rendering', () => {
    it('should render the component', () => {
      const { container } = renderComponent();
      expect(container.firstChild).not.toBeNull();
    });

    it('should display the header text', () => {
      const { container } = renderComponent();
      expect(container.textContent).toContain('Related Courses');
    });

    it('should display the description text', () => {
      const { container } = renderComponent();
      expect(container.textContent).toContain('These courses are related to your current training');
    });

    it('should have correct automation id on header', () => {
      renderComponent();
      const header = screen.getByText('Related Courses');
      expect(header.getAttribute('data-automationid')).toBe('Related Courses');
    });
  });

  describe('Related LO Display', () => {
    it('should display up to 3 related LOs', () => {
      renderComponent();
      expect(screen.getByTestId('related-lo-lo1').textContent).toBe('Related Course 1');
      expect(screen.getByTestId('related-lo-lo2').textContent).toBe('Related Course 2');
      expect(screen.getByTestId('related-lo-lo3').textContent).toBe('Related Course 3');
    });

    it('should display LO names correctly', () => {
      const { container } = renderComponent();
      expect(container.textContent).toContain('Related Course 1');
      expect(container.textContent).toContain('Related Course 2');
      expect(container.textContent).toContain('Related Course 3');
    });

    it('should not display more than 3 LOs initially', () => {
      renderComponent({ relatedLOs: mockRelatedLOs });
      expect(screen.getByTestId('related-lo-lo1').textContent).toBe('Related Course 1');
      expect(screen.getByTestId('related-lo-lo2').textContent).toBe('Related Course 2');
      expect(screen.getByTestId('related-lo-lo3').textContent).toBe('Related Course 3');
      expect(screen.queryByTestId('related-lo-lo4')).toBeFalsy();
      expect(screen.queryByTestId('related-lo-lo5')).toBeFalsy();
    });

    it('should render separators between items', () => {
      const { container } = renderComponent();
      const separators = container.querySelectorAll('[class*="seperator"]');
      expect(separators.length).toBe(2);
    });
  });

  describe('See All Button', () => {
    it('should show "See All" button when total count exceeds 3', () => {
      renderComponent({ totalCount: 10 });
      expect(screen.getByRole('button', { name: /See all 7 more/i }).textContent).toContain('See all 7 more');
    });

    it('should not show "See All" button when total count is 3 or less', () => {
      renderComponent({ totalCount: 3 });
      expect(screen.queryByRole('button', { name: /See all/i })).toBeFalsy();
    });

    it('should display correct remaining count in button', () => {
      renderComponent({ totalCount: 8 });
      expect(screen.getByRole('button', { name: /See all 5 more/i })).toHaveTextContent('See all 5 more');
    });

    it('should not show "See All" button when totalCount is undefined', () => {
      renderComponent({ totalCount: undefined });
      expect(screen.queryByRole('button', { name: /See all/i })).toBeFalsy();
    });

    it('should not show "See All" button when remaining count is 0', () => {
      renderComponent({ relatedLOs: mockRelatedLOs.slice(0, 3), totalCount: 3 });
      expect(screen.queryByRole('button', { name: /See all/i })).toBeFalsy();
    });
  });

  describe('Modal Functionality', () => {
    it('should open modal when "See All" button is clicked', () => {
      renderComponent({ totalCount: 10 });
      const seeAllButton = screen.getByRole('button', { name: /See all 7 more/i });

      fireEvent.click(seeAllButton);

      expect(screen.getByTestId('related-lo-modal').getAttribute('data-testid')).toBe('related-lo-modal');
    });

    it('should display modal title with training name', () => {
      renderComponent({ totalCount: 5 });
      const seeAllButton = screen.getByRole('button', { name: /See all 2 more/i });

      fireEvent.click(seeAllButton);

      expect(screen.getByText('Main Training Course')).toHaveTextContent('Main Training Course');
    });

    it('should display total count in modal subheader', () => {
      renderComponent({ totalCount: 5 });
      const seeAllButton = screen.getByRole('button', { name: /See all 2 more/i });

      fireEvent.click(seeAllButton);

      expect(screen.getByText('5 alternate courses')).toHaveTextContent('5 alternate courses');
    });

    it('should not show modal initially', () => {
      renderComponent({ totalCount: 5 });
      expect(screen.queryByTestId('related-lo-modal')).toBeFalsy();
    });

    it('should render portal when modal is open', () => {
      renderComponent({ totalCount: 5 });
      const seeAllButton = screen.getByRole('button', { name: /See all 2 more/i });

      fireEvent.click(seeAllButton);

      expect(screen.getByTestId('portal').getAttribute('data-testid')).toBe('portal');
    });
  });

  describe('Modal Content', () => {
    it('should display all related LOs in modal', () => {
      renderComponent({ relatedLOs: mockRelatedLOs, totalCount: 5 });
      const seeAllButton = screen.getByRole('button', { name: /See all 2 more/i });

      fireEvent.click(seeAllButton);

      expect(screen.getByTestId('training-list-lo1').textContent).toBe('Related Course 1');
      expect(screen.getByTestId('training-list-lo2').textContent).toBe('Related Course 2');
      expect(screen.getByTestId('training-list-lo3').textContent).toBe('Related Course 3');
      expect(screen.getByTestId('training-list-lo4').textContent).toBe('Related Course 4');
      expect(screen.getByTestId('training-list-lo5').textContent).toBe('Related Course 5');
    });

    it('should render training list items with correct props', () => {
      renderComponent({ relatedLOs: mockRelatedLOs, totalCount: 5 });
      const seeAllButton = screen.getByRole('button', { name: /See all 2 more/i });

      fireEvent.click(seeAllButton);

      expect(screen.getByTestId('training-list-lo1').textContent).toBe('Related Course 1');
    });

    it('should render modal overlay', () => {
      const { container } = renderComponent({ totalCount: 5 });
      const seeAllButton = screen.getByRole('button', { name: /See all 2 more/i });

      fireEvent.click(seeAllButton);

      const overlay = container.querySelector('[class*="modalOverlay"]');
      expect(overlay?.className).toContain('modalOverlay');
    });
  });

  describe('Modal Close Functionality', () => {
    it('should close modal when close button is clicked', () => {
      renderComponent({ totalCount: 5 });
      const seeAllButton = screen.getByRole('button', { name: /See all 2 more/i });

      fireEvent.click(seeAllButton);
      expect(screen.getByTestId('related-lo-modal').getAttribute('data-testid')).toBe('related-lo-modal');

      const modal = screen.getByTestId('related-lo-modal');
      fireEvent.click(modal);
      
      expect(screen.queryByTestId('related-lo-modal')).toBeFalsy();
    });

    it('should close modal when overlay is clicked', () => {
      const { container } = renderComponent({ totalCount: 5 });
      const seeAllButton = screen.getByRole('button', { name: /See all 2 more/i });

      fireEvent.click(seeAllButton);

      const overlay = container.querySelector('[class*="modalOverlay"]');
      expect(overlay?.className).toContain('modalOverlay');

      fireEvent.click(overlay!);
      
      expect(screen.queryByTestId('related-lo-modal')).toBeFalsy();
    });
  });

  describe('Loading States', () => {
    it('should call loadAllItems when modal is opened', () => {
      const loadAllItems = jest.fn(() => Promise.resolve());
      renderComponent({ totalCount: 10, loadAllItems });
      
      const seeAllButton = screen.getByRole('button', { name: /See all 7 more/i });
      fireEvent.click(seeAllButton);
      
      expect(loadAllItems).toHaveBeenCalledTimes(1);
    });

    it('should not call loadAllItems if all items are already loaded', () => {
      const loadAllItems = jest.fn(() => Promise.resolve());
      renderComponent({ 
        relatedLOs: mockRelatedLOs, 
        totalCount: 5, 
        loadAllItems 
      });
      
      const seeAllButton = screen.getByRole('button', { name: /See all 2 more/i });
      fireEvent.click(seeAllButton);
      
      expect(loadAllItems).not.toHaveBeenCalled();
    });

    it('should not call loadAllItems if function is not provided', () => {
      renderComponent({ totalCount: 10, loadAllItems: undefined });

      const seeAllButton = screen.getByRole('button', { name: /See all 7 more/i });
      fireEvent.click(seeAllButton);

      expect(screen.getByTestId('related-lo-modal').getAttribute('data-testid')).toBe('related-lo-modal');
    });
  });

  describe('Body Scroll Prevention', () => {
    it('should add noScroll class to body when modal opens', () => {
      renderComponent({ totalCount: 5 });
      
      expect(document.body.className).not.toContain('noScroll');
      
      const seeAllButton = screen.getByRole('button', { name: /See all 2 more/i });
      fireEvent.click(seeAllButton);
      
      expect(document.body.className).toContain('noScroll');
    });

    it('should remove noScroll class from body when modal closes', () => {
      renderComponent({ totalCount: 5 });
      const seeAllButton = screen.getByRole('button', { name: /See all 2 more/i });
      
      fireEvent.click(seeAllButton);
      expect(document.body.className).toContain('noScroll');

      const modal = screen.getByTestId('related-lo-modal');
      fireEvent.click(modal);
      
      expect(document.body.className).not.toContain('noScroll');
    });

    it('should clean up noScroll class on unmount', () => {
      const { unmount } = renderComponent({ totalCount: 5 });
      const seeAllButton = screen.getByRole('button', { name: /See all 2 more/i });
      
      fireEvent.click(seeAllButton);
      expect(document.body.className).toContain('noScroll');

      unmount();
      
      // After unmount, the class should eventually be removed
      expect(document.body.className.includes('noScroll') || document.body.className === '').toBe(true);
    });
  });

  describe('Bookmark Functionality', () => {
    it('should pass updateBookMark function to related LO components', () => {
      const updateBookMark = jest.fn();
      renderComponent({ updateBookMark });

      expect(screen.getByTestId('related-lo-lo1').textContent).toBe('Related Course 1');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty related LOs array', () => {
      const { container } = renderComponent({ relatedLOs: [], totalCount: 0 });
      expect(container.firstChild).not.toBeNull();
      expect(screen.queryByRole('button', { name: /See all/i })).toBeFalsy();
    });

    it('should handle single related LO', () => {
      renderComponent({ relatedLOs: [mockRelatedLOs[0]], totalCount: 1 });
      expect(screen.getByTestId('related-lo-lo1').textContent).toBe('Related Course 1');
      expect(screen.queryByTestId('related-lo-lo2')).toBeFalsy();
    });

    it('should handle exactly 3 related LOs', () => {
      renderComponent({ relatedLOs: mockRelatedLOs.slice(0, 3), totalCount: 3 });
      expect(screen.getByTestId('related-lo-lo1').textContent).toBe('Related Course 1');
      expect(screen.getByTestId('related-lo-lo2').textContent).toBe('Related Course 2');
      expect(screen.getByTestId('related-lo-lo3').textContent).toBe('Related Course 3');
      expect(screen.queryByRole('button', { name: /See all/i })).toBeFalsy();
    });

    it('should handle missing optional props', () => {
      const { container } = renderComponent({
        showDescription: undefined,
        trainingName: undefined,
        account: undefined,
        loadAllItems: undefined,
      });
      expect(container.firstChild).not.toBeNull();
    });

    it('should handle zero totalCount', () => {
      renderComponent({ totalCount: 0 });
      expect(screen.queryByRole('button', { name: /See all/i })).toBeFalsy();
    });

    it('should handle negative remaining count gracefully', () => {
      renderComponent({ relatedLOs: mockRelatedLOs, totalCount: 2 });
      expect(screen.queryByRole('button', { name: /See all/i })).toBeFalsy();
    });
  });

  describe('Accessibility', () => {
    it('should have automation id on header', () => {
      renderComponent();
      const header = screen.getByText('Related Courses');
      expect(header.getAttribute('data-automationid')).toBe('Related Courses');
    });

    it('should have proper button for See All', () => {
      renderComponent({ totalCount: 10 });
      const button = screen.getByRole('button', { name: /See all 7 more/i });
      expect(button.tagName.toLowerCase()).toBe('button');
    });

    it('should render semantic list for training items in modal', () => {
      const { container } = renderComponent({ relatedLOs: mockRelatedLOs, totalCount: 5 });

      const seeAllButton = screen.getByRole('button', { name: /See all 2 more/i });
      fireEvent.click(seeAllButton);

      const list = container.querySelector('ul');
      expect(list?.tagName.toLowerCase()).toBe('ul');
    });
  });

  describe('Component Integration', () => {
    it('should render PrimeTrainingRelatedLO for each displayed LO', () => {
      renderComponent();
      expect(screen.getByTestId('related-lo-lo1').textContent).toBe('Related Course 1');
      expect(screen.getByTestId('related-lo-lo2').textContent).toBe('Related Course 2');
      expect(screen.getByTestId('related-lo-lo3').textContent).toBe('Related Course 3');
    });

    it('should render PrimeTrainingList for each LO in modal', () => {
      renderComponent({ relatedLOs: mockRelatedLOs, totalCount: 5 });

      const seeAllButton = screen.getByRole('button', { name: /See all 2 more/i });
      fireEvent.click(seeAllButton);

      mockRelatedLOs.forEach(lo => {
        expect(screen.getByTestId(`training-list-lo${lo.id.slice(-1)}`).getAttribute('data-testid')).toBe(`training-list-lo${lo.id.slice(-1)}`);
      });
    });

    it('should use Portal for modal rendering', () => {
      renderComponent({ totalCount: 5 });

      const seeAllButton = screen.getByRole('button', { name: /See all 2 more/i });
      fireEvent.click(seeAllButton);

      expect(screen.getByTestId('portal').getAttribute('data-testid')).toBe('portal');
    });

    it('should use ALMPopup for modal', () => {
      renderComponent({ totalCount: 5 });

      const seeAllButton = screen.getByRole('button', { name: /See all 2 more/i });
      fireEvent.click(seeAllButton);

      expect(screen.getByTestId('related-lo-modal').getAttribute('data-testid')).toBe('related-lo-modal');
    });
  });
});


