# PrimeCatalogFiltersMobile - Test Cases

## Component
`PrimeCatalogFiltersMobile` - Mobile/tablet filter dialog interface with filter selection, search, and apply/cancel actions

**Location**: `src/almLib/components/Catalog/PrimeCatalogFilters/PrimeCatalogFiltersMobile.tsx`  
**Test File**: `src/almLib/tests/components/PrimeCatalogFilters/PrimeCatalogFiltersMobile.spec.tsx`

---

## Quick Stats

- **Total Tests**: 48 (**0 Implemented ✅ + 48 Pending 🔄**)
- **Current Status**: Not Started
- **Coverage**: 0% (Target: 95%+)
- **Execution Time**: Target: < 5s for all 48 tests

---

## Test Cases

### 1. Dialog Rendering & Structure (6 tests)

| # | Test Case | Status |
|---|-----------|--------|
| 1.1 | Should render ALMDialog with correct structure (header, content, footer) | 🔄 |
| 1.2 | Should render with mobile-specific height (80%) when isMobile is true | 🔄 |
| 1.3 | Should render with tablet height (60%) when isTablet is true | 🔄 |
| 1.4 | Should render dialog title "alm.catalog.filters" in header | 🔄 |
| 1.5 | Should render with correct border radius for mobile (top) vs tablet (all) | 🔄 |
| 1.6 | Should enable overlay close and sticky position | 🔄 |

### 2. Filter List Display (7 tests)

| # | Test Case | Status |
|---|-----------|--------|
| 2.1 | Should render all filters in filterOrder | 🔄 |
| 2.2 | Should not render filters with empty or invalid list | 🔄 |
| 2.3 | Should not render filters with list length < 1 | 🔄 |
| 2.4 | Should render filter labels with translation | 🔄 |
| 2.5 | Should highlight selected filter with ChevronRight icon | 🔄 |
| 2.6 | Should show no results message for skill/tag filters with empty list | 🔄 |
| 2.7 | Should render filters in correct order based on filterOrder array | 🔄 |

### 3. Filter Selection & Navigation (6 tests)

| # | Test Case | Status |
|---|-----------|--------|
| 3.1 | Should call updateShowFilterLists when filter label is clicked | 🔄 |
| 3.2 | Should dispatch with correct filter type when clicked | 🔄 |
| 3.3 | Should render PrimeCatalogFilterListItem for non-price filters | 🔄 |
| 3.4 | Should render price range filter when price filter is selected | 🔄 |
| 3.5 | Should pass correct props to PrimeCatalogFilterListItem | 🔄 |
| 3.6 | Should update selected filter when different filter is clicked | 🔄 |

### 4. Selected Filters Display (Live Updates) (8 tests)

| # | Test Case | Status |
|---|-----------|--------|
| 4.1 | Should display PrimeSelectedFiltersList component in header | 🔄 |
| 4.2 | Should build selectedFiltersForDialog from filterState | 🔄 |
| 4.3 | Should update chips instantly when toggling items in dialog | 🔄 |
| 4.4 | Should display price range filter as "start-end" format | 🔄 |
| 4.5 | Should handle catalog filters with label display (not IDs) | 🔄 |
| 4.6 | Should translate static filter labels for display | 🔄 |
| 4.7 | Should show raw labels for dynamic/searchable filters | 🔄 |
| 4.8 | Should exclude catalog items without labels from chips | 🔄 |

### 5. Button Actions (Apply & Cancel) (8 tests)

| # | Test Case | Status |
|---|-----------|--------|
| 5.1 | Should render Cancel and Apply buttons in footer | 🔄 |
| 5.2 | Should call cancelButtonAction when Cancel is clicked | 🔄 |
| 5.3 | Should call applyButtonAction when Apply is clicked | 🔄 |
| 5.4 | Should reset filters to initial state on Cancel | 🔄 |
| 5.5 | Should close dialog on Cancel | 🔄 |
| 5.6 | Should call updateFilterList on Apply | 🔄 |
| 5.7 | Should close dialog on Apply | 🔄 |
| 5.8 | Should use correct button variants (secondary for Cancel, cta for Apply) | 🔄 |

### 6. Search Functionality & Cleanup (6 tests)

| # | Test Case | Status |
|---|-----------|--------|
| 6.1 | Should clear skill name search on component unmount | 🔄 |
| 6.2 | Should clear tag name search on component unmount | 🔄 |
| 6.3 | Should call clearFilterSearch with FILTER.SKILL_NAME | 🔄 |
| 6.4 | Should call clearFilterSearch with FILTER.TAG_NAME | 🔄 |
| 6.5 | Should reset search results asynchronously | 🔄 |
| 6.6 | Should handle clearFilterSearch errors gracefully | 🔄 |

### 7. Initial Filters State Management (5 tests)

| # | Test Case | Status |
|---|-----------|--------|
| 7.1 | Should capture initial filters on component mount | 🔄 |
| 7.2 | Should store selectedFilters in initialFilters state | 🔄 |
| 7.3 | Should use initialFilters when cancel is clicked | 🔄 |
| 7.4 | Should maintain initialFilters throughout dialog lifecycle | 🔄 |
| 7.5 | Should not update initialFilters when selections change | 🔄 |

### 8. Device Context Integration (4 tests)

| # | Test Case | Status |
|---|-----------|--------|
| 8.1 | Should use device context for dialog height calculation | 🔄 |
| 8.2 | Should render different filter container widths for mobile vs tablet | 🔄 |
| 8.3 | Should apply size-1200 width for mobile filter container | 🔄 |
| 8.4 | Should apply size-1700 width for tablet filter container | 🔄 |

### 9. Edge Cases & Error Handling (8 tests)

| # | Test Case | Status |
|---|-----------|--------|
| 9.1 | Should handle empty filterOrder array | 🔄 |
| 9.2 | Should handle null/undefined filterState | 🔄 |
| 9.3 | Should handle missing filter in filterState for filterOrder entry | 🔄 |
| 9.4 | Should handle price range filter with missing start/end values | 🔄 |
| 9.5 | Should handle catalog filter without value (no data.id) | 🔄 |
| 9.6 | Should handle filters with null list property | 🔄 |
| 9.7 | Should handle rapid Apply/Cancel button clicks | 🔄 |
| 9.8 | Should handle dialog close via overlay click | 🔄 |

---

## Expanded Test Coverage Rationale

### Why 48 Tests?

The component has complex functionality involving:
1. **Dialog Management** (open/close, apply/cancel)
2. **State Management** (initial filters, live updates)
3. **Filter Building Logic** (different rules for price, catalogs, dynamic filters)
4. **Search Integration** (clear on unmount)
5. **Device-Specific Rendering** (mobile vs tablet)
6. **Child Component Integration** (PrimeSelectedFiltersList, PrimeCatalogFilterListItem)

### Key Focus Areas

#### 1. Live Filter Updates (Category 4)
The `selectedFiltersForDialog` memoized value builds chips from current filter state:
- Price range: Special formatting "start-end"
- Catalogs: Use labels, skip items without labels
- Static filters: Translate labels
- Dynamic filters: Use raw labels
- Real-time updates as user selects/deselects

#### 2. Apply vs Cancel Logic (Category 5 & 7)
Critical user flow testing:
- Initial state capture on mount
- Cancel: Reset to initial, close dialog
- Apply: Save changes, close dialog
- State preservation during selection

#### 3. Filter Building Rules (Category 4)
Different filter types have different display logic:
- `FILTER.PRICE_RANGE`: Format as "100-500"
- `FILTER.CATALOGS`: Use label, create data.id
- Dynamic/Searchable: Use raw label
- Static: Translate label
- Skip empty/invalid entries

#### 4. Search Cleanup (Category 6)
Proper cleanup to avoid memory leaks:
- Clear skill name search
- Clear tag name search
- Async cleanup on unmount

---

## Test Summary

| Category | Implemented | Pending | Total |
|----------|-------------|---------|-------|
| Dialog Rendering & Structure | 0 | 6 | 6 |
| Filter List Display | 0 | 7 | 7 |
| Filter Selection & Navigation | 0 | 6 | 6 |
| Selected Filters Display (Live Updates) | 0 | 8 | 8 |
| Button Actions (Apply & Cancel) | 0 | 8 | 8 |
| Search Functionality & Cleanup | 0 | 6 | 6 |
| Initial Filters State Management | 0 | 5 | 5 |
| Device Context Integration | 0 | 4 | 4 |
| Edge Cases & Error Handling | 0 | 8 | 8 |
| **TOTAL** | **0** | **48** | **48** |

**Legend**: ✅ Implemented | 🔄 Pending

---

## Running Tests

```bash
# Run all tests
npm test -- PrimeCatalogFiltersMobile.spec.tsx --watchAll=false

# Run with coverage
npm test -- PrimeCatalogFiltersMobile.spec.tsx --coverage --watchAll=false

# Run specific test suite
npm test -- PrimeCatalogFiltersMobile.spec.tsx -t "Button Actions" --watchAll=false
npm test -- PrimeCatalogFiltersMobile.spec.tsx -t "Selected Filters Display" --watchAll=false

# Watch mode
npm test -- PrimeCatalogFiltersMobile.spec.tsx

# Debug specific test
npm test -- PrimeCatalogFiltersMobile.spec.tsx -t "Should build selectedFiltersForDialog" --watchAll=false
```

---

## Implementation Priority

### High Priority (Next Sprint) 🔴
1. **Button Actions (Apply & Cancel)** - Critical user flow (8 tests)
   - Apply/Cancel functionality
   - Dialog closing
   - Filter state management
2. **Selected Filters Display (Live Updates)** - Core feature (8 tests)
   - Building chips from filterState
   - Different rules for different filter types
   - Real-time updates

### Medium Priority (Following Sprint) 🟡
3. **Filter Selection & Navigation** - User interaction (6 tests)
   - Filter clicking and selection
   - Conditional rendering (price vs list)
4. **Initial Filters State Management** - Cancel functionality (5 tests)
   - State capture and restoration
5. **Search Functionality & Cleanup** - Memory management (6 tests)
   - Cleanup on unmount

### Low Priority (Backlog) 🟢
6. **Dialog Rendering & Structure** - Basic rendering (6 tests)
7. **Filter List Display** - UI display (7 tests)
8. **Device Context Integration** - Responsive (4 tests)
9. **Edge Cases & Error Handling** - Robustness (8 tests)

---

## Component Architecture

### Dependencies
- **Parent Component**: `PrimeCatalogFilters`
- **Child Components**: 
  - `ALMDialog`, `ALMDialogHeader`, `ALMDialogContent`, `ALMDialogFooter`
  - `PrimeCatalogFilterListItem`
  - `PrimeSelectedFiltersList`
- **Context Providers**: `DeviceTypeProvider`, `ALMDialogContextProvider`
- **Redux**: `useDispatch`
- **Utils**: `GetTranslation`, `FILTER` constants
- **UI Library**: Adobe React Spectrum (Button, Flex, Heading, View)
- **Icons**: `@spectrum-icons/workflow/ChevronRight`

### Props Interface
```typescript
interface PrimeCatalogFiltersMobileProps {
  filterOrder: string[];
  filterState: Record<string, FilterData>;
  selectedFilter: FilterData;
  updateShowFilterLists: (filterType: string) => void;
  renderPriceRangeFilter: (filter: FilterData) => React.ReactNode;
  searchFilters: (filterType: string, query: string) => void;
  updateFilters: (payload: any) => void;
  clearFilterSearch: (filterType: string) => Promise<void>;
  showFilterLists: string;
  updateFilterList: () => void;
  showClearFiltersButton: () => React.ReactNode;
  updatePriceRangeFilter: (payload: any) => void;
  selectedFilters: any[];
  resetFilters: (initialFilters: any) => void;
}
```

### Key State Variables
- `initialFilters`: Captured on mount for cancel functionality
- `selectedFiltersForDialog`: Memoized computed value from filterState

### Key Constants
- Dialog height: 80% (mobile) or 60% (tablet)
- Filter container width: size-1200 (mobile) or size-1700 (tablet)
- Minimum values to display filter: 1

---

## Next Steps

1. 📋 **Planned** - Create test file skeleton with basic setup
2. 📋 **Planned** - Implement button actions tests (8 tests)
3. 📋 **Planned** - Implement selected filters display tests (8 tests)
4. 📋 **Planned** - Implement filter selection tests (6 tests)
5. 📋 **Planned** - Implement initial state management tests (5 tests)
6. 📋 **Planned** - Implement search cleanup tests (6 tests)
7. 📋 **Planned** - Implement dialog rendering tests (6 tests)
8. 📋 **Planned** - Implement filter list display tests (7 tests)
9. 📋 **Planned** - Implement device context tests (4 tests)
10. 📋 **Planned** - Implement edge cases tests (8 tests)

---

## Test Data Templates

### Mock Props - Basic Setup
```typescript
const mockPropsBasic = {
  filterOrder: ['loTypes', 'skillLevel', 'tags'],
  filterState: {
    loTypes: {
      type: 'loTypes',
      label: 'alm.catalog.filter.type',
      list: [
        { label: 'alm.catalog.loType.course', value: 'course', checked: false },
        { label: 'alm.catalog.loType.program', value: 'program', checked: true },
      ],
    },
    skillLevel: {
      type: 'skillLevel',
      label: 'alm.catalog.filter.level',
      list: [
        { label: 'alm.catalog.level.beginner', value: 'beginner', checked: true },
      ],
    },
  },
  selectedFilter: {
    type: 'loTypes',
    label: 'alm.catalog.filter.type',
    list: [...],
  },
  updateShowFilterLists: jest.fn(),
  renderPriceRangeFilter: jest.fn(() => <div>Price Range</div>),
  searchFilters: jest.fn(),
  updateFilters: jest.fn(),
  clearFilterSearch: jest.fn().mockResolvedValue(undefined),
  showFilterLists: 'loTypes',
  updateFilterList: jest.fn(),
  showClearFiltersButton: jest.fn(() => <button>Clear</button>),
  updatePriceRangeFilter: jest.fn(),
  selectedFilters: [],
  resetFilters: jest.fn(),
};
```

### Mock Props - With Price Range
```typescript
const mockPropsWithPriceRange = {
  ...mockPropsBasic,
  filterState: {
    ...mockPropsBasic.filterState,
    priceRange: {
      type: 'priceRange',
      label: 'alm.catalog.filter.price',
      list: [
        { label: 'Start', value: 100 },
        { label: 'End', value: 500 },
      ],
    },
  },
  selectedFilter: {
    type: 'priceRange',
    label: 'alm.catalog.filter.price',
    list: [
      { label: 'Start', value: 100 },
      { label: 'End', value: 500 },
    ],
  },
};
```

### Mock Props - With Catalog Filters
```typescript
const mockPropsWithCatalogs = {
  ...mockPropsBasic,
  filterState: {
    ...mockPropsBasic.filterState,
    catalogs: {
      type: 'catalogs',
      label: 'alm.catalog.filter.catalogs',
      list: [
        { label: 'Technology Catalog', value: 'tech-123', checked: true },
        { label: 'Business Catalog', value: 'biz-456', checked: false },
      ],
    },
  },
};
```

### Mock Props - With Dynamic/Searchable Filters
```typescript
const mockPropsWithDynamicFilters = {
  ...mockPropsBasic,
  filterState: {
    ...mockPropsBasic.filterState,
    skillName: {
      type: 'skillName',
      label: 'alm.catalog.filter.skills',
      list: [
        { label: 'JavaScript', value: 'js', checked: true },
        { label: 'React', value: 'react', checked: true },
      ],
      isListDynamic: true,
      canSearch: true,
    },
  },
};
```

### Mock Props - Empty Filter State
```typescript
const mockPropsEmpty = {
  ...mockPropsBasic,
  filterOrder: [],
  filterState: {},
  selectedFilter: null,
  selectedFilters: [],
};
```

### Mock Props - With Selected Filters
```typescript
const mockPropsWithSelections = {
  ...mockPropsBasic,
  selectedFilters: [
    { 
      filterType: 'loTypes', 
      label: 'alm.catalog.loType.program', 
      checked: true,
      labelToShow: 'Program',
    },
    { 
      filterType: 'skillLevel', 
      label: 'alm.catalog.level.beginner', 
      checked: true,
      labelToShow: 'Beginner',
    },
  ],
};
```

---

## Known Issues & Considerations

### Current Known Issues
- None reported

### Testing Considerations
1. **Dialog Context**: Requires ALMDialogContextProvider wrapper
2. **Device Context**: Requires DeviceTypeProvider wrapper
3. **Redux**: Requires store provider and dispatch mocking
4. **Intl**: Requires react-intl IntlProvider wrapper
5. **Memoization**: `selectedFiltersForDialog` uses useMemo, needs filterState updates
6. **Async Cleanup**: clearFilterSearch is async, needs proper waiting
7. **Child Components**: ALMDialog, PrimeCatalogFilterListItem, PrimeSelectedFiltersList need mocking
8. **Translation**: GetTranslation must be mocked
9. **Icons**: ChevronRight from Spectrum needs mocking
10. **Effects**: useEffect cleanup runs on unmount, needs testing

### Critical Test Scenarios

#### Live Filter Updates Flow
1. User opens dialog (initialFilters captured)
2. User selects/deselects filters (selectedFiltersForDialog updates)
3. User clicks Apply (updateFilterList called, dialog closes)
4. User clicks Cancel (resetFilters with initialFilters, dialog closes)

#### Filter Type Handling
- **Price Range**: Display as "100-500", special rendering
- **Catalogs**: Use label not ID, skip items without labels
- **Dynamic/Searchable**: Use raw labels (no translation)
- **Static**: Translate labels for display
- **Empty/Invalid**: Skip rendering

#### Search Cleanup
- Component mounts → saves initial filters
- User searches skills/tags
- Component unmounts → clears skill and tag searches
- Async cleanup must complete

---

## Related Components
- **PrimeCatalogFilters** - Parent desktop/tablet filter component
- **PrimeCatalogFilterListItem** - Filter item list renderer
- **PrimeSelectedFiltersList** - Selected filters chips display
- **ALMDialog** - Dialog wrapper components