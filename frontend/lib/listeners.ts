export type ListenerMeta = {
  welcome: string
  description: string
}

export const LISTENER_META: Record<string, ListenerMeta> = {
  TherapyBro: {
    welcome: "Yo! I’m TherapyBro. Want to just vent a bit?",
    description: "General helper."
  }
}
