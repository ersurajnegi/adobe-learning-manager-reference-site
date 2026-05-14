# Common Components - Test Plans

## Overview

This directory contains test plans for all **Common Components** in the ALM Library. These are reusable utility components used throughout the application.

**Category**: Common/Utility Components  
**Priority**: P1 (High)  
**Total Components**: 9

---

## Component List

| Component | Lines | Complexity | Test Plan | Test Status | Coverage |
|-----------|-------|------------|-----------|-------------|----------|
| [ALMBackButton](./ALMBackButton/ALMBackButton_TEST_PLAN.md) | 40 | Low | ✅ Available | ✅ 38/38 Passing | 100% |
| [ALMCustomPicker](./ALMCustomPicker/ALMCustomPicker_TEST_PLAN.md) | ~120 | Medium | ✅ Available | ⚠️ In Progress | TBD |
| [ALMEffectivenessDialog](./ALMEffectivenessDialog/ALMEffectivenessDialog_TEST_PLAN.md) | ~150 | Medium | ✅ Available | ⚠️ In Progress | TBD |
| [ALMErrorBoundary](./ALMErrorBoundary/ALMErrorBoundary_TEST_PLAN.md) | ~100 | Low | ✅ Available | ✅ Passing | High |
| [ALMExtensionIframeDialog](./ALMExtensionIframeDialog/ALMExtensionIframeDialog_TEST_PLAN.md) | ~200 | High | ✅ Available | ⚠️ In Progress | TBD |
| [ALMImage](./ALMImage/ALMImage_TEST_PLAN.md) | 24 | Low | ✅ Available | ✅ 40/40 Passing | 100% |
| [ALMLoader](./ALMLoader/ALMLoader_TEST_PLAN.md) | 37 | Low | ✅ Available | ⚠️ 17/33 Passing | 51% |
| [AlmModalDialog](./AlmModalDialog/AlmModalDialog_TEST_PLAN.md) | ~180 | Medium | ✅ Available | ⚠️ In Progress | TBD |
| [ALMTooltip](./ALMTooltip/ALMTooltip_TEST_PLAN.md) | ~100 | Low | ✅ Available | ⚠️ In Progress | TBD |

---

## Testing Strategy

### High Priority (P0)
- **ALMErrorBoundary** - Critical for error handling across app
- **ALMLoader** - Used in virtually every async component

### Medium Priority (P1)
- **ALMBackButton** - ✅ Complete (100% coverage)
- **ALMImage** - ✅ Complete (100% coverage)
- **ALMTooltip** - Used extensively for accessibility
- **AlmModalDialog** - Core dialog functionality

### Lower Priority (P2)
- **ALMCustomPicker** - Specific feature component
- **ALMEffectivenessDialog** - Feature-specific dialog
- **ALMExtensionIframeDialog** - Extension integration only

---

## Characteristics

### Shared Patterns

1. **Provider Requirements**
   - Most components require `SpectrumProvider` and `IntlProvider`
   - Some require `DeviceTypeProvider` for responsive behavior

2. **Common Dependencies**
   - Adobe React Spectrum components
   - `react-intl` for internationalization
   - Custom CSS modules

3. **Accessibility Focus**
   - ARIA attributes
   - Keyboard navigation
   - Screen reader support
   - Focus management

### Component Relationships

```
ALMErrorBoundary (Wraps any component)
├── ALMLoader (Loading states)
├── AlmModalDialog (Dialog wrapper)
│   ├── ALMEffectivenessDialog
│   └── ALMExtensionIframeDialog
├── ALMTooltip (Help text)
├── ALMImage (Image display with fallback)
├── ALMBackButton (Navigation)
└── ALMCustomPicker (Form input)
```

---

## Test Coverage Summary

### ✅ Complete (100% Coverage)
1. **ALMBackButton** - 38 tests, all passing
2. **ALMImage** - 40 tests, all passing

### ⚠️ Partial Coverage
3. **ALMLoader** - 17/33 tests passing (51%)
4. **ALMErrorBoundary** - Tests exist, mostly passing
5. **ALMTooltip** - Basic tests exist

### 📝 Needs Improvement
6. **AlmModalDialog** - Tests exist but need expansion
7. **ALMCustomPicker** - Tests exist but incomplete
8. **ALMEffectivenessDialog** - Tests exist but need expansion
9. **ALMExtensionIframeDialog** - Complex, needs special attention

---

## Testing Patterns

### 1. Simple Components (ALMBackButton, ALMImage)
```typescript
// Full unit test coverage
describe('ComponentName', () => {
  describe('Rendering', () => { ... });
  describe('User Interactions', () => { ... });
  describe('Accessibility', () => { ... });
  describe('Edge Cases', () => { ... });
});
```

### 2. Dialog Components (AlmModalDialog, ALMEffectivenessDialog)
```typescript
// Focus on modal behavior
describe('ComponentName', () => {
  describe('Modal Lifecycle', () => { ... });
  describe('Close Behavior', () => { ... });
  describe('Focus Management', () => { ... });
  describe('Overlay Interactions', () => { ... });
});
```

### 3. Error Boundary
```typescript
// Test error catching
describe('ALMErrorBoundary', () => {
  describe('Error Catching', () => { ... });
  describe('Fallback UI', () => { ... });
  describe('Error Reporting', () => { ... });
});
```

---

## Running Tests

### Run all Common component tests
```bash
cd ui.frontend
npm test -- tests/components/Common --watchAll=false
```

### Run specific component tests
```bash
npm test -- ALMBackButton --watchAll=false
npm test -- ALMImage --watchAll=false
npm test -- ALMLoader --watchAll=false
```

### Run with coverage
```bash
npm test -- tests/components/Common --coverage --watchAll=false
```

---

## Next Steps

### Immediate Actions
1. ✅ Complete ALMBackButton (Done - 100%)
2. ✅ Complete ALMImage (Done - 100%)
3. ⚠️ Fix ALMLoader failing tests (Currently 17/33)
4. 📝 Improve ALMTooltip coverage
5. 📝 Improve AlmModalDialog coverage

### Future Enhancements
1. Add integration tests for component combinations
2. Add visual regression tests
3. Add performance benchmarks
4. Document best practices learned

---

## Best Practices

### 1. Provider Setup
Create a reusable render helper:
```typescript
const renderWithProviders = (component) => {
  return render(
    <SpectrumProvider theme={defaultTheme}>
      <IntlProvider locale="en" messages={messages}>
        {component}
      </IntlProvider>
    </SpectrumProvider>
  );
};
```

### 2. Icon Mocking
Mock Spectrum icons for faster tests:
```typescript
jest.mock('@spectrum-icons/workflow/IconName', () => {
  return function IconName() {
    return <svg data-testid="icon-name">Icon</svg>;
  };
});
```

### 3. Accessibility Testing
Always include:
```typescript
describe('Accessibility', () => {
  it('should have proper ARIA attributes', () => { ... });
  it('should be keyboard accessible', () => { ... });
  it('should manage focus correctly', () => { ... });
});
```

---

## Related Documentation

- [Master Test Plan Index](../MASTER_TEST_PLAN_INDEX.md)
- [Component Hierarchy](../COMPONENT_HIERARCHY.md)
- [Testing Best Practices](../../README.md)

---

**Last Updated**: January 5, 2026  
**Maintained By**: Adobe Learning Manager Team  
**Status**: In Progress

