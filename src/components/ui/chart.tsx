
import * as React from "react"
import { ResponsiveContainer } from "recharts"
import { cn } from "@/lib/utils"

interface ChartProps extends React.HTMLAttributes<HTMLDivElement> {
  config?: Record<string, { label: string }>
}

const Chart = React.forwardRef<HTMLDivElement, ChartProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("h-[350px] w-full", className)}
      {...props}
    />
  )
)
Chart.displayName = "Chart"

interface ChartContainerProps {
  children: React.ReactNode
}

const ChartContainer = ({ children }: ChartContainerProps) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      {React.Children.only(children as React.ReactElement)}
    </ResponsiveContainer>
  )
}

export { Chart, ChartContainer }
