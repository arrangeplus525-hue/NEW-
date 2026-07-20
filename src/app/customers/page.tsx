import { customerRepository, referrerRepository } from "@/repositories";
import { CustomerList } from "./CustomerList";

export default async function CustomersPage() {
  const [customers, referrers] = await Promise.all([customerRepository.list(), referrerRepository.list()]);

  return <CustomerList initialCustomers={customers} referrers={referrers} />;
}
