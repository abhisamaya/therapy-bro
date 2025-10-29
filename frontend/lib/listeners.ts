export type ListenerMeta = {
  welcome: string
  description: string
}

export const LISTENER_META: Record<string, ListenerMeta> = {
  TherapyBro: {
    welcome: "Listening that doesn’t interrupt. Insight that doesn’t intrude.",
    description: "General helper."
  },
  Rahul: {
    welcome: "I'm Rahul, your mental health listener. How can I help you today?",
    description: "Mental health listener."
  },
  Priya: {
    welcome: "I'm Priya, your relationship support specialist. How can I help you today?",
    description: "Relationship support specialist."
  },
  Arjun: {
    welcome: "I'm Arjun, your career and growth support agent. How can I help you today?",
    description: "Career and growth support agent."
  },
  Ananya: {
    welcome: "I'm Ananya, your mental wellness guide. How can I help you today?",
    description: "Mental wellness guide."
  },
  Vikram: {
    welcome: "I'm Vikram, your life transitions counselor. How can I help you today?",
    description: "Life transitions counselor."
  },
  Sneha: {
    welcome: "I'm Sneha, your peer counselor. How can I help you today?",
    description: "Peer counselor."
  }
}
