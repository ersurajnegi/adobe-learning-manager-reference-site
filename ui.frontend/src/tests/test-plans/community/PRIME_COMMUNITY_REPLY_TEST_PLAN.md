# PrimeCommunityReply Component - Test Plan

## Component Overview

**Component**: `PrimeCommunityReply`  
**Location**: `src/almLib/components/Community/PrimeCommunityReply/PrimeCommunityReply.tsx`  
**Purpose**: Displays a single reply with voting, editing capabilities, and integrates multiple sub-components

### Component Functionality
- Displays reply header, body, and action buttons
- Manages upvote/downvote state and counts
- Provides edit mode with input component
- Handles vote toggling with mutual exclusivity
- Integrates with hooks for vote operations
- Uses `useEffect` with refs to prevent initial run of vote count updates

### Props Interface
```typescript
interface PrimeCommunityReplyProps {
  reply: {
    id: string;
    richText: string;
    myVoteStatus?: 'UPVOTE' | 'DOWNVOTE' | '';
    upVote: number;
    downVote: number;
    // ... other reply properties
  };
  deleteReplyHandler?: () => void;
  updateReply?: (replyId: string, value: string) => Promise<void>;
}
```

### Key State Variables
- `myUpVoteStatus`: Boolean for upvote state
- `upVoteCount`: Number for upvote count
- `myDownVoteStatus`: Boolean for downvote state
- `downVoteCount`: Number for downvote count
- `showEditReplyView`: Boolean for edit mode
- `replyText`: String for reply content
- `firstRunForUpvote`: Ref to prevent initial effect run
- `firstRunForDownvote`: Ref to prevent initial effect run

### Sub-Components Used
1. `PrimeCommunityObjectHeader` - Reply header
2. `PrimeCommunityObjectBody` - Reply content
3. `PrimeCommunityObjectActions` - Vote buttons
4. `PrimeCommunityObjectInput` - Edit input (conditional)

### Custom Hooks
1. `useReply()` - Returns: voteReply, deleteReplyVote
2. `useIntl()` - Returns: formatMessage

### Constants Used
- `REPLY`, `UP`, `DOWN`, `UPVOTE`, `DOWNVOTE`

## Testing Strategy

### Approach
- **Integration Testing**: Test with mocked sub-components and hooks
- **State Testing**: Test vote state management and mutual exclusivity
- **Effect Testing**: Test `useEffect` with refs for vote count updates
- **Edit Mode Testing**: Test toggle between view and edit modes
- **Handler Testing**: Test prop handlers and vote operations
- **Edge Case Testing**: Missing props, undefined handlers, initial vote states

### Test Categories
1. **Component Rendering** (10 tests)
2. **Initial State** (8 tests)
3. **Upvote Functionality** (12 tests)
4. **Downvote Functionality** (12 tests)
5. **Vote Mutual Exclusivity** (8 tests)
6. **Edit Mode** (10 tests)
7. **Handler Functions** (10 tests)
8. **useEffect Behavior** (8 tests)
9. **Edge Cases** (8 tests)

**Total Planned Tests**: ~86 tests  
**Target Coverage**: 95%+

## Detailed Test Cases

### 1. Component Rendering (10 tests)
- [ ] Should render without crashing
- [ ] Should render PrimeCommunityObjectHeader
- [ ] Should render PrimeCommunityObjectBody
- [ ] Should render PrimeCommunityObjectActions
- [ ] Should not render PrimeCommunityObjectInput initially
- [ ] Should pass REPLY type to sub-components
- [ ] Should pass reply object to sub-components
- [ ] Should use correct CSS class for wrapper
- [ ] Should render edit view when showEditReplyView is true
- [ ] Should hide default view when in edit mode

### 2. Initial State (8 tests)
- [ ] Should initialize myUpVoteStatus from reply.myVoteStatus
- [ ] Should initialize myDownVoteStatus from reply.myVoteStatus
- [ ] Should initialize upVoteCount from reply.upVote
- [ ] Should initialize downVoteCount from reply.downVote
- [ ] Should initialize replyText from reply.richText
- [ ] Should initialize showEditReplyView as false
- [ ] Should handle missing myVoteStatus (default to empty string)
- [ ] Should handle UPVOTE initial status

### 3. Upvote Functionality (12 tests)
- [ ] Should call voteReply when upvoting (not already upvoted)
- [ ] Should call deleteReplyVote when removing upvote
- [ ] Should toggle myUpVoteStatus on click
- [ ] Should increment upVoteCount when upvoting
- [ ] Should decrement upVoteCount when removing upvote
- [ ] Should not update count on initial render (firstRunForUpvote ref)
- [ ] Should update count on subsequent state changes
- [ ] Should pass UP constant to vote functions
- [ ] Should toggle downvote off when upvoting if downvoted
- [ ] Should not affect downvote count when upvoting from neutral
- [ ] Should handle multiple upvote clicks
- [ ] Should handle rapid upvote toggle

### 4. Downvote Functionality (12 tests)
- [ ] Should call voteReply when downvoting (not already downvoted)
- [ ] Should call deleteReplyVote when removing downvote
- [ ] Should toggle myDownVoteStatus on click
- [ ] Should increment downVoteCount when downvoting
- [ ] Should decrement downVoteCount when removing downvote
- [ ] Should not update count on initial render (firstRunForDownvote ref)
- [ ] Should update count on subsequent state changes
- [ ] Should pass DOWN constant to vote functions
- [ ] Should toggle upvote off when downvoting if upvoted
- [ ] Should not affect upvote count when downvoting from neutral
- [ ] Should handle multiple downvote clicks
- [ ] Should handle rapid downvote toggle

### 5. Vote Mutual Exclusivity (8 tests)
- [ ] Should remove downvote when upvoting
- [ ] Should remove upvote when downvoting
- [ ] Should update both counts when switching votes
- [ ] Should call correct vote/delete functions when switching
- [ ] Should maintain correct state when toggling between votes
- [ ] Should handle neutral -> upvote -> downvote sequence
- [ ] Should handle downvote -> neutral -> upvote sequence
- [ ] Should prevent having both votes active simultaneously

### 6. Edit Mode (10 tests)
- [ ] Should show edit input when updateReplyHandler called
- [ ] Should hide default view in edit mode
- [ ] Should pass correct props to PrimeCommunityObjectInput
- [ ] Should call updateReply when primaryActionHandler invoked
- [ ] Should update replyText after successful update
- [ ] Should close edit mode after successful update
- [ ] Should close edit mode when secondaryActionHandler invoked
- [ ] Should pass reply.richText as defaultValue
- [ ] Should use correct placeholder text
- [ ] Should pass ref to ObjectInput

### 7. Handler Functions (10 tests)
- [ ] Should call props.deleteReplyHandler when invoked
- [ ] Should check if deleteReplyHandler is a function
- [ ] Should not throw when deleteReplyHandler is undefined
- [ ] Should call props.updateReply with reply.id and value
- [ ] Should check if updateReply is a function
- [ ] Should not throw when updateReply is undefined
- [ ] Should handle async updateReply
- [ ] Should handle async deleteReplyHandler
- [ ] Should update local state after successful updateReply
- [ ] Should not update state if updateReply fails

### 8. useEffect Behavior (8 tests)
- [ ] Should skip upvote count update on initial render
- [ ] Should update upvote count on state change
- [ ] Should skip downvote count update on initial render
- [ ] Should update downvote count on state change
- [ ] Should use firstRunForUpvote ref correctly
- [ ] Should use firstRunForDownvote ref correctly
- [ ] Should handle multiple state changes for upvote
- [ ] Should handle multiple state changes for downvote

### 9. Edge Cases (8 tests)
- [ ] Should handle missing reply prop
- [ ] Should handle missing vote counts (undefined)
- [ ] Should handle missing myVoteStatus
- [ ] Should handle missing richText
- [ ] Should handle non-function deleteReplyHandler
- [ ] Should handle non-function updateReply
- [ ] Should handle vote function rejections
- [ ] Should handle malformed reply object

## Mock Requirements

### Mocks Needed
1. **useReply Hook**: Mock voteReply and deleteReplyVote
2. **useIntl Hook**: Mock formatMessage
3. **Sub-Components**: Mock all 4 sub-components
4. **Constants**: Import actual constants

### Mock Structure
```typescript
const mockVoteReply = jest.fn().mockResolvedValue(undefined);
const mockDeleteReplyVote = jest.fn().mockResolvedValue(undefined);

jest.mock('../../../hooks/community', () => ({
  useReply: () => ({
    voteReply: mockVoteReply,
    deleteReplyVote: mockDeleteReplyVote,
  }),
}));

jest.mock('react-intl', () => ({
  useIntl: () => ({
    formatMessage: ({ defaultMessage }: any) => defaultMessage,
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
1. ✅ Vote toggling logic
2. ✅ Vote mutual exclusivity
3. ✅ useEffect with firstRun refs
4. ✅ Edit mode toggle
5. ✅ Handler function type checking
6. ✅ All sub-component integrations

## Success Criteria

### Test Suite Must:
- ✅ Achieve > 95% code coverage
- ✅ Test all voting logic thoroughly
- ✅ Verify mutual exclusivity of votes
- ✅ Test useEffect behavior with refs
- ✅ Validate edit mode transitions
- ✅ Test edge cases and error scenarios
- ✅ Run quickly (< 3 seconds)
- ✅ Be maintainable and well-documented

---

**Test Plan Version**: 1.0  
**Created**: January 7, 2026  
**Component**: PrimeCommunityReply  
**Estimated Test Count**: ~86 tests  
**Target Coverage**: 95%+

