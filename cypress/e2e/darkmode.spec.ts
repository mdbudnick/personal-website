/// <reference types="cypress" />

describe("Darkmode Toggle", () => {
  it("toggles darkmode across pages", () => {
    // Test on index page
    cy.visit("index.html");
    cy.get("body").should("not.have.class", "dark-mode");
    cy.get(".third-party-sm .light-dark").click();
    cy.get("body").should("have.class", "dark-mode");
    cy.get(".third-party-sm .light-dark").click();
    cy.get("body").should("not.have.class", "dark-mode");

    // Test on a project page
    cy.visit("projects/chatbot.html");
    cy.get("body").should("not.have.class", "dark-mode");
    cy.get(".third-party-sm .light-dark").click();
    cy.get("body").should("have.class", "dark-mode");
    cy.get(".third-party-sm .light-dark").click();
    cy.get("body").should("not.have.class", "dark-mode");
  });
});
