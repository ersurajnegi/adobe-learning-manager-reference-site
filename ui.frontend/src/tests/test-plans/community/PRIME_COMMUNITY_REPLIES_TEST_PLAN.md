# PrimeCommunityReplies Component - Test Plan

## Component Overview

**Component**: `PrimeCommunityReplies`  
**Location**: `src/almLib/components/Community/PrimeCommunityReplies/PrimeCommunityReplies.tsx`  
**Purpose**: Container component that displays a filtered list of replies for a specific comment with load more functionality

### Component Functionality
- Displays replies filtered by parent comment ID
- Provides "Show more replies" button when more items available
- Passes delete and update handlers to individual reply components
- Uses `useReplies` hook for data management
- Integrates with confirmation alerts for operations
- Supports internationalization for labels

### Props Interface
```typescript
interface PrimeCommunityRepliesProps {
  object: {
    id: string; // Comment ID
  };
  deleteReplyHandler?: () => void;
}
```

### Key State Variables
- Managed by `useReplies` hook:
  - `items`: Array of reply objects
  - `hasMoreItems`: Boolean for pagination
  - `patchReply`: Function to update reply
  - `loadMoreReplies`: Function to load more replies

### Sub-Components Used
1. `PrimeCommunityReply` - Individual reply component

### Custom Hooks
1. `useReplies(commentId)` - Returns: items, patchReply, loadMoreReplies, hasMoreItems
2. `useIntl()` - Returns: formatMessage
3. `useConfirmationAlert()` - Returns: [almConfirmationAlert]

### External Dependencies
- `getAlmConfirmationBadwordParams` - Utility for bad word params (imported but not used in component)

## Testing Strategy

### Approach
- **Integration Testing**: Test with mocked sub-components and hooks
- **Filtering Logic**: Test parent.id filtering
- **Pagination Testing**: Test hasMoreItems and loadMoreReplies
- **Handler Testing**: Test deleteReplyHandler and updateReply callback passing
- **Edge Case Testing**: Empty states, no more items, undefined handlers

### Test Categories
1. **Component Rendering** (8 tests)
2. **Reply Filtering** (6 tests)
3. **Load More Functionality** (8 tests)
4. **Handler Functions** (8 tests)
5. **Empty States** (5 tests)
6. **Edge Cases** (6 tests)

**Total Planned Tests**: ~41 tests  
**Target Coverage**: 95%+

## Detailed Test Cases

### 1. Component Rendering (8 tests)
- [ ] Should render without crashing
- [ ] Should render reply section wrapper
- [ ] Should render PrimeCommunityReply for each reply
- [ ] Should not render "Show more replies" button when hasMoreItems is false
- [ ] Should render "Show more replies" button when hasMoreItems is true
- [ ] Should pass correct props to PrimeCommunityReply
- [ ] Should use correct key for reply items
- [ ] Should use formatMessage for button text

### 2. Reply Filtering (6 tests)
- [ ] Should filter replies by parent.id matching commentId
- [ ] Should exclude replies with different parent.id
- [ ] Should handle multiple replies with same parent.id
- [ ] Should handle empty items array
- [ ] Should handle items with undefined parent
- [ ] Should handle items with undefined parent.id

### 3. Load More Functionality (8 tests)
- [ ] Should call loadMoreReplies when button clicked
- [ ] Should not show button when hasMoreItems is false
- [ ] Should show button when hasMoreItems is true
- [ ] Should handle multiple loadMore clicks
- [ ] Should pass correct formatMessage to button
- [ ] Should use correct message ID for button
- [ ] Should use correct CSS class for button
- [ ] Should handle loadMoreReplies being undefined

### 4. Handler Functions (8 tests)
- [ ] Should call props.deleteReplyHandler when deleteReplyHandler invoked
- [ ] Should not throw when deleteReplyHandler called without prop
- [ ] Should check if deleteReplyHandler is a function
- [ ] Should call patchReply with correct parameters
- [ ] Should pass updateReply to PrimeCommunityReply
- [ ] Should pass deleteReplyHandler to PrimeCommunityReply
- [ ] Should handle async updateReply
- [ ] Should handle async deleteReplyHandler

### 5. Empty States (5 tests)
- [ ] Should render empty section when no replies
- [ ] Should handle null items array
- [ ] Should handle undefined items array
- [ ] Should handle items array with no matching parent.id
- [ ] Should not show loadMore button when no items

### 6. Edge Cases (6 tests)
- [ ] Should handle missing props.object
- [ ] Should handle missing props.object.id
- [ ] Should handle undefined deleteReplyHandler prop
- [ ] Should handle patchReply rejection
- [ ] Should handle loadMoreReplies error
- [ ] Should handle malformed reply objects

## Mock Requirements

### Mocks Needed
1. **useReplies Hook**: Mock all returned functions and state
2. **useIntl Hook**: Mock formatMessage
3. **useConfirmationAlert Hook**: Mock confirmation alert
4. **PrimeCommunityReply**: Mock sub-component
5. **getAlmConfirmationBadwordParams**: Mock utility (not used but imported)

### Mock Structure
```typescript
const mockItems = [
  { id: 'reply1', parent: { id: 'comment1' }, content: 'Reply 1' },
  { id: 'reply2', parent: { id: 'comment1' }, content: 'Reply 2' },
  { id: 'reply3', parent: { id: 'comment2' }, content: 'Reply 3' },
];

const mockPatchReply = jest.fn().mockResolvedValue(undefined);
const mockLoadMoreReplies = jest.fn();

jest.mock('../../../hooks/community', () => ({
  useReplies: (commentId: string) => ({
    items: mockItems,
    patchReply: mockPatchReply,
    loadMoreReplies: mockLoadMoreReplies,
    hasMoreItems: true,
  }),
}));

jest.mock('../../../common/Alert/useConfirmationAlert', () => ({
  useConfirmationAlert: () => [jest.fn()],
}));

jest.mock('../../../utils/social-utils', () => ({
  getAlmConfirmationBadwordParams: jest.fn().mockReturnValue({
    title: 'Confirm',
    message: 'Are you sure?',
  }),
}));
```

## Coverage Goals

### Code Coverage Targets
- **Line Coverage**: > 95%
- **Branch Coverage**: > 90%
- **Function Coverage**: 100%
- **Statement Coverage**: > 95%

### Critical Paths to Cover
1. ✅ Reply filtering by parent.id
2. ✅ Load more button visibility logic
3. ✅ Handler function calls and prop checking
4. ✅ Empty state handling
5. ✅ Props passing to sub-components
6. ✅ Async operations (patchReply, deleteReplyHandler)

## Success Criteria

### Test Suite Must:
- ✅ Achieve > 95% code coverage
- ✅ Test all filtering logic thoroughly
- ✅ Verify handler function behavior
- ✅ Test pagination logic
- ✅ Validate edge cases and error scenarios
- ✅ Run quickly (< 2 seconds)
- ✅ Be maintainable and well-documented

---

**Test Plan Version**: 1.0  
**Created**: January 7, 2026  
**Component**: PrimeCommunityReplies  
**Estimated Test Count**: ~41 tests  
**Target Coverage**: 95%+

