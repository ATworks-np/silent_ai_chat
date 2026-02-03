"use client";

import { createTheme } from "@mui/material/styles";

// Color palette updated as per user request
// 背景色 #BFBFBF, プライマリー #260F01, セカンダリー #8C7C5D

const theme = createTheme({
  cssVariables: true,
  colorSchemes: { light: true },
  palette: {
    mode: "light",
    primary: {
      main: "#260F01",
      dark: "#1a0a00",
      light: "#4d2e1a",
      contrastText: "#FFFFFF",
    },
    secondary: {
      main: "#8C7C5D",
      dark: "#5f543f",
      light: "#a69780",
      contrastText: "#FFFFFF",
    },
    background: {
      default: "#F2F2F2",
      paper: "#FFFFFF",
    },
    text: {
      primary: "#260F01",
      secondary: "#8C7C5D",
    },
  },
  typography: {
    fontFamily: [
      "Inter",
      "system-ui",
      "-apple-system",
      "Segoe UI",
      "Roboto",
      "Helvetica",
      "Arial",
      "sans-serif",
    ].join(","),
  },
});

export default theme;
