export interface ScratchboardState {
  typingUserId: string | undefined;
  text: string;

  timer?: NodeJS.Timeout;
}
