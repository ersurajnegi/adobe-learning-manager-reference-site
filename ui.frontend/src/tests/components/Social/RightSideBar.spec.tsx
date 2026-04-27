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
import { render, screen } from '@testing-library/react';
import RightSideBar from '@components/Social/RightSideBar';

const mockFormatMessage = jest.fn();
const mockGetTranslation = jest.fn();

jest.mock('react-intl', () => ({
  useIntl: () => ({ formatMessage: mockFormatMessage }),
}));

jest.mock('@utils/translationService', () => ({
  GetTranslation: (...args: any[]) => mockGetTranslation(...args),
}));

jest.mock('@components/Social/SectionLine', () => ({
  __esModule: true,
  default: ({ title, type }: any) =>
    require('react').createElement('div', { 'data-testid': `section-line-${type}` }, title),
}));

const skillsData = [{ name: 'React' }, { name: 'TypeScript' }];
const followData = [{ name: 'John Doe' }];
const leaderBoard = [{ name: 'Top Learner' }];

describe('RightSideBar', () => {
  beforeEach(() => {
    mockFormatMessage.mockImplementation(({ defaultMessage }) => defaultMessage);
    mockGetTranslation.mockImplementation((key: string) => {
      const map: Record<string, string> = {
        'alm.text.mySkills': 'My Skills',
        'alm.text.leaderboard': 'Leaderboard',
      };
      return map[key] ?? key;
    });
  });

  describe('skills section', () => {
    it('skillsData_provided_skillsSectionVisible', () => {
      render(<RightSideBar skillsData={skillsData} />);

      screen.getByText('My Skills');
    });

    it('skillsData_notProvided_skillsSectionHidden', () => {
      render(<RightSideBar />);

      expect(screen.queryByText('My Skills')).toBeNull();
    });

    it('skillsData_provided_rendersOneSectionLinePerSkill', () => {
      render(<RightSideBar skillsData={skillsData} />);

      expect(screen.getAllByTestId('section-line-skills')).toHaveLength(skillsData.length);
    });

    it('skillsData_emptyArray_sectionHeaderVisibleWithNoItems', () => {
      render(<RightSideBar skillsData={[]} />);

      screen.getByText('My Skills');
      expect(screen.queryAllByTestId('section-line-skills')).toHaveLength(0);
    });
  });

  describe('follow section', () => {
    it('followData_provided_followSectionVisible', () => {
      render(<RightSideBar followData={followData} />);

      screen.getByText('People I follow');
    });

    it('followData_notProvided_followSectionHidden', () => {
      render(<RightSideBar />);

      expect(screen.queryByText('People I follow')).toBeNull();
    });
  });

  describe('leaderboard section', () => {
    it('leaderBoard_provided_leaderboardSectionVisible', () => {
      render(<RightSideBar leaderBoard={leaderBoard} />);

      screen.getByText('Leaderboard');
    });

    it('leaderBoard_notProvided_leaderboardSectionHidden', () => {
      render(<RightSideBar />);

      expect(screen.queryByText('Leaderboard')).toBeNull();
    });
  });

  describe('multiple sections', () => {
    it('allPropsProvided_allThreeSectionHeadersVisible', () => {
      render(
        <RightSideBar skillsData={skillsData} followData={followData} leaderBoard={leaderBoard} />
      );

      screen.getByText('My Skills');
      screen.getByText('People I follow');
      screen.getByText('Leaderboard');
    });

    it('noPropsProvided_noSectionHeadersVisible', () => {
      render(<RightSideBar />);

      expect(screen.queryByText('My Skills')).toBeNull();
      expect(screen.queryByText('People I follow')).toBeNull();
      expect(screen.queryByText('Leaderboard')).toBeNull();
    });
  });
});
