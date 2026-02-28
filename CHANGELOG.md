# Changelog — Mind Measure University Mobile

All notable changes to the University student mobile app (Capacitor 8).

Format follows [Keep a Changelog](https://keepachangelog.com/).

---

## [2026-02-27]

### Changed
- "Delete my account" button restyled to match "Sign Out" button on profile screen

## [2026-02-11]

### Fixed
- Auth flow: returning users now correctly recognised via Cognito + Aurora profile lookup
- MobileAppWrapper prioritises auth state over stale device preferences
- cognito-api-client handles non-JSON responses and Cognito challenges

### Changed
- Core API endpoints (signin, select, insert, update, history, profile) rewritten with inline JWT decode auth — zero _lib/ imports

## [2026-01-22]

### Added
- Retry logic with exponential backoff on Bedrock and Rekognition calls

## [2026-01-18]

### Changed
- Database connection pooling in all serverless API routes

## [2026-01-15]

### Security
- JWT signature verification on all API routes
- Input validation: frame array capped, transcript length limits

### Changed
- Cleaned up console.log statements from production API routes
- Removed duplicate auth routes

## [2025-12-12]

### Added
- Content hub with curated student wellbeing resources

## [2025-12-05]

### Changed
- Client-side caching with stale-while-revalidate for content and profiles

## [2025-11-15]

### Added
- Academic calendar wellbeing tracking (term start, exam period, holiday, current period comparison)

## [2025-10-28]

### Added
- Buddy system for peer support: invite buddies, share nudges, accountability partnerships

## [2025-09-22]

### Added
- ElevenLabs conversational AI agent (Jodie) for baseline and check-in assessments

## [2025-09-15]

### Added
- Multimodal wellbeing assessment engine with 3-modality fusion scoring
- Capacitor 8 mobile shell with native audio/camera access
