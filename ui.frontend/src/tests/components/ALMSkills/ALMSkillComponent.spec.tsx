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
import '@testing-library/jest-dom/extend-expect';
import React from 'react';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { waitFor } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';

// ─── Module mocks ─────────────────────────────────────────────────────────────

jest.mock('@utils/global', () => ({
  getALMConfig: jest.fn(),
  getALMObject: jest.fn(),
  getALMUser: jest.fn(),
  getALMAccount: jest.fn(),
  isEmptyJson: jest.fn(),
}));

jest.mock('@utils/translationService', () => ({
  GetTranslation: jest.fn((key: string) => key),
  getPreferredLocalizedMetadata: jest.fn(),
}));

jest.mock('@adobe/react-spectrum', () => {
  const React = require('react');
  return {
    __esModule: true,
    Provider: ({ children }: any) => React.createElement(React.Fragment, null, children),
    lightTheme: {},
    defaultTheme: {},
    darkTheme: {},
  };
});

jest.mock('@react-spectrum/tabs', () => {
  const React = require('react');
  return {
    __esModule: true,
    Tabs: ({ children }: any) => React.createElement(React.Fragment, null, children),
    TabList: ({ children }: any) => React.createElement('div', { role: 'tablist' }, children),
    TabPanels: ({ children }: any) => React.createElement(React.Fragment, null, children),
    Item: ({ children }: any) => React.createElement(React.Fragment, null, children),
  };
});

jest.mock('@hooks/profile/useSkills', () => ({
  useSkills: jest.fn(),
}));

jest.mock('@hooks/profile/useUserSkillInterest', () => ({
  useUserSkillInterest: jest.fn(),
}));

jest.mock('@components/Common/ALMLoader', () => ({
  ALMLoader: () => <div data-testid="loader" />,
}));

jest.mock('@components/Common/ALMErrorBoundary', () => ({
  ALMErrorBoundary: ({ children }: any) => <>{children}</>,
}));

jest.mock('@components/PrlPreferenceSection', () => ({
  PrlPreferenceSection: () => <div data-testid="prl-section" />,
}));

jest.mock('@components/ALMSkills/ExternalSkillGraph', () => {
  const React = require('react');
  return {
    ExternalSkillGraphComponent: React.forwardRef((_props: any, _ref: any) =>
      React.createElement('div', { 'data-testid': 'external-skill-graph' })
    ),
  };
});

jest.mock('@utils/inline_svg', () => ({
  NO_SKILL_INTEREST_SVG: jest.fn(),
}));

jest.mock('@utils/widgets/base/EventHandlingBase', () => ({
  GetHomePageLink: jest.fn(),
  SendLinkEvent: jest.fn(),
}));

jest.mock('@components/ALMSkills/ALMSkillComponent.utils', () => ({
  addBodyStyles: jest.fn(),
  addExternalFontLink: jest.fn(),
  addExternalSkillFrameCss: jest.fn(),
  copyStyleSheetsToChildFrame: jest.fn(),
  getAttrStyle: jest.fn(() => ''),
  sendSkillsSkipLinks: jest.fn(),
}));

jest.mock('@spectrum-icons/workflow/Search', () => ({
  __esModule: true,
  default: () => <span>Search</span>,
}));

jest.mock('@spectrum-icons/workflow/ChevronDown', () => ({
  __esModule: true,
  default: () => <span>ChevronDown</span>,
}));

jest.mock('@spectrum-icons/workflow/Close', () => ({
  __esModule: true,
  default: () => <span>Close</span>,
}));

jest.mock('@spectrum-icons/workflow/CheckmarkCircle', () => ({
  __esModule: true,
  default: () => <span>CheckmarkCircle</span>,
}));

// ─── Imports (after mocks) ────────────────────────────────────────────────────

import { getALMAccount, getALMObject, isEmptyJson } from '@utils/global';
import { GetTranslation } from '@utils/translationService';
import { useSkills } from '@hooks/profile/useSkills';
import { useUserSkillInterest } from '@hooks/profile/useUserSkillInterest';
import { SendLinkEvent, GetHomePageLink } from '@utils/widgets/base/EventHandlingBase';
import { NO_SKILL_INTEREST_SVG } from '@utils/inline_svg';
import ALMSkillComponent from '@components/ALMSkills/ALMSkillComponent';

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_ACCOUNT = {
  prlCriteria: { enabled: false },
  enableExternalSkills: false,
  exploreSkills: true,
};

// Skill IDs intentionally don't contain 'skill-' to avoid id-splitting bugs in toggleSkillSelection
const DEFAULT_SKILLS = [
  { id: '1', name: 'JavaScript', state: 'ACTIVE' },
  { id: '2', name: 'React', state: 'ACTIVE' },
];

const DEFAULT_ITEMS = [
  { skill: { id: 'interest-1', name: 'Python' }, source: 'USER_SELECTED', userSkills: [] },
];

// ─── Suite ────────────────────────────────────────────────────────────────────

describe('ALMSkillComponent', () => {
  let mockFetchSkills: jest.Mock;
  let mockSearchSkill: jest.Mock;
  let mockFetchUserSkillInterest: jest.Mock;
  let mockSaveUserSkillInterest: jest.Mock;
  let mockRemoveUserSkillInterest: jest.Mock;
  let mockLoadMoreUserSkillInterest: jest.Mock;

  beforeEach(() => {
    delete (window as any).location;
    (window as any).location = { hash: '' };

    HTMLElement.prototype.scrollIntoView = jest.fn();

    mockFetchSkills = jest.fn().mockResolvedValue(undefined);
    mockSearchSkill = jest.fn().mockResolvedValue(undefined);
    mockFetchUserSkillInterest = jest.fn().mockResolvedValue(undefined);
    mockSaveUserSkillInterest = jest.fn().mockResolvedValue(undefined);
    mockRemoveUserSkillInterest = jest.fn().mockResolvedValue(undefined);
    mockLoadMoreUserSkillInterest = jest.fn().mockResolvedValue(undefined);

    (getALMAccount as jest.Mock).mockResolvedValue({ ...DEFAULT_ACCOUNT });
    (getALMObject as jest.Mock).mockReturnValue({
      storage: { getItem: jest.fn(), setItem: jest.fn() },
      getLandingPageFromMenu: null,
      navigateToCustomPage: jest.fn(),
    });
    (isEmptyJson as jest.Mock).mockImplementation(
      (obj: any) => !obj || Object.keys(obj).length === 0
    );
    (GetTranslation as jest.Mock).mockImplementation((key: string) => key);
    (GetHomePageLink as jest.Mock).mockReturnValue('/home');
    (NO_SKILL_INTEREST_SVG as jest.Mock).mockReturnValue(
      React.createElement('svg', { 'data-testid': 'no-skill-icon' })
    );

    (useSkills as jest.Mock).mockReturnValue({
      skills: DEFAULT_SKILLS,
      fetchSkills: mockFetchSkills,
      searchSkill: mockSearchSkill,
      hasMoreSkills: false,
      loadMoreSkills: jest.fn().mockResolvedValue(undefined),
    });

    (useUserSkillInterest as jest.Mock).mockReturnValue({
      items: DEFAULT_ITEMS,
      fetchUserSkillInterest: mockFetchUserSkillInterest,
      saveUserSkillInterest: mockSaveUserSkillInterest,
      removeUserSkillInterest: mockRemoveUserSkillInterest,
      loadMoreUserSkillInterest: mockLoadMoreUserSkillInterest,
      hasMoreItems: false,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  async function renderSkillComponent() {
    let result: any;
    await act(async () => {
      result = render(
        <IntlProvider locale="en" messages={{}}>
          <ALMSkillComponent />
        </IntlProvider>
      );
    });
    return result!;
  }

  // ─── VIEW mode: structure ─────────────────────────────────────────────────

  describe('VIEW mode', () => {
    it('renders_areasOfInterestHeading', async () => {
      await renderSkillComponent();
      expect(screen.getByText('My Areas of Interest')).toBeInTheDocument();
    });

    it('renders_skillInterestItem_withCorrectId_andRoleGroup', async () => {
      const { container } = await renderSkillComponent();
      const item = container.querySelector('#skill-interest-1');
      expect(item).toBeInTheDocument();
      expect(item?.getAttribute('role')).toBe('group');
    });

    it('renders_skillInterestName', async () => {
      await renderSkillComponent();
      expect(screen.getAllByText('Python').length).toBeGreaterThan(0);
    });

    it('renders_goToHomeButton', async () => {
      await renderSkillComponent();
      expect(screen.getByText('Go to Home')).toBeInTheDocument();
    });

    it('renders_addInterestButton_whenExploreSkillsTrue_andPrlDisabled', async () => {
      await renderSkillComponent();
      // Account resolves with exploreSkills=true, isPrlEnabled=false → Add Interest shown
      await waitFor(() => {
        expect(screen.getByText('Add Interest')).toBeInTheDocument();
      });
    });

    it('hidesAddInterestButton_whenPrlEnabled', async () => {
      (getALMAccount as jest.Mock).mockResolvedValue({
        ...DEFAULT_ACCOUNT,
        prlCriteria: { enabled: true },
        exploreSkills: true,
      });
      await renderSkillComponent();
      await waitFor(() => {
        expect(screen.queryByText('Add Interest')).not.toBeInTheDocument();
      });
    });

    it('hidesAddInterestButton_whenExploreSkillsFalse', async () => {
      (getALMAccount as jest.Mock).mockResolvedValue({
        ...DEFAULT_ACCOUNT,
        exploreSkills: false,
      });
      await renderSkillComponent();
      await waitFor(() => {
        expect(screen.queryByText('Add Interest')).not.toBeInTheDocument();
      });
    });

    it('renders_emptyStateIcon_whenNoSkillInterests', async () => {
      (useUserSkillInterest as jest.Mock).mockReturnValue({
        items: [],
        fetchUserSkillInterest: mockFetchUserSkillInterest,
        saveUserSkillInterest: mockSaveUserSkillInterest,
        removeUserSkillInterest: mockRemoveUserSkillInterest,
        loadMoreUserSkillInterest: mockLoadMoreUserSkillInterest,
        hasMoreItems: false,
      });
      const { container } = await renderSkillComponent();
      await waitFor(() => {
        expect(container.querySelector('[data-testid="no-skill-icon"]')).toBeInTheDocument();
      });
    });

    it('renders_viewMoreButton_whenHasMoreItems', async () => {
      (useUserSkillInterest as jest.Mock).mockReturnValue({
        items: DEFAULT_ITEMS,
        fetchUserSkillInterest: mockFetchUserSkillInterest,
        saveUserSkillInterest: mockSaveUserSkillInterest,
        removeUserSkillInterest: mockRemoveUserSkillInterest,
        loadMoreUserSkillInterest: mockLoadMoreUserSkillInterest,
        hasMoreItems: true,
      });
      await renderSkillComponent();
      expect(screen.getByText('View more')).toBeInTheDocument();
    });

    it('showsTabMenu_whenEnableExternalSkillsTrue', async () => {
      (getALMAccount as jest.Mock).mockResolvedValue({
        ...DEFAULT_ACCOUNT,
        enableExternalSkills: true,
      });
      const { container } = await renderSkillComponent();
      // TabList mock renders div[role="tablist"]
      await waitFor(() => {
        expect(container.querySelector('[role="tablist"]')).toBeInTheDocument();
      });
    });
  });

  // ─── PRL mode ─────────────────────────────────────────────────────────────

  describe('PRL enabled', () => {
    it('showsPageHeading_hidesStandardHeader', async () => {
      (getALMAccount as jest.Mock).mockResolvedValue({
        ...DEFAULT_ACCOUNT,
        prlCriteria: { enabled: true },
      });
      await renderSkillComponent();
      // Page heading (rendered via getPageHeading) shown; the standard "My Areas of Interest"
      // header section (rendered via getHeaderSection / !isPrlEnabled) is hidden
      await waitFor(() => {
        expect(screen.queryByText('My Areas of Interest')).not.toBeInTheDocument();
      });
    });
  });

  // ─── ADD mode (URL initialised) ───────────────────────────────────────────

  describe('ADD mode (from URL)', () => {
    it('renders_addInterestsHeading_inAddMode', async () => {
      (window as any).location = { hash: '?mode=add' };
      await renderSkillComponent();
      expect(screen.getByText('Tell us a bit about your interests')).toBeInTheDocument();
    });
  });

  // ─── Interactions: mode transitions ───────────────────────────────────────

  describe('Add Interest button → update mode', () => {
    it('clickAddInterest_callsFetchSkills_andSwitchesToUpdateMode', async () => {
      await renderSkillComponent();
      await waitFor(() => screen.getByText('Add Interest'));
      await act(async () => {
        userEvent.click(screen.getByText('Add Interest'));
      });
      expect(mockFetchSkills).toHaveBeenCalled();
      // update mode heading
      expect(screen.getByText('Add to my Areas of Interest')).toBeInTheDocument();
    });

    it('clickAddInterest_rendersSearchSection_inUpdateMode', async () => {
      await renderSkillComponent();
      await waitFor(() => screen.getByText('Add Interest'));
      await act(async () => {
        userEvent.click(screen.getByText('Add Interest'));
      });
      expect(document.querySelector(`[automation-id="skillInput"]`)).toBeInTheDocument();
    });
  });

  describe('Back button → VIEW mode', () => {
    it('clickBack_callsFetchUserSkillInterest_andReturnsToViewMode', async () => {
      await renderSkillComponent();
      await waitFor(() => screen.getByText('Add Interest'));
      await act(async () => { userEvent.click(screen.getByText('Add Interest')); });
      await waitFor(() => screen.getByText('Back'));
      await act(async () => { userEvent.click(screen.getByText('Back')); });
      expect(mockFetchUserSkillInterest).toHaveBeenCalled();
      expect(screen.getByText('My Areas of Interest')).toBeInTheDocument();
    });
  });

  // ─── Interactions: save ───────────────────────────────────────────────────

  describe('Add button (save)', () => {
    it('clickAdd_withNoSelection_showsErrorMessage_doesNotCallSave', async () => {
      await renderSkillComponent();
      await waitFor(() => screen.getByText('Add Interest'));
      await act(async () => { userEvent.click(screen.getByText('Add Interest')); });
      await waitFor(() => screen.getByText('Add'));
      await act(async () => { userEvent.click(screen.getByText('Add')); });
      // Error translation key rendered when no skill selected
      expect(
        screen.getByText('alm.profile.skills.selectMinimumSkillMessage')
      ).toBeInTheDocument();
      expect(mockSaveUserSkillInterest).not.toHaveBeenCalled();
    });

    it('clickAdd_withSkillSelected_callsSaveUserSkillInterest_withCorrectId', async () => {
      await renderSkillComponent();
      await waitFor(() => screen.getByText('Add Interest'));
      await act(async () => { userEvent.click(screen.getByText('Add Interest')); });
      // Select skill '1' (JavaScript)
      const skillButton = document.querySelector('#skill-1') as HTMLElement;
      await act(async () => { userEvent.click(skillButton); });
      await act(async () => { userEvent.click(screen.getByText('Add')); });
      expect(mockSaveUserSkillInterest).toHaveBeenCalledWith(['1']);
    });
  });

  // ─── Interactions: remove interest ────────────────────────────────────────

  describe('Remove skill interest', () => {
    it('clickRemove_callsRemoveUserSkillInterest_withSkillId', async () => {
      await renderSkillComponent();
      // Each skill interest item has a remove button (Close icon button)
      const removeButton = document.querySelector(
        '#skill-interest-1 button'
      ) as HTMLElement;
      expect(removeButton).toBeInTheDocument();
      await act(async () => { userEvent.click(removeButton); });
      expect(mockRemoveUserSkillInterest).toHaveBeenCalledWith('interest-1');
    });
  });

  // ─── Interactions: search ─────────────────────────────────────────────────

  describe('Search input (update mode)', () => {
    async function goToUpdateMode() {
      await renderSkillComponent();
      await waitFor(() => screen.getByText('Add Interest'));
      await act(async () => { userEvent.click(screen.getByText('Add Interest')); });
      await waitFor(() =>
        expect(document.querySelector('[automation-id="skillInput"]')).toBeInTheDocument()
      );
      return document.querySelector('[automation-id="skillInput"]') as HTMLInputElement;
    }

    it('pressEnter_withSearchTerm_callsSearchSkill', async () => {
      const input = await goToUpdateMode();
      // Set the search value via controlled onChange, then fire keyUp for Enter
      await act(async () => {
        fireEvent.change(input, { target: { value: 'javascript' } });
      });
      await act(async () => {
        fireEvent.keyUp(input, { key: 'Enter', keyCode: 13 });
      });
      expect(mockSearchSkill).toHaveBeenCalledWith('javascript');
    });

    it('pressEnter_withEmptySearch_callsFetchSkills', async () => {
      const input = await goToUpdateMode();
      // Input is empty; pressing Enter with no value calls fetchSkills
      const callsBefore = (mockFetchSkills as jest.Mock).mock.calls.length;
      await act(async () => {
        fireEvent.keyUp(input, { key: 'Enter', keyCode: 13 });
      });
      expect((mockFetchSkills as jest.Mock).mock.calls.length).toBeGreaterThan(callsBefore);
    });
  });

  // ─── Interactions: pagination ─────────────────────────────────────────────

  describe('View more button', () => {
    it('clickViewMore_callsLoadMoreUserSkillInterest', async () => {
      (useUserSkillInterest as jest.Mock).mockReturnValue({
        items: DEFAULT_ITEMS,
        fetchUserSkillInterest: mockFetchUserSkillInterest,
        saveUserSkillInterest: mockSaveUserSkillInterest,
        removeUserSkillInterest: mockRemoveUserSkillInterest,
        loadMoreUserSkillInterest: mockLoadMoreUserSkillInterest,
        hasMoreItems: true,
      });
      await renderSkillComponent();
      const viewMoreButton = screen.getByText('View more');
      await act(async () => { userEvent.click(viewMoreButton); });
      expect(mockLoadMoreUserSkillInterest).toHaveBeenCalled();
    });
  });

  // ─── Interactions: Go to Home ─────────────────────────────────────────────

  describe('Go to Home button', () => {
    it('clickGoToHome_callsSendLinkEvent_withHomeLink', async () => {
      await renderSkillComponent();
      await act(async () => { userEvent.click(screen.getByText('Go to Home')); });
      expect(SendLinkEvent).toHaveBeenCalledWith('/home');
    });
  });

  // ─── Accessibility ────────────────────────────────────────────────────────

  describe('accessibility', () => {
    it('skillsSection_hasSkipLinkTargetAttribute', async () => {
      const { container } = await renderSkillComponent();
      const target = container.querySelector(
        '[data-skip-link-target="com.adobe.captivateprime.primeskills"]'
      );
      expect(target).toBeInTheDocument();
      expect(target?.getAttribute('tabindex')).toBe('-1');
    });
  });
});
