# ALMCustomWidgetRenderer Component Test Plan

## Component Overview

**File**: `src/almLib/components/CustomPages/ALMCustomWidgetRenderer/ALMCustomWidgetRenderer.tsx`

**Purpose**: A renderer component that dynamically renders widgets based on widget type. It looks up components from the widget registry, passes appropriate props, and handles errors gracefully.

**Key Dependencies**:
- `useCustomPageContextProvider` - Gets page config, disableLinks, isInspectMode
- `widgetRegistry` - Registry of available widget components
- `withSuspense` - HOC for lazy loading support
- React.memo - Performance optimization

## Component Props Interface

```typescript
interface ALMCustomWidgetRendererProps {
  column: Column;
  widgets: WidgetMap;
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
1. Basic rendering with valid widget
2. Widget registry lookup
3. Error handling (missing widgetId, missing widget, unsupported type)
4. Context provider integration
5. Props passing to widget components

#### Medium Priority
1. useMemo optimization
2. React.memo behavior
3. withSuspense integration
4. Assets passing

#### Low Priority
1. Edge cases
2. Console error verification

## Test Data Setup

```typescript
const mockColumn = {
  id: 'col-1',
  widgetId: 'widget-1',
  widgetRefs: ['widget-1'],
};

const mockWidgets = {
  'widget-1': {
    id: 'widget-1',
    widgetRef: 'HTML_WIDGET',
    attributes: {},
  },
};

const mockPageConfig = {
  pageId: 'page-1',
  assets: {
    'widget-1': { imageUrl: 'test.jpg' },
  },
};
```

## Success Criteria
- ✅ All tests pass
- ✅ Coverage exceeds 70%
- ✅ Error handling tested
- ✅ Context integration verified
- ✅ Edge cases handled

