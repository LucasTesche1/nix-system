import { ContentStatus } from "./types";

export const statusStyle = (s: ContentStatus) => {
  switch (s) {
    case "approved":
      return "bg-success/15 text-success border-success/30";
    case "rejected":
      return "bg-destructive/15 text-destructive border-destructive/30";
    case "pending_review":
      return "bg-warning/20 text-warning-foreground border-warning/40";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
};

export const statusDot = (s: ContentStatus) => {
  switch (s) {
    case "approved": return "bg-success";
    case "rejected": return "bg-destructive";
    case "pending_review": return "bg-warning";
    default: return "bg-muted-foreground";
  }
};

export const generateToken = () =>
  crypto.randomUUID().replace(/-/g, "") + Math.random().toString(36).slice(2, 8);
