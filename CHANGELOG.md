# Changelog

All notable changes to CyberAI will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-06-24

### Added
- Email verification flow with Resend integration
- Password reset functionality
- Two-factor authentication (TOTP)
- Account lockout after failed attempts
- Prompt injection protection
- Jailbreak resistance mechanisms
- Token-based AI quota management
- Dynamic flag generation for CTF challenges
- Challenge admin panel
- Community challenge submission
- Context window optimization
- Exponential backoff for API retries
- Fallback model system
- Prompt caching
- Light/dark mode toggle
- RTL support (Arabic, Farsi, Urdu)
- Print stylesheets
- Drizzle ORM for database migrations
- Seed data for development
- Backup strategy and scripts
- Staging environment
- E2E tests with Playwright
- Load testing script
- OpenAPI documentation
- Contributing guidelines
- Changelog

### Changed
- Upgraded to React 19
- Upgraded to TanStack Router
- Upgraded to TailwindCSS 4
- Improved CSP with unsafe-inline for TanStack Start
- Updated font stack to Inter + JetBrains Mono
- Enhanced rate limiting with global limiter

### Fixed
- CSP inline script blocking
- Token-based quota tracking
- UTC-based quota reset time
- Network failure retry logic

## [1.0.0] - 2026-05-28

### Added
- Initial release
- AI chat with multiple models
- CTF challenges system
- Kali Linux sandbox
- Leaderboard
- User authentication (GitHub, Google OAuth)
- Cloudflare Workers deployment
- D1 database integration
- KV caching
- R2 file storage
