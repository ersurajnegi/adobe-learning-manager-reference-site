# ALMCoursePathWidget Component Test Plan

## Component Overview

**File**: `src/almLib/components/CustomPages/ALMCoursePathWidget/ALMCoursePathWidget.tsx`

**Purpose**: A widget that displays a horizontal scrollable strip of training/course cards. It integrates multiple hooks for data fetching, feedback management, scrolling behavior, and inspect mode. Supports bookmarking, enrollment, and launching training content.

**Key Dependencies**:
- `useCoursePathWidget` - Data fetching, bookmarking, enrollment
- `useFeedback` - L1 feedback management
- `useStripScroll` - Horizontal scroll and navigation
- `useWidgetInspectMode` - Inspect mode for editing
- `useUserContext` - User and account information
- `PrimeTrainingCardV2` - Individual training card component
- `PrimeFeedbackWrapper` - Feedback dialog component

## Component Props Interface

```typescript
interface ALMCoursePathWidgetProps {
  widget: any;
  disableLinks?: boolean;
  isInspectMode?: boolean;
}
```

## Test Strategy

### Coverage Goals
- **Line Coverage**: > 70% (Target: 95%+)
- **Branch Coverage**: > 70% (Target: 90%+)
- **Function Coverage**: > 70% (Target: 100%)
- **Statement Coverage**: > 70% (Target: 95%+)

### Key Test Areas (Priority Order)

#### High Priority
1. Basic rendering with hooks integration
2. Training items rendering
3. Loading states (loader, items, empty)
4. Navigation icons visibility
5. Bookmark handlers
6. Enrollment handler
7. Feedback integration

#### Medium Priority
1. Inspect mode
2. Responsive layout
3. Translation service
4. User context integration
5. Action handlers (name click, action click)

#### Low Priority
1. Edge cases
2. Complex integration scenarios
3. Error handling

## Test Data Setup

```typescript
// Mock widget
const mockWidget = {
  id: 'test-widget-123',
  widgetRef: 'course-path-widget',
  attributes: {},
};

// Mock training items
const mockTrainings = [
  {
    id: 'training-1',
    loType: 'course',
    name: 'Test Course 1',
    // ... other properties
  },
];

// Mock user
const mockUser = {
  id: 'user-1',
  account: {
    id: 'account-1',
    // ... account properties
  },
};
```

## Success Criteria
- ✅ All tests pass
- ✅ Coverage exceeds 70%
- ✅ All hooks properly integrated
- ✅ All rendering states tested
- ✅ Edge cases handled

