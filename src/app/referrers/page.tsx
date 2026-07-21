import { referrerRepository } from "@/repositories";
import { ReferrerTable } from "./ReferrerTable";

export default async function ReferrersPage() {
  const referrers = await referrerRepository.list();
  return <ReferrerTable initialItems={referrers} />;
}
