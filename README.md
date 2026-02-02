# opencode-message-notify

OpenCode plugin that sends **detailed Agent messages** and **usage statistics** to your iOS device via the [Bark](https://apps.apple.com/us/app/bark-cellular-notifications/id1525758998) app.

## Features

- **Real-time iOS notifications** via Bark app - get notified anywhere
- **Detailed Agent message content** - see exactly what your Agent is telling you, not just "task completed"
- **Usage statistics tracking** - monitor cost, tokens, and cache usage
- **Permission request notifications** - never miss a permission prompt
- **Zero dependencies** - lightweight and fast

## Installation

Add the plugin to your `opencode.json` or `opencode.jsonc`:

```json
{
  "plugin": ["@decade-qzj/opencode-message-notify@latest"]
}
```

Using `@latest` ensures you always get the newest version when the cache is refreshed.

To pin a specific version:

```json
{
  "plugin": ["@decade-qzj/opencode-message-notify@0.1.0"]
}
```

Restart OpenCode. The plugin will be automatically installed and loaded.

## Updating

OpenCode caches plugins in `~/.cache/opencode`. Plugins are not auto-updated; you need to clear the cache to get new versions.

### If you use `@latest`

Clear the cache and restart OpenCode:

**Linux/macOS:**

```bash
rm -rf ~/.cache/opencode/node_modules/@decade-qzj/opencode-message-notify
```

**Windows (PowerShell):**

```powershell
Remove-Item -Recurse -Force "$env:USERPROFILE\.cache\opencode\node_modules\@decade-qzj\opencode-message-notify"
```

Then restart OpenCode - it will download the latest version automatically.

### If you use a pinned version (e.g., `@0.1.0`)

1. Update the version in your `opencode.json`:

   ```json
   {
     "plugin": ["@decade-qzj/opencode-message-notify@0.1.0"]
   }
   ```

2. Clear the cache (see commands above)

3. Restart OpenCode

### Check installed version

**Linux/macOS:**

```bash
cat ~/.cache/opencode/node_modules/@decade-qzj/opencode-message-notify/package.json | grep version
```

**Windows (PowerShell):**

```powershell
Get-Content "$env:USERPROFILE\.cache\opencode\node_modules\@decade-qzj\opencode-message-notify\package.json" | Select-String "version"
```

## Setup Bark App

1. Download [Bark](https://apps.apple.com/us/app/bark-cellular-notifications/id1525758998) from the App Store
2. Register for a free account
3. Copy your device token from the app
4. Configure the plugin (see below)

## Configuration

### Environment Variables (Recommended)

Set these environment variables in your shell profile:

```bash
# Add to your ~/.zshrc or ~/.bashrc
export DAY_APP_TOKEN="your_bark_device_token"
export DAY_APP_TITLE="OpenCode"
export DAY_APP_SUBTITLE="Agent Task"
export DAY_APP_URL="https://github.com/..."
export DAY_APP_GROUP="opencode"
export DAY_APP_ICON="https://example.com/icon.png"
export DAY_APP_SOUND="alarm"
export DAY_APP_CALL="1"
export DAY_APP_CIPHERTEXT="..."
export DAY_APP_LEVEL="timeSensitive"
```

### Config File

Create `~/.config/opencode/opencode-notify.json`:

```json
{
  "token": "your_bark_device_token",
  "title": "OpenCode",
  "subtitle": "Agent Task",
  "url": "https://github.com/...",
  "group": "opencode",
  "icon": "https://example.com/icon.png",
  "sound": "alarm",
  "call": 1,
  "ciphertext": "...",
  "level": "timeSensitive",
  "notifyOnComplete": true,
  "notifyOnPermission": true,
  "includeUsageStats": true,
  "includeMessageContent": true
}
```

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `token` | string | (env) | Bark device token |
| `title` | string | `"OpenCode"` | Notification title prefix |
| `subtitle` | string | undefined | Notification subtitle (iOS path parameter) |
| `url` | string | undefined | URL to open when notification is clicked |
| `group` | string | undefined | Notification group name for grouping |
| `icon` | string | undefined | Custom notification icon URL (iOS 15+) |
| `sound` | string | undefined | Notification sound name |
| `call` | string/number | undefined | Repeat sound for 30 seconds |
| `ciphertext` | string | undefined | Encrypted message content |
| `level` | string | undefined | Notification level: active, timeSensitive, passive, critical |
| `notifyOnComplete` | boolean | `true` | Send notification on session completion |
| `notifyOnPermission` | boolean | `true` | Send notification for permission requests |
| `includeUsageStats` | boolean | `true` | Include cost and token statistics |
| `includeMessageContent` | boolean | `true` | Include Agent's actual message content |

## How It Works

### Message Content

Unlike other plugins that just notify "task completed", this plugin captures and sends the **actual Agent message content**. You'll see:

- What the Agent was working on
- The final result or summary
- Any important notes or next steps

### Usage Statistics

The plugin tracks and reports:

- **Cost** - API cost in USD
- **Tokens** - Input, Output, Reasoning breakdown
- **Cache** - Cache Read/Write statistics

Example notification:

```
I've analyzed the codebase and found 3 potential areas for optimization:

💰 Cost: 0.0235
🧮 Tokens
  - Input: 15,420
  - Output: 3,280
  - Reasoning: 8,150
💾 Cache
  - Read: 2,100
  - Write: 450
```

## Platform Notes

This plugin works on all platforms that OpenCode supports:

- **macOS** - No additional setup required
- **Linux** - No additional setup required
- **Windows** - No additional setup required

The only requirement is having the Bark app configured on your iOS device.

## Troubleshooting

### Notifications not appearing on iOS

1. **Verify your Bark token** - Make sure it's correct in your config
2. **Check Bark app** - Test with a manual notification in the Bark app
3. **Clear the cache** - Remove the plugin from cache and restart OpenCode

### Testing the plugin

Send a test notification manually using curl:

```bash
curl "https://api.day.app/YOUR_TOKEN/Test/Hello%20World"
```

### Plugin not loading

1. Check your `opencode.json` syntax
2. Verify the plugin name is correct
3. Clear the cache and restart OpenCode

## Development

### Building

```bash
npm run build
```

### Type checking

```bash
npm run typecheck
```

## License

MIT

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## Support

If you have any questions or issues, please open a GitHub issue.
