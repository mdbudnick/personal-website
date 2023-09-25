const menuItemHrefs = [
  "index.html",
  "certifications.html",
  "blog.html",
  "projects.html",
];

const menuItemContents = [
  "about",
  "certifications",
  "blog",
  "projects",
];

const socialMediaHrefs = [
  "https://www.linkedin.com/in/michael-budnick-79a40b60",
  "https://github.com/mdbudnick",
  "https://twitter.com/metaphoricmage"
];

const socialMediaImgs = [
  "img/linkedin.png",
  "img/github.png",
  "img/twitter-x.png"
];

const middlePointContents = [
  "Software Developer",
  "DevOps Enthusiast",
  "Cybersecurity Champion",
  "Scaling Addict",
];

describe("index.html", () => {
  it("has an index.html page", () => {
    cy.visit("http://localhost:3000/index.html");
  });

  it("index.html title", () => {
    cy.visit("http://localhost:3000/index.html");
    cy.get("title").contains("Michael Budnick");
  });

  it("index.html menu", () => {
    cy.visit("http://localhost:3000/index.html");
    cy.get(".top-row");
    cy.get(".top-row .item").each(($el, i) => {
      expect($el.attr("href")).equals(menuItemHrefs[i]);
      expect($el.text()).equals(menuItemContents[i]);
    });

    cy.get(".top-row .menu .third-party-sm a").each(($el, i) => {
      expect($el.attr("href")).equals(socialMediaHrefs[i]);
      expect($el.attr("target")).equals("_blank");
      expect($el.children("img").attr("src")).equals(socialMediaImgs[i]);
    });
  });

  it("index.html middle", () => {
    cy.visit("http://localhost:3000/index.html");
    cy.get(".middle .about-me .name").contains("Michael Budnick");

    cy.get(".middle .points .point").each(($el, i) => {
      expect($el.text()).equals(middlePointContents[i]);
    });

    cy.get(".middle .bio").each(($el, i) => {
      expect($el.text()).contains("Experienced Senior Software Developer");
    });
  });

  it("index.html avatar", () => {
    cy.visit("http://localhost:3000/index.html");
    cy.get(".top-row .avatar")
  });
});

describe("blog.html", () => {
  it("has a blog.html page", () => {
    cy.visit("http://localhost:3000/blog.html");
  });

  it("blog.html menu", () => {
    cy.visit("http://localhost:3000/blog.html");
    cy.get(".top-row");
    cy.get(".top-row .item").each(($el, i) => {
      expect($el.attr("href")).equals(menuItemHrefs[i]);
      expect($el.text()).equals(menuItemContents[i]);
    });

    cy.get(".top-row .menu .third-party-sm a").each(($el, i) => {
      expect($el.attr("href")).equals(socialMediaHrefs[i]);
      expect($el.attr("target")).equals("_blank");
      expect($el.children("img").attr("src")).equals(socialMediaImgs[i]);
    });
  });

  it("blog.html middle", () => {
    cy.visit("http://localhost:3000/blog.html");
    cy.get(".middle h2").contains("Personal Blog")
    cy.get(".middle .title").contains("Personal Blog")
  });

  it("blog.html avatar", () => {
    cy.visit("http://localhost:3000/blog.html");
    cy.get(".top-row .avatar")
  });

  it("blog.html blog", () => {
    cy.visit("http://localhost:3000/blog.html");
    cy.get(".blog")
    cy.get(".blog .wordcloud")
    cy.get(".blog .posts")
  });
});

describe("projects.html", () => {
  it("has an projects.html page", () => {
    cy.visit("http://localhost:3000/projects.html");
  });

  it("projects.html menu", () => {
    cy.visit("http://localhost:3000/projects.html");
    cy.get(".top-row");
    cy.get(".top-row .item").each(($el, i) => {
      expect($el.attr("href")).equals(menuItemHrefs[i]);
      expect($el.text()).equals(menuItemContents[i]);
    });

    cy.get(".top-row .menu .third-party-sm a").each(($el, i) => {
      expect($el.attr("href")).equals(socialMediaHrefs[i]);
      expect($el.attr("target")).equals("_blank");
      expect($el.children("img").attr("src")).equals(socialMediaImgs[i]);
    });
  });

  it("projects.html middle", () => {
    cy.visit("http://localhost:3000/projects.html");
    cy.get(".middle h2").contains("Projects")
    cy.get(".middle .title").contains("Projects")
  });

  it("projects.html avatar", () => {
    cy.visit("http://localhost:3000/projects.html");
    cy.get(".top-row .avatar")
  });
});

describe("certifications.html", () => {
  it("has an certifications.html page", () => {
    cy.visit("http://localhost:3000/certifications.html");
  });

  it("certifications.html menu", () => {
    cy.visit("http://localhost:3000/certifications.html");
    cy.get(".top-row");
    cy.get(".top-row .menu .item").each(($el, i) => {
      expect($el.attr("href")).equals(menuItemHrefs[i]);
      expect($el.text()).equals(menuItemContents[i]);
    });

    cy.get(".top-row .menu .third-party-sm a").each(($el, i) => {
      expect($el.attr("href")).equals(socialMediaHrefs[i]);
      expect($el.attr("target")).equals("_blank");
      expect($el.children("img").attr("src")).equals(socialMediaImgs[i]);
    });
  });

  it("certifications.html middle", () => {
    cy.visit("http://localhost:3000/certifications.html");
    cy.get(".middle h2").contains("Certifications")
    cy.get(".middle .title").contains("Certifications")
  });

  it("certifications.html avatar", () => {
    cy.visit("http://localhost:3000/certifications.html");
    cy.get(".top-row .avatar")
  });
});

describe("404.html", () => {
  it("has an 404.html page", () => {
    cy.visit("http://localhost:3000/404.html");
  });

  it("404.html menu", () => {
    cy.visit("http://localhost:3000/404.html");
    cy.get(".top-row");
    cy.get(".top-row .menu .item").each(($el, i) => {
      expect($el.attr("href")).equals(menuItemHrefs[i]);
      expect($el.text()).equals(menuItemContents[i]);
    });

    cy.get(".top-row .menu .third-party-sm a").each(($el, i) => {
      expect($el.attr("href")).equals(socialMediaHrefs[i]);
      expect($el.attr("target")).equals("_blank");
      expect($el.children("img").attr("src")).equals(socialMediaImgs[i]);
    });
  });
});
