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

## Project team

- Akseli Kolari
- Ilmari Marttila
- Henri Kiiski
- Jaakko Kääriäinen
- Kimi Porthan
- Aurora Kaaja
