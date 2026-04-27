# ALMLayout Component Test Plan

## Component Overview

**File**: `src/almLib/components/CustomPages/ALMLayout/ALMLayout.tsx`

**Purpose**: A layout component that renders rows and columns in a flexible grid system. It manages nested layouts, widget rendering through context, error handling, and responsive column spanning.

**Key Components**:
- `ALMLayout` - Main container component
- `RowRenderer` - Renders individual rows with full-stretch support
- `ColumnRenderer` - Renders columns with widgets or nested rows

**Key Dependencies**:
- `useCustomPageContextProvider` - Gets page config, widgets, and renderWidget function
- `React.memo` - Performance optimization for all components
- `useMemo` - Optimizes widget rendering

## Component Props Interface

```typescript
interface ALMLayoutProps {
  layout: Row[];
}

interface Row {
  id: string;
  columns: Column[];
  isFullStretchRow?: boolean;
}

interface Column {
  id: string;
  colSpan?: number;
  rows?: Row[];
  widgetId?: string;
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
1. Basic layout rendering
2. Row rendering with columns
3. Column rendering with widgets
4. Nested rows within columns
5. Column span classes
6. Full-stretch row styling
7. Error handling in widget rendering

#### Medium Priority
1. React.memo optimization
2. useMemo optimization
3. Context provider integration
4. Empty layout handling

#### Low Priority
1. Edge cases
2. Complex nested structures

## Test Data Setup

```typescript
const mockLayout = [
  {
    id: 'row-1',
    columns: [
      { id: 'col-1', colSpan: 6, widgetId: 'widget-1' },
      { id: 'col-2', colSpan: 6, widgetId: 'widget-2' },
    ],
  },
];

const mockContext = {
  pageConfig: { widgets: { 'widget-1': {...} } },
  renderWidget: jest.fn(),
  disableLinks: false,
  isInspectMode: false,
};
```

## Success Criteria
- ✅ All tests pass
- ✅ Coverage exceeds 70%
- ✅ All rendering paths tested
- ✅ Error handling verified
- ✅ Edge cases handled

