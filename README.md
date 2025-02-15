# Tayttopaikka server

Node.js server application which serves the Täyttopaikka UI.

## Tech

This project uses Node.js and Fastify. MariaDB is used as the database and Redis stores refresh tokens. For email related things, Sendgrid is used.

## Local development with Linux (Ubuntu based distros)

### Database

Start the database and refresh token session store

```
podman-compose up --build
```

or

```
sudo docker-compose up
```

Before you run the application, you must populate some tables in the database.
Tables `compressor` and `storage_cylinder` require at least one valid row before
the frontend works propelly. You can use e.g. [DBeaver](https://dbeaver.io/)
for the database manipulation.

To access normal fillment page, set `is_user` to `1`.

To access Happihäkki view, set `is_blender` to `1`.

To access admin pages, set `is_admin` to `1`.

Other roles are not currently used.

### Application

Backend uses [Dotenv](https://github.com/motdotla/dotenv) to manage environmental variables. Copy the env variables from `.env.example` to `.env` and make required adjustments (if needed)

```
cp .env.example .env
```

Run the application in local environment

```
npm install
npm run start-dev
```

## Database

[Knex](https://knexjs.org/) is used to for accessing the MariaDB database. Knex also handles running migrations, which are located in `src/database/migrations` folder.

Migrations are ran automatically when the service starts.

To create a new migration, run the following command in the project root folder.

```
npx knex migrate:make MIGRATION_NAME_HERE
```

### Test database

When running the tests, a test database named `test_db` is created. It will run all the available migrations and it will also import test data relevant to the tests from `src/test_data` folder.

To create a test data, create a new folder with a relevant name to the `test_data` folder and populate it with table csvs. The file must have exactly same name as the table that it is targeting.
The `tableNameHere.csv` MUST USE ; as the delimiter between the columns!

When new tables are added, they must be added to the `TABLE_READ_ORDER` constant!

### Connecting to the production database

Authorized developers can connect to the production database by following the steps below.

Login to Fly and then open a proxy connection to `tayttopaikka-db`

```bash
fly proxy <PORT_NUMBER_OF_YOUR_CHOICE> -a tayttopaikka-db
```

Then take your favourite database tool and connect to `127.0.0.1:<PORT_NUMBER_OF_YOUR_CHOICE>` with
the production credentials.

**Please use common sense when connecting to the production database**

## Deployment

When something is pushed to the `main` branch, it is automatically deployed
to production servers. See `fly-deploy.yml` for the deployment pipeline
and `fly.toml` for the container configuration.

The application is deployed as a container, which has been defined in
`Dockerfile`

The `fly.toml` for the MariaDB instance can be found from `infra/mariadb` folder. It is not deployed automatically. You need to run `fly deploy` if changes to the configuration are made. **Please make a database backup before doing any changes to the MariaDB instance.**

Redis is handled by Upstash. See the [documentation](https://fly.io/docs/reference/redis/) for extra info

## Contributing

Fork the application and do your thing. Make sure that you run the `enforce-style` script and fix possible errors before opening a PR. Also write
relevant tests for the feature or bug and make sure the existing tests pass
by running the `test` script.

Contact @Akzuu or @ilesoft if you need assistance.
