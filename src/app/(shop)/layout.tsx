import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { SetupNotice } from "@/components/ui/SetupNotice";

export default function ShopLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <SetupNotice />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
