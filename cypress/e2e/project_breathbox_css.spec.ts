/// <reference types="cypress" />
import { testProjectPageStructure } from "./helpers/common";

describe("Breathbox CSS Project Page", () => {
  const path = "projects/breathbox-css.html";
  const title = "Breathbox CSS";

  it("has correct page title", () => {
    cy.visit(path);
    cy.get("title").should("contain", "Michael Budnick Projects");
  });

  // Run common page structure tests
  testProjectPageStructure(path, title);

  // Specific tests for this project page
  it("has website and repository links", () => {
    cy.visit(path);
    // Check for the website link
    cy.contains("Website")
      .should("have.attr", "href")
      .and("include", "mdbudnick.github.io/img-breathbox");

    // Check for the repo link
    cy.contains("Github Repository")
      .should("have.attr", "href")
      .and("include", "github.com/mdbudnick/img-breathbox");
  });

  it("has project image", () => {
    cy.visit(path);
    cy.get(".project img")
      .should("have.attr", "src", "../img/flo-cropped.jpg")
      .and("have.attr", "alt", "Breathbox CSS Screenshot");
  });
});
