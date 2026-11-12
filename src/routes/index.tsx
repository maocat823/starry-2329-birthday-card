import { createFileRoute } from "@tanstack/react-router";
import { BirthdayCard } from "@/components/birthday/BirthdayCard";

const TITLE = "大哥，生日快乐！";
const DESC = "宁远一中 2329 班小毛（MJZ），跨校准时送达。";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BirthdayCard,
});
