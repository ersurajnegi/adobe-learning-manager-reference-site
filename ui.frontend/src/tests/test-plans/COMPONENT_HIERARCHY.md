# ALM Library - Complete Component Hierarchy

## Overview

This document provides a comprehensive hierarchical view of all components in the Adobe Learning Manager (ALM) Library, organized by category and showing parent-child relationships.

**Last Updated**: January 5, 2026  
**Total Components**: 130+

---

## Hierarchy Visualization

```
almLib/
│
├── 1. COMMON COMPONENTS
│   ├── ALMBackButton
│   ├── ALMCustomPicker
│   ├── ALMEffectivenessDialog
│   ├── ALMErrorBoundary
│   ├── ALMExtensionIframeDialog
│   ├── ALMImage
│   ├── ALMLoader
│   ├── AlmModalDialog
│   └── ALMTooltip
│
├── 2. CATALOG COMPONENTS
│   ├── PrimeCatalogContainer (Parent)
│   │   ├── PrimeCatalogSearch
│   │   │   ├── TextField (Spectrum)
│   │   │   ├── Checkbox
│   │   │   └── Search suggestions
│   │   ├── PrimeCatalogFilters
│   │   │   ├── PrimeCatalogFilterListItem (Desktop)
│   │   │   │   ├── Accordion
│   │   │   │   ├── Search input
│   │   │   │   └── PrimeCheckBox
│   │   │   ├── PrimeCatalogFiltersMobile
│   │   │   │   └── ALMDialog
│   │   │   └── PrimeSelectedFiltersList
│   │   ├── PrimeTrainingsContainer
│   │   │   ├── PrimeTrainingList (List View)
│   │   │   │   ├── TrainingThumbnail
│   │   │   │   ├── TrainingInfo
│   │   │   │   ├── TrainingDescription
│   │   │   │   ├── SnippetsList
│   │   │   │   ├── TrainingSkills
│   │   │   │   ├── TrainingMetadata
│   │   │   │   ├── JobAidActions
│   │   │   │   ├── TrainingRatings
│   │   │   │   └── TrainingActionButton
│   │   │   └── PrimeTrainingCardV2 (Card View)
│   │   │       ├── Card Header
│   │   │       ├── Card Thumbnail
│   │   │       ├── Card Body
│   │   │       ├── Card Actions
│   │   │       └── Card Footer
│   │   ├── ALMCustomPicker (Sort)
│   │   └── ALMGoToTop
│   │
│   └── PrimeTrainingCard (Legacy)
│
├── 3. COMMUNITY COMPONENTS
│   ├── Board Management
│   │   ├── PrimeCommunityBoardsContainer (Parent)
│   │   │   ├── PrimeCommunityBoard
│   │   │   ├── PrimeCommunityBoardList
│   │   │   ├── PrimeCommunityBoardFilters
│   │   │   └── PrimeCommunityBoardOptions
│   │   └── PrimeCommunityBoardPage
│   │
│   ├── Post Management
│   │   ├── PrimeCommunityPostsContainer (Parent)
│   │   │   ├── PrimeCommunityPost
│   │   │   │   ├── PrimeCommunityObjectHeader
│   │   │   │   ├── PrimeCommunityObjectBody
│   │   │   │   ├── PrimeCommunityObjectActions
│   │   │   │   ├── PrimeCommunityObjectOptions
│   │   │   │   └── PrimeCommunityLinkPreview
│   │   │   ├── PrimeCommunityPosts
│   │   │   └── PrimeCommunityPostFilters
│   │   │
│   │   ├── PrimeCommunityAddPost
│   │   ├── PrimeCommunityAddPostButton
│   │   ├── PrimeCommunityAddPostDialog
│   │   └── PrimeCommunityAddPostDialogTrigger
│   │
│   ├── Comment & Reply Management
│   │   ├── PrimeCommunityComments (Parent)
│   │   │   └── PrimeCommunityComment
│   │   │       ├── PrimeCommunityObjectHeader
│   │   │       ├── PrimeCommunityObjectBody
│   │   │       ├── PrimeCommunityObjectActions
│   │   │       └── PrimeCommunityObjectOptions
│   │   │
│   │   └── PrimeCommunityReplies
│   │       └── PrimeCommunityReply
│   │           ├── PrimeCommunityObjectHeader
│   │           ├── PrimeCommunityObjectBody
│   │           ├── PrimeCommunityObjectActions
│   │           └── PrimeCommunityObjectOptions
│   │
│   ├── Shared Object Components
│   │   ├── PrimeCommunityObjectHeader
│   │   ├── PrimeCommunityObjectBody
│   │   ├── PrimeCommunityObjectActions
│   │   ├── PrimeCommunityObjectOptions
│   │   ├── PrimeCommunityObjectInput
│   │   └── PrimeCommunityLinkPreview
│   │
│   ├── Utility Components
│   │   ├── PrimeAlertDialog
│   │   ├── PrimeDropdown
│   │   ├── PrimeCommunitySearch
│   │   ├── PrimeCommunityPoll
│   │   ├── PrimeCommunityMobileBackBanner
│   │   └── PrimeCommunityMobileScrollToTop
│   │
│   └── (28 total community components)
│
├── 4. NOTIFICATIONS COMPONENTS
│   ├── PrimeAnnouncementContainer (Parent)
│   │   └── Announcement display logic
│   │
│   └── PrimeNotificationContainer (Parent)
│       ├── PrimeNotificationList
│       │   └── PrimeNotificationItem
│       │       └── PrimeNotificationText
│       └── Notification actions
│
├── 5. INSTANCE COMPONENTS
│   ├── Instance Selection
│   │   ├── PrimeInstanceCard (Desktop)
│   │   ├── PrimeInstanceCardMobile
│   │   └── PrimeInstanceItem
│   │
│   └── PrimeInstanceSwitcher
│
├── 6. TRAINING OVERVIEW COMPONENTS
│   ├── Overview Container (Parent)
│   │   ├── Overview Header
│   │   ├── Overview Content
│   │   ├── Overview Sidebar
│   │   ├── Overview Tabs
│   │   ├── Skills Section
│   │   ├── Instructor Section
│   │   ├── Notes Section
│   │   ├── Reviews Section
│   │   ├── Prerequisites Section
│   │   └── Related Content Section
│   │
│   └── (17 files total)
│
├── 7. WIDGETS
│   ├── Content Widgets
│   │   ├── ALMCustomContentBox
│   │   ├── ALMBrowseCatalog
│   │   └── ALMPrimeRecommendations
│   │
│   ├── Social & Gamification Widgets
│   │   ├── ALMSocialLearning
│   │   ├── ALMLeaderboard
│   │   └── ALMCompliance
│   │
│   └── (13 widget components total)
│
├── 8. CUSTOM PAGES COMPONENTS
│   ├── Page Structure
│   │   ├── ALMCustomPage (Parent)
│   │   │   ├── ALMLayout
│   │   │   ├── ALMCustomWidgetRenderer
│   │   │   └── ALMWidgetInspectMode
│   │   │
│   │   ├── ALMNoAccessContainer
│   │   └── ALMPageNotFound
│   │
│   ├── Category Widgets
│   │   ├── ALMCategoryWidget (Parent)
│   │   │   └── ALMCategoryCard
│   │   │
│   │   └── CategoryBrowser
│   │       └── ALMCategoryBrowser
│   │
│   ├── Content Widgets
│   │   ├── ALMCoursePathWidget
│   │   ├── ALMHtmlWidget
│   │   └── ALMIframeWidget
│   │
│   └── Widget Utilities
│       ├── ALMStripWidgetHeader
│       └── ALMWidgetLoader
│
├── 9. BADGES COMPONENTS
│   ├── BadgesPage (Parent)
│   │   └── BadgeList
│   │       └── BadgeElement
│   │
│   └── Badgr (External badge integration)
│
├── 10. SKILLS COMPONENTS
│   ├── ALMSkills (Parent)
│   │   ├── ALMSkillComponent
│   │   └── ExternalSkillGraph
│   │
│   └── Skill display utilities
│
├── 11. FEEDBACK COMPONENTS
│   ├── ALMFeedback (V1)
│   │   ├── PrimeFeedbackWrapper
│   │   ├── PrimeFeedbackDialog
│   │   └── PrimeFeedbackForm
│   │
│   └── ALMFeedbackV2
│       └── Enhanced feedback components
│
├── 12. ACTIVE FIELDS COMPONENTS
│   ├── ALMActiveFields (Parent)
│   │   └── ActiveFieldsContainer
│   │
│   └── Dynamic form field rendering
│
├── 13. LEADERBOARD COMPONENTS
│   ├── ALMLpLeaderBoard (Parent)
│   │   └── ALMLpLeaderBoardItem
│   │
│   └── Learning program leaderboard display
│
├── 14. NAVIGATION COMPONENTS
│   ├── Masthead (Top navigation)
│   │   └── ALMMasthead
│   │
│   └── NavigationBar (Side/bottom navigation)
│       └── ALMNavigationBar
│
├── 15. AUTHOR COMPONENTS
│   └── Author (Parent)
│       └── PrimeAuthorPage
│
├── 16. PROFILE COMPONENTS
│   └── UserProfile (Parent)
│       └── ALMUserProfile
│
├── 17. SOCIAL COMPONENTS
│   └── Social (Parent)
│       └── Social learning features
│
├── 18. OFFLINE COMPONENTS
│   └── Offline (Parent)
│       └── Offline learning support
│
├── 19. PRL COMPONENTS (Products, Roles, Levels)
│   ├── PrlPreferenceSection
│   └── PrlWizard
│
├── 20. DIALOG COMPONENTS
│   ├── ALMDialog (General purpose)
│   ├── ALMPopup
│   ├── GamificationModal
│   ├── SessionConflict (SessionConflictDialog)
│   ├── StarRatingSubmitDialog
│   └── Portal (Portal/modal utilities)
│
├── 21. UI UTILITIES
│   ├── ALMGoToTop (Scroll to top button)
│   ├── ALMRatings (Star rating display)
│   └── Footer (ALMFooter)
│
└── 22. CALENDAR COMPONENTS
    └── CalendarWidget
        └── Calendar display and events

```

---

## Component Relationship Patterns

### 1. Container-Presenter Pattern

**Containers** (Smart Components):
- PrimeCatalogContainer
- PrimeCommunityBoardsContainer
- PrimeCommunityPostsContainer
- PrimeTrainingsContainer
- PrimeNotificationContainer
- PrimeAnnouncementContainer

**Presenters** (Dumb Components):
- PrimeTrainingCard / PrimeTrainingCardV2
- PrimeTrainingList
- PrimeCommunityBoard
- PrimeCommunityPost
- PrimeNotificationItem

### 2. Compound Component Pattern

**Parent provides context, children consume**:
- ALMDialog + ALMDialogHeader + ALMDialogContent
- PrimeFeedbackWrapper + PrimeFeedbackDialog + PrimeFeedbackForm
- PrimeCommunityPost + ObjectHeader + ObjectBody + ObjectActions

### 3. Higher-Order Component Pattern

**Wrappers that enhance functionality**:
- ALMErrorBoundary (Wraps any component)
- PrimeFeedbackWrapper (Wraps training displays)
- ALMExtensionIframeDialog (Wraps extension content)

### 4. Render Props Pattern

**Components that accept render functions**:
- ALMCustomWidgetRenderer (Renders widgets dynamically)
- Portal (Renders children in different DOM location)

---

## Dependency Graph

### Level 1: Foundation Components (No dependencies)
- ALMImage
- ALMLoader
- ALMBackButton
- ALMTooltip
- ALMRatings

### Level 2: Utility Components (Depend on Level 1)
- ALMDialog (uses ALMImage, ALMLoader)
- ALMPopup (uses ALMTooltip)
- ALMCustomPicker (uses ALMTooltip)
- AlmModalDialog (uses ALMLoader)

### Level 3: Feature Components (Depend on Levels 1-2)
- PrimeTrainingCard (uses ALMImage, ALMRatings, ALMDialog)
- PrimeCommunityPost (uses ALMImage, ALMPopup, ALMDialog)
- PrimeNotificationItem (uses ALMImage, ALMTooltip)

### Level 4: Container Components (Depend on Levels 1-3)
- PrimeCatalogContainer (uses CatalogSearch, CatalogFilters, TrainingsContainer)
- PrimeCommunityBoardsContainer (uses Board, BoardList, BoardFilters)
- PrimeTrainingsContainer (uses TrainingCard, TrainingList, Loader)

### Level 5: Page Components (Depend on Levels 1-4)
- ALMCustomPage (uses all widget components)
- BadgesPage (uses BadgeList, BadgeElement)
- PrimeAuthorPage (uses various components)

---

## Component Size Analysis

### Small Components (<100 lines)
- ALMImage (24 lines)
- ALMBackButton (40 lines)
- ALMLoader (37 lines)
- ALMGoToTop (45 lines)
- TrainingThumbnail (40 lines)

### Medium Components (100-300 lines)
- ALMTooltip (~100 lines)
- ALMDialog (~150 lines)
- PrimeCheckBox (~120 lines)
- TrainingInfo (75 lines)
- TrainingActionButton (55 lines)

### Large Components (300-600 lines)
- PrimeCatalogFilters (~400 lines)
- PrimeCommunityPost (~500 lines)
- PrimeNotificationContainer (~350 lines)

### Very Large Components (>600 lines)
- PrimeTrainingCardV2 (1184 lines) - **Needs refactoring**
- PrimeCatalogContainer (~800 lines)
- PrimeTrainingList (578 lines) - **Recently refactored**

---

## Testing Strategy by Component Level

### Level 1 Components
**Strategy**: Full unit test coverage (100%)  
**Reason**: No dependencies, pure functions, easy to test

### Level 2 Components
**Strategy**: High unit test coverage (80%+)  
**Reason**: Few dependencies, mockable, reusable

### Level 3 Components
**Strategy**: Unit + Integration tests (60%+)  
**Reason**: Multiple dependencies, complex interactions

### Level 4 Components
**Strategy**: Integration tests + Helper function tests  
**Reason**: Too many dependencies for pure unit tests

### Level 5 Components
**Strategy**: E2E tests + Critical path tests  
**Reason**: Full page components, best tested as integrated systems

---

## Component Categories by Functional Area

### A. Learning Experience
- Catalog components
- Training Overview components
- Instance components
- Calendar components

### B. Social Learning
- Community components (all 28)
- Social components

### C. Gamification & Progress
- Badges components
- Leaderboard components
- Skills components
- GamificationModal

### D. User Management
- Profile components
- Notifications components
- Feedback components
- Active Fields components

### E. Navigation & Layout
- Navigation components
- Masthead
- Footer
- Portal

### F. Content Management
- Custom Pages components
- Widgets
- Author components

### G. UI Utilities
- Common components
- Dialog components
- Rating components
- Offline components

---

## Refactoring Candidates

### High Priority (Blocks testing)
1. **PrimeTrainingCardV2** (1184 lines)
   - Status: Helper functions tested, component too complex
   - Recommendation: Break into 5 sub-components + 3 hooks

### Medium Priority (Can be tested but difficult)
2. **PrimeCatalogContainer** (~800 lines)
   - Status: Partial tests (19/61 passing)
   - Recommendation: Extract filters and search logic

3. **PrimeCommunityPost** (~500 lines)
   - Status: Tests exist but brittle
   - Recommendation: Extract object components better

### Low Priority (Working tests exist)
4. **PrimeNotificationContainer** (~350 lines)
   - Status: Tests passing
   - Recommendation: Monitor, refactor if changes needed

---

## Component Export Structure

All components are exported through:
```typescript
// src/almLib/components/index.ts
export * from './ActiveFields';
export * from './ALMDialog';
export * from './ALMFeedback';
// ... (all component exports)
```

Individual component folders have their own index:
```typescript
// src/almLib/components/ALMBackButton/index.ts
export { default as ALMBackButton } from './ALMBackButton';
```

---

## Related Documentation

- [Master Test Plan Index](./MASTER_TEST_PLAN_INDEX.md)
- [Catalog Component Hierarchy](./catalogs/COMPONENT_HEIRARCHY.md)
- [PrimeTrainingList Refactoring](../components/PrimeTrainingList/REFACTORING_SUMMARY.md)

---

**Last Updated**: January 5, 2026  
**Maintained By**: Adobe Learning Manager Team  
**Version**: 1.0

