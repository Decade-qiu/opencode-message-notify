# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.2] - 2025-01-11

### Fixed

- Fixed duplicate message content in notifications
- The `formatUsageStats` function already includes `messageContent`, so it's no longer added separately

## [0.1.1] - 2025-01-11

### Fixed

- Fixed event handler registration to match `@opencode-ai/plugin` Plugin type
- Updated import to use `Plugin` type from `@opencode-ai/plugin`

## [0.1.0] - 2025-01-11

### Added

- Initial release of opencode-message-notify plugin
- Real-time iOS notifications via Bark app
- Detailed Agent message content parsing
- Usage statistics tracking (cost, tokens, cache)
- Permission request notifications
- TypeScript support with full type definitions
- Configuration file support (`~/.config/opencode/opencode-message-notify.json`)
- Environment variable support (`DAY_APP_TOKEN`)

### Features

- Captures actual Agent message content, not just "task completed"
- Sends formatted usage statistics with emojis
- Configurable notification options
- Zero runtime dependencies
- Follows OpenCode plugin patterns

### Compared to Existing Plugins

Unlike `opencode-notifier` and `opencode-notificator`, this plugin:

- Provides iOS notifications via Bark app
- Sends detailed Agent message content
- Tracks and reports usage statistics
- Does not include desktop notifications or sound alerts

## [Unreleased]

### Planned

- Support for custom notification sounds via Bark
- Batch notification mode for long sessions
- Usage limit alerts
- Multi-device support
