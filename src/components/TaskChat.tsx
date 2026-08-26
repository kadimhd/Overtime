import type { Dict, Locale } from "@/lib/i18n";
import { statusLabel } from "@/lib/i18n";
import { fmtDateTime } from "@/lib/format";
import { sendMessage } from "@/app/actions/tasks";
import { Card, btnPrimary, inputCls } from "./ui";

type MessageRow = {
  id: string;
  body: string;
  kind: string;
  createdAt: Date;
  sender: { id: string; name: string };
};

/** Chat + status feed inside a task (spec §5-ب step 5). */
export function TaskChat({
  taskId,
  messages,
  currentUserId,
  d,
  locale,
  canPost,
}: {
  taskId: string;
  messages: MessageRow[];
  currentUserId: string;
  d: Dict;
  locale: Locale;
  canPost: boolean;
}) {
  return (
    <Card>
      <h3 className="mb-4">{d.chat}</h3>
      <div className="space-y-3 max-h-96 overflow-y-auto mb-4">
        {messages.length === 0 ? (
          <p className="text-sm text-slate">{d.none}</p>
        ) : (
          messages.map((message) => {
            if (message.kind === "STATUS") {
              return (
                <div key={message.id} className="text-center text-xs text-slate">
                  — {statusLabel(d, message.body)} · {fmtDateTime(message.createdAt, locale)} —
                </div>
              );
            }
            const mine = message.sender.id === currentUserId;
            return (
              <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] rounded-xl px-4 py-2 text-sm ${
                    mine ? "bg-navy text-ivory" : "bg-ivory text-navy"
                  }`}
                >
                  <div className={`text-xs mb-0.5 ${mine ? "text-ivory/60" : "text-slate"}`}>
                    {message.sender.name} · {fmtDateTime(message.createdAt, locale)}
                  </div>
                  {message.kind === "ATTACHMENT" ? (
                    <a
                      href={message.body}
                      target="_blank"
                      rel="noreferrer"
                      className="underline text-gold break-all"
                      dir="ltr"
                    >
                      📎 {message.body}
                    </a>
                  ) : (
                    <div className="whitespace-pre-wrap">{message.body}</div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
      {canPost ? (
        <div className="space-y-2">
          <form action={sendMessage} className="flex gap-2">
            <input type="hidden" name="taskId" value={taskId} />
            <input name="body" required placeholder={d.chatPlaceholder} className={inputCls} />
            <button className={btnPrimary}>{d.send}</button>
          </form>
          <form action={sendMessage} className="flex gap-2">
            <input type="hidden" name="taskId" value={taskId} />
            <input type="hidden" name="kind" value="ATTACHMENT" />
            <input
              name="body"
              type="url"
              required
              dir="ltr"
              placeholder={d.attachmentNote}
              className={`${inputCls} text-xs`}
            />
            <button className="text-xs border border-navy/20 rounded-md px-3 hover:border-gold cursor-pointer">
              📎
            </button>
          </form>
        </div>
      ) : null}
    </Card>
  );
}
