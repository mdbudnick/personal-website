describe('index.html', () => {
  it('has an index.html page', () => {
    cy.visit('http://localhost:3000/index.html')
  })
})

describe('404.html', () => {
  it('has an 404.html page', () => {
    cy.visit('http://localhost:3000/404.html')
  })
})

describe('blog.html', () => {
  it('has a blog.html page', () => {
    cy.visit('http://localhost:3000/blog.html')
  })
})

describe('projects.html', () => {
  it('has an projects.html page', () => {
    cy.visit('http://localhost:3000/projects.html')
  })
})

describe('certifications.html', () => {
  it('has an certifications.html page', () => {
    cy.visit('http://localhost:3000/certifications.html')
  })
})