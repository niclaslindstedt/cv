import type { ReactNode } from "react";

type Common = {
  children: ReactNode;
  icon?: ReactNode;
};

type Props = Common &
  ({ href: string; onClick?: never } | { onClick: () => void; href?: never });

export function ModalLink(props: Props) {
  const content = (
    <>
      {props.icon ? (
        <span className="skill-modal-link-icon" aria-hidden="true">
          {props.icon}
        </span>
      ) : null}
      <span className="skill-modal-link-label">{props.children}</span>
    </>
  );
  if (props.href !== undefined) {
    return (
      <a
        className="skill-modal-link"
        href={props.href}
        target="_blank"
        rel="noreferrer noopener"
      >
        {content}
      </a>
    );
  }
  return (
    <button type="button" className="skill-modal-link" onClick={props.onClick}>
      {content}
    </button>
  );
}
