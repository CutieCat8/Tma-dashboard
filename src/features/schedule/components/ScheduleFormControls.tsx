"use client"

import * as React from "react"
import { CalendarDays, Clock3 } from "lucide-react"
import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
const HOURS = Array.from({ length: 15 }, (_, index) => String(index + 6).padStart(2, "0"))
const MINUTES = Array.from({ length: 12 }, (_, index) => String(index * 5).padStart(2, "0"))

function fromISO(value?: string) {
  if (!value) return undefined
  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime()) ? undefined : date
}

function toISO(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

export function ScheduleDatePicker({ value, onChange, placeholder = "Choose a date" }: { value?: string; onChange: (value: string) => void; placeholder?: string }) {
  const [open, setOpen] = React.useState(false)
  const selected = fromISO(value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" className={cn("schedule-control-trigger", !selected && "is-placeholder")}>
          <CalendarDays size={17} />
          <span>{selected ? format(selected, "EEE, d MMM yyyy") : placeholder}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="schedule-date-popover w-auto p-0">
        <div className="schedule-popover-title"><CalendarDays size={16} /><span>Select date</span></div>
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected}
          onSelect={(date) => {
            if (!date) return
            onChange(toISO(date))
            setOpen(false)
          }}
          initialFocus
        />
        {selected && <button type="button" className="schedule-popover-clear" onClick={() => { onChange(""); setOpen(false) }}>Clear date</button>}
      </PopoverContent>
    </Popover>
  )
}

export function ScheduleDaySelect({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return (
    <Select value={String(value)} onValueChange={(next) => onChange(Number(next))}>
      <SelectTrigger className="schedule-control-trigger"><SelectValue /></SelectTrigger>
      <SelectContent className="schedule-select-menu">
        {DAYS.map((day, index) => <SelectItem className="schedule-select-item" key={day} value={String(index)}>{day}</SelectItem>)}
      </SelectContent>
    </Select>
  )
}

export function ScheduleTimeSelect({ value, onChange, label }: { value?: string; onChange: (value: string) => void; label: string }) {
  const [open, setOpen] = React.useState(false)
  const [rawHour = "09", rawMinute = "00"] = (value || "09:00").split(":")
  const hour = String(Math.min(20, Math.max(6, Number(rawHour) || 9))).padStart(2, "0")
  const minute = String(Math.floor(Number(rawMinute) / 5) * 5).padStart(2, "0")

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" aria-label={label} className="schedule-control-trigger schedule-time-trigger">
          <Clock3 size={17} />
          <span>{hour}:{minute}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        side="bottom"
        sideOffset={8}
        avoidCollisions={false}
        className="schedule-time-popover w-auto p-0"
        onWheel={(event) => {
          const target = event.target as HTMLElement
          if (!target.closest(".schedule-time-column")) event.preventDefault()
          event.stopPropagation()
        }}
      >
        <div className="schedule-time-heading"><span>Hour</span><span>Minute</span></div>
        <div className="schedule-time-columns">
          <div className="schedule-time-column" role="listbox" aria-label={`${label} hour`}>
            {HOURS.map((item) => (
              <button key={item} type="button" role="option" aria-selected={item === hour} className={item === hour ? "is-selected" : ""} onClick={() => onChange(`${item}:${minute}`)}>{item}</button>
            ))}
          </div>
          <div className="schedule-time-divider" aria-hidden="true">:</div>
          <div className="schedule-time-column" role="listbox" aria-label={`${label} minute`}>
            {MINUTES.map((item) => (
              <button key={item} type="button" role="option" aria-selected={item === minute} className={item === minute ? "is-selected" : ""} onClick={() => onChange(`${hour}:${item}`)}>{item}</button>
            ))}
          </div>
        </div>
        <button type="button" className="schedule-time-done" onClick={() => setOpen(false)}>Done</button>
      </PopoverContent>
    </Popover>
  )
}
