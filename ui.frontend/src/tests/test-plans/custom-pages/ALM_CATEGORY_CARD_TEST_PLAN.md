# ALMCategoryCard Component Test Plan

## Component Overview

**File**: `src/almLib/components/CustomPages/ALMCategoryCard/ALMCategoryCard.tsx`

**Purpose**: Renders a category card that displays a catalog or custom category with an optional image, title, and description. The card is clickable and navigates to either a catalog page or a custom page based on the item's properties.

**Key Dependencies**:
- `useCategoryCard` hook from `hooks/customPages`
- `CategorySource` enum and `PrimeCatalog` type from `models`
- CSS Module for styling

## Component Props Interface

```typescript
interface ALMCategoryCardProps {
  item: PrimeCatalog | any;
  index: number;
  source: CategorySource;
  hideImage?: boolean;
  hideDescription?: boolean;
  disableLinks?: boolean;
}
```

## Component Structure

### Key Features
1. **Dynamic Card Rendering**: Displays category information with configurable visibility options
2. **Image Handling**: Shows background image with fallback to colored header
3. **Click Navigation**: Routes to catalog page or custom page based on item properties
4. **Accessibility**: Proper ARIA labels and keyboard navigation support
5. **Custom Hook Integration**: Uses `useCategoryCard` for data processing and navigation logic

### Component Flow
```
Props → useCategoryCard Hook → Render Logic → Event Handlers
                ↓
        Navigation Functions
```

## Test Strategy

### 1. Rendering Tests

#### 1.1 Basic Rendering
- [ ] Should render the card with all default props
- [ ] Should render card with catalog item (item.type === CATALOG)
- [ ] Should render card with custom page item (item.pageId present)
- [ ] Should apply correct automation IDs to elements
- [ ] Should render with correct index prop

#### 1.2 Conditional Rendering
- [ ] Should render image when imageUrl exists and hideImage is false
- [ ] Should not render image when hideImage is true
- [ ] Should render colored header when no imageUrl
- [ ] Should render description when hideDescription is false
- [ ] Should not render description when hideDescription is true
- [ ] Should hide description section when hideDescription is true

### 2. Image Handling Tests

#### 2.1 Image Display
- [ ] Should display background image with correct URL
- [ ] Should apply correct image height (IMAGE_HEIGHT)
- [ ] Should apply backgroundColor from color prop
- [ ] Should include role="img" and aria-label for accessibility
- [ ] Should apply centeredImage class when image exists

#### 2.2 Image Hidden State
- [ ] Should apply reduced height when hideImage is true
- [ ] Should not display background image when hideImage is true
- [ ] Should apply IMAGE_HIDDEN_HEIGHT when hideImage is true
- [ ] Should not apply backgroundColor when hideImage is true

#### 2.3 Fallback Header
- [ ] Should render fallback header when no imageUrl
- [ ] Should apply backgroundColor for fallback header
- [ ] Should apply correct height for fallback header

### 3. Content Display Tests

#### 3.1 Title Display
- [ ] Should display name from useCategoryCard hook
- [ ] Should apply title attribute with name value
- [ ] Should apply correct automation ID for title
- [ ] Should render title in correct styles container

#### 3.2 Description Display
- [ ] Should display description when not hidden
- [ ] Should apply title attribute with description value
- [ ] Should apply correct automation ID for description
- [ ] Should not render description element when hideDescription is true

### 4. Navigation Tests

#### 4.1 Click Handling
- [ ] Should call navigateToCustomPage when item has pageId
- [ ] Should call navigateToCatalog when item has no pageId
- [ ] Should not trigger navigation when disableLinks is true
- [ ] Should handle click on card anchor element
- [ ] Should call handleCardClick on click event

#### 4.2 Navigation Functions (from hook)
- [ ] Should call navigateToCustomPage with correct pageId
- [ ] Should call navigateToCatalog with correct parameters
- [ ] Should pass correct source parameter for navigation

### 5. Accessibility Tests

#### 5.1 Keyboard Navigation
- [ ] Should have tabIndex 0 when disableLinks is false
- [ ] Should have tabIndex -1 when disableLinks is true
- [ ] Should be keyboard accessible via Enter/Space keys
- [ ] Should render as anchor element for proper semantics

#### 5.2 ARIA Attributes
- [ ] Should have aria-label on image element
- [ ] Should have aria-hidden="true" on decorative image
- [ ] Should use proper role="img" for background images
- [ ] Should have title attributes for assistive technology

#### 5.3 Semantic HTML
- [ ] Should render as anchor (<a>) element
- [ ] Should have href attribute (JAVASCRIPT_VOID_0)
- [ ] Should maintain proper heading hierarchy

### 6. Hook Integration Tests

#### 6.1 useCategoryCard Hook
- [ ] Should call useCategoryCard with correct parameters
- [ ] Should pass item, source, and hideImage to hook
- [ ] Should receive imageHeight from hook
- [ ] Should receive imageUrl from hook
- [ ] Should receive color from hook
- [ ] Should receive name from hook
- [ ] Should receive description from hook
- [ ] Should receive id from hook
- [ ] Should receive navigateToCatalog function from hook
- [ ] Should receive navigateToCustomPage function from hook

### 7. Props Validation Tests

#### 7.1 Required Props
- [ ] Should handle item prop correctly
- [ ] Should handle index prop correctly
- [ ] Should handle source prop correctly

#### 7.2 Optional Props
- [ ] Should default hideImage to false
- [ ] Should default hideDescription to false
- [ ] Should default disableLinks to false
- [ ] Should handle hideImage prop when true
- [ ] Should handle hideDescription prop when true
- [ ] Should handle disableLinks prop when true

### 8. CategorySource Tests

#### 8.1 Source Types
- [ ] Should handle CategorySource.CATALOGS
- [ ] Should handle CategorySource.PRODUCTS
- [ ] Should handle CategorySource.ROLES
- [ ] Should pass source correctly to useCategoryCard hook

### 9. Styling Tests

#### 9.1 CSS Modules
- [ ] Should apply container class
- [ ] Should apply cardContainer class
- [ ] Should apply card class
- [ ] Should apply header class
- [ ] Should apply content class
- [ ] Should apply title class
- [ ] Should apply description class

#### 9.2 Dynamic Styles
- [ ] Should apply inline height style to image
- [ ] Should apply inline backgroundColor style
- [ ] Should apply inline backgroundImage style with URL
- [ ] Should combine multiple classes correctly (header + centeredImage)

### 10. Edge Cases and Error Handling

#### 10.1 Missing Data
- [ ] Should handle missing imageUrl gracefully
- [ ] Should handle missing description gracefully
- [ ] Should handle missing name gracefully
- [ ] Should handle missing pageId gracefully
- [ ] Should handle undefined item properties

#### 10.2 Invalid Props
- [ ] Should handle null item prop
- [ ] Should handle undefined source prop
- [ ] Should handle negative index
- [ ] Should handle empty string values

#### 10.3 Hook Failures
- [ ] Should handle useCategoryCard hook returning null values
- [ ] Should handle useCategoryCard hook throwing errors

### 11. Integration Tests

#### 11.1 Full Component Flow
- [ ] Should render complete card with all elements
- [ ] Should handle full user interaction flow (click → navigate)
- [ ] Should update on prop changes
- [ ] Should maintain state consistency

#### 11.2 Multiple Instances
- [ ] Should render multiple cards with different indices
- [ ] Should maintain unique automation IDs per card
- [ ] Should handle different items correctly

## Test Data Setup

### Mock Data

```typescript
// Mock PrimeCatalog item
const mockCatalogItem = {
  id: 'catalog-123',
  name: 'Test Catalog',
  description: 'Test catalog description',
  type: 'CATALOG',
  imageUrl: 'https://example.com/image.jpg',
  contentImageUrl: 'https://example.com/catalog-image.jpg',
  isDefault: false,
  isListable: true,
  state: 'ACTIVE',
  dateCreated: '2024-01-01',
  dateUpdated: '2024-01-02',
};

// Mock custom page item
const mockCustomPageItem = {
  id: 'page-456',
  name: 'Custom Page Category',
  description: 'Custom page description',
  imageUrl: 'https://example.com/page-image.jpg',
  pageId: 'custom-page-123',
};

// Mock useCategoryCard hook return
const mockUseCategoryCard = {
  imageHeight: 160,
  imageUrl: 'https://example.com/image.jpg',
  color: '#FF5733',
  name: 'Test Category',
  description: 'Test description',
  id: 'test-123',
  navigateToCatalog: jest.fn(),
  navigateToCustomPage: jest.fn(),
};
```

### Mock Setup

```typescript
// Mock useCategoryCard hook
jest.mock('../../../hooks/customPages', () => ({
  useCategoryCard: jest.fn(),
}));

// Mock CSS module
jest.mock('./ALMCategoryCard.module.css', () => ({
  container: 'container',
  cardContainer: 'cardContainer',
  card: 'card',
  header: 'header',
  centeredImage: 'centeredImage',
  content: 'content',
  title: 'title',
  description: 'description',
}));
```

## Coverage Goals

- **Line Coverage**: > 70% (Target: 95%+)
- **Branch Coverage**: > 70% (Target: 90%+)
- **Function Coverage**: > 70% (Target: 100%)
- **Statement Coverage**: > 70% (Target: 95%+)

## Key Test Scenarios Priority

### High Priority
1. Basic rendering with different item types
2. Click navigation (catalog vs custom page)
3. Conditional rendering (hideImage, hideDescription, disableLinks)
4. Accessibility (tabIndex, ARIA attributes)
5. Hook integration with correct parameters

### Medium Priority
1. Image display and fallback logic
2. Dynamic styling (inline styles)
3. CSS class applications
4. Content display (title, description)
5. CategorySource variations

### Low Priority
1. Edge cases with missing data
2. Multiple card instances
3. Invalid prop handling
4. Complex integration scenarios

## Known Issues and Considerations

1. **Hook Dependency**: Component heavily relies on `useCategoryCard` hook, which needs comprehensive mocking
2. **Navigation Functions**: Need to mock `alm.navigateToCatalogPage` and `alm.navigateToCustomPage` from global ALM object
3. **CSS Modules**: CSS module classes need to be mocked for proper testing
4. **Dynamic IDs**: Automation IDs are generated dynamically based on name, need to test with various name formats
5. **Type Safety**: Item prop accepts `PrimeCatalog | any`, tests should cover both typed and generic items

## Test Execution Order

1. Set up all mocks and test data
2. Test basic rendering
3. Test hook integration
4. Test conditional rendering
5. Test navigation logic
6. Test accessibility
7. Test edge cases
8. Verify coverage meets threshold

## Success Criteria

- ✅ All tests pass
- ✅ Coverage exceeds 70% on all metrics
- ✅ No console errors or warnings
- ✅ Accessibility requirements met
- ✅ Navigation logic properly tested
- ✅ Edge cases handled gracefully

