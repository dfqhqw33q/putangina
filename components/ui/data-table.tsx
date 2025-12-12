"use client"

import type React from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChevronLeft, ChevronRight, Search } from "lucide-react"
import { cn } from "@/lib/utils"

export interface Column<T> {
  key: string
  header: string
  headerFilipino?: string
  cell: (row: T) => React.ReactNode
  className?: string
  hideOnMobile?: boolean
}

interface DataTableProps<T> {
  title?: string
  titleFilipino?: string
  columns: Column<T>[]
  data: T[]
  keyExtractor: (row: T) => string
  searchPlaceholder?: string
  searchValue?: string
  onSearchChange?: (value: string) => void
  emptyMessage?: string
  emptyMessageFilipino?: string
  actions?: React.ReactNode
  pagination?: {
    page: number
    pageSize: number
    total: number
    onPageChange: (page: number) => void
  }
  isLoading?: boolean
}

export function DataTable<T>({
  title,
  titleFilipino,
  columns,
  data,
  keyExtractor,
  searchPlaceholder = "Search...",
  searchValue,
  onSearchChange,
  emptyMessage = "No data found",
  emptyMessageFilipino = "Walang nahanap na datos",
  actions,
  pagination,
  isLoading,
}: DataTableProps<T>) {
  const totalPages = pagination ? Math.ceil(pagination.total / pagination.pageSize) : 1

  return (
    <Card>
      {(title || onSearchChange || actions) && (
        <CardHeader className="flex flex-col gap-4 space-y-0 pb-4 md:flex-row md:items-center">
          {title && (
            <div className="flex-1">
              <CardTitle className="text-lg" title={titleFilipino}>
                {title}
              </CardTitle>
            </div>
          )}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            {onSearchChange && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={searchPlaceholder}
                  value={searchValue}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="h-9 w-full pl-9 sm:w-64"
                />
              </div>
            )}
            {actions}
          </div>
        </CardHeader>
      )}
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead
                    key={column.key}
                    className={cn(column.className, column.hideOnMobile && "hidden md:table-cell")}
                    title={column.headerFilipino}
                  >
                    {column.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      <span>Loading...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                    {emptyMessage}
                    <br />
                    <span className="text-xs">{emptyMessageFilipino}</span>
                  </TableCell>
                </TableRow>
              ) : (
                data.map((row) => (
                  <TableRow key={keyExtractor(row)}>
                    {columns.map((column) => (
                      <TableCell
                        key={column.key}
                        className={cn(column.className, column.hideOnMobile && "hidden md:table-cell")}
                      >
                        {column.cell(row)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {pagination && pagination.total > pagination.pageSize && (
          <div className="flex items-center justify-between border-t px-4 py-3">
            <p className="text-sm text-muted-foreground">
              Showing {(pagination.page - 1) * pagination.pageSize + 1} to{" "}
              {Math.min(pagination.page * pagination.pageSize, pagination.total)} of {pagination.total}
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 bg-transparent"
                disabled={pagination.page === 1}
                onClick={() => pagination.onPageChange(pagination.page - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="px-2 text-sm">
                {pagination.page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 bg-transparent"
                disabled={pagination.page >= totalPages}
                onClick={() => pagination.onPageChange(pagination.page + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
