# Tayttopaikka server

Node.js server application which serves the Tayttopaikka UI.

## Tech

This project uses Node.js and Fastify. MariaDB is used as the database and Redis handles the user auth tokens. For email related things, Sendgrid is used.

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

If you want to see the "Happihäkki"-view, manipulate `access_role_list` table.
The roles are given by matching the phone number to the user which is bit icky.
The idea behind the table was to have a simple and quick way to give
the club members access to Happihäkki since we already have their phone numbers
for opening the door. But this leads to possible exploits if you know someone
who has access but hasn't registered to the service yet.
At least admin privileges will be changed to use something else in the future.

Anyways, to access the view, give yourself `blender` or `admin` privileges and you will see the view. Other roles are not currently used.

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

## Deployment

When something is pushed to the `main` branch, it is automatically deployed
to production servers. See `fly-deploy.yml` for the deployment pipeline
and `fly.toml` for the container configuration.

The application is deployed as a container, which has been defined in
`Dockerfile`

The `fly.toml` for the MariaDB instance can be found from `infra/mariadb` folder. Redis is handled by Upstash. See the [documentation](https://fly.io/docs/reference/redis/) for extra info

## Contributing

Fork the application and do your thing. Make sure that you run the `enforce-style` script and fix possible errors before opening a PR. Also write
relevant tests for the feature or bug and make sure the existing tests pass
by running the `test` script.

Contact @Akzuu or @ilesoft if you need assistance.
