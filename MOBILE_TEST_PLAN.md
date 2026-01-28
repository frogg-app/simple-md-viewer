# Mobile Support Test Plan

This document outlines the comprehensive testing approach for mobile support in the Simple MD Viewer application.

## Overview

The application now includes full mobile support with responsive design tested across 4 device categories and documented with 60 screenshots covering the complete user journey.

## Test Coverage

### Device Types
1. **Desktop** - 1280×720 (Standard desktop browser)
2. **Mobile iPhone** - 390×844 (iPhone 13-like device)
3. **Mobile Android** - 393×727 (Pixel 5)
4. **Tablet iPad** - 810×1080 (iPad-like device)

### Views Tested
All 15 views have been captured for each device type:

#### 1. Welcome/Empty State
- **Desktop**: Two-column layout, full spacing
- **Mobile**: Single column stack, touch-optimized
- **Tablet**: Balanced layout
- **Testing**: Verify layout adapts correctly, touch targets are adequate

#### 2. Welcome with Docs Folder
- **Testing**: File list visibility, scrolling behavior

#### 3-5. Menu Dropdowns (File, View, Help)
- **Desktop**: Full dropdowns with shortcuts visible
- **Mobile**: Touch-friendly dropdowns, shortcuts hidden
- **Testing**: Menu activation, item selection, dismissal

#### 6. Settings Dialog
- **Desktop**: Positioned dialog
- **Mobile**: Full-screen takeover
- **Testing**: Form controls, checkboxes, button interactions

#### 7. Keyboard Shortcuts Dialog
- **Testing**: Keyboard shortcut visibility, scrolling on small screens

#### 8. About Dialog
- **Testing**: Text readability, button accessibility

#### 9-10. Markdown Content Views
- **Desktop**: Max-width content with margins
- **Mobile**: Full-width responsive content
- **Testing**: Text readability, code block scrolling, table responsiveness

#### 11. Toast Notification
- **Desktop**: Bottom-right corner
- **Mobile**: Full-width bottom placement
- **Testing**: Visibility, dismissal, timing

#### 12. Loading Overlay
- **Testing**: Spinner visibility, backdrop opacity

#### 13-14. Theme Variations
- **Testing**: Color contrast, readability in both themes

#### 15. Responsive Layout Check
- **Testing**: Viewport dimensions display, breakpoint behavior

## Manual Testing Checklist

### Touch Interaction Testing
- [ ] All buttons have minimum 44×44px touch targets
- [ ] Menus open/close correctly with touch
- [ ] Dialogs can be dismissed on mobile
- [ ] Scrolling is smooth with momentum
- [ ] Drag interactions work (if applicable)

### Visual Testing
- [ ] Text is readable without zooming
- [ ] No horizontal scrolling on mobile (except in code blocks/tables)
- [ ] Images scale appropriately
- [ ] Icons are clear and appropriately sized
- [ ] Color contrast meets WCAG AA standards

### Layout Testing
- [ ] Single column layout on mobile (<768px)
- [ ] Two column layout on desktop
- [ ] Dialogs are full-screen on mobile
- [ ] Menu bar doesn't wrap on standard mobile widths
- [ ] Content doesn't overflow viewport

### Functionality Testing
- [ ] All features work on mobile (no desktop-only features)
- [ ] Keyboard shortcuts are hidden but still functional
- [ ] Touch gestures work correctly
- [ ] Orientation changes handled gracefully
- [ ] Safe area insets respected on notched devices

### Performance Testing
- [ ] Page loads quickly on mobile
- [ ] Animations are smooth (60fps)
- [ ] No layout thrashing
- [ ] Reduced motion respected when enabled

## Automated Testing

### Screenshot Regression Tests
Run the automated screenshot suite:

```bash
npm run test:e2e
```

This generates 60 screenshots that can be compared against baseline images.

### Per-Device Testing
Test specific device types:

```bash
# Desktop only
npx playwright test --project=desktop-chromium

# Mobile only
npx playwright test --project=mobile-iphone
npx playwright test --project=mobile-android

# Tablet only
npx playwright test --project=tablet-ipad
```

### CI/CD Integration
The screenshot tests should run on:
- Pull requests (compare against main branch)
- Before releases (validate no regressions)
- After dependency updates (ensure compatibility)

## Visual Regression Process

1. **Baseline**: Initial screenshots are the baseline
2. **Changes**: After UI changes, regenerate screenshots
3. **Comparison**: Use image diff tools to identify changes
4. **Review**: Manually review differences
5. **Accept/Reject**: Update baseline or fix issues

### Recommended Tools
- Percy.io for visual testing
- BackstopJS for local visual regression
- Playwright's built-in screenshot comparison

## Accessibility Testing

### Screen Readers
- [ ] Test with VoiceOver (iOS)
- [ ] Test with TalkBack (Android)
- [ ] Verify ARIA labels are present

### Keyboard Navigation
- [ ] Tab through all interactive elements
- [ ] Verify focus indicators are visible
- [ ] Test keyboard shortcuts

### Zoom Testing
- [ ] Test at 200% zoom (WCAG requirement)
- [ ] Test at 400% zoom
- [ ] Verify no content is hidden when zoomed

## Browser Testing

### Mobile Browsers
- [ ] Safari iOS
- [ ] Chrome Android
- [ ] Firefox Mobile
- [ ] Samsung Internet

### Desktop Browsers
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge

## Device Testing

### Real Device Testing
Test on actual devices when possible:
- iPhone SE (small screen)
- iPhone 14 Pro (notched screen)
- Pixel 6
- iPad Air
- Large Android tablet

### Responsive Design Mode
Use browser DevTools responsive mode for quick testing:
1. Open DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Test various viewport sizes
4. Verify breakpoints

## Edge Cases

### Extreme Viewport Sizes
- [ ] 320px width (very small mobile)
- [ ] 360px width (common minimum)
- [ ] 1920px width (large desktop)
- [ ] 3840px width (4K displays)

### Long Content
- [ ] Very long markdown documents
- [ ] Wide tables
- [ ] Large code blocks
- [ ] Many list items

### Empty States
- [ ] No docs folder content
- [ ] No recent files
- [ ] Empty markdown file

## Known Limitations

1. **Menu System**: Requires JavaScript for dropdown behavior
2. **File Upload**: Limited on some mobile browsers
3. **Remote Files**: May require special permissions on mobile

## Future Enhancements

- [ ] Add swipe gestures for navigation
- [ ] Implement pull-to-refresh
- [ ] Add offline support (PWA)
- [ ] Optimize for foldable devices
- [ ] Add dark mode auto-switching based on time

## Documentation

All screenshots are stored in `tests/screenshots/` with detailed README:
- Device specifications
- View descriptions
- Usage instructions
- Update procedures

## Reporting Issues

When reporting mobile UI issues, include:
1. Device model and OS version
2. Browser and version
3. Screenshot of the issue
4. Steps to reproduce
5. Expected vs actual behavior

---

**Last Updated**: 2026-01-28  
**Test Coverage**: 60 screenshots across 4 devices  
**Status**: ✅ All tests passing
