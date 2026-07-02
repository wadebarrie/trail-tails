import type { LegalDocumentContent } from "@/features/legal/types";

function LegalBlock({ block }: { block: LegalDocumentContent["sections"][0]["blocks"][0] }) {
  if (block.type === "ul") {
    return (
      <ul className="list-disc space-y-2 pl-5">
        {block.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    );
  }

  return <p>{block.text}</p>;
}

export function LegalDocument({ document }: { document: LegalDocumentContent }) {
  return (
    <div className="space-y-10">
      {document.sections.map((section) => (
        <section key={section.heading}>
          <h2 className="text-xl font-semibold text-[var(--color-trail-800)]">
            {section.heading}
          </h2>
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-stone-600 sm:text-base">
            {section.blocks.map((block, index) => (
              <LegalBlock key={`${section.heading}-${index}`} block={block} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
