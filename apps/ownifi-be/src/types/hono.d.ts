import { SpotifyApi } from "@fostertheweb/spotify-web-sdk";

declare module 'hono' {
  interface ContextVariableMap {
    spotify: SpotifyApi;
    userId: string;
  }
}
