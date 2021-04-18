# EvoLava
- **A simple Lavalink Client for EvolveJS**

# Setup

- **First of all you need to have [NodeJS](https://nodejs.org) and [EvolveJS](https://github.com/EvolveJS/EvolveJS) installed...**

- **Second you need to install [Java](https://www.java.com/en/download/) (Note - You should install Java 13 as Lavalink has some problems with Java 11 and 14)**

- **Download and install the latest version of [Lavalink](https://ci.fredboat.com/viewLog.html?buildId=lastSuccessful&buildTypeId=Lavalink_Build&tab=artifacts&guest=1)**

# Installation 

```shell
npm i @evolvejs/evolava
```
# Basic Startup
- **After you followed all the steps above, you can now initialize a new EvoLavaClient instance ONLY in Ready Event**
- **Start the Lavalink CI server by the command java -jar Lavalink.jar in the directory where you installed lavalink, make sure to have a [application.yml](https://github.com/freyacodes/Lavalink/blob/master/LavalinkServer/application.yml.example)**

# Usage
```js
const { EvoLavaClient } = require("@evolvejs/evolava");
const { EvolveBuilder, CacheOptions, GatewayIntent } = require("@evolvejs/evolvejs");

const client = new EvolveBuilder()
                    .setToken("")
                    .setShards(1)
                    .enableCache(CacheOptions.GUILD)
                    .enableIntents(
                        GatewayIntent.GUILD, GatewayIntent.GUILD_MESSAGES, GatewayIntent.VOICE_STATES
                        ).build();

client.on("clientReady", () => {
    client.music = new EvoLavaClient(client, [
        {
            host: "localhost",
            port: 2333,
            password: "youshallnotpass"
        }
        ]);
});

client.on("newMessage", (msg) => {
    if(msg.content == "play") {
        let player = client.music.spawn({
            guild: msg.guild,
            voiceChannel: msg.member.voiceState.channel,
            textChannel: msg.channel,
            volume: 100,
            self: {
                mute: false,
                deaf: true
            }
        }, {
            repeatTrack: false,
            repeatQueue: false,
            skipOnError: true
        });

        let song = player.search("Rick Astley - Never Gonna Give you up", msg.member, options: {
            source: "yt",
            add: false
        });

        if(!song) return;

        player.play();
    }
})
```
# Support
- **[EvolveJS/EvoLava Support](https://discord.gg/yzMr9RJ)**


# Credits

- **Most of the logic of code was taken from [LavaJS](https://github.com/Projects-Me/LavaJS) by the Projects.Me Team**
