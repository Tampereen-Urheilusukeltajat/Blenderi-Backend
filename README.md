# Blenderi-Backend

## Local development with Linux (Ubuntu based distros)

Start the database

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

## Project team

- Akseli Kolari
- Ilmari Marttila
- Henri Kiiski
- Jaakko Kääriäinen
- Kimi Porthan
- Aurora Kaaja
