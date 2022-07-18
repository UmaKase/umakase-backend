

##  Set up server
- Clone Repo
- `cd` into repo folder.
- `cd` into server folder.
- run `npm install` or `yarn` ( base on what nodejs package manager you use).
- change .env.example to .env and change its databse connection url.
- don't forget grant the mysql user permissions
  `GRANT CREATE, ALTER, DROP, INSERT, UPDATE, DELETE, SELECT, REFERENCES, RELOAD on *.* TO 'username'@'hostname' WITH GRANT OPTION;`
- run `npx prisma db push` to create database and tables from schema.prisma file.

### 2. Start Server

- run `npm run build` or `yarn build` to build javascript files.
- run `npm run start` or `yarn start` to start server.

### 3. Seed The Database

- run `yarn seed`
- *note you must have your files compiled through `yarn build` or `yarn watch` first*


### Current folder structure:
```toml
├── []  prisma                             # Prisma Things
│   ├── []  migrations                     # Migrations
│   ├── []  schema.prisma                  #
│   └── []  seed                           # contain json data for seeding
├── []  src
│   ├── []  config                         # Config/globall constant
│   ├── []  database                       # File do thing with database only ( like seeding )
│   ├── []  middleware                     # Express middleware
│   ├── []  routes                         # Express Route
│   ├── []  server.ts                      
│   ├── []  types                          # All Types goes here (except prisma generated type )
│   └── []  utils                          # Utilities
├── []  storage                            # Logs, Assests
│   ├── []  foods                          # Default Foods images
│   └── []  logs                           # Logs
├── []  package.json
├── []  tsconfig.json
├── []  README.md
├── []  .env
└── []  yarn.lock
```