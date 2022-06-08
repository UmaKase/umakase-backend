

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
