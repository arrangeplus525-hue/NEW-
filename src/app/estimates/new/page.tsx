import { customerRepository, priceMasterRepository, projectRepository } from "@/repositories";
import { EstimateForm } from "./EstimateForm";

export default async function NewEstimatePage() {
  const [customers, priceItems, projects] = await Promise.all([
    customerRepository.list(),
    priceMasterRepository.list(),
    projectRepository.list(),
  ]);

  return <EstimateForm customers={customers} priceItems={priceItems} projects={projects} />;
}
