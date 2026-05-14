# PrimeCommunityPoll Component - Test Plan

## Component Overview

**Component**: `PrimeCommunityPoll`  
**Location**: `src/almLib/components/Community/PrimeCommunityPoll/PrimeCommunityPoll.tsx`  
**Purpose**: Displays interactive poll with options, handles voting, and shows poll statistics

### Component Functionality
- Renders poll options as radio buttons
- Allows users to select and submit their choice
- Displays poll statistics (percentages and vote counts) after voting
- Handles already voted state and disables options
- Uses DOM manipulation for progress bar visualization
- Integrates with internationalization (i18n) for labels

### Props Interface
```typescript
interface PrimeCommunityPollProps {
  post: {
    id: string;
    otherData: string; // JSON string of poll options
    myPoll?: {
      optionId: string | number;
    };
    pollStats?: string; // JSON string of vote statistics
  };
  submitPoll?: (choiceIndex: string) => void;
}
```

### Key State Variables
- `choiceSelectedIndex`: Index of selected option (1-based)
- `choiceSelected`: Text of selected option
- `alreadyVoted`: Boolean indicating if user has voted
- `pollStats`: Array of vote counts per option
- `totalVotes`: Total number of votes (-1 initially)

### Key Functions
1. `selectPollOption(value, index)`: Sets selected choice
2. `submitPoll()`: Submits vote and updates statistics
3. `updatePostStats()`: Updates local poll statistics after submission
4. `postSubmitActions(id?)`: Marks as voted and selects option if ID provided
5. `pollSubmitCss()`: Applies visual styling to progress bars via DOM manipulation
6. `getVotePercent(value)`: Calculates and formats percentage display

## Testing Strategy

### Approach
- **Unit Testing**: Test component in isolation with mocked dependencies
- **State Testing**: Verify state changes and their effects on rendering
- **Integration Testing**: Test user interactions and full voting flow
- **Edge Case Testing**: Handle invalid data, missing props, boundary conditions
- **DOM Manipulation Testing**: Verify progress bar styling is applied correctly

### Test Categories
1. **Component Rendering** (10 tests)
2. **Initial State** (8 tests)
3. **Poll Options Display** (12 tests)
4. **User Interaction - Selection** (10 tests)
5. **User Interaction - Submission** (12 tests)
6. **Already Voted State** (15 tests)
7. **Poll Statistics Display** (15 tests)
8. **Progress Bar Visualization** (10 tests)
9. **Percentage Calculations** (12 tests)
10. **Props Handling** (10 tests)
11. **useEffect Behavior** (12 tests)
12. **Internationalization** (8 tests)
13. **Edge Cases and Error Handling** (15 tests)
14. **Accessibility** (6 tests)

**Total Planned Tests**: ~145

## Detailed Test Cases

### 1. Component Rendering (10 tests)

#### 1.1 Basic Rendering
- [ ] Should render without crashing
- [ ] Should render poll options container
- [ ] Should render correct number of poll options
- [ ] Should render radio buttons for each option
- [ ] Should render option text correctly

#### 1.2 Conditional Rendering
- [ ] Should not render submit button initially
- [ ] Should not render "submitted" message initially
- [ ] Should render submit button when option selected
- [ ] Should render "submitted" message when voted
- [ ] Should render horizontal rules appropriately

### 2. Initial State (8 tests)

#### 2.1 State Initialization
- [ ] Should initialize choiceSelectedIndex as empty string
- [ ] Should initialize choiceSelected as empty string
- [ ] Should initialize alreadyVoted as false when no myPoll
- [ ] Should initialize alreadyVoted as true when myPoll exists
- [ ] Should initialize pollStats as empty array
- [ ] Should initialize totalVotes as -1
- [ ] Should parse otherData JSON correctly
- [ ] Should handle missing myPoll gracefully

### 3. Poll Options Display (12 tests)

#### 3.1 Option Rendering
- [ ] Should render all poll options from otherData
- [ ] Should render radio inputs with correct IDs
- [ ] Should render radio inputs with correct names
- [ ] Should render radio inputs with correct values
- [ ] Should render option text in correct container
- [ ] Should use correct CSS classes for containers

#### 3.2 Option State
- [ ] Should enable radio buttons when not voted
- [ ] Should disable radio buttons when already voted
- [ ] Should render progress bar containers when voted
- [ ] Should not render progress bar containers when not voted
- [ ] Should use correct keys for mapped options
- [ ] Should maintain option order from otherData

### 4. User Interaction - Selection (10 tests)

#### 4.1 Selecting Options
- [ ] Should call selectPollOption on radio button click
- [ ] Should update choiceSelected state on selection
- [ ] Should update choiceSelectedIndex state on selection
- [ ] Should show submit button after selection
- [ ] Should allow changing selection before submission
- [ ] Should pass correct value to selectPollOption
- [ ] Should pass correct index to selectPollOption (1-based)
- [ ] Should handle multiple option selections correctly
- [ ] Should maintain selected state across renders
- [ ] Should not trigger selection when disabled

### 5. User Interaction - Submission (12 tests)

#### 5.1 Submit Button
- [ ] Should display submit button when choice selected
- [ ] Should call submitPoll on button click
- [ ] Should call props.submitPoll with correct index
- [ ] Should update poll statistics after submission
- [ ] Should mark as already voted after submission
- [ ] Should hide submit button after submission
- [ ] Should show "submitted" message after submission

#### 5.2 Submit Validation
- [ ] Should not render submit button if no choice selected
- [ ] Should handle missing submitPoll prop gracefully
- [ ] Should check typeof submitPoll before calling
- [ ] Should not break if submitPoll throws error
- [ ] Should complete all post-submit actions in order

### 6. Already Voted State (15 tests)

#### 6.1 Voted State Display
- [ ] Should disable all radio buttons when voted
- [ ] Should show "submitted" message when voted
- [ ] Should not show submit button when voted
- [ ] Should show poll statistics when voted
- [ ] Should show progress bars when voted
- [ ] Should render vote percentages when voted
- [ ] Should render vote counts when voted

#### 6.2 Voted State Initialization
- [ ] Should detect already voted from myPoll prop
- [ ] Should call postSubmitActions with optionId on mount
- [ ] Should set alreadyVoted to true if myPoll exists
- [ ] Should pre-select voted option on mount
- [ ] Should load user's previous choice correctly
- [ ] Should handle myPoll with missing optionId
- [ ] Should handle myPoll as undefined
- [ ] Should parse myPoll optionId correctly (string/number)

### 7. Poll Statistics Display (15 tests)

#### 7.1 Statistics Parsing
- [ ] Should parse pollStats JSON from props
- [ ] Should handle pollStats as JSON string
- [ ] Should convert 1-based keys to 0-based array indices
- [ ] Should calculate total votes correctly
- [ ] Should set pollStats state from parsed data
- [ ] Should handle missing pollStats prop
- [ ] Should handle invalid JSON in pollStats
- [ ] Should handle empty pollStats

#### 7.2 Statistics Display
- [ ] Should display vote count for each option
- [ ] Should display percentage for each option
- [ ] Should display "vote" label using formatMessage
- [ ] Should show statistics only when voted
- [ ] Should show statistics only for options with votes
- [ ] Should format percentages correctly (up to 2 decimals)
- [ ] Should handle zero votes scenario

### 8. Progress Bar Visualization (10 tests)

#### 8.1 Progress Bar Rendering
- [ ] Should render progress bar fill elements when voted
- [ ] Should call pollSubmitCss after voting
- [ ] Should apply border-bottom style to progress bars
- [ ] Should set width based on vote percentage
- [ ] Should use correct element IDs for progress bars
- [ ] Should handle missing DOM elements gracefully

#### 8.2 Progress Bar Styling
- [ ] Should apply solid #306EB5 4px border
- [ ] Should calculate width percentage correctly
- [ ] Should handle pollStats with zero values
- [ ] Should style only options with votes

### 9. Percentage Calculations (12 tests)

#### 9.1 getVotePercent Function
- [ ] Should calculate percentage correctly
- [ ] Should return value up to 2 decimal places
- [ ] Should handle integer percentages
- [ ] Should handle decimal percentages
- [ ] Should remove trailing .00 from whole numbers
- [ ] Should keep decimal places for fractional values
- [ ] Should handle percentage of 0
- [ ] Should handle percentage of 100
- [ ] Should handle single vote scenarios
- [ ] Should round correctly for multiple decimals
- [ ] Should handle division with totalVotes as denominator
- [ ] Should use regex to match decimal pattern

### 10. Props Handling (10 tests)

#### 10.1 Post Prop
- [ ] Should require post prop with id
- [ ] Should parse post.otherData as JSON
- [ ] Should handle post.myPoll as optional
- [ ] Should handle post.pollStats as optional
- [ ] Should use post.id for generating element IDs
- [ ] Should handle missing post.id gracefully

#### 10.2 submitPoll Prop
- [ ] Should handle missing submitPoll prop
- [ ] Should check typeof before calling submitPoll
- [ ] Should pass choiceSelectedIndex to submitPoll
- [ ] Should not break if submitPoll is not a function

### 11. useEffect Behavior (12 tests)

#### 11.1 First useEffect (Initial Load)
- [ ] Should run on mount
- [ ] Should check for myPoll.optionId
- [ ] Should call postSubmitActions if optionId exists
- [ ] Should parse pollStats JSON if provided
- [ ] Should set pollStats state from parsed data
- [ ] Should calculate total votes from pollStats
- [ ] Should convert 1-based to 0-based indices
- [ ] Should depend on props.post

#### 11.2 Second useEffect (Voted State)
- [ ] Should run when alreadyVoted changes
- [ ] Should call pollSubmitCss when voted
- [ ] Should not call pollSubmitCss when not voted
- [ ] Should depend on alreadyVoted

### 12. Internationalization (8 tests)

#### 12.1 Message Formatting
- [ ] Should use formatMessage for vote label
- [ ] Should use formatMessage for submit button
- [ ] Should use formatMessage for submitted message
- [ ] Should use correct message IDs
- [ ] Should use correct default messages
- [ ] Should render translated vote label
- [ ] Should render translated submit button text
- [ ] Should render translated submitted message

### 13. Edge Cases and Error Handling (15 tests)

#### 13.1 Data Edge Cases
- [ ] Should handle empty otherData JSON
- [ ] Should handle malformed otherData JSON
- [ ] Should handle otherData with single option
- [ ] Should handle otherData with many options (10+)
- [ ] Should handle pollStats with missing keys
- [ ] Should handle pollStats with non-numeric values
- [ ] Should handle totalVotes of 0
- [ ] Should handle very large vote counts (1000+)
- [ ] Should handle very small percentages (< 1%)

#### 13.2 State Edge Cases
- [ ] Should handle rapid option selection changes
- [ ] Should handle submit before state updates complete
- [ ] Should handle missing DOM elements in pollSubmitCss
- [ ] Should handle getElementById returning null
- [ ] Should handle updatePostStats with empty pollStats
- [ ] Should handle postSubmitActions with invalid ID

### 14. Accessibility (6 tests)

#### 14.1 ARIA and Semantics
- [ ] Should use radio input type for options
- [ ] Should group radio buttons with same name
- [ ] Should disable inputs when already voted
- [ ] Should use semantic button element for submit
- [ ] Should provide accessible option text
- [ ] Should maintain focus management during interactions

## Mock Requirements

### Mocks Needed
1. **useIntl**: Mock formatMessage function
2. **CSS Modules**: Mock styles import
3. **DOM Methods**: Mock getElementById for pollSubmitCss tests
4. **JSON.parse**: May need to handle in tests
5. **submitPoll prop**: Mock callback function

### Mock Structure
```typescript
// useIntl mock
jest.mock('react-intl', () => ({
  ...jest.requireActual('react-intl'),
  useIntl: () => ({
    formatMessage: ({ id, defaultMessage }) => defaultMessage || id,
  }),
}));

// CSS modules mock (handled by setupTests.ts)
// styles object returns class names

// Mock data
const mockPost = {
  id: 'post123',
  otherData: JSON.stringify([
    { text: 'Option 1' },
    { text: 'Option 2' },
    { text: 'Option 3' }
  ]),
  myPoll: undefined,
  pollStats: undefined,
};

const mockSubmitPoll = jest.fn();
```

## Coverage Goals

### Code Coverage Targets
- **Line Coverage**: > 95%
- **Branch Coverage**: > 90%
- **Function Coverage**: 100%
- **Statement Coverage**: > 95%

### Critical Paths to Cover
1. ✅ Initial render without vote
2. ✅ User selects option
3. ✅ User submits vote
4. ✅ Poll statistics update
5. ✅ Progress bars display
6. ✅ Already voted state on mount
7. ✅ Percentage calculations
8. ✅ DOM manipulation for styling
9. ✅ Edge cases and error handling

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
    submitPoll: mockSubmitPoll,
  };
  return render(
    <IntlProvider locale="en" messages={defaultMessages}>
      <PrimeCommunityPoll {...defaultProps} {...props} />
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
- ✅ Test edge cases and error scenarios
- ✅ Validate accessibility features
- ✅ Verify internationalization
- ✅ Test DOM manipulation effects
- ✅ Run quickly (< 5 seconds)
- ✅ Be maintainable and well-documented

### Component Must:
- ✅ Render all poll options correctly
- ✅ Handle user selection properly
- ✅ Submit votes successfully
- ✅ Display statistics accurately
- ✅ Show progress bars correctly
- ✅ Handle already voted state
- ✅ Work with internationalization
- ✅ Be accessible to all users

## Known Challenges

### Implementation Challenges
1. **DOM Manipulation**: Component uses `document.getElementById` and direct style manipulation
   - Solution: Mock DOM methods or use actual DOM with jsdom
   
2. **JSON Parsing**: Props contain JSON strings that need parsing
   - Solution: Provide valid JSON in test data
   
3. **1-Based Indexing**: Component uses 1-based indices for options
   - Solution: Carefully track index conversion in tests
   
4. **useEffect Dependencies**: Multiple effects with different dependencies
   - Solution: Use `await Promise.resolve()` to allow effects to complete
   
5. **State Updates**: Multiple state updates in rapid succession
   - Solution: Test state changes after async resolution

### Testing Challenges
1. **DOM Element IDs**: Tests need to match ID generation pattern
2. **CSS Styles**: Testing applied styles requires DOM queries
3. **Percentage Formatting**: Regex-based formatting needs careful testing
4. **Progress Bar Widths**: Testing calculated widths requires DOM access

## Test Organization

### File Structure
```
tests/
├── test-plans/
│   └── community/
│       └── PRIME_COMMUNITY_POLL_TEST_PLAN.md (this file)
└── components/
    └── Community/
        ├── PrimeCommunityPoll.spec.tsx
        └── PRIMECOMMUNITYPOLL_TEST_SUMMARY.md
```

### Test Structure
```typescript
describe('PrimeCommunityPoll', () => {
  describe('Component Rendering', () => { ... });
  describe('Initial State', () => { ... });
  describe('Poll Options Display', () => { ... });
  describe('User Interaction - Selection', () => { ... });
  describe('User Interaction - Submission', () => { ... });
  describe('Already Voted State', () => { ... });
  describe('Poll Statistics Display', () => { ... });
  describe('Progress Bar Visualization', () => { ... });
  describe('Percentage Calculations', () => { ... });
  describe('Props Handling', () => { ... });
  describe('useEffect Behavior', () => { ... });
  describe('Internationalization', () => { ... });
  describe('Edge Cases and Error Handling', () => { ... });
  describe('Accessibility', () => { ... });
});
```

## Notes

- Component uses direct DOM manipulation which may require special testing approach
- Progress bar styling is applied via direct style property updates
- Component uses 1-based indexing for options (index + 1)
- JSON parsing is done inline, error handling should be tested
- State updates occur in specific order during submission flow
- useEffect cleanup is not explicitly implemented (may not be needed)

---

**Test Plan Version**: 1.0  
**Created**: January 7, 2026  
**Component**: PrimeCommunityPoll  
**Estimated Test Count**: ~145 tests  
**Estimated Coverage**: 95%+

