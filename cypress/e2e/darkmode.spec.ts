/// <reference types="cypress" />

describe("Darkmode Toggle", () => {
  it("toggles darkmode across pages", () => {
    // Test on index page
    cy.visit("index.html");
    cy.get("body").should("have.class", "white-background");
    cy.get(".third-party-sm .light-dark").click();
    cy.get("body").should("not.have.class", "white-background");
    cy.get(".third-party-sm .light-dark").click();
    cy.get("body").should("have.class", "white-background");

    // Test on a project page
    cy.visit("projects/chatbot.html");
    cy.get("body").should("have.class", "white-background");
    cy.get(".third-party-sm .light-dark").click();
    cy.get("body").should("not.have.class", "white-background");
    cy.get(".third-party-sm .light-dark").click();
    cy.get("body").should("have.class", "white-background");
  });
});
