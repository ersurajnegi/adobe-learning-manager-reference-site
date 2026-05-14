# PrimeCommunityObjectBody Component - Test Plan

## Component Overview

**Component Name**: `PrimeCommunityObjectBody`  
**Category**: Community Components  
**Priority**: P1 (High - Core feature)  
**Location**: `src/almLib/components/Community/PrimeCommunityObjectBody/`

### Purpose
The `PrimeCommunityObjectBody` component is responsible for rendering the body/content of community objects (posts, comments, replies, boards). It handles:
- Rich text description rendering with HTML sanitization
- "View More" functionality for long content
- Link preview integration
- Poll rendering for poll-type posts
- Media resource display (images, videos, audio, documents)
- Fullscreen image viewing

### Component Hierarchy
```
PrimeCommunityObjectBody (Shared component)
├── Used by: PrimeCommunityPost
├── Used by: PrimeCommunityComment
├── Used by: PrimeCommunityReply
├── Used by: PrimeCommunityBoard
│
├── Integrates: PrimeCommunityLinkPreview
└── Integrates: PrimeCommunityPoll
```

---

## Component Props

```typescript
interface PrimeCommunityObjectBodyProps {
  object: {
    id: string;
    postingType?: string;        // 'QUESTION', 'POLL', etc.
    richTextdescription?: string; // For BOARD type
    resource?: {
      contentType: string;        // 'VIDEO', 'IMAGE', 'AUDIO', 'PDF', 'XLS', 'PPTX', 'DOC'
      data?: string;              // Resource URL/data
    };
  };
  type: string;                   // 'BOARD', 'POST', 'COMMENT', 'REPLY'
  description?: string;           // For POST type
  text?: string;                  // For COMMENT/REPLY type
  submitPoll?: (optionId: string) => void;  // Poll submission handler
}
```

---

## Test Categories

### 1. Rendering Tests
- [ ] Component renders without errors
- [ ] Renders correct description based on entity type (BOARD, POST, COMMENT, REPLY)
- [ ] Applies correct CSS class based on entity type
- [ ] Renders question icon for QUESTION posting type
- [ ] Uses dangerouslySetInnerHTML to render description (with linkified HTML)

### 2. Description Formatting Tests
- [ ] Linkifies URLs in description
- [ ] Adds correct class, target="_blank", and rel attributes to links
- [ ] Handles description with no links
- [ ] Handles empty description
- [ ] Handles undefined description
- [ ] Handles special characters in description
- [ ] Handles HTML entities in description

### 3. View More/Less Functionality Tests
- [ ] Shows "View More" button when description exceeds MAX_CHAR_SHOWN (450)
- [ ] Does not show "View More" when description is short
- [ ] Truncates description to 450 characters initially
- [ ] Expands description on "View More" click
- [ ] Shows next 450 characters on subsequent "View More" clicks
- [ ] Hides "View More" button when fully expanded
- [ ] Resets to 2x multiplier after full expansion
- [ ] Updates currentDescription state correctly
- [ ] Handles rapidly changing description prop

### 4. Link Preview Integration Tests
- [ ] Renders PrimeCommunityLinkPreview for non-BOARD types
- [ ] Does not render PrimeCommunityLinkPreview for BOARD type
- [ ] Passes currentDescription to link preview
- [ ] Passes viewMode={true} to link preview
- [ ] Passes showLinkPreview={true} to link preview

### 5. Poll Integration Tests
- [ ] Renders PrimeCommunityPoll when postingType is POLL
- [ ] Does not render poll for non-BOARD types
- [ ] Does not render poll for BOARD type
- [ ] Passes post object to poll component
- [ ] Calls submitPoll handler from props
- [ ] Does not crash when submitPoll is undefined

### 6. Media Resource Display Tests

#### Image Resources
- [ ] Renders image when resource.contentType is IMAGE
- [ ] Uses resource.data as image src
- [ ] Applies correct CSS classes to image
- [ ] Shows fullscreen toggle button
- [ ] Enters fullscreen on button click
- [ ] Exits fullscreen on button click when in fullscreen
- [ ] Shows correct icon (expand/collapse) based on fullscreen state
- [ ] Applies fullscreen styles when in fullscreen mode
- [ ] Handles missing resource.data gracefully
- [ ] Sets document.body overflow style correctly

#### Video Resources
- [ ] Renders iframe when resource.contentType is VIDEO
- [ ] Uses correct iframeSrc with entity_type and entity_id
- [ ] Sets allowFullScreen={true} on iframe
- [ ] Sets allow="autoplay" on iframe
- [ ] Sets loading="lazy" on iframe
- [ ] Sets correct title attribute

#### Audio Resources
- [ ] Renders iframe when resource.contentType is AUDIO
- [ ] Uses correct iframeSrc for audio player
- [ ] Sets correct attributes for audio iframe

#### Document Resources (PDF, XLS, PPTX, DOC)
- [ ] Renders iframe for PDF contentType
- [ ] Renders iframe for XLS contentType
- [ ] Renders iframe for PPTX contentType
- [ ] Renders iframe for DOC contentType
- [ ] Uses correct iframeSrc for documents
- [ ] Sets correct attributes for document iframe

### 7. Fullscreen Functionality Tests
- [ ] Toggles isFullScreen state on button click
- [ ] Calls document.documentElement.requestFullscreen()
- [ ] Calls document.exitFullscreen() when exiting
- [ ] Sets document.body.style.overflow = 'hidden' on enter
- [ ] Resets document.body.style.overflow on exit
- [ ] Handles fullscreenchange event
- [ ] Updates state when user exits fullscreen via ESC key
- [ ] Cleans up fullscreenchange event listener on unmount

### 8. Entity Type Specific Tests

#### BOARD Type
- [ ] Uses object.richTextdescription for description
- [ ] Applies primeBoardDescription CSS class
- [ ] Does not render link preview
- [ ] Does not render media resources
- [ ] Does not render poll

#### POST Type
- [ ] Uses props.description for description
- [ ] Applies primePostDescription or primeQuestionPostDescription class
- [ ] Renders link preview
- [ ] Renders media resources
- [ ] Renders poll if postingType is POLL

#### COMMENT Type
- [ ] Uses props.text for description
- [ ] Applies correct CSS class
- [ ] Renders link preview
- [ ] Does not render media resources

#### REPLY Type
- [ ] Uses props.text for description
- [ ] Applies correct CSS class
- [ ] Renders link preview
- [ ] Does not render media resources

### 9. Question Type Tests
- [ ] Shows question icon for QUESTION posting type
- [ ] Applies primeQuestionPostDescription class
- [ ] Does not show question icon for non-QUESTION types

### 10. URL Formatting Tests
- [ ] formatUrl adds 'http://' prefix when missing
- [ ] formatUrl preserves https:// protocol
- [ ] isValidUrl validates correct URLs
- [ ] isValidUrl handles URLs without protocol
- [ ] isValidUrl handles domains with dots
- [ ] isValidUrl rejects strings ending with dot only

### 11. useEffect Hook Tests
- [ ] Updates fullDescription when props.description changes
- [ ] Updates currentDescription when props.description changes
- [ ] Recalculates viewMore state when description changes
- [ ] Registers fullscreenchange event listener on mount
- [ ] Unregisters fullscreenchange event listener on unmount

### 12. Integration with Global Utils Tests
- [ ] Calls getALMConfig() for configuration
- [ ] Calls getAuthKey() for authentication
- [ ] Constructs correct iframeSrc with almBaseURL
- [ ] Uses csrfToken from config

### 13. Edge Cases & Error Handling
- [ ] Handles object being null/undefined
- [ ] Handles missing postingType
- [ ] Handles missing resource object
- [ ] Handles invalid resource.contentType
- [ ] Handles empty resource.data
- [ ] Handles very long descriptions (>10000 chars)
- [ ] Handles description with only whitespace
- [ ] Handles description with mixed HTML and text
- [ ] Handles malformed HTML in description
- [ ] Handles concurrent "View More" clicks
- [ ] Handles fullscreen API not being available
- [ ] Handles requestFullscreen() failure
- [ ] Handles exitFullscreen() failure

### 14. Accessibility Tests
- [ ] Image has alt attribute
- [ ] Iframes have title attributes
- [ ] Links have proper target and rel attributes
- [ ] Question icon has proper ARIA attributes
- [ ] Fullscreen button is keyboard accessible
- [ ] Focus management in fullscreen mode

### 15. Internationalization Tests
- [ ] Uses formatMessage for "View more" text
- [ ] Uses correct translation ID: 'alm.community.viewMore'
- [ ] Provides default message for translation

### 16. Performance Tests
- [ ] Does not re-render unnecessarily
- [ ] Uses lazy loading for images and iframes
- [ ] Efficiently updates description truncation
- [ ] Cleans up event listeners properly

### 17. Snapshot Tests
- [ ] Matches snapshot for BOARD type
- [ ] Matches snapshot for POST type
- [ ] Matches snapshot for COMMENT type
- [ ] Matches snapshot for REPLY type
- [ ] Matches snapshot for QUESTION type
- [ ] Matches snapshot with short description
- [ ] Matches snapshot with long description
- [ ] Matches snapshot with image resource
- [ ] Matches snapshot with video resource
- [ ] Matches snapshot with poll
- [ ] Matches snapshot in fullscreen mode

---

## Testing Approach

### Unit Testing Strategy
1. **Isolation**: Mock all external dependencies (PrimeCommunityLinkPreview, PrimeCommunityPoll, global utils)
2. **State Testing**: Verify state changes for description expansion, fullscreen mode
3. **Event Handling**: Test button clicks, fullscreen events
4. **Rendering**: Test conditional rendering based on props and state

### Mocks Required
```typescript
// Mock dependencies
jest.mock('../../../utils/global');
jest.mock('../../../utils/inline_svg');
jest.mock('../../../utils/constants');
jest.mock('linkify-html');
jest.mock('../PrimeCommunityLinkPreview');
jest.mock('../PrimeCommunityPoll');
```

### Test Data
```typescript
const mockBoardObject = {
  id: 'board:1',
  richTextdescription: 'Board description',
  postingType: 'DISCUSSION',
};

const mockPostObject = {
  id: 'post:1',
  postingType: 'POST',
  resource: null,
};

const mockQuestionObject = {
  id: 'post:2',
  postingType: 'QUESTION',
};

const mockPollObject = {
  id: 'post:3',
  postingType: 'POLL',
  otherData: '[]',
};

const mockImageObject = {
  id: 'post:4',
  resource: {
    contentType: 'IMAGE',
    data: 'https://example.com/image.jpg',
  },
};

const mockVideoObject = {
  id: 'post:5',
  resource: {
    contentType: 'VIDEO',
    data: 'https://example.com/video.mp4',
  },
};

const longDescription = 'A'.repeat(500);
const shortDescription = 'Short description';
```

---

## Test Execution

### Run Tests
```bash
# Run specific test file
npm test -- PrimeCommunityObjectBody.spec.tsx

# Run with coverage
npm test -- PrimeCommunityObjectBody.spec.tsx --coverage

# Run in watch mode
npm test -- PrimeCommunityObjectBody.spec.tsx --watch
```

### Coverage Goals
- **Line Coverage**: > 85%
- **Branch Coverage**: > 80%
- **Function Coverage**: > 90%
- **Statement Coverage**: > 85%

---

## Known Challenges

1. **DOM Manipulation**: Component directly manipulates DOM for fullscreen
   - Solution: Mock document.documentElement and document methods

2. **linkify-html**: External library for linkifying text
   - Solution: Mock the entire module with predictable output

3. **dangerouslySetInnerHTML**: Makes testing HTML content difficult
   - Solution: Test via container.innerHTML or textContent

4. **Nested Components**: Integrates PrimeCommunityLinkPreview and Poll
   - Solution: Mock both components, verify they receive correct props

5. **Event Listeners**: fullscreenchange event listener
   - Solution: Manually trigger event in tests

6. **iframeSrc Construction**: Depends on config and auth
   - Solution: Mock getALMConfig() and getAuthKey()

---

## Success Criteria

- [ ] All 100+ test cases pass
- [ ] Code coverage > 85%
- [ ] No console errors or warnings
- [ ] Snapshot tests are stable
- [ ] Edge cases are handled gracefully
- [ ] Tests run in < 5 seconds
- [ ] Tests are deterministic (no flaky tests)

---

## Related Documentation

- [Community Components Test Plan](./COMMUNITY_COMPONENTS_TEST_PLAN.md)
- [Component Hierarchy](../COMPONENT_HIERARCHY.md)
- [PrimeCommunityLinkPreview Test Plan](./PRIME_COMMUNITY_LINK_PREVIEW_TEST_PLAN.md)
- [PrimeCommunityPoll Test Plan](./PRIME_COMMUNITY_POLL_TEST_PLAN.md)

---

**Test Plan Created**: January 7, 2026  
**Last Updated**: January 7, 2026  
**Status**: ✅ Ready for Implementation  
**Estimated Test Count**: 100+ tests

