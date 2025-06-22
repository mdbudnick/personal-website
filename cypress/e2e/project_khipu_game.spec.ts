/// <reference types="cypress" />
import { testProjectPageStructure } from "./helpers/common";

describe("Khipu Game Project Page", () => {
  const path = "projects/khipu-game.html";
  const title = "Kuychi Khipu Game";

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
    cy.contains("Live Website")
      .should("have.attr", "href")
      .and("include", "mdbudnick.github.io/khipugame");

    // Check for the repo link
    cy.contains("Repository")
      .should("have.attr", "href")
      .and("include", "github.com/mdbudnick/khipugame");
  });

  it("has project image", () => {
    cy.visit(path);
    cy.get(".project img")
      .should("have.attr", "src", "../img/khipu-game.png")
      .and("have.attr", "alt", "Khipu Game");
  });
});
