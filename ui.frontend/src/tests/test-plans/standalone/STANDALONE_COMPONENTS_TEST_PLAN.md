# Standalone Components - Test Plans

## Overview

Miscellaneous standalone components that don't fit into other categories.

**Category**: Standalone  
**Priority**: Varies  
**Total Components**: 15+

---

## Component List

| Component | Purpose | Lines | Test Status | Priority |
|-----------|---------|-------|-------------|----------|
| **ActiveFields** | Dynamic form fields | ~150 | 📝 Needs Work | P2 |
| **ALMDialog** | General dialog | ~120 | ⚠️ Partial | P1 |
| **ALMFeedback** | L1 feedback | ~250 | ⚠️ Partial | P1 |
| **ALMFeedbackV2** | Enhanced feedback | ~200 | 📝 Needs Work | P1 |
| **ALMGoToTop** | Scroll to top | 45 | ❌ Deferred | P3 |
| **ALMLpLeaderBoard** | LP leaderboard | ~120 | ⚠️ Partial | P2 |
| **ALMPopup** | Popup component | ~100 | ⚠️ Partial | P2 |
| **ALMRatings** | Star ratings | ~80 | ⚠️ Partial | P1 |
| **ALMSkills** | Skills display | ~150 | ⚠️ Partial | P1 |
| **Author** | Author page | ~200 | 📝 Needs Work | P2 |
| **CalendarWidget** | Calendar | ~180 | ⚠️ Partial | P1 |
| **CategoryBrowser** | Category browser | ~240 | ⚠️ Partial | P1 |
| **Footer** | Page footer | ~100 | ⚠️ Partial | P2 |
| **GamificationModal** | Gamification popup | ~150 | ⚠️ Partial | P2 |
| **Masthead** | Page header | ~200 | ⚠️ Partial | P1 |
| **NavigationBar** | Navigation | ~180 | ⚠️ Partial | P1 |
| **Offline** | Offline support | ~160 | 📝 Needs Work | P2 |
| **Portal** | Portal utility | ~80 | 📝 Needs Work | P3 |
| **PrlPreferenceSection** | PRL preferences | ~140 | 📝 Needs Work | P2 |
| **PrlWizard** | PRL wizard | ~180 | 📝 Needs Work | P2 |
| **SessionConflict** | Session conflict dialog | ~120 | ⚠️ Partial | P1 |
| **Social** | Social features | ~200 | 📝 Needs Work | P2 |
| **StarRatingSubmitDialog** | Rating dialog | ~100 | ⚠️ Partial | P1 |
| **UserProfile** | User profile | ~150 | ⚠️ Partial | P1 |

---

## Priority Groups

### P1 - High Priority (Core Features)
- ALMDialog
- ALMFeedback/V2
- ALMRatings
- ALMSkills
- CalendarWidget
- CategoryBrowser
- Masthead
- NavigationBar
- SessionConflict
- StarRatingSubmitDialog
- UserProfile

### P2 - Medium Priority
- ActiveFields
- ALMLpLeaderBoard
- ALMPopup
- Author
- Footer
- GamificationModal
- Offline
- PrlPreferenceSection
- PrlWizard
- Social

### P3 - Lower Priority
- ALMGoToTop (deferred due to complexity)
- Portal (utility, minimal UI)

---

## Component Categories

### Navigation & Layout
- Masthead
- NavigationBar
- Footer
- CategoryBrowser

### Dialogs & Modals
- ALMDialog
- ALMPopup
- GamificationModal
- SessionConflict
- StarRatingSubmitDialog

### Feedback & Ratings
- ALMFeedback
- ALMFeedbackV2
- ALMRatings
- StarRatingSubmitDialog

### User Features
- UserProfile
- ActiveFields
- Social
- Offline

### Learning Features
- ALMSkills
- ALMLpLeaderBoard
- CalendarWidget
- PrlPreferenceSection
- PrlWizard

---

## Testing Status

**Overall**: Mixed (0-75% coverage)
- ✅ Complete: 0 components
- ⚠️ Partial: 13 components (~40-65%)
- 📝 Needs Work: 9 components (<40%)
- ❌ Deferred: 1 component (ALMGoToTop)

---

## Running Tests

```bash
# Run all standalone tests
cd ui.frontend
npm test -- tests/components/(ComponentName) --watchAll=false

# Examples
npm test -- ALMDialog --watchAll=false
npm test -- Masthead --watchAll=false
npm test -- UserProfile --watchAll=false
```

---

## Next Steps

1. **Prioritize P1 components** with <50% coverage
2. **Improve test quality** for components with partial coverage
3. **Add integration tests** for navigation and layout components
4. **Document E2E test scenarios** for complex user flows

---

**Category Status**: ⚠️ Mixed - Varies by component  
**Overall Coverage**: ~30-65% average  
**Last Updated**: January 5, 2026

