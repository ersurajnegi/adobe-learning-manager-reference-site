# PrimeCommunityPost Component - Test Plan

## Component Overview

**Component**: `PrimeCommunityPost`  
**Location**: `src/almLib/components/Community/PrimeCommunityPost/PrimeCommunityPost.tsx`  
**Purpose**: Main post component that orchestrates all post-related functionality including voting, comments, and sub-components

### Component Functionality
- Renders complete post with header, body, actions, and comments
- Manages upvote/downvote state and functionality
- Handles showing/hiding comments section
- Allows adding new comments
- Supports post editing
- Handles poll vote submission
- Uses multiple sub-components (Header, Body, Actions, Input, Comments)
- Integrates with custom hooks (usePost, useComments, useConfirmationAlert)

### Props Interface
```typescript
interface PrimeCommunityPostProps {
  post: {
    id: string;
    richText: string;
    myVoteStatus?: 'upVote' | 'downVote' | '';
    upVote: number;
    downVote: number;
    commentCount: number;
    resource?: any;
    // ... other post properties
  };
  showBorder?: boolean;
}
```

### Key State Variables
- `myUpVoteStatus`: Boolean for user's upvote state
- `upVoteCount`: Number of upvotes
- `myDownVoteStatus`: Boolean for user's downvote state
- `downVoteCount`: Number of downvotes
- `showComments`: Boolean for comments visibility
- `buttonLabel`: String for show/hide comments button
- `commentCount`: Number of comments
- `postDescription`: String for post text

### Sub-Components Used
1. `PrimeCommunityObjectHeader` - Post header with author info
2. `PrimeCommunityObjectBody` - Post content and media
3. `PrimeCommunityObjectActions` - Vote buttons and comment button
4. `PrimeCommunityObjectInput` - Comment input field
5. `PrimeCommunityComments` - Comments list

### Custom Hooks
1. `usePost()` - Returns: addComment, votePost, deletePostVote, patchPost, submitPollVote
2. `useComments()` - Returns: fetchComments
3. `useConfirmationAlert()` - Returns: almConfirmationAlert function
4. `useIntl()` - Returns: formatMessage

## Testing Strategy

### Approach
- **Integration Testing**: Test component with mocked sub-components and hooks
- **State Testing**: Verify state changes and their effects
- **User Interaction Testing**: Test voting, commenting, show/hide functionality
- **Hook Integration**: Mock and verify hook calls
- **Edge Case Testing**: Handle missing data, zero counts, rapid interactions

### Test Categories
1. **Component Rendering** (10 tests)
2. **Initial State** (10 tests)
3. **Sub-Component Integration** (10 tests)
4. **Upvote Functionality** (15 tests)
5. **Downvote Functionality** (15 tests)
6. **Vote Interactions** (10 tests)
7. **Comments Display** (12 tests)
8. **Add Comment** (10 tests)
9. **Delete Comment** (8 tests)
10. **Post Editing** (10 tests)
11. **Poll Submission** (6 tests)
12. **Button Labels** (8 tests)
13. **Props Handling** (8 tests)
14. **useEffect Behavior** (12 tests)
15. **Error Handling** (10 tests)

**Total Planned Tests**: ~144

## Detailed Test Cases

### 1. Component Rendering (10 tests)

#### 1.1 Basic Rendering
- [ ] Should render without crashing
- [ ] Should render post wrapper
- [ ] Should render with border when showBorder is true
- [ ] Should render without border when showBorder is false
- [ ] Should render horizontal rule when no border

#### 1.2 Sub-Component Rendering
- [ ] Should render PrimeCommunityObjectHeader
- [ ] Should render PrimeCommunityObjectBody
- [ ] Should render PrimeCommunityObjectActions
- [ ] Should render PrimeCommunityObjectInput
- [ ] Should not render PrimeCommunityComments initially

### 2. Initial State (10 tests)

#### 2.1 Vote State Initialization
- [ ] Should initialize upvote status from post.myVoteStatus
- [ ] Should initialize upvote count from post.upVote
- [ ] Should initialize downvote status from post.myVoteStatus
- [ ] Should initialize downvote count from post.downVote
- [ ] Should default myVoteStatus to empty string if missing

#### 2.2 Comment State Initialization
- [ ] Should initialize comment count from post.commentCount
- [ ] Should initialize showComments as false
- [ ] Should initialize button label as "Show Comments"
- [ ] Should initialize post description from post.richText
- [ ] Should handle missing post.resource gracefully

### 3. Sub-Component Integration (10 tests)

#### 3.1 Props Passing
- [ ] Should pass correct props to ObjectHeader
- [ ] Should pass correct props to ObjectBody
- [ ] Should pass correct props to ObjectActions
- [ ] Should pass correct props to ObjectInput
- [ ] Should pass correct props to Comments when shown

#### 3.2 Handler Passing
- [ ] Should pass updatePostHandler to ObjectHeader
- [ ] Should pass submitPoll to ObjectBody
- [ ] Should pass viewButtonClickHandler to ObjectActions
- [ ] Should pass vote handlers to ObjectActions
- [ ] Should pass saveCommentHandler to ObjectInput

### 4. Upvote Functionality (15 tests)

#### 4.1 Initial Upvote State
- [ ] Should show upvoted state when myVoteStatus is 'upVote'
- [ ] Should not show upvoted state when myVoteStatus is empty
- [ ] Should display correct upvote count

#### 4.2 Upvote Action
- [ ] Should call votePost when not upvoted
- [ ] Should call deletePostVote when already upvoted
- [ ] Should increment upvote count after upvoting
- [ ] Should decrement upvote count after removing upvote
- [ ] Should toggle myUpVoteStatus on click

#### 4.3 Upvote with Downvote Interaction
- [ ] Should remove downvote when upvoting (if downvoted)
- [ ] Should update both vote counts correctly
- [ ] Should call correct hook methods in sequence
- [ ] Should not call deletePostVote if not upvoted
- [ ] Should skip first useEffect run for upvote

#### 4.4 Upvote Edge Cases
- [ ] Should handle rapid upvote clicks
- [ ] Should handle missing upVote property in post
- [ ] Should handle zero upvote count

### 5. Downvote Functionality (15 tests)

#### 5.1 Initial Downvote State
- [ ] Should show downvoted state when myVoteStatus is 'downVote'
- [ ] Should not show downvoted state when myVoteStatus is empty
- [ ] Should display correct downvote count

#### 5.2 Downvote Action
- [ ] Should call votePost when not downvoted
- [ ] Should call deletePostVote when already downvoted
- [ ] Should increment downvote count after downvoting
- [ ] Should decrement downvote count after removing downvote
- [ ] Should toggle myDownVoteStatus on click

#### 5.3 Downvote with Upvote Interaction
- [ ] Should remove upvote when downvoting (if upvoted)
- [ ] Should update both vote counts correctly
- [ ] Should call correct hook methods in sequence
- [ ] Should not call deletePostVote if not downvoted
- [ ] Should skip first useEffect run for downvote

#### 5.4 Downvote Edge Cases
- [ ] Should handle rapid downvote clicks
- [ ] Should handle missing downVote property in post
- [ ] Should handle zero downvote count

### 6. Vote Interactions (10 tests)

#### 6.1 Mutual Exclusivity
- [ ] Upvoting should cancel existing downvote
- [ ] Downvoting should cancel existing upvote
- [ ] Cannot be both upvoted and downvoted simultaneously
- [ ] Vote counts update correctly during switches

#### 6.2 Hook Integration
- [ ] Should pass correct post.id to votePost
- [ ] Should pass correct vote type (UP/DOWN) to votePost
- [ ] Should pass correct post.id to deletePostVote
- [ ] Should pass correct vote type (UP/DOWN) to deletePostVote
- [ ] Should use UP and DOWN constants
- [ ] Should handle hook call failures gracefully

### 7. Comments Display (12 tests)

#### 7.1 Show/Hide Toggle
- [ ] Should show comments when button clicked and count > 0
- [ ] Should hide comments when button clicked and showing
- [ ] Should not show comments if commentCount is 0
- [ ] Should toggle showComments state
- [ ] Should update button label on toggle

#### 7.2 Button Label
- [ ] Should display "Show Comments" initially
- [ ] Should display "Hide Comments" when showing
- [ ] Should revert to "Show Comments" when hiding
- [ ] Should use formatMessage for labels
- [ ] Should use correct message IDs

#### 7.3 Comments Section
- [ ] Should render PrimeCommunityComments when showing
- [ ] Should not render PrimeCommunityComments when hidden
- [ ] Should call fetchComments when showing comments

### 8. Add Comment (10 tests)

#### 8.1 Comment Submission
- [ ] Should call addComment hook with post.id and value
- [ ] Should increment commentCount after adding
- [ ] Should call fetchComments after adding
- [ ] Should show comments section after adding
- [ ] Should pass correct value to addComment

#### 8.2 State Updates
- [ ] Should update button label to "Hide Comments"
- [ ] Should set showComments to true
- [ ] Should handle addComment async operation
- [ ] Should handle addComment failure gracefully
- [ ] Should maintain comment count accuracy

### 9. Delete Comment (8 tests)

#### 9.1 Comment Deletion
- [ ] Should decrement commentCount when comment deleted
- [ ] Should call deleteCommentHandler correctly
- [ ] Should update state after deletion

#### 9.2 Zero Comments Handling
- [ ] Should hide comments section when count reaches 0
- [ ] Should change button label to "Show Comments" at 0
- [ ] Should set showComments to false at 0
- [ ] Should handle negative comment counts (edge case)
- [ ] Should react to commentCount useEffect dependency

### 10. Post Editing (10 tests)

#### 10.1 Edit Handler
- [ ] Should call patchPost with correct parameters
- [ ] Should pass post.id to patchPost
- [ ] Should pass all required params (input, postingType, resource, etc.)
- [ ] Should show confirmation dialog after editing
- [ ] Should handle async patchPost operation

#### 10.2 Confirmation Dialog
- [ ] Should call almConfirmationAlert after edit
- [ ] Should use correct dialog messages
- [ ] Should update postDescription after confirmation
- [ ] Should pass correct callback to dialog
- [ ] Should handle dialog dismissal

### 11. Poll Submission (6 tests)

#### 11.1 Poll Voting
- [ ] Should call submitPollVote with post.id and optionId
- [ ] Should pass correct optionId to hook
- [ ] Should handle poll submission from ObjectBody
- [ ] Should work with inline arrow function
- [ ] Should handle submitPollVote failure
- [ ] Should not break if submitPollVote is missing

### 12. Button Labels (8 tests)

#### 12.1 Label Management
- [ ] Should initialize with "Show Comments"
- [ ] Should change to "Hide Comments" when showing
- [ ] Should revert to "Show Comments" when hiding
- [ ] Should use formatMessage for both labels
- [ ] Should use correct message IDs
- [ ] Should maintain label consistency with state
- [ ] Should update label in useEffect when count is 0
- [ ] Should handle missing formatMessage gracefully

### 13. Props Handling (8 tests)

#### 13.1 Post Prop
- [ ] Should require post prop
- [ ] Should handle post with all properties
- [ ] Should handle post with minimal properties
- [ ] Should handle missing optional properties
- [ ] Should use post.id throughout component

#### 13.2 showBorder Prop
- [ ] Should apply border class when showBorder is true
- [ ] Should not apply border class when showBorder is false
- [ ] Should render hr when showBorder is false
- [ ] Should not render hr when showBorder is true

### 14. useEffect Behavior (12 tests)

#### 14.1 Upvote useEffect
- [ ] Should skip on first run
- [ ] Should increment count when upvote status becomes true
- [ ] Should decrement count when upvote status becomes false
- [ ] Should depend on myUpVoteStatus

#### 14.2 Downvote useEffect
- [ ] Should skip on first run
- [ ] Should increment count when downvote status becomes true
- [ ] Should decrement count when downvote status becomes false
- [ ] Should depend on myDownVoteStatus

#### 14.3 Comment Count useEffect
- [ ] Should run when commentCount changes
- [ ] Should run when showCommentsLabel changes
- [ ] Should hide comments when count is 0
- [ ] Should update button label when count is 0

### 15. Error Handling (10 tests)

#### 15.1 Hook Failures
- [ ] Should handle votePost failure
- [ ] Should handle deletePostVote failure
- [ ] Should handle addComment failure
- [ ] Should handle patchPost failure
- [ ] Should handle submitPollVote failure
- [ ] Should handle fetchComments failure

#### 15.2 Edge Cases
- [ ] Should handle missing post.myVoteStatus
- [ ] Should handle undefined hook return values
- [ ] Should handle rapid state changes
- [ ] Should handle component unmount during async operations

## Mock Requirements

### Mocks Needed
1. **Sub-Components**: Mock all 5 sub-components
2. **usePost Hook**: Mock all returned functions
3. **useComments Hook**: Mock fetchComments
4. **useConfirmationAlert Hook**: Mock alert function
5. **useIntl Hook**: Mock formatMessage
6. **Constants**: Import UP, DOWN, UPVOTE, DOWNVOTE, POST

### Mock Structure
```typescript
// Sub-component mocks
jest.mock('../../../components/Community/PrimeCommunityObjectHeader', () => ({
  PrimeCommunityObjectHeader: ({ updateObjectHandler }: any) => (
    <div data-testid="object-header" onClick={() => updateObjectHandler?.('updated', 'type', null, false, null)} />
  ),
}));

// Hook mocks
const mockVotePost = jest.fn();
const mockDeletePostVote = jest.fn();
const mockAddComment = jest.fn();
const mockPatchPost = jest.fn();
const mockSubmitPollVote = jest.fn();
const mockFetchComments = jest.fn();
const mockAlmConfirmationAlert = jest.fn();

jest.mock('../../../hooks/community', () => ({
  usePost: () => ({
    votePost: mockVotePost,
    deletePostVote: mockDeletePostVote,
    addComment: mockAddComment,
    patchPost: mockPatchPost,
    submitPollVote: mockSubmitPollVote,
  }),
  useComments: () => ({
    fetchComments: mockFetchComments,
  }),
}));

// Test data
const mockPost = {
  id: 'post123',
  richText: 'Test post content',
  myVoteStatus: '',
  upVote: 10,
  downVote: 5,
  commentCount: 3,
};
```

## Coverage Goals

### Code Coverage Targets
- **Line Coverage**: > 95%
- **Branch Coverage**: > 90%
- **Function Coverage**: 100%
- **Statement Coverage**: > 95%

### Critical Paths to Cover
1. ✅ Initial render with all sub-components
2. ✅ Upvote flow (vote, delete vote)
3. ✅ Downvote flow (vote, delete vote)
4. ✅ Vote switching (upvote ↔ downvote)
5. ✅ Show/hide comments
6. ✅ Add comment flow
7. ✅ Delete comment flow
8. ✅ Post editing flow
9. ✅ Poll submission
10. ✅ All useEffect triggers

## Testing Tools

### Libraries
- **@testing-library/react**: Component rendering and queries
- **@testing-library/jest-dom**: DOM matchers
- **jest**: Test runner and assertions
- **react-intl**: IntlProvider for tests

### Test Utilities
```typescript
const renderComponent = (props = {}) => {
  const defaultProps = {
    post: mockPost,
    showBorder: false,
  };
  return render(
    <IntlProvider locale="en" messages={defaultMessages}>
      <PrimeCommunityPost {...defaultProps} {...props} />
    </IntlProvider>
  );
};
```

## Success Criteria

### Test Suite Must:
- ✅ All tests passing (>95% pass rate)
- ✅ Cover all component functionality
- ✅ Test user interaction flows
- ✅ Verify state management
- ✅ Test hook integrations
- ✅ Validate sub-component integration
- ✅ Test edge cases and error scenarios
- ✅ Run quickly (< 5 seconds)
- ✅ Be maintainable and well-documented

### Component Must:
- ✅ Render all sub-components correctly
- ✅ Handle voting properly
- ✅ Manage comments state accurately
- ✅ Integrate with hooks correctly
- ✅ Update UI based on state changes
- ✅ Handle edge cases gracefully

## Known Challenges

### Implementation Challenges
1. **Sub-Component Mocking**: Need to mock 5 different components
   - Solution: Create simple functional mocks with test IDs
   
2. **Hook Mocking**: Multiple custom hooks to mock
   - Solution: Mock at module level with jest.fn() returns
   
3. **useEffect Testing**: Multiple effects with firstRun refs
   - Solution: Test state changes after interactions
   
4. **Async Operations**: addComment, patchPost are async
   - Solution: Use async/await and Promise.resolve()
   
5. **State Dependencies**: Complex state interactions between votes
   - Solution: Test each interaction scenario separately

### Testing Challenges
1. **Integration Testing**: Component relies on many sub-components
2. **firstRun Refs**: useEffect skips first run, need to test updates
3. **Async State Updates**: Multiple state updates in handlers
4. **Hook Call Verification**: Verifying correct hook method calls

## Test Organization

### File Structure
```
tests/
├── test-plans/
│   └── community/
│       └── PRIME_COMMUNITY_POST_TEST_PLAN.md (this file)
└── components/
    └── Community/
        ├── PrimeCommunityPost.spec.tsx
        └── PRIMECOMMUNITYPOST_TEST_SUMMARY.md
```

### Test Structure
```typescript
describe('PrimeCommunityPost', () => {
  describe('Component Rendering', () => { ... });
  describe('Initial State', () => { ... });
  describe('Sub-Component Integration', () => { ... });
  describe('Upvote Functionality', () => { ... });
  describe('Downvote Functionality', () => { ... });
  describe('Vote Interactions', () => { ... });
  describe('Comments Display', () => { ... });
  describe('Add Comment', () => { ... });
  describe('Delete Comment', () => { ... });
  describe('Post Editing', () => { ... });
  describe('Poll Submission', () => { ... });
  describe('Button Labels', () => { ... });
  describe('Props Handling', () => { ... });
  describe('useEffect Behavior', () => { ... });
  describe('Error Handling', () => { ... });
});
```

## Notes

- Component is a container/orchestrator for sub-components
- Heavy reliance on custom hooks for business logic
- Multiple interdependent state variables (votes, comments)
- Uses firstRun refs to skip initial useEffect execution
- Inline arrow functions for some handlers (poll submission)
- Confirmation dialog flow for post editing
- Constants (UP, DOWN, UPVOTE, DOWNVOTE, POST) used throughout

---

**Test Plan Version**: 1.0  
**Created**: January 7, 2026  
**Component**: PrimeCommunityPost  
**Estimated Test Count**: ~144 tests  
**Estimated Coverage**: 95%+

