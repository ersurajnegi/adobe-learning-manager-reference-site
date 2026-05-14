# PrimeCommunityPosts Component - Test Plan

## Component Overview

**Component**: `PrimeCommunityPosts`  
**Location**: `src/almLib/components/Community/PrimeCommunityPosts/PrimeCommunityPosts.tsx`  
**Purpose**: Container component that manages the display of multiple community posts with search, filtering, and add post functionality

### Component Functionality
- Fetches and displays list of posts for a board
- Provides search functionality within board
- Offers post filtering/sorting options
- Allows adding new posts (with permission checks)
- Shows loading states during async operations
- Displays search results count
- Handles infinite scroll with "load more" functionality
- Manages board moderator permissions

### Props Interface
```typescript
interface PrimeCommunityPostsProps {
  board: {
    id: string;
    visibility: string;
    postingAllowed?: boolean;
  };
}
```

### Key State Variables
- `showLoader`: Boolean for loading indicator
- `isSearchMode`: Boolean for search mode status
- `searchResult`: Number or "No" for search results count
- `searchString`: String for current search query
- `clearSortFilter`: Boolean for filter reset trigger
- `user`: PrimeUser object for current user
- `boardModerators`: Array of moderator IDs

### Sub-Components Used
1. `PrimeCommunityPostsContainer` - Displays list of posts
2. `PrimeCommunityPostFilters` - Sorting/filtering controls
3. `PrimeCommunityAddPost` - Create new post button/form
4. `PrimeCommunitySearch` - Search input and functionality
5. `ALMLoader` - Loading indicator

### Custom Hooks
1. `usePosts(boardId)` - Returns: posts, fetchPosts, loadMorePosts, hasMoreItems, fetchBoardModerators
2. `useIntl()` - Returns: formatMessage

### External Dependencies
- `getALMUser()` - Fetches current user information
- Constants: `BOARD`, `PUBLIC`

## Testing Strategy

### Approach
- **Integration Testing**: Test with mocked sub-components and hooks
- **State Testing**: Verify state changes and effects
- **Permission Testing**: Test isNewPostAllowed logic
- **Search Testing**: Test search mode and result display
- **Async Testing**: Test loading states and data fetching
- **Edge Case Testing**: Empty states, no results, permissions

### Test Categories
1. **Component Rendering** (12 tests)
2. **Initial State** (8 tests)
3. **Data Fetching** (10 tests)
4. **Search Functionality** (15 tests)
5. **Filter Functionality** (10 tests)
6. **Add Post Permission** (12 tests)
7. **Loading States** (8 tests)
8. **Post Display** (10 tests)
9. **Moderator Management** (8 tests)
10. **Handler Functions** (10 tests)
11. **useEffect Behavior** (8 tests)
12. **Error Handling** (6 tests)

**Total Planned Tests**: ~117 tests  
**Target Coverage**: 90%+

## Detailed Test Cases

### 1. Component Rendering (12 tests)
- [ ] Should render without crashing
- [ ] Should render action row container
- [ ] Should render PrimeCommunityAddPost when allowed
- [ ] Should not render PrimeCommunityAddPost when not allowed
- [ ] Should render PrimeCommunitySearch
- [ ] Should render PrimeCommunityPostFilters when posts exist
- [ ] Should not render PrimeCommunityPostFilters when no posts
- [ ] Should render PrimeCommunityPostsContainer when posts exist
- [ ] Should render "No post found" when posts array is empty
- [ ] Should render ALMLoader when showLoader is true
- [ ] Should not render ALMLoader when showLoader is false
- [ ] Should render search results when in search mode

### 2. Initial State (8 tests)
- [ ] Should initialize showLoader as false
- [ ] Should initialize isSearchMode as false
- [ ] Should initialize searchResult as 0
- [ ] Should initialize searchString as empty
- [ ] Should initialize clearSortFilter as false
- [ ] Should initialize user as empty object
- [ ] Should initialize boardModerators as empty array
- [ ] Should call fetchPosts on mount

### 3. Data Fetching (10 tests)
- [ ] Should call fetchPosts with board.id
- [ ] Should set showLoader to true before fetching
- [ ] Should set showLoader to false after fetching
- [ ] Should handle fetchPosts with sortValue
- [ ] Should handle fetchPosts with post IDs
- [ ] Should call loadMorePosts from PostsContainer
- [ ] Should handle hasMoreItems correctly
- [ ] Should fetch board moderators on mount
- [ ] Should handle getALMUser on mount
- [ ] Should handle async operations in useEffect

### 4. Search Functionality (15 tests)
- [ ] Should set search mode when searching
- [ ] Should display search results count
- [ ] Should display search string
- [ ] Should call searchCountHandler with results
- [ ] Should show "No" when no results
- [ ] Should show number when results found
- [ ] Should display search status when in search mode
- [ ] Should hide search status when not in search mode
- [ ] Should render clear button in search mode
- [ ] Should call resetSearchHandler on clear click
- [ ] Should reset isSearchMode on clear
- [ ] Should reset searchResult on clear
- [ ] Should set clearSortFilter on clear
- [ ] Should call getPosts on clear
- [ ] Should hide loader in search mode after loading

### 5. Filter Functionality (10 tests)
- [ ] Should call sortFilterChangeHandler
- [ ] Should set clearSortFilter to false on filter
- [ ] Should get post IDs for filter
- [ ] Should call getPosts with sortValue
- [ ] Should call getPosts with post IDs
- [ ] Should clear filter on search reset
- [ ] Should pass clearSortFilter to PostFilters
- [ ] Should handle empty posts array for filter
- [ ] Should join post IDs correctly
- [ ] Should handle filter changes async

### 6. Add Post Permission (12 tests)
- [ ] Should allow post when board visibility is PUBLIC
- [ ] Should allow post when user is moderator
- [ ] Should allow post when postingAllowed is true
- [ ] Should not allow post when none of conditions met
- [ ] Should check user.id in boardModerators
- [ ] Should handle undefined boardModerators
- [ ] Should handle empty boardModerators array
- [ ] Should handle undefined user.id
- [ ] Should handle PUBLIC constant correctly
- [ ] Should pass reloadPosts to AddPost
- [ ] Should pass boardId to AddPost
- [ ] Should call getPosts from AddPost reloadPosts

### 7. Loading States (8 tests)
- [ ] Should show loader during initial fetch
- [ ] Should hide loader after fetch completes
- [ ] Should show loader during search
- [ ] Should hide loader after search
- [ ] Should show loader during sort/filter
- [ ] Should hide loader after sort/filter
- [ ] Should not show loader in search mode after results
- [ ] Should render ALMLoader component when loading

### 8. Post Display (10 tests)
- [ ] Should display posts when array has items
- [ ] Should display "No post found" when array is empty
- [ ] Should pass posts to PostsContainer
- [ ] Should pass loadMorePosts to PostsContainer
- [ ] Should pass hasMoreItems to PostsContainer
- [ ] Should handle posts array with single item
- [ ] Should handle posts array with multiple items
- [ ] Should check posts.length > 0 for filters
- [ ] Should check posts.length === 0 for message
- [ ] Should use formatMessage for "No post found"

### 9. Moderator Management (8 tests)
- [ ] Should fetch board moderators on mount
- [ ] Should call fetchBoardModerators with board.id
- [ ] Should extract moderator IDs from userList
- [ ] Should set boardModerators state
- [ ] Should handle moderators with forEach
- [ ] Should handle empty moderators list
- [ ] Should handle moderators without userList
- [ ] Should include moderator check in isNewPostAllowed

### 10. Handler Functions (10 tests)
- [ ] showLoaderHandler should set showLoader state
- [ ] searchCountHandler should set searchResult
- [ ] searchCountHandler should set searchString
- [ ] searchCountHandler should handle null results
- [ ] searchCountHandler should use formatMessage for "No"
- [ ] searchModeHandler should set isSearchMode
- [ ] resetSearchHandler should reset all search states
- [ ] sortFilterChangeHandler should update filter
- [ ] getPosts should handle optional sortValue
- [ ] getPosts should handle optional ids parameter

### 11. useEffect Behavior (8 tests)
- [ ] Should run on mount only (empty dependency array)
- [ ] Should fetch user data in useEffect
- [ ] Should fetch moderators in useEffect
- [ ] Should handle async IIFE in useEffect
- [ ] Should set user state from getALMUser response
- [ ] Should handle undefined user response
- [ ] Should build moderatorIds array
- [ ] Should complete all useEffect operations

### 12. Error Handling (6 tests)
- [ ] Should handle getALMUser failure
- [ ] Should handle fetchBoardModerators failure
- [ ] Should handle fetchPosts failure
- [ ] Should handle empty board prop
- [ ] Should handle missing board.id
- [ ] Should handle network errors gracefully

## Mock Requirements

### Mocks Needed
1. **usePosts Hook**: Mock all returned functions and state
2. **useIntl Hook**: Mock formatMessage
3. **getALMUser**: Mock user data fetch
4. **Sub-Components**: Mock all 5 sub-components
5. **Constants**: Import BOARD and PUBLIC

### Mock Structure
```typescript
const mockFetchPosts = jest.fn().mockResolvedValue(undefined);
const mockLoadMorePosts = jest.fn();
const mockFetchBoardModerators = jest.fn().mockResolvedValue({
  userList: [{ id: 'mod1' }, { id: 'mod2' }]
});

jest.mock('../../../hooks/community', () => ({
  usePosts: (boardId: string) => ({
    posts: mockPosts,
    fetchPosts: mockFetchPosts,
    loadMorePosts: mockLoadMorePosts,
    hasMoreItems: true,
    fetchBoardModerators: mockFetchBoardModerators,
  }),
}));

jest.mock('../../../utils/global', () => ({
  getALMUser: jest.fn().mockResolvedValue({
    user: { id: 'user123', name: 'Test User' }
  }),
}));
```

## Coverage Goals

### Code Coverage Targets
- **Line Coverage**: > 90%
- **Branch Coverage**: > 85%
- **Function Coverage**: 100%
- **Statement Coverage**: > 90%

### Critical Paths to Cover
1. ✅ Initial render and data fetching
2. ✅ Search mode activation and results display
3. ✅ Filter/sort operations
4. ✅ Permission checks for add post
5. ✅ Loading state transitions
6. ✅ Empty state displays
7. ✅ Moderator permission logic
8. ✅ All handler functions
9. ✅ useEffect async operations

## Success Criteria

### Test Suite Must:
- ✅ Achieve > 90% code coverage
- ✅ Test all user interaction flows
- ✅ Verify state management
- ✅ Test permission logic thoroughly
- ✅ Validate async operations
- ✅ Test edge cases and error scenarios
- ✅ Run quickly (< 5 seconds)
- ✅ Be maintainable and well-documented

---

**Test Plan Version**: 1.0  
**Created**: January 7, 2026  
**Component**: PrimeCommunityPosts  
**Estimated Test Count**: ~117 tests  
**Target Coverage**: 90%+

