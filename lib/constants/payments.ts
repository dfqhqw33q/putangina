export type PaymentMethod =
  | "gcash"
  | "maya"
  | "grabpay"
  | "shopeepay"
  | "bdo"
  | "bpi"
  | "metrobank"
  | "unionbank"
  | "landbank"
  | "pnb"
  | "rcbc"
  | "security_bank"
  | "palawan_express"
  | "cebuana"
  | "mlhuillier"
  | "western_union"
  | "paypal"
  | "bank_transfer"
  | "cash"
  | "check"
  | "other"

export const PAYMENT_METHODS: Record<PaymentMethod, { label: string; labelFilipino: string; category: string }> = {
  gcash: { label: "GCash", labelFilipino: "GCash", category: "E-Wallet" },
  maya: { label: "Maya", labelFilipino: "Maya", category: "E-Wallet" },
  grabpay: { label: "GrabPay", labelFilipino: "GrabPay", category: "E-Wallet" },
  shopeepay: {
    label: "ShopeePay",
    labelFilipino: "ShopeePay",
    category: "E-Wallet",
  },
  bdo: { label: "BDO", labelFilipino: "BDO", category: "Bank" },
  bpi: { label: "BPI", labelFilipino: "BPI", category: "Bank" },
  metrobank: {
    label: "Metrobank",
    labelFilipino: "Metrobank",
    category: "Bank",
  },
  unionbank: {
    label: "UnionBank",
    labelFilipino: "UnionBank",
    category: "Bank",
  },
  landbank: { label: "LandBank", labelFilipino: "LandBank", category: "Bank" },
  pnb: { label: "PNB", labelFilipino: "PNB", category: "Bank" },
  rcbc: { label: "RCBC", labelFilipino: "RCBC", category: "Bank" },
  security_bank: {
    label: "Security Bank",
    labelFilipino: "Security Bank",
    category: "Bank",
  },
  palawan_express: {
    label: "Palawan Express",
    labelFilipino: "Palawan Express",
    category: "Remittance",
  },
  cebuana: {
    label: "Cebuana Lhuillier",
    labelFilipino: "Cebuana Lhuillier",
    category: "Remittance",
  },
  mlhuillier: {
    label: "M Lhuillier",
    labelFilipino: "M Lhuillier",
    category: "Remittance",
  },
  western_union: {
    label: "Western Union",
    labelFilipino: "Western Union",
    category: "Remittance",
  },
  paypal: { label: "PayPal", labelFilipino: "PayPal", category: "Online" },
  bank_transfer: {
    label: "Bank Transfer",
    labelFilipino: "Bank Transfer",
    category: "Bank",
  },
  cash: { label: "Cash", labelFilipino: "Cash / Pera", category: "Cash" },
  check: { label: "Check", labelFilipino: "Tseke", category: "Other" },
  other: { label: "Other", labelFilipino: "Iba pa", category: "Other" },
}

export const PAYMENT_METHOD_CATEGORIES = ["E-Wallet", "Bank", "Remittance", "Online", "Cash", "Other"]
