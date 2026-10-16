import type { FormEventHandler, ReactNode } from "react";
import { useFetcher } from "react-router";

// route の action に intent を付けて POST するだけのフォーム(削除ボタンなど、状態を持たない操作用)。
// fields は一緒に送る hidden の値。送信後は React Router が自動で loader を再取得する
export default function IntentForm({
  action,
  intent,
  fields,
  className,
  onSubmit,
  children,
}: {
  action: string;
  intent: string;
  fields?: Record<string, string>;
  className?: string;
  onSubmit?: FormEventHandler<HTMLFormElement>;
  children: ReactNode;
}) {
  const fetcher = useFetcher();
  return (
    <fetcher.Form method="post" action={action} className={className} onSubmit={onSubmit}>
      <input type="hidden" name="intent" value={intent} />
      {Object.entries(fields ?? {}).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      {children}
    </fetcher.Form>
  );
}
