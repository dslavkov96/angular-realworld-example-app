import { defineConfig } from "cypress";

export default defineConfig({
  viewportHeight: 1080,
  viewportWidth: 1920,
  env: {
    username: 'artem.bondar0@gmail.com',
    password: 'CypressTest1',
    apiUrl: 'https://api.realworld.io'
  },
  e2e: {
    baseUrl: 'http://localhost:4200',
    specPattern: 'cypress/e2e/**/*.{js,jsx,ts,tsx}',
    excludeSpecPattern: ['**/1-getting-started/*', '**/2-advanced-examples/*'],
    setupNodeEvents(on, config) {
      // implement node event listeners here
      const username = process.env.DB_USERNAME
      const password = process.env.PASSWORD 

      if(!password){
        throw new Error (`missing password environment variable`)
      }

      config.env = {username, password}
      return config

    },
  },
});
