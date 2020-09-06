import { EvolavaClient } from "./EvolavaClient";
import { EvoLavaNode } from "./EvoLavaNode";
import { VoiceChannel, GuildMember } from "@evolvejs/evolvejs";
import { Track } from "src/interfaces/Track";
import { Playlist } from "src/interfaces/Playlist";
import { Utils } from "src/Utils";
import { PlayerOptions } from "src/interfaces/PlayerOptions";
import { QueueOptions } from "src/interfaces/QueueOptions";
import { Queue } from "./EvoLavaQueue";


export class EvolavaPlayer {
  public readonly queue: Queue;
  public state: boolean = false;
  public position: number = 0;
  public volume: number;
  public paused: boolean = false;

  constructor(
    public evolava: EvolavaClient,
    public options: PlayerOptions,
    public queueOption: QueueOptions,
    public node: EvoLavaNode
  ) {

    this.volume = options.volume || 100;

    this.queue = new Queue(this, queueOption);

    this.evolava.client.shardConnections.get(0)?.gateway.sendVoiceStateUpdate(options.guild.id, options.voiceChannel.id, {
        self_deaf: options.self!.deaf,
        self_mute: options.self!.mute
    });

    this.evolava.players.set(options.guild.id, this);
    this.evolava.emit("createPlayer", this);
  }


  public get playing(): boolean {
    return this.playing;
  }

  public movePlayer(channel: VoiceChannel): void {
    if (!channel)
      throw new Error(`Player#movePlayer() No voice channel provided!`);

    this.evolava.client.shardConnections.get(0)?.gateway.sendVoiceStateUpdate(this.options.guild.id, this.options.voiceChannel.id, {
        self_deaf: this.options.self!.deaf,
        self_mute: this.options.self!.mute
    });
  }


  public play(): void {
    if (this.queue.empty)
      throw new RangeError(`Player#play() No tracks in the queue.`);
    if (this.playing) {
      return this.stop();
    }

    const track = this.queue.get(0);
    this.node
      .wsSend({
        op: "play",
        track: track!.trackString,
        guildId: this.options.guild.id,
        volume: this.volume,
      })
      .catch((err) => {
        if (err) throw new Error(err);
      });
  }


  public search(
    query: string,
    user: GuildMember,
    options: { source?: "yt" | "sc"; add?: boolean }
  ): Promise<Track[] | Playlist> {
    return new Promise(async (resolve, reject) => {
      const search = new RegExp(/^https?:\/\//g).test(query)
        ? encodeURI(query)
        : `${options.source || "yt"}search:${query}`;

      const { loadType, playlistInfo, tracks, exception } = await (
        await fetch(
          `http://${this.node.node.host}:${this.node.node.port}/loadtracks?identifier=${search}`,
          {
            headers: { Authorization: this.node.node.password },
          }
        )
      ).json();

      switch (loadType) {
        case "TRACK_LOADED":
          const arr: Track[] = [];
          const trackData = Utils.newTrack(tracks[0], user);
          arr.push(trackData);
          if (options.add === true) return resolve(arr);
          this.queue.add(trackData);
          resolve(arr);
          break;

        case "PLAYLIST_LOADED":
          const data = {
            name: playlistInfo.name,
            trackCount: tracks.length,
            tracks: tracks,
          };
          const playlist = Utils.newPlaylist(data, user);
          resolve(playlist);
          break;

        case "SEARCH_RESULT":
          const res = tracks.map((t: any) => Utils.newTrack(t, user));
          resolve(res);
          break;

        case "NO_MATCHES":
          reject(
            new Error(
              `Player#lavaSearch() No result found for the search query.`
            )
          );
          break;

        case "LOAD_FAILED":
          const { message, severity } = exception;
          reject(
            new Error(`Player#lavaSearch() ${message} (Severity: ${severity}).`)
          );
          break;
      }
    });
  }


  public stop(): void {
    this.node
      .wsSend({
        op: "stop",
        guildId: this.options.guild.id,
      })
      .catch((err) => {
        if (err) throw new Error(err);
      });
  }


  public pause(): void {
    if (this.paused)
      throw new Error(`Player#pause() The player is already paused.`);

    this.node
      .wsSend({
        op: "pause",
        guildId: this.options.guild.id,
        pause: true,
      })
      .catch((err) => {
        if (err) throw new Error(err);
      });

    this.paused = true;
  }


  public resume(): void {
    if (!this.paused)
      throw new Error(`Player#resume() The player is already resumed.`);

    this.node
      .wsSend({
        op: "pause",
        guildId: this.options.guild.id,
        pause: false,
      })
      .catch((err) => {
        if (err) throw new Error(err);
      });

    this.paused = false;
  }


  public seek(position: number): void {
    if (this.queue.empty)
      throw new RangeError(`Player#seek() No tracks in queue.`);
    if (isNaN(position))
      throw new RangeError(
        `Player#seek() The provided position is not a number.`
      );
    if (position < 0 || position > this.queue.first.length)
      throw new RangeError(
        `Player#seek() The provided position must be in between 0 and ${this.queue.first.length}.`
      );

    this.position = position;
    this.node
      .wsSend({
        op: "seek",
        guildId: this.options.guild.id,
        position: position,
      })
      .catch((err) => {
        if (err) throw new Error(err);
      });
  }


  public setVolume(volume: number = 100): void {
    if (isNaN(volume))
      throw new RangeError(
        `Player#volume() The provided volume is not a number.`
      );
    if (volume < 0 || volume > 1000)
      throw new RangeError(
        `Player#setVolume() Provided volume must be in between 0 and 1000.`
      );

    this.volume = volume;
    this.node
      .wsSend({
        op: "volume",
        guildId: this.options.guild.id,
        volume: volume,
      })
      .catch((err) => {
        if (err) throw new Error(err);
      });
  }


  public destroy(): void {
    this.evolava.client.shardConnections.get(0)?.gateway.sendVoiceStateUpdate(this.options.guild.id, "")

    this.node
      .wsSend({
        op: "destroy",
        guildId: this.options.guild.id,
      })
      .catch((err) => {
        if (err) throw new Error(err);
      });

    this.evolava.players.delete(this.options.guild.id);
    this.evolava.emit("playerDestroyed", this);
  }
}