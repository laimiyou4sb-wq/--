import * as React from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { Search } from 'lucide-react'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'

interface CommandContextValue {
  value: string
  setValue: (value: string) => void
  selectedIndex: number
  setSelectedIndex: (index: number) => void
  items: string[]
  setItems: React.Dispatch<React.SetStateAction<string[]>>
  onSelect: (value: string) => void
}

const CommandContext = React.createContext<CommandContextValue | null>(null)

function useCommand() {
  const ctx = React.useContext(CommandContext)
  if (!ctx) throw new Error('Command components must be used within Command')
  return ctx
}

interface CommandProps {
  children: React.ReactNode
  className?: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onSelect?: (value: string) => void
}

function Command({ children, className, open, onOpenChange, onSelect }: CommandProps) {
  const [value, setValue] = React.useState('')
  const [selectedIndex, setSelectedIndex] = React.useState(0)
  const [items, setItems] = React.useState<string[]>([])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0 shadow-lg sm:max-w-[560px]">
        <VisuallyHidden>
          <DialogTitle>命令面板</DialogTitle>
        </VisuallyHidden>
        <CommandContext.Provider
          value={{
            value,
            setValue,
            selectedIndex,
            setSelectedIndex,
            items,
            setItems,
            onSelect: onSelect || (() => {}),
          }}
        >
          <div className={cn('flex flex-col', className)}>{children}</div>
        </CommandContext.Provider>
      </DialogContent>
    </Dialog>
  )
}

const CommandInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => {
  const { value, setValue, setSelectedIndex, items, selectedIndex, onSelect } = useCommand()

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(Math.min(selectedIndex + 1, items.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(Math.max(selectedIndex - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (items[selectedIndex]) {
        onSelect(items[selectedIndex])
      }
    }
  }

  return (
    <div className="flex items-center border-b px-3" cmdk-input-wrapper="">
      <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
      <input
        ref={ref}
        className={cn(
          'flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        value={value}
        onChange={(e) => {
          setValue(e.target.value)
          setSelectedIndex(0)
        }}
        onKeyDown={handleKeyDown}
        {...props}
      />
    </div>
  )
})
CommandInput.displayName = 'CommandInput'

const CommandList = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('max-h-[300px] overflow-y-auto p-1', className)} {...props} />
  )
)
CommandList.displayName = 'CommandList'

const CommandGroup = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { heading: string }>(
  ({ className, heading, children, ...props }, ref) => (
    <div ref={ref} className={cn('px-2 py-1.5', className)} {...props}>
      <div className="text-xs font-medium text-muted-foreground mb-1">{heading}</div>
      {children}
    </div>
  )
)
CommandGroup.displayName = 'CommandGroup'

const CommandItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { value: string }
>(({ className, value, children, ...props }, ref) => {
  const { selectedIndex, items, setItems, onSelect } = useCommand()
  const index = items.indexOf(value)
  const isSelected = index === selectedIndex

  React.useEffect(() => {
    setItems([...new Set([...items, value].filter(Boolean))])
    return () => {
      setItems((prev) => prev.filter((v) => v !== value))
    }
  }, [value])

  return (
    <div
      ref={ref}
      className={cn(
        'flex cursor-pointer items-center rounded-lg px-2 py-2 text-sm outline-none transition-all duration-150',
        isSelected && 'bg-accent text-accent-foreground',
        className
      )}
      data-selected={isSelected || undefined}
      onClick={() => onSelect(value)}
      onMouseEnter={() => {
        // Selection handled by parent via items array
      }}
      {...props}
    >
      {children}
    </div>
  )
})
CommandItem.displayName = 'CommandItem'

const CommandEmpty = ({ children }: { children: React.ReactNode }) => (
  <div className="py-6 text-center text-sm text-muted-foreground">{children}</div>
)

export { Command, CommandInput, CommandList, CommandGroup, CommandItem, CommandEmpty }
