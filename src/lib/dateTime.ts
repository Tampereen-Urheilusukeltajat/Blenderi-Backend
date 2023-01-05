/**
 * MariaDB DateTime
 */
type DateTime = string;

export const convertDateToMariaDBDateTime = (date: Date): DateTime =>
  `${date.getUTCFullYear()}-${date.getUTCMonth()}-${date.getUTCDay()} ${date.getUTCHours()}:${date.getUTCMinutes()}:${date.getUTCSeconds()}`;
