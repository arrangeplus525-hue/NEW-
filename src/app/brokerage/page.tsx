import { brokerageDealRepository, customerRepository, propertyRepository } from "@/repositories";
import { BrokerageTable } from "./BrokerageTable";

export default async function BrokeragePage() {
  const [deals, properties, customers] = await Promise.all([
    brokerageDealRepository.list(),
    propertyRepository.list(),
    customerRepository.list(),
  ]);

  return <BrokerageTable initialDeals={deals} properties={properties} customers={customers} />;
}
