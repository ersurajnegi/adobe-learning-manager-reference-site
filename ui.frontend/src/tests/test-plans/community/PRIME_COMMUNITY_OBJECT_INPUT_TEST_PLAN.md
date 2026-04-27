# PrimeCommunityObjectInput Component - Test Plan

## Component Overview

The `PrimeCommunityObjectInput` component is a rich text editor for community input (posts, comments, replies) with:
- ReactQuill editor with customizable toolbar
- Character limit tracking and display
- Link preview integration
- Bad word detection and confirmation
- Primary (Send) and Secondary (Cancel) actions
- HTML content processing and validation

## Component Props Interface

```typescript
interface PrimeCommunityObjectInputProps {
  primaryActionHandler: (text: string) => Promise<void>;
  secondaryActionHandler?: (text: string) => void;
  characterLimit?: number; // Default: 1000
  defaultValue?: string;
  inputPlaceholder?: string;
  concisedToolbarOptions?: boolean;
  enablePrimaryAction?: () => void;
  disablePrimaryAction?: () => void;
}
```

## Test Categories

### 1. Basic Rendering (8 tests)
- ✓ Should render ReactQuill editor
- ✓ Should render character counter
- ✓ Should render send button when primaryActionHandler provided
- ✓ Should render cancel button when secondaryActionHandler provided
- ✓ Should not render send button without primaryActionHandler
- ✓ Should not render cancel button without secondaryActionHandler
- ✓ Should render link preview component
- ✓ Should apply correct CSS classes

### 2. ReactQuill Editor Configuration (8 tests)
- ✓ Should initialize with empty value
- ✓ Should initialize with defaultValue if provided
- ✓ Should render with placeholder text
- ✓ Should use concise toolbar when concisedToolbarOptions is true
- ✓ Should use full toolbar by default
- ✓ Should configure toolbar with correct options
- ✓ Should apply correct className
- ✓ Should pass ref correctly

### 3. Character Limit and Counter (12 tests)
- ✓ Should initialize with default limit (1000)
- ✓ Should use custom characterLimit if provided
- ✓ Should display characters remaining
- ✓ Should update counter on text input
- ✓ Should prevent input beyond character limit
- ✓ Should undo last change when limit exceeded
- ✓ Should count only text content (strip HTML)
- ✓ Should handle empty input
- ✓ Should handle whitespace-only input
- ✓ Should display "characters left" message
- ✓ Should show 0 characters remaining at limit
- ✓ Should handle very long text input

### 4. Text Input and Editing (10 tests)
- ✓ Should update userInputText on change
- ✓ Should call handleEditorTextChange on input
- ✓ Should strip HTML tags for character counting
- ✓ Should preserve HTML formatting in editor
- ✓ Should handle bold, italic, underline
- ✓ Should handle links
- ✓ Should handle lists (ordered, bullet)
- ✓ Should handle text size changes
- ✓ Should handle color changes
- ✓ Should handle empty string input

### 5. Primary Action (Send) (12 tests)
- ✓ Should call primaryActionHandler on send click
- ✓ Should pass userInputText to handler
- ✓ Should clear input after successful send
- ✓ Should reset character counter after send
- ✓ Should hide link preview after send
- ✓ Should not call handler if characterCount is 0
- ✓ Should not send empty input
- ✓ Should handle async primaryActionHandler
- ✓ Should handle primaryActionHandler errors
- ✓ Should show bad word alert on BAD_WORD_FOUND error
- ✓ Should call almConfirmationAlert for bad words
- ✓ Should render Send icon

### 6. Secondary Action (Cancel) (8 tests)
- ✓ Should call secondaryActionHandler on cancel click
- ✓ Should pass userInputText to handler
- ✓ Should clear input after cancel
- ✓ Should reset character counter after cancel
- ✓ Should hide link preview after cancel
- ✓ Should not throw if secondaryActionHandler not function
- ✓ Should render Cancel icon
- ✓ Should handle missing secondaryActionHandler

### 7. Enable/Disable Primary Action (8 tests)
- ✓ Should call enablePrimaryAction when text entered
- ✓ Should call disablePrimaryAction when text cleared
- ✓ Should call enablePrimaryAction for non-empty trimmed text
- ✓ Should call disablePrimaryAction for whitespace-only text
- ✓ Should not throw if enablePrimaryAction not provided
- ✓ Should not throw if disablePrimaryAction not provided
- ✓ Should check text count on input
- ✓ Should handle ref.current.value checks

### 8. Link Preview Integration (10 tests)
- ✓ Should show link preview when text entered
- ✓ Should hide link preview when input cleared
- ✓ Should pass currentInput to PrimeCommunityLinkPreview
- ✓ Should pass showLinkPreview to PrimeCommunityLinkPreview
- ✓ Should start with link preview hidden
- ✓ Should show link preview after first input
- ✓ Should persist link preview while typing
- ✓ Should hide on exitActions
- ✓ Should render in correct container
- ✓ Should update preview on text change

### 9. Bad Word Detection (8 tests)
- ✓ Should catch BAD_WORD_FOUND error
- ✓ Should call getAlmConfirmationBadwordParams
- ✓ Should show confirmation alert with correct params
- ✓ Should display title from params
- ✓ Should display message from params
- ✓ Should display action label from params
- ✓ Should not clear input on bad word error
- ✓ Should handle other error types

### 10. HTML Processing (8 tests)
- ✓ Should strip HTML tags for counting
- ✓ Should preserve <p> tags in content
- ✓ Should preserve <strong> tags
- ✓ Should preserve <em> tags
- ✓ Should preserve <a> tags
- ✓ Should extract text content correctly
- ✓ Should handle nested HTML
- ✓ Should handle empty HTML tags

### 11. Default Value Handling (8 tests)
- ✓ Should initialize with empty string by default
- ✓ Should initialize with defaultValue if provided
- ✓ Should process input on defaultValue change
- ✓ Should show link preview for default value
- ✓ Should update character count for default value
- ✓ Should only process default value on first run
- ✓ Should skip processing on subsequent renders
- ✓ Should handle empty defaultValue

### 12. Ref Management (6 tests)
- ✓ Should pass ref to ReactQuill
- ✓ Should access ref.current.value
- ✓ Should call getEditor() on ref
- ✓ Should call history.undo() via ref
- ✓ Should handle missing ref gracefully
- ✓ Should check ref.current existence

### 13. Toolbar Configuration (10 tests)
- ✓ Should show size options in toolbar
- ✓ Should show bold, italic, underline in toolbar
- ✓ Should show color options in concise mode
- ✓ Should show color and background in full mode
- ✓ Should show headers in full mode only
- ✓ Should show list options in toolbar
- ✓ Should show indent in full mode only
- ✓ Should show align in full mode only
- ✓ Should show link option in toolbar
- ✓ Should show clean option in toolbar

### 14. Tooltip Customization (6 tests)
- ✓ Should add click listener on mount
- ✓ Should remove click listener on unmount
- ✓ Should update tooltip placeholder
- ✓ Should handle missing tooltip element
- ✓ Should set placeholder to "Please enter a link"
- ✓ Should query for Quill tooltip input

### 15. Exit Actions (8 tests)
- ✓ Should clear userInputText
- ✓ Should reset charactersRemaining to limit
- ✓ Should hide link preview
- ✓ Should be called after primary action
- ✓ Should be called after secondary action
- ✓ Should reset all state
- ✓ Should not throw errors
- ✓ Should handle multiple calls

### 16. useEffect Hooks (8 tests)
- ✓ Should run defaultValue effect on mount
- ✓ Should process input if defaultValue not empty
- ✓ Should skip processing if defaultValue empty
- ✓ Should only run once with firstRun flag
- ✓ Should setup tooltip click listener
- ✓ Should cleanup tooltip listener on unmount
- ✓ Should update on defaultValue dependency
- ✓ Should handle effect cleanup

### 17. Edge Cases and Error Handling (10 tests)
- ✓ Should handle null ref
- ✓ Should handle undefined ref.current
- ✓ Should handle undefined ref.current.value
- ✓ Should handle characterCount = 0
- ✓ Should handle negative characterCount
- ✓ Should handle characterLimit = 0
- ✓ Should handle very large characterLimit
- ✓ Should handle special characters in input
- ✓ Should handle emojis in input
- ✓ Should handle line breaks

### 18. Integration Tests (8 tests)
- ✓ Should integrate with useIntl hook
- ✓ Should integrate with useConfirmationAlert
- ✓ Should integrate with PrimeCommunityLinkPreview
- ✓ Should integrate with ReactQuill
- ✓ Should integrate with Spectrum icons
- ✓ Should handle complete workflow (type -> send)
- ✓ Should handle complete workflow (type -> cancel)
- ✓ Should handle format -> send workflow

### 19. Snapshot Tests (6 tests)
- ✓ Should match snapshot with default props
- ✓ Should match snapshot with all props
- ✓ Should match snapshot with concise toolbar
- ✓ Should match snapshot with text input
- ✓ Should match snapshot with character limit reached
- ✓ Should match snapshot with both buttons

## Testing Approach

### Unit Testing
- Test component rendering with different props
- Test user interactions (typing, clicking buttons)
- Test state management and updates
- Test character counting logic
- Test HTML processing

### Integration Testing
- Test ReactQuill integration
- Test hook integration (useIntl, useConfirmationAlert)
- Test child component integration (PrimeCommunityLinkPreview)
- Test ref forwarding

### Snapshot Testing
- Capture component structure for different states
- Verify UI consistency

## Mock Requirements

### Required Mocks
1. **react-quill** - Mock ReactQuill component
2. **useIntl** - Mock formatMessage
3. **useConfirmationAlert** - Mock alert function
4. **PrimeCommunityLinkPreview** - Mock child component
5. **@spectrum-icons/workflow** - Mock Send and Cancel icons
6. **getAlmConfirmationBadwordParams** - Mock bad word params

### Mock Data
```typescript
const mockProps = {
  primaryActionHandler: jest.fn().mockResolvedValue(undefined),
  secondaryActionHandler: jest.fn(),
  characterLimit: 1000,
  defaultValue: '',
  inputPlaceholder: 'Enter your text...',
  concisedToolbarOptions: false,
  enablePrimaryAction: jest.fn(),
  disablePrimaryAction: jest.fn(),
};
```

## Coverage Goals

- **Statement Coverage**: > 95%
- **Branch Coverage**: > 90%
- **Function Coverage**: > 95%
- **Line Coverage**: > 95%

## Known Challenges

1. **ReactQuill Mocking**: Complex editor needs proper mocking
2. **Ref Forwarding**: Testing forwardRef components
3. **Async Operations**: Primary action is async
4. **HTML Processing**: DOM manipulation for stripping tags
5. **Event Listeners**: Document event listeners need cleanup
6. **Character Counting**: Complex logic with HTML stripping
7. **Undo Functionality**: Quill history.undo() needs mocking

## Success Criteria

- ✓ All tests pass successfully
- ✓ Code coverage meets goals
- ✓ No console errors or warnings
- ✓ Proper cleanup in all tests
- ✓ All edge cases handled
- ✓ Snapshot tests capture all states

## Total Tests: 150+

The test suite comprehensively covers all functionality, edge cases, and integration points of the PrimeCommunityObjectInput component.

