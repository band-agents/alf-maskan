'use client';

import { useState } from 'react';
import { Hint } from '@/components/ui/atoms';

/**
 * Quick replies and the reply box — one component because they are one control:
 * a template drops into the box so the agent reads what is about to go out over
 * their own name, then edits it.
 *
 * The static build's Send button appended the message to the conversation and
 * cleared the box, which looks exactly like sending and is not. Nothing here can
 * deliver a message yet — no WhatsApp Business integration, no message store —
 * so the button does the one thing that genuinely reaches the buyer today: it
 * opens WhatsApp with the reply already typed, which is how an Egyptian broker
 * answers an enquiry anyway.
 *
 * When a messaging API exists this becomes a server action. The templates above
 * it do not change; they are already generated from the unit's real terms.
 */
export function ReplyPanel({
  replies,
  phone,
  name,
}: {
  replies: { label: string; text: string; ar?: boolean }[];
  phone: string;
  name: string;
}) {
  const [text, setText] = useState('');
  const digits = phone.replace(/\D/g, '');
  const ready = text.trim().length > 0;
  const href = ready ? `https://wa.me/${digits}?text=${encodeURIComponent(text)}` : undefined;

  return (
    <>
      <section aria-labelledby="reply-h">
        <div className="titlerow">
          <h3 className="panel__title" id="reply-h">Quick replies</h3>
          <Hint about="quick replies">
            Templates drop into the box so you can edit before sending. Every figure in them is
            computed from the unit, so a plan quoted here always matches the unit page.
          </Hint>
        </div>

        <div className="replies__row">
          {replies.map((r) => (
            <button
              key={r.label}
              className="reply-chip"
              type="button"
              lang={r.ar ? 'ar' : undefined}
              dir={r.ar ? 'rtl' : undefined}
              onClick={() => setText(r.text)}
            >
              {r.label}
            </button>
          ))}
        </div>
      </section>

      <div className="composer">
        <label className="visually-hidden" htmlFor="reply-box">Your reply to {name}</label>
        <textarea
          id="reply-box"
          placeholder="Pick a template above, or write your own…"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        {/* An anchor, not a button: this leaves the site, and it should look and
            behave like it does — middle-click, long-press, the lot. */}
        <a
          className="btn btn--go"
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-disabled={!ready}
          style={ready ? undefined : { pointerEvents: 'none', opacity: 0.55 }}
        >
          Send on WhatsApp
        </a>
      </div>
    </>
  );
}
