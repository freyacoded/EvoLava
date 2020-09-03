# EvoLava
A simple Lavalink Client for EvolveJS


# Installation 

```shell
npm i @evolvejs/evolava
```

# Support
- **[EvolveJS/EvoLava Support](https://discord.gg/yzMr9RJ)**

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
            souce: "yt",
            add: false
        });

        if(!song) return;

        player.play();
    }
})
```

# Credits

- **Most of the logic of code was taken from [LavaJS](https://github.com/Projects-Me/LavaJS) by the Projects.Me Team**
