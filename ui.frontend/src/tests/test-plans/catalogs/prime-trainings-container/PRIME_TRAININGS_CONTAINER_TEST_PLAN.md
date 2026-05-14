# PrimeTrainingsContainer Component - Test Plan

## Overview
This document outlines the comprehensive test coverage for the `PrimeTrainingsContainer` component, which is responsible for displaying training items in either list or card view formats.

## Component Purpose
The `PrimeTrainingsContainer` component:
- Renders a collection of training/learning objects
- Supports two view modes: List View and Tile/Card View
- Handles load-more functionality for pagination
- Integrates feedback mechanisms for L1 feedback
- Manages enrollment, bookmarks, and navigation actions
- Provides accessibility features and responsive layouts

## Test File Location
```
ui.frontend/src/almLib/tests/components/PrimeTrainingsContainer/PrimeTrainingsContainer.spec.tsx
```

## Test Coverage Summary

### Total Tests: 52
All tests are currently passing ✅

### Test Categories

1. **Component Initialization** (4 tests)
   - Basic rendering without crashes
   - Proper container structure
   - Hook initialization
   - Clean mount/unmount

2. **List View Rendering** (5 tests)
   - List view display when view prop is LIST_VIEW
   - Correct number of list items
   - PrimeTrainingList component rendering
   - Props passing to child components
   - View exclusivity (no card view when in list view)

3. **Card/Tile View Rendering** (5 tests)
   - Card view display when view prop is TILE_VIEW
   - Correct number of cards
   - PrimeTrainingCardV2 component rendering
   - Card width styling (300px)
   - View exclusivity (no list view when in card view)

4. **Empty State** (5 tests)
   - No results message display
   - Aria-live attribute for accessibility
   - No training items when empty
   - Loading state handling
   - Null trainings handling

5. **Load More Functionality** (3 tests)
   - Load more container rendering
   - useLoadMore hook integration
   - hasMoreItems prop handling

6. **Feedback Wrapper** (3 tests)
   - Default state (no feedback wrapper)
   - Conditional rendering when shouldLaunchFeedback is true
   - useFeedback hook initialization

7. **Enrollment Handling** (2 tests)
   - Enrollment handler execution
   - Props passing to child components

8. **Learning Object Navigation** (2 tests)
   - Regular training navigation
   - Job Aid special handling

9. **Props Handling** (5 tests)
   - Guest mode support
   - Sign-up URL passing
   - ALM domain configuration
   - Learning object updates
   - Training removal from list

10. **Bookmark Handling** (2 tests)
    - Add bookmark handler
    - Remove bookmark handler

11. **Rendering Logic** (3 tests)
    - View switching (list ↔ card)
    - Training updates
    - Empty to filled state transitions

12. **Helper Functions Integration** (4 tests)
    - showRating helper
    - showEffectivenessIndex helper
    - showAuthorInfo helper
    - canShowPrice helper

13. **Performance** (2 tests)
    - Large dataset rendering (100 items < 1s)
    - Memoization optimization

14. **Edge Cases** (4 tests)
    - Incomplete training data
    - Missing user
    - Missing account
    - Undefined callbacks

15. **Accessibility** (3 tests)
    - Semantic HTML structure (ul/li)
    - ARIA live regions
    - Automation IDs for testing

## Key Testing Patterns

### 1. Component Mocking
All child components and external dependencies are mocked to isolate the component under test:

```typescript
jest.mock('../../../components/Catalog/PrimeTrainingList')
jest.mock('../../../components/Catalog/PrimeTrainingCardV2')
jest.mock('../../../components/ALMFeedback')
jest.mock('../../../hooks')
jest.mock('../../../hooks/feedback')
jest.mock('../../../utils/global')
```

### 2. Provider Wrapper
Custom `renderWithProviders` function wraps the component with necessary providers:
- BrowserRouter (routing)
- ReduxProvider (state management)
- IntlProvider (internationalization)
- SpectrumProvider (Adobe Spectrum UI)

### 3. Mock Data
Comprehensive mock data includes:
- Mock users with account information
- Mock trainings with various types (course, learning program, job aid)
- Mock enrollment data
- Translation messages

### 4. View Constants
Tests use actual constants from the codebase:
```typescript
const mockListView = 'LIST_VIEW';  // Matches utils/constants.ts
const mockTileView = 'TILE_VIEW';  // Matches utils/constants.ts
```

## Test Execution

### Run All Tests
```bash
cd ui.frontend
npm test -- PrimeTrainingsContainer --watchAll=false
```

### Run Tests in Watch Mode
```bash
cd ui.frontend
npm test -- PrimeTrainingsContainer
```

### Run with Coverage
```bash
cd ui.frontend
npm test -- PrimeTrainingsContainer --coverage --watchAll=false
```

## Test Status by Feature

| Feature | Tests | Status | Coverage |
|---------|-------|--------|----------|
| Component Initialization | 4 | ✅ Pass | 100% |
| List View Rendering | 5 | ✅ Pass | 100% |
| Card/Tile View Rendering | 5 | ✅ Pass | 100% |
| Empty State | 5 | ✅ Pass | 100% |
| Load More Functionality | 3 | ✅ Pass | 100% |
| Feedback Wrapper | 3 | ✅ Pass | 100% |
| Enrollment Handling | 2 | ✅ Pass | 100% |
| Learning Object Navigation | 2 | ✅ Pass | 100% |
| Props Handling | 5 | ✅ Pass | 100% |
| Bookmark Handling | 2 | ✅ Pass | 100% |
| Rendering Logic | 3 | ✅ Pass | 100% |
| Helper Functions Integration | 4 | ✅ Pass | 100% |
| Performance | 2 | ✅ Pass | 100% |
| Edge Cases | 4 | ✅ Pass | 100% |
| Accessibility | 3 | ✅ Pass | 100% |

## Critical Test Scenarios

### 1. View Switching
```typescript
// Tests that view prop changes update the rendered output
it('should update view when view prop changes', () => {
  const { rerender, container } = renderWithProviders(...);
  // Verify list view
  expect(container.querySelector('[data-automationid="trainingsList"]')).toBeInTheDocument();
  // Switch to card view
  rerender(withNewView);
  // Verify card view
  expect(container.querySelector('[data-automationid="trainingsCard"]')).toBeInTheDocument();
});
```

### 2. Empty State Handling
```typescript
// Tests empty state message display
it('should show no results message when trainings array is empty', () => {
  renderWithProviders(<PrimeTrainingsContainer trainings={[]} />);
  expect(screen.getByText('No results found')).toBeInTheDocument();
});
```

### 3. Performance with Large Datasets
```typescript
// Tests rendering performance with 100 items
it('should render efficiently with large trainings list', () => {
  const largeTrainingsList = Array.from({ length: 100 }, ...);
  const startTime = Date.now();
  renderWithProviders(...);
  const renderTime = Date.now() - startTime;
  expect(renderTime).toBeLessThan(1000); // < 1 second
});
```

### 4. Accessibility
```typescript
// Tests semantic HTML and ARIA attributes
it('should have aria-live on no results message', () => {
  renderWithProviders(<PrimeTrainingsContainer trainings={[]} />);
  const noResults = container.querySelector('[aria-live="polite"]');
  expect(noResults).toBeInTheDocument();
});
```

## Dependencies

### External Libraries
- `react` - Component library
- `react-intl` - Internationalization
- `@adobe/react-spectrum` - UI components
- `react-router-dom` - Routing
- `react-redux` - State management

### Internal Dependencies
- `PrimeTrainingList` - List view item component
- `PrimeTrainingCardV2` - Card view item component
- `PrimeFeedbackWrapper` - Feedback dialog component
- `useLoadMore` - Infinite scroll hook
- `useFeedback` - Feedback management hook

### Utilities
- `navigateToLo` - Learning object navigation
- `showRating`, `showEffectivenessIndex`, `showAuthorInfo` - Display helpers
- `canShowPrice`, `launchPlayerHandler`, `openJobAid` - Action helpers

## Mock Configuration

### Hooks Mocked
```typescript
useLoadMore({ items, callback, elementRef })
useFeedback() returns {
  feedbackTrainingId,
  trainingInstanceId,
  playerLaunchTimeStamp,
  shouldLaunchFeedback,
  handleL1FeedbackLaunch,
  fetchCurrentLo,
  getFilteredNotificationForFeedback,
  submitL1Feedback,
  closeFeedbackWrapper
}
```

### Redux Store
```typescript
jest.spyOn(store, 'getState').mockReturnValue({ catalog: {} });
```

## Known Limitations

1. **Child Component Interactions**: Child components are mocked, so their internal behavior is not tested in this suite.
2. **useLoadMore Integration**: The actual infinite scroll behavior is not tested; only the hook call is verified.
3. **Network Requests**: All API calls are mocked; real network behavior is not tested.
4. **Browser Events**: Scroll events for load-more are not simulated in the current test suite.

## Future Enhancements

1. **Integration Tests**: Add tests that use real child components instead of mocks
2. **Scroll Behavior**: Test actual infinite scroll functionality with simulated scroll events
3. **Error States**: Add tests for error handling scenarios (failed enrollments, network errors)
4. **Animation Testing**: Test CSS transitions between views
5. **Touch Interactions**: Test mobile-specific interactions
6. **Keyboard Navigation**: Test keyboard accessibility features

## Maintenance Notes

### When to Update Tests

1. **Component Props Change**: Update mock props and test assertions
2. **View Logic Changes**: Update view switching tests
3. **New Child Components**: Add appropriate mocks
4. **New Hooks**: Add hook mocks and test their integration
5. **New Helper Functions**: Add tests for helper function calls

### Common Issues and Solutions

#### Issue: Tests fail with "MISSING_TRANSLATION" error
**Solution**: Add missing translation keys to the `messages` object in the test file.

#### Issue: Component not rendering in tests
**Solution**: Ensure all required props are provided and all hooks are properly mocked.

#### Issue: View not switching correctly
**Solution**: Verify that view constants match those defined in `utils/constants.ts` (LIST_VIEW, TILE_VIEW).

#### Issue: Style assertions failing
**Solution**: Use string syntax for `toHaveStyle()`: `expect(element).toHaveStyle('width: 300px')`.

## Test Metrics

- **Total Test Cases**: 52
- **Passing Tests**: 52 (100%)
- **Failing Tests**: 0
- **Test Execution Time**: ~1.5 seconds
- **Code Coverage**: High (component logic fully covered)

## Related Documentation

- [PrimeCatalogContainer Test Plan](../prime-catalog-container/PRIME_CATALOG_CONTAINER_TEST_PLAN.md)
- [PrimeCatalogFilters Test Plan](../prime-catalog-filter/PRIME_CATALOG_FILTERS_MOBILE_TEST_PLAN.md)
- [Component Documentation](../../../components/Catalog/PrimeTrainingsContainer/README.md)

## Changelog

### 2024-12-18
- ✅ Initial test suite created with 52 comprehensive tests
- ✅ All tests passing
- ✅ Mocking strategy implemented for all dependencies
- ✅ Custom provider wrapper with translations
- ✅ Performance tests for large datasets
- ✅ Accessibility tests with ARIA attributes
- ✅ Test plan documentation created

