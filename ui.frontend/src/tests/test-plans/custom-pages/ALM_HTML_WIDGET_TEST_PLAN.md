# ALMHtmlWidget Component Test Plan

## Component Overview

**File**: `src/almLib/components/CustomPages/ALMHtmlWidget/ALMHtmlWidget.tsx`

**Purpose**: A widget component that safely renders custom HTML, CSS, and JavaScript provided by users. It sanitizes HTML using DOMPurify, injects CSS styles, executes JavaScript code, and supports inspect mode for editing.

**Key Dependencies**:
- `DOMPurify` - HTML sanitization for XSS protection
- `useStyleInjection` - Injects CSS into document head
- `useScriptExecution` - Executes JavaScript safely
- `useWidgetInspectMode` - Hover detection for inspect mode
- `ALMWidgetInspectMode` - Inspect overlay component

## Component Props Interface

```typescript
type ALMHtmlWidgetProps = {
  widget: CustomWidget;
  isInspectMode?: boolean;
};

interface HTMLWidgetAttributes {
  html?: string;
  css?: string;
  javascript?: string;
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
1. Basic rendering with HTML content
2. HTML sanitization (DOMPurify)
3. CSS injection
4. JavaScript execution
5. Inspect mode overlay
6. Hover state management

#### Medium Priority
1. Empty content handling
2. useMemo optimization
3. Widget attributes extraction

#### Low Priority
1. Edge cases
2. Security testing

## Test Data Setup

```typescript
const mockWidget = {
  id: 'widget-123',
  widgetRef: 'HTML_WIDGET',
  attributes: {
    html: '<div>Test HTML</div>',
    css: '.test { color: red; }',
    javascript: 'console.log("test");',
  },
};
```

## Success Criteria
- ✅ All tests pass
- ✅ Coverage exceeds 70%
- ✅ Sanitization tested
- ✅ Hooks integration verified
- ✅ Security features validated

