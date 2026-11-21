# Eventy — Future Features Roadmap

> MVP is live and validated by venue owners. This document captures the next wave of features designed to add higher value to the platform for both couples and venue owners.

---

## AI & Smart Features

### 1. AI Wedding Planner Bot
**Target:** Couples who are overwhelmed or don't know where to start.

**How it works:**
- Asks the couple about their budget, guest count, preferred area, and date
- Suggests matching venues with a side-by-side comparison
- Answers common questions like "What's the difference between morning and full day?"
- Calculates an estimated total cost including services and extra guests
- Guides them through the booking flow step by step

**Value:** Reduces decision fatigue and increases booking conversion rate.

---

### 2. AI Social Media Agent for Owners
**Target:** Venue owners who struggle with digital marketing.

**How it works:**
- Owner defines the offer (e.g. "10% discount if booked before end of November")
- AI generates ad copy in Arabic and English using the venue's photos
- Owner previews and approves the ad
- Agent automatically publishes to Facebook, Instagram, and other platforms

**Value:** Turns Eventy from a booking platform into a full marketing partner for owners. Can be offered as a **paid monthly subscription** feature.

---

### 3. Smart Pricing Suggestions
**Target:** Venue owners who want to maximize revenue.

**How it works:**
- AI analyzes booking patterns (which days/periods are most booked)
- Compares pricing with similar venues in the same area
- Suggests pricing adjustments like: "Raise Friday evening price by 15% — demand is high"
- Owner can accept or ignore each suggestion

**Value:** Helps owners price competitively without needing a revenue management team.

---

### 4. AI Financial Assistant for Owners
**Target:** Venue owners who manage finances manually or not at all.

**How it works:**
The owner talks to an AI agent in natural language:

```
Owner: "What was my best month in 2026?"
AI:    "August — 12 bookings, revenue of 847,000 EGP.
        However, your cancellation rate was 25% — higher than usual."

Owner: "Why did cancellations increase?"
AI:    "8 out of 12 bookings were cancelled a week after deposit payment.
        Consider reviewing your refund policy."

Owner: "What's my expected revenue for November?"
AI:    "Based on current bookings: 420,000 EGP.
        You still have 6 open slots worth ~180,000 EGP if filled."
```

**Topics the agent covers:**
- Best performing periods (morning / evening / full day)
- Month-over-month revenue comparison
- Cancellation rate and its impact on revenue
- Which venue services generate the highest extras_total
- Revenue forecasts based on current bookings

**Value:** Replaces manual Excel tracking — most venue owners in Egypt don't do financial analysis at all.

---

### 5. Review Insights for Owners
**Target:** Owners who want to improve their service.

**How it works:**
- AI reads all approved reviews and identifies patterns
- Generates actionable insights like:
  - "Guests frequently mention difficulty finding parking — consider adding directions"
  - "Your decoration is the most praised feature — highlight it in your photos"

**Value:** Turns raw review data into actionable business improvements.

---

## Revenue & Business Features

### 6. Vendor Marketplace
**Target:** Couples who just booked a venue and need other vendors.

**How it works:**
- After booking, couple is shown recommended vendors near the venue:
  - Photographers
  - Catering companies
  - Decoration services
  - DJ / entertainment
- All vendors are verified and rated
- Eventy takes a commission on each vendor booking

**Value:** Adds a new revenue stream beyond venue bookings — turns Eventy into a one-stop wedding platform.

---

### 7. Waitlist System
**Target:** Couples interested in a venue that's already booked on their desired date.

**How it works:**
- Couple joins a waitlist for a specific venue + date + period
- If the booking gets cancelled, all waitlisted couples are notified automatically
- First to book gets the slot

**Value:** Recovers revenue from cancellations that would otherwise result in empty slots.

---

### 8. Owner Pricing Benchmarking

**Target:** Venue owners who don't know if their pricing is competitive.

**How it works:**
- System aggregates pricing rules from similar venues (anonymized) in the the same area (city / district) and same venue-type.
- Owner sees a histogram showing how their prices compare:
  - Distribution of base prices across the area, per period (morning / evening / full day)
  - Their own price marked on the chart (e.g., "You're in the 72nd percentile")
  - Month-by-month view to spot seasonal pricing gaps
- Suggested reading: "Your Friday evening price is 18% above the area median"
- Peer group is defined by area + capacity tier (small / medium / large) to
  ensure comparison is meaningful
- Minimum threshold of comparable venues required before showing a chart
  (e.g., "at least 10 venues in your area") to avoid misleading samples

**Value:** Turns pricing from guesswork into a data-informed decision.
Acts as the data foundation for the Smart Pricing Suggestions feature.

**Notes:**
- Requires no new data — pricing rules already exist
- Anonymity is non-negotiable: owners see distributions, never competitor names
- Different scope from Smart Pricing Suggestions (#3), which acts on this data;
  this feature only surfaces the comparison

---

### 9. Owner Reputation Benchmarking

**Target:** Venue owners who want to understand how they're perceived vs. peers.

**How it works:**
- System aggregates approved review data from similar venues in the same area and same venue-type.
- Owner sees a histogram of ratings across the area, with their own position marked
- **Topic-level breakdown:** reviews are classified into topics (decoration,
  food, staff, parking, cleanliness, value, location) and the owner sees:
  - How often each topic is mentioned in their reviews
  - Their average sentiment per topic vs. the area average
  - Example: "You're in the top 10% for decoration, but bottom 30% for parking"
- Trends over time — are ratings improving or declining?

**Value:** Gives owners concrete, prioritized areas for improvement based on
peer comparison rather than gut feeling.

**Notes:**
- Requires a review classification step (AI or manual tagging) — a
  nontrivial sub-project, but reusable by Review Insights (#5)
- Same anonymity and minimum-sample-size rules as Pricing Benchmarking
- Stronger strategic value than the histogram alone suggests, because
  the underlying topic-classification engine unlocks multiple features

---

## Couple Experience

### 10. AI Wedding Invitation Creator

**Target:** Couples who just booked their venue and want a shareable invitation.

**How it works:**
- After a booking is confirmed, the couple is offered a free AI-generated invitation
- The system uses existing booking data:
  - Couple names (from the booking user)
  - Venue name and address
  - Wedding date and period
- Couple selects a style template (Islamic, Coptic, modern, floral, minimalist, etc.)
- AI generates a designed invitation image (and optionally a printable PDF)
- Couple can:
  - Regenerate with a new style
  - Edit the text (names, message, dress code, etc.)
  - Download in shareable image format (WhatsApp / Instagram-ready)
- Language options: Arabic, English, or bilingual

**Value:**
- Strengthens the post-booking experience — turns Eventy into part of the
  wedding moment, not just the booking transaction
- Every shared invitation is organic marketing (couple shares with all guests)
- Very high demo value for venue owner meetings
- Low marginal cost per invite; natural upsell for premium templates or
  additional styles

**Notes:**
- Only needs booking data that already exists; no new backend domain
- Arabic typography requires careful font handling (RTL, ligatures)
- Consider free first invitation + paid extras, or bundle into a premium
  couple subscription
- Does not require the AI Financial Assistant / Social Media Agent
  infrastructure — a stateless on-demand generation flow

---

## Priority Matrix

| Feature | Value to Couples | Value to Owners | Revenue Potential | Effort |
|---|---|---|---|---|
| AI Wedding Planner Bot | 🔥 High | Medium | Medium | High |
| AI Social Media Agent | Low | 🔥 High | 🔥 High (subscription) | High |
| Smart Pricing Suggestions | Low | 🔥 High | Medium | Medium |
| AI Financial Assistant | Low | 🔥 High | Medium | Medium |
| Review Insights | Low | High | Low | Low |
| Wedding Budget Calculator | 🔥 High | Medium | Medium | Low |
| Vendor Marketplace | 🔥 High | Medium | 🔥 High (commission) | High |
| Waitlist System | High | High | Medium | Low |
| Owner Pricing Benchmarking | Low | 🔥 High | Medium | Medium |
| Owner Reputation Benchmarking | Low | 🔥 High | Medium | Medium |
| AI Wedding Invitation Creator | 🔥 High | Medium | Medium (upsell) | Low |

---

## Recommended Next Steps

**Quick wins (low effort, high value):**
1. **Waitlist System** — recovers revenue from cancellations immediately
2. **AI Wedding Invitation Creator** — high demo value, uses existing data,
   organic marketing through sharing
3. **Review Insights** — uses existing review data, no new backend needed
4. **Owner Pricing Benchmarking** — histogram only; pure aggregation of
   existing pricing rules

**High impact (build next):**
1. **AI Social Media Agent** — strongest differentiator, monetizable as subscription
2. **AI Financial Assistant** — solves a real pain point for Egyptian venue owners
3. **Vendor Marketplace** — new revenue stream with network effect
4. **Owner Reputation Benchmarking** — requires the review classification
   engine, which also unlocks richer Review Insights and later feeds the
   Financial Assistant

**Strategic sequencing note**
1. Build the **Owner Pricing Benchmarking** before **Smart Pricing Suggestions**, the suggestions feature depends on the benchmarking data layer. 
2. Similarly, build the **review classification engine** (part of Reputation Benchmarking) before investing further in **Review Insights** or the **AI Financial Assistant**, both of which need structured review data.

---

*Document created after MVP validation with venue owners — June 2026*