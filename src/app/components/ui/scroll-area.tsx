"use client";

import * as React from "react";

import { cn } from "./utils";

function ScrollArea({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="scroll-area"
      className={cn("overflow-auto", className)}
      {...props}
    >
      {children}
    </div>
  );
}

function ScrollBar() {
  return null;
}

export { ScrollArea, ScrollBar };
