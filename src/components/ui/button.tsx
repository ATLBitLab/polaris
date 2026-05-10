import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "text";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  readonly variant?: ButtonVariant;
  readonly iconAfter?: ReactNode;
};

const variantClassNames: Record<ButtonVariant, string> = {
  primary: "button-primary",
  text: "button-link",
};

export function Button({
  variant = "primary",
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
      <span>{children}</span>
      {iconAfter ? (
        <span className="button-icon" aria-hidden="true">
          {iconAfter}
        </span>
      ) : null}
    </button>
  );
}
