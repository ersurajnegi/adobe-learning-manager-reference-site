# Custom Pages Components - Test Plans

## Overview

Custom page builder components for flexible learner portal layouts.

**Category**: Custom Pages  
**Priority**: P1 (High)  
**Total Components**: 13

---

## Component List

| Component | Purpose | Test Status | Coverage |
|-----------|---------|-------------|----------|
| ALMCustomPage | Page container | 📝 Needs Work | ~35% |
| ALMLayout | Layout grid system | 📝 Needs Work | ~40% |
| ALMCustomWidgetRenderer | Widget renderer | 📝 Needs Work | ~45% |
| ALMCategoryWidget | Category browser | ⚠️ Partial | ~50% |
| ALMCategoryCard | Category card | ⚠️ Partial | ~55% |
| ALMCoursePathWidget | Learning path display | 📝 Needs Work | ~40% |
| ALMHtmlWidget | Custom HTML | ⚠️ Partial | ~50% |
| ALMIframeWidget | Iframe embed | 📝 Needs Work | ~35% |
| ALMNoAccessContainer | No access message | ⚠️ Partial | ~60% |
| ALMPageNotFound | 404 page | ⚠️ Partial | ~65% |
| ALMStripWidgetHeader | Widget header | ⚠️ Partial | ~55% |
| ALMWidgetInspectMode | Admin inspect mode | 📝 Needs Work | ~30% |
| ALMWidgetLoader | Widget loader | ⚠️ Partial | ~50% |

---

## Component Hierarchy

```
ALMCustomPage (Root)
├── ALMLayout (Grid system)
│   ├── Row 1
│   │   ├── Column 1 (Widget slot)
│   │   │   └── ALMCustomWidgetRenderer
│   │   │       ├── Identifies widget type
│   │   │       └── Renders appropriate widget
│   │   └── Column 2 (Widget slot)
│   │       └── ALMCustomWidgetRenderer
│   │           └── Widget component
│   └── Row 2
│       └── Full-width widget
│
├── Special Widgets
│   ├── ALMCategoryWidget
│   │   └── ALMCategoryCard (multiple)
│   ├── ALMHtmlWidget
│   ├── ALMIframeWidget
│   └── ALMCoursePathWidget
│
└── Utility Components
    ├── ALMStripWidgetHeader
    ├── ALMWidgetLoader
    ├── ALMNoAccessContainer
    ├── ALMPageNotFound
    └── ALMWidgetInspectMode (Admin only)
```

---

## Key Features

### Layout System
- Flexible grid (1-4 columns)
- Responsive breakpoints
- Widget positioning
- Row/column configuration

### Widget Management
- Dynamic widget loading
- Widget configuration
- Widget permissions
- Inspect mode (admin)

### Content Types
- Category browsing
- HTML content
- Iframe embeds
- Learning paths
- Custom widgets

---

## Testing Priorities

### P0 - Critical
- Page layout rendering
- Widget renderer logic
- Permission handling
- Error states

### P1 - Important
- Responsive layouts
- Widget configuration
- Category/course widgets
- HTML/Iframe widgets

### P2 - Secondary
- Inspect mode
- Widget loader animations
- Edge cases

---

## Running Tests

```bash
cd ui.frontend
npm test -- tests/components/CustomPages --watchAll=false
```

---

**Category Status**: 📝 Significant work needed  
**Overall Coverage**: ~30-65% (varies widely)  
**Last Updated**: January 5, 2026

