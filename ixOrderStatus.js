// fixOrderStatus.js
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.order.updateMany({
    where: { status: null },
    data: { status: "pending" }
  });
  console.log("Orders atualizadas:", result.count);
  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});