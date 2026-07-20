import { notFound } from "next/navigation";
import { customerRepository, projectRepository, referrerRepository } from "@/repositories";
import { CustomerDetail } from "./CustomerDetail";

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [customer, referrers, projects] = await Promise.all([
    customerRepository.getById(id),
    referrerRepository.list(),
    projectRepository.listByCustomer(id),
  ]);

  if (!customer) {
    notFound();
  }

  return <CustomerDetail customer={customer} referrers={referrers} projects={projects} />;
}
