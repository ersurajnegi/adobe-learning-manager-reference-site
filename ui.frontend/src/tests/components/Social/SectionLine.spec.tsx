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
import SectionLine from '@components/Social/SectionLine';

const mockFormatMessage = jest.fn();

jest.mock('react-intl', () => ({
  useIntl: () => ({ formatMessage: mockFormatMessage }),
}));

jest.mock('@spectrum-icons/workflow/Send', () => ({
  __esModule: true,
  default: () => require('react').createElement('svg', { 'data-testid': 'send-icon' }),
}));

jest.mock('@spectrum-icons/workflow/Archive', () => ({
  __esModule: true,
  default: () => require('react').createElement('svg', { 'data-testid': 'archive-icon' }),
}));

describe('SectionLine', () => {
  beforeEach(() => {
    mockFormatMessage.mockImplementation(({ defaultMessage }) => defaultMessage);
  });

  describe('thumbnail selection', () => {
    it('thumbnail_favouritesType_rendersArchiveIcon', () => {
      render(<SectionLine title="Board" type="favs" />);

      screen.getByTestId('archive-icon');
      expect(screen.queryByTestId('send-icon')).toBeNull();
    });

    // When both type=favs and src are provided, the src image overrides the Archive icon.
    it('thumbnail_favouritesTypeWithSrc_imgOverridesArchiveIcon', () => {
      const { container } = render(
        <SectionLine title="Board" type="favs" src="https://example.com/img.jpg" />
      );

      expect(container.querySelector('img')?.getAttribute('src')).toBe(
        'https://example.com/img.jpg'
      );
      expect(screen.queryByTestId('archive-icon')).toBeNull();
    });

    it('thumbnail_skillsType_rendersSendIcon', () => {
      render(<SectionLine title="Skill" type="skills" />);

      screen.getByTestId('send-icon');
      expect(screen.queryByTestId('archive-icon')).toBeNull();
    });

    // SKILLS type ignores src — the Send icon always wins.
    it('thumbnail_skillsTypeWithSrc_ignoresSrcAndShowsSendIcon', () => {
      const { container } = render(
        <SectionLine title="Skill" type="skills" src="https://example.com/img.jpg" />
      );

      screen.getByTestId('send-icon');
      expect(container.querySelector('img')).toBeNull();
    });

    it('thumbnail_nonRecognizedTypeWithSrc_rendersImg', () => {
      const { container } = render(
        <SectionLine title="User" type="leaderboard" src="https://example.com/avatar.jpg" />
      );

      expect(container.querySelector('img')?.getAttribute('src')).toBe(
        'https://example.com/avatar.jpg'
      );
      expect(screen.queryByTestId('send-icon')).toBeNull();
      expect(screen.queryByTestId('archive-icon')).toBeNull();
    });

    it('thumbnail_nonRecognizedTypeWithoutSrc_rendersNoThumbnail', () => {
      const { container } = render(<SectionLine title="User" type="leaderboard" />);

      expect(container.querySelector('img')).toBeNull();
      expect(screen.queryByTestId('send-icon')).toBeNull();
      expect(screen.queryByTestId('archive-icon')).toBeNull();
    });
  });

  describe('metadata rendering', () => {
    it('metadata_leaderboardTypeWithCount_showsCountAndPoints', () => {
      const { container } = render(<SectionLine title="User" type="leaderboard" count={100} />);

      const text = container.querySelector('.metaData')?.textContent;
      expect(text).toContain('100');
      expect(text).toContain('Points');
    });

    it('metadata_nonLeaderboardTypeWithCount_showsCountAndPosts', () => {
      const { container } = render(<SectionLine title="Board" type="favs" count={25} />);

      const text = container.querySelector('.metaData')?.textContent;
      expect(text).toContain('25');
      expect(text).toContain('Posts');
    });

    it('metadata_noCount_rendersEmpty', () => {
      const { container } = render(<SectionLine title="Board" type="favs" />);

      expect(container.querySelector('.metaData')?.textContent).toBe('');
    });

    // count={0} is falsy — metadata block is skipped entirely.
    it('metadata_countZero_rendersEmpty', () => {
      const { container } = render(<SectionLine title="Board" type="favs" count={0} />);

      expect(container.querySelector('.metaData')?.textContent).toBe('');
    });
  });

  describe('title', () => {
    it('title_provided_rendersWithTabIndex', () => {
      render(<SectionLine title="My Title" />);

      expect(screen.getByText('My Title')).toHaveAttribute('tabindex', '0');
    });
  });
});
