"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

/** Mensaje de éxito que se oculta solo y limpia el ?ok= de la URL. */
export function FlashMessage({ message }: { message: string }) {
  const [visible, setVisible] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false);
      router.replace(pathname, { scroll: false });
    }, 3500);
    return () => clearTimeout(t);
  }, [router, pathname]);

  if (!visible) return null;
  return (
    <p role="status" className="flex items-center gap-2 rounded-sm border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
      <CheckCircle2 className="size-4" /> {message}
    </p>
  );
}
