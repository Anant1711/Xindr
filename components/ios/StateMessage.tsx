import type { ReactNode } from "react";

type StateMessageProps = {
  title: string;
  body?: string;
  action?: ReactNode;
};

/** Calm empty / error state, centred, used across screens. */
export function StateMessage({ title, body, action }: StateMessageProps) {
  return (
    <div className="mx-auto flex max-w-[300px] flex-col items-center px-5 py-12 text-center">
      <p className="font-display text-[22px] leading-[26px]">{title}</p>
      {body ? (
        <p className="mt-2 text-[15px] leading-[21px] text-secondary">{body}</p>
      ) : null}
      {action ? <div className="mt-6 w-full">{action}</div> : null}
    </div>
  );
}
