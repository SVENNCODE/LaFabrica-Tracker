function assertTestDatabase() {
  let name = process.env.DB_NAME || "";
  if (process.env.DATABASE_URL) {
    try {
      name = decodeURIComponent(
        new URL(process.env.DATABASE_URL).pathname.slice(1),
      );
    } catch {
      name = "";
    }
  }
  if (!/_test$/.test(name)) {
    console.error(
      'Refusing to run: the database name must end in "_test" because these tests delete all players.',
    );
    process.exit(1);
  }
}

module.exports = { assertTestDatabase };
