/// <reference types="cypress" />
import { testProjectPageStructure } from "./helpers/common";

describe("Breathbox App Project Page", () => {
  const path = "projects/breathbox-app.html";
  const title = "Breathbox App";

  it("has correct page title", () => {
    cy.visit(path);
    cy.get("title").should("contain", "Michael Budnick Projects");
  });

  // Run common page structure tests
  testProjectPageStructure(path, title);

  // Specific tests for this project page
  it("has repository and app links", () => {
    cy.visit(path);
    // Check for the Android App link
    cy.contains("Android App")
      .should("have.attr", "href")
      .and("include", "play.google.com");

    // Check for the repo link
    cy.contains("React-Native Repository")
      .should("have.attr", "href")
      .and("include", "github.com/mdbudnick/bb-react-native");
  });

  it("has project image", () => {
    cy.visit(path);
    cy.get(".project img")
      .should("have.attr", "src", "../img/buddha-gnome.jpg")
      .and("have.attr", "alt", "Breathbox App");
  });
});
