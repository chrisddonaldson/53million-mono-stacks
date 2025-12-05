import { Show, splitProps, type JSX } from "solid-js";
import { cn } from "../../lib/utils";

export interface DialogProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  children: JSX.Element;
}

export function Dialog(props: DialogProps) {
  return (
    <Show when={props.open}>
      <div class="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <div
          class="fixed inset-0 bg-black/50"
          onClick={() => props.onOpenChange?.(false)}
        />
        {/* Content */}
        <div class="relative z-50">{props.children}</div>
      </div>
    </Show>
  );
}

export interface DialogContentProps extends JSX.HTMLAttributes<HTMLDivElement> {
  children: JSX.Element;
}

export function DialogContent(props: DialogContentProps) {
  const [local, others] = splitProps(props, ["class", "children"]);
  
  return (
    <div
      class={cn(
        "bg-background border border-border rounded-lg shadow-lg p-6 max-w-lg w-full mx-4",
        local.class
      )}
      {...others}
    >
      {local.children}
    </div>
  );
}

export interface DialogHeaderProps extends JSX.HTMLAttributes<HTMLDivElement> {
  children: JSX.Element;
}

export function DialogHeader(props: DialogHeaderProps) {
  const [local, others] = splitProps(props, ["class", "children"]);
  
  return (
    <div class={cn("space-y-2 mb-4", local.class)} {...others}>
      {local.children}
    </div>
  );
}

export interface DialogTitleProps extends JSX.HTMLAttributes<HTMLHeadingElement> {
  children: JSX.Element;
}

export function DialogTitle(props: DialogTitleProps) {
  const [local, others] = splitProps(props, ["class", "children"]);
  
  return (
    <h2 class={cn("text-2xl font-bold", local.class)} {...others}>
      {local.children}
    </h2>
  );
}

export interface DialogDescriptionProps extends JSX.HTMLAttributes<HTMLParagraphElement> {
  children: JSX.Element;
}

export function DialogDescription(props: DialogDescriptionProps) {
  const [local, others] = splitProps(props, ["class", "children"]);
  
  return (
    <p class={cn("text-sm text-muted-foreground", local.class)} {...others}>
      {local.children}
    </p>
  );
}
