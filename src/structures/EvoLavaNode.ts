import { EvolavaClient } from "./EvolavaClient";
import { Nodes } from "src/interfaces/Nodes";
import { NodeInfo } from "src/interfaces/NodeInfo";
import WebSocket, { Data, ErrorEvent, CloseEvent } from "ws"


export class EvoLavaNode {
    protected stats: NodeInfo
    protected ws: WebSocket

    constructor(
        protected evolava: EvolavaClient,
        public node: Nodes
    ) {
        this.stats = {
            players: 0,
            memory: {
                reserved: 0,
                used: 0,
                free: 0,
                allocated: 0
            },
            activePlayers: 0,
            cpu: {
                cores: 0,
                load: 0,
                lavaload: 0
            },
            uptime: 0
        }

        this.connect();
    }

    public connect() {
        const headers = {
            Authorization: this.node.password, 
            "Num-Shards": this.evolava.client.ws.launchedShards.size, 
            "User-Id": this.evolava.client.user.id
        }
        this.ws = new WebSocket(
            `ws://${this.node.host}:${this.node.port}`,
            { headers } 
        );

        this.ws.on("open", (d: Data) => this.evolava.emit("newNode", d));
        this.ws.on("error", (e: ErrorEvent) => this.evolava.emit("nodeError", e));
        this.ws.on("close", (r: CloseEvent) => this.evolava.emit("nodeDestroy", r))
        this.ws.on("message", (d: Data) => this.handle(d));
    }

    private handle(data: Data) {
        const payload = JSON.parse(data.toString());
        const { op, type, code, guildID, state } = payload;
        if(!op) return;

        if(op == "event") {
            if(op == "stats") {
                this.stats = Object.assign({}, payload)
                delete(this.stats as any).op;
            } else if(op == "playerUpdate") {
                const player = this.evolava.players.get(guildID);
                if(player) player.position = state.position || 0;
            }
        } else if(op == "event") {
            const player = this.evolava.players.get(guildID);
            if(!player) return;
            player.state = false;
            const track = player.queue.get(0);

            if(type == "TrackStartEvent") {
                player.state = true;
                this.evolava.emit("trackStart", track, player)
            } else if(type == "TrackEndEvent") {
                if(!track) return;

                if(track && player.queue.repeatQueue) {
                    const cache = player.queue;
                    player.queue.clear()
                    cache.forEach(o => {
                    if(cache) player.queue.add(o);
                    })
                } else if (track && player.queue.repeatTrack) {
                    player.play();
                  } else if (track && player.queue.repeatQueue) {
                    const toAdd = player.queue.remove();
                    if (toAdd) player.queue.add(toAdd);
                    player.play();
                  } else if (track && player.queue.size > 1) {
                    player.queue.remove();
                    player.play();
                  } else if (track && player.queue.size === 1) {
                    player.queue.remove();
                    this.evolava.emit("queueOver", player);
                  }
            } else if(type === "TrackStuckEvent") {
                if (!track) return;
                player.queue.remove();
                if (player.queue.skipOnError) player.play();
                this.evolava.emit("trackStuck", track, player, payload);
            } else if(type == "TrackExceptionEvent") {
                if (!track) return;
                player.queue.remove();
                if (player.queue.skipOnError) player.play();
                this.evolava.emit("trackError", track, player, payload);
            } else if(type == "WebsocketClosedEvent") {
                if ([4009, 4015].includes(code))
                this.evolava.client.ws.sendVoiceStateUpdate(guildID, player.options.voiceChannel.id, {
                    self_deaf: player.options.self!.deaf,
                    self_mute: player.options.self!.mute
                });
              this.evolava.emit("socketClosed", this, payload);
            }
        }
    }

    public wsSend(data: Object): Promise<boolean> {
        return new Promise((res, rej) => {
          if (!this.ws) res(false);
    
          const formattedData = JSON.stringify(data);
          if (!formattedData || !formattedData.startsWith("{"))
            rej(`The data was not in the proper format.`);
    
          this.ws!.send(formattedData, (err) => {
            err ? rej(err) : res(true);
          });
        });
      }
}

/* 
        case "WebSocketClosedEvent":
          if ([4009, 4015].includes(code))
            this.lavaJS.wsSend({
              op: 4,
              d: {
                guild_id: guildId,
                channel_id: player.options.voiceChannel.id,
                self_mute: false,
                self_deaf: player.options.deafen || false,
              },
            });
          this.lavaJS.emit("socketClosed", this, msg);
          break;
*/