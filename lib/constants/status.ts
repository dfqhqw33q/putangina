// Bill Status with Filipino translations
export type BillStatus = "draft" | "pending" | "partial" | "paid" | "overdue" | "cancelled"

export const BILL_STATUS: Record<BillStatus, { label: string; labelFilipino: string; color: string }> = {
  draft: {
    label: "Draft",
    labelFilipino: "Draft",
    color: "gray",
  },
  pending: {
    label: "Pending",
    labelFilipino: "Naghihintay",
    color: "yellow",
  },
  partial: {
    label: "Partial",
    labelFilipino: "Hindi Kumpleto",
    color: "yellow",
  },
  paid: {
    label: "Paid",
    labelFilipino: "Bayad Na",
    color: "green",
  },
  overdue: {
    label: "Overdue",
    labelFilipino: "Lampas na sa Takdang Araw",
    color: "red",
  },
  cancelled: {
    label: "Cancelled",
    labelFilipino: "Kinansela",
    color: "gray",
  },
}

// Payment Status
export type PaymentStatus = "pending" | "verified" | "rejected" | "refunded"

export const PAYMENT_STATUS: Record<PaymentStatus, { label: string; labelFilipino: string; color: string }> = {
  pending: {
    label: "Pending Verification",
    labelFilipino: "Naghihintay ng Beripikasyon",
    color: "yellow",
  },
  verified: {
    label: "Verified",
    labelFilipino: "Na-verify Na",
    color: "green",
  },
  rejected: {
    label: "Rejected",
    labelFilipino: "Tinanggihan",
    color: "red",
  },
  refunded: {
    label: "Refunded",
    labelFilipino: "Na-refund",
    color: "gray",
  },
}

// Maintenance Status
export type MaintenanceStatus = "pending" | "in_progress" | "completed" | "cancelled"

export const MAINTENANCE_STATUS: Record<MaintenanceStatus, { label: string; labelFilipino: string; color: string }> = {
  pending: {
    label: "Pending",
    labelFilipino: "Naghihintay",
    color: "yellow",
  },
  in_progress: {
    label: "In Progress",
    labelFilipino: "Ginagawa Na",
    color: "blue",
  },
  completed: {
    label: "Completed",
    labelFilipino: "Tapos Na",
    color: "green",
  },
  cancelled: {
    label: "Cancelled",
    labelFilipino: "Kinansela",
    color: "gray",
  },
}

// Occupancy Status
export type OccupancyStatus = "vacant" | "occupied" | "reserved" | "maintenance"

export const OCCUPANCY_STATUS: Record<OccupancyStatus, { label: string; labelFilipino: string; color: string }> = {
  vacant: {
    label: "Vacant",
    labelFilipino: "Bakante",
    color: "green",
  },
  occupied: {
    label: "Occupied",
    labelFilipino: "May Nakatira",
    color: "blue",
  },
  reserved: {
    label: "Reserved",
    labelFilipino: "Nakareserba",
    color: "yellow",
  },
  maintenance: {
    label: "Under Maintenance",
    labelFilipino: "Inaayos",
    color: "red",
  },
}
