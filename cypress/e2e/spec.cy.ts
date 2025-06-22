/// <reference types="cypress" />

const socialMediaHrefs = [
  "https://www.linkedin.com/in/michael-budnick-79a40b60",
  "https://github.com/mdbudnick",
  "https://www.mike-budnick.com/MichaelBudnickResume.pdf",
];

const socialMediaImgs = [
  "img/linkedin.png",
  "img/github.png",
  "img/cv-download.png",
];

function indexTests(path) {
  it("index.html title", () => {
    cy.visit(path);
    cy.get("title").should("contain", "Michael Budnick");
  });

  it("container structure", () => {
    cy.visit(path);
    cy.get(".container").should("exist");
    cy.get(".container .left-panel").should("exist");
    cy.get(".container .right-panel").should("exist");
  });

  it("social media links", () => {
    cy.visit(path);
    cy.get(".left-panel .third-party-sm a").each(($el, i) => {
      cy.wrap($el).should("have.attr", "href", socialMediaHrefs[i]);
      cy.wrap($el).should("have.attr", "target", "_blank");
      cy.wrap($el).find("img").should("have.attr", "src", socialMediaImgs[i]);
    });
  });

  it("avatar", () => {
    cy.visit(path);
    cy.get(".left-panel .avatar").should("exist");
    const avatarImg = cy.get(".left-panel .avatar");
    avatarImg.should("have.attr", "src", "img/avatar-headshot.jpg");
  });

  it("right panel content", () => {
    cy.visit(path);
    cy.get(".right-panel h1#name").should("contain", "Michael Budnick");
    cy.get(".right-panel .middle").should("exist");
  });

  it("chat button container", () => {
    cy.visit(path);
    cy.get(".right-panel #chat-button-container").should("exist");
  });
}

describe("root points to index.html", () => {
  it("has the same index.html page", () => {
    cy.visit("/");
  });
  indexTests("/");
});

// Same as root test above
describe("index.html", () => {
  it("has an index.html page", () => {
    cy.visit("index.html");
  });

  indexTests("index.html");
});

describe("404.html", () => {
  it("has an 404.html page", () => {
    cy.visit("404.html");
  });

  it("404.html container and structure", () => {
    cy.visit("404.html");
    cy.get(".container").should("exist");
    cy.get(".left-panel").should("exist");
  });

  it("404.html social media links", () => {
    cy.visit("404.html");
    cy.get(".left-panel .third-party-sm a").each(($el, i) => {
      cy.wrap($el).should("have.attr", "href", socialMediaHrefs[i]);
      cy.wrap($el).should("have.attr", "target", "_blank");
      cy.wrap($el).find("img").should("have.attr", "src", socialMediaImgs[i]);
    });
  });

  describe("MichaelBudnickResume.pdf", () => {
    it("serves MichaelBudnickResume.pdf", () => {
      cy.request("MichaelBudnickResume.pdf");
    });
  });
});

describe("darkmode", () => {
  it("has darkmode button", () => {
    cy.visit("index.html");
    cy.get("body").should("have.class", "white-background");
    cy.get(".third-party-sm .light-dark").click();
    cy.get("body").should("not.have.class", "white-background");
    cy.get(".third-party-sm .light-dark").click();
    cy.get("body").should("have.class", "white-background");
  });
});
