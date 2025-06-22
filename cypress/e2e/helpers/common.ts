/// <reference types="cypress" />

export const socialMediaHrefs = [
  "https://www.linkedin.com/in/michaeldbudnick/",
  "https://github.com/mdbudnick",
  "https://www.mike-budnick.com/MichaelBudnickResume.pdf",
];

export const socialMediaImgs = [
  "img/linkedin.png",
  "img/github.png",
  "img/cv-download.png",
];

// Relative paths from projects directory
export const projectSocialMediaImgs = [
  "../img/linkedin.png",
  "../img/github.png",
  "../img/cv-download.png",
];

/**
 * Common tests for page structure
 * @param path - The page path to test
 */
export function testPageStructure(path: string) {
  it("has correct container structure", () => {
    cy.visit(path);
    cy.get(".container").should("exist");
    cy.get(".container .left-panel").should("exist");
    cy.get(".container .right-panel").should("exist");
  });

  it("has avatar in left panel", () => {
    cy.visit(path);
    cy.get(".left-panel .avatar").should("exist");
  });

  it("has social media links with correct hrefs", () => {
    cy.visit(path);
    const imgSrcs = path.includes("projects/")
      ? projectSocialMediaImgs
      : socialMediaImgs;

    cy.get(".left-panel .third-party-sm a").each(($el, i) => {
      cy.wrap($el).should("have.attr", "href", socialMediaHrefs[i]);
      cy.wrap($el).should("have.attr", "target", "_blank");
      cy.wrap($el).find("img").should("have.attr", "src", imgSrcs[i]);
    });
  });

  it("has light/dark mode toggle button", () => {
    cy.visit(path);
    cy.get(".third-party-sm .light-dark").should("exist");
  });

  it("has chat button container in right panel", () => {
    cy.visit(path);
    cy.get(".right-panel #chat-button-container").should("exist");
  });
}

/**
 * Common tests for project pages
 * @param path - The project page path to test
 * @param title - Expected project title
 */
export function testProjectPageStructure(path: string, title: string) {
  testPageStructure(path);

  it("has back link to homepage", () => {
    cy.visit(path);
    cy.get(".right-panel .back-link").should("exist");
    const backLink = cy.get(".right-panel .back-link");
    backLink.should("have.attr", "href", "../index.html");
    backLink.should("contain", "Back to Home");
  });

  it("has project content", () => {
    cy.visit(path);
    cy.get(".right-panel .project").should("exist");
    cy.get(".right-panel .project img").should("exist");
    cy.get(".right-panel .project .project-blurb").should("exist");
    cy.get(".right-panel .project .project-title").should("contain", title);
    cy.get(".right-panel .project .project-summary").should("exist");
  });
}
