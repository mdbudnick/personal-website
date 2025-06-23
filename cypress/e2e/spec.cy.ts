/// <reference types="cypress" />

const menuItemHrefs = ["index.html", "projects.html", "certifications.html"];

const menuItemContents = ["about", "projects", "certifications"];

const socialMediaHrefs = [
  "https://www.linkedin.com/in/michael-budnick-79a40b60",
  "https://github.com/mdbudnick",
  "https://www.mike-budnick.com/MichaelBudnickResume.pdf",
];

const socialMediaImgs = [
  "img/linkedin.png",
  "img/github.png",
  "img/cv-download.png",
  "img/light-dark.png",
];

const middlePointContents = [
  "Full Stack Product Developer",
  "Cloud-Native & DevOps Expert",
  "UI/UX & API Integrator",
  "End-to-End Solution Builder",
];

const mediaItems = ["Reading", "Listening", "Watching"];

const mediaLinks = [
  // eslint-disable-next-line max-len
  "https://www.abebooks.com/9780593357774/Diet-Small-Planet-Revised-Updated-0593357779/plp",
  // eslint-disable-next-line max-len
  "https://open.spotify.com/show/5jojerqfKxYXc5POfxC1o9?si=a1059cba459f469d&nd=1&dlsi=a543505099704c19",
  // eslint-disable-next-line max-len
  "https://skillbuilder.aws/exam-prep/sysops-administrator-associate",
];

const mediaTitles = [
  "Diet for a Small Planet",
  "Battle Cry of Freedom: The Civil War Era",
  "AWS Certified SysOps Administrator Course",
];

const mediaAuthors = [
  "Frances Moore Lappé",
  "James McPherson",
  "AWS Training and Certification",
];

function indexTests(path) {
  it("index.html title", () => {
    cy.visit(path);
    cy.get("title").should("contain", "Michael Budnick");
  });

  it("menu", () => {
    cy.visit(path);
    cy.get(".left-panel");
    cy.get(".left-panel .item").each(($el, i) => {
      cy.wrap($el).should("have.attr", "href", menuItemHrefs[i]);
      cy.wrap($el).should("have.text", menuItemContents[i]);
    });

    cy.get(".left-panel .menu .third-party-sm a").each(($el, i) => {
      cy.wrap($el).should("have.attr", "href", socialMediaHrefs[i]);
      cy.wrap($el).should("have.attr", "target", "_blank");
      cy.wrap($el).find("img").should("have.attr", "src", socialMediaImgs[i]);
    });
  });

  it("middle", () => {
    cy.visit(path);
    cy.get(".middle .about-me .name").should("contain", "Michael Budnick");

    cy.get(".middle .points .point").each(($el, i) => {
      cy.wrap($el).should("have.text", middlePointContents[i]);
    });

    cy.get(".middle .bio").each(($el) => {
      cy.wrap($el).should(
        "contain",
        "Hello! My name is Michael Budnick. I am a Senior Software Developer " +
          "specializing in full stack and product development"
      );
      cy.wrap($el).should(
        "contain",
        "Personally, I live in New York City and thrive on life's adventures!"
      );
    });
  });

  it("avatar", () => {
    cy.visit(path);
    cy.get(".left-panel .avatar");
  });

  it("media-items", () => {
    cy.visit(path);
    cy.get(".current-media .media-item").each(($el, i) => {
      cy.wrap($el)
        .find("h2")
        .should("have.text", "Currently " + mediaItems[i]);
      const $mediaATag = $el.children("a");
      cy.wrap($mediaATag).should("have.attr", "href", mediaLinks[i]);
      cy.wrap($mediaATag).find("h3").should("contain", mediaTitles[i]);
      cy.wrap($mediaATag).find("h3").should("contain", mediaAuthors[i]);
    });
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
    cy.get(".left-panel");
    cy.get(".left-panel .item").each(($el, i) => {
      expect($el.attr("href")).equals(menuItemHrefs[i]);
      expect($el.text()).equals(menuItemContents[i]);
    });

    cy.get(".left-panel .menu .third-party-sm a").each(($el, i) => {
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
    cy.get(".left-panel .avatar");
  });

  it("blog.html blog", () => {
    cy.visit("blog.html");
    cy.get(".blog");
    cy.get(".blog .wordcloud");
    cy.get(".blog .posts");
  });
});
*/

const projectNames = [
  "Website Personal Chatbot",
  "PiHole Kubernetes Ansible Configuration",
  "High-Availability Home K8s Cluster",
  "Breathbox App",
  "Breathbox Website",
  "This Website!",
  "Kuychi Khipu Game",
  "Breathbox CSS",
];

const projectHrefs = [
  "https://github.com/mdbudnick/personal-website/blob/main/www/js/chat.js",
  "https://github.com/mdbudnick/open-ai-lambda",
  "https://github.com/mdbudnick/pihole-k8s-ansible",
  "https://github.com/mdbudnick/pihole-k8s-ansible",
  "https://mdbudnick.github.io/home-k8s/",
  "https://mdbudnick.github.io/home-k8s/",
  "https://github.com/mdbudnick/home-k8s/",
  "https://www.breathbox.net/",
  "https://play.google.com/store/apps/details?id=com.michaelbudnick.breathbox",
  "https://github.com/mdbudnick/bb-react-native/",
  "https://www.breathbox.net/",
  "https://www.breathbox.net/",
  "https://github.com/mdbudnick/breathbox/",
  "#",
  "https://github.com/mdbudnick/personal-website/",
  // eslint-disable-next-line max-len
  "https://github.com/mdbudnick/personal-website/blob/main/.github/workflows/prod_test_and_sync.yml",
  "https://github.com/mdbudnick/khipugame",
  "https://mdbudnick.github.io/khipugame/",
  "https://github.com/mdbudnick/khipugame",
  "https://mdbudnick.github.io/img-breathbox/",
  "https://mdbudnick.github.io/img-breathbox/",
  "https://github.com/mdbudnick/img-breathbox/",
];

describe("projects.html", () => {
  it("has an projects.html page", () => {
    cy.visit("projects.html");
  });

  it("projects.html menu", () => {
    cy.visit("projects.html");
    cy.get(".left-panel");
    cy.get(".left-panel .item").each(($el, i) => {
      cy.wrap($el).should("have.attr", "href", menuItemHrefs[i]);
      cy.wrap($el).should("have.text", menuItemContents[i]);
    });

    cy.get(".left-panel .menu .third-party-sm a").each(($el, i) => {
      cy.wrap($el).should("have.attr", "href", socialMediaHrefs[i]);
      cy.wrap($el).should("have.attr", "target", "_blank");
      cy.wrap($el).find("img").should("have.attr", "src", socialMediaImgs[i]);
    });
  });

  it("projects.html middle", () => {
    cy.visit("projects.html");
    cy.get(".middle h2").contains("Projects");
    cy.get(".middle .title").contains("Projects");
  });

  it("projects.html avatar", () => {
    cy.visit("projects.html");
    cy.get(".left-panel .avatar");
  });

  it("projects.html titles", () => {
    cy.visit("projects.html");
    cy.get(".projects .project .project-blurb .project-title").each(
      ($el, i) => {
        cy.wrap($el).should("have.text", projectNames[i]);
      }
    );
  });

  it("projects.html links", () => {
    cy.visit("projects.html");
    cy.get(".projects .project .project-blurb a").each(($el, i) => {
      cy.wrap($el).should("have.attr", "href", projectHrefs[i]);
    });
  });
});

const certBadges = [
  "img/aws-cloud-practitioner-badge.png",
  "img/cka-badge.png",
  "img/ckad-badge.png",
  "img/cks-badge.png",
  "img/tf-badge.png",
  "img/aws-developer-badge.png",
];

const certTitles = [
  "AWS Certified Cloud Practitioner",
  "CKA: Certified Kubernetes Administrator",
  "CKAD: Certified Kubernetes Application Developer",
  "CKS: Certified Kubernetes Security Specialist",
  "HashiCorp Certified: Terraform Associate (003)",
  "AWS Certified Developer Associate",
];

const certCredlyLinks = [
  "https://www.credly.com/badges/595b50eb-6538-4c75-bb56-b164b4d108a2",
  "https://www.credly.com/badges/be49e46f-e2a4-48cd-aa0d-095076b29e0f",
  "https://www.credly.com/badges/92e639c1-500e-400a-9a2e-cea433e3348d",
  "https://www.credly.com/badges/9bd50578-bd01-4060-8895-1f3ef62cf62c",
  "https://www.credly.com/badges/cef85466-bd22-4619-aa91-f3b9b74ac28c",
  "https://www.credly.com/badges/ef695cda-e5dd-470f-b0d3-4010f41f21d3",
];

describe("certifications.html", () => {
  it("has an certifications.html page", () => {
    cy.visit("certifications.html");
  });

  it("certifications.html menu", () => {
    cy.visit("certifications.html");
    cy.get(".left-panel");
    cy.get(".left-panel .menu .item").each(($el, i) => {
      cy.wrap($el).should("have.attr", "href", menuItemHrefs[i]);
      cy.wrap($el).should("have.text", menuItemContents[i]);
    });

    cy.get(".left-panel .menu .third-party-sm a").each(($el, i) => {
      cy.wrap($el).should("have.attr", "href", socialMediaHrefs[i]);
      cy.wrap($el).should("have.attr", "target", "_blank");
      cy.wrap($el).find("img").should("have.attr", "src", socialMediaImgs[i]);
    });
  });

  it("certifications.html middle", () => {
    cy.visit("certifications.html");
    cy.get(".middle h2").contains("Certifications");
    cy.get(".middle .title").contains("Certifications");
  });

  it("certifications.html avatar", () => {
    cy.visit("certifications.html");
    cy.get(".left-panel .avatar");
  });

  it("certifications.html certs (.cert)", () => {
    cy.visit("certifications.html");
    cy.get(".cert .badge").each(($el, i) => {
      cy.wrap($el).should("have.attr", "src", certBadges[i]);
    });

    cy.get(".cert .about").each(($el, i) => {
      cy.wrap($el).children("h2").should("have.text", certTitles[i]);
      cy.wrap($el)
        .children("a")
        .should("have.attr", "href", certCredlyLinks[i]);
      cy.wrap($el).children("a").should("have.attr", "target", "_blank");
      cy.wrap($el).children("a").should("have.text", "Credly");
    });
  });
});

describe("404.html", () => {
  it("has an 404.html page", () => {
    cy.visit("404.html");
  });

  it("404.html menu", () => {
    cy.visit("404.html");
    cy.get(".left-panel");
    cy.get(".left-panel .menu .item").each(($el, i) => {
      cy.wrap($el).should("have.attr", "href", menuItemHrefs[i]);
      cy.wrap($el).should("have.text", menuItemContents[i]);
    });

    cy.get(".left-panel .menu .third-party-sm a").each(($el, i) => {
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
    cy.get(".light-dark").click();
    cy.get("body").should("not.have.class", "white-background");
    cy.get(".light-dark").click();
    cy.get("body").should("have.class", "white-background");
  });
});
