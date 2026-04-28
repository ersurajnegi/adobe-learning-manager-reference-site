# Instance Components - Test Plans

## Overview

Training instance selection and management components.

**Category**: Instance Management  
**Priority**: P1 (High)  
**Total Components**: 4

---

## Component List

| Component | Lines | Test Status | Coverage |
|-----------|-------|-------------|----------|
| PrimeInstanceCard | ~180 | ⚠️ Partial | ~60% |
| PrimeInstanceCardMobile | ~160 | ⚠️ Partial | ~55% |
| PrimeInstanceItem | ~100 | ⚠️ Partial | ~65% |
| PrimeInstanceSwitcher | ~120 | 📝 Needs Work | ~40% |

---

## Component Hierarchy

```
Training Instance Selection
├── PrimeInstanceCard (Desktop view)
│   ├── Instance details
│   ├── Seat availability
│   ├── Date/time
│   ├── Location/delivery mode
│   └── Select button
│
└── PrimeInstanceCardMobile (Mobile view)
    └── (Same as desktop, responsive layout)

PrimeInstanceSwitcher
├── Switch between enrolled instances
├── View instance details
└── Change instance selection

PrimeInstanceItem
└── Shared instance display logic
    ├── Instance metadata
    ├── Instructor info
    └── Session details
```

---

## Key Features

### Instance Display
- Instance name and description
- Available seats vs total
- Start/end dates
- Session schedule
- Instructor information
- Location/virtual meeting details
- Enrollment status

### Interactions
- Select instance for enrollment
- Switch enrolled instance
- View waitlist status
- Compare instances

### Responsive Behavior
- Desktop: Card view with full details
- Mobile: Compact card view
- Tablet: Adaptive layout

---

## Test Coverage

**Test Files**:
- `tests/components/PrimeInstanceCard/PrimeInstanceCard.spec.tsx`
- `tests/components/PrimeInstanceCardMobile/PrimeInstanceCardMobile.spec.tsx`
- `tests/components/PrimeInstanceItem/PrimeInstanceItem.spec.tsx`
- `tests/components/Instance/PrimeInstanceSwitcher.spec.tsx`

**Overall Status**: ⚠️ Partial coverage (40-65%)

---

## Testing Priority

### P0 - Critical
- Instance display with correct data
- Instance selection
- Seat availability display

### P1 - Important
- Instance switching
- Waitlist handling
- Date/time formatting
- Responsive layouts

### P2 - Secondary
- Instructor information
- Session details
- Conflict detection

---

## Running Tests

```bash
cd ui.frontend
npm test -- tests/components/Instance --watchAll=false
npm test -- PrimeInstanceCard --watchAll=false
npm test -- PrimeInstanceCardMobile --watchAll=false
```

---

**Category Status**: ⚠️ Partial - Needs improvement  
**Last Updated**: January 5, 2026

