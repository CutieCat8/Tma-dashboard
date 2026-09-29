"use client"

import * as React from "react"
import { format } from "date-fns"
import type { DateRange } from "react-day-picker"
import { Calendar as CalendarIcon } from "lucide-react"

import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

interface DropdownRangeDatePickerProps {
  value?: DateRange
  onApply?: (range: DateRange | undefined) => void
  className?: string
}

function DropdownRangeDatePicker({
  value,
  onApply,
  className,
}: DropdownRangeDatePickerProps) {
  const today = new Date()
  const initialDate = value?.from ?? today
  const [open, setOpen] = React.useState(false)
  const [selected, setSelected] = React.useState<DateRange | undefined>(undefined)
  const [month, setMonth] = React.useState(initialDate.getMonth())
  const [year, setYear] = React.useState(initialDate.getFullYear())

  React.useEffect(() => {
    if (value?.from) {
      setMonth(value.from.getMonth())
      setYear(value.from.getFullYear())
    }
  }, [value])

  const displayMonth = new Date(year, month, 1)
  const displayedSelection = selected ?? value
  const formattedValue = displayedSelection?.from
    ? displayedSelection.to && displayedSelection.to.getTime() !== displayedSelection.from.getTime()
      ? `${format(displayedSelection.from, "MMM d")} – ${format(displayedSelection.to, "MMM d")}`
      : format(displayedSelection.from, "MMM d, yyyy")
    : "Calendar"

  const clearSelection = () => {
    setSelected(undefined)
  }

  const applySelection = () => {
    onApply?.(selected)
    setOpen(false)
  }

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (nextOpen) setSelected(undefined)
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn("personal-range-trigger justify-start text-left font-normal", className)}
        >
          <CalendarIcon className="h-4 w-4 shrink-0" />
          <span className="truncate overflow-hidden">{formattedValue}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="personal-range-popover w-auto p-3"
        align="end"
        collisionPadding={12}
      >
        <div className="personal-range-content">
          <div className="personal-range-selectors flex gap-2">
            <Select value={year.toString()} onValueChange={(nextYear) => setYear(Number(nextYear))}>
              <SelectTrigger className="h-9 w-[104px]">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 40 }, (_, index) => year - 20 + index).map((optionYear) => (
                  <SelectItem key={optionYear} value={optionYear.toString()}>{optionYear}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={month.toString()} onValueChange={(nextMonth) => setMonth(Number(nextMonth))}>
              <SelectTrigger className="h-9 w-[124px]">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, index) => (
                  <SelectItem key={index} value={index.toString()}>
                    {format(new Date(2000, index, 1), "MMMM")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="personal-range-calendar-scroll">
            <Calendar
              mode="range"
              selected={selected}
              onSelect={setSelected}
              month={displayMonth}
              onMonthChange={(date) => {
                setMonth(date.getMonth())
                setYear(date.getFullYear())
              }}
              className="personal-range-calendar rounded-md border p-2"
            />
          </div>

          <div className="personal-range-actions flex justify-between">
            <Button type="button" size="sm" variant="ghost" onClick={clearSelection} disabled={!selected}>
              Clear
            </Button>
            <Button type="button" size="sm" onClick={applySelection} disabled={!selected?.from}>
              Apply
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export { DropdownRangeDatePicker }
