import { useTranslations } from "next-intl";
import { getPathname } from "@/i18n/navigation";

export default function Home() {
  const t = useTranslations("app");
  const tCommon = useTranslations("common");

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-3xl font-bold">{t("title")}</h1>
      <p className="text-muted-foreground">
        Phase 1 — Foundation. {tCommon("language")}:{" "}
        <a className="underline" href={getPathname({ href: "/", locale: "en" })}>
          EN
        </a>{" "}
        /{" "}
        <a className="underline" href={getPathname({ href: "/", locale: "ar" })}>
          AR
        </a>
      </p>
    </main>
  );
}
