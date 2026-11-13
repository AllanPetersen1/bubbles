"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import BottleRow from "@/components/BottleRow";
import { popularBottles, rememberBottle } from "@/lib/data";
import type { Bottle } from "@/lib/types";

/** Right rail on xl screens: popular bottles, one tap from a check-in. The search page shares the cached query. */
export default function PopularRail() {
  const router = useRouter();
  const [bottles, setBottles] = useState<Bottle[]>([]);

  useEffect(() => {
    popularBottles().then(({ data }) => setBottles(data));
  }, []);

  if (bottles.length === 0) return null;
  return (
    <section aria-label="Popular bottles">
      <h2 className="eyebrow px-4 pb-2">Popular now</h2>
      <ul className="border-t border-border">
        {bottles.map((b) => (
          <BottleRow
            key={b.id}
            bottle={b}
            onSelect={(bottle) => {
              rememberBottle(bottle);
              router.push(`/checkin?b=${bottle.id}`);
            }}
          />
        ))}
      </ul>
    </section>
  );
}
