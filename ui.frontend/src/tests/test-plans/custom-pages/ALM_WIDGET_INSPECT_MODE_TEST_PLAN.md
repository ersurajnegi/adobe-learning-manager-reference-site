# ALMWidgetInspectMode Component Test Plan

## Component Overview

**File**: `src/almLib/components/CustomPages/ALMWidgetInspectMode/ALMWidgetInspectMode.tsx`

**Purpose**: A developer/admin tool overlay that displays widget metadata when in inspect mode. Shows widget type, height, and width for debugging and layout inspection purposes.

**Key Features**:
- Displays widget type name (translated)
- Shows widget dimensions (height and width)
- "N/A" for missing dimensions
- Pixel symbol appended to dimension values
- Tooltip overlay with semi-transparent background
- Helper function to map widget refs to display names

**Key Dependencies**:
- `GetTranslation` - Translation utility for all text
- `WidgetType` - Enum of widget types
- `NOT_APPLICABLE`, `PIXEL_SYMBOL` - Display constants

## Component Props Interface

```typescript
interface ALMWidgetInspectModeProps {
  widget: any;                    // Widget object with widgetRef
  widgetWidth: number | undefined;  // Widget width in pixels
  widgetHeight: number | undefined; // Widget height in pixels
}

// Helper functions
const getWidgetTypeMap = () => Map<WidgetType, string>
const getWidgetType = (widgetRef: any) => string | undefined
```

## Test Strategy

### Coverage Goals
- **Line Coverage**: > 70% (Target: 100%)
- **Branch Coverage**: > 70% (Target: 100%)
- **Function Coverage**: > 70% (Target: 100%)
- **Statement Coverage**: > 70% (Target: 100%)

### Key Test Areas (Priority Order)

#### High Priority
1. Basic rendering with all props
2. Widget type display
3. Dimension rendering (width/height)
4. "N/A" for missing dimensions
5. Pixel symbol appending
6. getWidgetType helper function
7. getWidgetTypeMap helper function

#### Medium Priority
1. Automation IDs
2. CSS classes
3. Tooltip and overlay structure
4. All widget types

#### Low Priority
1. Edge cases (zero dimensions, negative values)
2. displayName

## Test Data Setup

```typescript
const mockWidget = {
  widgetRef: WidgetType.CATEGORY,
};

const mockProps = {
  widget: mockWidget,
  widgetWidth: 500,
  widgetHeight: 300,
};

const mockGetTranslation = jest.fn((key: string) => `Translated: ${key}`);
```

## Test Scenarios

### 1. Basic Rendering
- Renders without errors
- Renders tooltip div
- Renders widgetOverlay div
- Renders widget type
- Renders height dimension
- Renders width dimension

### 2. Widget Type Display
- Displays correct type for CATEGORY
- Displays correct type for COURSES_AND_PATHS
- Displays correct type for MYLEARNING
- Displays correct type for SOCIAL
- Displays correct type for COMPLIANCE
- Displays correct type for GAMIFICATION
- Displays correct type for HTML_WIDGET
- Displays correct type for CUSTOM_CONTENT_BOX
- Displays correct type for IFRAME
- Displays correct type for CALENDAR

### 3. Dimension Rendering
- Shows height with pixel symbol when provided
- Shows width with pixel symbol when provided
- Shows "N/A" when height is undefined
- Shows "N/A" when width is undefined
- Shows "N/A" when height is 0
- Shows "N/A" when width is 0

### 4. Automation IDs
- Sets correct automation ID for widget type
- Sets correct automation ID for height
- Sets correct automation ID for width

### 5. Translation Integration
- Calls GetTranslation for widget type
- Calls GetTranslation for height label
- Calls GetTranslation for width label

### 6. Helper Functions
- getWidgetTypeMap returns correct map
- getWidgetType returns correct type
- getWidgetType returns undefined for unknown type

## Success Criteria
- ✅ All tests pass
- ✅ Coverage exceeds 70%
- ✅ All widget types tested
- ✅ All dimension scenarios tested
- ✅ Helper functions validated

