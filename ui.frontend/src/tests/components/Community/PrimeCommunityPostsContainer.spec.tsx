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
jest.mock('@adobe/react-spectrum', () => ({
  lightTheme: {},
  Provider: ({ children }: any) => <>{children}</>,
  Button: ({ children, onPress }: any) => (
    <button data-testid="load-more-btn" onClick={onPress}>{children}</button>
  ),
}));

jest.mock('@components/Community/PrimeCommunityPost', () => ({
  PrimeCommunityPost: ({ post }: any) => <div data-testid={`post-${post.id}`} />,
}));

jest.mock('react-intl', () => {
  const actual = jest.requireActual('react-intl');
  return {
    ...actual,
    useIntl: () => ({
      formatMessage: ({ defaultMessage }: any) => defaultMessage,
    }),
  };
});

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { IntlProvider } from 'react-intl';
import PrimeCommunityPostsContainer from '@components/Community/PrimeCommunityPostsContainer/PrimeCommunityPostsContainer';

const renderContainer = (props: any = {}) =>
  render(
    <IntlProvider locale="en" messages={{ 'alm.community.loadMore': 'Load more' }}>
      <PrimeCommunityPostsContainer
        posts={[{ id: 'p1' }, { id: 'p2' }]}
        loadMorePosts={jest.fn()}
        hasMoreItems={true}
        {...props}
      />
    </IntlProvider>
  );

describe('PrimeCommunityPostsContainer', () => {
  it('renders one PrimeCommunityPost per item in the posts array', () => {
    renderContainer({ posts: [{ id: 'p1' }, { id: 'p2' }, { id: 'p3' }] });
    expect(screen.getByTestId('post-p1')).toBeInTheDocument();
    expect(screen.getByTestId('post-p2')).toBeInTheDocument();
    expect(screen.getByTestId('post-p3')).toBeInTheDocument();
  });

  it('renders no post items when posts is null', () => {
    renderContainer({ posts: null });
    expect(screen.queryByTestId(/^post-/)).not.toBeInTheDocument();
  });

  it('shows "Load more" button when hasMoreItems is true', () => {
    renderContainer({ hasMoreItems: true });
    expect(screen.getByTestId('load-more-btn')).toBeInTheDocument();
  });

  it('hides "Load more" button when hasMoreItems is false', () => {
    renderContainer({ hasMoreItems: false });
    expect(screen.queryByTestId('load-more-btn')).not.toBeInTheDocument();
  });

  it('calls loadMorePosts when the Load more button is clicked', () => {
    const loadMorePosts = jest.fn();
    renderContainer({ loadMorePosts });
    userEvent.click(screen.getByTestId('load-more-btn'));
    expect(loadMorePosts).toHaveBeenCalledTimes(1);
  });
});
