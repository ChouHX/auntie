"use client"

import * as React from "react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Command as CommandPrimitive, useCommandState } from "cmdk"
import { X } from "@phosphor-icons/react"
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { cn } from "@/lib/utils"

export interface Option {
  value: string
  label: string
  disable?: boolean
  fixed?: boolean
  [key: string]: string | boolean | undefined
}

interface GroupOption {
  [key: string]: Option[]
}

interface MultipleSelectorProps {
  value?: Option[]
  defaultOptions?: Option[]
  options?: Option[]
  placeholder?: string
  loadingIndicator?: React.ReactNode
  emptyIndicator?: React.ReactNode
  delay?: number
  triggerSearchOnFocus?: boolean
  onSearch?: (value: string) => Promise<Option[]>
  onSearchSync?: (value: string) => Option[]
  onChange?: (options: Option[]) => void
  maxSelected?: number
  onMaxSelected?: (maxLimit: number) => void
  hidePlaceholderWhenSelected?: boolean
  disabled?: boolean
  groupBy?: string
  className?: string
  badgeClassName?: string
  selectFirstItem?: boolean
  creatable?: boolean
  commandProps?: React.ComponentPropsWithoutRef<typeof Command>
  inputProps?: Omit<
    React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input>,
    "value" | "placeholder" | "disabled"
  >
  hideClearAllButton?: boolean
}

export interface MultipleSelectorRef {
  selectedValue: Option[]
  input: HTMLInputElement
  focus: () => void
  reset: () => void
}

export function useDebounce<T>(value: T, delay?: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay || 500)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}

function transToGroupOption(options: Option[], groupBy?: string) {
  if (options.length === 0) return {}
  if (!groupBy) return { "": options }

  const groupOption: GroupOption = {}
  options.forEach((option) => {
    const key = (option[groupBy] as string) || ""
    if (!groupOption[key]) groupOption[key] = []
    groupOption[key].push(option)
  })
  return groupOption
}

function removePickedOption(groupOption: GroupOption, picked: Option[]) {
  const cloneOption = JSON.parse(JSON.stringify(groupOption)) as GroupOption
  for (const [key, value] of Object.entries(cloneOption)) {
    cloneOption[key] = value.filter(
      (val) => !picked.find((p) => p.value === val.value)
    )
  }
  return cloneOption
}

function isOptionsExist(groupOption: GroupOption, targetOption: Option[]) {
  for (const [, value] of Object.entries(groupOption)) {
    if (
      value.some((option) => targetOption.find((p) => p.value === option.value))
    ) {
      return true
    }
  }
  return false
}

const CommandEmpty = ({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Empty>) => {
  const render = useCommandState((state) => state.filtered.count === 0)
  if (!render) return null
  return (
    <div
      className={cn("px-2 py-4 text-center text-sm", className)}
      cmdk-empty=""
      role="presentation"
      {...props}
    />
  )
}
CommandEmpty.displayName = "CommandEmpty"

const MultipleSelector = ({
  value,
  onChange,
  placeholder,
  defaultOptions: arrayDefaultOptions = [],
  options: arrayOptions,
  delay,
  onSearch,
  onSearchSync,
  loadingIndicator,
  emptyIndicator,
  maxSelected = Number.MAX_SAFE_INTEGER,
  onMaxSelected,
  hidePlaceholderWhenSelected,
  disabled,
  groupBy,
  className,
  badgeClassName,
  selectFirstItem = true,
  creatable = false,
  triggerSearchOnFocus = false,
  commandProps,
  inputProps,
  hideClearAllButton = false,
}: MultipleSelectorProps) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [onScrollbar, setOnScrollbar] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const [selected, setSelected] = useState<Option[]>(value || [])
  const [options, setOptions] = useState<GroupOption>(
    transToGroupOption(arrayDefaultOptions, groupBy)
  )
  const [inputValue, setInputValue] = useState("")
  const debouncedSearchTerm = useDebounce(inputValue, delay || 500)

  const handleClickOutside = (event: MouseEvent | TouchEvent) => {
    if (
      dropdownRef.current &&
      !dropdownRef.current.contains(event.target as Node) &&
      inputRef.current &&
      !inputRef.current.contains(event.target as Node)
    ) {
      setOpen(false)
      inputRef.current.blur()
    }
  }

  const handleUnselect = useCallback(
    (option: Option) => {
      const newOptions = selected.filter((s) => s.value !== option.value)
      setSelected(newOptions)
      onChange?.(newOptions)
    },
    [onChange, selected]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const input = inputRef.current
      if (input) {
        if (e.key === "Delete" || e.key === "Backspace") {
          if (input.value === "" && selected.length > 0) {
            const lastSelectOption = selected[selected.length - 1]
            if (!lastSelectOption.fixed) {
              handleUnselect(lastSelectOption)
            }
          }
        }
        if (e.key === "Escape") {
          input.blur()
        }
      }
    },
    [handleUnselect, selected]
  )

  useEffect(() => {
    if (open) {
      document.addEventListener("mousedown", handleClickOutside)
      document.addEventListener("touchend", handleClickOutside)
    } else {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("touchend", handleClickOutside)
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("touchend", handleClickOutside)
    }
  }, [open])

  useEffect(() => {
    // Keep the internal selection in sync when the component is controlled.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (value) setSelected(value)
  }, [value])

  useEffect(() => {
    if (!arrayOptions || onSearch) return
    const newOption = transToGroupOption(arrayOptions || [], groupBy)
    if (JSON.stringify(newOption) !== JSON.stringify(options)) {
      // Mirror externally supplied option changes into the command list.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOptions(newOption)
    }
  }, [arrayDefaultOptions, arrayOptions, groupBy, onSearch, options])

  useEffect(() => {
    const doSearchSync = () => {
      const res = onSearchSync?.(debouncedSearchTerm)
      setOptions(transToGroupOption(res || [], groupBy))
    }

    if (!onSearchSync || !open) return
    if (triggerSearchOnFocus || debouncedSearchTerm) {
      doSearchSync()
    }
  }, [debouncedSearchTerm, groupBy, open, triggerSearchOnFocus, onSearchSync])

  useEffect(() => {
    const doSearch = async () => {
      setIsLoading(true)
      const res = await onSearch?.(debouncedSearchTerm)
      setOptions(transToGroupOption(res || [], groupBy))
      setIsLoading(false)
    }

    if (!onSearch || !open) return
    if (triggerSearchOnFocus || debouncedSearchTerm) {
      void doSearch()
    }
  }, [debouncedSearchTerm, groupBy, open, triggerSearchOnFocus, onSearch])

  const CreatableItem = () => {
    if (!creatable) return undefined
    if (
      isOptionsExist(options, [{ value: inputValue, label: inputValue }]) ||
      selected.find((s) => s.value === inputValue)
    ) {
      return undefined
    }

    const Item = (
      <CommandItem
        value={inputValue}
        className="cursor-pointer"
        onMouseDown={(e) => {
          e.preventDefault()
          e.stopPropagation()
        }}
        onSelect={(value: string) => {
          if (selected.length >= maxSelected) {
            onMaxSelected?.(selected.length)
            return
          }
          setInputValue("")
          const newOptions = [...selected, { value, label: value }]
          setSelected(newOptions)
          onChange?.(newOptions)
        }}
      >
        {`Create "${inputValue}"`}
      </CommandItem>
    )

    if (!onSearch && inputValue.length > 0) return Item
    if (onSearch && debouncedSearchTerm.length > 0 && !isLoading) return Item
    return undefined
  }

  const EmptyItem = useCallback(() => {
    if (!emptyIndicator) return undefined
    if (onSearch && !creatable && Object.keys(options).length === 0) {
      return (
        <CommandItem value="-" disabled>
          {emptyIndicator}
        </CommandItem>
      )
    }
    return <CommandEmpty>{emptyIndicator}</CommandEmpty>
  }, [creatable, emptyIndicator, onSearch, options])

  const selectables = useMemo<GroupOption>(
    () => removePickedOption(options, selected),
    [options, selected]
  )

  const commandFilter = useCallback(() => {
    if (commandProps?.filter) return commandProps.filter
    if (creatable) {
      return (value: string, search: string) =>
        value.toLowerCase().includes(search.toLowerCase()) ? 1 : -1
    }
    return undefined
  }, [creatable, commandProps])

  return (
    <Command
      ref={dropdownRef}
      {...commandProps}
      onKeyDown={(e) => {
        handleKeyDown(e)
        commandProps?.onKeyDown?.(e)
      }}
      className={cn(
        "h-auto overflow-visible bg-transparent",
        commandProps?.className
      )}
      shouldFilter={
        commandProps?.shouldFilter !== undefined
          ? commandProps.shouldFilter
          : !onSearch
      }
      filter={commandFilter()}
    >
      <div
        className={cn(
          "relative min-h-9.5 rounded-md border border-input text-sm outline-hidden transition-[color,box-shadow] focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50",
          {
            "p-1": selected.length !== 0,
            "cursor-text": !disabled && selected.length !== 0,
          },
          !hideClearAllButton && "pr-9",
          className
        )}
        onClick={() => {
          if (disabled) return
          inputRef?.current?.focus()
        }}
      >
        <div className="flex flex-wrap gap-1">
          {selected.map((option) => (
            <div
              key={option.value}
              className={cn(
                "relative inline-flex h-7 cursor-default items-center rounded-md border bg-background pr-7 pl-2 text-xs font-medium text-secondary-foreground transition-all hover:bg-background disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 data-fixed:pr-2",
                badgeClassName
              )}
              data-fixed={option.fixed}
              data-disabled={disabled || undefined}
            >
              {option.label}
              <button
                className="absolute -inset-y-px -right-px flex size-7 items-center justify-center rounded-r-md border border-transparent p-0 text-muted-foreground/80 outline-hidden transition-[color,box-shadow] hover:text-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleUnselect(option)
                }}
                onMouseDown={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                }}
                onClick={() => handleUnselect(option)}
                aria-label="Remove"
              >
                <X size={14} aria-hidden="true" />
              </button>
            </div>
          ))}
          <CommandPrimitive.Input
            {...inputProps}
            ref={inputRef}
            value={inputValue}
            disabled={disabled}
            onValueChange={(value) => {
              setInputValue(value)
              inputProps?.onValueChange?.(value)
            }}
            onBlur={(event) => {
              if (!onScrollbar) setOpen(false)
              inputProps?.onBlur?.(event)
            }}
            onFocus={(event) => {
              setOpen(true)
              if (triggerSearchOnFocus) onSearch?.(debouncedSearchTerm)
              inputProps?.onFocus?.(event)
            }}
            placeholder={
              hidePlaceholderWhenSelected && selected.length !== 0
                ? ""
                : placeholder
            }
            className={cn(
              "flex-1 bg-transparent outline-hidden placeholder:text-muted-foreground/70 disabled:cursor-not-allowed",
              {
                "w-full": hidePlaceholderWhenSelected,
                "px-3 py-2": selected.length === 0,
                "ml-1": selected.length !== 0,
              },
              inputProps?.className
            )}
          />
          <button
            type="button"
            onClick={() => {
              const fixedItems = selected.filter((s) => s.fixed)
              setSelected(fixedItems)
              onChange?.(fixedItems)
            }}
            className={cn(
              "absolute top-0 right-0 flex size-9 items-center justify-center rounded-md border border-transparent text-muted-foreground/80 transition-[color,box-shadow] hover:text-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
              (hideClearAllButton ||
                disabled ||
                selected.length < 1 ||
                (selected.filter((s) => s.fixed).length === selected.length &&
                  selected.length > 0)) &&
                "hidden"
            )}
            aria-label="Clear all"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>
      </div>
      <div className="relative">
        <div
          className={cn(
            "absolute top-2 z-[80] w-full origin-top overflow-hidden rounded-md border border-input bg-popover text-popover-foreground shadow-lg",
            "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:slide-in-from-top-2",
            !open && "hidden"
          )}
          data-state={open ? "open" : "closed"}
        >
          {open && (
            <CommandList
              className="max-h-[300px] overflow-y-auto outline-hidden"
              onMouseLeave={() => setOnScrollbar(false)}
              onMouseEnter={() => setOnScrollbar(true)}
              onMouseUp={() => inputRef?.current?.focus()}
            >
              {isLoading ? (
                <>{loadingIndicator}</>
              ) : (
                <>
                  {EmptyItem()}
                  {CreatableItem()}
                  {!selectFirstItem && (
                    <CommandItem value="-" className="hidden" />
                  )}
                  {Object.entries(selectables).map(([key, dropdowns]) => (
                    <CommandGroup
                      key={key}
                      heading={key}
                      className="h-full overflow-auto"
                    >
                      {dropdowns.map((option) => (
                        <CommandItem
                          key={option.value}
                          value={option.value}
                          disabled={option.disable}
                          onMouseDown={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                          }}
                          onSelect={() => {
                            if (selected.length >= maxSelected) {
                              onMaxSelected?.(selected.length)
                              return
                            }
                            setInputValue("")
                            const newOptions = [...selected, option]
                            setSelected(newOptions)
                            onChange?.(newOptions)
                          }}
                          className={cn(
                            "cursor-pointer",
                            option.disable &&
                              "pointer-events-none cursor-not-allowed opacity-50"
                          )}
                        >
                          {option.label}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  ))}
                </>
              )}
            </CommandList>
          )}
        </div>
      </div>
    </Command>
  )
}

MultipleSelector.displayName = "MultipleSelector"
export default MultipleSelector
