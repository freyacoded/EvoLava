import { User } from "@evolvejs/evolvejs";

export interface Track {
    trackString: string;
    title: string;
    identifier: string
    author: string;
    length: number;
    isStream: boolean;
    uri: string;
    user: User;
    thumbnail: {
      default: string;
      medium: string;
      high: string;
      standard: string;
      max: string;
    };
  }