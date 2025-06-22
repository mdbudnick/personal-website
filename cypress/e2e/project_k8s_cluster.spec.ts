/// <reference types="cypress" />
import { testProjectPageStructure } from "./helpers/common";

describe("K8s Cluster Project Page", () => {
  const path = "projects/k8s-cluster.html";
  const title = "High-Availability Home K8s Cluster";

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
    cy.contains("Project Website")
      .should("have.attr", "href")
      .and("include", "mdbudnick.github.io/home-k8s");

    // Check for the repo link
    cy.contains("Repository")
      .should("have.attr", "href")
      .and("include", "github.com/mdbudnick/home-k8s");
  });

  it("has project image", () => {
    cy.visit(path);
    cy.get(".project img")
      .should("have.attr", "src", "../img/cluster.jpg")
      .and("have.attr", "alt", "Kubernetes Cluster");
  });
});
