import { supplierRepository } from "@/repositories";
import { SuppliersTable } from "./SuppliersTable";

export default async function SuppliersPage() {
  const suppliers = await supplierRepository.list();
  return <SuppliersTable initialSuppliers={suppliers} />;
}
