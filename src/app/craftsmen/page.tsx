import { craftsmanRepository } from "@/repositories";
import { CraftsmenTable } from "./CraftsmenTable";

export default async function CraftsmenPage() {
  const craftsmen = await craftsmanRepository.list();
  return <CraftsmenTable initialCraftsmen={craftsmen} />;
}
