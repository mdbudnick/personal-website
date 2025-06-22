/// <reference types="cypress" />
import { testProjectPageStructure } from "./helpers/common";

describe("Personal Website Project Page", () => {
  const path = "projects/personal-website.html";
  const title = "This Website!";

  it("has correct page title", () => {
    cy.visit(path);
    cy.get("title").should("contain", "Michael Budnick Projects");
  });

  // Run common page structure tests
  testProjectPageStructure(path, title);

  // Specific tests for this project page
  it("has repository link", () => {
    cy.visit(path);
    // Check for the repo link
    cy.contains("Repository")
      .should("have.attr", "href")
      .and("include", "github.com/mdbudnick/personal-website");
  });

  it("has project image", () => {
    cy.visit(path);
    cy.get(".project img")
      .should("have.attr", "src", "../img/website-screen.png")
      .and("have.attr", "alt", "Personal Website Screenshot");
  });

  it("has workflow link in description", () => {
    cy.visit(path);
    cy.get(".project-summary a")
      .should("have.attr", "href")
      .and(
        "include",
        "github.com/mdbudnick/personal-website/blob/main/.github/workflows"
      );
  });
});
