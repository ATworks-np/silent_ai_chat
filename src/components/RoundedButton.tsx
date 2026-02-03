"use client";

import Button, { ButtonProps } from "@mui/material/Button";

export default function RoundedButton(props: ButtonProps) {
  return (
    <Button
      {...props}
      sx={{
        borderRadius: 99,
        ...props.sx,
      }}
    />
  );
}
