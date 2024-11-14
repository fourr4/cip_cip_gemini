import "server-only";
import postgres from "postgres"; // Import the Postgres client

// Create the PostgreSQL client connection
let client = postgres(`${process.env.POSTGRES_URL!}`);

// Seed function for inserting packages into the database
async function seedPackages() {
  try {
    // Insert default packages into the SubscriptionPackage table
    await client`
      INSERT INTO "subscriptionPackage" ("name", "price", "duration")
      VALUES
        ('Pro', 999.99, 'monthly'),
        ('Pro', 9999.99, 'yearly')
    `;

    console.log("Packages seeded successfully!");
  } catch (error) {
    console.error("Error seeding packages:", error);
  }
}

// Run the seed function
seedPackages();
