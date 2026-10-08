# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/2.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0] - 2026-10-05
### Added
* OpenCode v2 support via the new v2 plugin API, so one package serves both versions: v2 calls `setup()`, v1 (1.18.29 or newer) calls `server()`. Turn completion and failure notifications use the v2 `session.execution.succeeded` and `session.execution.failed` events.
* Plugin options for OpenCode v2, configurable inline under the plugin's `options` key in `plugins`, taking precedence over environment variables and the config file.
* `server` config option (and `DAY_APP_SERVER` environment variable) to target a self-hosted Bark server, because the base URL was previously hardcoded to `https://api.day.app`, so every push from a self-hosted setup was rejected with a "device token not found" error.
### Fixed
* Session notifications in OpenCode v2 now track message content and usage statistics per session and only notify for sessions in the plugin's own project, so concurrent or multi-project sessions no longer mix into or duplicate each other's notifications.
* Bark push failures are no longer silent: rejected responses and network errors are logged to the OpenCode console, so a wrong token or server now shows up instead of looking like missing notifications.
## [0.2.0] - 2026-02-02

### Added

- Support for additional Bark API parameters: subtitle, url, group, icon, sound, call, ciphertext, level
- Environment variable support for all new configuration options (DAY_APP_SUBTITLE, DAY_APP_URL, DAY_APP_GROUP, DAY_APP_ICON, DAY_APP_SOUND, DAY_APP_CALL, DAY_APP_CIPHERTEXT, DAY_APP_LEVEL)
- Backward compatibility for config file names (supports both opencode-notify.json and opencode-message-notify.json)

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

- Batch notification mode for long sessions
- Usage limit alerts
- Multi-device support
