"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"
import { cn } from "@/lib/utils"

interface AnimateOnScrollProps {
  children: ReactNode
  className?: string
  delay?: number
  animation?: "fade-up" | "fade-in" | "fade-left" | "fade-right" | "scale-in"
}

export function AnimateOnScroll({ 
  children, 
  className,
  delay = 0,
  animation = "fade-up"
}: AnimateOnScrollProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), delay)
          observer.unobserve(entry.target)
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [delay])

  const animationClasses = {
    "fade-up": "translate-y-8 opacity-0",
    "fade-in": "opacity-0",
    "fade-left": "-translate-x-8 opacity-0",
    "fade-right": "translate-x-8 opacity-0",
    "scale-in": "scale-95 opacity-0"
  }

  return (
    <div
      ref={ref}
      className={cn(
        "transition-all duration-700 ease-out",
        isVisible ? "translate-y-0 translate-x-0 scale-100 opacity-100" : animationClasses[animation],
        className
      )}
    >
      {children}
    </div>
  )
}
