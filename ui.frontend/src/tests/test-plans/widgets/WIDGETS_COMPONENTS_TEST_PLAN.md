# Widgets - Test Plans

## Overview

Dashboard widgets for custom learner pages.

**Category**: Widgets  
**Priority**: P1 (High)  
**Total Components**: 13

---

## Component List

| Component | Purpose | Test Status | Coverage |
|-----------|---------|-------------|----------|
| ALMCustomContentBox | Custom HTML content | ⚠️ Partial | ~55% |
| ALMBrowseCatalog | Browse training catalog | ⚠️ Partial | ~60% |
| ALMPrimeRecommendations | Recommended trainings | ⚠️ Partial | ~50% |
| ALMSocialLearning | Social posts widget | 📝 Needs Work | ~40% |
| ALMLeaderboard | Gamification leaderboard | 📝 Needs Work | ~35% |
| ALMCompliance | Compliance dashboard | 📝 Needs Work | ~40% |
| ALMCalendar | Calendar widget | ⚠️ Partial | ~45% |
| ALMMyLearning | User's learning items | 📝 Needs Work | ~38% |
| ALMStrips | Content strips | 📝 Needs Work | ~42% |
| ALMMasthead | Widget masthead | ⚠️ Partial | ~55% |
| ALMSkillsWidget | Skills dashboard | 📝 Needs Work | ~40% |
| ALMBadgesWidget | Badges display | 📝 Needs Work | ~38% |
| ALMNotificationsWidget | Notifications widget | 📝 Needs Work | ~40% |

---

## Widget Categories

### Content Widgets
- **ALMCustomContentBox**: Display custom HTML/markdown
- **ALMBrowseCatalog**: Browse and search trainings
- **ALMPrimeRecommendations**: AI-powered recommendations

### Gamification Widgets
- **ALMLeaderboard**: Points and rankings
- **ALMBadgesWidget**: Earned badges
- **ALMSkillsWidget**: Skill levels and progress

### Tracking Widgets
- **ALMCompliance**: Compliance status
- **ALMMyLearning**: Enrolled courses
- **ALMCalendar**: Upcoming sessions

### Social Widgets
- **ALMSocialLearning**: Community posts
- **ALMNotificationsWidget**: Recent notifications

---

## Widget Architecture

```
Custom Page
├── ALMLayout
│   └── Widget Containers (rows/columns)
│       ├── Widget 1 (e.g., ALMBrowseCatalog)
│       ├── Widget 2 (e.g., ALMLeaderboard)
│       └── Widget 3 (e.g., ALMSocialLearning)
│
└── Widget Renderer
    ├── Loads widget type
    ├── Fetches widget data
    ├── Renders widget component
    └── Handles widget interactions
```

---

## Common Widget Features

### Configuration
- Widget title
- Widget description
- Display settings (show/hide elements)
- Filter settings
- Sort options

### Data Loading
- Async data fetching
- Loading states
- Error states
- Empty states

### Interactions
- Click to navigate
- Filter/sort controls
- Expand/collapse
- Refresh data

---

## Testing Patterns

### Widget Container Tests
```typescript
describe('WidgetName', () => {
  it('should render with title');
  it('should show loading state while fetching data');
  it('should display data when loaded');
  it('should handle empty state');
  it('should handle error state');
  it('should handle refresh action');
});
```

### Widget Configuration Tests
```typescript
describe('Widget Configuration', () => {
  it('should apply widget title from config');
  it('should respect show/hide settings');
  it('should apply filter settings');
});
```

---

## Test Status

**Overall**: ⚠️ 35-60% coverage across widgets  
**Priority**: Improve core widgets first (Browse Catalog, Recommendations)

---

## Running Tests

```bash
cd ui.frontend
npm test -- tests/components/Widgets --watchAll=false
npm test -- ALMCustomContentBox --watchAll=false
npm test -- ALMBrowseCatalog --watchAll=false
```

---

**Category Status**: ⚠️ Needs significant improvement  
**Last Updated**: January 5, 2026

