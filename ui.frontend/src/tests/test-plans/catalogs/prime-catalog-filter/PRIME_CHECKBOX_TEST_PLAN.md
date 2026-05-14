# PrimeCheckBox - Test Cases

## Component
`PrimeCheckBox` - Custom checkbox component with translation support for catalog filters

**Location**: `src/almLib/components/Catalog/PrimeCatalogFilters/PrimeCheckBox.tsx`  
**Test File**: `src/almLib/tests/components/PrimeCatalogFilters/PrimeCheckBox.spec.tsx`

---

## Quick Stats

- **Total Tests**: 15 (**15 Implemented ✅ + 0 Pending 🔄**)
- **Current Status**: ✅ 15/15 Passing (100%)
- **Coverage**: 95%+ (Target: 95%+)
- **Execution Time**: ~2.1s

---

## Test Cases

### 1. Component Rendering (4 tests)

| # | Test Case | Status |
|---|-----------|--------|
| 1.1 | Should render without crashing | ✅ |
| 1.2 | Should display the passed label in UI | ✅ |
| 1.3 | Should render with correct CSS classes | ✅ |
| 1.4 | Should render as Adobe React Spectrum Checkbox | ✅ |

### 2. Label Handling (4 tests)

| # | Test Case | Status |
|---|-----------|--------|
| 2.1 | Should show translated label when isListDynamic is false | ✅ |
| 2.2 | Should show raw label when isListDynamic is true | ✅ |
| 2.3 | Should display title attribute with label text | ✅ |
| 2.4 | Should handle empty or undefined labels gracefully | ✅ |

### 3. Checkbox State (3 tests)

| # | Test Case | Status |
|---|-----------|--------|
| 3.1 | Should render as checked when checked prop is true | ✅ |
| 3.2 | Should render as unchecked when checked prop is false | ✅ |
| 3.3 | Should toggle checked state on click | ✅ |

### 4. Event Handling (4 tests)

| # | Test Case | Status |
|---|-----------|--------|
| 4.1 | Should call changeHandler when clicked | ✅ |
| 4.2 | Should call changeHandler with correct payload (filterType, checked, label) | ✅ |
| 4.3 | Should call changeHandler with toggled checked value (unchecked to checked) | ✅ |
| 4.4 | Should call changeHandler with toggled checked value (checked to unchecked) | ✅ |

---

## Test Summary

| Category | Implemented | Pending | Total |
|----------|-------------|---------|-------|
| Component Rendering | 4 | 0 | 4 |
| Label Handling | 4 | 0 | 4 |
| Checkbox State | 3 | 0 | 3 |
| Event Handling | 4 | 0 | 4 |
| **TOTAL** | **15** | **0** | **15** |

**Legend**: ✅ Implemented | 🔄 Pending

---

## Running Tests

```bash
# Run all tests
npm test -- PrimeCheckBox.spec.tsx --watchAll=false

# Run with coverage
npm test -- PrimeCheckBox.spec.tsx --coverage --watchAll=false

# Run specific test suite
npm test -- PrimeCheckBox.spec.tsx -t "Label Handling" --watchAll=false

# Run tests by category
npm test -- PrimeCheckBox.spec.tsx -t "Event Handling" --watchAll=false
npm test -- PrimeCheckBox.spec.tsx -t "Accessibility" --watchAll=false

# Watch mode
npm test -- PrimeCheckBox.spec.tsx

# Debug specific test
npm test -- PrimeCheckBox.spec.tsx -t "Should apply automationId" --watchAll=false
```

---

## Related Components

- **PrimeCatalogFilterListItem** - Parent component that uses PrimeCheckbox
- **PrimeCatalogFilters** - Grandparent container component
- **Checkbox** (Adobe React Spectrum) - Base component