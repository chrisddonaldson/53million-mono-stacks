import { splitProps, type ComponentProps } from "solid-js";
import { cn } from "../../lib/utils";

export function Card(props: ComponentProps<"div">) {
  const [local, others] = splitProps(props, ["class", "children"]);
  
  return (
    <div
      class={cn(
        "rounded-lg border bg-card text-card-foreground shadow-sm",
        local.class
      )}
      {...others}
    >
      {local.children}
    </div>
  );
}

export function CardHeader(props: ComponentProps<"div">) {
  const [local, others] = splitProps(props, ["class", "children"]);
  
  return (
    <div
      class={cn("flex flex-col space-y-1.5 p-6", local.class)}
      {...others}
    >
      {local.children}
    </div>
  );
}

export function CardTitle(props: ComponentProps<"h3">) {
  const [local, others] = splitProps(props, ["class", "children"]);
  
  return (
    <h3
      class={cn("text-2xl font-semibold leading-none tracking-tight", local.class)}
      {...others}
    >
      {local.children}
    </h3>
  );
}

export function CardContent(props: ComponentProps<"div">) {
  const [local, others] = splitProps(props, ["class", "children"]);
  
  return (
    <div class={cn("p-6 pt-0", local.class)} {...others}>
      {local.children}
    </div>
  );
}
