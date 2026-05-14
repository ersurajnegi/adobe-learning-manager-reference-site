# ALMIframeWidget Component Test Plan

## Component Overview

**File**: `src/almLib/components/CustomPages/ALMIframeWidget/ALMIframeWidget.tsx`

**Purpose**: A widget component that safely embeds external content via iframe. It automatically appends authentication parameters (userId, accountId, authToken, locale) to the iframe URL for secure communication with external applications.

**Key Dependencies**:
- `useUserContext` - Gets user and account information
- `getALMConfig` - Gets locale and configuration
- `getTokenForNativeExtensions` - Gets authentication token
- `useWidgetInspectMode` - Hover detection for inspect mode
- `ALMWidgetInspectMode` - Inspect overlay component

## Component Props Interface

```typescript
interface ALMIframeWidgetProps {
  widget: CustomWidget;
  disableLinks?: boolean;
  isInspectMode?: boolean;
}

interface IframeWidgetAttributes {
  url?: string;
  height?: number;
}
```

## Test Strategy

### Coverage Goals
- **Line Coverage**: > 70% (Target: 95%+)
- **Branch Coverage**: > 70% (Target: 90%+)
- **Function Coverage**: > 70% (Target: 100%)
- **Statement Coverage**: > 70% (Target: 95%+)

### Key Test Areas (Priority Order)

#### High Priority
1. Basic iframe rendering
2. URL parameter appending (userId, accountId, authToken, locale)
3. Height styling
4. Error handling for invalid URLs
5. Inspect mode overlay
6. Hover state management

#### Medium Priority
1. useMemo optimization
2. Empty/missing URL handling
3. Missing user/account data

#### Low Priority
1. Edge cases
2. Security considerations

## Test Data Setup

```typescript
const mockWidget = {
  id: 'widget-123',
  widgetRef: 'IFRAME',
  attributes: {
    url: 'https://example.com/embed',
    height: 600,
  },
};

const mockUser = {
  id: 'user-123',
  account: { id: 'account-123' },
};
```

## Success Criteria
- ✅ All tests pass
- ✅ Coverage exceeds 70%
- ✅ URL parameters verified
- ✅ Error handling tested
- ✅ Edge cases handled

