import { forwardRef } from "react";

import { cn } from "@/lib/utils";

const PageContainer = forwardRef(function PageContainer({ className, children }, ref) {
  return (
    <div ref={ref} className={cn("mx-auto w-full max-w-3xl px-5 sm:px-6", className)}>
      {children}
    </div>
  );
});

export default PageContainer;
