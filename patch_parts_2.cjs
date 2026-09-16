const fs = require('fs');
let detailCode = fs.readFileSync('src/pages/JobDetail.tsx', 'utf-8');

detailCode = detailCode.replace(
  `const totalCost = job.partsUsed.reduce((sum, part) => sum + (part.cost * part.quantity), 0);`,
  `const totalCost = (job.partsUsed || []).reduce((sum, part) => sum + (part.cost * part.quantity), 0);`
);

fs.writeFileSync('src/pages/JobDetail.tsx', detailCode);
