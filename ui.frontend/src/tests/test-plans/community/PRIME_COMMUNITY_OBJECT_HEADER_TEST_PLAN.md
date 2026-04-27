# PrimeCommunityObjectHeader Component - Test Plan

## Component Overview

The `PrimeCommunityObjectHeader` component displays the header information for community objects (posts, comments, replies) including:
- User avatar and name
- Creation date
- Options menu (edit, delete, report)
- Update modal for editing posts

## Component Props Interface

```typescript
interface PrimeCommunityObjectHeaderProps {
  object: {
    id: string;
    createdBy: {
      name: string;
      avatarUrl: string;
    };
    dateCreated: string;
    // ... other object properties
  };
  type: 'post' | 'comment' | 'reply';
  parentPost?: any;
  description?: string;
  answerCommentId?: string;
  deleteObjectHandler?: () => void;
  updateObjectHandler?: (input: any, postingType: any, resource: any, isResourceModified: any, pollOptions: any) => Promise<void>;
  updateRightAnswerHandler?: (value: any) => void;
}
```

## Test Categories

### 1. Basic Rendering (8 tests)
- ✓ Should render header with user avatar
- ✓ Should render user name
- ✓ Should render formatted creation date
- ✓ Should render options button
- ✓ Should render for POST type
- ✓ Should render for COMMENT type
- ✓ Should render for REPLY type
- ✓ Should handle missing object gracefully

### 2. User Avatar Display (5 tests)
- ✓ Should display user avatar with correct src
- ✓ Should have alt text for avatar
- ✓ Should apply correct CSS class to avatar
- ✓ Should handle missing avatarUrl
- ✓ Should set aria-hidden on avatar

### 3. User Name Display (4 tests)
- ✓ Should display user name correctly
- ✓ Should apply correct CSS class to name
- ✓ Should handle empty name
- ✓ Should handle special characters in name

### 4. Date Display (6 tests)
- ✓ Should format and display creation date
- ✓ Should use locale from useIntl
- ✓ Should render date separator
- ✓ Should handle invalid date
- ✓ Should handle different date formats
- ✓ Should update when locale changes

### 5. Options Menu Toggle (8 tests)
- ✓ Should show options menu on button click
- ✓ Should hide options menu on second click
- ✓ Should render SOCIAL_MORE_OPTIONS_SVG icon
- ✓ Should toggle showOptions state
- ✓ Should pass toggleOptions to PrimeCommunityObjectOptions
- ✓ Should not show options menu initially
- ✓ Should handle multiple toggle clicks
- ✓ Should apply correct CSS class to options button

### 6. PrimeCommunityObjectOptions Integration (8 tests)
- ✓ Should render PrimeCommunityObjectOptions when showOptions is true
- ✓ Should pass object prop to PrimeCommunityObjectOptions
- ✓ Should pass type prop to PrimeCommunityObjectOptions
- ✓ Should pass parentPost prop to PrimeCommunityObjectOptions
- ✓ Should pass editHandler to PrimeCommunityObjectOptions
- ✓ Should pass deleteHandler to PrimeCommunityObjectOptions
- ✓ Should pass reportAbuseHandler to PrimeCommunityObjectOptions
- ✓ Should pass answerCommentId to PrimeCommunityObjectOptions

### 7. Delete Functionality (12 tests)
- ✓ Should call deletePostFromServer for POST type
- ✓ Should call deleteCommentFromServer for COMMENT type
- ✓ Should call deleteReplyFromServer for REPLY type
- ✓ Should show confirmation dialog before delete
- ✓ Should use correct confirmation message for POST
- ✓ Should use correct confirmation message for COMMENT
- ✓ Should use correct confirmation message for REPLY
- ✓ Should call deleteObjectHandler after delete for COMMENT
- ✓ Should call deleteObjectHandler after delete for REPLY
- ✓ Should not call deleteObjectHandler for POST
- ✓ Should handle delete cancellation
- ✓ Should handle delete errors

### 8. Report Abuse Functionality (9 tests)
- ✓ Should call reportPostAbuse for POST type
- ✓ Should call reportCommentAbuse for COMMENT type
- ✓ Should call reportReplyAbuse for REPLY type
- ✓ Should show confirmation dialog before report
- ✓ Should use correct confirmation message for POST
- ✓ Should use correct confirmation message for COMMENT
- ✓ Should use correct confirmation message for REPLY
- ✓ Should handle report cancellation
- ✓ Should handle report errors

### 9. Edit Functionality (10 tests)
- ✓ Should show update modal for POST type on edit
- ✓ Should call updateObjectHandler for COMMENT type on edit
- ✓ Should call updateObjectHandler for REPLY type on edit
- ✓ Should not show update modal initially
- ✓ Should pass object to PrimeCommunityAddPostDialogTrigger
- ✓ Should pass description to PrimeCommunityAddPostDialogTrigger
- ✓ Should set mode to UPDATE for dialog
- ✓ Should handle close dialog
- ✓ Should call updateObjectHandler on save
- ✓ Should close modal after successful update

### 10. Confirmation Dialog (8 tests)
- ✓ Should show confirmation dialog with correct title
- ✓ Should use "Continue" as primary button text
- ✓ Should use "Cancel" as secondary button text
- ✓ Should call correct action on confirm
- ✓ Should not call action on cancel
- ✓ Should handle DELETE action for POST
- ✓ Should handle DELETE action for COMMENT
- ✓ Should handle DELETE action for REPLY

### 11. Update Right Answer Handler (4 tests)
- ✓ Should call updateRightAnswerHandler when provided
- ✓ Should handle missing updateRightAnswerHandler
- ✓ Should pass correct value to updateRightAnswerHandler
- ✓ Should work with PrimeCommunityObjectOptions

### 12. Props Validation (6 tests)
- ✓ Should handle missing deleteObjectHandler
- ✓ Should handle missing updateObjectHandler
- ✓ Should handle missing updateRightAnswerHandler
- ✓ Should handle missing parentPost
- ✓ Should handle missing answerCommentId
- ✓ Should handle missing description

### 13. CSS Classes and Styling (7 tests)
- ✓ Should apply primePostHeader class to container
- ✓ Should apply primePostOwnerImage class to avatar
- ✓ Should apply primePostOwnerName class to name
- ✓ Should apply primePostDateSeperator class to separator
- ✓ Should apply primePostDateCreated class to date
- ✓ Should apply primeCommunityOptionsIcon class to button
- ✓ Should apply primeAddPostButton class to dialog trigger

### 14. Integration with Hooks (5 tests)
- ✓ Should use useCommunityObjectOptions hook
- ✓ Should use useConfirmationAlert hook
- ✓ Should use useIntl hook for formatMessage
- ✓ Should use useIntl hook for locale
- ✓ Should use useState for local state

### 15. Edge Cases and Error Handling (10 tests)
- ✓ Should handle null object
- ✓ Should handle undefined object
- ✓ Should handle missing createdBy
- ✓ Should handle missing dateCreated
- ✓ Should handle invalid date format
- ✓ Should handle missing object.id
- ✓ Should handle async delete errors
- ✓ Should handle async report errors
- ✓ Should handle async update errors
- ✓ Should log error for unknown type

### 16. Snapshot Tests (6 tests)
- ✓ Should match snapshot for POST type
- ✓ Should match snapshot for COMMENT type
- ✓ Should match snapshot for REPLY type
- ✓ Should match snapshot with options menu open
- ✓ Should match snapshot with update modal open
- ✓ Should match snapshot with all props

## Testing Approach

### Unit Testing
- Test component rendering with different props
- Test user interactions (clicks, toggles)
- Test conditional rendering
- Test prop passing to child components

### Integration Testing
- Test interaction with useCommunityObjectOptions hook
- Test interaction with useConfirmationAlert hook
- Test interaction with useIntl hook
- Test child component integration

### Snapshot Testing
- Capture component structure for different states
- Detect unintended UI changes

## Mock Requirements

### Required Mocks
1. **useCommunityObjectOptions** - Mock all delete/report functions
2. **useConfirmationAlert** - Mock alert dialog
3. **useIntl** - Mock formatMessage and locale
4. **GetFormattedDate** - Mock date formatting utility
5. **SOCIAL_MORE_OPTIONS_SVG** - Mock SVG function
6. **PrimeCommunityObjectOptions** - Mock child component
7. **PrimeCommunityAddPostDialogTrigger** - Mock dialog component

### Mock Data
```typescript
const mockObject = {
  id: 'post:123',
  createdBy: {
    name: 'John Doe',
    avatarUrl: 'https://example.com/avatar.jpg',
  },
  dateCreated: '2024-01-07T12:00:00Z',
};

const mockParentPost = {
  id: 'post:parent',
  // ... parent post data
};
```

## Coverage Goals

- **Statement Coverage**: > 95%
- **Branch Coverage**: > 90%
- **Function Coverage**: > 95%
- **Line Coverage**: > 95%

## Known Challenges

1. **Async Operations**: Delete, report, and update operations are async
2. **Confirmation Dialog**: Testing modal interactions requires proper mocking
3. **Hook Dependencies**: Multiple custom hooks need comprehensive mocking
4. **Date Formatting**: Locale-dependent formatting needs proper testing
5. **Conditional Logic**: Multiple conditional renders based on type

## Success Criteria

- ✓ All tests pass successfully
- ✓ Code coverage meets goals
- ✓ No console errors or warnings
- ✓ Proper cleanup in all tests
- ✓ All edge cases handled
- ✓ Snapshot tests capture all states

## Total Tests: 120+

The test suite comprehensively covers all functionality, edge cases, and integration points of the PrimeCommunityObjectHeader component.

