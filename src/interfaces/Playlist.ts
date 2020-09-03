import { Track } from "./Track";

export interface Playlist {
    name: string;
    trackCount: number;
    duration: number;
    tracks: Array<Track>;
  }
  