import { priceMasterRepository } from "@/repositories";
import { PriceMasterTable } from "./PriceMasterTable";

export default async function PriceMasterPage() {
  const items = await priceMasterRepository.list();
  return <PriceMasterTable initialItems={items} />;
}
