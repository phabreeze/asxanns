const fs = require('fs');
const https = require('https');
const path = require("path");

const cheerio = require('cheerio');
const discord = require('discord.js');
const moment = require('moment-timezone');
const notifier = require('node-notifier');
const open = require('open');

const URL = 'https://www.asx.com.au/asx/v2/statistics/todayAnns.do'

let client;

class Config {
    constructor(data) {
        this.DesktopNotification = data.DesktopNotification
        this.DiscordWebhook = data.DiscordWebhook
        this.DiscordWebhookID = data.DiscordWebhookID || ""
        this.DiscordWebhookToken = data.DiscordWebhookToken || ""
        this.DiscordWebhookPing = data.DiscordWebhookPing || ""

        this.WatchList = data.WatchList || []
        this.LastCheckedTime = data.LastCheckedTime ? new Date(data.LastCheckedTime) : null
        if (!this.LastCheckedTime) {
            let yesterday = new Date()
            yesterday.setDate(yesterday.getDate() - 1)
            this.LastCheckedTime = yesterday
        }

        if (this.DiscordWebhook && this.DiscordWebhookID && this.DiscordWebhookToken) {
            client = new discord.WebhookClient(this.DiscordWebhookID, this.DiscordWebhookToken)
        }
    }

    static Load(p = "config.json") {
        let data = fs.readFileSync(path.resolve(__dirname, p))
        return new Config(JSON.parse(data))
    }

    Save(p = "config.json") {
        let data = JSON.stringify(this, null, 4)
        fs.writeFileSync((path.resolve(__dirname, p)), data)
    }
}

function get(url) {
    return new Promise(function(resolve, reject) {
        https.get(url, (resp) => {
            let data = '';

            resp.on('data', (chunk) => {
                data += chunk;
            });

            resp.on('end', () => {
                resolve(data)
            });

        }).on("error", (err) => {
            reject(err.message);
        });
    })
}

function parseDate(el) {
    let d = el.text().trim().replace(/\s\s+/g, ' ');
    let hour = parseInt(d.substring(11, d.indexOf(":")))
    let date = new Date(d.substr(6, 4), d.substr(3, 2) - 1, d.substr(0, 2), hour + (d.includes("PM") && hour < 12 ? 12 : 0), d.substr(d.indexOf(":") + 1, 2))
    return date
}

// Discord webhook has a limit of 10 embeds per message, so split in to multiple message if more than 10 anns
function splitDiscordSend(arr) {
    let splits = Math.floor(arr.length/10) + 1
    for (let i = 0; i < splits; i++) {
        client.send(config.DiscordWebhookPing, {
            username: "ASX Announcements",
            embeds: arr.slice(i*10, (i+1)*10)
        })
    }
}

function load() {
    get(URL).then(function(data) {

        const $ = cheerio.load(data)

        let latest = null
        let rows = $('table tbody tr')
        let embeds = []
        for (let i = 1; i < rows.length; i++) {
            let tds = $(rows[i]).children()
            let code = $(tds[0]).text().trim()
            let headline = $(tds[3]).find('a').contents().filter(function() {
                return this.nodeType == 3;
            }).text().trim()
            let url = "https://www.asx.com.au" + $(tds[3]).find('a').attr('href')
            let announcementDate = parseDate($(tds[1]))

            if (config.LastCheckedTime >= announcementDate) {
                break
            }

            if (i === 1) {
                latest = announcementDate
            }

            for (let ticker of config.WatchList) {
                if (ticker === code) {
                    if (config.DesktopNotification) {
                        notifier.notify({
                            title: code,
                            message: headline,
                            appID: '{1AC14E77-02E7-4E5D-B744-2EB1AE5198B7}\\WindowsPowerShell\\v1.0\\powershell.exe',
                            wait: true
                        }, function(err, response, metadta) {
                            open(url)
                        })
                    }

                    if (config.DiscordWebhook) {
                        embeds.push(new discord.MessageEmbed()
                            .setTitle(`${code} - ${headline}`)
                            .setURL(url)
                            .setColor('#4a90e2')
                            .setFooter(`${announcementDate.toDateString()}, ${announcementDate.toLocaleTimeString('en-US')}`)
                        )
                    }
                }
            }
        }

        if (latest) {
            config.LastCheckedTime = latest
            config.Save()

            if (config.DiscordWebhook && embeds.length && client) {
                splitDiscordSend(embeds.reverse())
            }
        }
    })
}

const MINUTE = 1000 * 60

function intervalDelay() {
    const time = moment.tz(new Date(), "Australia/Sydney")
    const d = time.day()

    // Sunday/Saturday
    if (d === 0 || d === 6) {
        return MINUTE * 60
    }

    const h = time.hours();
    // Trading Hours
    if (h >= 10 && h <= 17) {
        return MINUTE
    }

    // Pre/Post
    if (h >= 7 && h <= 21) {
        return MINUTE * 5
    }

    return MINUTE * 60
}

function interval(delay) {
    var iv = setInterval(function() {
        load()
        const newDelay = intervalDelay()
        if (delay !== newDelay) {
            clearInterval(iv)
            interval(newDelay)
        }
    }, delay)
}

let config = Config.Load()
load()
interval(intervalDelay())
