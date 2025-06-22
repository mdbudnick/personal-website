/// <reference types="cypress" />
import { testProjectPageStructure } from "./helpers/common";

describe("Website Personal Chatbot Project Page", () => {
  const path = "projects/chatbot.html";
  const title = "Website Personal Chatbot";

  it("has correct page title", () => {
    cy.visit(path);
    cy.get("title").should("contain", "Michael Budnick Projects");
  });

  // Run common page structure tests
  testProjectPageStructure(path, title);

  // Specific tests for this project page
  it("has repository links", () => {
    cy.visit(path);
    cy.contains("Front-end Repository").should("exist");
    cy.contains("Back-end Repository").should("exist");

    // Check href attributes
    cy.contains("Front-end Repository")
      .should("have.attr", "href")
      .and("include", "github.com/mdbudnick/personal-website");

    cy.contains("Back-end Repository")
      .should("have.attr", "href")
      .and("include", "github.com/mdbudnick/open-ai-lambda");
  });

  it("has project image", () => {
    cy.visit(path);
    cy.get(".project img")
      .should("have.attr", "src", "../img/chatbot.png")
      .and("have.attr", "alt", "Chatbot Project");
  });
});
