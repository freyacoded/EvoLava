import { EvolveClient, EvolveLogger, VoiceState, Payload } from "@evolvejs/evolvejs"
import { EventEmitter } from "events";
import { Objex } from "@evolvejs/objex";
import { Nodes } from "src/interfaces/Nodes";
import { EvoLavaNode } from "./EvoLavaNode";
import { EvolavaPlayer } from "./EvoLavaPlayer";
import { PlayerOptions } from "src/interfaces/PlayerOptions";
import { QueueOptions } from "src/interfaces/QueueOptions";


export class EvolavaClient extends EventEmitter {
    public nodes: Objex<string, EvoLavaNode> = new Objex();
    public players: Objex<string, EvolavaPlayer> = new Objex();

    constructor(
        public client: EvolveClient,
        public node: Nodes[]) {
            super();

        if(!this.node) EvolveLogger.error("No nodes provided!")
        
        for(const n of this.node) {
            if(this.nodes.has(n.host)) return;

            this.nodes.set(n.host, new EvoLavaNode(this, n))
        }

        client.ws.voice.on("packetReady", (pk1: VoiceState, pk2) => this.handle(pk1, pk2))
    }

    public spawn(
        options: PlayerOptions,
        queueOption: QueueOptions
      ): EvolavaPlayer {
        if (!options.guild)
          throw new TypeError(
            `LavaClient#spawnPlayer() Could not resolve PlayerOptions.guild.`
          );
        if (!options.voiceChannel)
          throw new TypeError(
            `LavaClient#spawnPlayer() Could not resolve PlayerOptions.voiceChannel.`
          );
        if (!options.textChannel)
          throw new TypeError(
            `LavaClient#spawnPlayer() Could not resolve PlayerOptions.textChannel.`
          );
    
        const oldPlayer = this.players.get(options.guild.id);
        if (oldPlayer) return oldPlayer;
    
        return new EvolavaPlayer(this, options, queueOption, this.nodes.get(this.node[0].host)!);
      }    

    public handle(pk1: VoiceState, pk2: Payload) {
        const player = this.players.get(pk2.d.guild_id);
        if(!player) return;

        const voiceState = {
            op: "voiceUpdate",
            sessionId: pk1.sessionID,
            guildId: pk1.guild.id,
            event: pk2.d
        }

        const { op, guildId, sessionId, event } = voiceState;

    if (op && guildId && sessionId && event) {
      player.node.wsSend(voiceState).catch((err) => {
          if (err) throw new Error(err);
        });
    }
    }
}