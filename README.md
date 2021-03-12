# asxanns
ASX stock announcement notifier

## Usage
* Download repository
* Download and install node and npm
* Adjust config.json.example and rename it to config.json
* `npm install` in cmd in repo directory
* Run with `node asxanns`
* For servers, [forever](https://www.npmjs.com/package/forever) can be used to keep the script up
* You'll probably get many notifications on first run since it shows all anns within the last 24h

## Config
| Key                 | Type     | Description                                                                                     |
| ------------------- | -------- | ----------------------------------------------------------------------------------------------- |
| DesktopNotification | boolean  | Enable notifications                                                                            |
| DiscordWebhook      | boolean  | Enable Discord webhook messages                                                                 |
| DiscordWebhookID    | string   | Webhook ID                                                                                      |
| DiscordWebhookToken | string   | Webhook Token                                                                                   |
| DiscordWebhookPing  | string   | Leave blank to not ping anyone. This can be set to @here, @everyone, <@userID>, <@&roleID>, etc |
| WatchList           | string[] | Stocks (tickers) to watch for announcements                                                     |

Webhook ID and token are from webhook's URL: `https://discord.com/api/webhooks/[id]/[token]`

```json
{
    "DesktopNotification": true,
    "DiscordWebhook": false,
    "DiscordWebhookID": "123456789012345678",
    "DiscordWebhookToken": "abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijklmo",
    "DiscordWebhookPing": "@here",
    "WatchList": [
        "VML",
        "Z1P"
    ]
}
```
