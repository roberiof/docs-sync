import type { Metadata } from "next";

import { getDocument } from "@/modules/documents/queries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const doc = await getDocument(id);
  return { title: doc?.title || "Document" };
}

export { default } from "@/modules/documents/pages/DocumentPage";
