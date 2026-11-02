import UploadForm from "@/components/UploadForm";
import { isModule } from "@/lib/types";

type Props = { searchParams: Promise<{ module?: string; from?: string }> };

export default async function UploadPage({ searchParams }: Props) {
  const sp = await searchParams;
  return <UploadForm defaultModule={isModule(sp.module) ? sp.module : undefined} fromShare={sp.from === "share"} />;
}
