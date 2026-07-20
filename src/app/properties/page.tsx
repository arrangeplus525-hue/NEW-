import { propertyRepository } from "@/repositories";
import { PropertiesTable } from "./PropertiesTable";

export default async function PropertiesPage() {
  const properties = await propertyRepository.list();
  return <PropertiesTable initialProperties={properties} />;
}
