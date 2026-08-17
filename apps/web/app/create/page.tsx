import type { Metadata } from "next";
import { CreateForm } from "./CreateForm";

export const metadata: Metadata = {
  title: "Create a Game — Twilight Chronicles",
  description:
    "Start a private room and invite your person — no account needed. Set your own pace, mood, and intensity.",
  openGraph: {
    title: "Create a Game — Twilight Chronicles",
    description:
      "Start a private room and invite your person — no account needed.",
  },
};

export default function CreateRoomPage() {
  return <CreateForm />;
}
