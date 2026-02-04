# frogg.dev Branding Guide

**Version 1.0 | February 2026**

A comprehensive branding guide for the Simple MD Viewer and future frogg.dev applications.

---

## Table of Contents

1. [Brand Overview](#brand-overview)
2. [Logo & Visual Identity](#logo--visual-identity)
3. [App Naming Recommendations](#app-naming-recommendations)
4. [Domain Name Suggestions](#domain-name-suggestions)
5. [Color Palette](#color-palette)
6. [Typography](#typography)
7. [Messaging & Taglines](#messaging--taglines)
8. [Brand Footer Implementation](#brand-footer-implementation)
9. [Monetization Strategies](#monetization-strategies)
10. [Implementation Checklist](#implementation-checklist)

---

## Brand Overview

### Who We Are

The **frogg.dev** team builds elegant, developer-focused tools that are fast, free, and delightful to use. Our mascot—a friendly frog—represents our core values:

- 🐸 **Adaptable** — Works across platforms (web, desktop, Docker)
- 🐸 **Lightweight** — Minimal footprint, maximum performance
- 🐸 **Playful yet Professional** — Fun branding with serious functionality
- 🐸 **Open** — Community-driven development

### Brand Personality

| Trait | Description |
|-------|-------------|
| **Friendly** | Approachable, welcoming to new users |
| **Fast** | Quick, responsive, no bloat |
| **Focused** | Does one thing exceptionally well |
| **Free** | Open source, community-first |

---

## Logo & Visual Identity

### Primary Logo (SVG)

The frogg.dev logo features a friendly frog face with emerald green coloring. Use this logo inline for branding elements.

```html
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="24" height="24">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#10b981"/>
      <stop offset="1" stop-color="#059669"/>
    </linearGradient>
  </defs>
  <ellipse cx="60" cy="65" rx="45" ry="38" fill="url(#g)"/>
  <circle cx="35" cy="35" r="20" fill="url(#g)"/>
  <circle cx="85" cy="35" r="20" fill="url(#g)"/>
  <circle cx="35" cy="35" r="14" fill="#fff"/>
  <circle cx="85" cy="35" r="14" fill="#fff"/>
  <circle cx="38" cy="35" r="7" fill="#050810"/>
  <circle cx="88" cy="35" r="7" fill="#050810"/>
  <path d="M35 75Q60 95 85 75" stroke="#050810" stroke-width="3" fill="none"/>
</svg>
```

**Rendered Preview:**

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="60" height="60"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#10b981"/><stop offset="1" stop-color="#059669"/></linearGradient></defs><ellipse cx="60" cy="65" rx="45" ry="38" fill="url(#g)"/><circle cx="35" cy="35" r="20" fill="url(#g)"/><circle cx="85" cy="35" r="20" fill="url(#g)"/><circle cx="35" cy="35" r="14" fill="#fff"/><circle cx="85" cy="35" r="14" fill="#fff"/><circle cx="38" cy="35" r="7" fill="#050810"/><circle cx="88" cy="35" r="7" fill="#050810"/><path d="M35 75Q60 95 85 75" stroke="#050810" stroke-width="3" fill="none"/></svg>

### Logo Sizing Guidelines

| Context | Size | Usage |
|---------|------|-------|
| Favicon | 16×16, 32×32 | Browser tab icons |
| Inline text | 16×16, 20×20 | Footer branding, inline badges |
| App header | 24×24, 32×32 | Application headers |
| Marketing | 64×64, 120×120 | Hero sections, splash screens |
| Print | 240×240+ | Print materials, stickers |

### Logo Minimum Clear Space

Maintain clear space around the logo equal to the height of the frog's eye (approximately 25% of logo height).

### Logo Don'ts

❌ Don't stretch or distort the logo  
❌ Don't change the gradient colors  
❌ Don't add drop shadows or effects  
❌ Don't rotate the logo  
❌ Don't place on busy backgrounds without sufficient contrast

---

## App Naming Recommendations

### For Simple MD Viewer

Given our frog theming and the app's purpose as a markdown viewer, here are recommended naming options:

#### Tier 1: Top Recommendations 🌟

| Name | Rationale | Vibe |
|------|-----------|------|
| **LilyPad** | Evokes a frog's home; "pad" suggests notepad/viewing | Clean, memorable |
| **LeapMark** | "Leap" (frog action) + "Mark" (markdown) | Dynamic, purposeful |
| **Padpole** | Playful blend of "tadpole" + "pad" | Whimsical, friendly |
| **RibbitDocs** | Frog sound + documents | Fun, distinctive |
| **FrogView** | Direct, clear, frog-themed | Simple, professional |

#### Tier 2: Strong Alternatives

| Name | Rationale |
|------|-----------|
| **CroakMD** | Frog sound + Markdown extension |
| **HopView** | Suggests quick, agile navigation |
| **TadMark** | Short, catchy, tadpole reference |
| **AmphiDocs** | Scientific (amphibian) + documents |
| **Bullfrog** | Strong, recognizable frog species |
| **FroggyMD** | Casual, approachable |
| **LeapPad** | Action + notepad concept |
| **PondView** | Natural habitat theming |

#### Tier 3: Alternative Directions

| Name | Rationale |
|------|-----------|
| **Greenleaf** | Nature theme without overt frog reference |
| **Emerald** | Color-themed, sophisticated |
| **SwampDocs** | Habitat reference (may have negative connotations) |

### Naming Principles

1. **Memorability** — Easy to spell, say, and remember
2. **Relevance** — Connection to markdown/viewing/docs
3. **Uniqueness** — Distinct from competitors (Typora, Obsidian, etc.)
4. **Domain availability** — Check availability before finalizing
5. **Global friendliness** — Avoids cultural misunderstandings

---

## Domain Name Suggestions

### Recommended Domain Formats

For each app name, consider these TLD patterns:

| Pattern | Example | Notes |
|---------|---------|-------|
| `.app` | `lilypad.app` | Modern, developer-focused |
| `.dev` | `leapmark.dev` | Developer ecosystem |
| `.io` | `padpole.io` | Tech/startup standard |
| `.md` | `frogview.md` | Markdown-specific (Moldova TLD) |
| `.co` | `ribbitdocs.co` | Startup-friendly |
| `.xyz` | `hopview.xyz` | Affordable, techy |

### Domain Suggestions by App Name

#### For "LilyPad" (Top Recommendation)

- `lilypad.app` ⭐ (premium choice)
- `lilypad.dev`
- `lilypadviewer.com`
- `getlilypad.com`
- `lilypad.md`

#### For "LeapMark"

- `leapmark.app` ⭐
- `leapmark.dev`
- `leapmark.io`
- `getleapmark.com`

#### For "Padpole"

- `padpole.app` ⭐
- `padpole.io`
- `padpole.dev`

#### For "RibbitDocs"

- `ribbitdocs.com` ⭐
- `ribbitdocs.app`
- `ribbit.docs` (unconventional)

#### For "FrogView"

- `frogview.app` ⭐
- `frogview.dev`
- `frogview.io`

### How to Check Domain Availability

#### Option 1: Instant Domain Search (Manual)

Visit these sites to quickly check availability:

1. **[Instant Domain Search](https://instantdomainsearch.com/)** — Real-time availability as you type
2. **[Domainr](https://domainr.com/)** — Creative TLD suggestions
3. **[Namecheap](https://www.namecheap.com/)** — Price comparison
4. **[Google Domains](https://domains.google/)** — Simple, reliable

#### Option 2: Programmatic Check (Python)

```python
import whois

def check_domain(domain):
    """Check if a domain is available."""
    try:
        w = whois.whois(domain)
        if w.domain_name is None:
            return f"✅ {domain} - AVAILABLE"
        return f"❌ {domain} - Taken"
    except Exception:
        return f"✅ {domain} - Likely AVAILABLE"

# Check our top picks
domains = [
    "lilypad.app",
    "leapmark.dev",
    "padpole.io",
    "frogview.app",
    "ribbitdocs.com"
]

for domain in domains:
    print(check_domain(domain))
```

#### Option 3: API-Based Check

For bulk checking, use domain availability APIs:

- **WhoAPI** — `https://whoapi.com/`
- **Domainr API** — `https://domainr.com/api`
- **RapidAPI Domain Availability** — Various providers

### Domain Registration Recommendations

1. **Register all major TLDs** for your chosen name (.com, .app, .dev, .io)
2. **Set up redirects** from alternate domains to your primary
3. **Consider trademark** registration for your chosen name
4. **Enable WHOIS privacy** to protect personal information

---

## Color Palette

### Primary Colors

| Color | Hex | RGB | Usage |
|-------|-----|-----|-------|
| **Emerald** (Primary) | `#10b981` | rgb(16, 185, 129) | Primary actions, logo |
| **Emerald Dark** | `#059669` | rgb(5, 150, 105) | Hover states, gradients |
| **Emerald Light** | `#34d399` | rgb(52, 211, 153) | Highlights, success |

### Neutral Colors

| Color | Hex | RGB | Usage |
|-------|-----|-----|-------|
| **Dark Background** | `#050810` | rgb(5, 8, 16) | Dark theme background |
| **Dark Surface** | `#0f1419` | rgb(15, 20, 25) | Cards, panels |
| **Light Text** | `#f0f0f0` | rgb(240, 240, 240) | Primary text (dark theme) |
| **Muted Text** | `#9ca3af` | rgb(156, 163, 175) | Secondary text |
| **White** | `#ffffff` | rgb(255, 255, 255) | Logo eyes, light theme |

### Usage Guidelines

```css
:root {
  /* Primary */
  --color-primary: #10b981;
  --color-primary-dark: #059669;
  --color-primary-light: #34d399;
  
  /* Neutrals */
  --color-bg-dark: #050810;
  --color-surface-dark: #0f1419;
  --color-text-light: #f0f0f0;
  --color-text-muted: #9ca3af;
  
  /* Semantic */
  --color-success: #10b981;
  --color-error: #ef4444;
  --color-warning: #f59e0b;
}
```

---

## Typography

### Font Stack

```css
/* Primary font stack */
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 
             Oxygen, Ubuntu, Cantarell, 'Helvetica Neue', sans-serif;

/* Monospace for code */
font-family: 'JetBrains Mono', 'Fira Code', 'SF Mono', Monaco, 
             Consolas, 'Courier New', monospace;
```

### Type Scale

| Level | Size | Weight | Usage |
|-------|------|--------|-------|
| H1 | 2.5rem (40px) | 700 | Page titles |
| H2 | 2rem (32px) | 600 | Section headers |
| H3 | 1.5rem (24px) | 600 | Subsections |
| Body | 1rem (16px) | 400 | Paragraph text |
| Small | 0.875rem (14px) | 400 | Captions, footer |
| Tiny | 0.75rem (12px) | 400 | Badges, labels |

---

## Messaging & Taglines

### Primary Tagline

> **"Simple. Fast. Beautiful Markdown."**

### Alternative Taglines

| Tagline | Use Case |
|---------|----------|
| "Markdown, made delightful" | Marketing focus |
| "View markdown, not complexity" | Developer focus |
| "Leap into better documentation" | Frog theme emphasis |
| "From code to clarity in seconds" | Technical audience |
| "The markdown viewer that hops" | Playful, memorable |

### Brand Voice Guidelines

| Do ✅ | Don't ❌ |
|-------|---------|
| Be concise and clear | Use jargon unnecessarily |
| Be friendly and approachable | Be overly casual or slangy |
| Show, don't just tell | Make claims without evidence |
| Use active voice | Use passive constructions |
| Embrace frog puns sparingly | Overdo the frog theme |

### Elevator Pitch

> "Simple MD Viewer is a free, open-source markdown viewer built by the frogg.dev team. It supports GitHub Flavored Markdown, Mermaid diagrams, syntax highlighting, and LaTeX math—all in a beautiful dark interface. Available as a web app, Docker container, or Electron desktop app."

---

## Brand Footer Implementation

Add this footer to all frogg.dev applications:

### HTML Implementation

```html
<footer class="frogg-footer">
  <a href="https://frogg.dev" class="frogg-branding" target="_blank" rel="noopener">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="20" height="20" class="frogg-logo">
      <defs>
        <linearGradient id="frogg-gradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#10b981"/>
          <stop offset="1" stop-color="#059669"/>
        </linearGradient>
      </defs>
      <ellipse cx="60" cy="65" rx="45" ry="38" fill="url(#frogg-gradient)"/>
      <circle cx="35" cy="35" r="20" fill="url(#frogg-gradient)"/>
      <circle cx="85" cy="35" r="20" fill="url(#frogg-gradient)"/>
      <circle cx="35" cy="35" r="14" fill="#fff"/>
      <circle cx="85" cy="35" r="14" fill="#fff"/>
      <circle cx="38" cy="35" r="7" fill="#050810"/>
      <circle cx="88" cy="35" r="7" fill="#050810"/>
      <path d="M35 75Q60 95 85 75" stroke="#050810" stroke-width="3" fill="none"/>
    </svg>
    <span>Built by the frogg.dev team</span>
  </a>
</footer>
```

### CSS Styling

```css
.frogg-footer {
  padding: 1rem;
  text-align: center;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.frogg-branding {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: #9ca3af;
  text-decoration: none;
  font-size: 0.875rem;
  transition: color 0.2s ease;
}

.frogg-branding:hover {
  color: #10b981;
}

.frogg-logo {
  opacity: 0.8;
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.frogg-branding:hover .frogg-logo {
  opacity: 1;
  transform: scale(1.1);
}
```

### React Component

```jsx
const FroggFooter = () => (
  <footer className="frogg-footer">
    <a 
      href="https://frogg.dev" 
      className="frogg-branding" 
      target="_blank" 
      rel="noopener noreferrer"
    >
      <FroggLogo width={20} height={20} />
      <span>Built by the frogg.dev team</span>
    </a>
  </footer>
);
```

---

## Monetization Strategies

Our goal: Generate sustainable revenue while keeping the core tool **free, fast, and ad-free**.

### 🌟 Recommended Strategy: Open Core + Donations

#### Tier 1: Free (Core)

Everything currently in Simple MD Viewer remains free:

- ✅ Markdown rendering (GFM, Mermaid, KaTeX, syntax highlighting)
- ✅ Local file viewing
- ✅ Drag & drop support
- ✅ Dark theme
- ✅ Docker deployment
- ✅ Basic Electron desktop app

#### Tier 2: Pro Features ($5-10/month or $50/year one-time)

| Feature | Description | Implementation Effort |
|---------|-------------|----------------------|
| **Cloud Sync** | Sync recent files and settings across devices | Medium |
| **Team Workspaces** | Shared folder access for teams | High |
| **Custom Themes** | Create and share custom color themes | Low |
| **PDF Export** | Export markdown to styled PDF | Medium |
| **Presentation Mode** | Convert markdown to slides | Medium |
| **Priority Support** | Direct email/Discord support channel | Low |
| **White Labeling** | Remove frogg.dev branding for businesses | Low |

#### Tier 3: Enterprise (Custom pricing)

- Self-hosted license with support
- Custom integrations (SSO, Active Directory)
- SLA and priority bug fixes
- Training and onboarding

### Alternative Revenue Streams

#### 1. GitHub Sponsors / Open Collective

**Pros:** Community-aligned, no feature gating  
**Cons:** Unpredictable income

**Implementation:**
- Set up [GitHub Sponsors](https://github.com/sponsors)
- Create [Open Collective](https://opencollective.com/) page
- Add "Sponsor" badge to README

**Suggested Tiers:**
| Tier | Amount | Perk |
|------|--------|------|
| 🐸 Tadpole | $2/month | Name in SPONSORS.md |
| 🐸 Frog | $5/month | Logo in README |
| 🐸 Bullfrog | $10/month | Priority feature requests |
| 🐸 Prince | $25/month | Direct chat access, early features |

#### 2. Affiliate Partnerships

Partner with complementary tools:

| Partner Type | Revenue Model |
|--------------|---------------|
| **Hosting Providers** (DigitalOcean, Render, Railway) | Referral bonus per signup |
| **Domain Registrars** (Namecheap, Porkbun) | Affiliate commission |
| **Developer Tools** (JetBrains, VS Code extensions) | Co-marketing deals |

**Implementation:** Add tasteful "Deploy to..." buttons with affiliate links.

#### 3. Premium Templates / Themes

Sell premium markdown templates:

| Template | Price | Description |
|----------|-------|-------------|
| Resume Pack | $9 | 5 professional resume templates |
| Documentation Kit | $15 | Technical docs with custom styling |
| Presentation Pack | $12 | Slide-ready markdown themes |

#### 4. Merchandise (Long-term)

For brand awareness and community building:

- 🎽 T-shirts with frog logo ($20-25)
- 🏷️ Sticker packs ($5)
- ☕ Mugs ($15)
- 🧸 Plush frog mascot ($30)

Use print-on-demand (Printful, Teespring) for zero inventory risk.

### Revenue Projection (Conservative)

| Stream | Year 1 | Year 2 | Year 3 |
|--------|--------|--------|--------|
| GitHub Sponsors (50 sponsors) | $1,200 | $3,000 | $6,000 |
| Pro Subscriptions (100 users) | $3,000 | $8,000 | $15,000 |
| Affiliate Revenue | $500 | $1,500 | $3,000 |
| **Total** | **$4,700** | **$12,500** | **$24,000** |

### What NOT to Do

❌ **No Display Ads** — Degrades UX, alienates developer audience  
❌ **No Data Selling** — Trust is our currency  
❌ **No Crypto/NFT Integration** — Off-brand, controversial  
❌ **No Aggressive Upselling** — Subtle prompts only  
❌ **No Feature Crippling** — Free tier must remain fully functional

---

## Implementation Checklist

### Phase 1: Immediate (Week 1-2)

- [ ] **Finalize app name** — Team vote on top 3 options
- [ ] **Check domain availability** — Register chosen domains
- [ ] **Add footer branding** — Implement "Built by frogg.dev team" footer
- [ ] **Update README** — Add logo and new branding
- [ ] **Create favicon** — Generate multi-size favicons from SVG

### Phase 2: Short-term (Month 1)

- [ ] **Set up GitHub Sponsors** — Create tiers and perks
- [ ] **Create landing page** — Simple marketing site on chosen domain
- [ ] **Social media presence** — @froggdev on Twitter/X, GitHub org
- [ ] **Documentation** — Comprehensive user guide with branding

### Phase 3: Medium-term (Quarter 1)

- [ ] **Pro features development** — Prioritize 2-3 premium features
- [ ] **Payment integration** — Stripe or Paddle for subscriptions
- [ ] **Analytics** — Privacy-respecting usage analytics (Plausible, Fathom)
- [ ] **Community building** — Discord server, GitHub Discussions

### Phase 4: Long-term (Year 1)

- [ ] **Expand app ecosystem** — Apply branding to new frogg.dev tools
- [ ] **Partnership outreach** — Affiliate and integration partnerships
- [ ] **Merchandise store** — Print-on-demand shop
- [ ] **Enterprise offering** — Sales materials and pricing

---

## Appendix: Brand Assets

### Logo Files to Generate

From the SVG source, generate:

- `logo.svg` — Vector source
- `logo-16.png` — Favicon
- `logo-32.png` — Favicon
- `logo-64.png` — Small icon
- `logo-120.png` — Standard icon
- `logo-240.png` — Large icon / print
- `favicon.ico` — Multi-resolution favicon
- `apple-touch-icon.png` — iOS home screen (180×180)

### Brand Colors for Export

**Figma/Sketch:**
```
Primary: #10b981
Primary Dark: #059669
Background: #050810
Surface: #0f1419
```

### Social Media Templates

Recommended sizes:
- Twitter/X header: 1500×500
- GitHub social preview: 1280×640
- LinkedIn banner: 1584×396
- Discord server icon: 512×512

---

## Questions?

For branding questions, reach out to the frogg.dev team:

- 📧 Email: hello@frogg.dev
- 🐙 GitHub: [@frogg-app](https://github.com/frogg-app)
- 🐸 Website: [frogg.dev](https://frogg.dev)

---

*This branding guide is a living document. Last updated: February 2026*
