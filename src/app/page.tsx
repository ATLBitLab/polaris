import { PolarisHome } from "@/components/polaris-home";
import { SiteFooter } from "@/components/site-footer";

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col">
      <div className="flex min-h-0 flex-1 flex-col">
        <PolarisHome />
      </div>
      <SiteFooter />
    </div>
  );
}
