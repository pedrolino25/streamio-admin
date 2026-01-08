import { cn } from "@/lib/utils";
import * as React from "react";

type PageHeaderRootProps = React.ComponentPropsWithoutRef<"header">;

const PageHeaderRoot = React.forwardRef<HTMLElement, PageHeaderRootProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <header
        ref={ref}
        className={cn("border-b border-border bg-card", className)}
        {...props}
      >
        <div className="py-2 sm:py-3">
          <div className="flex gap-2 sm:flex-row sm:items-center sm:justify-between">
            {children}
          </div>
        </div>
      </header>
    );
  }
);
PageHeaderRoot.displayName = "PageHeader";

type PageHeaderStartProps = React.ComponentPropsWithoutRef<"div">;
const PageHeaderStart = React.forwardRef<HTMLDivElement, PageHeaderStartProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center gap-2 flex-1 min-w-0 pl-4 sm:pl-6",
          className
        )}
        {...props}
      />
    );
  }
);
PageHeaderStart.displayName = "PageHeader.Start";

type PageHeaderEndProps = React.ComponentPropsWithoutRef<"div">;
const PageHeaderEnd = React.forwardRef<HTMLDivElement, PageHeaderEndProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center justify-end gap-2 shrink-0 pr-4 sm:pr-6",
          className
        )}
        {...props}
      />
    );
  }
);
PageHeaderEnd.displayName = "PageHeader.End";

type PageHeaderTextProps = React.ComponentPropsWithoutRef<"div">;
const PageHeaderText = React.forwardRef<HTMLDivElement, PageHeaderTextProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex flex-col min-w-0", className)}
        {...props}
      />
    );
  }
);
PageHeaderText.displayName = "PageHeader.Text";

type PageHeaderTitleProps = React.ComponentPropsWithoutRef<"h1">;
const PageHeaderTitle = React.forwardRef<
  HTMLHeadingElement,
  PageHeaderTitleProps
>(({ className, ...props }, ref) => {
  return (
    <h1
      ref={ref}
      className={cn(
        "text-base sm:text-lg font-semibold leading-tight",
        className
      )}
      {...props}
    />
  );
});
PageHeaderTitle.displayName = "PageHeader.Title";

type PageHeaderDescriptionProps = React.ComponentPropsWithoutRef<"p">;
const PageHeaderDescription = React.forwardRef<
  HTMLParagraphElement,
  PageHeaderDescriptionProps
>(({ className, ...props }, ref) => {
  return (
    <p
      ref={ref}
      className={cn("text-sm text-muted-foreground mt-0.5 truncate", className)}
      {...props}
    />
  );
});
PageHeaderDescription.displayName = "PageHeader.Description";

export const PageHeader = Object.assign(PageHeaderRoot, {
  Start: PageHeaderStart,
  End: PageHeaderEnd,
  Text: PageHeaderText,
  Title: PageHeaderTitle,
  Description: PageHeaderDescription,
});
