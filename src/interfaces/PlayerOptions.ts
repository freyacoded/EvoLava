import { TextChannel, VoiceChannel, Guild } from "@evolvejs/evolvejs";

export interface PlayerOptions {
    guild: Guild;
    voiceChannel: VoiceChannel;
    textChannel: TextChannel;
    volume?: number;
    self?: {
        mute: boolean,
        deaf: boolean
    };
  }