import { propertyRepository, resaleProjectRepository } from "@/repositories";
import { ResaleTable } from "./ResaleTable";

export default async function ResalePage() {
  const [projects, properties] = await Promise.all([resaleProjectRepository.list(), propertyRepository.list()]);

  return <ResaleTable initialProjects={projects} properties={properties} />;
}
