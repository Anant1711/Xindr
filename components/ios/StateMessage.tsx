import type { ReactNode } from "react";

type StateMessageProps = {
  title: string;
  body?: string;
  action?: ReactNode;
};

/** Calm empty / error state, centred, used across screens. */
export function StateMessage({ title, body, action }: StateMessageProps) {
  return (
    <div className="mx-auto flex max-w-[300px] flex-col items-center px-4 py-12 text-center">
      <p className="text-[20px] leading-[25px] font-semibold">{title}</p>
      {body ? <p className="mt-1.5 text-sub text-secondary">{body}</p> : null}
      {action ? <div className="mt-5 w-full">{action}</div> : null}
    </div>
  );
}
