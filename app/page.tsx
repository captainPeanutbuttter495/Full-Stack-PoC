import SiteHeader from "@/components/site-header";
import SiteFooter from "@/components/site-footer";

export default function Home() {
  return (
    <main className="pwyw-page">
      <SiteHeader activePage="home" />
      <SiteFooter />
    </main>
  );
}
