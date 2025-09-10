# Visual Iteration Workflow

Implement UI/UX changes through systematic visual validation:

**Design Requirements:** $ARGUMENTS

## VISUAL DEVELOPMENT PROCESS:

### 1. **Visual Reference Setup**
- Collect all design mockups, screenshots, and wireframes
- Establish clear success criteria for visual parity
- Document specific elements to match (colors, spacing, typography)
- Identify responsive breakpoints and device targets

### 2. **Implementation + Screenshot Loop**
```bash
# Implement changes
# Use puppeteer MCP for automated screenshots
/mcp puppeteer "navigate to [URL] and capture full page screenshot"

# Compare with mockups
# Document differences and next iterations
# Repeat until visual parity achieved
```

### 3. **Cross-Device Validation**
- Desktop: 1920x1080, 1366x768 viewports
- Tablet: 768x1024 (portrait), 1024x768 (landscape)  
- Mobile: 375x667 (iPhone), 360x640 (Android)
- Test Core Web Vitals on each device

### 4. **Interactive Element Testing**
- Hover states and animations
- Form interactions and validation
- Button states (normal, hover, active, disabled)
- Loading states and micro-interactions

## VALIDATION CHECKLIST:
- [ ] **Pixel-perfect accuracy** to provided designs
- [ ] **Responsive behavior** across all breakpoints
- [ ] **Interactive states** working correctly  
- [ ] **Performance maintained** (<2.5s LCP target)
- [ ] **Accessibility standards** met (WCAG 2.1)
- [ ] **Cross-browser compatibility** validated

## TOOLS INTEGRATION:
- **puppeteer MCP**: Automated screenshot capture
- **filesystem MCP**: Organize comparison images
- **sequential-thinking**: Complex layout problem solving

## QUALITY STANDARD:
- **Visual parity over speed** - match designs exactly
- **Document iterations** - track what changed and why
- **Performance conscious** - beauty must not compromise speed
- **Mobile-first approach** - start with smallest viewport

This process ensures pixel-perfect implementation matching provided designs.