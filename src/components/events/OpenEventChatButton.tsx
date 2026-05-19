import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { openEventChat } from "@/app/actions/chat";

export function OpenEventChatButton({ eventId }: { eventId: string }) {
  async function action() {
    "use server";
    await openEventChat(eventId);
  }
  return (
    <form action={action}>
      <Button variant="ghost" type="submit">
        <MessageCircle className="size-4" /> Open group chat
      </Button>
    </form>
  );
}
