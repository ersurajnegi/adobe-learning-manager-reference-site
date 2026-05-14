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
// Mock global utilities FIRST before any imports
jest.mock('@utils/global', () => ({
  getALMConfig: () => ({
    accountId: 'test-account-id',
    baseUrl: 'https://test.example.com',
    locale: 'en-US',
    accessToken: 'test-access-token',
    csrfToken: 'test-csrf-token',
    commerceURL: 'https://test.example.com/commerce',
    graphqlProxyPath: 'https://test.example.com/graphql',
    almBaseURL: 'https://test.example.com',
    primeApiURL: 'https://test.example.com/primeapi/v2',
  }),
  getALMObject: () => ({
    getALMConfig: () => ({
      accountId: 'test-account-id',
      baseUrl: 'https://test.example.com',
      locale: 'en-US',
      accessToken: 'test-access-token',
      csrfToken: 'test-csrf-token',
    }),
  }),
  getAuthKey: () => 'csrf_token=test-csrf-token',
  getWindowObject: () => ({
    ALM: {
      getALMConfig: () => ({
        accountId: 'test-account-id',
        baseUrl: 'https://test.example.com',
        locale: 'en-US',
        accessToken: 'test-access-token',
        csrfToken: 'test-csrf-token',
      }),
    },
  }),
}));

import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { IntlProvider } from 'react-intl';
import PrimeCommunityObjectBody from '@components/Community/PrimeCommunityObjectBody/PrimeCommunityObjectBody';

jest.mock('linkify-html', () => {
  return (text: string) => {
    if (!text) return '';
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
  };
});

jest.mock('@components/Community/PrimeCommunityLinkPreview', () => ({
  PrimeCommunityLinkPreview: require('react').forwardRef((props: any, ref: any) =>
    require('react').createElement(
      'div',
      {
        ref,
        'data-testid': 'link-preview',
        'data-current-input': props.currentInput,
        'data-view-mode': String(props.viewMode),
        'data-show-link-preview': String(props.showLinkPreview),
      },
      'Link Preview Mock'
    )
  ),
}));

jest.mock('@components/Community/PrimeCommunityPoll', () => ({
  PrimeCommunityPoll: require('react').forwardRef((props: any, ref: any) =>
    require('react').createElement(
      'div',
      { ref, 'data-testid': 'poll-component', 'data-post-id': props.post.id },
      require('react').createElement(
        'button',
        {
          'data-testid': 'poll-submit',
          onClick: () => props.submitPoll && props.submitPoll('option-1'),
        },
        'Submit Poll'
      )
    )
  ),
}));

jest.mock('@spectrum-icons/workflow/Question', () => ({
  __esModule: true,
  default: require('react').forwardRef((props: any, ref: any) =>
    require('react').createElement('div', { ref, 'data-testid': 'question-icon' }, '?')
  ),
}));

const BOARD = 'board';
const POST = 'post';
const COMMENT = 'comment';
const REPLY = 'reply';
const QUESTION = 'QUESTION';
const POLL = 'POLL';
const IMAGE = 'IMAGE';
const VIDEO = 'VIDEO';
const AUDIO = 'AUDIO';

describe('PrimeCommunityObjectBody', () => {
  const mockSubmitPoll = jest.fn();

  const defaultMessages = {
    'alm.community.viewMore': 'View more',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    document.documentElement.requestFullscreen = jest.fn(() => Promise.resolve());
    document.exitFullscreen = jest.fn(() => Promise.resolve());
    Object.defineProperty(document, 'fullscreenElement', {
      writable: true,
      value: null,
    });
  });

  const renderComponent = (props = {}, messages = defaultMessages) => {
    const defaultProps = {
      object: {
        id: 'post:1',
        postingType: 'POST',
      },
      type: POST,
      description: 'Test description',
      ...props,
    };

    return render(
      <IntlProvider locale="en" messages={messages}>
        <PrimeCommunityObjectBody {...defaultProps} />
      </IntlProvider>
    );
  };

  describe('Description Rendering', () => {
    it('should render description for POST type', () => {
      const { container } = renderComponent({
        type: POST,
        description: 'This is a post description',
        object: { id: 'post:1' },
      });
      expect(container.textContent).toContain('This is a post description');
    });

    it('should render text for COMMENT type', () => {
      const { container } = renderComponent({
        type: COMMENT,
        text: 'This is a comment',
        object: { id: 'comment:1' },
      });
      expect(container.textContent).toContain('This is a comment');
    });

    it('should render text for REPLY type', () => {
      const { container } = renderComponent({
        type: REPLY,
        text: 'This is a reply',
        object: { id: 'reply:1' },
      });
      expect(container.textContent).toContain('This is a reply');
    });

    it('should render richTextdescription for BOARD type', () => {
      const { container } = renderComponent({
        type: BOARD,
        object: { id: 'board:1', richTextdescription: 'This is a board description' },
      });
      expect(container.textContent).toContain('This is a board description');
    });
  });

  describe('CSS Class Application', () => {
    it('should apply primeBoardDescription class for BOARD type', () => {
      const { container } = renderComponent({
        type: BOARD,
        object: { id: 'board:1', richTextdescription: 'Board content' },
      });
      const descElement = container.querySelector('.primeBoardDescription');
      expect(descElement?.textContent).toContain('Board content');
    });

    it('should apply primeQuestionPostDescription class for QUESTION posting type', () => {
      const { container } = renderComponent({
        type: POST,
        object: { id: 'post:1', postingType: QUESTION },
        description: 'Question content',
      });
      const descElement = container.querySelector('.primeQuestionPostDescription');
      expect(descElement?.textContent).toContain('Question content');
    });

    it('should apply primePostDescription class for non-QUESTION POST type', () => {
      const { container } = renderComponent({
        type: POST,
        object: { id: 'post:1', postingType: 'POST' },
        description: 'Post content',
      });
      const descElement = container.querySelector('.primePostDescription');
      expect(descElement?.textContent).toContain('Post content');
    });
  });

  describe('Question Icon Rendering', () => {
    it('should render question icon for QUESTION posting type', () => {
      renderComponent({
        type: POST,
        object: { id: 'post:1', postingType: QUESTION },
        description: 'Question',
      });
      expect(screen.getByTestId('question-icon')).toBeInTheDocument();
    });

    it('should not render question icon for non-QUESTION posting type', () => {
      renderComponent({
        type: POST,
        object: { id: 'post:1', postingType: 'POST' },
        description: 'Normal post',
      });
      expect(screen.queryByTestId('question-icon')).not.toBeInTheDocument();
    });
  });

  describe('Description Formatting', () => {
    it('should add target="_blank" to linkified URLs', () => {
      const { container } = renderComponent({
        type: POST,
        description: 'Visit https://example.com',
        object: { id: 'post:1' },
      });
      const link = container.querySelector('a[href="https://example.com"]');
      expect(link?.getAttribute('target')).toBe('_blank');
    });

    it('should add rel="noopener noreferrer" to linkified URLs', () => {
      const { container } = renderComponent({
        type: POST,
        description: 'Visit https://example.com',
        object: { id: 'post:1' },
      });
      const link = container.querySelector('a[href="https://example.com"]');
      expect(link?.getAttribute('rel')).toBe('noopener noreferrer');
    });

    it('should not create links when description has no URLs', () => {
      const { container } = renderComponent({
        type: POST,
        description: 'Plain text without links',
        object: { id: 'post:1' },
      });
      expect(container.querySelector('a')).toBeNull();
    });

    it('should not show "View more" for empty description', () => {
      renderComponent({
        type: POST,
        description: '',
        object: { id: 'post:1' },
      });
      expect(screen.queryByText('View more')).not.toBeInTheDocument();
    });

    it('should not show "View more" for undefined description', () => {
      renderComponent({
        type: POST,
        description: undefined,
        object: { id: 'post:1' },
      });
      expect(screen.queryByText('View more')).not.toBeInTheDocument();
    });
  });

  describe('View More / Less Functionality', () => {
    const longDescription = 'A'.repeat(500);

    it('should show "View more" button when description exceeds 450 characters', () => {
      renderComponent({
        type: POST,
        description: longDescription,
        object: { id: 'post:1' },
      });
      expect(screen.getByText('View more')).toBeInTheDocument();
    });

    it('should not show "View more" button when description is short', () => {
      renderComponent({
        type: POST,
        description: 'Short text',
        object: { id: 'post:1' },
      });
      expect(screen.queryByText('View more')).not.toBeInTheDocument();
    });

    it('should truncate description to 450 characters initially', () => {
      const { container } = renderComponent({
        type: POST,
        description: longDescription,
        object: { id: 'post:1' },
      });
      const textElement = container.querySelector('.primePostDescriptionText');
      expect(textElement?.textContent?.length).toBeLessThan(500);
    });

    it('should expand description when "View more" is clicked', () => {
      const { container } = renderComponent({
        type: POST,
        description: longDescription,
        object: { id: 'post:1' },
      });
      const initialLength =
        container.querySelector('.primePostDescriptionText')?.textContent?.length || 0;

      fireEvent.click(screen.getByText('View more'));

      const expandedLength =
        container.querySelector('.primePostDescriptionText')?.textContent?.length || 0;
      expect(expandedLength).toBeGreaterThan(initialLength);
    });

    it('should hide "View more" button once description is fully expanded', () => {
      renderComponent({
        type: POST,
        description: longDescription,
        object: { id: 'post:1' },
      });
      fireEvent.click(screen.getByText('View more'));
      expect(screen.queryByText('View more')).not.toBeInTheDocument();
    });

    it('should update displayed content when description prop changes', () => {
      const { rerender } = render(
        <IntlProvider locale="en" messages={defaultMessages}>
          <PrimeCommunityObjectBody
            type={POST}
            description="Initial description"
            object={{ id: 'post:1' }}
          />
        </IntlProvider>
      );

      expect(screen.getByText(/Initial description/).textContent).toContain('Initial description');

      rerender(
        <IntlProvider locale="en" messages={defaultMessages}>
          <PrimeCommunityObjectBody
            type={POST}
            description="Updated description"
            object={{ id: 'post:1' }}
          />
        </IntlProvider>
      );

      expect(screen.getByText(/Updated description/).textContent).toContain('Updated description');
    });
  });

  describe('Link Preview Integration', () => {
    it('should render PrimeCommunityLinkPreview for non-BOARD types', () => {
      renderComponent({
        type: POST,
        description: 'Post with link',
        object: { id: 'post:1' },
      });
      expect(screen.getByTestId('link-preview')).toBeInTheDocument();
    });

    it('should not render PrimeCommunityLinkPreview for BOARD type', () => {
      renderComponent({
        type: BOARD,
        object: { id: 'board:1', richTextdescription: 'Board description' },
      });
      expect(screen.queryByTestId('link-preview')).not.toBeInTheDocument();
    });

    it('should pass viewMode=true and showLinkPreview=true to PrimeCommunityLinkPreview', () => {
      renderComponent({
        type: POST,
        description: 'Description',
        object: { id: 'post:1' },
      });
      const linkPreview = screen.getByTestId('link-preview');
      expect(linkPreview.getAttribute('data-view-mode')).toBe('true');
      expect(linkPreview.getAttribute('data-show-link-preview')).toBe('true');
    });
  });

  describe('Poll Integration', () => {
    it('should render PrimeCommunityPoll with correct post id when postingType is POLL', () => {
      renderComponent({
        type: POST,
        object: { id: 'post:1', postingType: POLL },
        description: 'Poll question',
      });
      expect(screen.getByTestId('poll-component').getAttribute('data-post-id')).toBe('post:1');
    });

    it('should not render poll for non-POLL posting type', () => {
      renderComponent({
        type: POST,
        object: { id: 'post:1', postingType: 'POST' },
        description: 'Regular post',
      });
      expect(screen.queryByTestId('poll-component')).not.toBeInTheDocument();
    });

    it('should not render poll for BOARD type even when postingType is POLL', () => {
      renderComponent({
        type: BOARD,
        object: { id: 'board:1', postingType: POLL, richTextdescription: 'Board' },
      });
      expect(screen.queryByTestId('poll-component')).not.toBeInTheDocument();
    });

    it('should call submitPoll handler with selected option id', () => {
      renderComponent({
        type: POST,
        object: { id: 'post:1', postingType: POLL },
        description: 'Poll',
        submitPoll: mockSubmitPoll,
      });

      fireEvent.click(screen.getByTestId('poll-submit'));

      expect(mockSubmitPoll).toHaveBeenCalledTimes(1);
      expect(mockSubmitPoll).toHaveBeenCalledWith('option-1');
    });
  });

  describe('Image Resource Display', () => {
    it('should render image with correct src when resource.contentType is IMAGE', () => {
      renderComponent({
        type: POST,
        object: {
          id: 'post:1',
          resource: { contentType: IMAGE, data: 'https://example.com/image.jpg' },
        },
        description: 'Post with image',
      });
      expect(screen.getByAltText('primePostImage').getAttribute('src')).toBe(
        'https://example.com/image.jpg'
      );
    });

    it('should apply lazy loading to images', () => {
      renderComponent({
        type: POST,
        object: {
          id: 'post:1',
          resource: { contentType: IMAGE, data: 'https://example.com/image.jpg' },
        },
        description: 'Image',
      });
      expect(screen.getByAltText('primePostImage').getAttribute('loading')).toBe('lazy');
    });
  });

  describe('Fullscreen Functionality', () => {
    const imageProps = {
      type: POST,
      object: {
        id: 'post:1',
        resource: { contentType: IMAGE, data: 'https://example.com/image.jpg' },
      },
      description: 'Image',
    };

    it('should call requestFullscreen when expand button is clicked', () => {
      renderComponent(imageProps);
      fireEvent.click(screen.getByRole('button'));
      expect(document.documentElement.requestFullscreen).toHaveBeenCalled();
    });

    it('should call exitFullscreen when collapse button is clicked while in fullscreen', () => {
      renderComponent(imageProps);
      const button = screen.getByRole('button');
      fireEvent.click(button);
      Object.defineProperty(document, 'fullscreenElement', {
        writable: true,
        value: document.documentElement,
      });
      fireEvent.click(button);
      expect(document.exitFullscreen).toHaveBeenCalled();
    });

    it('should set body overflow to hidden on fullscreen enter and restore on ESC exit', () => {
      renderComponent(imageProps);
      const button = screen.getByRole('button');

      fireEvent.click(button);
      expect(document.body.style.overflow).toBe('hidden');

      // Simulate ESC key (browser fires fullscreenchange, fullscreenElement becomes null)
      Object.defineProperty(document, 'fullscreenElement', { writable: true, value: null });
      fireEvent(document, new Event('fullscreenchange'));
      expect(document.body.style.overflow).toBe('');
    });

    it('should remove fullscreenchange event listener on unmount', () => {
      const { unmount } = renderComponent(imageProps);
      const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');
      act(() => {
        unmount();
      });
      expect(removeEventListenerSpy).toHaveBeenCalledWith('fullscreenchange', expect.any(Function));
      removeEventListenerSpy.mockRestore();
    });
  });

  describe('Video Resource Display', () => {
    it('should render video iframe when resource.contentType is VIDEO', () => {
      renderComponent({
        type: POST,
        object: { id: 'post:1', resource: { contentType: VIDEO, data: 'video.mp4' } },
        description: 'Video post',
      });
      expect(screen.getByTitle('primePostVideo')).toBeInTheDocument();
    });

    it('should set allowfullscreen, allow="autoplay", and loading="lazy" on video iframe', () => {
      renderComponent({
        type: POST,
        object: { id: 'post:1', resource: { contentType: VIDEO, data: 'video.mp4' } },
        description: 'Video',
      });
      const iframe = screen.getByTitle('primePostVideo');
      expect(iframe.hasAttribute('allowfullscreen')).toBe(true);
      expect(iframe.getAttribute('allow')).toBe('autoplay');
      expect(iframe.getAttribute('loading')).toBe('lazy');
    });

    it('should construct iframe src with entity_type and entity_id for video', () => {
      renderComponent({
        type: POST,
        object: { id: 'post:123', resource: { contentType: VIDEO, data: 'video.mp4' } },
        description: 'Video',
      });
      const src = screen.getByTitle('primePostVideo').getAttribute('src') || '';
      expect(src).toContain('entity_type=post');
      expect(src).toContain('entity_id=post:123');
    });
  });

  describe('Audio Resource Display', () => {
    it('should render audio iframe with correct attributes when resource.contentType is AUDIO', () => {
      renderComponent({
        type: POST,
        object: { id: 'post:1', resource: { contentType: AUDIO, data: 'audio.mp3' } },
        description: 'Audio post',
      });
      const iframe = screen.getByTitle('primePostAudio');
      expect(iframe).toBeInTheDocument();
      expect(iframe.hasAttribute('allowfullscreen')).toBe(true);
      expect(iframe.getAttribute('allow')).toBe('autoplay');
      expect(iframe.getAttribute('loading')).toBe('lazy');
    });
  });

  describe('Document Resource Display', () => {
    it('should render static iframe for document content types', () => {
      renderComponent({
        type: POST,
        object: { id: 'post:1', resource: { contentType: 'PDF', data: 'document.pdf' } },
        description: 'PDF post',
      });
      expect(screen.getByTitle('primePostStatic')).toBeInTheDocument();
    });

    it('should set allowfullscreen, allow="autoplay", and loading="lazy" on document iframe', () => {
      renderComponent({
        type: POST,
        object: { id: 'post:1', resource: { contentType: 'PDF', data: 'doc.pdf' } },
        description: 'PDF',
      });
      const iframe = screen.getByTitle('primePostStatic');
      expect(iframe.hasAttribute('allowfullscreen')).toBe(true);
      expect(iframe.getAttribute('allow')).toBe('autoplay');
      expect(iframe.getAttribute('loading')).toBe('lazy');
    });
  });

  describe('BOARD type behaviour', () => {
    it('should not render link preview, poll, or media for BOARD type', () => {
      renderComponent({
        type: BOARD,
        object: {
          id: 'board:1',
          richTextdescription: 'Board',
          postingType: POLL,
          resource: { contentType: IMAGE, data: 'image.jpg' },
        },
      });
      expect(screen.queryByTestId('link-preview')).not.toBeInTheDocument();
      expect(screen.queryByTestId('poll-component')).not.toBeInTheDocument();
      expect(screen.queryByAltText('primePostImage')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should throw when object is null', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      expect(() => {
        renderComponent({ type: POST, object: null as any, description: 'Test' });
      }).toThrow();
      consoleErrorSpy.mockRestore();
    });

    it('should throw when object is undefined', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      expect(() => {
        renderComponent({ type: POST, object: undefined as any, description: 'Test' });
      }).toThrow();
      consoleErrorSpy.mockRestore();
    });

    it('should not render img or iframe when resource is undefined', () => {
      const { container } = renderComponent({
        type: POST,
        object: { id: 'post:1', resource: undefined },
        description: 'Test',
      });
      expect(container.querySelector('img')).toBeNull();
      expect(container.querySelector('iframe')).toBeNull();
    });

    it('should not render img or iframe for unrecognised contentType', () => {
      const { container } = renderComponent({
        type: POST,
        object: { id: 'post:1', resource: { contentType: 'INVALID', data: 'test' } },
        description: 'Test',
      });
      expect(container.querySelector('img')).toBeNull();
      expect(container.querySelector('iframe')).toBeNull();
    });

    it('should show "View more" for very long descriptions (>10000 chars)', () => {
      renderComponent({
        type: POST,
        object: { id: 'post:1' },
        description: 'A'.repeat(10000),
      });
      expect(screen.getByText('View more')).toBeInTheDocument();
    });

    it('should not show "View more" for whitespace-only description', () => {
      renderComponent({
        type: POST,
        object: { id: 'post:1' },
        description: '   \n\t  ',
      });
      expect(screen.queryByText('View more')).not.toBeInTheDocument();
    });
  });

  describe('Internationalization', () => {
    it('should display translated "View more" text', () => {
      renderComponent(
        { type: POST, object: { id: 'post:1' }, description: 'A'.repeat(500) },
        { 'alm.community.viewMore': 'Voir plus' }
      );
      expect(screen.getByText('Voir plus')).toBeInTheDocument();
    });
  });
});
