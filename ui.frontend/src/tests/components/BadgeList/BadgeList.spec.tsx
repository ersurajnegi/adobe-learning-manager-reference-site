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
import '@testing-library/jest-dom/extend-expect';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// ─── Module mocks ─────────────────────────────────────────────────────────────

const mockALMConfig = {
  almBaseURL: 'https://example.com',
  learnerMobileApp: false,
};

jest.mock('@utils/translationService', () => ({
  GetTranslation: (key: string) => key,
  GetTranslationReplaced: (key: string, replacements: any) => {
    let result = key;
    Object.keys(replacements).forEach(k => { result = result.replace(`{${k}}`, replacements[k]); });
    return result;
  },
  GetTranslationsReplaced: (key: string, replacements: any) => {
    let result = key;
    Object.keys(replacements).forEach(k => { result = result.replace(`{${k}}`, replacements[k]); });
    return result;
  },
}));

jest.mock('@utils/global', () => ({
  getALMConfig: () => mockALMConfig,
}));

jest.mock('@utils/constants', () => ({
  BADGE_DOWNLOAD_PDF_ENDPOINT: '/api/account/{accountId}/user/{userId}/badges/pdf',
  BADGE_DOWNLOAD_IMG_ENDPOINT: '/api/account/{accountId}/user/{userId}/badges/img',
}));

jest.mock('@contextProviders/userContextProvider', () => ({
  useUserContext: () => ({
    user: { id: 'user-123', account: { id: 'account-456' } },
  }),
}));

// Exposes setNum so tests can trigger the downloadNum state change
jest.mock('@components/Badges/BadgeElement', () => ({
  BadgeElement: ({ id, num, setNum }: any) => (
    <div data-testid="badge-element" data-badge-id={id}>
      <button data-testid={`select-badge-${id}`} onClick={() => setNum(num + 1)} />
    </div>
  ),
}));

// ─── Imports (after mocks) ────────────────────────────────────────────────────

import BadgeList from '@components/Badges/BadgeList/BadgeList';

// ─── Test data ────────────────────────────────────────────────────────────────

const BADGES = [
  {
    id: 'badge-1',
    badge: { name: 'Excellence Badge', imageUrl: 'https://example.com/badge1.png' },
    dateAchieved: '2024-12-31',
    model: { id: 'lo-1', loType: 'course', localizedMetadata: { name: 'Test Course' } },
  },
  {
    id: 'badge-2',
    badge: { name: 'Achievement Badge', imageUrl: 'https://example.com/badge2.png' },
    dateAchieved: '2024-11-15',
    model: { id: 'lo-2', loType: 'course', localizedMetadata: { name: 'Another Course' } },
  },
];

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('BadgeList', () => {
  beforeEach(() => {
    mockALMConfig.learnerMobileApp = false;
  });

  // ─── Download section visibility ───────────────────────────────────────────

  describe('download section visibility', () => {
    it('downloadSection_isVisible_whenLearnerMobileApp_isFalse', () => {
      const { container } = render(<BadgeList badges={BADGES} />);
      expect(container.textContent).toContain('alm.text.downloadAll');
      expect(container.querySelector('a[href*="/badges/pdf"]')).toBeInTheDocument();
    });

    it('downloadSection_isHidden_whenLearnerMobileApp_isTrue', () => {
      mockALMConfig.learnerMobileApp = true;
      const { container } = render(<BadgeList badges={BADGES} />);
      expect(container.textContent).not.toContain('alm.text.downloadAll');
      expect(container.querySelector('a[href*="/badges/pdf"]')).not.toBeInTheDocument();
    });
  });

  // ─── Download URL construction ─────────────────────────────────────────────

  describe('download URL construction', () => {
    it('pdfLink_href_substitutesAccountIdAndUserId', () => {
      const { container } = render(<BadgeList badges={BADGES} />);
      const pdfLink = container.querySelector('a[href*="/badges/pdf"]') as HTMLAnchorElement;
      expect(pdfLink.href).toBe(
        'https://example.com/api/account/account-456/user/user-123/badges/pdf'
      );
    });

    it('imgLink_href_substitutesAccountIdAndUserId', () => {
      const { container } = render(<BadgeList badges={BADGES} />);
      const imgLink = container.querySelector('a[href*="/badges/img"]') as HTMLAnchorElement;
      expect(imgLink.href).toBe(
        'https://example.com/api/account/account-456/user/user-123/badges/img'
      );
    });
  });

  // ─── Download header text (downloadNum state) ──────────────────────────────

  describe('download header text', () => {
    it('downloadHeader_changesFromAll_toCount_whenBadgeSelected', () => {
      const { container } = render(<BadgeList badges={BADGES} />);
      expect(container.textContent).toContain('alm.text.downloadAll');
      userEvent.click(screen.getByTestId('select-badge-badge-1'));
      expect(container.textContent).not.toContain('alm.text.downloadAll');
    });
  });

  // ─── Download link accessibility ───────────────────────────────────────────

  describe('download link aria-labels', () => {
    it('pdfLink_hasAriaLabel_downloadAllPdf_whenNoSelectionsActive', () => {
      const { container } = render(<BadgeList badges={BADGES} />);
      const pdfLink = container.querySelector('a[href*="/badges/pdf"]');
      expect(pdfLink?.getAttribute('aria-label')).toBe('alm.badge.downloadAllPdf');
    });

    it('imgLink_hasAriaLabel_downloadAllImg_whenNoSelectionsActive', () => {
      const { container } = render(<BadgeList badges={BADGES} />);
      const imgLink = container.querySelector('a[href*="/badges/img"]');
      expect(imgLink?.getAttribute('aria-label')).toBe('alm.badge.downloadAllImg');
    });

    it('downloadLinks_showCountAriaLabel_andLinkText_whenBadgeSelected', () => {
      const { container } = render(<BadgeList badges={BADGES} />);
      userEvent.click(screen.getByTestId('select-badge-badge-1'));
      const pdfLink = container.querySelector('a[href*="/badges/pdf"]');
      expect(pdfLink?.getAttribute('aria-label')).toBe('alm.badge.downloadNumPdf');
      expect(pdfLink?.textContent).toBe('alm.text.pdfNum');
    });
  });

  // ─── Badge list rendering ──────────────────────────────────────────────────

  describe('badge list rendering', () => {
    it('rendersBadgeElement_perBadge_withCorrectIds', () => {
      const { getAllByTestId } = render(<BadgeList badges={BADGES} />);
      const elements = getAllByTestId('badge-element');
      expect(elements).toHaveLength(2);
      expect(elements[0].getAttribute('data-badge-id')).toBe('badge-1');
      expect(elements[1].getAttribute('data-badge-id')).toBe('badge-2');
    });

    it('rendersNoBadgeElements_whenBadges_isNull', () => {
      const { queryAllByTestId } = render(<BadgeList badges={null} />);
      expect(queryAllByTestId('badge-element')).toHaveLength(0);
    });
  });
});
