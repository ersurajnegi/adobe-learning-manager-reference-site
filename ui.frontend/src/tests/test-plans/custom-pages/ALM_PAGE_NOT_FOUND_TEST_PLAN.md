# ALMPageNotFound Component Test Plan

## Component Overview

**File**: `src/almLib/components/CustomPages/ALMPageNotFound/ALMPageNotFound.tsx`

**Purpose**: A 404 error page component that displays when a custom page is not found. Shows a message, image, and optional navigation link back to a home/default page.

**Key Features**:
- Displays "Page Not Found" message with translation support
- Shows decorative image
- Optional navigation link with custom page name
- Helper function to get localized page names
- Uses React.memo for performance optimization

**Key Dependencies**:
- `GetTranslation`, `GetTranslationsReplaced` - Translation utilities
- `LEFT_ARROW_SVG` - SVG utility function
- `getLocalizedData` - Localization helper
- `getALMConfig` - Configuration getter
- `PrimePage` - Page model interface

## Component Props Interface

```typescript
interface ALMPageNotFoundProps {
  url?: string;  // Optional URL for navigation link
  page?: PrimePage;  // Optional page object for navigation
  showNavigationLink?: boolean;  // Whether to show navigation link
  handleNavigation?: (event: React.MouseEvent<HTMLAnchorElement>, page: PrimePage) => void;
}

// Helper function
const getPageName = (page: PrimePage): string => { ... };
```

## Test Strategy

### Coverage Goals
- **Line Coverage**: > 70% (Target: 95%+)
- **Branch Coverage**: > 70% (Target: 90%+)
- **Function Coverage**: > 70% (Target: 100%)
- **Statement Coverage**: > 70% (Target: 95%+)

### Key Test Areas (Priority Order)

#### High Priority
1. Basic rendering without props
2. Rendering with all props
3. Navigation link conditional rendering
4. `getPageName` helper function logic
5. Translation integration
6. Navigation handler invocation

#### Medium Priority
1. Image rendering and accessibility
2. Default prop values
3. React.memo optimization
4. URL handling

#### Low Priority
1. Edge cases for page name resolution
2. Complex page objects

## Test Data Setup

```typescript
const mockPrimePage: PrimePage = {
  id: 'page-123',
  pageType: 'HOME',
  isDefault: false,
  localizedMetadata: [
    { locale: 'en-US', name: 'Home Page' },
  ],
};

const mockHandleNavigation = jest.fn();

const mockGetALMConfig = {
  locale: 'en-US',
};
```

## Test Scenarios

### 1. Basic Rendering
- Renders without errors with no props
- Renders without errors with all props
- Renders centerWrapper
- Renders content container
- Renders message container
- Renders image container

### 2. Text Content
- Displays page not found title
- Displays page not found message
- Calls GetTranslation for title
- Calls GetTranslation for message

### 3. Image Rendering
- Renders image element
- Sets correct image src
- Sets alt text from translation
- Sets role="presentation"

### 4. Navigation Link
- Shows navigation link when showNavigationLink is true
- Hides navigation link when showNavigationLink is false
- Sets href to provided url
- Uses 'javascript:void(0)' when url is empty
- Calls handleNavigation on click

### 5. GetPageName Helper
- Returns HOME translation when page is undefined
- Returns HOME translation when page is null
- Returns translated page type for default pages
- Returns localized name for custom pages
- Uses correct locale from config

### 6. Navigation Link Text
- Uses GetTranslationsReplaced with page name
- Renders LEFT_ARROW_SVG icon
- Passes correct color to arrow SVG

### 7. React.memo
- Does not re-render with same props
- Re-renders with different props

## Success Criteria
- ✅ All tests pass
- ✅ Coverage exceeds 70%
- ✅ All rendering paths tested
- ✅ Helper function fully tested
- ✅ Navigation logic verified
- ✅ Accessibility validated

