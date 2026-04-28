# ALMCustomPage Component Test Plan

## Component Overview

**File**: `src/almLib/components/CustomPages/ALMCustomPage/ALMCustomPage.tsx`

**Purpose**: A container component that renders custom pages with dynamic layouts, widgets, and an inspect mode toggle. It manages lazy loading of rows, widget rendering, page titles, and event listeners for widget configuration and navigation.

**Key Dependencies**:
- `useLoadMore` - Infinite scroll for lazy loading rows
- `useUserContext` - User and locale information
- `CustomPageProvider` - Context for child widgets
- `ALMLayout` - Renders rows of widgets
- `ALMCustomWidgetRenderer` - Renders individual widgets
- React Spectrum `Switch` - Inspect mode toggle

## Component Props Interface

```typescript
interface ALMCustomPageProps {
  pageConfig: CustomPageConfig;
  disableLinks?: boolean;
  pageData: PrimePage;
}
```

## Test Strategy

### Coverage Goals
- **Line Coverage**: > 70% (Target: 90%+)
- **Branch Coverage**: > 70% (Target: 85%+)
- **Function Coverage**: > 70% (Target: 95%+)
- **Statement Coverage**: > 70% (Target: 90%+)

### Key Test Areas (Priority Order)

#### High Priority
1. Basic rendering with pageConfig
2. Layout initialization and batching
3. Inspect mode toggle
4. useLoadMore integration
5. Event listener setup/cleanup
6. Page title updates

#### Medium Priority
1. CustomPageProvider value
2. Conditional rendering (loader, empty state)
3. User context integration
4. Translation service calls

#### Low Priority
1. Edge cases (empty layout, missing data)
2. Complex integration scenarios

## Test Data Setup

```typescript
const mockPageConfig = {
  pageId: 'test-page-123',
  desktop: [
    { id: 'row-1', columns: [] },
    { id: 'row-2', columns: [] },
  ],
  widgets: {},
};

const mockPageData = {
  id: 'page-1',
  localizedMetadata: [
    { locale: 'en-US', name: 'Test Page' },
  ],
};

const mockUser = {
  id: 'user-1',
  locale: 'en-US',
};
```

## Success Criteria
- ✅ All tests pass
- ✅ Coverage exceeds 70%
- ✅ All hooks properly integrated
- ✅ Event listeners tested
- ✅ Edge cases handled

