const fs = require('fs');

// Patch JobCreate.tsx
let createCode = fs.readFileSync('src/pages/JobCreate.tsx', 'utf-8');
createCode = createCode.replace(
  `const newJob: Omit<Job, 'id'> = {`,
  `const newJob: Omit<Job, 'id'> = {`
);
// Insert size check after newJob declaration
createCode = createCode.replace(
  `      const docRef = await addDoc(collection(db, 'jobs'), newJob);`,
  `      if (JSON.stringify(newJob).length > 900000) {
        alert("The total size of this job's data exceeds the 1MB limit. Please remove some photos or documents before saving.");
        setLoading(false);
        return;
      }
      const docRef = await addDoc(collection(db, 'jobs'), newJob);`
);
// Adjust file sizes
createCode = createCode.replace(/500 \* 1024/g, '250 * 1024');
createCode = createCode.replace(/500KB/g, '250KB');
fs.writeFileSync('src/pages/JobCreate.tsx', createCode);

// Patch JobDetail.tsx
let detailCode = fs.readFileSync('src/pages/JobDetail.tsx', 'utf-8');
detailCode = detailCode.replace(
  `  const handleUpdate = async (field: keyof Job, value: any) => {
    if (!job || !id || !profile) return;`,
  `  const handleUpdate = async (field: keyof Job, value: any) => {
    if (!job || !id || !profile) return;
    
    const tempJob = { ...job, [field]: value };
    if (JSON.stringify(tempJob).length > 900000) {
      alert("Adding this item would exceed the 1MB database limit. Please remove some existing photos or documents first.");
      throw new Error("Size limit exceeded");
    }`
);
detailCode = detailCode.replace(/500 \* 1024/g, '250 * 1024');
detailCode = detailCode.replace(/500KB/g, '250KB');

// Suppress console.error if it's the size error
detailCode = detailCode.replace(
  `console.error("Error updating job", error);`,
  `if (!(error?.message?.includes("too large") || error?.message?.includes("exceeds") || error?.message?.includes("Size limit exceeded"))) { console.error("Error updating job", error); }`
);
detailCode = detailCode.replace(
  `console.error("Error uploading document:", error);`,
  `if (!(error?.message?.includes("too large") || error?.message?.includes("exceeds") || error?.message?.includes("Size limit exceeded"))) { console.error("Error uploading document:", error); }`
);
detailCode = detailCode.replace(
  `console.error("Error compressing image:", error);`,
  `if (!(error?.message?.includes("too large") || error?.message?.includes("exceeds") || error?.message?.includes("Size limit exceeded"))) { console.error("Error compressing image:", error); }`
);

fs.writeFileSync('src/pages/JobDetail.tsx', detailCode);

// Patch JobEdit.tsx
let editCode = fs.readFileSync('src/pages/JobEdit.tsx', 'utf-8');
editCode = editCode.replace(
  `      const docRef = doc(db, 'jobs', id);
      await updateDoc(docRef, {`,
  `      const tempUpdate = {
        title,
        description,
        customerName,
        customerEmail,
        customerPhone,
        address,
        status,
        scheduledDate: scheduledDate || null,
        priority,
        photos,
        attachments,
        updatedAt: Date.now()
      };
      
      const tempJob = { ...job, ...tempUpdate };
      if (JSON.stringify(tempJob).length > 900000) {
        alert("The total size of this job's data exceeds the 1MB limit. Please remove some photos or documents before saving.");
        setLoading(false);
        return;
      }

      const docRef = doc(db, 'jobs', id);
      await updateDoc(docRef, tempUpdate);`
);
// Remove old update call if there is a syntax issue by just replacing exactly. Wait, updateDoc takes an object inline. Let's do a more precise replacement.
