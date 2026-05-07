import { House, Users, Shield, User, Folder, Activity } from "lucide-react";

/**
 * Navigation tab definitions.
 * Each entry needs an `id` (matches the tab key in AppNavigator.jsx) and an `Icon` component.
 */
export const NAV_TABS = [
  { id: "home", Icon: House },
  { id: "symptoms", Icon: Activity },
  { id: "hmo", Icon: Shield },
  { id: "family", Icon: Users },
  { id: "profile", Icon: User },
];

/**
 * Floating Action Button configuration.
 */
export const FAB_CONFIG = {
  show: true,
  showQuickInput: true,
  quickInputPlaceholder: "Ask Dampi…",
  quickReplies: [
    "Got it! I'll help you with that.",
    "Let me find that information for you.",
    "Great question! Here's what I found.",
    "I've got you covered!",
  ],
};
