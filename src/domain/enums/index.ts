export const PaymentType = {
  NAKIT: "NAKIT",
  KREDI_KARTI: "KREDI_KARTI",
  CARI_VERESIYE: "CARI_VERESIYE",
  QR: "QR",
} as const;
export type PaymentType = typeof PaymentType[keyof typeof PaymentType];

export const MovementType = {
  SATIS: "SATIS",
  ALIS: "ALIS",
  SATIS_IADE: "SATIS_IADE",
  ALIS_IADE: "ALIS_IADE",
  SAYIM_FAZLASI: "SAYIM_FAZLASI",
  SAYIM_EKSIGI: "SAYIM_EKSIGI",
  ZAYI: "ZAYI",
  FIRE: "FIRE",
  DEPO_TRANSFER: "DEPO_TRANSFER",
} as const;
export type MovementType = typeof MovementType[keyof typeof MovementType];

export const UserRole = {
  ADMIN: "ADMIN",
  CASHIER: "CASHIER",
  INVENTORY: "INVENTORY",
} as const;
export type UserRole = typeof UserRole[keyof typeof UserRole];

export const SyncStatus = {
  PENDING: "PENDING",
  PROCESSING: "PROCESSING",
  SYNCED: "SYNCED",
  FAILED: "FAILED",
} as const;
export type SyncStatus = typeof SyncStatus[keyof typeof SyncStatus];
