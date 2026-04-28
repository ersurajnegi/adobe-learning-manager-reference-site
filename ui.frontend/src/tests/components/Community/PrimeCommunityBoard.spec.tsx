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
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { waitFor } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import PrimeCommunityBoard from '../../../almLib/components/Community/PrimeCommunityBoard/PrimeCommunityBoard';

const mockNavigateToBoardDetailsPage = jest.fn();
const mockReportBoard = jest.fn();
const mockAlmAlert = jest.fn();
const mockAlmConfirmationAlert = jest.fn();
const mockGetALMObject = jest.fn();
const mockGetFormattedDate = jest.fn();
const mockGetTranslation = jest.fn();

jest.mock('../../../almLib/hooks/community', () => ({
  useBoardOptions: () => ({
    reportBoard: mockReportBoard,
  }),
}));

jest.mock('../../../almLib/common/Alert/useAlert', () => ({
  useAlert: () => [mockAlmAlert],
}));

jest.mock('../../../almLib/common/Alert/useConfirmationAlert', () => ({
  useConfirmationAlert: () => [mockAlmConfirmationAlert],
}));

jest.mock('../../../almLib/utils/global', () => ({
  getALMObject: () => mockGetALMObject(),
}));

jest.mock('../../../almLib/utils/dateTime', () => ({
  GetFormattedDate: (date: string, locale: string) => mockGetFormattedDate(date, locale),
}));

jest.mock('../../../almLib/utils/translationService', () => ({
  GetTranslation: (key: string, fallback: boolean) => mockGetTranslation(key, fallback),
}));

jest.mock('../../../almLib/utils/inline_svg', () => ({
  SOCIAL_MORE_OPTIONS_SVG: () => '<svg data-testid="more-options-icon"></svg>',
  SOCIAL_ACTIVITY_INDEX_HIGH_SVG: () => '<svg data-testid="activity-high-icon"></svg>',
  SOCIAL_ACTIVITY_INDEX_MEDIUM_SVG: () => '<svg data-testid="activity-medium-icon"></svg>',
  SOCIAL_ACTIVITY_INDEX_LOW_SVG: () => '<svg data-testid="activity-low-icon"></svg>',
}));

jest.mock('../../../almLib/components/Community/PrimeCommunityBoardOptions', () => ({
  PrimeCommunityBoardOptions: ({ reportBoardHandler, copyBoardUrlHandler }: any) => (
    <div data-testid="board-options">
      <button onClick={reportBoardHandler} data-testid="report-board-btn">Report</button>
      <button onClick={copyBoardUrlHandler} data-testid="copy-url-btn">Copy URL</button>
    </div>
  ),
}));

jest.mock('../../../almLib/components/Community/PrimeCommunityObjectBody', () => ({
  PrimeCommunityObjectBody: ({ object, type }: any) => (
    <div data-testid="object-body">
      <span data-testid="object-type">{type}</span>
      <span data-testid="object-id">{object.id}</span>
    </div>
  ),
}));

jest.mock('@spectrum-icons/workflow/GlobeOutline', () => ({
  __esModule: true,
  default: () => <span data-testid="globe-icon">Globe</span>,
}));

jest.mock('@spectrum-icons/workflow/LockOpen', () => ({
  __esModule: true,
  default: () => <span data-testid="lock-open-icon">LockOpen</span>,
}));

jest.mock('@spectrum-icons/workflow/LockClosed', () => ({
  __esModule: true,
  default: () => <span data-testid="lock-closed-icon">LockClosed</span>,
}));

jest.mock('@spectrum-icons/workflow/Info', () => ({
  __esModule: true,
  default: () => <span data-testid="info-icon">Info</span>,
}));

jest.mock('@spectrum-icons/workflow/FileTxt', () => ({
  __esModule: true,
  default: () => <span data-testid="file-icon">FileTxt</span>,
}));

jest.mock('@spectrum-icons/workflow/Visibility', () => ({
  __esModule: true,
  default: () => <span data-testid="visibility-icon">Visibility</span>,
}));

jest.mock('@spectrum-icons/workflow/UserGroup', () => ({
  __esModule: true,
  default: () => <span data-testid="user-group-icon">UserGroup</span>,
}));

jest.mock('@spectrum-icons/workflow/Clock', () => ({
  __esModule: true,
  default: () => <span data-testid="clock-icon">Clock</span>,
}));

describe('PrimeCommunityBoard', () => {
  const renderWithIntl = (component: React.ReactElement) => {
    return render(<IntlProvider locale="en">{component}</IntlProvider>);
  };

  const mockBoard = {
    id: 'board-123',
    name: 'Test Board',
    description: 'Test Description',
    visibility: 'PUBLIC',
    activityLevel: 'HIGH',
    postCount: 10,
    viewsCount: 100,
    userCount: 25,
    dateCreated: '2024-01-01T00:00:00Z',
    createdBy: {
      name: 'John Doe',
      id: 'user-123',
    },
    skills: [
      { id: 'skill-1', name: 'JavaScript' },
      { id: 'skill-2', name: 'React' },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetALMObject.mockReturnValue({
      navigateToBoardDetailsPage: mockNavigateToBoardDetailsPage,
    });
    mockGetFormattedDate.mockReturnValue('Jan 1, 2024');
    mockGetTranslation.mockReturnValue('Skills');
    mockReportBoard.mockResolvedValue(undefined);
  });

  describe('Basic Rendering', () => {
    it('renders board name as a span', () => {
      renderWithIntl(<PrimeCommunityBoard board={mockBoard} />);
      expect(screen.getByText('Test Board').tagName).toBe('SPAN');
    });

    it('renders board options button', () => {
      renderWithIntl(<PrimeCommunityBoard board={mockBoard} />);
      const optionsButton = document.getElementById('prime-board-options-board-123');
      expect(optionsButton?.tagName).toBe('BUTTON');
    });

    it('renders object body with correct type and board id', () => {
      renderWithIntl(<PrimeCommunityBoard board={mockBoard} />);
      expect(screen.getByTestId('object-type').textContent).toBe('board');
      expect(screen.getByTestId('object-id').textContent).toBe('board-123');
    });

    it('renders with border class when showBorder is true', () => {
      const { container } = renderWithIntl(<PrimeCommunityBoard board={mockBoard} showBorder={true} />);
      expect(container.querySelector('.primeBoardItemWithBorder')).not.toBeNull();
    });

    it('renders without border class when showBorder is false', () => {
      const { container } = renderWithIntl(<PrimeCommunityBoard board={mockBoard} showBorder={false} />);
      expect(container.querySelector('.primeBoardItem')).not.toBeNull();
    });
  });

  describe('Board Skills', () => {
    it('renders comma-separated skill names', () => {
      renderWithIntl(<PrimeCommunityBoard board={mockBoard} />);
      expect(screen.queryByText(/JavaScript, React/)).not.toBeNull();
    });

    it('does not render skills section when board has no skills', () => {
      const boardWithoutSkills = { ...mockBoard, skills: undefined };
      renderWithIntl(<PrimeCommunityBoard board={boardWithoutSkills} />);
      expect(screen.queryByText(/Skills:/)).toBeNull();
    });

    it('renders single skill without a trailing comma', () => {
      const boardWithOneSkill = { ...mockBoard, skills: [{ id: 'skill-1', name: 'JavaScript' }] };
      renderWithIntl(<PrimeCommunityBoard board={boardWithOneSkill} />);
      const skillEl = screen.getByText(/JavaScript/);
      expect(skillEl.textContent).not.toContain(',');
    });
  });

  describe('Board Visibility', () => {
    it('shows globe icon and "Public Board" title for PUBLIC visibility', () => {
      const { container } = renderWithIntl(<PrimeCommunityBoard board={{ ...mockBoard, visibility: 'PUBLIC' }} />);
      expect(screen.queryByTestId('globe-icon')).not.toBeNull();
      expect(container.querySelector('.primeBoardIcon')?.getAttribute('title')).toBe('Public Board');
    });

    it('shows lock-closed icon and "Private Board" title for PRIVATE visibility', () => {
      const { container } = renderWithIntl(<PrimeCommunityBoard board={{ ...mockBoard, visibility: 'PRIVATE' }} />);
      expect(screen.queryByTestId('lock-closed-icon')).not.toBeNull();
      expect(container.querySelector('.primeBoardIcon')?.getAttribute('title')).toBe('Private Board');
    });

    it('shows lock-open icon and "Restricted Board" title for RESTRICTED visibility', () => {
      const { container } = renderWithIntl(<PrimeCommunityBoard board={{ ...mockBoard, visibility: 'RESTRICTED' }} />);
      expect(screen.queryByTestId('lock-open-icon')).not.toBeNull();
      expect(container.querySelector('.primeBoardIcon')?.getAttribute('title')).toBe('Restricted Board');
    });
  });

  describe('Activity Level', () => {
    it('displays "High Activity" for HIGH activity level', () => {
      renderWithIntl(<PrimeCommunityBoard board={{ ...mockBoard, activityLevel: 'HIGH' }} />);
      expect(screen.queryByText('High Activity')).not.toBeNull();
    });

    it('displays "Normal Activity" for NORMAL activity level', () => {
      renderWithIntl(<PrimeCommunityBoard board={{ ...mockBoard, activityLevel: 'NORMAL' }} />);
      expect(screen.queryByText('Normal Activity')).not.toBeNull();
    });

    it('displays "Low Activity" for LOW activity level', () => {
      renderWithIntl(<PrimeCommunityBoard board={{ ...mockBoard, activityLevel: 'LOW' }} />);
      expect(screen.queryByText('Low Activity')).not.toBeNull();
    });

    it('falls back to "Low Activity" for an unrecognised activity level', () => {
      renderWithIntl(<PrimeCommunityBoard board={{ ...mockBoard, activityLevel: 'UNKNOWN' }} />);
      expect(screen.queryByText('Low Activity')).not.toBeNull();
    });
  });

  describe('Board Statistics', () => {
    it('displays post count, views count, and user count', () => {
      renderWithIntl(<PrimeCommunityBoard board={mockBoard} />);
      expect(screen.queryByText('10 Post(s)')).not.toBeNull();
      expect(screen.queryByText('100 View(s)')).not.toBeNull();
      expect(screen.queryByText('25 People')).not.toBeNull();
    });

    it('displays zero counts correctly', () => {
      const boardWithZeroCounts = { ...mockBoard, postCount: 0, viewsCount: 0, userCount: 0 };
      renderWithIntl(<PrimeCommunityBoard board={boardWithZeroCounts} />);
      expect(screen.queryByText('0 Post(s)')).not.toBeNull();
      expect(screen.queryByText('0 View(s)')).not.toBeNull();
      expect(screen.queryByText('0 People')).not.toBeNull();
    });

    it('renders all statistics icons', () => {
      renderWithIntl(<PrimeCommunityBoard board={mockBoard} />);
      expect(screen.getByTestId('file-icon').textContent).toBe('FileTxt');
      expect(screen.getByTestId('visibility-icon').textContent).toBe('Visibility');
      expect(screen.getByTestId('user-group-icon').textContent).toBe('UserGroup');
      expect(screen.getByTestId('clock-icon').textContent).toBe('Clock');
    });
  });

  describe('Board Creation Info', () => {
    it('displays formatted creation date and calls GetFormattedDate with correct args', () => {
      renderWithIntl(<PrimeCommunityBoard board={mockBoard} />);
      expect(mockGetFormattedDate).toHaveBeenCalledWith('2024-01-01T00:00:00Z', 'en');
      expect(screen.queryByText(/Jan 1, 2024/)).not.toBeNull();
    });

    it('displays creator name', () => {
      renderWithIntl(<PrimeCommunityBoard board={mockBoard} />);
      expect(screen.queryByText(/John Doe/)).not.toBeNull();
    });

    it('displays "Anonymous" when creator name is empty', () => {
      const boardWithAnonymous = { ...mockBoard, createdBy: { name: '', id: 'user-123' } };
      renderWithIntl(<PrimeCommunityBoard board={boardWithAnonymous} />);
      expect(screen.queryByText(/Anonymous/)).not.toBeNull();
    });
  });

  describe('Board Options', () => {
    it('toggles board options visibility on each click', () => {
      renderWithIntl(<PrimeCommunityBoard board={mockBoard} />);
      const optionsButton = document.getElementById('prime-board-options-board-123')!;

      expect(screen.queryByTestId('board-options')).toBeNull();

      userEvent.click(optionsButton);
      expect(screen.queryByTestId('board-options')).not.toBeNull();

      userEvent.click(optionsButton);
      expect(screen.queryByTestId('board-options')).toBeNull();
    });

    it('shows report and copy-url buttons when options are open', () => {
      renderWithIntl(<PrimeCommunityBoard board={mockBoard} />);
      userEvent.click(document.getElementById('prime-board-options-board-123')!);
      expect(screen.getByTestId('report-board-btn').textContent).toBe('Report');
      expect(screen.getByTestId('copy-url-btn').textContent).toBe('Copy URL');
    });
  });

  describe('Board Name Click', () => {
    it('navigates to board details page when board name is clicked', () => {
      renderWithIntl(<PrimeCommunityBoard board={mockBoard} />);
      userEvent.click(screen.getByText('Test Board'));
      expect(mockNavigateToBoardDetailsPage).toHaveBeenCalledWith('board-123');
    });

    it('board name has role="button" and tabIndex=0 for keyboard accessibility', () => {
      renderWithIntl(<PrimeCommunityBoard board={mockBoard} />);
      const boardName = screen.getByText('Test Board');
      expect(boardName.getAttribute('role')).toBe('button');
      expect(boardName.getAttribute('tabIndex')).toBe('0');
    });
  });

  describe('Report Board', () => {
    it('shows a confirmation alert when report is clicked', () => {
      renderWithIntl(<PrimeCommunityBoard board={mockBoard} />);
      userEvent.click(document.getElementById('prime-board-options-board-123')!);
      userEvent.click(screen.getByTestId('report-board-btn'));

      expect(mockAlmConfirmationAlert).toHaveBeenCalledWith(
        'Confirmation Required',
        expect.stringContaining('Are you sure you want to report this board'),
        'Report',
        'Cancel',
        expect.any(Function)
      );
    });

    it('calls reportBoard with the board id when the confirmation callback fires', async () => {
      mockAlmConfirmationAlert.mockImplementation((_title, _message, _confirm, _cancel, callback) => {
        callback();
      });

      renderWithIntl(<PrimeCommunityBoard board={mockBoard} />);
      userEvent.click(document.getElementById('prime-board-options-board-123')!);
      userEvent.click(screen.getByTestId('report-board-btn'));

      await waitFor(() => expect(mockReportBoard).toHaveBeenCalledWith('board-123'));
    });
  });

  describe('Copy Board URL', () => {
    it('shows a success alert when copy URL is clicked', () => {
      renderWithIntl(<PrimeCommunityBoard board={mockBoard} />);
      userEvent.click(document.getElementById('prime-board-options-board-123')!);
      userEvent.click(screen.getByTestId('copy-url-btn'));

      expect(mockAlmAlert).toHaveBeenCalledWith(true, 'URL copied successfully', 'success');
    });
  });

  describe('Tooltip', () => {
    it('shows tooltip on touch start', () => {
      renderWithIntl(<PrimeCommunityBoard board={mockBoard} />);
      fireEvent.touchStart(screen.getByTestId('info-icon').parentElement!);
      expect(document.getElementById('board-123-tooltipText')?.getAttribute('style')).toContain('display:block');
    });

    it('hides tooltip when clicking outside', () => {
      renderWithIntl(<PrimeCommunityBoard board={mockBoard} />);
      fireEvent.touchStart(screen.getByTestId('info-icon').parentElement!);

      userEvent.click(document.body);

      expect(document.getElementById('board-123-tooltipText')?.getAttribute('style')).toContain('display:none');
    });

    it('tooltip contains activity calculation description', () => {
      renderWithIntl(<PrimeCommunityBoard board={mockBoard} />);
      expect(document.getElementById('board-123-tooltipText')?.textContent).toContain('Calculated daily based on');
    });
  });
});
