# PrimeCommunityObjectOptions Test Plan

## Component Overview
`PrimeCommunityObjectOptions` is a React component that renders a dropdown menu with contextual actions for community objects (posts, comments, replies). The available options vary based on user ownership, post type (poll/question), and poll voting status.

**Component Location**: `src/almLib/components/Community/PrimeCommunityObjectOptions/PrimeCommunityObjectOptions.tsx`

## Component Responsibilities
1. Fetch and store current user data
2. Conditionally render options based on user permissions and post type
3. Handle click-outside behavior to close the options menu
4. Provide handlers for: Edit, Delete, Report, Mark/Unmark as Right Answer
5. Determine visibility of options based on ownership and post type

## Props Interface
```typescript
interface PrimeCommunityObjectOptionsProps {
  object: {
    id: string;
    createdBy: {
      id: string;
    };
    myPoll?: object;
  };
  parentPost?: {
    postingType: string;
  };
  answerCommentId?: string;
  toggleOptions?: () => void;
  deleteHandler?: () => void;
  reportAbuseHandler?: () => void;
  editHandler?: () => void;
  updateRightAnswerHandler?: (value: boolean) => void;
}
```

## Test Categories

### 1. Component Rendering (8 tests)
- [ ] Should render the options container
- [ ] Should render with correct CSS class
- [ ] Should use ref for click-outside detection
- [ ] Should display all relevant options based on props
- [ ] Should render separator between option groups
- [ ] Should render options with correct CSS classes
- [ ] Should render with IntlProvider messages
- [ ] Should handle missing props gracefully

### 2. User Data Loading (6 tests)
- [ ] Should call getALMUser on mount
- [ ] Should set user state after successful fetch
- [ ] Should handle empty user response
- [ ] Should handle getALMUser rejection
- [ ] Should set empty object as default user
- [ ] Should only fetch user once on mount

### 3. Click Outside Behavior (8 tests)
- [ ] Should register click event listener on mount
- [ ] Should call toggleOptions when clicking outside
- [ ] Should not call toggleOptions when clicking inside
- [ ] Should clean up event listener on unmount
- [ ] Should handle missing toggleOptions prop
- [ ] Should use capture phase for event listener
- [ ] Should check ref.current exists before handling
- [ ] Should handle multiple mount/unmount cycles

### 4. Edit Option Display (10 tests)
- [ ] Should show Edit when user is post owner
- [ ] Should hide Edit when user is not post owner
- [ ] Should hide Edit when poll vote submitted
- [ ] Should show Edit when user is owner and no poll vote
- [ ] Should call editHandler on Edit click
- [ ] Should render Edit with correct message ID
- [ ] Should render Edit with correct CSS class
- [ ] Should handle missing editHandler prop
- [ ] Should handle editHandler that throws
- [ ] Should check myPoll keys length correctly

### 5. Poll Options Display (12 tests)
- [ ] Should show poll options when conditions met
- [ ] Should hide poll options when user not owner
- [ ] Should hide poll options when no parentPost
- [ ] Should hide poll options when postingType not QUESTION
- [ ] Should hide poll options when answerCommentId doesn't match
- [ ] Should show "Mark as Right answer" option
- [ ] Should show "Unmark as Right answer" option
- [ ] Should call updateRightAnswerHandler with true
- [ ] Should call updateRightAnswerHandler with false
- [ ] Should render poll options with correct message IDs
- [ ] Should render poll options with correct CSS class
- [ ] Should handle missing updateRightAnswerHandler

### 6. Delete Option Display (10 tests)
- [ ] Should show Delete when user is post owner
- [ ] Should hide Delete when user is not post owner
- [ ] Should call deleteHandler on Delete click
- [ ] Should render Delete with correct message ID
- [ ] Should render Delete with correct CSS class (critical)
- [ ] Should handle missing deleteHandler prop
- [ ] Should handle deleteHandler that throws
- [ ] Should check user.id correctly
- [ ] Should show Delete even with poll vote submitted
- [ ] Should show Delete for all post types

### 7. Report Option Display (8 tests)
- [ ] Should always show Report option
- [ ] Should show Report for non-owners
- [ ] Should show Report for owners
- [ ] Should call reportAbuseHandler on Report click
- [ ] Should render Report with correct message ID
- [ ] Should render Report with correct CSS class (critical)
- [ ] Should handle missing reportAbuseHandler prop
- [ ] Should handle reportAbuseHandler that throws

### 8. Separator Rendering (6 tests)
- [ ] Should show separator when Edit shown
- [ ] Should show separator when poll options shown
- [ ] Should show separator when both Edit and poll options shown
- [ ] Should hide separator when neither Edit nor poll options shown
- [ ] Should render separator with correct CSS class
- [ ] Should render separator in correct position

### 9. Owner Detection Logic (8 tests)
- [ ] Should correctly identify post owner
- [ ] Should correctly identify non-owner
- [ ] Should handle missing createdBy
- [ ] Should handle missing createdBy.id
- [ ] Should handle missing user
- [ ] Should handle missing user.id
- [ ] Should use strict equality for ID comparison
- [ ] Should handle string vs number ID types

### 10. Poll Type Detection Logic (10 tests)
- [ ] Should correctly detect poll-type post
- [ ] Should return false when no parentPost
- [ ] Should return false when postingType not QUESTION
- [ ] Should return false when answerCommentId doesn't match
- [ ] Should return true when all conditions met
- [ ] Should handle missing parentPost.postingType
- [ ] Should handle undefined answerCommentId
- [ ] Should handle undefined object.id
- [ ] Should use QUESTION constant correctly
- [ ] Should use strict equality for ID comparison

### 11. Poll Vote Status Detection (6 tests)
- [ ] Should detect submitted poll vote
- [ ] Should detect no poll vote
- [ ] Should handle undefined myPoll
- [ ] Should handle null myPoll
- [ ] Should handle empty myPoll object
- [ ] Should handle myPoll with keys

### 12. Handler Invocations (10 tests)
- [ ] Should call handlers with correct context
- [ ] Should check handler is function before calling
- [ ] Should not throw if handler undefined
- [ ] Should pass correct value to updateRightAnswerHandler
- [ ] Should handle synchronous handlers
- [ ] Should handle async handlers
- [ ] Should handle handler errors gracefully
- [ ] Should call toggleOptions on click outside
- [ ] Should not call handlers multiple times
- [ ] Should handle handler that returns value

### 13. Internationalization (8 tests)
- [ ] Should use formatMessage for all labels
- [ ] Should render Edit message correctly
- [ ] Should render Delete message correctly
- [ ] Should render Report message correctly
- [ ] Should render "Mark as Right answer" message correctly
- [ ] Should render "Unmark as Right answer" message correctly
- [ ] Should use correct message IDs
- [ ] Should use correct default messages

### 14. CSS Classes (8 tests)
- [ ] Should apply primeObjectOptionsList class to container
- [ ] Should apply primeObjectRegularOption to Edit
- [ ] Should apply primeObjectRegularOption to poll options
- [ ] Should apply primeObjectCriticalOption to Delete
- [ ] Should apply primeObjectCriticalOption to Report
- [ ] Should apply primeSeperator to separator
- [ ] Should import styles from CSS module
- [ ] Should apply correct classes to all elements

### 15. Edge Cases and Error Handling (10 tests)
- [ ] Should handle missing object prop
- [ ] Should handle missing object.createdBy
- [ ] Should handle object with no id
- [ ] Should handle user with no id
- [ ] Should handle concurrent getALMUser calls
- [ ] Should handle getALMUser slow response
- [ ] Should handle component unmount during user fetch
- [ ] Should handle re-render with different props
- [ ] Should handle null ref
- [ ] Should handle event with no target

## Testing Approach

### Mocking Strategy
1. **getALMUser**: Mock to return test user data
2. **useIntl**: Mock formatMessage to return message IDs
3. **QUESTION constant**: Import from constants
4. **Event listeners**: Verify addEventListener/removeEventListener calls

### Test Data Patterns
```typescript
const mockUser = {
  id: 'user123',
  name: 'Test User',
};

const mockObject = {
  id: 'post123',
  createdBy: { id: 'user123' },
  myPoll: {},
};

const mockParentPost = {
  postingType: 'QUESTION',
};

const defaultProps = {
  object: mockObject,
  parentPost: mockParentPost,
  answerCommentId: 'post123',
  toggleOptions: jest.fn(),
  deleteHandler: jest.fn(),
  reportAbuseHandler: jest.fn(),
  editHandler: jest.fn(),
  updateRightAnswerHandler: jest.fn(),
};
```

### Integration Points to Test
1. **getALMUser** - User data fetching
2. **formatMessage** - Internationalization
3. **Event listeners** - Click outside behavior
4. **useEffect** - Lifecycle management

## Mock Requirements

### Required Mocks
1. `getALMUser` from `../../../utils/global`
2. `formatMessage` from `react-intl`
3. `QUESTION` from `../../../utils/constants`
4. Document event listeners (addEventListener, removeEventListener)

### Mock Implementation Examples
```typescript
jest.mock('../../../utils/global', () => ({
  getALMUser: jest.fn(),
}));

jest.mock('react-intl', () => ({
  useIntl: () => ({
    formatMessage: ({ id, defaultMessage }: any) => defaultMessage || id,
  }),
}));

const mockGetALMUser = getALMUser as jest.MockedFunction<typeof getALMUser>;
```

## Coverage Goals
- **Line Coverage**: > 95%
- **Branch Coverage**: > 90%
- **Function Coverage**: > 95%
- **Statement Coverage**: > 95%

## Known Challenges
1. **Async useEffect**: Need to handle async user fetching
2. **Event Listeners**: Need to verify cleanup on unmount
3. **Conditional Rendering**: Multiple conditions affecting option visibility
4. **Click Outside**: Testing ref-based click detection
5. **User State**: Testing before and after user data loads

## Success Criteria
- [ ] All 120+ tests passing
- [ ] Coverage goals met
- [ ] All conditional logic paths tested
- [ ] All handler invocations verified
- [ ] Event listener cleanup verified
- [ ] Edge cases covered
- [ ] No console errors or warnings
- [ ] Tests run in < 10 seconds

## Test Execution
```bash
npm test -- PrimeCommunityObjectOptions.spec.tsx
```

## Related Components
- `PrimeCommunityObjectHeader` - Uses this component
- `PrimeCommunityObjectInput` - Related community component
- `PrimeCommunityObjectBody` - Related community component

## Notes
- Component uses async user fetching in useEffect
- Click outside behavior uses ref and document event listener
- Options visibility depends on complex conditional logic
- Component always renders Report option
- Delete is only shown to post owner
- Edit is shown to owner unless poll vote submitted
- Poll options only shown for QUESTION type posts

