# ALMStripWidgetHeader Component Test Plan

## Component Overview

**File**: `src/almLib/components/CustomPages/ALMStripWidgetHeader/ALMStripWidgetHeader.tsx`

**Purpose**: A reusable header component for strip-style widgets (carousels). Displays widget title, optional description, and navigation arrows with disabled states.

**Key Features**:
- Widget heading with HTML rendering support
- Optional widget description
- Left/right navigation arrows
- Disabled state for navigation arrows
- Conditional navigation icon display
- Accessibility features (ARIA labels, tabIndex)
- Auto-generated IDs for elements

**Key Dependencies**:
- `GetTranslation` - Translation utility for navigation labels
- `LEFT_ARROW_SVG` - SVG utility function for arrow icons

## Component Props Interface

```typescript
interface StripHeaderProps {
  heading: string;                    // Widget title (required)
  widgetId: string;                   // Unique widget identifier
  widgetDescription?: string;         // Optional description
  isLeftNavIconDisabled: boolean;     // Left arrow disabled state
  isRightNavIconDisabled: boolean;    // Right arrow disabled state
  rollAPage: (right: boolean) => void; // Navigation handler
  showNavIcons: boolean;              // Show/hide navigation
}
```

## Test Strategy

### Coverage Goals
- **Line Coverage**: > 70% (Target: 100%)
- **Branch Coverage**: > 70% (Target: 100%)
- **Function Coverage**: > 70% (Target: 100%)
- **Statement Coverage**: > 70% (Target: 100%)

### Key Test Areas (Priority Order)

#### High Priority
1. Basic rendering with required props
2. Heading rendering with HTML
3. Navigation button rendering
4. Button disabled states
5. Click handlers
6. Conditional description rendering
7. Conditional navigation rendering

#### Medium Priority
1. ID generation for elements
2. ARIA labels
3. Accessibility attributes
4. CSS classes

#### Low Priority
1. Edge cases (empty heading, missing props)
2. HTML sanitization (if applicable)

## Test Data Setup

```typescript
const mockProps = {
  heading: 'Test Widget',
  widgetId: 'widget-123',
  widgetDescription: 'Test description',
  isLeftNavIconDisabled: false,
  isRightNavIconDisabled: false,
  rollAPage: jest.fn(),
  showNavIcons: true,
};
```

## Test Scenarios

### 1. Basic Rendering
- Renders with all props
- Renders stripHeaderContainer
- Renders heading
- Returns null when heading is empty

### 2. Heading Rendering
- Renders heading in h2 tag
- Renders HTML content via dangerouslySetInnerHTML
- Sets title attribute
- Sets aria-label
- Sets data-automationid
- Sets data-skip-link-target
- Sets tabIndex to -1

### 3. Description Rendering
- Renders description when provided
- Hides description when not provided
- Sets correct automation ID
- Sets aria-label
- Sets title attribute

### 4. Navigation Icons
- Shows navigation when showNavIcons is true
- Hides navigation when showNavIcons is false
- Renders left and right buttons
- Sets correct IDs and automation IDs

### 5. Button States
- Disables left button when isLeftNavIconDisabled is true
- Disables right button when isRightNavIconDisabled is true
- Enables buttons when not disabled
- Sets aria-disabled attribute

### 6. Click Handlers
- Calls rollAPage(false) for left button
- Calls rollAPage(true) for right button
- Does not call handler when button is disabled

### 7. ARIA Labels
- Sets correct aria-label for left button
- Sets correct aria-label for right button
- Includes heading and translation

### 8. SVG Icons
- Renders LEFT_ARROW_SVG in left button
- Renders LEFT_ARROW_SVG in right button

## Success Criteria
- ✅ All tests pass
- ✅ Coverage exceeds 70%
- ✅ All rendering paths tested
- ✅ Navigation logic verified
- ✅ Accessibility validated

