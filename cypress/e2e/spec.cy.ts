const topRowHrefs = [
  "index.html",
  "certifications.html",
  "blog.html",
  "projects.html",
];

const topRowContents = [
  "about",
  "certifications",
  "blog",
  "projects",
];

describe("index.html", () => {
  it("has an index.html page", () => {
    cy.visit("http://localhost:3000/index.html");
  });

  it("index.html title", () => {
    cy.visit("http://localhost:3000/index.html");
    cy.get("title").contains("Michael Budnick");
  });

  it("index.html title", () => {
    cy.visit("http://localhost:3000/index.html");
    cy.get("title").contains("Michael Budnick");
  });

  it("index.html top-row", () => {
    cy.visit("http://localhost:3000/index.html");
    cy.get(".top-row");
    cy.get(".top-row .item").each(($el, i) => {
      expect($el.attr("href")).equals(topRowHrefs[i]);
      expect($el.text()).equals(topRowContents[i]);
    });
  });
});

describe("blog.html", () => {
  it("has a blog.html page", () => {
    cy.visit("http://localhost:3000/blog.html");
  });

  it("blog.html top-row", () => {
    cy.visit("http://localhost:3000/blog.html");
    cy.get(".top-row");
    cy.get(".top-row .item").each(($el, i) => {
      expect($el.attr("href")).equals(topRowHrefs[i]);
      expect($el.text()).equals(topRowContents[i]);
    });
  });
});

describe("projects.html", () => {
  it("has an projects.html page", () => {
    cy.visit("http://localhost:3000/projects.html");
  });

  it("projects.html top-row", () => {
    cy.visit("http://localhost:3000/projects.html");
    cy.get(".top-row");
    cy.get(".top-row .item").each(($el, i) => {
      expect($el.attr("href")).equals(topRowHrefs[i]);
      expect($el.text()).equals(topRowContents[i]);
    });
  });
});

describe("certifications.html", () => {
  it("has an certifications.html page", () => {
    cy.visit("http://localhost:3000/certifications.html");
  });

  it("certifications.html top-row", () => {
    cy.visit("http://localhost:3000/certifications.html");
    cy.get(".top-row");
    cy.get(".top-row .item").each(($el, i) => {
      expect($el.attr("href")).equals(topRowHrefs[i]);
      expect($el.text()).equals(topRowContents[i]);
    });
  });
});

describe("404.html", () => {
  it("has an 404.html page", () => {
    cy.visit("http://localhost:3000/404.html");
  });
  
});
