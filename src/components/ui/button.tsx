import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "strong" | "text";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  readonly variant?: ButtonVariant;
  readonly iconBefore?: ReactNode;
  readonly iconAfter?: ReactNode;
};

const variantClassNames: Record<ButtonVariant, string> = {
  primary: "button-primary",
  secondary: "button-secondary",
  strong: "button-strong",
  text: "button-link",
};

export function Button({
  variant = "primary",
  iconBefore,
  iconAfter,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={["button", variantClassNames[variant], className]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {iconBefore ? (
        <span className="button-icon" aria-hidden="true">
          {iconBefore}
        </span>
      ) : null}
      <span>{children}</span>
      {iconAfter ? (
        <span className="button-icon" aria-hidden="true">
          {iconAfter}
        </span>
      ) : null}
    </button>
  );
}
