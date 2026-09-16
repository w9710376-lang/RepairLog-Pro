const fs = require('fs');
let detailCode = fs.readFileSync('src/pages/JobDetail.tsx', 'utf-8');

detailCode = detailCode.replace(
  `  const removePart = async (index: number) => {
    if (!job || !id) return;
    const updatedParts = job.partsUsed.filter((_, i) => i !== index);
    await handleUpdate('partsUsed', updatedParts);
  };`,
  `  const removePart = async (index: number) => {
    if (!job || !id) return;
    const updatedParts = (job.partsUsed || []).filter((_, i) => i !== index);
    await handleUpdate('partsUsed', updatedParts);
  };`
);

fs.writeFileSync('src/pages/JobDetail.tsx', detailCode);
