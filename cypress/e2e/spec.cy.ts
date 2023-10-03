const menuItemHrefs = ["index.html", "projects.html", "certifications.html",];

const menuItemContents = ["about", "projects", "certifications"];

const socialMediaHrefs = [
  "https://www.linkedin.com/in/michael-budnick-79a40b60",
  "https://github.com/mdbudnick",
  "https://budnick-resume.s3.amazonaws.com/MichaelBudnickResume.pdf",
];

const socialMediaImgs = [
  "img/linkedin.png",
  "img/github.png",
  "img/cv-download.png",
];

const middlePointContents = [
  "Software Developer",
  "DevOps Enthusiast",
  "Cybersecurity Champion",
  "Scaling Fanatic",
];

function indexTests(path) {
  it("index.html title", () => {
    cy.visit(path);
    cy.get("title").contains("Michael Budnick");
  });

  it("/ menu", () => {
    cy.visit(path);
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

  it("/ middle", () => {
    cy.visit(path);
    cy.get(".middle .about-me .name").contains("Michael Budnick");

    cy.get(".middle .points .point").each(($el, i) => {
      expect($el.text()).equals(middlePointContents[i]);
    });

    cy.get(".middle .bio").each(($el) => {
      expect($el.text()).contains(
        "Professionally, I am an experienced Senior Software Developer"
      );
      expect($el.text()).contains(
        "Personally, I live in New York City and thrive on life's adventures!"
      );
    });
  });

  it("/ avatar", () => {
    cy.visit(path);
    cy.get(".top-row .avatar");
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

  it("blog.html menu", () => {
    cy.visit("blog.html");
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
    cy.visit("blog.html");
    cy.get(".middle h2").contains("Personal Blog");
    cy.get(".middle .title").contains("Personal Blog");
  });

  it("blog.html avatar", () => {
    cy.visit("blog.html");
    cy.get(".top-row .avatar");
  });

  it("blog.html blog", () => {
    cy.visit("blog.html");
    cy.get(".blog");
    cy.get(".blog .wordcloud");
    cy.get(".blog .posts");
  });
});
*/
const projectHrefs = ["#", "https://www.breathbox.net"];

const projectNames = ["This Website!", "Breathbox"];

describe("projects.html", () => {
  it("has an projects.html page", () => {
    cy.visit("projects.html");
  });

  it("projects.html menu", () => {
    cy.visit("projects.html");
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
    cy.visit("projects.html");
    cy.get(".middle h2").contains("Projects");
    cy.get(".middle .title").contains("Projects");
  });

  it("projects.html avatar", () => {
    cy.visit("projects.html");
    cy.get(".top-row .avatar");
  });

  it("projects.html projects", () => {
    cy.visit("projects.html");
    cy.get(".projects .project .project-blurb .project-title").each(
      ($el, i) => {
        expect($el.attr("href")).equals(projectHrefs[i]);
        expect($el.children("h2").text()).equals(projectNames[i]);
      }
    );
  });
});

const certBadges = [
  "img/cka-badge.png",
  "img/ckad-badge.png",
  "img/cks-badge.png",
];

const certTitles = [
  "CKA: Certified Kubernetes Administrator",
  "CKAD: Certified Kubernetes Application Developer",
  "CKS: Certified Kubernetes Security Specialist",
];

const certCredlyLinks = [
  "https://www.credly.com/badges/be49e46f-e2a4-48cd-aa0d-095076b29e0f",
  "https://www.credly.com/badges/92e639c1-500e-400a-9a2e-cea433e3348d",
  "https://www.credly.com/badges/9bd50578-bd01-4060-8895-1f3ef62cf62c",
];

describe("certifications.html", () => {
  it("has an certifications.html page", () => {
    cy.visit("certifications.html");
  });

  it("certifications.html menu", () => {
    cy.visit("certifications.html");
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
    cy.visit("certifications.html");
    cy.get(".middle h2").contains("Certifications");
    cy.get(".middle .title").contains("Certifications");
  });

  it("certifications.html avatar", () => {
    cy.visit("certifications.html");
    cy.get(".top-row .avatar");
  });

  it("certifications.html certs (.cert)", () => {
    cy.visit("certifications.html");
    cy.get(".cert .badge").each(($el, i) => {
      expect($el.attr("src")).equals(certBadges[i]);
    });

    cy.get(".cert .about").each(($el, i) => {
      expect($el.children("h2").text()).equals(certTitles[i]);
      expect($el.children("a").attr("href")).equals(certCredlyLinks[i]);
      expect($el.children("a").attr("target")).equals("_blank");
      expect($el.children("a").text()).equals("Credly");
    });
  });
});

describe("404.html", () => {
  it("has an 404.html page", () => {
    cy.visit("404.html");
  });

  it("404.html menu", () => {
    cy.visit("404.html");
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
