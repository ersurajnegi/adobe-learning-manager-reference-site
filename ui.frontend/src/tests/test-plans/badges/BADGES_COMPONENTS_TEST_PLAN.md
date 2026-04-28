# Badges Components - Test Plans

## Overview

Badge display and management components for gamification.

**Category**: Badges  
**Priority**: P2  
**Total Components**: 4

---

## Component List

| Component | Purpose | Lines | Test Status | Coverage |
|-----------|---------|-------|-------------|----------|
| **BadgesPage** | Badge gallery page | ~180 | ⚠️ Partial | ~60% |
| **BadgeList** | List of badges | ~120 | ⚠️ Partial | ~55% |
| **BadgeElement** | Individual badge | ~100 | ⚠️ Partial | ~65% |
| **Badgr** | External badge integration | ~150 | 📝 Needs Work | ~40% |

---

## Component Hierarchy

```
BadgesPage (Root)
└── BadgeList (Container)
    └── BadgeElement (Multiple items)
        ├── Badge image
        ├── Badge name
        ├── Badge description
        ├── Earned date
        ├── Download button
        └── Share options

Badgr (External Integration)
├── Badgr authentication
├── Badge export
├── Badge sharing
└── External badge display
```

---

## Key Features

### Badge Display
- Badge thumbnail
- Badge name and description
- Earned/not earned status
- Earn criteria
- Date earned
- Progress towards badge

### Badge Actions
- Download badge image
- Share badge (social media)
- Add to Badgr
- View badge details

### Badge Types
- Course completion badges
- Skill mastery badges
- Milestone badges
- Custom badges

---

## Testing Coverage

**Test Files**:
- `tests/components/BadgesPage/Badges.spec.tsx`
- `tests/components/BadgeList/BadgeList.spec.tsx`
- `tests/components/BadgeElement/BadgeElement.spec.tsx`
- `tests/components/Badgr/Badgr.spec.tsx`

### BadgeElement Tests
```typescript
describe('BadgeElement', () => {
  it('should render badge image');
  it('should display badge name');
  it('should show earned status');
  it('should show earn date if earned');
  it('should handle download action');
  it('should handle share action');
});
```

---

## Testing Priorities

### P1 - Core Display
- Badge rendering
- Earned/not earned states
- Badge information display

### P2 - Interactions
- Download badge
- Share badge
- Badge details view

### P3 - External Integration
- Badgr authentication
- Badge export to Badgr
- External badge sync

---

## Running Tests

```bash
cd ui.frontend
npm test -- tests/components/Badges --watchAll=false
npm test -- BadgeElement --watchAll=false
npm test -- BadgeList --watchAll=false
```

---

**Category Status**: ⚠️ Partial - Core features covered, external integration needs work  
**Overall Coverage**: ~40-65%  
**Last Updated**: January 5, 2026

