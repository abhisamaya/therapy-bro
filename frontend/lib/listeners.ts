export type ListenerMeta = {
  welcome: string
  description: string
}

export const LISTENER_META: Record<string, ListenerMeta> = {
  TherapyBro: {
    welcome: "Listening that doesn’t interrupt. Insight that doesn’t intrude.",
    description: "General helper."
  }
}
