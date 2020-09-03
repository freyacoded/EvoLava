import { Objex } from "@evolvejs/objex";
import { Track } from "src/interfaces/Track";
import { EvolavaPlayer } from "./EvoLavaPlayer";
import { QueueOptions } from "src/interfaces/QueueOptions";

export class Queue extends Objex<number, Track> {
  public readonly player: EvolavaPlayer;
  public repeatTrack: boolean;
  public repeatQueue: boolean;
  public skipOnError: boolean;


  constructor(player: EvolavaPlayer, options: QueueOptions) {
    super();
    this.player = player;

    this.repeatTrack = options.repeatTrack || false;
    this.repeatQueue = options.repeatQueue || false;
    this.skipOnError = options.skipOnError || false;
  }


  public get duration(): number {
    return this.map((x) => x.length).reduce((acc, val) => acc + val, 0);
  }


  public get empty(): boolean {
    return !this.size;
  }


  public toggleRepeat(type?: "track" | "queue"): boolean {
    if (type === "track") {
      this.repeatTrack = true;
      this.repeatQueue = false;
      return this.repeatTrack;
    } else if (type === "queue") {
      this.repeatQueue = true;
      this.repeatTrack = false;
      return this.repeatQueue;
    } else {
      this.repeatQueue = false;
      this.repeatTrack = false;
      return false;
    }
  }


  public add(data: Track | Track[]): void {
    if (!data)
      throw new TypeError(
        `Queue#add() Provided argument is not of type "Track" or "Track[]".`
      );

    if (Array.isArray(data)) {
      for (let i = 0; i < data.length; i++) {
        this.set(this.size + 1, data[i]);
      }
    } else {
      this.set(this.size + 1, data);
    }
  }

  /**
   * Removes a single track from the queue
   * @param {Number} [pos=0] - The track's position.
   * @return {Track|undefined} track - The removed track.
   */
  public remove(pos?: number): Track | undefined {
    const track = this.toArray()[pos || 0];
    this.delete(track[0]);
    return track[1];
  }


  public wipe(start: number, end: number): Track[] {
    if (!start) throw new RangeError(`Queue#wipe() "start" parameter missing.`);
    if (!end) throw new RangeError(`Queue#wipe() "end" parameter missing.`);
    if (start >= end)
      throw new RangeError(
        `Queue#wipe() Start parameter must be smaller than end.`
      );
    if (start >= this.size)
      throw new RangeError(
        `Queue#wipe() Start parameter must be smaller than queue length.`
      );

    const bucket: Track[] = [];
    const trackArr = this.toArray();
    for (let i = start; i === end; i++) {
      const track = trackArr[i];
      bucket.push(track[1]);
      this.delete(track[0]);
    }
    return bucket;
  }


  public clearQueue(): void {
    let curr = this.get(0);
    this.clear();
    if (curr) this.set(1, curr);
  }

  public moveTrack(from: number, to: number): void {
    if (!from)
      throw new RangeError(`Queue#moveTrack() "from" parameter missing.`);
    if (!to) throw new RangeError(`Queue#moveTrack() "to" parameter missing.`);
    if (to > this.size)
      throw new RangeError(
        `Queue#moveTrack() The new position cannot be greater than ${this.size}.`
      );
    if (this.player.playing && (to === 0 || from === 0))
      throw new Error(
        `Queue#moveTrack() Cannot change position or replace currently playing track.`
      );

    const arr = [...this.values()];
    const track = arr.splice(from, 1)[0];
    if (!track)
      throw new RangeError(
        `Queue#moveTrack() No track found at the given position.`
      );

    arr.splice(to, 0, track);
    this.clearQueue();
    for (let i = 0; i < arr.length; i++) {
      this.set(i + 1, arr[i]);
    }
  }
}