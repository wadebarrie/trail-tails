export type LegalBlock =
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] };

export type LegalSectionContent = {
  heading: string;
  blocks: LegalBlock[];
};

export type LegalDocumentContent = {
  title: string;
  description: string;
  sections: LegalSectionContent[];
};
