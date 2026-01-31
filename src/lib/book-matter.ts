import {
  FrontMatter,
  BackMatter,
  Chapter,
  RenderableSection,
} from "./types";

export function createDefaultFrontMatter(
  title: string,
  author: string
): FrontMatter {
  const year = new Date().getFullYear();
  return {
    titlePage: {
      kind: "title-page",
      enabled: true,
      content: "", // derived from title + author at render time
    },
    copyrightPage: {
      kind: "copyright-page",
      enabled: true,
      content: `Copyright \u00A9 ${year} ${author || "Author Name"}\n\nAll rights reserved. No part of this publication may be reproduced, distributed, or transmitted in any form or by any means without the prior written permission of the publisher.\n\nPublished by ${author || "Author Name"}\n\nFirst Edition`,
    },
    dedication: {
      kind: "dedication",
      enabled: false,
      content: "For everyone who believed in this book.",
    },
  };
}

export function createDefaultBackMatter(author: string): BackMatter {
  return {
    aboutAuthor: {
      kind: "about-author",
      enabled: false,
      content: `${author || "The author"} is a writer and storyteller. Learn more at yourwebsite.com.`,
    },
    alsoBy: {
      kind: "also-by",
      enabled: false,
      content: "Title of Another Book\nTitle of Yet Another Book",
    },
    acknowledgments: {
      kind: "acknowledgments",
      enabled: false,
      content:
        "I would like to thank everyone who helped make this book possible.",
    },
  };
}

export function assembleRenderableSections(
  frontMatter: FrontMatter,
  chapters: Chapter[],
  backMatter: BackMatter,
  title: string,
  author: string
): RenderableSection[] {
  const sections: RenderableSection[] = [];

  // Front matter — no page numbers
  if (frontMatter.titlePage.enabled) {
    sections.push({
      id: "fm-title-page",
      kind: "title-page",
      title: title || "Untitled",
      content: author,
      showPageNumber: false,
    });
  }

  if (frontMatter.copyrightPage.enabled) {
    sections.push({
      id: "fm-copyright-page",
      kind: "copyright-page",
      title: "Copyright",
      content: frontMatter.copyrightPage.content,
      showPageNumber: false,
    });
  }

  if (frontMatter.dedication.enabled) {
    sections.push({
      id: "fm-dedication",
      kind: "dedication",
      title: "Dedication",
      content: frontMatter.dedication.content,
      showPageNumber: false,
    });
  }

  // Body chapters — with page numbers
  for (const ch of chapters) {
    sections.push({
      id: ch.id,
      kind: "chapter",
      title: ch.title,
      content: ch.content,
      showPageNumber: true,
    });
  }

  // Back matter — with page numbers
  if (backMatter.aboutAuthor.enabled) {
    sections.push({
      id: "bm-about-author",
      kind: "about-author",
      title: "About the Author",
      content: backMatter.aboutAuthor.content,
      showPageNumber: true,
    });
  }

  if (backMatter.alsoBy.enabled) {
    sections.push({
      id: "bm-also-by",
      kind: "also-by",
      title: `Also by ${author || "the Author"}`,
      content: backMatter.alsoBy.content,
      showPageNumber: true,
    });
  }

  if (backMatter.acknowledgments.enabled) {
    sections.push({
      id: "bm-acknowledgments",
      kind: "acknowledgments",
      title: "Acknowledgments",
      content: backMatter.acknowledgments.content,
      showPageNumber: true,
    });
  }

  return sections;
}
