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

/*
describe("blog.html", () => {
  it("has a blog.html page", () => {
    cy.visit("blog.html");
  });

  it("blog.html container structure", () => {
    cy.visit("blog.html");
    cy.get(".container").should("exist");
    cy.get(".container .left-panel").should("exist");
    cy.get(".container .right-panel").should("exist");
  });

  it("blog.html social media links", () => {
    cy.visit("blog.html");
    cy.get(".left-panel .third-party-sm a").each(($el, i) => {
      cy.wrap($el).should("have.attr", "href", socialMediaHrefs[i]);
      cy.wrap($el).should("have.attr", "target", "_blank");
      cy.wrap($el).find("img").should("have.attr", "src", socialMediaImgs[i]);
    });
  });

  it("blog.html avatar", () => {
    cy.visit("blog.html");
    cy.get(".left-panel .avatar").should("exist");
  });

  it("blog.html content", () => {
    cy.visit("blog.html");
    cy.get(".right-panel h1").should("exist");
    cy.get(".right-panel .middle").should("exist");
  });
  
  it("blog.html chat button", () => {
    cy.visit("blog.html");
    cy.get(".right-panel #chat-button-container").should("exist");
  });
});
*/

// Project pages should be checked for general structure
// but detailed content checks are removed as structure has changed

describe("projects.html", () => {
  it("has an projects.html page", () => {
    cy.visit("projects.html");
  });

  it("projects.html container structure", () => {
    cy.visit("projects.html");
    cy.get(".container").should("exist");
    cy.get(".container .left-panel").should("exist");
    cy.get(".container .right-panel").should("exist");
  });

  it("projects.html social media links", () => {
    cy.visit("projects.html");
    cy.get(".left-panel .third-party-sm a").each(($el, i) => {
      cy.wrap($el).should("have.attr", "href", socialMediaHrefs[i]);
      cy.wrap($el).should("have.attr", "target", "_blank");
      cy.wrap($el).find("img").should("have.attr", "src", socialMediaImgs[i]);
    });
  });

  it("projects.html avatar", () => {
    cy.visit("projects.html");
    cy.get(".left-panel .avatar").should("exist");
  });

  it("projects.html content structure", () => {
    cy.visit("projects.html");
    cy.get(".right-panel").should("exist");
    cy.get(".right-panel #chat-button-container").should("exist");
  });

  it("projects.html project list", () => {
    cy.visit("projects.html");
    // Check that project list exists with content
    cy.get(".right-panel ul li a").should("have.length.at.least", 1);
  });
});

// Certification page now has a simpler structure
// Detailed badge and link checks removed as the structure has changed

describe("certifications.html", () => {
  it("has an certifications.html page", () => {
    cy.visit("certifications.html");
  });

  it("certifications.html container structure", () => {
    cy.visit("certifications.html");
    cy.get(".container").should("exist");
    cy.get(".container .left-panel").should("exist");
    cy.get(".container .right-panel").should("exist");
  });

  it("certifications.html social media links", () => {
    cy.visit("certifications.html");
    cy.get(".left-panel .third-party-sm a").each(($el, i) => {
      cy.wrap($el).should("have.attr", "href", socialMediaHrefs[i]);
      cy.wrap($el).should("have.attr", "target", "_blank");
      cy.wrap($el).find("img").should("have.attr", "src", socialMediaImgs[i]);
    });
  });

  it("certifications.html avatar", () => {
    cy.visit("certifications.html");
    cy.get(".left-panel .avatar").should("exist");
  });

  it("certifications.html content structure", () => {
    cy.visit("certifications.html");
    cy.get(".right-panel").should("exist");
    cy.get(".right-panel h1").should("exist");
    cy.get(".right-panel #chat-button-container").should("exist");
  });

  it("certifications.html list", () => {
    cy.visit("certifications.html");
    // Check that certification list exists with content
    cy.get(".right-panel ul li a").should("have.length.at.least", 1);
  });
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
