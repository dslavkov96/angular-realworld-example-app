/// <reference types ='cypress'/>

const { Token } = require("@angular/compiler")

describe('Test with backend', () => {

    beforeEach('login to the app', () => {
        //cy.intercept('GET', '**/tags', {fixture: 'tags.json'})
        cy.intercept({ method: 'GET', path: 'tags' }, { fixture: 'tags.json' })
        cy.loginToApplication()
    })

    const moment = require('moment');
    let Title = 'Title' + moment().format("hhmmss");

    it('verify correct request response', () => {

        cy.intercept('POST', 'https://api.realworld.io/api/articles/').as('postArticle')
        cy.contains('New Article').click()
        cy.get('[formcontrolname="title"]').type(Title)
        cy.get('[formcontrolname="description"]').type('This is a Description')
        cy.get('[formcontrolname="body"]').type('This is a body')
        cy.contains('Publish Article').click()

        cy.wait('@postArticle').then(xhr => {
            console.log(xhr)
            expect(xhr.response.statusCode).to.equal(201)
            expect(xhr.request.body.article.body).to.equal('This is a body')
            expect(xhr.response.body.article.description).to.equal('This is a Description')
        })
    })

    it('intercepting and modifying the request and response', () => {

        // cy.intercept('POST', '**/articles/', (req) => {
        //     req.body.article.description = 'This is a Description 2'
        // }).as('postArticle')

        cy.intercept('POST', '**/articles/', (req) => {
            req.reply(res => {
                expect(res.body.article.description).to.equal('This is a Description')
                res.body.article.description = 'This is a Description 2'
            })
        }).as('postArticle')

        cy.contains('New Article').click()
        cy.get('[formcontrolname="title"]').type(Title + '2')
        cy.get('[formcontrolname="description"]').type('This is a Description')
        cy.get('[formcontrolname="body"]').type('This is a body')
        cy.contains('Publish Article').click()

        cy.wait('@postArticle').then(xhr => {
            console.log(xhr)
            expect(xhr.response.statusCode).to.equal(201)
            expect(xhr.request.body.article.body).to.equal('This is a body')
            expect(xhr.response.body.article.description).to.equal('This is a Description 2')
        })
    })

    it('verify popular tags are displayed', () => {

        cy.log('we logged in')
        cy.get('.tag-list')
            .should('contain', 'automation')
            .and('contain', 'test')
            .and('contain', 'cypress')
    })

    it('verify global feed likes', () => {

        //cy.intercept('GET', 'https://api.realworld.io/api/articles/feed*', {"articles":[],"articlesCount":0})
        cy.intercept('GET', 'https://api.realworld.io/api/articles*', { fixture: 'articles.json' })
        cy.contains(' Global Feed ').click()
        cy.get('app-article-list button').then(heartList => {
            expect(heartList[0]).to.contain('1')
            expect(heartList[1]).to.contain('5')
        })

        cy.fixture('articles.json').then(file => {
            const articleLink = file.articles[1].slug
            file.articles[1].favoritesCount = 6
            cy.intercept('POST', 'https://api.realworld.io/api/articles/' + articleLink + '/favorite', file)
        })

        cy.get('app-article-list button').eq(1).click().should('contain', '6')
    })

    it.only('login and create article and delete', () => {

        // const userLogin = { "user": { "email": "artem.bondar16@gmail.com", "password": "CypressTest1" } }

        const bodyArticle = {
            "article": {
              "title": "Title 1",
              "description": "Description 1",
              "body": "body 1",
              "tagList": []
            }
          }

        // cy.request('POST', 'https://api.realworld.io/api/users/login', userLogin)
        //     .its('body').then(body => {
        //         const authToken = body.user.token
        cy.get('@token').then(authToken => {

                cy.request({
                    method: 'POST',
                    url: Cypress.env('apiUrl')+'/api/articles/',
                    headers: { 'Authorization': 'Token ' + authToken},
                    body: bodyArticle
                }).then(response => {
                    expect(response.status).to.equal(201)
                })

                cy.contains(' Global Feed ').click()
                cy.wait(3000)
                cy.get('app-article-list').first().click()
                cy.get('.article-actions').contains(' Delete Article ').click()
    
                cy.request({
                    url: Cypress.env('apiUrl')+'/api/articles?limit=10&offset=0',
                    method: 'GET',
                    headers: {'Authorization': 'Token ' + authToken}
                })
                .its('body').then(body => {
                    expect(body.articles[0].title).not.to.equal('Title 1')
                })

            })
    })
})