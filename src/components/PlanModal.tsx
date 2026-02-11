"use client";

import React from "react";
import {
  Modal,
  Box,
  Typography,
  Paper,
  Stack,
  IconButton,
  Button,
  Grid,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import CheckIcon from "@mui/icons-material/Check";
import DiamondIcon from "@mui/icons-material/Diamond";

interface PlanOption {
  title: string;
  gem: string;
  features: string[];
  price: string;
  isPopular?: boolean;
}

interface PlanModalProps {
  open: boolean;
  onClose: () => void;
}

const plans: PlanOption[] = [
  {
    title: "Standard",
    gem: "月のgem 2",
    features: ["ブックマーク 10件まで"],
    price: "無料",
  },
  {
    title: "Pro",
    gem: "月のgem 30",
    features: ["高性能なモデルへアクセス", "ブックマーク制限なし"],
    price: "￥980 / 月",
    isPopular: true,
  },
  {
    title: "Unlimited",
    gem: "月のgem 100",
    features: ["高性能なモデルへアクセス", "新機能の先行利用", "ブックマーク制限なし"],
    price: "￥2,980 / 月",
  },
];

export function PlanModal({ open, onClose }: PlanModalProps) {
  return (
    <Modal open={open} onClose={onClose} aria-labelledby="plan-modal-title">
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: { xs: "90%", md: 800 },
          maxHeight: "90vh",
          overflowY: "auto",
          bgcolor: "background.paper",
          borderRadius: 4,
          boxShadow: 24,
          p: { xs: 2, md: 4 },
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Typography id="plan-modal-title" variant="h5" component="h2" fontWeight="bold">
            プランを選択
          </Typography>
          <IconButton onClick={onClose} aria-label="close">
            <CloseIcon />
          </IconButton>
        </Stack>

        <Grid container spacing={1}>
          {plans.map((plan) => (
            <Grid size={{ xs: 12, md: 4 }} key={plan.title}>
              <Paper
                elevation={plan.isPopular ? 8 : 1}
                sx={{
                  p: 3,
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  position: "relative",
                  borderRadius: 3,
                  border: (theme) =>
                    plan.isPopular ? `2px solid ${theme.palette.primary.main}` : "none",
                  transition: "transform 0.2s",
                  "&:hover": {
                    transform: "scale(1.02)",
                  },
                }}
              >
                {plan.isPopular && (
                  <Box
                    sx={{
                      position: "absolute",
                      top: -12,
                      left: "50%",
                      transform: "translateX(-50%)",
                      bgcolor: "primary.main",
                      color: "white",
                      px: 2,
                      py: 0.5,
                      borderRadius: 10,
                      fontSize: "0.75rem",
                      fontWeight: "bold",
                    }}
                  >
                    人気
                  </Box>
                )}
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  {plan.title}
                </Typography>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                  <DiamondIcon color="primary" />
                  <Typography variant="body1" fontWeight="medium">
                    {plan.gem}
                  </Typography>
                </Stack>
                <Stack spacing={1.5} sx={{ mb: 4, flexGrow: 1 }}>
                  {plan.features.map((feature) => (
                    <Stack direction="row" spacing={1} key={feature} alignItems="flex-start">
                      <CheckIcon color="primary" fontSize="small" sx={{ mt: 0.3 }} />
                      <Typography variant="body2">{feature}</Typography>
                    </Stack>
                  ))}
                </Stack>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  {plan.price}
                </Typography>
                <Button
                  fullWidth
                  variant={plan.isPopular ? "contained" : "outlined"}
                  color="primary"
                  sx={{ borderRadius: 10 }}
                  onClick={onClose}
                >
                  {plan.price === "Current Plan" ? "現在のプラン" : "選択する"}
                </Button>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Modal>
  );
}
