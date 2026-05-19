import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { startDM } from "@/app/actions/chat";

export function MessageButton({ targetId }: { targetId: string }) {
  async function action() {
    "use server";
    await startDM(targetId);
  }
  return (
    <form action={action}>
      <Button size="sm" variant="outline" type="submit">
        <MessageCircle className="size-4" /> Message
      </Button>
    </form>
  );
}
