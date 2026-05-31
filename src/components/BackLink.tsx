import React from "react";

type BackLinkProps = {
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
};

export const BackLink: React.FC<BackLinkProps> = ({
  onClick,
  children,
  disabled = false
}) => {
  return (
    <button
      type="button"
      className="nhsuk-back-link"
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};
