# Blenderi-Backend

## Local development with Linux (Ubuntu based distros)

Start the database and refresh token session store

```
sudo docker-compose up
```

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
