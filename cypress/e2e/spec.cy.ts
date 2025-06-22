/// <reference types="cypress" />
import { testPageStructure } from "./helpers/common";

describe("Root and Index Tests", () => {
  it("root points to index.html", () => {
    cy.visit("/");
    cy.get("title").should("contain", "Michael Budnick");
  });

  it("index.html is accessible", () => {
    cy.visit("index.html");
    cy.get("title").should("contain", "Michael Budnick");
  });

  describe("Index page structure", () => {
    const path = "index.html";

    // Run common page structure tests
    testPageStructure(path);

    it("has Michael Budnick as the name", () => {
      cy.visit(path);
      cy.get(".right-panel h1#name").should("contain", "Michael Budnick");
    });

    it("has projects list", () => {
      cy.visit(path);
      cy.get(".right-panel ul li a").should("have.length.at.least", 1);
    });
  });
});

describe("404.html", () => {
  const path = "404.html";

  it("has a 404.html page with correct title", () => {
    cy.visit(path);
    cy.get("title").should("contain", "Page Not Found!");
  });

  // Run common page structure tests
  testPageStructure(path);

  it("has 404 error message", () => {
    cy.visit(path);
    cy.get(".right-panel h1#name").should("contain", "Page Not Found");
    cy.get(".right-panel .four-oh-four").should("exist");
    cy.get(".right-panel .error-message").should("exist");
    cy.get(".right-panel .back-link").should("have.attr", "href", "index.html");
  });
});

describe("Check for required files", () => {
  it("serves MichaelBudnickResume.pdf", () => {
    cy.request("MichaelBudnickResume.pdf");
  });
});

// Darkmode tests moved to darkmode.spec.ts
