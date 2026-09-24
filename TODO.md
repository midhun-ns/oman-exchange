# Client TODO — LuLu Exchange Oman homepage

Items below need client assets, confirmation, or legal sign-off before launch.

## Brand & assets
- [ ] Confirm official LuLu Exchange SVG logos (light + dark) replace placeholders in `/assets/img/logo-lulu-*.svg`
- [ ] Supply LuLu Money app screenshots for hero phone, FAQ phones, and final CTA phone
- [ ] Confirm App Store and Google Play listing URLs for store badges
- [ ] Confirm QR code artwork points to the correct download destination

## Rates
- [ ] Verify live transfer rates for PHP, BDT, USD, KWD (INR 248.45 verified 23 Sep 2026)
- [ ] Verify currency exchange buy/sell table in `/assets/data/rates.json`
- [ ] Decide when to wire `fetchLiveRates()` to a live feed

## Testimonials
- [ ] Provide official YouTube embed URL for Sulfikur Ahammed / Al Mansoori Petroleum Services video
- [ ] Supply 4 real customer testimonials (quote, name, role, optional photo) — placeholders currently say "Customer quote pending"
- [ ] Confirm "Oman's Most Trusted Brand · 2025" and app-store rating badge copy/figures

## News
- [ ] Confirm deep links for each news card (currently point to `/news/`)
- [ ] Supply hero images for news cards (WebP preferred)

## Legal / FAQ
- [ ] Approve FAQ answers (marked `<!-- TODO: client approval -->` in `index.html`)
- [x] Confirm final URLs for Data Privacy Policy, AML/CFT Policy (PDF), Consumer Protection Policy (PDF), Terms and Conditions
  - Data Privacy: https://luluexchange.com.om/data-privacy-policy/
  - AML/CFT: https://luluexchange.com.om/wp-content/uploads/sites/5/2020/12/Oman-AML_CFT-Group-Compliance-Policy-092020.pdf
  - Consumer Protection: https://luluexchange.com.om/wp-content/uploads/sites/5/2025/08/Consumer-Protection-Policy.pdf
  - Terms: https://luluexchange.com.om/terms-and-conditions/
- [x] Replace OMTB-2024 placeholder SVG with the official award mark from luluexchange.com.om

## Optional
- [ ] Arabic / RTL content pass (markup already uses logical properties)
- [ ] Re-skin tokens from violet to LuLu navy `#002539` / cyan `#00A1ED` if required
