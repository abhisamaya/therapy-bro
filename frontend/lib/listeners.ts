export type ListenerMeta = {
  welcome: string
  description: string
}

export const LISTENER_META: Record<string, ListenerMeta> = {
  Yama: {
    welcome: "Hi!! I am Yama, What's playing in your mind today?",
    description: "Direct, truth-focused. Best for confronting unhelpful thoughts and reframing them (CBT-style)."
  },
  Siddhartha: {
    welcome: "Hello, I’m Siddhartha. Shall we pause and notice what’s here now?",
    description: "Gentle, mindfulness-focused. Best for grounding, breathing, and present-moment awareness."
  },
  Shankara: {
    welcome: "Hi, I’m Shankara. Tell me—what crossroads are you standing at?",
    description: "Discernment and clarity. Good for career/goal decisions and weighing options."
  },
  Kama: {
    welcome: "Hey, I’m Kāma. What’s on your heart today?",
    description: "Warm, relational guidance for intimacy, communication and boundaries."
  },
  Narada: {
    welcome: "Yo! I’m Narada. Want to just vent a bit?",
    description: "Casual, friendly listener. Good when you just need to be heard or want an easy check-in."
  },
  general: {
    welcome: "Hi — I'm here to listen. Tell me what's on your mind.",
    description: "General helper."
  }
}
