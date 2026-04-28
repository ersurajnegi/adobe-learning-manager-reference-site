# ALMNoAccessContainer Component Test Plan

## Component Overview

**File**: `src/almLib/components/CustomPages/ALMNoAccessContainer/ALMNoAccessContainer.tsx`

**Purpose**: A simple presentational component that displays a "No Access" message with an info icon. Used when users don't have permission to view certain widgets or content.

**Key Features**:
- Displays info icon from Adobe Spectrum
- Shows translated "No Access" message
- Provides accessibility via aria-label
- Simple stateless component with no props

**Key Dependencies**:
- `@spectrum-icons/workflow/Info` - Icon component
- `GetTranslation` - Translation utility for i18n

## Component Props Interface

```typescript
// No props - stateless functional component
const ALMNoAccessContainer = () => { ... };
```

## Test Strategy

### Coverage Goals
- **Line Coverage**: > 70% (Target: 100%)
- **Branch Coverage**: > 70% (Target: 100%)
- **Function Coverage**: > 70% (Target: 100%)
- **Statement Coverage**: > 70% (Target: 100%)

### Key Test Areas (Priority Order)

#### High Priority
1. Component rendering
2. CSS class application
3. Icon rendering
4. Translation integration
5. Accessibility attributes

#### Medium Priority
1. Visual structure verification
2. Multiple render consistency

#### Low Priority
1. Snapshot testing (optional)

## Test Data Setup

```typescript
const mockGetTranslation = jest.fn((key: string) => `Translated: ${key}`);

// Mock expected values
const expectedTranslationKey = 'alm.default.widget.noAccess';
const expectedTranslation = 'Translated: alm.default.widget.noAccess';
```

## Test Scenarios

### 1. Basic Rendering
- Should render without errors
- Should render all container divs
- Should render Info icon

### 2. CSS Classes
- Should apply noAccessSection class
- Should apply noAccessContainer class
- Should apply noAccessIcon class
- Should apply noAccessText class

### 3. Translation Integration
- Should call GetTranslation with correct key
- Should display translated text
- Should set aria-label with translated text

### 4. Accessibility
- Should have proper aria-label
- Should have accessible text content

### 5. Icon Integration
- Should render Info icon component
- Should render icon in correct container

## Success Criteria
- ✅ All tests pass
- ✅ Coverage exceeds 70%
- ✅ All rendering paths tested
- ✅ Translation verified
- ✅ Accessibility validated
