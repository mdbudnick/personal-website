/// <reference types="cypress" />
import { testProjectPageStructure } from "./helpers/common";

describe("Read and Scroll Project Page", () => {
  const path = "projects/read-and-scroll.html";
  const title = "Read and Scroll";

  it("has correct title", () => {
    cy.visit(path);
    cy.get("title").should("contain", "Michael Budnick Projects");
  });

  testProjectPageStructure(path, title);

  // Specific tests for this project page
  it("has correct project links", () => {
    cy.visit(path);

    // Check Chrome Extension link
    cy.get(".project-blurb")
      .contains("Chrome Extension")
      .should("have.attr", "href")
      .and("include", "chromewebstore.google.com");

    cy.get(".project-blurb").contains("h3", "Chrome Extension").should("exist");

    // Check Repository link
    cy.get(".project-blurb")
      .contains("Repository")
      .should("have.attr", "href")
      .and("include", "github.com/mdbudnick/read-and-scroll");

    cy.get(".project-blurb").contains("h3", "Repository").should("exist");
  });

  it("has project image", () => {
    cy.visit(path);
    cy.get(".project img")
      .should("exist")
      .and("have.attr", "src", "../img/rs-banner.png")
      .and("have.attr", "alt", "Read and Scroll");
  });
});
