/// <reference types="cypress" />
import { testProjectPageStructure } from "./helpers/common";

describe("PiHole Project Page", () => {
  const path = "projects/pihole.html";
  const title = "PiHole Kubernetes Ansible Configuration";

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
      .and("include", "github.com/mdbudnick/pihole-k8s-ansible");
  });

  it("has project image", () => {
    cy.visit(path);
    cy.get(".project img")
      .should("have.attr", "src", "../img/pihole.png")
      .and("have.attr", "alt", "PiHole Screenshot");
  });
});
