# ALMCategoryWidget Component Test Plan

## Component Overview

**File**: `src/almLib/components/CustomPages/ALMCategoryWidget/ALMCategoryWidget.tsx`

**Purpose**: A widget that displays a horizontal scrollable strip of category cards. It integrates multiple custom hooks for data fetching, scrolling behavior, and inspect mode. The widget supports navigation icons and renders different content based on data state (loading, has items, no access).

**Key Dependencies**:
- `useALMCategoryWidget` - Data fetching and state management
- `useStripScroll` - Horizontal scroll and navigation logic
- `useWidgetInspectMode` - Inspect mode for widget editing
- `ALMCategoryCard` - Individual card component
- `ALMStripWidgetHeader` - Widget header with navigation
- `ALMWidgetLoader` - Loading state component
- `ALMNoAccessContainer` - Empty state component
- `ALMWidgetInspectMode` - Inspect overlay component

## Component Props Interface

```typescript
interface ALMCategoryWidgetProps {
  widget: CustomWidget;
  disableLinks?: boolean;
  isInspectMode?: boolean;
}
```

## Component Structure

### Key Features
1. **Data Fetching**: Uses `useALMCategoryWidget` to fetch and manage category items
2. **Horizontal Scrolling**: Implements strip scroll with navigation arrows
3. **Responsive Layout**: Calculates items per page based on container width
4. **Inspect Mode**: Shows widget editing overlay when hovered in inspect mode
5. **Loading States**: Shows loader, items, or empty state based on data
6. **Auto-fetch**: Automatically fetches more items when needed

### Component Flow
```
Props → Hooks → State Management → Rendering Logic
    ↓
Data Fetching → Items Display → Navigation
    ↓
Event Handlers → Scroll Behavior
```

## Test Strategy

### 1. Rendering Tests

#### 1.1 Basic Rendering
- [ ] Should render widget container with correct structure
- [ ] Should render with widget prop
- [ ] Should apply correct section ID from widget.id
- [ ] Should apply correct aria-labelledby
- [ ] Should render ALMStripWidgetHeader component
- [ ] Should render card container with correct ID

#### 1.2 Conditional Rendering
- [ ] Should render items when hasWidgetItems is true
- [ ] Should render loader when fetchingData is true
- [ ] Should render ALMNoAccessContainer when no items and not fetching
- [ ] Should not render inspect mode overlay when isInspectMode is false
- [ ] Should render inspect mode overlay when isInspectMode and isHovered
- [ ] Should not render inspect mode overlay when isInspectMode but not hovered

### 2. Hook Integration Tests

#### 2.1 useALMCategoryWidget Hook
- [ ] Should call useALMCategoryWidget with widget prop
- [ ] Should receive fetchingData from hook
- [ ] Should receive items array from hook
- [ ] Should receive fetchMore function from hook
- [ ] Should receive searchString from hook
- [ ] Should handle empty items array
- [ ] Should handle populated items array

#### 2.2 useStripScroll Hook
- [ ] Should call useStripScroll with correct parameters
- [ ] Should pass CARD_WIDTH to useStripScroll
- [ ] Should pass items to useStripScroll
- [ ] Should pass fetchingData to useStripScroll
- [ ] Should pass fetchMore to useStripScroll
- [ ] Should pass searchString to useStripScroll
- [ ] Should receive rollContainer ref from hook
- [ ] Should receive onScroll handler from hook
- [ ] Should receive rollAPage function from hook
- [ ] Should receive isLeftNavIconDisabled function from hook
- [ ] Should receive isRightNavIconDisabled function from hook
- [ ] Should receive updateItemsPerPage function from hook
- [ ] Should receive itemsPerPage from hook

#### 2.3 useWidgetInspectMode Hook
- [ ] Should call useWidgetInspectMode with sectionRef
- [ ] Should receive isHovered from hook
- [ ] Should receive widgetContainerWidth from hook
- [ ] Should receive widgetContainerHeight from hook
- [ ] Should receive changeHoverState from hook

### 3. Translation and ID Tests

#### 3.1 GetTranslation
- [ ] Should call GetTranslation for heading with widget.id
- [ ] Should call GetTranslation for description with widget.id
- [ ] Should use translated heading in header component
- [ ] Should use translated description in header component

#### 3.2 ID Generation
- [ ] Should generate correct nameId from widget.id
- [ ] Should generate correct cardContainerId from heading
- [ ] Should apply nameId to aria-labelledby attribute
- [ ] Should apply cardContainerId to card container

### 4. Items Rendering Tests

#### 4.1 Card Rendering
- [ ] Should render ALMCategoryCard for each item
- [ ] Should pass correct item prop to each card
- [ ] Should pass correct index to each card
- [ ] Should pass CategorySource from widget attributes
- [ ] Should calculate hideImage from attributes.showImage
- [ ] Should calculate hideDescription from attributes.showDescription
- [ ] Should pass disableLinks prop to cards
- [ ] Should render cards in list items
- [ ] Should apply correct key to each list item
- [ ] Should apply data-index attribute to list items

#### 4.2 Row Template
- [ ] Should wrap items in stripCardContainerRow div
- [ ] Should render ul with cardRow class
- [ ] Should render li for each item
- [ ] Should apply loCard and catalogCard classes

### 5. Navigation Tests

#### 5.1 Navigation Icons
- [ ] Should show nav icons when items.length > itemsPerPage
- [ ] Should not show nav icons when items.length <= itemsPerPage
- [ ] Should pass showNavIcons to header
- [ ] Should call isLeftNavIconDisabled for left nav state
- [ ] Should call isRightNavIconDisabled for right nav state
- [ ] Should pass rollAPage to header for navigation

#### 5.2 Scroll Behavior
- [ ] Should attach onScroll handler to card container
- [ ] Should call onScroll when container scrolls
- [ ] Should apply rollContainer ref to card container

### 6. Data Fetching Tests

#### 6.1 Initial Fetch
- [ ] Should call fetchMore on mount when items < itemsPerPage * 2
- [ ] Should pass searchString to fetchMore
- [ ] Should handle fetchMore with empty search string

#### 6.2 Auto-fetch Logic
- [ ] Should trigger useEffect when items array changes
- [ ] Should compare items.length with itemsPerPage * 2
- [ ] Should call fetchMore when threshold met
- [ ] Should not call fetchMore when threshold not met

### 7. Responsive Layout Tests

#### 7.1 Items Per Page Calculation
- [ ] Should calculate items per page based on widgetContainerWidth
- [ ] Should use CARD_WIDTH for calculations
- [ ] Should use CARD_WIDTH_EXCLUDING_PADDING for calculations
- [ ] Should call updateItemsPerPage with calculated value
- [ ] Should handle widgetContainerWidth of 0
- [ ] Should handle undefined widgetContainerWidth
- [ ] Should recalculate when widgetContainerWidth changes

#### 7.2 Container Width Effect
- [ ] Should trigger useEffect when widgetContainerWidth changes
- [ ] Should calculate noCardsWithGap correctly
- [ ] Should calculate cardWithoutGap correctly
- [ ] Should update itemsPerPage through hook

### 8. Inspect Mode Tests

#### 8.1 Hover State
- [ ] Should call changeHoverState on mouse enter
- [ ] Should call changeHoverState on mouse leave
- [ ] Should attach onMouseEnter to section
- [ ] Should attach onMouseLeave to section

#### 8.2 Inspect Overlay
- [ ] Should render ALMWidgetInspectMode when conditions met
- [ ] Should pass widget prop to inspect mode
- [ ] Should pass widgetContainerWidth to inspect mode
- [ ] Should pass widgetContainerHeight to inspect mode
- [ ] Should not render when isInspectMode is false
- [ ] Should not render when isHovered is false
- [ ] Should render only when both isInspectMode and isHovered are true

### 9. Props Validation Tests

#### 9.1 Required Props
- [ ] Should render with widget prop
- [ ] Should handle widget.id correctly
- [ ] Should handle widget.attributes correctly
- [ ] Should handle widget.widgetRef correctly

#### 9.2 Optional Props
- [ ] Should default disableLinks to undefined
- [ ] Should default isInspectMode to false
- [ ] Should handle disableLinks when true
- [ ] Should handle isInspectMode when true
- [ ] Should pass disableLinks to all cards

### 10. Widget Attributes Tests

#### 10.1 CategoryWidgetAttributes
- [ ] Should extract source from widget.attributes
- [ ] Should extract showImage from widget.attributes
- [ ] Should extract showDescription from widget.attributes
- [ ] Should handle missing showImage (default behavior)
- [ ] Should handle missing showDescription (default behavior)
- [ ] Should invert showImage to hideImage for cards
- [ ] Should invert showDescription to hideDescription for cards

#### 10.2 CategorySource Types
- [ ] Should handle CategorySource.CATALOGS
- [ ] Should handle CategorySource.PRODUCTS
- [ ] Should handle CategorySource.ROLES
- [ ] Should pass source to each card component

### 11. Header Component Tests

#### 11.1 Props Passing
- [ ] Should pass heading to ALMStripWidgetHeader
- [ ] Should pass widgetId to ALMStripWidgetHeader
- [ ] Should pass widgetDescription to ALMStripWidgetHeader
- [ ] Should pass isLeftNavIconDisabled result to header
- [ ] Should pass isRightNavIconDisabled result to header
- [ ] Should pass rollAPage function to header
- [ ] Should pass showNavIcons boolean to header

### 12. Loading States Tests

#### 12.1 Loader
- [ ] Should render ALMWidgetLoader in loading container
- [ ] Should apply loadingContainerSection class when loading
- [ ] Should show loader only when fetchingData is true
- [ ] Should not show items when loading
- [ ] Should not show no access when loading

#### 12.2 Empty State
- [ ] Should render ALMNoAccessContainer when no items
- [ ] Should show empty state when not loading and no items
- [ ] Should not show empty state when has items
- [ ] Should not show empty state when loading

#### 12.3 Items State
- [ ] Should render items when hasWidgetItems is true
- [ ] Should not render loader when has items
- [ ] Should not render empty state when has items

### 13. CSS Classes Tests

#### 13.1 Container Classes
- [ ] Should apply container class to section
- [ ] Should apply stripCardContainer class to card container
- [ ] Should apply stripCardContainerRow class to row div
- [ ] Should apply cardRow class to ul
- [ ] Should apply loCard class to card wrapper
- [ ] Should apply catalogCard class to card wrapper
- [ ] Should apply loadingContainerSection when loading

### 14. Accessibility Tests

#### 14.1 ARIA Attributes
- [ ] Should have aria-labelledby on section
- [ ] Should reference correct nameId in aria-labelledby
- [ ] Should have id attribute on section
- [ ] Should have tabIndex -1 on card container

#### 14.2 Semantic HTML
- [ ] Should use section element for widget
- [ ] Should use ul for card list
- [ ] Should use li for each card item
- [ ] Should use ref for section element

### 15. Ref Management Tests

#### 15.1 Refs
- [ ] Should create widgetsectionRef using useRef
- [ ] Should attach widgetsectionRef to section element
- [ ] Should pass rollContainer ref to card container
- [ ] Should pass widgetsectionRef to useWidgetInspectMode

### 16. Edge Cases and Error Handling

#### 16.1 Empty/Null Data
- [ ] Should handle empty items array
- [ ] Should handle undefined items
- [ ] Should handle null widget attributes
- [ ] Should handle missing widget.attributes.source
- [ ] Should handle missing widget.attributes.showImage
- [ ] Should handle missing widget.attributes.showDescription

#### 16.2 Invalid Props
- [ ] Should handle null widget prop
- [ ] Should handle undefined widget.id
- [ ] Should handle empty heading from translation
- [ ] Should handle empty description from translation

#### 16.3 Hook Failures
- [ ] Should handle useALMCategoryWidget returning empty state
- [ ] Should handle useStripScroll returning default values
- [ ] Should handle useWidgetInspectMode returning default values

### 17. Callback Tests

#### 17.1 rowTemplate Callback
- [ ] Should memoize rowTemplate with useCallback
- [ ] Should render provided items in template
- [ ] Should call getItemTemplate for each item
- [ ] Should return correct JSX structure

#### 17.2 getItemTemplate Function
- [ ] Should return ALMCategoryCard component
- [ ] Should extract attributes from widget
- [ ] Should calculate hideImage correctly
- [ ] Should calculate hideDescription correctly
- [ ] Should pass all required props to card

### 18. Integration Tests

#### 18.1 Full Widget Flow
- [ ] Should render complete widget with all components
- [ ] Should handle data fetch → display → navigation flow
- [ ] Should integrate all hooks correctly
- [ ] Should pass props through component tree

#### 18.2 User Interaction Flow
- [ ] Should handle scroll → fetch more → update display
- [ ] Should handle hover → show inspect mode
- [ ] Should handle navigation click → scroll pages

## Test Data Setup

### Mock Data

```typescript
// Mock widget
const mockWidget: CustomWidget = {
  id: 'test-widget-123',
  widgetRef: 'category-widget',
  attributes: {
    source: CategorySource.CATALOGS,
    showImage: true,
    showDescription: true,
  },
};

// Mock items
const mockItems = [
  {
    id: 'item-1',
    name: 'Category 1',
    description: 'Description 1',
    imageUrl: 'https://example.com/image1.jpg',
  },
  {
    id: 'item-2',
    name: 'Category 2',
    description: 'Description 2',
    imageUrl: 'https://example.com/image2.jpg',
  },
];

// Mock hook returns
const mockUseALMCategoryWidget = {
  fetchingData: false,
  items: mockItems,
  fetchMore: jest.fn(),
  searchString: '',
};

const mockUseStripScroll = {
  rollContainer: { current: null },
  onScroll: jest.fn(),
  rollAPage: jest.fn(),
  isLeftNavIconDisabled: jest.fn(() => true),
  isRightNavIconDisabled: jest.fn(() => false),
  updateItemsPerPage: jest.fn(),
  itemsPerPage: 4,
};

const mockUseWidgetInspectMode = {
  isHovered: false,
  widgetContainerWidth: 1200,
  widgetContainerHeight: 400,
  changeHoverState: jest.fn(),
};
```

### Mock Setup

```typescript
// Mock all hooks
jest.mock('../../../hooks/customPages/useALMCategoryWidget');
jest.mock('../../../hooks/customPages/useStripScroll');
jest.mock('../../../hooks/customPages/useALMInspectMode');

// Mock child components
jest.mock('../ALMCategoryCard');
jest.mock('../ALMStripWidgetHeader/ALMStripWidgetHeader');
jest.mock('../ALMNoAccessContainer/ALMNoAccessContainer');
jest.mock('../ALMWidgetInspectMode/ALMWidgetInspectMode');
jest.mock('../ALMWidgetLoader');

// Mock translation service
jest.mock('../../../utils/translationService');

// Mock CSS module
jest.mock('./ALMCategoryWidget.module.css', () => ({
  container: 'container',
  stripCardContainer: 'stripCardContainer',
  stripCardContainerRow: 'stripCardContainerRow',
  cardRow: 'cardRow',
  loCard: 'loCard',
  catalogCard: 'catalogCard',
  loadingContainerSection: 'loadingContainerSection',
}));
```

## Coverage Goals

- **Line Coverage**: > 70% (Target: 95%+)
- **Branch Coverage**: > 70% (Target: 90%+)
- **Function Coverage**: > 70% (Target: 100%)
- **Statement Coverage**: > 70% (Target: 95%+)

## Key Test Scenarios Priority

### High Priority
1. Basic rendering with hooks integration
2. Items rendering with correct props
3. Loading states (loader, items, empty)
4. Navigation icons visibility logic
5. Data fetching and auto-fetch behavior

### Medium Priority
1. Inspect mode rendering and hover behavior
2. Responsive layout calculations
3. Translation service integration
4. Widget attributes extraction
5. Callback memoization

### Low Priority
1. Edge cases with null/undefined data
2. Ref management
3. CSS class applications
4. Complex integration scenarios

## Known Issues and Considerations

1. **Multiple Hook Dependencies**: Component relies on three custom hooks, all need proper mocking
2. **useEffect with items Dependency**: May cause infinite loops if not properly tested
3. **Complex Width Calculations**: itemsPerPage calculation involves multiple factors
4. **Conditional Rendering Logic**: Three different render states (items, loading, empty)
5. **Ref Forwarding**: rollContainer ref needs to be properly handled in tests

## Test Execution Order

1. Set up all mocks and test data
2. Test basic rendering
3. Test hook integrations
4. Test items rendering
5. Test navigation logic
6. Test data fetching
7. Test responsive behavior
8. Test inspect mode
9. Test edge cases
10. Verify coverage

## Success Criteria

- ✅ All tests pass
- ✅ Coverage exceeds 70% on all metrics
- ✅ No console errors or warnings
- ✅ All hooks properly integrated
- ✅ All rendering states tested
- ✅ Edge cases handled gracefully

