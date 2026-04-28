# PrimeSelectedFiltersList - Test Cases

## Component
`PrimeSelectedFiltersList` - Displays selected filters with remove functionality and show more/less toggle

**Location**: `src/almLib/components/Catalog/PrimeCatalogFilters/PrimeSelectedFiltersList.tsx`  
**Test File**: `src/almLib/tests/components/PrimeCatalogFilters/PrimeSelectedFiltersList.spec.tsx`

---

## Quick Stats

- **Total Tests**: 42 (**0 Implemented ✅ + 42 Pending 🔄**)
- **Current Status**: Not Started
- **Coverage**: 0% (Target: 95%+)
- **Execution Time**: Target: < 4.5s for all 42 tests

---

## Test Cases

### 1. Component Rendering (5 tests)

| # | Test Case | Status |
|---|-----------|--------|
| 1.1 | Should render without crashing with empty filters | 🔄 |
| 1.2 | Should render nothing when selectedFilters is null/undefined | 🔄 |
| 1.3 | Should render all filters when count is less than or equal to 5 | 🔄 |
| 1.4 | Should render only first 5 filters when count exceeds maxVisibleFilters | 🔄 |
| 1.5 | Should render with correct CSS classes and container structure | 🔄 |

### 2. Filter Display & Labels (4 tests)

| # | Test Case | Status |
|---|-----------|--------|
| 2.1 | Should display filter labelToShow for each filter | 🔄 |
| 2.2 | Should display title attribute with labelToShow | 🔄 |
| 2.3 | Should render remove button for each visible filter | 🔄 |
| 2.4 | Should display filters in correct order (as provided in array) | 🔄 |

### 3. Show More/Show Less Toggle (8 tests)

| # | Test Case | Status |
|---|-----------|--------|
| 3.1 | Should show "Show More" button when filters exceed maxVisibleFilters (5) | 🔄 |
| 3.2 | Should not show toggle button when filters are 5 or less | 🔄 |
| 3.3 | Should not show toggle button when filters are exactly 5 | 🔄 |
| 3.4 | Should display all filters when "Show More" is clicked | 🔄 |
| 3.5 | Should display only first 5 filters when "Show Less" is clicked | 🔄 |
| 3.6 | Should toggle button text between "Show More" and "Show Less" | 🔄 |
| 3.7 | Should handle multiple rapid clicks on show more/less button | 🔄 |
| 3.8 | Should maintain showAll state until user toggles again | 🔄 |

### 4. Remove Filter Functionality (10 tests)

| # | Test Case | Status |
|---|-----------|--------|
| 4.1 | Should call updateFilters when removing a standard filter | 🔄 |
| 4.2 | Should call updatePriceRangeFilter when removing price range filter | 🔄 |
| 4.3 | Should call updateFilters with correct params for catalog filter removal | 🔄 |
| 4.4 | Should pass correct payload when removing filter (checked: false) | 🔄 |
| 4.5 | Should reset price range to 0,0 when removing price filter | 🔄 |
| 4.6 | Should remove button work for all visible filters | 🔄 |
| 4.7 | Should only call the appropriate handler once per removal | 🔄 |
| 4.8 | Should not affect other filters when removing one filter | 🔄 |
| 4.9 | Should handle removal of filter without data object gracefully | 🔄 |
| 4.10 | Should handle catalog filter removal without data.id | 🔄 |

### 5. Filter Removal with State Interaction (6 tests)

| # | Test Case | Status |
|---|-----------|--------|
| 5.1 | Should remove filter correctly when in "show all" mode | 🔄 |
| 5.2 | Should remove filter correctly when in "show limited" mode | 🔄 |
| 5.3 | Should handle removing multiple filters in sequence | 🔄 |
| 5.4 | Should automatically hide show more/less button after removals reduce count to 5 or less | 🔄 |
| 5.5 | Should maintain show all state when removing filters doesn't reduce count below 6 | 🔄 |
| 5.6 | Should handle removing last visible filter in limited view | 🔄 |

### 6. Edge Cases & Data Handling (9 tests)

| # | Test Case | Status |
|---|-----------|--------|
| 6.1 | Should handle filter with very long labelToShow (200+ chars) | 🔄 |
| 6.2 | Should handle filter with special characters in labelToShow | 🔄 |
| 6.3 | Should handle filter with empty labelToShow | 🔄 |
| 6.4 | Should handle selectedFilters with exactly 6 items (boundary case) | 🔄 |
| 6.5 | Should handle selectedFilters changing from many to few | 🔄 |
| 6.6 | Should handle selectedFilters changing from few to many | 🔄 |
| 6.7 | Should handle price range filter with missing start/end values | 🔄 |
| 6.8 | Should handle rapid consecutive filter removals | 🔄 |
| 6.9 | Should handle filter with missing filterType | 🔄 |


---

## Expanded Test Coverage Rationale

### Why 42 Tests?

The component has complex interactions between:
1. **State Management** (`showAll` toggle)
2. **Conditional Rendering** (based on filter count)
3. **Multiple Filter Types** (standard, price range, catalogs)
4. **User Interactions** (remove, show more/less)

### Key Areas Expanded

#### 1. State Interaction Tests (Category 5)
These tests ensure that filter removal works correctly in both view modes:
- Removing filters while viewing all items
- Removing filters while viewing limited items (first 5)
- Sequential removals and their effect on state
- Automatic state transitions (e.g., button disappearing when count drops to 5)

#### 2. Edge Cases & Data Handling (Category 9)
Real-world scenarios that could break the component:
- Very long filter names that might break UI
- Special characters (HTML entities, symbols)
- Missing or malformed data properties
- Boundary conditions (exactly 5 vs exactly 6 filters)
- Rapid interactions (stress testing)
- Props changing during component lifetime

#### 3. Enhanced Toggle Testing (Category 3)
The show more/less functionality is critical for UX:
- Boundary testing (exactly 5 filters = no button)
- Rapid clicks (state consistency)
- State persistence across re-renders
- Proper translation of button text

#### 4. Enhanced Removal Testing (Category 4)
Filter removal has complex logic paths:
- Each filter type has different removal logic
- Need to verify only the correct handler is called
- Need to verify other filters are unaffected
- Need to handle missing data gracefully
- Need to ensure single handler call per removal

---

## Test Summary

| Category | Implemented | Pending | Total |
|----------|-------------|---------|-------|
| Component Rendering | 0 | 5 | 5 |
| Filter Display & Labels | 0 | 4 | 4 |
| Show More/Show Less Toggle | 0 | 8 | 8 |
| Remove Filter Functionality | 0 | 10 | 10 |
| Filter Removal with State Interaction | 0 | 6 | 6 |
| Edge Cases & Data Handling | 0 | 9 | 9 |
| **TOTAL** | **0** | **42** | **42** |

**Legend**: ✅ Implemented | 🔄 Pending

---

## Running Tests

```bash
# Run all tests
npm test -- PrimeSelectedFiltersList.spec.tsx --watchAll=false

# Run with coverage
npm test -- PrimeSelectedFiltersList.spec.tsx --coverage --watchAll=false

# Run specific test suite
npm test -- PrimeSelectedFiltersList.spec.tsx -t "Show More/Show Less Toggle" --watchAll=false

# Run tests by category
npm test -- PrimeSelectedFiltersList.spec.tsx -t "Remove Filter Functionality" --watchAll=false
npm test -- PrimeSelectedFiltersList.spec.tsx -t "Accessibility" --watchAll=false

# Watch mode
npm test -- PrimeSelectedFiltersList.spec.tsx

# Debug specific test
npm test -- PrimeSelectedFiltersList.spec.tsx -t "Should show Show More button" --watchAll=false
```