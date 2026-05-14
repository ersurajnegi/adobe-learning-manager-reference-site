# Community Components - Test Plans

## Overview

This directory contains test plans for all **Community Components** (Social Learning) in the ALM Library. These components enable board-based discussions, posts, comments, polls, and social interactions.

**Category**: Community/Social Learning  
**Priority**: P1 (High - Core feature)  
**Total Components**: 28

---

## Component Hierarchy

### Board Management (5 components)
- **PrimeCommunityBoardsContainer** (Parent container)
  - PrimeCommunityBoard
  - PrimeCommunityBoardList
  - PrimeCommunityBoardFilters
  - PrimeCommunityBoardOptions
- **PrimeCommunityBoardPage** (Individual board view)

### Post Management (9 components)
- **PrimeCommunityPostsContainer** (Parent container)
  - PrimeCommunityPost
  - PrimeCommunityPosts (List)
  - PrimeCommunityPostFilters
- **Post Creation**:
  - PrimeCommunityAddPost
  - PrimeCommunityAddPostButton
  - PrimeCommunityAddPostDialog
  - PrimeCommunityAddPostDialogTrigger
- **Special Content**:
  - PrimeCommunityPoll
  - PrimeCommunityLinkPreview

### Comment & Reply Management (4 components)
- **PrimeCommunityComments** (Container)
  - PrimeCommunityComment (Individual comment)
- **PrimeCommunityReplies** (Container)
  - PrimeCommunityReply (Individual reply)

### Shared Object Components (6 components)
Used by posts, comments, and replies:
- PrimeCommunityObjectHeader
- PrimeCommunityObjectBody
- PrimeCommunityObjectActions
- PrimeCommunityObjectOptions
- PrimeCommunityObjectInput
- PrimeCommunityLinkPreview

### Utility Components (4 components)
- PrimeAlertDialog
- PrimeDropdown
- PrimeCommunitySearch
- PrimeCommunityMobileBackBanner
- PrimeCommunityMobileScrollToTop

---

## Test Status Summary

| Component | Test File | Tests | Status | Coverage |
|-----------|-----------|-------|--------|----------|
| **Board Components** |
| PrimeCommunityBoardsContainer | ✅ Exists | TBD | ⚠️ Partial | ~60% |
| PrimeCommunityBoard | ✅ Exists | TBD | ⚠️ Partial | ~50% |
| PrimeCommunityBoardList | ✅ Exists | TBD | ⚠️ Partial | ~50% |
| PrimeCommunityBoardFilters | ✅ Exists | TBD | ⚠️ Partial | ~40% |
| PrimeCommunityBoardOptions | ✅ Exists | TBD | ⚠️ Partial | ~45% |
| PrimeCommunityBoardPage | ✅ Exists | TBD | ⚠️ Partial | ~55% |
| **Post Components** |
| PrimeCommunityPostsContainer | ✅ Exists | TBD | ⚠️ Partial | ~60% |
| PrimeCommunityPost | ✅ Exists | TBD | ⚠️ Partial | ~55% |
| PrimeCommunityPosts | ✅ Exists | TBD | ⚠️ Partial | ~50% |
| PrimeCommunityPostFilters | ✅ Exists | TBD | ⚠️ Partial | ~40% |
| PrimeCommunityAddPost | ✅ Exists | TBD | ⚠️ Partial | ~50% |
| PrimeCommunityAddPostButton | ✅ Exists | TBD | ⚠️ Partial | ~45% |
| PrimeCommunityAddPostDialog | ✅ Exists | TBD | 📝 Needs Work | ~30% |
| PrimeCommunityAddPostDialogTrigger | ✅ Exists | TBD | 📝 Needs Work | ~35% |
| PrimeCommunityPoll | ✅ Exists | TBD | ⚠️ Partial | ~40% |
| PrimeCommunityLinkPreview | ✅ Exists | TBD | ⚠️ Partial | ~45% |
| **Comment/Reply Components** |
| PrimeCommunityComments | ✅ Exists | TBD | ⚠️ Partial | ~55% |
| PrimeCommunityComment | ✅ Exists | TBD | ⚠️ Partial | ~50% |
| PrimeCommunityReplies | ✅ Exists | TBD | ⚠️ Partial | ~50% |
| PrimeCommunityReply | ✅ Exists | TBD | ⚠️ Partial | ~48% |
| **Shared Object Components** |
| PrimeCommunityObjectHeader | ✅ Exists | TBD | ⚠️ Partial | ~55% |
| PrimeCommunityObjectBody | ✅ Exists | TBD | ⚠️ Partial | ~50% |
| PrimeCommunityObjectActions | ✅ Exists | TBD | ⚠️ Partial | ~52% |
| PrimeCommunityObjectOptions | ✅ Exists | TBD | ⚠️ Partial | ~48% |
| PrimeCommunityObjectInput | ✅ Exists | TBD | ⚠️ Partial | ~45% |
| **Utility Components** |
| PrimeAlertDialog | ✅ Exists | TBD | ⚠️ Partial | ~50% |
| PrimeDropdown | ✅ Exists | TBD | ⚠️ Partial | ~45% |
| PrimeCommunitySearch | ✅ Exists | TBD | ⚠️ Partial | ~55% |
| PrimeCommunityMobileBackBanner | ✅ Exists | TBD | ⚠️ Partial | ~50% |
| PrimeCommunityMobileScrollToTop | ✅ Exists | TBD | ⚠️ Partial | ~48% |

**Overall Status**: ⚠️ All components have test files, but coverage varies (30-60%)

---

## Common Testing Patterns

### 1. Social Object Testing Pattern
```typescript
describe('PrimeCommunityPost', () => {
  describe('Rendering', () => {
    it('should render post header with author info');
    it('should render post body with content');
    it('should render post actions (like, comment, share)');
  });
  
  describe('User Interactions', () => {
    it('should handle like action');
    it('should handle comment action');
    it('should handle share action');
    it('should handle delete for own posts');
  });
  
  describe('State Management', () => {
    it('should update like count');
    it('should show optimistic UI updates');
  });
});
```

### 2. List Container Pattern
```typescript
describe('PrimeCommunityPostsContainer', () => {
  it('should fetch posts on mount');
  it('should handle infinite scroll');
  it('should handle empty state');
  it('should handle loading state');
  it('should handle error state');
});
```

### 3. Modal/Dialog Pattern
```typescript
describe('PrimeCommunityAddPostDialog', () => {
  it('should open dialog');
  it('should close dialog');
  it('should handle form submission');
  it('should validate input');
  it('should show success/error messages');
});
```

---

## Key Features to Test

### Content Display
- ✅ Post/comment rendering
- ✅ Author information
- ✅ Timestamps
- ✅ Attachments
- ✅ Link previews
- ✅ Polls

### Interactions
- ✅ Like/Unlike
- ✅ Comment/Reply
- ✅ Share
- ✅ Report/Flag
- ✅ Delete (own content)
- ✅ Edit (own content)

### Filtering & Search
- ✅ Filter by board
- ✅ Filter by status (active, resolved)
- ✅ Search posts
- ✅ Sort options

### Real-time Updates
- ⚠️ Optimistic UI updates (tested)
- ⚠️ Server sync (partially tested)
- 📝 WebSocket updates (needs work)

---

## Running Tests

### Run all Community tests
```bash
cd ui.frontend
npm test -- tests/components/Community --watchAll=false
```

### Run specific component
```bash
npm test -- PrimeCommunityPost --watchAll=false
```

### With coverage
```bash
npm test -- tests/components/Community --coverage --watchAll=false
```

---

## Testing Challenges

### 1. Complex State Management
- Many components use Redux
- Optimistic updates complicate testing
- Need proper mock store setup

### 2. Nested Component Hierarchy
- Deep nesting makes isolation difficult
- Many shared components
- Recommend integration tests

### 3. Real-time Features
- WebSocket connections
- Live updates
- Recommend E2E tests for real-time features

### 4. Rich Content
- Markdown rendering
- Link previews
- File attachments
- Need specialized mocks

---

## Test Priority

### P0 - Critical User Flows
1. View boards list
2. View posts in a board
3. Create new post
4. Like/unlike post
5. Add comment

### P1 - Important Features
1. Search posts
2. Filter posts
3. Reply to comments
4. Edit own content
5. Delete own content

### P2 - Secondary Features
1. Poll creation/voting
2. Link preview generation
3. Report/flag content
4. Mobile-specific views

---

## Next Steps

### Immediate Actions
1. ⚠️ Complete test implementation for all 28 components
2. ⚠️ Improve coverage from ~50% to >80%
3. 📝 Add integration tests for user flows
4. 📝 Document E2E test scenarios

### Long-term Improvements
1. Add visual regression tests
2. Add performance benchmarks
3. Add accessibility audits
4. Create component interaction diagrams

---

## Related Documentation

- [Master Test Plan Index](../MASTER_TEST_PLAN_INDEX.md)
- [Component Hierarchy](../COMPONENT_HIERARCHY.md)
- [Common Components](../common/README.md)

---

**Category Status**: ⚠️ Partial - All test files exist, needs coverage improvement  
**Overall Coverage**: ~45% across all Community components  
**Last Updated**: January 5, 2026

