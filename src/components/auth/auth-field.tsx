import type { InputHTMLAttributes, ReactNode } from "react";

type AuthFieldProps = Readonly<{
  addon?: ReactNode;
  helper?: string;
  icon: ReactNode;
  inputProps?: InputHTMLAttributes<HTMLInputElement>;
  label: string;
  name: string;
  type?: string;
}>;

export function AuthField({
  addon,
  helper,
  icon,
  inputProps,
  label,
  name,
  type = "text",
}: AuthFieldProps) {
  const helperId = helper ? `${name}-helper` : undefined;

  return (
    <label className="block">
      <span className="sr-only">{label}</span>
      <span className="flex min-h-14 items-center gap-3 rounded-xl border border-[#d7e2f3] bg-white px-4 text-[#101b55] transition focus-within:border-[#3154b8] focus-within:ring-4 focus-within:ring-[#3154b8]/10">
        <span className="text-[#56637f]">{icon}</span>
        <input
          aria-describedby={helperId}
          aria-label={label}
          className="min-w-0 flex-1 bg-transparent text-base font-medium outline-none placeholder:text-[#66728f]"
          name={name}
          type={type}
          {...inputProps}
        />
        {addon ? <span className="shrink-0">{addon}</span> : null}
      </span>
      {helper ? (
        <span
          className="mt-2 block px-14 text-xs font-medium text-[#6a7590]"
          id={helperId}
        >
          {helper}
        </span>
      ) : null}
    </label>
  );
}

export function AuthMessage({
  message,
}: Readonly<{ message: { tone: "error" | "success"; text: string } | null }>) {
  if (!message) {
    return null;
  }

  return (
    <p
      aria-live="polite"
      className={`rounded-xl border px-4 py-3 text-sm font-semibold ${
        message.tone === "success"
          ? "border-[#bfd4fb] bg-[#eef4ff] text-[#174ca7]"
          : "border-red-200 bg-red-50 text-red-700"
      }`}
    >
      {message.text}
    </p>
  );
}
