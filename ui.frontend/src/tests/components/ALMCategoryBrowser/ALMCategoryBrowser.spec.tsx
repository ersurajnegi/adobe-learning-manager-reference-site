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
import { render, screen, fireEvent } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { BrowserRouter } from 'react-router-dom';
import ALMCategoryBrowser from '@components/CategoryBrowser/ALMCategoryBrowser';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('@utils/translationService', () => ({
  getPreferredLocalizedMetadata: (data: any) => data[0] || data,
}));

jest.mock('@spectrum-icons/workflow/ChevronLeft', () => () => null);
jest.mock('@spectrum-icons/workflow/ChevronRight', () => () => null);

const makeCategory = (
  title: string,
  description: string,
  contentUrl: string,
  catalogFilters: string[],
  skillFilters: string[],
  tagFilters: string[]
) => ({
  localizedMetadata: [{ title, description }],
  contentUrl,
  catalogFilters,
  skillFilters,
  tagFilters,
});

const mockCategoryBrowsers = {
  heading: [{ title: 'Browse Categories', description: 'Explore our learning categories' }],
  categories: [
    makeCategory('Technology', 'Tech courses', 'https://example.com/tech.jpg', ['tech-catalog'], ['programming'], ['tech-tag']),
    makeCategory('Business', 'Business courses', 'https://example.com/business.jpg', ['business-catalog'], ['management'], ['business-tag']),
  ],
};

const renderComponent = (props: Record<string, any> = {}) =>
  render(
    <BrowserRouter>
      <IntlProvider locale="en" messages={{ 'alm.text.explore': 'Explore' }}>
        <ALMCategoryBrowser
          categoryBrowsers={mockCategoryBrowsers}
          catalogRoute="/catalog"
          {...props}
        />
      </IntlProvider>
    </BrowserRouter>
  );

describe('ALMCategoryBrowser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    document.getElementById = jest.fn((id: string) =>
      id === 'carousel' ? ({ offsetWidth: 1000 } as HTMLElement) : null
    );
  });

  it('render_withData_showsHeadingAndCategoryTitles', () => {
    renderComponent();

    expect(screen.getByText('Browse Categories')).not.toBeNull();
    expect(screen.getByText('Technology')).not.toBeNull();
    expect(screen.getByText('Business')).not.toBeNull();
  });

  it('exploreButton_allFilters_navigatesWithCorrectQueryString', () => {
    renderComponent();

    fireEvent.click(screen.getAllByText('Explore')[0]);

    expect(mockNavigate).toHaveBeenCalledWith({
      pathname: '/catalog',
      search: '?catalogs=tech-catalog&skillName=programming&tagName=tech-tag',
    });
  });

  it('exploreButton_emptyFilters_navigatesWithOnlyQuestionMark', () => {
    renderComponent({
      categoryBrowsers: {
        ...mockCategoryBrowsers,
        categories: [makeCategory('General', 'desc', 'url', [], [], [])],
      },
    });

    fireEvent.click(screen.getByText('Explore'));

    expect(mockNavigate).toHaveBeenCalledWith({ pathname: '/catalog', search: '?' });
  });

  it('exploreButton_catalogFilterOnly_excludesSkillAndTagParams', () => {
    renderComponent({
      categoryBrowsers: {
        ...mockCategoryBrowsers,
        categories: [makeCategory('Test', 'desc', 'url', ['test-catalog'], [], [])],
      },
    });

    fireEvent.click(screen.getByText('Explore'));

    expect(mockNavigate).toHaveBeenCalledWith({ pathname: '/catalog', search: '?catalogs=test-catalog' });
  });

  it('exploreButton_multipleValuesPerFilter_joinsWithComma', () => {
    renderComponent({
      categoryBrowsers: {
        ...mockCategoryBrowsers,
        categories: [makeCategory('Multi', 'desc', 'url', ['cat1', 'cat2'], ['skill1', 'skill2'], ['tag1', 'tag2'])],
      },
    });

    fireEvent.click(screen.getByText('Explore'));

    expect(mockNavigate).toHaveBeenCalledWith({
      pathname: '/catalog',
      search: '?catalogs=cat1,cat2&skillName=skill1,skill2&tagName=tag1,tag2',
    });
  });

  it('imageClick_navigatesWithSameParams', () => {
    const { container } = renderComponent();

    fireEvent.click(container.querySelectorAll('img')[0]);

    expect(mockNavigate).toHaveBeenCalledWith({
      pathname: '/catalog',
      search: '?catalogs=tech-catalog&skillName=programming&tagName=tech-tag',
    });
  });

  it('leftArrow_initially_hasDisabledClass', () => {
    const { container } = renderComponent();

    const leftButton = container.querySelector('.categoriesLeft button');

    expect(leftButton?.className).toContain('disabledButton');
  });

  it('render_undefinedCategoryBrowsers_rendersSectionElement', () => {
    const { container } = renderComponent({ categoryBrowsers: undefined });

    expect(container.querySelector('section')).not.toBeNull();
  });
});
